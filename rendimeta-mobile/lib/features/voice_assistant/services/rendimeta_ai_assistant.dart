import '../../../core/models.dart';
import '../domain/rendimeta_assistant_snapshot.dart';

class RendimetaAiAssistant {
  String generateReply({
    required String prompt,
    required RendimetaAssistantSnapshot snapshot,
  }) {
    final normalized = _normalize(prompt);
    final requestedProducts = _extractProducts(normalized);
    final sections = <String>[];

    if (normalized.isEmpty) {
      return _buildGreeting(snapshot);
    }

    final wantsGreeting = _containsAny(normalized, const [
      'hola',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'hey',
    ]);
    final wantsSummary = _containsAny(normalized, const [
      'resumen',
      'como voy',
      'como vamos',
      'estatus',
      'status',
      'panorama',
      'overview',
    ]);
    final wantsGoals = _containsAny(normalized, const [
      'meta',
      'metas',
      'mision',
      'misiones',
      'objetivo',
      'objetivos',
      'cuanto me falta',
      'que me falta',
    ]);
    final wantsSales =
        _containsAny(normalized, const [
          'venta',
          'ventas',
          'vendi',
          'vendi hoy',
          'llevo',
          'hice hoy',
          'registro',
        ]) ||
        requestedProducts.isNotEmpty;
    final wantsRanking = _containsAny(normalized, const [
      'ranking',
      'top',
      'posicion',
      'puesto',
      'tabla',
      'lider',
    ]);
    final wantsLevel = _containsAny(normalized, const [
      'xp',
      'nivel',
      'racha',
      'insignia',
      'badge',
      'badges',
      'logro',
    ]);
    final wantsTraining = _containsAny(normalized, const [
      'capacit',
      'curso',
      'video',
      'entrenamiento',
      'training',
    ]);
    final wantsRecommendations = _containsAny(normalized, const [
      'recomienda',
      'recomendacion',
      'sugiere',
      'que ofrezco',
      'que vendo',
      'prioridad',
      'conviene',
      'ayudame',
      'coach',
    ]);
    final wantsTickets = _containsAny(normalized, const [
      'ticket',
      'tickets',
      'validacion',
      'pendiente',
      'pendientes',
    ]);

    if (wantsGreeting &&
        !(wantsSummary ||
            wantsGoals ||
            wantsSales ||
            wantsRanking ||
            wantsLevel ||
            wantsTraining ||
            wantsRecommendations ||
            wantsTickets)) {
      return _buildGreeting(snapshot);
    }

    if (wantsSummary || !_hasSpecificIntent(normalized)) {
      sections.add(_buildOverview(snapshot));
    }
    if (wantsGoals) {
      sections.add(_buildGoalStatus(snapshot, requestedProducts));
    }
    if (wantsSales) {
      sections.add(_buildSalesStatus(snapshot, requestedProducts));
    }
    if (wantsRanking) {
      sections.add(_buildRankingStatus(snapshot));
    }
    if (wantsLevel) {
      sections.add(_buildLevelStatus(snapshot));
    }
    if (wantsTraining) {
      sections.add(_buildTrainingStatus(snapshot));
    }
    if (wantsTickets) {
      sections.add(_buildTicketStatus(snapshot));
    }

    if ((wantsRecommendations || sections.isEmpty) && sections.length < 3) {
      sections.add(_buildRecommendation(snapshot));
    }

    if (sections.isEmpty) {
      return _buildFallback(snapshot);
    }

    return _dedupe(sections).take(3).join(' ');
  }

  bool _hasSpecificIntent(String normalizedPrompt) {
    return _containsAny(normalizedPrompt, const [
      'meta',
      'mision',
      'objetivo',
      'venta',
      'vendi',
      'ranking',
      'puesto',
      'nivel',
      'xp',
      'racha',
      'insignia',
      'badge',
      'capacit',
      'video',
      'ticket',
      'pendiente',
      'recomienda',
      'sugiere',
      'coach',
      'resumen',
      'como voy',
      'como vamos',
    ]);
  }

  String _buildGreeting(RendimetaAssistantSnapshot snapshot) {
    return 'Hola ${snapshot.profile.name}, soy RendiCoach. '
        '${_buildOverview(snapshot)} '
        'Puedes preguntarme por tus metas, ventas, ranking o que conviene ofrecer ahorita.';
  }

