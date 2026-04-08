// =====================================================
// AUTH SERVICE (Interfaz estable)
// =====================================================
// Esta interfaz NO cambiará cuando migres al backend real.
// Solo cambiarás la implementación interna.
// =====================================================

import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_client.dart';

class AuthUser {
  final String id;
  final String email;
  final String name;
  final String? station;
  final String role;
  final int level;
  final List<String>? stationIds;
  final int xp;
  final int streak;
  final int totalSales;

  AuthUser({
    required this.id,
    required this.email,
    required this.name,
    this.station,
    required this.role,
    required this.level,
    this.stationIds,
    required this.xp,
    required this.streak,
    required this.totalSales,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      station: json['station'] as String?,
      role: json['role'] as String,
      level: json['level'] as int,
      stationIds: (json['station_ids'] as List<dynamic>?)?.cast<String>(),
      xp: json['xp'] as int,
      streak: json['streak'] as int,
      totalSales: json['total_sales'] as int,
    );
  }
}

class AuthService {
  static final SupabaseClient _client = SupabaseClientService.client;

  // =====================================================
  // FUNCIONES PÚBLICAS (NO CAMBIARÁN)
  // =====================================================

  /// Inicia sesión con email y password
  static Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw ApiException('No se pudo iniciar sesión');
      }

      // Obtener datos adicionales del usuario
      final userData = await _getUserById(response.user!.id);
      return userData;
    } catch (e) {
      throw ApiException('Error al iniciar sesión: ${e.toString()}');
    }
  }

  /// Cierra sesión
  static Future<void> logout() async {
    try {
      await _client.auth.signOut();
    } catch (e) {
      throw ApiException('Error al cerrar sesión: ${e.toString()}');
    }
  }

  /// Obtiene el usuario actual
  static Future<AuthUser?> getCurrentUser() async {
    try {
      final session = _client.auth.currentSession;
      if (session == null) return null;

      final userData = await _getUserById(session.user.id);
      return userData;
    } catch (e) {
      print('Error getting current user: $e');
      return null;
    }
  }

  /// Registra un nuevo usuario
  static Future<AuthUser> signup({
    required String email,
    required String password,
    required String name,
    String? station,
  }) async {
    try {
      // Crear usuario en Supabase Auth
      final authResponse = await _client.auth.signUp(
        email: email,
        password: password,
      );

      if (authResponse.user == null) {
        throw ApiException('No se pudo crear el usuario');
      }

      // Crear registro en tabla users
      final userResponse = await _client.from('users').insert({
        'id': authResponse.user!.id,
        'email': email,
        'name': name,
        'station': station,
        'password_hash': '', // Supabase Auth maneja esto
      }).select().single();

      return AuthUser.fromJson(userResponse);
    } catch (e) {
      throw ApiException('Error al registrarse: ${e.toString()}');
    }
  }

  /// Actualiza el perfil del usuario
  static Future<AuthUser> updateProfile({
    required String userId,
    String? name,
    String? station,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (station != null) updates['station'] = station;

      final response = await _client
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

      return AuthUser.fromJson(response);
    } catch (e) {
      throw ApiException('Error al actualizar perfil: ${e.toString()}');
    }
  }

  /// Verifica si hay una sesión activa
  static bool get isAuthenticated {
    return _client.auth.currentSession != null;
  }

  /// Stream de cambios de autenticación
  static Stream<AuthState> get authStateChanges {
    return _client.auth.onAuthStateChange;
  }

  // =====================================================
  // FUNCIONES INTERNAS (pueden cambiar)
  // =====================================================

  static Future<AuthUser> _getUserById(String id) async {
    final response = await _client
        .from('users')
        .select()
        .eq('id', id)
        .single();

    return AuthUser.fromJson(response);
  }
}
