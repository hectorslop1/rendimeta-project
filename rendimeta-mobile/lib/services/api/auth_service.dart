// =====================================================
// AUTH SERVICE (Interfaz estable)
// =====================================================
// Esta interfaz NO cambiará cuando migres al backend real.
// Solo cambiarás la implementación interna.
// =====================================================

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_client.dart';

class AuthUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? roleId;
  final String? employeeId;
  final dynamic stationIds;
  final bool isActive;

  AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.roleId,
    this.employeeId,
    this.stationIds,
    required this.isActive,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory AuthUser.fromRow(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      roleId: json['roleId']?.toString(),
      employeeId: json['employeeId']?.toString(),
      stationIds: json['stationIds'],
      isActive: json['isActive'] == true,
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

      if (response.user == null || (response.user!.email ?? '').isEmpty) {
        throw ApiException('No se pudo iniciar sesión');
      }

      final userData = await _getUserByEmail(response.user!.email!.trim());
      if (!userData.isActive || (userData.employeeId ?? '').trim().isEmpty) {
        await _client.auth.signOut();
        throw ApiException(
          'Tu cuenta no está activa o no está vinculada a un empleado. Pide a tu administrador que te habilite.',
        );
      }

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
      final email = session.user.email?.trim() ?? '';
      if (email.isEmpty) return null;
      return await _getUserByEmail(email);
    } catch (e) {
      debugPrint('Error getting current user: $e');
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
    throw ApiException(
      'El alta de usuarios debe hacerse desde administración. Esta app solo inicia sesión con cuentas ya creadas.',
    );
  }

  /// Actualiza el perfil del usuario
  static Future<AuthUser> updateProfile({
    required String userId,
    String? name,
    String? station,
  }) async {
    throw ApiException('La edición de perfil no está habilitada en móvil aún.');
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

  static Future<AuthUser> _getUserByEmail(String email) async {
    final response = await _client
        .from('users')
        .select(
          'id,email,firstName,lastName,roleId,employeeId,stationIds,isActive',
        )
        .eq('email', email)
        .limit(1)
        .single();

    return AuthUser.fromRow(Map<String, dynamic>.from(response));
  }
}
