import 'package:flutter/material.dart' hide Badge;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/models.dart';
import 'supabase_client.dart';

class MobileDashboardSnapshot {
  const MobileDashboardSnapshot({
    required this.profile,
    required this.ranking,
    required this.videos,
    required this.weeklyTrend,
    required this.employeeId,
    required this.stationId,
    this.asOf,
  });

  final UserProfile profile;
  final List<RankingEntry> ranking;
  final List<TrainingVideo> videos;
  final List<double> weeklyTrend;
  final String employeeId;
  final String stationId;
  final DateTime? asOf;
}

class MobileDashboardService {
  MobileDashboardService._();

  static final SupabaseClient _client = SupabaseClientService.client;

  static Future<MobileDashboardSnapshot> loadDashboard() async {
    try {
      final authUser = _client.auth.currentUser;
      if (authUser == null || (authUser.email ?? '').trim().isEmpty) {
        throw ApiException('Inicia sesión para ver tu dashboard.');
      }
      final userEmail = authUser.email!.trim();

      final user = await _fetchUserByEmail(userEmail);
      final employeeId = user['employeeId']?.toString();
      if (employeeId == null || employeeId.isEmpty) {
        throw ApiException(
          'El usuario $userEmail no tiene employeeId vinculado en Supabase.',
        );
      }

      final employee = await _fetchById('employees', employeeId);
      final stationId = employee['stationId']?.toString();
      final station = stationId == null || stationId.isEmpty
          ? null
          : await _fetchById('stations', stationId);

      final latestScoreMonth = await _fetchLatestDate(
        table: 'gamification_scores',
        column: 'month',
      );
      final latestSalesDate = await _fetchLatestDate(
        table: 'sale_records',
        column: 'date',
      );

      final salesRows = await _fetchSalesRows(employeeId);
      final productTypeById = await _fetchProductTypesByProductId(salesRows);
      final todayReference = latestSalesDate;
      final todaySales = _buildTodaySales(
        salesRows,
        productTypeById: productTypeById,
        referenceDate: todayReference,
      );
      final weeklyTrend = _buildWeeklyTrend(
        salesRows,
        referenceDate: todayReference,
      );
      final salesHistory = _buildSalesHistory(
        salesRows,
        productTypeById: productTypeById,
        limit: 20,
      );

      final scoreRow = latestScoreMonth == null
          ? null
          : await _fetchSingleOrNull(
              'gamification_scores',
              filters: {
                'employeeId': employeeId,
                'month': _isoDate(latestScoreMonth),
              },
            );

      final achievements = await _fetchAchievementDefinitionsSafe();
      final earnedAchievements = await _fetchEarnedAchievementsSafe(employeeId);
      final badges = _buildBadges(
        allDefinitions: achievements,
        earnedAchievements: earnedAchievements,
      );

      final trainingProgress = await _fetchTrainingProgress(employeeId);
      final videos = await _fetchTrainingVideosSafe(
        completedVideoIds: trainingProgress.completedVideoIds,
      );

      final missions = await _buildMissions(
        employeeId: employeeId,
        todaySales: todaySales,
        hasTrainingVideos: videos.isNotEmpty,
        trainingsCompletedToday: trainingProgress.completedTodayCount,
      );

      List<RankingEntry> ranking = const <RankingEntry>[];
      try {
        ranking = await _buildWeeklyStationRanking(
          currentEmployeeId: employeeId,
          stationId: stationId ?? '',
          referenceDate: DateTime.now(),
        );
      } on PostgrestException {
        // Si el ranking falla (p. ej. RLS), no romper el dashboard.
        ranking = const <RankingEntry>[];
      } catch (_) {
        ranking = const <RankingEntry>[];
      }

      final profile = UserProfile(
        name: _joinName(employee['firstName'], employee['lastName']),
        station: station?['name']?.toString() ?? 'Sin estación',
        xp: (scoreRow?['totalPoints'] as num?)?.round() ?? 0,
        streak: (scoreRow?['currentStreak'] as num?)?.round() ?? 0,
        totalSales: _sumSalesQuantity(salesRows),
        todaySales: todaySales,
        badges: badges,
        missions: missions,
        salesHistory: salesHistory,
      );

      return MobileDashboardSnapshot(
        profile: profile,
        ranking: _ensureCurrentUserRanking(profile, ranking),
        videos: videos,
        weeklyTrend: weeklyTrend,
        employeeId: employeeId,
        stationId: stationId ?? '',
        asOf: latestSalesDate ?? latestScoreMonth,
      );
    } on PostgrestException catch (error) {
      throw _mapPostgrestError(error);
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException('No se pudo cargar el dashboard móvil: $error');
    }
  }

