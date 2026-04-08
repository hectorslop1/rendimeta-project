import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../../core/config/openai_voice_config.dart';
import '../domain/rendimeta_assistant_snapshot.dart';
import '../domain/voice_assistant_models.dart';
import 'rendimeta_voice_realtime_client.dart';

class RendimetaVoiceAssistantController extends ChangeNotifier {
  RendimetaVoiceAssistantController({
    RendimetaVoiceRealtimeClient? realtimeClient,
  }) : _realtimeClient = realtimeClient ?? RendimetaVoiceRealtimeClient();

  final RendimetaVoiceRealtimeClient _realtimeClient;
  final List<VoiceAssistantMessage> _messages = [];

  StreamSubscription<RendimetaVoiceRealtimeEvent>? _eventsSubscription;
  RendimetaVoiceAssistantStatus _status = RendimetaVoiceAssistantStatus.idle;
  String? _errorMessage;
  bool _isDisposed = false;
  bool _isMicMuted = false;
  double _localLevel = 0;
  double _remoteLevel = 0;

  List<VoiceAssistantMessage> get messages => List.unmodifiable(_messages);
  RendimetaVoiceAssistantStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isMicMuted => _isMicMuted;
  bool get isConfigured => OpenAiVoiceConfig.isConfigured;
  RTCVideoRenderer get remoteAudioRenderer =>
      _realtimeClient.remoteAudioRenderer;

  double get orbAmplitude {
    return switch (_status) {
      RendimetaVoiceAssistantStatus.connecting => 0.14,
      RendimetaVoiceAssistantStatus.listening => _localLevel.clamp(0.18, 1.0),
      RendimetaVoiceAssistantStatus.processing => 0.34,
      RendimetaVoiceAssistantStatus.speaking => _remoteLevel.clamp(0.22, 1.0),
      RendimetaVoiceAssistantStatus.ending => 0.10,
      RendimetaVoiceAssistantStatus.error => 0.22,
      RendimetaVoiceAssistantStatus.idle => 0.12,
    };
  }

  String get visibleTranscript {
    if (_errorMessage != null && _errorMessage!.trim().isNotEmpty) {
      return _errorMessage!;
    }

    final latestContent = _messages.reversed
        .map((message) => message.content.trim())
        .firstWhere((content) => content.isNotEmpty, orElse: () => '');

    if (latestContent.isNotEmpty) {
      return latestContent;
    }

    return switch (_status) {
      RendimetaVoiceAssistantStatus.connecting =>
        'Preparando tu coach de voz...',
      RendimetaVoiceAssistantStatus.processing =>
        'Un momento, estoy revisando tus datos.',
      RendimetaVoiceAssistantStatus.speaking => 'Te estoy respondiendo.',
      RendimetaVoiceAssistantStatus.listening =>
        'Hola, aquí estoy. Dime tu duda.',
      RendimetaVoiceAssistantStatus.ending => 'Cerrando el modo voz.',
      RendimetaVoiceAssistantStatus.error =>
        'No pude entenderte bien. Intenta hablar otra vez.',
      RendimetaVoiceAssistantStatus.idle => 'Hola, aquí estoy. Dime tu duda.',
    };
  }

  Future<void> startSession(RendimetaAssistantSnapshot snapshot) async {
    _errorMessage = null;
    _isMicMuted = false;
    _localLevel = 0;
    _remoteLevel = 0;
    _messages.clear();
    _setStatus(RendimetaVoiceAssistantStatus.connecting);

    if (!OpenAiVoiceConfig.isConfigured) {
      _setStatus(RendimetaVoiceAssistantStatus.error);
      _errorMessage =
          'Falta la configuración de OpenAI para activar la voz realtime.';
      _safeNotifyListeners();
      return;
    }

    await _eventsSubscription?.cancel();
    _eventsSubscription = _realtimeClient.events.listen(_handleRealtimeEvent);

    try {
      await _realtimeClient.connect(snapshot: snapshot);
    } catch (error) {
      _setStatus(RendimetaVoiceAssistantStatus.error);
      _errorMessage = _friendlyError(error);
      _safeNotifyListeners();
    }
  }

  Future<void> toggleMic(RendimetaAssistantSnapshot snapshot) async {
    _isMicMuted = !_isMicMuted;
    await _realtimeClient.setMicEnabled(!_isMicMuted);
    _safeNotifyListeners();
  }

  Future<void> endSession() async {
    _setStatus(RendimetaVoiceAssistantStatus.ending);
    _safeNotifyListeners();
    await _realtimeClient.close();
    await _eventsSubscription?.cancel();
    _eventsSubscription = null;
    _setStatus(RendimetaVoiceAssistantStatus.idle);
    _safeNotifyListeners();
  }

