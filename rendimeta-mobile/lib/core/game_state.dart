import 'dart:async';

import 'package:flutter/material.dart' hide Badge;
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';
import 'haptics.dart';
import 'models.dart';
import 'ticket_model.dart';

class GameState extends ChangeNotifier {
  GameState() {
    unawaited(_bootstrap());
  }

  static const List<String> _motivationalPhrases = [
    'Cada venta cuenta, sigue asi',
    'Hoy es un gran dia para superar tu meta',
    'Tu esfuerzo se nota en los numeros',
    'Vas por buen camino',
    'La constancia te lleva lejos',
  ];

  UserProfile _profile = const UserProfile(
    name: 'Cargando',
    station: 'Sin estación',
    xp: 0,
    streak: 0,
    totalSales: 0,
    todaySales: <ProductType, int>{
      ProductType.aceite: 0,
      ProductType.snack: 0,
      ProductType.accesorio: 0,
      ProductType.aromatizante: 0,
    },
    badges: <Badge>[],
    missions: <DailyMission>[],
    salesHistory: <SaleRecord>[],
  );
  List<TrainingVideo> _videos = const <TrainingVideo>[];
  List<RankingEntry> _ranking = const <RankingEntry>[];
  List<double> _weeklyTrend = List<double>.filled(7, 0);
  String? _lastFeedback;
  bool _showCelebration = false;
  String _celebrationMessage = '';
  final List<TicketRecord> _tickets = [];
  bool _isSyncing = false;
  final bool _isOnline = true;
  int _unreadChatCount = 1;
  bool _showValidationAnimation = false;
  bool _showAllMissionsReward = false;
  bool _allMissionsRewardClaimed = false;
  bool _isLoading = true;
  String? _loadError;
  DateTime? _dataAsOf;
  String? _employeeId;
  String? _stationId;

  Future<void> _bootstrap() async {
    await loadDashboardData();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('xp', _profile.xp);
    await prefs.setInt('total_sales', _profile.totalSales);
    await prefs.setInt('streak', _profile.streak);
    await prefs.setStringList(
      'completed_trainings',
      _videos.where((v) => v.completed).map((v) => v.id).toList(),
    );
  }

