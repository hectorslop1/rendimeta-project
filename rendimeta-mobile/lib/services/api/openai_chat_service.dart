import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../core/config/app_env.dart';
import '../../features/voice_assistant/domain/rendimeta_assistant_snapshot.dart';
import 'supabase_client.dart';

class OpenAiChatMessage {
  const OpenAiChatMessage({required this.role, required this.content});

  final String role;
  final String content;
}

class OpenAiChatService {
  OpenAiChatService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<String> reply({
    required String prompt,
    required RendimetaAssistantSnapshot snapshot,
    List<OpenAiChatMessage> history = const <OpenAiChatMessage>[],
  }) async {
    final apiKey = AppEnv.openAiApiKey;
    if (apiKey.isEmpty) {
      throw ApiException(
        'Falta OPENAI_API_KEY en rendimeta-mobile/.env para usar el chat IA.',
      );
    }

    debugPrint(
      'OpenAiChatService.reply model=${AppEnv.openAiTextModel} '
      'apiKey=${AppEnv.masked(apiKey)}',
    );

    final sanitizedHistory = history
        .where(
          (m) =>
              (m.role == 'user' || m.role == 'assistant') &&
              m.content.trim().isNotEmpty,
        )
        .toList(growable: false);

    final input = <Map<String, dynamic>>[
      <String, dynamic>{
        'role': 'system',
        'content': <Map<String, dynamic>>[
          <String, dynamic>{
            'type': 'input_text',
            'text': _buildSystemPrompt(snapshot),
          },
        ],
      },
      ...sanitizedHistory.map(
        (m) => <String, dynamic>{
          'role': m.role,
          'content': <Map<String, dynamic>>[
            <String, dynamic>{'type': 'input_text', 'text': m.content.trim()},
          ],
        },
      ),
      <String, dynamic>{
        'role': 'user',
        'content': <Map<String, dynamic>>[
          <String, dynamic>{'type': 'input_text', 'text': prompt.trim()},
        ],
      },
    ];

    final response = await _client.post(
      Uri.parse('https://api.openai.com/v1/responses'),
      headers: <String, String>{
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(<String, dynamic>{
        'model': AppEnv.openAiTextModel,
        'input': input,
        'tools': <Map<String, dynamic>>[
          <String, dynamic>{'type': 'web_search'},
        ],
        'max_output_tokens': 240,
      }),
    );

    final body = response.body;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(_extractError(body));
    }

    final text = _extractOutputText(body).trim();
    if (text.isEmpty) {
      throw ApiException('OpenAI respondió sin texto útil para el chat.');
    }
    return text;
  }

  String _buildSystemPrompt(RendimetaAssistantSnapshot snapshot) {
    final currentRanking = snapshot.currentRankingEntry;
    final rankingText = currentRanking == null
        ? 'Sin posición de ranking cargada.'
        : 'Lugar ${currentRanking.position} con ${currentRanking.totalSales} ventas.';

    return '''
Eres RendiCoach, el asistente de texto de Rendimeta.

Reglas:
- Responde siempre en español mexicano.
- Mantén las respuestas útiles y cortas: 2 a 4 frases.
- Mantén el contexto conversacional: si el usuario ya mencionó un vehículo (marca/modelo/año), úsalo en las siguientes preguntas sin pedirlo de nuevo.
- Si preguntan por métricas personales (ventas, metas, ranking, XP, racha), usa el contexto de la app.
- Si preguntan por operación diaria (llantas, aceite, capacidad de tanque, etc.), usa conocimiento general, pero:
  - No inventes datos exactos para un modelo específico si no estás seguro.
  - Si necesitas datos exactos (capacidad de aceite, presión recomendada, viscosidad por motor), usa web search antes de responder.
  - Pide datos clave (año, versión/motor, país) y sugiere verificar en etiqueta de puerta/manual cuando aplique.
  - Prioriza seguridad: para presión de llantas, recomienda revisar la etiqueta de la puerta y dar un rango típico solo como referencia.
- Si el usuario quiere reportar un problema al gerente, pide datos mínimos (qué pasó, dónde, urgencia) y confirma el reporte.
- No menciones API keys, modelos ni detalles técnicos.

Contexto del usuario:
- Nombre: ${snapshot.profile.name}
- Estación: ${snapshot.profile.station}
- Ventas hoy/corte: ${snapshot.profile.todayTotalSales}
- XP: ${snapshot.profile.xp}
- Racha: ${snapshot.profile.streak}
- Ranking: $rankingText
- Coach interno: ${snapshot.coachMessage}
''';
  }

  String _extractOutputText(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is! Map<String, dynamic>) return '';

      final direct = decoded['output_text']?.toString();
      if (direct != null && direct.trim().isNotEmpty) {
        return direct;
      }

      final output = decoded['output'];
      if (output is List) {
        final buffer = StringBuffer();
        for (final item in output) {
          if (item is! Map<String, dynamic>) continue;
          final content = item['content'];
          if (content is! List) continue;
          for (final part in content) {
            if (part is! Map<String, dynamic>) continue;
            final text = part['text'];
            if (text is String && text.trim().isNotEmpty) {
              if (buffer.isNotEmpty) buffer.write('\n');
              buffer.write(text.trim());
            } else if (text is Map<String, dynamic>) {
              final value = text['value']?.toString();
              if (value != null && value.trim().isNotEmpty) {
                if (buffer.isNotEmpty) buffer.write('\n');
                buffer.write(value.trim());
              }
            }
          }
        }
        return buffer.toString();
      }
    } catch (_) {}

    return '';
  }

  String _extractError(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final error = decoded['error'];
        if (error is Map<String, dynamic>) {
          final message = error['message']?.toString();
          if (message != null && message.trim().isNotEmpty) {
            return message.trim();
          }
        }
      }
    } catch (_) {}

    if (body.trim().isEmpty) {
      return 'OpenAI rechazó la petición de chat sin devolver detalles.';
    }
    return body.trim();
  }
}
