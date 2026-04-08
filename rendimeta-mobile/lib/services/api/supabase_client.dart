// =====================================================
// SUPABASE CLIENT (TEMPORAL - SOLO PARA DEMO)
// =====================================================
// Este archivo será reemplazado cuando migremos al backend real.
// Cuando migres, solo cambia este archivo por tu cliente REST/GraphQL.
// =====================================================

import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/supabase_config.dart';

class SupabaseClientService {
  static SupabaseClient? _instance;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: SupabaseConfig.supabaseUrl,
      anonKey: SupabaseConfig.supabaseAnonKey,
    );
    _instance = Supabase.instance.client;
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