  static Future<Map<String, dynamic>> _fetchUserByEmail(String email) async {
    final response = await _client
        .from('users')
        .select('id,email,firstName,lastName,employeeId')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

    if (response == null) {
      throw ApiException('No encontré el usuario $email en Supabase.');
    }

    return Map<String, dynamic>.from(response);
  }

  static Future<Map<String, dynamic>> _fetchById(
    String table,
    String id,
  ) async {
    final response = await _client
        .from(table)
        .select()
        .eq('id', id)
        .limit(1)
        .maybeSingle();

    if (response == null) {
      throw ApiException('No encontré el registro $id en $table.');
    }

    return Map<String, dynamic>.from(response);
  }

  static Future<Map<String, dynamic>?> _fetchSingleOrNull(
    String table, {
    required Map<String, dynamic> filters,
  }) async {
    PostgrestFilterBuilder<dynamic> query = _client.from(table).select();
    filters.forEach((key, value) {
      query = query.eq(key, value);
    });
    final response = await query.limit(1).maybeSingle();
    if (response == null) return null;
    return Map<String, dynamic>.from(response);
  }

  static Future<List<Map<String, dynamic>>> _fetchSalesRows(
    String employeeId,
  ) async {
    final response = await _client
        .from('sale_records')
        .select('date,quantity,productId,hour')
        .eq('employeeId', employeeId)
        .order('date', ascending: false)
        .order('hour', ascending: false)
        .limit(400);

    return (response as List<dynamic>)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
  }

  static Future<List<Map<String, dynamic>>>
  _fetchAchievementDefinitionsSafe() async {
    try {
      final response = await _client
          .from('achievement_definitions')
          .select('id,code,name,description,category,pointValue,isActive')
          .eq('isActive', true)
          .order('pointValue', ascending: false);

      return (response as List<dynamic>)
          .map((row) => Map<String, dynamic>.from(row as Map))
          .toList();
    } on PostgrestException {
      return const <Map<String, dynamic>>[];
    } catch (_) {
      return const <Map<String, dynamic>>[];
    }
  }

  static Future<Map<String, ProductType>> _fetchProductTypesByProductId(
    List<Map<String, dynamic>> salesRows,
  ) async {
    final productIds = salesRows
        .map((row) => row['productId']?.toString())
        .whereType<String>()
        .toSet()
        .toList();
    if (productIds.isEmpty) return const <String, ProductType>{};

    final productResponse = await _client
        .from('products')
        .select('id,categoryId')
        .inFilter('id', productIds);

    final products = (productResponse as List<dynamic>)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
    final categoryIds = products
        .map((row) => row['categoryId']?.toString())
        .whereType<String>()
        .toSet()
        .toList();

    final categoryResponse = await _client
        .from('product_categories')
        .select('id,code,name')
        .inFilter('id', categoryIds);

    final categoryMap = <String, ProductType>{};
    for (final row in categoryResponse as List<dynamic>) {
      final map = Map<String, dynamic>.from(row as Map);
      categoryMap[map['id'].toString()] = _productTypeFromCategoryName(
        map['name']?.toString() ?? map['code']?.toString(),
      )!;
    }

    final productTypeById = <String, ProductType>{};
    for (final product in products) {
      final categoryId = product['categoryId']?.toString();
      final productId = product['id']?.toString();
      final productType = categoryId == null ? null : categoryMap[categoryId];
      if (productId != null && productType != null) {
        productTypeById[productId] = productType;
      }
    }

    return productTypeById;
  }

  static Future<List<Map<String, dynamic>>> _fetchEarnedAchievementsSafe(
    String employeeId,
  ) async {
    try {
      final response = await _client
          .from('employee_achievements')
          .select('achievementId')
          .eq('employeeId', employeeId);

      return (response as List<dynamic>)
          .map((row) => Map<String, dynamic>.from(row as Map))
          .toList();
    } on PostgrestException {
      return const <Map<String, dynamic>>[];
    } catch (_) {
      return const <Map<String, dynamic>>[];
    }
  }