  String _friendlyError(Object error) {
    if (error is RealtimeVoiceCallException) {
      if (error.statusCode == 401 || error.statusCode == 403) {
        return 'OpenAI rechazó la sesión de voz. Revisa la API key y los permisos del proyecto.';
      }
      if (error.statusCode == 429) {
        return 'OpenAI está recibiendo muchas solicitudes. Intenta otra vez en un momento.';
      }
      final message = error.message.trim();
      if (message.isNotEmpty) {
        return message;
      }
    }

    final raw = error.toString();
    if (raw.contains('OPENAI_API_KEY')) {
      return 'La sesión de voz no arrancó porque falta configurar OpenAI.';
    }
    if (raw.contains('SocketException')) {
      return 'No se pudo conectar con OpenAI. Revisa tu conexión a internet.';
    }
    if (raw.contains('401')) {
      return 'OpenAI rechazó la sesión de voz. Revisa la configuración.';
    }
    if (raw.contains('429')) {
      return 'OpenAI está recibiendo muchas solicitudes. Intenta otra vez en un momento.';
    }
    final normalized = raw.trim();
    if (normalized.isNotEmpty) {
      if (normalized.length <= 220) {
        return normalized;
      }
      return '${normalized.substring(0, 217)}...';
    }
    return 'No fue posible iniciar la sesión de voz.';
  }

  void _handleRealtimeEvent(RendimetaVoiceRealtimeEvent event) {
    switch (event.type) {
      case RendimetaVoiceRealtimeEventType.status:
        _setStatus(event.status ?? RendimetaVoiceAssistantStatus.idle);
        if (_status != RendimetaVoiceAssistantStatus.error) {
          _errorMessage = null;
        }
        break;
      case RendimetaVoiceRealtimeEventType.transcriptSlot:
        _ensureTranscriptTurn(
          itemId:
              event.itemId ?? 'user-${DateTime.now().microsecondsSinceEpoch}',
          role: event.role ?? 'user',
        );
        break;
      case RendimetaVoiceRealtimeEventType.transcriptPartial:
        _upsertTranscript(
          itemId: event.itemId ?? 'assistant-live',
          role: event.role ?? 'assistant',
          content: event.text ?? '',
          append: true,
          isFinal: false,
        );
        break;
      case RendimetaVoiceRealtimeEventType.transcriptFinal:
        _upsertTranscript(
          itemId:
              event.itemId ??
              '${event.role ?? 'assistant'}-${DateTime.now().microsecondsSinceEpoch}',
          role: event.role ?? 'assistant',
          content: event.text ?? '',
          isFinal: true,
        );
        break;
      case RendimetaVoiceRealtimeEventType.localLevel:
        _localLevel = event.level ?? 0;
        break;
      case RendimetaVoiceRealtimeEventType.remoteLevel:
        _remoteLevel = event.level ?? 0;
        break;
      case RendimetaVoiceRealtimeEventType.error:
        _setStatus(RendimetaVoiceAssistantStatus.error);
        _errorMessage = event.message ?? 'Ocurrió un problema en la sesión.';
        break;
    }

    _safeNotifyListeners();
  }

  void _ensureTranscriptTurn({required String itemId, required String role}) {
    final index = _messages.indexWhere((turn) => turn.id == itemId);
    if (index >= 0) return;

    _messages.add(
      VoiceAssistantMessage(
        id: itemId,
        role: role,
        content: '',
        createdAt: DateTime.now(),
      ),
    );
  }

  void _upsertTranscript({
    required String itemId,
    required String role,
    required String content,
    required bool isFinal,
    bool append = false,
  }) {
    final trimmed = content.trim();
    if (trimmed.isEmpty && !append) return;

    final index = _messages.indexWhere((turn) => turn.id == itemId);
    if (index >= 0) {
      final current = _messages[index];
      _messages[index] = VoiceAssistantMessage(
        id: current.id,
        role: current.role,
        content: append ? '${current.content}$content' : trimmed,
        createdAt: current.createdAt,
      );
      return;
    }

    _messages.add(
      VoiceAssistantMessage(
        id: itemId,
        role: role,
        content: trimmed,
        createdAt: DateTime.now(),
      ),
    );
  }

  void _setStatus(RendimetaVoiceAssistantStatus nextStatus) {
    _status = nextStatus;
  }

  @override
  void dispose() {
    _isDisposed = true;
    unawaited(_eventsSubscription?.cancel());
    unawaited(_realtimeClient.dispose());
    super.dispose();
  }

  void _safeNotifyListeners() {
    if (!_isDisposed) {
      notifyListeners();
    }
  }
}