  String _buildOverview(RendimetaAssistantSnapshot snapshot) {
    final profile = snapshot.profile;
    final pendingMission = profile.missions.cast<DailyMission?>().firstWhere(
      (mission) => mission != null && !mission.isCompleted,
      orElse: () => null,
    );
    final salesSummary = _salesBreakdown(profile.todaySales);
    final missionText = pendingMission == null
        ? 'Ya completaste todas tus metas del dia.'
        : 'Tu meta mas cercana es ${pendingMission.description.toLowerCase()} y te faltan ${pendingMission.target - pendingMission.current}.';

    return 'Hoy llevas ${profile.todayTotalSales} ventas registradas: $salesSummary. '
        '$missionText '
        'Vas en ${profile.level.title} con ${profile.xp} XP y una racha de ${profile.streak} dias.';
  }

  String _buildGoalStatus(
    RendimetaAssistantSnapshot snapshot,
    List<ProductType> requestedProducts,
  ) {
    final profile = snapshot.profile;
    final missions = requestedProducts.isEmpty
        ? profile.missions
        : profile.missions
              .where(
                (mission) =>
                    mission.product == null ||
                    requestedProducts.contains(mission.product),
              )
              .toList();

    if (missions.isEmpty) {
      return 'No encontré una meta directa para ese producto, pero sí puedo decirte cuánto llevas vendido y qué conviene empujar.';
    }

    final parts = missions.map((mission) {
      final remaining = (mission.target - mission.current).clamp(
        0,
        mission.target,
      );
      if (mission.isCompleted) {
        return '${mission.description}: completada, ya aseguraste ${mission.xpReward} XP.';
      }
      return '${mission.description}: llevas ${mission.current} de ${mission.target}, te faltan $remaining.';
    }).toList();

    return parts.join(' ');
  }

  String _buildSalesStatus(
    RendimetaAssistantSnapshot snapshot,
    List<ProductType> requestedProducts,
  ) {
    final todaySales = snapshot.profile.todaySales;
    if (requestedProducts.isNotEmpty) {
      final parts = requestedProducts.map((product) {
        final total = todaySales[product] ?? 0;
        return 'Hoy llevas $total ${_pluralizeProduct(product, total)}.';
      }).toList();
      return parts.join(' ');
    }

    final bestProduct = snapshot.bestProductToday;
    final salesSummary = _salesBreakdown(todaySales);
    final bestProductText = bestProduct == null
        ? 'Aun no hay un producto dominante.'
        : 'Tu producto mas fuerte hoy es ${bestProduct.label.toLowerCase()}.';

    return 'Tus ventas de hoy van asi: $salesSummary. '
        '$bestProductText '
        'Tu promedio semanal va en ${snapshot.weeklyAverage.toStringAsFixed(1)} ventas por dia.';
  }

  String _buildRankingStatus(RendimetaAssistantSnapshot snapshot) {
    final current = snapshot.currentRankingEntry;
    if (current == null) {
      return 'Todavia no tengo tu posicion exacta en el ranking, pero si quieres te doy una lectura general de tus metas y ventas.';
    }

    final ahead = snapshot.ranking
        .where((entry) => entry.position == current.position - 1)
        .cast<RankingEntry?>()
        .firstWhere((entry) => entry != null, orElse: () => null);
    final behind = snapshot.ranking
        .where((entry) => entry.position == current.position + 1)
        .cast<RankingEntry?>()
        .firstWhere((entry) => entry != null, orElse: () => null);

    final aheadText = ahead == null
        ? 'Vas liderando la tabla.'
        : 'Te separan ${ahead.totalSales - current.totalSales} ventas del lugar ${ahead.position}.';
    final behindText = behind == null
        ? ''
        : 'Llevas ${current.totalSales - behind.totalSales} ventas de ventaja sobre ${behind.name}.';

    return 'Estas en el lugar ${current.position} del ranking con ${current.totalSales} ventas acumuladas. '
        '$aheadText '
        '$behindText';
  }

  String _buildLevelStatus(RendimetaAssistantSnapshot snapshot) {
    final profile = snapshot.profile;
    final nextLevel = profile.nextLevel;
    final nextLevelText = nextLevel == null
        ? 'Ya alcanzaste el nivel mas alto disponible.'
        : 'Te faltan ${nextLevel.xpRequired - profile.xp} XP para llegar a ${nextLevel.title}.';

    return 'Vas en ${profile.level.title} con ${profile.xp} XP y una racha de ${profile.streak} dias. '
        '$nextLevelText '
        'Tienes ${snapshot.completedBadgesCount} insignias desbloqueadas.';
  }

