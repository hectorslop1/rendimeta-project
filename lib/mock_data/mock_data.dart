import 'package:flutter/material.dart' hide Badge;
import '../core/models.dart';

class MockData {
  MockData._();

  static const List<Badge> allBadges = [
    Badge(
      id: 'first_sale',
      name: 'Primera Venta',
      description: 'Registra tu primera venta',
      tier: BadgeTier.bronze,
      icon: Icons.star_rounded,
      unlocked: true,
    ),
    Badge(
      id: 'streak_3',
      name: 'Racha de 3',
      description: '3 dias consecutivos activo',
      tier: BadgeTier.bronze,
      icon: Icons.local_fire_department_rounded,
      unlocked: true,
    ),
    Badge(
      id: 'oil_master',
      name: 'Maestro del Aceite',
      description: 'Vende 50 aceites',
      tier: BadgeTier.silver,
      icon: Icons.opacity_rounded,
      unlocked: true,
    ),
    Badge(
      id: 'streak_7',
      name: 'Racha de 7',
      description: '7 dias consecutivos activo',
      tier: BadgeTier.silver,
      icon: Icons.bolt_rounded,
      unlocked: false,
    ),
    Badge(
      id: 'sales_100',
      name: 'Centenario',
      description: 'Registra 100 ventas totales',
      tier: BadgeTier.gold,
      icon: Icons.emoji_events_rounded,
      unlocked: false,
    ),
    Badge(
      id: 'training_5',
      name: 'Estudiante Dedicado',
      description: 'Completa 5 capacitaciones',
      tier: BadgeTier.bronze,
      icon: Icons.school_rounded,
      unlocked: true,
    ),
    Badge(
      id: 'snack_pro',
      name: 'Snack Pro',
      description: 'Vende 30 snacks en una semana',
      tier: BadgeTier.silver,
      icon: Icons.fastfood_rounded,
      unlocked: false,
    ),
    Badge(
      id: 'top_3',
      name: 'Top 3',
      description: 'Llega al Top 3 del ranking',
      tier: BadgeTier.gold,
      icon: Icons.workspace_premium_rounded,
      unlocked: false,
    ),
    Badge(
      id: 'all_missions',
      name: 'Mision Cumplida',
      description: 'Completa todas las misiones del dia',
      tier: BadgeTier.bronze,
      icon: Icons.task_alt_rounded,
      unlocked: true,
    ),
  ];

  static const List<DailyMission> dailyMissions = [
    DailyMission(
      id: 'mission_1',
      description: 'Vende 3 aceites',
      product: ProductType.aceite,
      target: 3,
      current: 1,
      xpReward: 25,
    ),
    DailyMission(
      id: 'mission_2',
      description: 'Ofrece 5 aromatizantes',
      product: ProductType.aromatizante,
      target: 5,
      current: 2,
      xpReward: 30,
    ),
    DailyMission(
      id: 'mission_3',
      description: 'Completa 1 capacitacion',
      product: null,
      target: 1,
      current: 0,
      xpReward: 15,
    ),
  ];

  static List<TrainingVideo> trainingVideos = [
    const TrainingVideo(
      id: 'v1',
      title: 'Tecnica de venta cruzada',
      subtitle: 'Aprende a ofrecer productos complementarios',
      duration: '0:45',
      xpReward: 10,
      completed: true,
      accentColor: Color(0xFFE6007A),
    ),
    const TrainingVideo(
      id: 'v2',
      title: 'Manejo de objeciones',
      subtitle: 'Responde con confianza a los clientes',
      duration: '1:20',
      xpReward: 15,
      accentColor: Color(0xFF7A28FF),
    ),
    const TrainingVideo(
      id: 'v3',
      title: 'Conoce los aceites premium',
      subtitle: 'Diferencias entre marcas y viscosidades',
      duration: '0:55',
      xpReward: 10,
      accentColor: Color(0xFF2DE2E2),
    ),
    const TrainingVideo(
      id: 'v4',
      title: 'Atencion al cliente 5 estrellas',
      subtitle: 'Haz que cada cliente regrese',
      duration: '1:10',
      xpReward: 15,
      accentColor: Color(0xFFFFAA5E),
    ),
    const TrainingVideo(
      id: 'v5',
      title: 'Aromatizantes: guia rapida',
      subtitle: 'Conoce fragancias y presentaciones',
      duration: '0:35',
      xpReward: 10,
      accentColor: Color(0xFFE6007A),
    ),
    const TrainingVideo(
      id: 'v6',
      title: 'Seguridad en estacion',
      subtitle: 'Protocolo basico de seguridad',
      duration: '1:30',
      xpReward: 20,
      accentColor: Color(0xFF7A28FF),
    ),
  ];

  static const List<RankingEntry> weeklyRanking = [
    RankingEntry(name: 'Carlos M.', totalSales: 47, position: 1),
    RankingEntry(name: 'Ana R.', totalSales: 42, position: 2),
    RankingEntry(
      name: 'Luis G.',
      totalSales: 38,
      position: 3,
      isCurrentUser: true,
    ),
    RankingEntry(name: 'Maria T.', totalSales: 35, position: 4),
    RankingEntry(name: 'Pedro S.', totalSales: 31, position: 5),
    RankingEntry(name: 'Sofia L.', totalSales: 28, position: 6),
    RankingEntry(name: 'Diego F.', totalSales: 25, position: 7),
    RankingEntry(name: 'Laura P.', totalSales: 22, position: 8),
    RankingEntry(name: 'Jorge H.', totalSales: 19, position: 9),
    RankingEntry(name: 'Elena V.', totalSales: 16, position: 10),
  ];

  static UserProfile initialProfile = UserProfile(
    name: 'Luis',
    station: 'Estacion Reforma #42',
    xp: 215,
    streak: 5,
    totalSales: 87,
    todaySales: const {
      ProductType.aceite: 1,
      ProductType.snack: 3,
      ProductType.accesorio: 0,
      ProductType.aromatizante: 2,
    },
    badges: allBadges,
    missions: dailyMissions,
    salesHistory: const [],
  );

  static const List<String> motivationalPhrases = [
    'Cada venta cuenta, sigue asi',
    'Hoy es un gran dia para superar tu meta',
    'Tu esfuerzo se nota en los numeros',
    'Vas por buen camino',
    'La constancia te lleva lejos',
  ];

  static const List<String> feedbackMessages = [
    'Hoy vendiste menos aceites que ayer',
    'Tu fuerte son los snacks, sigue asi',
    'Llevas 5 dias seguidos cumpliendo metas',
  ];
}