  static Future<DateTime?> _fetchLatestDate({
    required String table,
    required String column,
  }) async {
    final response = await _client
        .from(table)
        .select(column)
        .order(column, ascending: false)
        .limit(1)
        .maybeSingle();

    final value = response?[column]?.toString();
    if (value == null || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }

  static Future<List<DailyMission>> _buildMissions({
    required String employeeId,
    required Map<ProductType, int> todaySales,
    required bool hasTrainingVideos,
    required int trainingsCompletedToday,
  }) async {
    final missions = <DailyMission>[];

    if (hasTrainingVideos) {
      missions.add(
        DailyMission(
          id: 'training_daily',
          description: 'Completa 1 capacitación',
          product: null,
          target: 1,
          current: trainingsCompletedToday.clamp(0, 1),
          xpReward: 15,
        ),
      );
    }

    final quotaMissions = await _buildQuotaMissions(
      employeeId: employeeId,
      todaySales: todaySales,
    );
    missions.addAll(quotaMissions);

    if (missions.length > 3) {
      return missions.take(3).toList();
    }
    return missions;
  }

  static Future<List<DailyMission>> _buildQuotaMissions({
    required String employeeId,
    required Map<ProductType, int> todaySales,
  }) async {
    try {
      final latestQuotaMonth = await _fetchLatestDate(
        table: 'quota_assignments',
        column: 'month',
      );
      if (latestQuotaMonth == null) {
        return _fallbackMissions(todaySales);
      }

      final response = await _client
          .from('quota_assignments')
          .select('id,categoryName,dailyTarget,monthlyTarget')
          .eq('employeeId', employeeId)
          .eq('month', _isoDate(latestQuotaMonth))
          .order('dailyTarget', ascending: false);

      final rows = (response as List<dynamic>)
          .map((row) => Map<String, dynamic>.from(row as Map))
          .toList();

      if (rows.isEmpty) {
        return _fallbackMissions(todaySales);
      }

      final seenProducts = <ProductType>{};
      final missions = <DailyMission>[];

      for (final row in rows) {
        final product = _productTypeFromCategoryName(
          row['categoryName']?.toString(),
        );
        if (product == null || !seenProducts.add(product)) continue;

        final target = ((row['dailyTarget'] as num?)?.ceil() ?? 0).clamp(1, 99);
        final current = (todaySales[product] ?? 0).clamp(0, target);
        missions.add(
          DailyMission(
            id: row['id']?.toString() ?? '${product.name}_mission',
            description: 'Meta diaria de ${product.label.toLowerCase()}',
            product: product,
            target: target,
            current: current,
            xpReward: (target * 5).clamp(10, 40),
          ),
        );

        if (missions.length == 3) break;
      }

      if (missions.isEmpty) {
        return _fallbackMissions(todaySales);
      }
      return missions;
    } on PostgrestException {
      return _fallbackMissions(todaySales);
    } catch (_) {
      return _fallbackMissions(todaySales);
    }
  }

  static List<DailyMission> _fallbackMissions(
    Map<ProductType, int> todaySales,
  ) {
    final candidates = <ProductType>[
      ProductType.aceite,
      ProductType.aromatizante,
      ProductType.snack,
      ProductType.accesorio,
    ];

    final missions = <DailyMission>[];
    for (final product in candidates) {
      final target = 2;
      final current = (todaySales[product] ?? 0).clamp(0, target);
      missions.add(
        DailyMission(
          id: 'demo_${product.name}_mission',
          description: 'Meta diaria de ${product.label.toLowerCase()}',
          product: product,
          target: target,
          current: current,
          xpReward: 15,
        ),
      );
      if (missions.length == 2) break;
    }
    return missions;
  }

  static Future<List<RankingEntry>> _buildWeeklyStationRanking({
    required String currentEmployeeId,
    required String stationId,
    required DateTime referenceDate,
  }) async {
    if (stationId.trim().isEmpty) {
      return const <RankingEntry>[];
    }

    final end = DateTime(
      referenceDate.year,
      referenceDate.month,
      referenceDate.day,
    );
    final start = end.subtract(const Duration(days: 6));

    final salesResponse = await _client
        .from('sale_records')
        .select('employeeId,quantity,date')
        .eq('stationId', stationId)
        .gte('date', _isoDate(start))
        .lte('date', _isoDate(end))
        .limit(5000);

    final totals = <String, int>{};
    for (final row in salesResponse as List<dynamic>) {
      final map = Map<String, dynamic>.from(row as Map);
      final employeeId = map['employeeId']?.toString();
      if (employeeId == null || employeeId.isEmpty) continue;
      final qty = (map['quantity'] as num?)?.round() ?? 0;
      totals[employeeId] = (totals[employeeId] ?? 0) + qty;
    }

    final employeeIds = totals.keys.toList();
    if (employeeIds.isEmpty) {
      return const <RankingEntry>[];
    }

    final employeeResponse = await _client
        .from('employees')
        .select('id,firstName,lastName')
        .inFilter('id', employeeIds);

    final employeeMap = <String, Map<String, dynamic>>{};
    for (final row in employeeResponse as List<dynamic>) {
      final map = Map<String, dynamic>.from(row as Map);
      employeeMap[map['id'].toString()] = map;
    }

    final entries = totals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final ranking = <RankingEntry>[];
    for (var index = 0; index < entries.length; index++) {
      final employeeId = entries[index].key;
      final employee = employeeMap[employeeId];
      ranking.add(
        RankingEntry(
          name: employee == null
              ? 'Empleado'
              : _joinName(employee['firstName'], employee['lastName']),
          totalSales: entries[index].value,
          position: index + 1,
          isCurrentUser: employeeId == currentEmployeeId,
        ),
      );
    }

    return ranking;
  }

  static Map<ProductType, int> _buildTodaySales(
    List<Map<String, dynamic>> salesRows, {
    required Map<String, ProductType> productTypeById,
    required DateTime? referenceDate,
  }) {
    final result = {
      ProductType.aceite: 0,
      ProductType.snack: 0,
      ProductType.accesorio: 0,
      ProductType.aromatizante: 0,
    };
    if (referenceDate == null) return result;

    for (final row in salesRows) {
      final saleDate = DateTime.tryParse(row['date']?.toString() ?? '');
      if (saleDate == null || !_sameDay(saleDate, referenceDate)) {
        continue;
      }

      final product = productTypeById[row['productId']?.toString() ?? ''];
      if (product == null) continue;

      result[product] =
          (result[product] ?? 0) + ((row['quantity'] as num?)?.round() ?? 0);
    }

    return result;
  }

  static List<double> _buildWeeklyTrend(
    List<Map<String, dynamic>> salesRows, {
    required DateTime? referenceDate,
  }) {
    if (referenceDate == null) {
      return List<double>.filled(7, 0);
    }

    final dailyTotals = <DateTime, double>{};
    for (final row in salesRows) {
      final saleDate = DateTime.tryParse(row['date']?.toString() ?? '');
      if (saleDate == null) continue;
      final normalized = DateTime(saleDate.year, saleDate.month, saleDate.day);
      final daysDiff = referenceDate.difference(normalized).inDays;
      if (daysDiff < 0 || daysDiff > 6) continue;
      dailyTotals[normalized] =
          (dailyTotals[normalized] ?? 0) +
          ((row['quantity'] as num?)?.toDouble() ?? 0);
    }

    return List<double>.generate(7, (index) {
      final day = DateTime(
        referenceDate.year,
        referenceDate.month,
        referenceDate.day,
      ).subtract(Duration(days: 6 - index));
      return dailyTotals[day] ?? 0;
    });
  }

  static List<SaleRecord> _buildSalesHistory(
    List<Map<String, dynamic>> salesRows, {
    required Map<String, ProductType> productTypeById,
    required int limit,
  }) {
    final history = <SaleRecord>[];

    for (final row in salesRows.take(limit)) {
      final product = productTypeById[row['productId']?.toString() ?? ''];
      final timestamp = DateTime.tryParse(row['date']?.toString() ?? '');
      if (product == null || timestamp == null) continue;

      final quantity = ((row['quantity'] as num?)?.round() ?? 1).clamp(1, 99);
      for (var i = 0; i < quantity; i++) {
        history.add(SaleRecord(product: product, timestamp: timestamp));
      }
    }

    return history;
  }

  static List<Badge> _buildBadges({
    required List<Map<String, dynamic>> allDefinitions,
    required List<Map<String, dynamic>> earnedAchievements,
  }) {
    final earnedIds = earnedAchievements
        .map((row) => row['achievementId']?.toString())
        .whereType<String>()
        .toSet();

    return allDefinitions.map((definition) {
      final id = definition['id']?.toString() ?? '';
      final pointValue = (definition['pointValue'] as num?)?.toInt() ?? 0;
      return Badge(
        id: definition['code']?.toString() ?? id,
        name: definition['name']?.toString() ?? 'Logro',
        description: definition['description']?.toString() ?? '',
        tier: pointValue >= 40
            ? BadgeTier.gold
            : pointValue >= 20
            ? BadgeTier.silver
            : BadgeTier.bronze,
        icon: _iconForAchievement(
          definition['code']?.toString() ?? '',
          category: definition['category']?.toString(),
        ),
        unlocked: earnedIds.contains(id),
      );
    }).toList();
  }

  static List<RankingEntry> _ensureCurrentUserRanking(
    UserProfile profile,
    List<RankingEntry> ranking,
  ) {
    if (ranking.any((entry) => entry.isCurrentUser)) {
      return ranking;
    }

    return <RankingEntry>[
      ...ranking,
      RankingEntry(
        name: profile.name,
        totalSales: profile.totalSales,
        position: ranking.length + 1,
        isCurrentUser: true,
      ),
    ];
  }

  static ApiException _mapPostgrestError(PostgrestException error) {
    final message = error.message.toLowerCase();
    if (error.code == '54001' ||
        message.contains('stack depth') ||
        message.contains('max_stack_depth')) {
      return ApiException(
        'Supabase error 54001 (stack depth). Hotfix: en SQL Editor ejecuta: drop policy if exists "mobile_employees_select_station" on public.employees;',
      );
    }

    if (error.code == '42501' || message.contains('permission denied')) {
      return ApiException(
        'Supabase respondió pero el rol del cliente móvil no tiene permisos sobre schema public. Falta habilitar USAGE/SELECT para anon o authenticated.',
      );
    }

    if (error.code == 'PGRST205' || message.contains('schema cache')) {
      return ApiException(
        'La tabla consultada no está expuesta en PostgREST. Revisa la configuración de Supabase.',
      );
    }

    return ApiException(error.message);
  }

  static ProductType? _productTypeFromCategoryName(String? categoryName) {
    final value = categoryName?.toUpperCase() ?? '';
    if (value.contains('AROM')) {
      return ProductType.aromatizante;
    }
    if (value.contains('ACC') || value.contains('OTR')) {
      return ProductType.accesorio;
    }
    if (value.contains('IMP') || value.contains('BUR')) {
      return ProductType.snack;
    }
    if (value.isEmpty) {
      return null;
    }
    return ProductType.aceite;
  }

  static IconData _iconForAchievement(String code, {String? category}) {
    switch (code) {
      case 'first_sale':
        return Icons.star_rounded;
      case 'streak_3':
      case 'streak_7':
      case 'streak_30':
        return Icons.local_fire_department_rounded;
      case 'premium_month':
      case 'top_seller':
        return Icons.workspace_premium_rounded;
      case 'category_master':
        return Icons.school_rounded;
      case 'sales_50':
      case 'sales_10':
        return Icons.emoji_events_rounded;
      case 'attendance_perfect':
        return Icons.task_alt_rounded;
      default:
        if ((category ?? '').contains('attendance')) {
          return Icons.check_circle_rounded;
        }
        return Icons.military_tech_rounded;
    }
  }

  static int _sumSalesQuantity(List<Map<String, dynamic>> salesRows) {
    return salesRows.fold<int>(
      0,
      (sum, row) => sum + ((row['quantity'] as num?)?.round() ?? 0),
    );
  }

  static String _joinName(dynamic firstName, dynamic lastName) {
    final first = firstName?.toString().trim() ?? '';
    final last = lastName?.toString().trim() ?? '';
    return '$first $last'.trim();
  }

  static String _isoDate(DateTime value) => DateTime(
    value.year,
    value.month,
    value.day,
  ).toIso8601String().split('T').first;

  static bool _sameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }

