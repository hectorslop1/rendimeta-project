import 'app_env.dart';

class OpenAiVoiceConfig {
  OpenAiVoiceConfig._();

  static String get apiKey => AppEnv.openAiApiKey;
  static String get realtimeModel => AppEnv.openAiRealtimeModel;
  static String get transcriptionModel =>
      AppEnv.openAiRealtimeTranscriptionModel;
  static String get voice => AppEnv.openAiRealtimeVoice;

  static String get fallbackRealtimeModel => 'gpt-realtime';

  static bool get isConfigured => apiKey.isNotEmpty;
}
