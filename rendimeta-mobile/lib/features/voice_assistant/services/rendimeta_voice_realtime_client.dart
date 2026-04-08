import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../../../core/config/openai_voice_config.dart';
import '../domain/rendimeta_assistant_snapshot.dart';
import '../domain/voice_assistant_models.dart';

enum RendimetaVoiceRealtimeEventType {
  status,
  transcriptSlot,
  transcriptPartial,
  transcriptFinal,
  localLevel,
  remoteLevel,
  error,
}

class RendimetaVoiceRealtimeEvent {
  const RendimetaVoiceRealtimeEvent({
    required this.type,
    this.status,
    this.itemId,
    this.role,
    this.text,
    this.level,
    this.message,
  });

  final RendimetaVoiceRealtimeEventType type;
  final RendimetaVoiceAssistantStatus? status;
  final String? itemId;
  final String? role;
  final String? text;
  final double? level;
  final String? message;
}

class RealtimeVoiceCallException implements Exception {
  const RealtimeVoiceCallException({
    required this.message,
    this.statusCode,
    this.rawBody,
    this.attemptedModel,
  });

  final String message;
  final int? statusCode;
  final String? rawBody;
  final String? attemptedModel;

  @override
  String toString() {
    final status = statusCode == null ? '' : ' [$statusCode]';
    return 'RealtimeVoiceCallException$status: $message';
  }
}

class RendimetaVoiceRealtimeClient {
  RendimetaVoiceRealtimeClient();

  final http.Client _httpClient = http.Client();
  final StreamController<RendimetaVoiceRealtimeEvent> _eventsController =
      StreamController<RendimetaVoiceRealtimeEvent>.broadcast();

  RTCPeerConnection? _peerConnection;
  RTCDataChannel? _dataChannel;
  MediaStream? _localStream;
  MediaStreamTrack? _localAudioTrack;
  MediaStreamTrack? _remoteAudioTrack;
  Timer? _statsTimer;
  bool _isDisposed = false;
  bool _rendererInitialized = false;
  bool _isMicRequestedEnabled = true;
  bool _isAssistantSpeaking = false;
  bool _speakerphoneRequested = true;
  bool _hasActiveUserSpeech = false;
  DateTime? _ignoreUserAudioUntil;
  double _lastLocalLevel = 0;
  double _lastRemoteLevel = 0;
  String? _activeUserItemId;
  final Set<String> _requestedResponseItemIds = <String>{};

  final RTCVideoRenderer remoteAudioRenderer = RTCVideoRenderer();

  Stream<RendimetaVoiceRealtimeEvent> get events => _eventsController.stream;