  static Future<List<TrainingVideo>> _fetchTrainingVideosSafe({
    required Set<String> completedVideoIds,
  }) async {
    final rows = await _fetchTrainingVideosRows();
    if (rows.isEmpty) return const <TrainingVideo>[];

    return rows.map((row) {
      final accent = _parseHexColor(
        (row['accentColor'] ?? row['accent_color'])?.toString(),
        fallback: Colors.blueGrey,
      );
      final id = row['id']?.toString() ?? 'video';
      return TrainingVideo(
        id: id,
        title: row['title']?.toString() ?? 'Capacitación',
        subtitle: row['subtitle']?.toString() ?? 'Contenido de capacitación',
        duration: row['duration']?.toString() ?? '5 min',
        xpReward:
            (row['xpReward'] as num?)?.round() ??
            (row['xp_reward'] as num?)?.round() ??
            0,
        completed: completedVideoIds.contains(id),
        accentColor: accent,
        videoUrl: row['videoUrl']?.toString() ?? row['video_url']?.toString(),
      );
    }).toList();
  }

  static Future<List<Map<String, dynamic>>> _fetchTrainingVideosRows() async {
    try {
      final response = await _client
          .from('training_videos')
          .select(
            'id,title,subtitle,duration,xpReward,accentColor,videoUrl,isActive,createdAt',
          )
          .eq('isActive', true)
          .order('createdAt', ascending: false)
          .limit(50);
      return (response as List<dynamic>)
          .map((row) => Map<String, dynamic>.from(row as Map))
          .toList();
    } on PostgrestException catch (error) {
      // Si la tabla no existe o no está expuesta, no romper el dashboard.
      final message = error.message.toLowerCase();
      if (error.code == 'PGRST205' || message.contains('schema cache')) {
        return const <Map<String, dynamic>>[];
      }
      // Fallback: esquema snake_case (demo antiguo)
      return _fetchTrainingVideosRowsSnakeCase();
    } catch (_) {
      return const <Map<String, dynamic>>[];
    }
  }

