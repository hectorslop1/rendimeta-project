import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/models.dart';
import 'mobile_gamification_service.dart';
import 'supabase_client.dart';

class MobileSalesService {
  MobileSalesService._();

  static final SupabaseClient _client = SupabaseClientService.client;

  static Future<void> recordSale({
    required String employeeId,
    required String stationId,
    required ProductType productType,
    double quantity = 1,
    DateTime? occurredAt,
  }) async {
    final timestamp = occurredAt ?? DateTime.now();
    final product = await _fetchProductForType(productType);
    if (product == null) {
      throw ApiException(
        'No encontré un producto activo para ${productType.label.toLowerCase()}.',
      );
    }

    final unitPrice = (product['unitPrice'] as num?)?.toDouble() ?? 0;
    final qty = quantity.clamp(0.1, 99);
    final totalAmount = unitPrice * qty;

    try {
      await _client.from('sale_records').insert({
        'id': _randomId('m_sale'),
        'employeeId': employeeId,
        'productId': product['id']?.toString(),
        'stationId': stationId,
        'date': _isoDate(timestamp),
        'hour': timestamp.hour,
        'quantity': qty,
        'unitPrice': unitPrice,
        'totalAmount': totalAmount,
      });
      await MobileGamificationService.maybeAwardAchievement(
        employeeId: employeeId,
        achievementCode: 'first_sale',
      );
      await MobileGamificationService.addPoints(
        employeeId: employeeId,
        points: 5,
        bucket: 'sales',
      );
    } on PostgrestException catch (error) {
      throw ApiException(error.message);
    } catch (error) {
      throw ApiException('No se pudo registrar la venta: $error');
    }
  }

  static Future<Map<String, dynamic>?> _fetchProductForType(
    ProductType productType,
  ) async {
    // Busca un producto activo que pertenezca a la categoria del tipo solicitado.
    final categories = await _client
        .from('product_categories')
        .select('id,code,name')
        .order('name', ascending: true);

    String? categoryId;
    for (final row in categories as List<dynamic>) {
      final map = Map<String, dynamic>.from(row as Map);
      final code = map['code']?.toString();
      final name = map['name']?.toString();
      final inferred = _productTypeFromCategoryName(name ?? code);
      if (inferred == productType) {
        categoryId = map['id']?.toString();
        break;
      }
    }
    if (categoryId == null || categoryId.isEmpty) return null;

    final product = await _client
        .from('products')
        .select('id,unitPrice,isActive,categoryId')
        .eq('categoryId', categoryId)
        .eq('isActive', true)
        .order('unitPrice', ascending: false)
        .limit(1)
        .maybeSingle();
    if (product == null) return null;
    return Map<String, dynamic>.from(product);
  }

  static ProductType? _productTypeFromCategoryName(String? categoryName) {
    final value = categoryName?.toUpperCase() ?? '';
    if (value.contains('AROM')) return ProductType.aromatizante;
    if (value.contains('ACC') || value.contains('OTR')) {
      return ProductType.accesorio;
    }
    if (value.contains('IMP') || value.contains('BUR')) {
      return ProductType.snack;
    }
    if (value.isEmpty) return null;
    return ProductType.aceite;
  }

  static String _randomId(String prefix) {
    final now = DateTime.now().microsecondsSinceEpoch;
    final rand = Random().nextInt(1 << 32);
    return '${prefix}_${now}_$rand';
  }

  static String _isoDate(DateTime value) {
    final normalized = DateTime(value.year, value.month, value.day);
    return normalized.toIso8601String().split('T').first;
  }
}
