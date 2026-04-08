import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  AppEnv._();

  static String get openAiApiKey => _read('OPENAI_API_KEY');
  static String get openAiTextModel =>
      _read('OPENAI_TEXT_MODEL', fallback: 'gpt-4.1-mini');
  static String get openAiRealtimeModel =>
      _read('OPENAI_REALTIME_MODEL', fallback: 'gpt-realtime-mini');
  static String get openAiRealtimeTranscriptionModel => _read(
    'OPENAI_REALTIME_TRANSCRIPTION_MODEL',
    fallback: 'gpt-4o-mini-transcribe',
  );
  static String get openAiRealtimeVoice =>
      _read('OPENAI_REALTIME_VOICE', fallback: 'shimmer');

  static String get supabaseUrl => _read('SUPABASE_URL');
  static String get supabaseAnonKey => _read('SUPABASE_ANON_KEY');
  static String get apiUrl =>
      _read('API_URL', fallback: 'http://localhost:3000/api');

  static bool get hasOpenAiKey => openAiApiKey.isNotEmpty;
  static bool get hasSupabaseConfig =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static String masked(String value) {
    if (value.isEmpty) return '<empty>';
    if (value.length <= 8) return '***';
    return '${value.substring(0, 4)}...${value.substring(value.length - 4)}';
  }

  static void logSummary() {
    debugPrint(
      'AppEnv: OPENAI_API_KEY=${masked(openAiApiKey)} '
      'SUPABASE_URL=${supabaseUrl.isEmpty ? '<empty>' : supabaseUrl} '
      'SUPABASE_ANON_KEY=${masked(supabaseAnonKey)} '
      'DEMO_USER=<disabled>',
    );
  }

  static String _read(String key, {String fallback = ''}) {
    final value = dotenv.env[key]?.trim();
    if (value == null || value.isEmpty) {
      return fallback;
    }
    return value;
  }
}
