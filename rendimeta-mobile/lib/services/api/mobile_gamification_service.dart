import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_client.dart';

class MobileGamificationService {
  MobileGamificationService._();

  static final SupabaseClient _client = SupabaseClientService.client;

  static Future<void> maybeAwardAchievement({
    required String employeeId,
    required String achievementCode,
  }) async {
    final def = await _fetchAchievementDefinitionByCode(achievementCode);
    if (def == null) return;
    final achievementId = def['id']?.toString();
    if (achievementId == null || achievementId.isEmpty) return;

    final existing = await _client
        .from('employee_achievements')
        .select('id')
        .eq('employeeId', employeeId)
        .eq('achievementId', achievementId)
        .limit(1)
        .maybeSingle();
    if (existing != null) return;

    await _client.from('employee_achievements').insert({
      'id': _randomId('m_ach'),
      'employeeId': employeeId,
      'achievementId': achievementId,
      'earnedAt': DateTime.now().toIso8601String(),
      'metadata': {'source': 'mobile', 'code': achievementCode},
    });
  }

  static Future<void> addPoints({
    required String employeeId,
    required int points,
    required String bucket,
  }) async {
    final safePoints = points.clamp(0, 9999);
    if (safePoints == 0) return;

    final month = _isoMonth(DateTime.now());
    final existing = await _client
        .from('gamification_scores')
        .select(
          'id,totalPoints,salesPoints,attendancePoints,streakPoints,bonusPoints,currentStreak,bestStreak,rank',
        )
        .eq('employeeId', employeeId)
        .eq('month', month)
        .limit(1)
        .maybeSingle();

    if (existing == null) {
      await _client.from('gamification_scores').insert({
        'id': _randomId('m_score'),
        'employeeId': employeeId,
        'month': month,
        'totalPoints': safePoints,
        'salesPoints': bucket == 'sales' ? safePoints : 0,
        'attendancePoints': 0,
        'streakPoints': 0,
        'bonusPoints': bucket == 'bonus' ? safePoints : 0,
        'currentStreak': 0,
        'bestStreak': 0,
        'rank': null,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      });
      return;
    }

    final total = (existing['totalPoints'] as num?)?.toInt() ?? 0;
    final sales = (existing['salesPoints'] as num?)?.toInt() ?? 0;
    final bonus = (existing['bonusPoints'] as num?)?.toInt() ?? 0;

    await _client
        .from('gamification_scores')
        .update({
          'totalPoints': total + safePoints,
          'salesPoints': bucket == 'sales' ? sales + safePoints : sales,
          'bonusPoints': bucket == 'bonus' ? bonus + safePoints : bonus,
          'updatedAt': DateTime.now().toIso8601String(),
        })
        .eq('id', existing['id']);
  }

  static Future<Map<String, dynamic>?> _fetchAchievementDefinitionByCode(
    String code,
  ) async {
    try {
      final response = await _client
          .from('achievement_definitions')
          .select('id,code,isActive')
          .eq('code', code)
          .eq('isActive', true)
          .limit(1)
          .maybeSingle();
      if (response == null) return null;
      return Map<String, dynamic>.from(response);
    } on PostgrestException {
      return null;
    } catch (_) {
      return null;
    }
  }

  static String _isoMonth(DateTime value) {
    final normalized = DateTime(value.year, value.month, 1);
    return normalized.toIso8601String().split('T').first;
  }

  static String _randomId(String prefix) {
    final now = DateTime.now().microsecondsSinceEpoch;
    final rand = Random().nextInt(1 << 32);
    return '${prefix}_${now}_$rand';
  }
}
