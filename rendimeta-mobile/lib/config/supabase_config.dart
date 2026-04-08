import '../core/config/app_env.dart';

class SupabaseConfig {
  static String get supabaseUrl => AppEnv.supabaseUrl;
  static String get supabaseAnonKey => AppEnv.supabaseAnonKey;
}
