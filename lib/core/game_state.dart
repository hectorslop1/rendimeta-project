import 'package:flutter/material.dart' hide Badge;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/haptics.dart';
import '../core/models.dart';
import '../core/ticket_model.dart';
import '../mock_data/mock_data.dart';

class GameState extends ChangeNotifier {
  late UserProfile _profile;
  List<TrainingVideo> _videos = [];
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

  GameState() {
    _profile = MockData.initialProfile;
    _videos = List.from(MockData.trainingVideos);
    _clearPersistedData();
  }

  Future<void> _clearPersistedData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('xp');
    await prefs.remove('total_sales');
    await prefs.remove('streak');
    await prefs.remove('completed_trainings');
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

  UserProfile get profile => _profile;
  List<TrainingVideo> get videos => _videos;
  List<RankingEntry> get ranking => MockData.weeklyRanking;
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

  // Mock weekly trend data (sales per day: Mon-today)
  List<double> get weeklyTrend => const [4, 7, 5, 8, 6, 9, 0];
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
    final idx =
        DateTime.now().millisecond % MockData.motivationalPhrases.length;
    return MockData.motivationalPhrases[idx];
  }

  String get coachMessage {
    final hour = DateTime.now().hour;
    final total = _profile.todayTotalSales;
    if (total == 0 && hour > 9) {
      return '${_profile.name}, aun no has registrado ventas. Los primeros clientes de la manana suelen estar mas abiertos a ofertas.';
    }
    if (hour >= 14 && hour <= 17) {
      return '${_profile.name}, las tardes son el mejor momento para ofrecer aromatizantes. Los clientes buscan algo extra.';
    }
    if (total >= 8) {
      return 'Llevas $total ventas hoy, vas muy bien! Sigue con ese ritmo para alcanzar el Top 3.';
    }
    final bestProduct = _getBestProductToday();
    if (bestProduct != null) {
      return 'Tu fuerte hoy son los ${bestProduct.label.toLowerCase()}s. Intenta diversificar ofreciendo otros productos.';
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

    _checkBadges();
    _generateFeedback(product);
    _checkAllMissionsCompleted();
    _simulateSync();
    _persist();
    notifyListeners();
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

    // Simulate validation after delay
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
    _simulateSync();
    _persist();
    notifyListeners();
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
    if (_allMissionsRewardClaimed) return;
    final allDone = _profile.missions.every((m) => m.isCompleted);
    if (allDone) {
      // Delay slightly so single-mission celebration shows first
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
    _persist();
    notifyListeners();
  }

  void dismissAllMissionsReward() {
    _showAllMissionsReward = false;
    notifyListeners();
  }

  void simulateRefresh() {
    _isSyncing = true;
    notifyListeners();
    Future.delayed(const Duration(milliseconds: 1200), () {
      _isSyncing = false;
      _unreadChatCount = 1;
      notifyListeners();
    });
  }

  void _simulateSync() {
    _isSyncing = true;
    notifyListeners();
    Future.delayed(const Duration(milliseconds: 1500), () {
      _isSyncing = false;
      notifyListeners();
    });
  }

  void _checkBadges() {
    final newBadges = _profile.badges.map((badge) {
      if (badge.unlocked) return badge;
      switch (badge.id) {
        case 'sales_100':
          if (_profile.totalSales >= 100) return badge.copyWith(unlocked: true);
        case 'streak_7':
          if (_profile.streak >= 7) return badge.copyWith(unlocked: true);
      }
      return badge;
    }).toList();
    _profile = _profile.copyWith(badges: newBadges);
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
      return 'Aun no registras ventas hoy';
    }
    final pending = pendingMissionsCount;
    if (pending > 0) {
      final mission = _profile.missions.firstWhere((m) => !m.isCompleted);
      final remaining = mission.target - mission.current;
      return 'Te faltan $remaining ventas para tu meta';
    }
    return null;
  }
}
