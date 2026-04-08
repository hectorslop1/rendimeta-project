import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_client.dart';

class IncidentReportService {
  IncidentReportService._();

  static final SupabaseClient _client = SupabaseClientService.client;

  static Future<void> submitReport({
    required String stationId,
    required String employeeId,
    required String message,
    String? category,
    DateTime? createdAt,
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) {
      throw ApiException('El reporte no puede ir vacío.');
    }

    try {
      await _client.from('incident_reports').insert({
        'id': _randomId('m_report'),
        'stationId': stationId,
        'employeeId': employeeId,
        'category': category,
        'message': trimmed,
        'createdAt': (createdAt ?? DateTime.now()).toIso8601String(),
      });
    } on PostgrestException catch (error) {
      throw ApiException(error.message);
    } catch (error) {
      throw ApiException('No se pudo enviar el reporte.');
    }
  }

  static String _randomId(String prefix) {
    final now = DateTime.now().microsecondsSinceEpoch;
    final rand = Random().nextInt(1 << 32);
    return '${prefix}_${now}_$rand';
  }
}
