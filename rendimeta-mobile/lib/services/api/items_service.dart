// =====================================================
// ITEMS SERVICE (Interfaz estable)
// =====================================================
// Esta interfaz NO cambiará cuando migres al backend real.
// Solo cambiarás la implementación interna.
// =====================================================

import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_client.dart';

class Item {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String? userId;
  final DateTime createdAt;
  final DateTime updatedAt;

  Item({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    this.userId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: json['status'] as String,
      userId: json['user_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class ItemsService {
  static final SupabaseClient _client = SupabaseClientService.client;

  // =====================================================
  // FUNCIONES PÚBLICAS (NO CAMBIARÁN)
  // =====================================================

  /// Obtiene todos los items
  static Future<List<Item>> getItems() async {
    try {
      final response = await _client
          .from('items')
          .select()
          .order('created_at', ascending: false);

      return (response as List).map((item) => Item.fromJson(item)).toList();
    } catch (e) {
      throw ApiException('Error al obtener items: ${e.toString()}');
    }
  }

  /// Obtiene un item por ID
  static Future<Item> getItemById(String id) async {
    try {
      final response = await _client
          .from('items')
          .select()
          .eq('id', id)
          .single();

      return Item.fromJson(response);
    } catch (e) {
      throw ApiException('Error al obtener item: ${e.toString()}');
    }
  }

  /// Obtiene items por usuario
  static Future<List<Item>> getItemsByUser(String userId) async {
    try {
      final response = await _client
          .from('items')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      return (response as List).map((item) => Item.fromJson(item)).toList();
    } catch (e) {
      throw ApiException('Error al obtener items del usuario: ${e.toString()}');
    }
  }

  /// Crea un nuevo item
  static Future<Item> createItem({
    required String title,
    String? description,
    String status = 'pending',
    String? userId,
  }) async {
    try {
      final response = await _client.from('items').insert({
        'title': title,
        'description': description,
        'status': status,
        'user_id': userId,
      }).select().single();

      return Item.fromJson(response);
    } catch (e) {
      throw ApiException('Error al crear item: ${e.toString()}');
    }
  }

  /// Actualiza un item existente
  static Future<Item> updateItem({
    required String id,
    String? title,
    String? description,
    String? status,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (title != null) updates['title'] = title;
      if (description != null) updates['description'] = description;
      if (status != null) updates['status'] = status;

      final response = await _client
          .from('items')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      return Item.fromJson(response);
    } catch (e) {
      throw ApiException('Error al actualizar item: ${e.toString()}');
    }
  }

  /// Elimina un item
  static Future<void> deleteItem(String id) async {
    try {
      await _client.from('items').delete().eq('id', id);
    } catch (e) {
      throw ApiException('Error al eliminar item: ${e.toString()}');
    }
  }

  /// Suscribirse a cambios en items (realtime)
  static RealtimeChannel subscribeToItems(
    void Function(List<Item>) callback,
  ) {
    final channel = _client.channel('items-changes').onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'items',
      callback: (_) async {
        // Refetch all items when any change occurs
        final items = await getItems();
        callback(items);
      },
    ).subscribe();

    return channel;
  }

  /// Cancela suscripción
  static Future<void> unsubscribe(RealtimeChannel channel) async {
    await _client.removeChannel(channel);
  }
}
