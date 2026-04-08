import 'package:flutter_dotenv/flutter_dotenv.dart';

class OpenAiVoiceConfig {
  OpenAiVoiceConfig._();

  static String get apiKey => dotenv.env['OPENAI_API_KEY']?.trim() ?? '';

  static String get realtimeModel =>
      dotenv.env['OPENAI_REALTIME_MODEL']?.trim().isNotEmpty == true
      ? dotenv.env['OPENAI_REALTIME_MODEL']!.trim()
      : 'gpt-realtime-mini';

  static String get transcriptionModel =>
      dotenv.env['OPENAI_REALTIME_TRANSCRIPTION_MODEL']?.trim().isNotEmpty ==
          true
      ? dotenv.env['OPENAI_REALTIME_TRANSCRIPTION_MODEL']!.trim()
      : 'gpt-4o-mini-transcribe';

  static String get voice =>
      dotenv.env['OPENAI_REALTIME_VOICE']?.trim().isNotEmpty == true
      ? dotenv.env['OPENAI_REALTIME_VOICE']!.trim()
      : 'shimmer';

  static String get fallbackRealtimeModel => 'gpt-realtime';

  static bool get isConfigured => apiKey.isNotEmpty;
}