  String _buildTrainingStatus(RendimetaAssistantSnapshot snapshot) {
    final pendingVideo = snapshot.videos.cast<TrainingVideo?>().firstWhere(
      (video) => video != null && !video.completed,
      orElse: () => null,
    );

    if (pendingVideo == null) {
      return 'Ya completaste todas las capacitaciones disponibles. Buen trabajo.';
    }

    return 'Llevas ${snapshot.completedTrainingCount} capacitaciones completadas. '
        'La siguiente recomendada es ${pendingVideo.title}, dura ${pendingVideo.duration} y te da ${pendingVideo.xpReward} XP.';
  }

  String _buildTicketStatus(RendimetaAssistantSnapshot snapshot) {
    final pending = snapshot.pendingTickets.length;
    if (pending == 0) {
      return 'No tienes tickets pendientes de validar en este momento.';
    }

    final latestTicket = snapshot.pendingTickets.first;
    return 'Tienes $pending ticket${pending == 1 ? '' : 's'} pendiente${pending == 1 ? '' : 's'} de validacion. '
        'El mas reciente es ${latestTicket.product.label.toLowerCase()} y sigue en revision.';
  }

  String _buildRecommendation(RendimetaAssistantSnapshot snapshot) {
    final pendingMission = snapshot.profile.missions
        .cast<DailyMission?>()
        .firstWhere(
          (mission) => mission != null && !mission.isCompleted,
          orElse: () => null,
        );
    final bestProduct = snapshot.bestProductToday;

    final missionFocus = switch (pendingMission?.product) {
      ProductType.aceite =>
        'Enfocate primero en aceites porque esa meta te da un desbloqueo rapido de XP.',
      ProductType.aromatizante =>
        'Aprovecha para empujar aromatizantes, especialmente en clientes que ya terminaron su carga.',
      ProductType.snack =>
        'Los snacks pueden ayudarte a subir volumen rapido si el flujo de clientes esta movido.',
      ProductType.accesorio =>
        'Los accesorios funcionan mejor cuando el cliente ya confio en una recomendacion breve y concreta.',
      null =>
        'Combina una recomendacion de producto con una capacitacion rapida para sumar XP por dos lados.',
    };

    final momentum = bestProduct == null
        ? snapshot.coachMessage
        : 'Tu mejor inercia hoy esta en ${bestProduct.label.toLowerCase()}, asi que puedes usarlo como ancla para venta cruzada.';

    return '$missionFocus $momentum';
  }

  String _buildFallback(RendimetaAssistantSnapshot snapshot) {
    return 'Te puedo ayudar con el panorama de hoy. '
        '${_buildOverview(snapshot)} '
        'Si quieres algo mas puntual, prueba con: "como voy en ranking" o "que meta me falta".';
  }

  List<ProductType> _extractProducts(String normalizedPrompt) {
    final products = <ProductType>[];
    for (final product in ProductType.values) {
      if (normalizedPrompt.contains(_normalize(product.label))) {
        products.add(product);
      }
    }

    if (normalizedPrompt.contains('snacks') &&
        !products.contains(ProductType.snack)) {
      products.add(ProductType.snack);
    }
    if (normalizedPrompt.contains('aceites') &&
        !products.contains(ProductType.aceite)) {
      products.add(ProductType.aceite);
    }
    if (normalizedPrompt.contains('accesorios') &&
        !products.contains(ProductType.accesorio)) {
      products.add(ProductType.accesorio);
    }
    if (normalizedPrompt.contains('aromatizantes') &&
        !products.contains(ProductType.aromatizante)) {
      products.add(ProductType.aromatizante);
    }

    return products;
  }

  List<String> _dedupe(List<String> sections) {
    final unique = <String>[];
    for (final section in sections) {
      if (!unique.contains(section)) {
        unique.add(section.trim());
      }
    }
    return unique;
  }

  bool _containsAny(String text, List<String> candidates) {
    for (final candidate in candidates) {
      if (text.contains(candidate)) {
        return true;
      }
    }
    return false;
  }

  String _salesBreakdown(Map<ProductType, int> sales) {
    return ProductType.values
        .map(
          (product) =>
              '${sales[product] ?? 0} ${_pluralizeProduct(product, sales[product] ?? 0)}',
        )
        .join(', ');
  }

  String _pluralizeProduct(ProductType product, int amount) {
    final label = product.label.toLowerCase();
    if (amount == 1) return label;
    return switch (product) {
      ProductType.snack => 'snacks',
      ProductType.aceite => 'aceites',
      ProductType.accesorio => 'accesorios',
      ProductType.aromatizante => 'aromatizantes',
    };
  }

  String _normalize(String value) {
    return value
        .toLowerCase()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u')
        .replaceAll('ü', 'u')
        .replaceAll('ñ', 'n');
  }
}
