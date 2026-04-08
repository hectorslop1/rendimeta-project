import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'mobile_gamification_service.dart';
import 'supabase_client.dart';

class MobileTrainingService {
  MobileTrainingService._();

  static final SupabaseClient _client = SupabaseClientService.client;

  static Future<void> completeTraining({
    required String employeeId,
    required String videoId,
    required int xpReward,
  }) async {
    final existing = await _client
        .from('employee_training')
        .select('id,completed')
        .eq('employeeId', employeeId)
        .eq('videoId', videoId)
        .limit(1)
        .maybeSingle();

    if (existing == null) {
      await _client.from('employee_training').insert({
        'id': _randomId('m_tr'),
        'employeeId': employeeId,
        'videoId': videoId,
        'completed': true,
        'completedAt': DateTime.now().toIso8601String(),
        'createdAt': DateTime.now().toIso8601String(),
      });
    } else if (existing['completed'] != true) {
      await _client
          .from('employee_training')
          .update({
            'completed': true,
            'completedAt': DateTime.now().toIso8601String(),
          })
          .eq('id', existing['id']);
    }

    await MobileGamificationService.addPoints(
      employeeId: employeeId,
      points: xpReward,
      bucket: 'bonus',
    );
  }

  static String _randomId(String prefix) {
    final now = DateTime.now().microsecondsSinceEpoch;
    final rand = Random().nextInt(1 << 32);
    return '${prefix}_${now}_$rand';
  }
}
