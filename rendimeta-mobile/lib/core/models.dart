import 'package:flutter/material.dart';

enum UserLevel {
  novato(0, 'Novato', 0),
  vendedorActivo(1, 'Vendedor Activo', 100),
  expertoPiso(2, 'Experto en Piso', 350),
  maestroVentas(3, 'Maestro de Ventas', 800);

  final int index_;
  final String title;
  final int xpRequired;

  const UserLevel(this.index_, this.title, this.xpRequired);
}

enum ProductType {
  aceite('Aceite', Icons.opacity_rounded, Color(0xFFE6007A)),
  snack('Snack', Icons.fastfood_rounded, Color(0xFF7A28FF)),
  accesorio('Accesorio', Icons.auto_awesome_rounded, Color(0xFF2DE2E2)),
  aromatizante('Aromatizante', Icons.air_rounded, Color(0xFFFFAA5E));

  final String label;
  final IconData icon;
  final Color color;

  const ProductType(this.label, this.icon, this.color);
}

enum BadgeTier { bronze, silver, gold }

class Badge {
  final String id;
  final String name;
  final String description;
  final BadgeTier tier;
  final IconData icon;
  final bool unlocked;

  const Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.tier,
    required this.icon,
    this.unlocked = false,
  });

  Badge copyWith({bool? unlocked}) => Badge(
        id: id,
        name: name,
        description: description,
        tier: tier,
        icon: icon,
        unlocked: unlocked ?? this.unlocked,
      );
}

class DailyMission {
  final String id;
  final String description;
  final ProductType? product;
  final int target;
  final int current;
  final int xpReward;

  const DailyMission({
    required this.id,
    required this.description,
    this.product,
    required this.target,
    this.current = 0,
    required this.xpReward,
  });

  bool get isCompleted => current >= target;
  double get progress => (current / target).clamp(0.0, 1.0);

  DailyMission copyWith({int? current}) => DailyMission(
        id: id,
        description: description,
        product: product,
        target: target,
        current: current ?? this.current,
        xpReward: xpReward,
      );
}

class SaleRecord {
  final ProductType product;
  final DateTime timestamp;

  const SaleRecord({required this.product, required this.timestamp});
}

class TrainingVideo {
  final String id;
  final String title;
  final String subtitle;
  final String duration;
  final int xpReward;
  final bool completed;
  final Color accentColor;

  const TrainingVideo({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.duration,
    required this.xpReward,
    this.completed = false,
    required this.accentColor,
  });

  TrainingVideo copyWith({bool? completed}) => TrainingVideo(
        id: id,
        title: title,
        subtitle: subtitle,
        duration: duration,
        xpReward: xpReward,
        completed: completed ?? this.completed,
        accentColor: accentColor,
      );
}

class RankingEntry {
  final String name;
  final int totalSales;
  final int position;
  final bool isCurrentUser;

  const RankingEntry({
    required this.name,
    required this.totalSales,
    required this.position,
    this.isCurrentUser = false,
  });
}

class UserProfile {
  final String name;
  final String station;
  final int xp;
  final int streak;
  final int totalSales;
  final Map<ProductType, int> todaySales;
  final List<Badge> badges;
  final List<DailyMission> missions;
  final List<SaleRecord> salesHistory;

  const UserProfile({
    required this.name,
    required this.station,
    required this.xp,
    required this.streak,
    required this.totalSales,
    required this.todaySales,
    required this.badges,
    required this.missions,
    required this.salesHistory,
  });

  UserLevel get level {
    if (xp >= UserLevel.maestroVentas.xpRequired) return UserLevel.maestroVentas;
    if (xp >= UserLevel.expertoPiso.xpRequired) return UserLevel.expertoPiso;
    if (xp >= UserLevel.vendedorActivo.xpRequired) return UserLevel.vendedorActivo;
    return UserLevel.novato;
  }

  UserLevel? get nextLevel {
    final idx = level.index_;
    if (idx >= UserLevel.values.length - 1) return null;
    return UserLevel.values[idx + 1];
  }

  double get levelProgress {
    final next = nextLevel;
    if (next == null) return 1.0;
    final currentLevelXp = level.xpRequired;
    final nextLevelXp = next.xpRequired;
    return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)).clamp(0.0, 1.0);
  }

  int get todayTotalSales => todaySales.values.fold(0, (a, b) => a + b);

  UserProfile copyWith({
    int? xp,
    int? streak,
    int? totalSales,
    Map<ProductType, int>? todaySales,
    List<Badge>? badges,
    List<DailyMission>? missions,
    List<SaleRecord>? salesHistory,
  }) =>
      UserProfile(
        name: name,
        station: station,
        xp: xp ?? this.xp,
        streak: streak ?? this.streak,
        totalSales: totalSales ?? this.totalSales,
        todaySales: todaySales ?? this.todaySales,
        badges: badges ?? this.badges,
        missions: missions ?? this.missions,
        salesHistory: salesHistory ?? this.salesHistory,
      );
}
