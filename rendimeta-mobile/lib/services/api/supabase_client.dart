import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/supabase_config.dart';
import '../../core/config/app_env.dart';

class SupabaseClientService {
  static SupabaseClient? _instance;
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized && _instance != null) {
      return;
    }

    if (!AppEnv.hasSupabaseConfig) {
      throw ApiException(
        'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en rendimeta-mobile/.env.',
      );
    }

    debugPrint(
      'SupabaseClientService.initialize url=${SupabaseConfig.supabaseUrl} '
      'anonKey=${AppEnv.masked(SupabaseConfig.supabaseAnonKey)}',
    );

    await Supabase.initialize(
      url: SupabaseConfig.supabaseUrl,
      anonKey: SupabaseConfig.supabaseAnonKey,
    );
    _instance = Supabase.instance.client;
    _initialized = true;
  }

  static SupabaseClient get client {
    if (_instance == null) {
      throw Exception('Supabase not initialized. Call initialize() first.');
    }
    return _instance!;
  }

  static SupabaseClient get instance => client;
}

// Helper para manejar errores
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
