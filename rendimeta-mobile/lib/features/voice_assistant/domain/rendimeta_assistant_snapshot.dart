import '../../../core/game_state.dart';
import '../../../core/models.dart';
import '../../../core/ticket_model.dart';

class RendimetaAssistantSnapshot {
  const RendimetaAssistantSnapshot({
    required this.profile,
    required this.ranking,
    required this.videos,
    required this.pendingTickets,
    required this.coachMessage,
    required this.feedbackMessage,
    required this.alertMessage,
    required this.weeklyAverage,
    required this.weeklyTrend,
  });

  factory RendimetaAssistantSnapshot.fromGameState(GameState state) {
    return RendimetaAssistantSnapshot(
      profile: state.profile,
      ranking: state.ranking,
      videos: state.videos,
      pendingTickets: state.pendingTickets,
      coachMessage: state.coachMessage,
      feedbackMessage: state.lastFeedback,
      alertMessage: state.alertMessage,
      weeklyAverage: state.weeklyAverage,
      weeklyTrend: state.weeklyTrend,
    );
  }

  final UserProfile profile;
  final List<RankingEntry> ranking;
  final List<TrainingVideo> videos;
  final List<TicketRecord> pendingTickets;
  final String coachMessage;
  final String? feedbackMessage;
  final String? alertMessage;
  final double weeklyAverage;
  final List<double> weeklyTrend;

  RankingEntry? get currentRankingEntry {
    for (final entry in ranking) {
      if (entry.isCurrentUser) return entry;
    }
    return null;
  }

  ProductType? get bestProductToday {
    ProductType? bestProduct;
    var bestCount = 0;

    for (final entry in profile.todaySales.entries) {
      if (entry.value > bestCount) {
        bestCount = entry.value;
        bestProduct = entry.key;
      }
    }

    return bestCount == 0 ? null : bestProduct;
  }

  int get completedBadgesCount =>
      profile.badges.where((badge) => badge.unlocked).length;

  int get completedTrainingCount =>
      videos.where((video) => video.completed).length;

  int get pendingMissionsCount =>
      profile.missions.where((mission) => !mission.isCompleted).length;
}