  Future<void> loadDashboardData({bool showSyncIndicator = false}) async {
    if (showSyncIndicator) {
      _isSyncing = true;
    } else {
      _isLoading = true;
    }
    _loadError = null;
    notifyListeners();

    try {
      final snapshot = await MobileDashboardService.loadDashboard();
      _profile = snapshot.profile;
      _videos = snapshot.videos;
      await _hydrateTrainingCompletionFromPrefs();
      _ranking = snapshot.ranking;
      _weeklyTrend = snapshot.weeklyTrend;
      _dataAsOf = snapshot.asOf;
      _employeeId = snapshot.employeeId;
      _stationId = snapshot.stationId;
      _lastFeedback = null;
    } catch (error) {
      _loadError = _friendlyLoadError(error);
    } finally {
      _isLoading = false;
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> _hydrateTrainingCompletionFromPrefs() async {
    if (_videos.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final completed =
        prefs.getStringList('completed_trainings') ?? const <String>[];
    if (completed.isEmpty) return;
    final completedSet = completed.toSet();
    _videos = _videos
        .map(
          (v) => completedSet.contains(v.id) ? v.copyWith(completed: true) : v,
        )
        .toList();
  }

  UserProfile get profile => _profile;
  List<TrainingVideo> get videos => _videos;
  List<RankingEntry> get ranking => _ranking;
  String? get lastFeedback => _lastFeedback;
  bool get showCelebration => _showCelebration;
  String get celebrationMessage => _celebrationMessage;
  bool get showValidationAnimation => _showValidationAnimation;
  bool get showAllMissionsReward => _showAllMissionsReward;
  List<TicketRecord> get tickets => List.unmodifiable(_tickets);
  List<TicketRecord> get pendingTickets =>
      _tickets.where((t) => t.status == TicketStatus.pending).toList();
  bool get isSyncing => _isSyncing;
  bool get isOnline => _isOnline;
  int get unreadChatCount => _unreadChatCount;
  bool get isLoading => _isLoading;
  String? get loadError => _loadError;
  DateTime? get dataAsOf => _dataAsOf;
  String? get backendEmployeeId => _employeeId;
  String? get backendStationId => _stationId;

  List<double> get weeklyTrend => _weeklyTrend;
  double get weeklyAverage {
    final data = weeklyTrend.where((d) => d > 0);
    if (data.isEmpty) return 0;
    return data.reduce((a, b) => a + b) / data.length;
  }

  String get greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  String get motivationalPhrase {
    final idx = DateTime.now().millisecond % _motivationalPhrases.length;
    return _motivationalPhrases[idx];
  }

  String get coachMessage {
    if (_loadError != null && _loadError!.trim().isNotEmpty) {
      // Nunca mostrar detalles técnicos al usuario final.
      return 'Estoy teniendo problemas para cargar tu tablero. Desliza hacia abajo para reintentar.';
    }

    final hour = DateTime.now().hour;
    final total = _profile.todayTotalSales;
    if (total == 0 && hour > 9) {
      return '${_profile.name}, aun no encuentro ventas recientes para tu tablero. En cuanto carguen los datos, te doy recomendaciones puntuales.';
    }
    if (hour >= 14 && hour <= 17) {
      return '${_profile.name}, las tardes son el mejor momento para ofrecer aromatizantes. Los clientes buscan algo extra.';
    }
    if (total >= 8) {
      return 'Llevas $total ventas en el corte cargado, vas muy bien. Sigue con ese ritmo para escalar posiciones.';
    }
    final bestProduct = _getBestProductToday();
    if (bestProduct != null) {
      return 'Tu fuerte en el corte actual son los ${bestProduct.label.toLowerCase()}s. Intenta diversificar ofreciendo otros productos.';
    }
    return 'Cada cliente es una oportunidad. Ofrece siempre algo adicional al despachar.';
  }

  ProductType? _getBestProductToday() {
    ProductType? best;
    int bestCount = 0;
    for (final entry in _profile.todaySales.entries) {
      if (entry.value > bestCount) {
        bestCount = entry.value;
        best = entry.key;
      }
    }
    return bestCount > 0 ? best : null;
  }

  void clearUnreadChat() {
    _unreadChatCount = 0;
    notifyListeners();
  }

  void registerSale(ProductType product) {
    Haptics.sale();

    final newTodaySales = Map<ProductType, int>.from(_profile.todaySales);
    newTodaySales[product] = (newTodaySales[product] ?? 0) + 1;

    final newSalesHistory = List<SaleRecord>.from(_profile.salesHistory)
      ..add(SaleRecord(product: product, timestamp: DateTime.now()));

    int xpGain = 5;
    _bumpWeeklyTrend(1);

    final newMissions = _profile.missions.map((mission) {
      if (mission.product == product && !mission.isCompleted) {
        final updated = mission.copyWith(current: mission.current + 1);
        if (updated.isCompleted) {
          xpGain += mission.xpReward;
          _triggerCelebration('Mision completada! +${mission.xpReward} XP');
        }
        return updated;
      }
      return mission;
    }).toList();

    final oldLevel = _profile.level;

    _profile = _profile.copyWith(
      xp: _profile.xp + xpGain,
      totalSales: _profile.totalSales + 1,
      todaySales: newTodaySales,
      missions: newMissions,
      salesHistory: newSalesHistory,
    );

    if (_profile.level != oldLevel) {
      Haptics.levelUp();
      _triggerCelebration('Subiste a ${_profile.level.title}!');
    }

    _generateFeedback(product);
    _checkAllMissionsCompleted();
    _simulateSync();
    unawaited(_recordSaleToBackend(product));
    unawaited(_persist());
    notifyListeners();
  }

  void _bumpWeeklyTrend(double delta) {
    if (_weeklyTrend.isEmpty) {
      _weeklyTrend = List<double>.filled(7, 0);
    }
    if (_weeklyTrend.length < 7) {
      _weeklyTrend = List<double>.from(_weeklyTrend)
        ..addAll(List<double>.filled(7 - _weeklyTrend.length, 0));
    }
    final copy = List<double>.from(_weeklyTrend);
    copy[copy.length - 1] = (copy.last + delta).clamp(0, 9999);
    _weeklyTrend = copy;
  }

  Future<void> _recordSaleToBackend(ProductType product) async {
    final employeeId = _employeeId;
    final stationId = _stationId;
    if (employeeId == null ||
        employeeId.trim().isEmpty ||
        stationId == null ||
        stationId.trim().isEmpty) {
      return;
    }

    try {
      await MobileSalesService.recordSale(
        employeeId: employeeId,
        stationId: stationId,
        productType: product,
      );
      unawaited(loadDashboardData(showSyncIndicator: true));
    } catch (error) {
      debugPrint('GameState.recordSale backend error=$error');
    }
  }

  void registerSaleWithTicket(ProductType product) {
    final ticket = TicketRecord(
      id: 'T${DateTime.now().millisecondsSinceEpoch}',
      product: product,
      timestamp: DateTime.now(),
      status: TicketStatus.pending,
    );
    _tickets.insert(0, ticket);
    notifyListeners();

    Future.delayed(const Duration(seconds: 4), () {
      final idx = _tickets.indexWhere((t) => t.id == ticket.id);
      if (idx != -1) {
        _tickets[idx] = _tickets[idx].copyWith(status: TicketStatus.validated);
        _showValidationAnimation = true;
        registerSale(product);
        Haptics.success();
        notifyListeners();
      }
    });
  }

  void dismissValidationAnimation() {
    _showValidationAnimation = false;
    notifyListeners();
  }

  void completeTraining(String videoId) {
    Haptics.success();

    final idx = _videos.indexWhere((v) => v.id == videoId);
    if (idx == -1 || _videos[idx].completed) return;

    final video = _videos[idx];
    _videos[idx] = video.copyWith(completed: true);

    final newMissions = _profile.missions.map((mission) {
      if (mission.product == null && !mission.isCompleted) {
        final updated = mission.copyWith(current: mission.current + 1);
        if (updated.isCompleted) {
          _triggerCelebration('Mision completada! +${mission.xpReward} XP');
          _profile = _profile.copyWith(xp: _profile.xp + mission.xpReward);
        }
        return updated;
      }
      return mission;
    }).toList();

    _profile = _profile.copyWith(
      xp: _profile.xp + video.xpReward,
      missions: newMissions,
    );

    _triggerCelebration('+${video.xpReward} XP');
    _checkAllMissionsCompleted();
    unawaited(_completeTrainingInBackend(video));
    unawaited(_persist());
    notifyListeners();
  }

  Future<void> _completeTrainingInBackend(TrainingVideo video) async {
    final employeeId = _employeeId;
    if (employeeId == null || employeeId.trim().isEmpty) return;
    try {
      await MobileTrainingService.completeTraining(
        employeeId: employeeId,
        videoId: video.id,
        xpReward: video.xpReward,
      );
      unawaited(loadDashboardData(showSyncIndicator: true));
    } catch (error) {
      debugPrint('GameState.completeTraining backend error=$error');
    }
  }

  void dismissCelebration() {
    _showCelebration = false;
    notifyListeners();
  }

  void _triggerCelebration(String message) {
    _showCelebration = true;
    _celebrationMessage = message;
    Haptics.celebration();
  }

  void _checkAllMissionsCompleted() {
    if (_allMissionsRewardClaimed || _profile.missions.isEmpty) return;
    final allDone = _profile.missions.every((m) => m.isCompleted);
    if (allDone) {
      Future.delayed(const Duration(milliseconds: 3500), () {
        _showAllMissionsReward = true;
        notifyListeners();
      });
    }
  }

  void claimAllMissionsReward() {
    Haptics.giftOpen();
    _showAllMissionsReward = false;
    _allMissionsRewardClaimed = true;
    _profile = _profile.copyWith(xp: _profile.xp + 50);
    _triggerCelebration('Ganaste 50 XP de regalo!');
    unawaited(_persist());
    notifyListeners();
  }

  void dismissAllMissionsReward() {
    _showAllMissionsReward = false;
    notifyListeners();
  }

  void simulateRefresh() {
    _unreadChatCount = 1;
    unawaited(loadDashboardData(showSyncIndicator: true));
  }

  void _simulateSync() {
    _isSyncing = true;
    notifyListeners();
    Future.delayed(const Duration(milliseconds: 1500), () {
      _isSyncing = false;
      notifyListeners();
    });
  }

  void _generateFeedback(ProductType product) {
    final sales = _profile.todaySales[product] ?? 0;
    if (sales == 5) {
      _lastFeedback = 'Llevas 5 ${product.label.toLowerCase()}s hoy!';
    } else if (sales == 1) {
      _lastFeedback = 'Primera venta de ${product.label.toLowerCase()} del dia';
    } else {
      _lastFeedback = null;
    }
  }

  int get pendingMissionsCount =>
      _profile.missions.where((m) => !m.isCompleted).length;

  bool get hasUnregisteredSalesToday => _profile.todayTotalSales == 0;

  String? get alertMessage {
    if (hasUnregisteredSalesToday) {
      return 'Aun no registras ventas en el corte cargado';
    }
    final pending = pendingMissionsCount;
    if (pending > 0) {
      final mission = _profile.missions.firstWhere((m) => !m.isCompleted);
      final remaining = mission.target - mission.current;
      return 'Te faltan $remaining ventas para tu meta';
    }
    return null;
  }

  String _friendlyLoadError(Object error) {
    debugPrint('GameState.loadDashboardData error=$error');
    if (error is ApiException) {
      final message = error.message.trim();
      if (message.isNotEmpty) {
        if (message.length <= 220) {
          return message;
        }
        return '${message.substring(0, 217)}...';
      }
    }

    final raw = error.toString().toLowerCase();
    if (raw.contains('permission') || raw.contains('denied')) {
      return 'No tengo permisos para cargar tus datos. Ejecuta el script de bootstrap de Supabase (RLS/GRANT) y reintenta.';
    }
    if (raw.contains('schema cache') || raw.contains('pgrst205')) {
      return 'La base de datos no expone una tabla necesaria para el dashboard. Revisa el esquema de Supabase.';
    }

    return 'No se pudieron cargar tus datos del servidor.';
  }
}