  Future<void> connect({required RendimetaAssistantSnapshot snapshot}) async {
    if (!OpenAiVoiceConfig.isConfigured) {
      throw StateError('Falta configurar OPENAI_API_KEY para voz realtime.');
    }

    _isDisposed = false;
    await _ensureRendererInitialized();
    await _cleanup();

    _emit(
      const RendimetaVoiceRealtimeEvent(
        type: RendimetaVoiceRealtimeEventType.status,
        status: RendimetaVoiceAssistantStatus.connecting,
      ),
    );

    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': {
        'echoCancellation': true,
        'noiseSuppression': true,
        'autoGainControl': true,
      },
      'video': false,
    });
    final localTracks =
        _localStream?.getAudioTracks() ?? const <MediaStreamTrack>[];
    if (localTracks.isNotEmpty) {
      _localAudioTrack = localTracks.first;
      await _applyMicState();
    }
    await _setSpeakerphoneEnabled(true, forceRetries: true);

    _peerConnection = await createPeerConnection({
      'sdpSemantics': 'unified-plan',
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
      ],
    });

    final stream = _localStream;
    if (stream != null) {
      for (final track in stream.getTracks()) {
        await _peerConnection!.addTrack(track, stream);
      }
    }

    _peerConnection!.onTrack = (event) {
      if (event.track.kind == 'audio') {
        _remoteAudioTrack = event.track;
        unawaited(_setSpeakerphoneEnabled(true, forceRetries: true));
      }
      if (_rendererInitialized && event.streams.isNotEmpty) {
        remoteAudioRenderer.srcObject = event.streams.first;
      }
    };

    _peerConnection!.onConnectionState = (state) {
      if (_isDisposed) return;
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        unawaited(_setSpeakerphoneEnabled(true, forceRetries: true));
      }

      if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.error,
            message: 'La conexión de voz se interrumpió.',
          ),
        );
      }
    };

    _dataChannel = await _peerConnection!.createDataChannel(
      'oai-events',
      RTCDataChannelInit()..ordered = true,
    );
    _dataChannel!.onMessage = (message) {
      _handleRealtimeMessage(message.text);
    };

    final offer = await _peerConnection!.createOffer({
      'offerToReceiveAudio': true,
      'offerToReceiveVideo': false,
    });
    await _peerConnection!.setLocalDescription(offer);
    await _waitForIceGatheringComplete();

    final localDescription = await _peerConnection!.getLocalDescription();
    final answer = await _createVoiceCall(
      sdp: localDescription?.sdp ?? offer.sdp ?? '',
      snapshot: snapshot,
    );

    await _peerConnection!.setRemoteDescription(
      RTCSessionDescription(answer, 'answer'),
    );
    await _setSpeakerphoneEnabled(true, forceRetries: true);

    _startStatsSampling();
  }

  Future<String> _createVoiceCall({
    required String sdp,
    required RendimetaAssistantSnapshot snapshot,
  }) async {
    final sessionPayload = jsonEncode({
      'type': 'realtime',
      'model': OpenAiVoiceConfig.realtimeModel,
      'instructions': _buildInstructions(snapshot),
      'output_modalities': ['audio'],
      'max_output_tokens': 320,
      'audio': {
        'input': {
          'transcription': {'model': OpenAiVoiceConfig.transcriptionModel},
          'turn_detection': {
            'type': 'server_vad',
            'create_response': false,
            'interrupt_response': false,
            'silence_duration_ms': 1200,
            'prefix_padding_ms': 500,
            'idle_timeout_ms': 12000,
          },
        },
        'output': {'voice': OpenAiVoiceConfig.voice},
      },
    });
    final candidateAttempts = <({String model, bool typedParts})>[
      (model: OpenAiVoiceConfig.realtimeModel, typedParts: false),
      (model: OpenAiVoiceConfig.realtimeModel, typedParts: true),
      (model: OpenAiVoiceConfig.fallbackRealtimeModel, typedParts: false),
      (model: OpenAiVoiceConfig.fallbackRealtimeModel, typedParts: true),
    ];
    final triedAttempts = <String>{};
    RealtimeVoiceCallException? lastError;

    for (final attempt in candidateAttempts) {
      final id = '${attempt.model}:${attempt.typedParts ? 'typed' : 'plain'}';
      if (!triedAttempts.add(id)) {
        continue;
      }

      try {
        return await _createVoiceCallAttempt(
          sdp: sdp,
          sessionPayload: sessionPayload.replaceFirst(
            OpenAiVoiceConfig.realtimeModel,
            attempt.model,
          ),
          model: attempt.model,
          typedParts: attempt.typedParts,
        );
      } on RealtimeVoiceCallException catch (error) {
        lastError = error;
        if (_shouldRetry(error, typedParts: attempt.typedParts)) {
          debugPrint(
            'OpenAI Realtime falló con modelo=${attempt.model} variante=${attempt.typedParts ? 'typed' : 'plain'}. Reintentando.',
          );
          continue;
        }
        rethrow;
      }
    }

    if (lastError != null) {
      throw lastError;
    }

    throw const RealtimeVoiceCallException(
      message: 'No fue posible iniciar la llamada de voz con OpenAI.',
    );
  }

  Future<String> _createVoiceCallAttempt({
    required String sdp,
    required String sessionPayload,
    required String model,
    required bool typedParts,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.openai.com/v1/realtime/calls'),
    );
    request.headers['Authorization'] = 'Bearer ${OpenAiVoiceConfig.apiKey}';
    if (typedParts) {
      request.files.add(
        http.MultipartFile.fromString(
          'sdp',
          sdp,
          contentType: MediaType('application', 'sdp'),
        ),
      );
      request.files.add(
        http.MultipartFile.fromString(
          'session',
          sessionPayload,
          contentType: MediaType('application', 'json'),
        ),
      );
    } else {
      request.fields['sdp'] = sdp;
      request.fields['session'] = sessionPayload;
    }

    http.StreamedResponse response;
    try {
      response = await _httpClient
          .send(request)
          .timeout(const Duration(seconds: 20));
    } on TimeoutException {
      throw RealtimeVoiceCallException(
        message: 'OpenAI tardó demasiado en iniciar la voz. Intenta otra vez.',
        attemptedModel: model,
      );
    } on SocketException {
      throw RealtimeVoiceCallException(
        message:
            'No se pudo conectar con OpenAI. Revisa tu conexión a internet.',
        attemptedModel: model,
      );
    } catch (error) {
      throw RealtimeVoiceCallException(
        message: 'No se pudo abrir la llamada realtime: $error',
        attemptedModel: model,
      );
    }

    final body = await response.stream.bytesToString();
    final answer = _extractSdpAnswer(body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = _extractRealtimeErrorMessage(body);
      debugPrint(
        'OpenAI Realtime create-call fallo (${response.statusCode}) modelo=$model variante=${typedParts ? 'typed' : 'plain'}: $message',
      );
      throw RealtimeVoiceCallException(
        message: message,
        statusCode: response.statusCode,
        rawBody: body,
        attemptedModel: model,
      );
    }

    if (answer == null) {
      throw RealtimeVoiceCallException(
        message:
            'OpenAI respondió, pero no devolvió un SDP válido para la llamada. Respuesta: ${_extractRealtimeErrorMessage(body)}',
        statusCode: response.statusCode,
        rawBody: body,
        attemptedModel: model,
      );
    }

    return answer;
  }

  bool _shouldRetry(
    RealtimeVoiceCallException error, {
    required bool typedParts,
  }) {
    final attemptedModel = error.attemptedModel;
    final fallbackModel = OpenAiVoiceConfig.fallbackRealtimeModel;
    final message = error.message.toLowerCase();
    final statusCode = error.statusCode;

    if (!typedParts &&
        (statusCode == null ||
            (statusCode >= 200 && statusCode < 300) ||
            statusCode == 400)) {
      return true;
    }

    if (attemptedModel == null || attemptedModel == fallbackModel) {
      return false;
    }

    if (statusCode == 400 || statusCode == 404) {
      return message.contains('model') ||
          message.contains('unsupported') ||
          message.contains('not found') ||
          message.contains('does not exist') ||
          message.contains('realtime');
    }

    return false;
  }

  String _extractRealtimeErrorMessage(String body) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) {
      return 'OpenAI no devolvió detalles del error al iniciar la voz.';
    }

    try {
      final decoded = jsonDecode(trimmed);
      if (decoded is Map<String, dynamic>) {
        final error = decoded['error'];
        if (error is Map<String, dynamic>) {
          final message = error['message']?.toString().trim();
          if (message != null && message.isNotEmpty) {
            return message;
          }
        }
        final message = decoded['message']?.toString().trim();
        if (message != null && message.isNotEmpty) {
          return message;
        }
      }
    } catch (_) {}

    if (trimmed.length <= 220) {
      return trimmed;
    }

    return '${trimmed.substring(0, 217)}...';
  }

  String? _extractSdpAnswer(String body) {
    if (body.startsWith('v=0')) {
      return body;
    }

    final trimmed = body.trim();
    if (trimmed.startsWith('v=0')) {
      return trimmed;
    }

    try {
      final decoded = jsonDecode(trimmed);
      if (decoded is Map<String, dynamic>) {
        final direct = decoded['sdp']?.toString();
        if (direct != null && direct.trim().startsWith('v=0')) {
          return direct;
        }

        final answer = decoded['answer'];
        if (answer is Map<String, dynamic>) {
          final nested = answer['sdp']?.toString();
          if (nested != null && nested.trim().startsWith('v=0')) {
            return nested;
          }
        }
      }
    } catch (_) {}

    return null;
  }

  String _buildInstructions(RendimetaAssistantSnapshot snapshot) {
    final sales = snapshot.profile.todaySales.entries
        .map((entry) => '${entry.key.label}: ${entry.value}')
        .join(', ');
    final missions = snapshot.profile.missions
        .map(
          (mission) =>
              '${mission.description} (${mission.current}/${mission.target})',
        )
        .join('; ');
    final ranking = snapshot.currentRankingEntry == null
        ? 'Posición no disponible'
        : 'Lugar ${snapshot.currentRankingEntry!.position} con ${snapshot.currentRankingEntry!.totalSales} ventas';
    final feedback = snapshot.feedbackMessage?.trim();
    final alert = snapshot.alertMessage?.trim();

    return '''
Eres RendiCoach, el coach de voz de Rendimeta para vendedoras y vendedores de la gasolinera Rendichicas.

Reglas obligatorias:
- Habla siempre en español mexicano natural.
- Responde con tono cercano, claro y útil.
- Mantén las respuestas muy cortas: máximo 1 o 2 frases.
- Si el usuario solo dice "hola", "hey" o "tengo una duda", responde con un saludo breve y pregunta en qué le ayudas. No des un resumen largo.
- Solo usa la información del contexto actual de la app. No inventes ventas, metas ni métricas.
- Si algo no está en el contexto, dilo claramente y ofrece ayuda con lo que sí aparece en la app.
- Puedes responder sobre metas, ventas de hoy, ranking, XP, racha, tickets pendientes y recomendaciones de venta.
- No menciones modelos, API keys ni configuraciones técnicas.
- Tu voz debe sonar cálida, natural y segura.

Contexto actual del vendedor:
- Nombre: ${snapshot.profile.name}
- Estación: ${snapshot.profile.station}
- Ventas de hoy: $sales
- Ventas totales hoy: ${snapshot.profile.todayTotalSales}
- XP actual: ${snapshot.profile.xp}
- Nivel: ${snapshot.profile.level.title}
- Racha: ${snapshot.profile.streak} días
- Ranking: $ranking
- Misiones del día: $missions
- Coach interno: ${snapshot.coachMessage}
${feedback == null || feedback.isEmpty ? '' : '- Feedback reciente: $feedback'}
${alert == null || alert.isEmpty ? '' : '- Alerta actual: $alert'}
''';
  }

  Future<void> setMicEnabled(bool enabled) async {
    _isMicRequestedEnabled = enabled;
    await _applyMicState();
  }

  Future<void> close() async {
    _emit(
      const RendimetaVoiceRealtimeEvent(
        type: RendimetaVoiceRealtimeEventType.status,
        status: RendimetaVoiceAssistantStatus.ending,
      ),
    );
    await _cleanup();
    if (!_eventsController.isClosed) {
      _emit(
        const RendimetaVoiceRealtimeEvent(
          type: RendimetaVoiceRealtimeEventType.status,
          status: RendimetaVoiceAssistantStatus.idle,
        ),
      );
    }
  }

  Future<void> dispose() async {
    _isDisposed = true;
    await _cleanup();
    if (_rendererInitialized) {
      await remoteAudioRenderer.dispose();
      _rendererInitialized = false;
    }
    _httpClient.close();
    await _eventsController.close();
  }

  Future<void> _cleanup() async {
    _statsTimer?.cancel();
    _statsTimer = null;

    try {
      await _dataChannel?.close();
    } catch (_) {}
    _dataChannel = null;

    try {
      await _peerConnection?.close();
    } catch (_) {}
    _peerConnection = null;

    final tracks = _localStream?.getTracks() ?? const <MediaStreamTrack>[];
    for (final track in tracks) {
      track.stop();
    }
    await _localStream?.dispose();
    _localStream = null;
    _localAudioTrack = null;
    _remoteAudioTrack = null;
    _isAssistantSpeaking = false;
    _isMicRequestedEnabled = true;
    _speakerphoneRequested = true;
    _hasActiveUserSpeech = false;
    _ignoreUserAudioUntil = null;
    _lastLocalLevel = 0;
    _lastRemoteLevel = 0;
    _activeUserItemId = null;
    _requestedResponseItemIds.clear();
    try {
      await Helper.setSpeakerphoneOn(false);
    } catch (_) {}
    if (_rendererInitialized) {
      remoteAudioRenderer.srcObject = null;
    }
  }

  Future<void> _ensureRendererInitialized() async {
    if (_rendererInitialized) return;
    await remoteAudioRenderer.initialize();
    _rendererInitialized = true;
  }

  Future<void> _waitForIceGatheringComplete() async {
    final connection = _peerConnection;
    if (connection == null) return;
    if (connection.iceGatheringState ==
        RTCIceGatheringState.RTCIceGatheringStateComplete) {
      return;
    }

    final completer = Completer<void>();
    void Function(RTCIceGatheringState state)? listener;
    listener = (state) {
      if (state == RTCIceGatheringState.RTCIceGatheringStateComplete &&
          !completer.isCompleted) {
        completer.complete();
      }
    };

    connection.onIceGatheringState = listener;
    await completer.future.timeout(
      const Duration(milliseconds: 1200),
      onTimeout: () {},
    );
  }

  void _handleRealtimeMessage(String rawMessage) {
    if (_isDisposed || rawMessage.isEmpty) return;

    dynamic decoded;
    try {
      decoded = jsonDecode(rawMessage);
    } catch (_) {
      return;
    }
    if (decoded is! Map<String, dynamic>) return;

    final type = decoded['type']?.toString() ?? '';
    switch (type) {
      case 'session.created':
      case 'session.updated':
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.listening,
          ),
        );
        break;
      case 'input_audio_buffer.speech_started':
        if (!_shouldAcceptUserAudio()) break;
        _hasActiveUserSpeech = true;
        _activeUserItemId = null;
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.listening,
          ),
        );
        break;
      case 'input_audio_buffer.speech_stopped':
        if (!_hasActiveUserSpeech || !_shouldAcceptUserAudio()) break;
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.processing,
          ),
        );
        break;
      case 'input_audio_buffer.committed':
        if (!_hasActiveUserSpeech || !_shouldAcceptUserAudio()) break;
        _activeUserItemId =
            decoded['item_id']?.toString() ??
            'user-${DateTime.now().microsecondsSinceEpoch}';
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.transcriptSlot,
            itemId: _activeUserItemId,
            role: 'user',
          ),
        );
        break;
      case 'response.output_audio.delta':
        _isAssistantSpeaking = true;
        unawaited(_applyMicState());
        unawaited(_setSpeakerphoneEnabled(true));
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.speaking,
          ),
        );
        break;
      case 'response.created':
        _isAssistantSpeaking = true;
        unawaited(_applyMicState());
        _clearServerAudioBuffer();
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.speaking,
          ),
        );
        break;
      case 'response.output_audio.done':
      case 'response.done':
        _finishAssistantTurn();
        break;
      case 'conversation.item.input_audio_transcription.delta':
        final itemId =
            decoded['item_id']?.toString() ??
            _activeUserItemId ??
            'user-${DateTime.now().microsecondsSinceEpoch}';
        if (!_shouldAcceptUserTranscript(itemId)) break;
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.transcriptPartial,
            itemId: itemId,
            role: 'user',
            text: decoded['delta']?.toString() ?? '',
          ),
        );
        break;
      case 'conversation.item.input_audio_transcription.completed':
        final userItemId =
            decoded['item_id']?.toString() ??
            _activeUserItemId ??
            'user-${DateTime.now().microsecondsSinceEpoch}';
        if (!_shouldAcceptUserTranscript(userItemId)) {
          _hasActiveUserSpeech = false;
          _activeUserItemId = null;
          break;
        }
        final transcript = decoded['transcript']?.toString() ?? '';
        if (transcript.trim().isEmpty) {
          _hasActiveUserSpeech = false;
          _activeUserItemId = null;
          break;
        }
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.transcriptFinal,
            itemId: userItemId,
            role: 'user',
            text: transcript,
          ),
        );
        _emit(
          const RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.status,
            status: RendimetaVoiceAssistantStatus.processing,
          ),
        );
        _hasActiveUserSpeech = false;
        _activeUserItemId = null;
        if (!_isAssistantSpeaking) {
          _requestAssistantResponse(userItemId);
        }
        break;
      case 'response.output_audio_transcript.delta':
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.transcriptPartial,
            itemId:
                decoded['item_id']?.toString() ??
                'assistant-${DateTime.now().microsecondsSinceEpoch}',
            role: 'assistant',
            text: decoded['delta']?.toString() ?? '',
          ),
        );
        break;
      case 'response.output_audio_transcript.done':
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.transcriptFinal,
            itemId:
                decoded['item_id']?.toString() ??
                'assistant-${DateTime.now().microsecondsSinceEpoch}',
            role: 'assistant',
            text: decoded['transcript']?.toString() ?? '',
          ),
        );
        break;
      case 'error':
        _emit(
          RendimetaVoiceRealtimeEvent(
            type: RendimetaVoiceRealtimeEventType.error,
            message:
                decoded['error']?['message']?.toString() ??
                'Ocurrió un error en la sesión de voz.',
          ),
        );
        break;
    }
  }

  void _startStatsSampling() {
    _statsTimer?.cancel();
    _statsTimer = Timer.periodic(const Duration(milliseconds: 80), (_) async {
      final connection = _peerConnection;
      if (connection == null || _isDisposed) return;

      try {
        if (_localAudioTrack != null) {
          final localStats = await connection.getStats(_localAudioTrack);
          _lastLocalLevel = _extractAudioLevel(localStats);
          _emit(
            RendimetaVoiceRealtimeEvent(
              type: RendimetaVoiceRealtimeEventType.localLevel,
              level: _lastLocalLevel,
            ),
          );
        }

        if (_remoteAudioTrack != null) {
          final remoteStats = await connection.getStats(_remoteAudioTrack);
          _lastRemoteLevel = _extractAudioLevel(remoteStats);
          _emit(
            RendimetaVoiceRealtimeEvent(
              type: RendimetaVoiceRealtimeEventType.remoteLevel,
              level: _lastRemoteLevel,
            ),
          );
        }
      } catch (_) {}
    });
  }

  double _extractAudioLevel(List<StatsReport> reports) {
    for (final report in reports) {
      final directLevel =
          _tryParseLevel(report.values['audioLevel']) ??
          _tryParseLevel(report.values['audio_level']) ??
          _tryParseLevel(report.values['level']);
      if (directLevel != null) {
        return directLevel.clamp(0.0, 1.0);
      }
    }

    for (final report in reports) {
      final energy = _tryParseLevel(report.values['totalAudioEnergy']);
      final duration = _tryParseLevel(report.values['totalSamplesDuration']);
      if (energy != null && duration != null && duration > 0) {
        return math.min(1, math.sqrt(energy / duration));
      }
    }

    return 0;
  }

  double? _tryParseLevel(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  void _emit(RendimetaVoiceRealtimeEvent event) {
    if (!_eventsController.isClosed) {
      _eventsController.add(event);
    }
  }

  Future<void> _applyMicState() async {
    final track = _localAudioTrack;
    if (track == null) return;
    track.enabled = _isMicRequestedEnabled && !_isAssistantSpeaking;
  }

  Future<void> _restoreMicAfterSpeech() async {
    await Future<void>.delayed(const Duration(milliseconds: 1000));
    if (_isDisposed) return;
    await _applyMicState();
  }

  void _finishAssistantTurn() {
    if (!_isAssistantSpeaking) return;
    _isAssistantSpeaking = false;
    _clearServerAudioBuffer();
    _ignoreUserAudioUntil = DateTime.now().add(
      const Duration(milliseconds: 1200),
    );
    unawaited(_restoreMicAfterSpeech());
    _emit(
      const RendimetaVoiceRealtimeEvent(
        type: RendimetaVoiceRealtimeEventType.status,
        status: RendimetaVoiceAssistantStatus.listening,
      ),
    );
  }

  void _clearServerAudioBuffer() {
    final channel = _dataChannel;
    if (channel == null) return;
    try {
      channel.send(
        RTCDataChannelMessage(jsonEncode({'type': 'input_audio_buffer.clear'})),
      );
    } catch (_) {}
  }

  void _requestAssistantResponse(String itemId) {
    final channel = _dataChannel;
    if (channel == null) return;
    if (_requestedResponseItemIds.contains(itemId)) return;

    _requestedResponseItemIds.add(itemId);
    try {
      channel.send(
        RTCDataChannelMessage(jsonEncode({'type': 'response.create'})),
      );
    } catch (_) {
      _requestedResponseItemIds.remove(itemId);
      _emit(
        const RendimetaVoiceRealtimeEvent(
          type: RendimetaVoiceRealtimeEventType.error,
          message: 'No pudimos pedir la respuesta del coach en esta sesión.',
        ),
      );
    }
  }

  bool _shouldIgnoreUserAudio() {
    if (_isAssistantSpeaking) {
      return true;
    }

    final ignoreUntil = _ignoreUserAudioUntil;
    if (ignoreUntil == null) {
      return false;
    }

    return DateTime.now().isBefore(ignoreUntil);
  }

  bool _shouldAcceptUserAudio() {
    if (_shouldIgnoreUserAudio()) {
      return false;
    }

    return !_isLikelyEchoInput();
  }

  bool _shouldAcceptUserTranscript(String itemId) {
    final ignoreUntil = _ignoreUserAudioUntil;
    if (ignoreUntil != null && DateTime.now().isBefore(ignoreUntil)) {
      return false;
    }

    if (_activeUserItemId != null && itemId == _activeUserItemId) {
      return true;
    }

    if (_hasActiveUserSpeech && !_isLikelyEchoInput()) {
      _activeUserItemId = itemId;
      return true;
    }

    return false;
  }

  bool _isLikelyEchoInput() {
    final remote = _lastRemoteLevel;
    final local = _lastLocalLevel;

    if (remote < 0.06) {
      return false;
    }

    return remote > (local * 1.35) && local < 0.18;
  }

  Future<void> _setSpeakerphoneEnabled(
    bool enabled, {
    bool forceRetries = false,
  }) async {
    _speakerphoneRequested = enabled;
    try {
      await Helper.setSpeakerphoneOn(enabled);
    } catch (_) {}

    if (!enabled || !forceRetries) return;

    for (final delay in const [250, 800, 1600]) {
      unawaited(
        Future<void>.delayed(Duration(milliseconds: delay), () async {
          if (_isDisposed || !_speakerphoneRequested) return;
          try {
            await Helper.setSpeakerphoneOn(true);
          } catch (_) {}
        }),
      );
    }
  }
}