  static Future<List<Map<String, dynamic>>>
  _fetchTrainingVideosRowsSnakeCase() async {
    try {
      final response = await _client
          .from('training_videos')
          .select('id,title,subtitle,duration,xp_reward,accent_color,video_url')
          .order('created_at', ascending: false)
          .limit(50);

      return (response as List<dynamic>)
          .map((row) => Map<String, dynamic>.from(row as Map))
          .toList();
    } catch (_) {
      return const <Map<String, dynamic>>[];
    }
  }

  static Future<_TrainingProgress> _fetchTrainingProgress(
    String employeeId,
  ) async {
    try {
      final response = await _client
          .from('employee_training')
          .select('videoId,completed,completedAt')
          .eq('employeeId', employeeId)
          .eq('completed', true)
          .limit(200);

      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day);
      final completedVideoIds = <String>{};
      var completedTodayCount = 0;

      for (final row in response as List<dynamic>) {
        final map = Map<String, dynamic>.from(row as Map);
        final videoId = map['videoId']?.toString();
        if (videoId == null || videoId.isEmpty) continue;
        completedVideoIds.add(videoId);
        final completedAt = DateTime.tryParse(
          map['completedAt']?.toString() ?? '',
        );
        if (completedAt != null && completedAt.isAfter(startOfDay)) {
          completedTodayCount++;
        }
      }

      return _TrainingProgress(
        completedVideoIds: completedVideoIds,
        completedTodayCount: completedTodayCount,
      );
    } on PostgrestException {
      return const _TrainingProgress(
        completedVideoIds: <String>{},
        completedTodayCount: 0,
      );
    } catch (_) {
      return const _TrainingProgress(
        completedVideoIds: <String>{},
        completedTodayCount: 0,
      );
    }
  }

  static Color _parseHexColor(String? input, {required Color fallback}) {
    if (input == null) return fallback;
    var value = input.trim();
    if (value.isEmpty) return fallback;
    if (value.startsWith('#')) value = value.substring(1);
    if (value.length == 6) value = 'FF$value';
    if (value.length != 8) return fallback;
    final parsed = int.tryParse(value, radix: 16);
    if (parsed == null) return fallback;
    return Color(parsed);
  }
}

class _TrainingProgress {
  const _TrainingProgress({
    required this.completedVideoIds,
    required this.completedTodayCount,
  });

  final Set<String> completedVideoIds;
  final int completedTodayCount;
}
