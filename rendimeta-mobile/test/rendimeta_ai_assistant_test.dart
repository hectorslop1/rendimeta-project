import 'package:flutter_test/flutter_test.dart';
import 'package:rendimeta/core/models.dart';
import 'package:rendimeta/core/ticket_model.dart';
import 'package:rendimeta/features/voice_assistant/domain/rendimeta_assistant_snapshot.dart';
import 'package:rendimeta/features/voice_assistant/services/rendimeta_ai_assistant.dart';
import 'package:rendimeta/mock_data/mock_data.dart';

void main() {
  group('RendimetaAiAssistant', () {
    final assistant = RendimetaAiAssistant();
    final snapshot = RendimetaAssistantSnapshot(
      profile: MockData.initialProfile,
      ranking: MockData.weeklyRanking,
      videos: MockData.trainingVideos,
      pendingTickets: [
        TicketRecord(
          id: 'T-1',
          product: ProductType.aceite,
          timestamp: DateTime(2026, 4, 7, 10, 00),
          status: TicketStatus.pending,
        ),
      ],
      coachMessage:
          'Luis, las tardes son el mejor momento para ofrecer aromatizantes.',
      feedbackMessage: 'Primera venta de aceite del dia',
      alertMessage: 'Te faltan 2 ventas para tu meta',
      weeklyAverage: 6.5,
      weeklyTrend: const [4, 7, 5, 8, 6, 9, 0],
    );

    test('responde con datos de meta y ventas', () {
      final reply = assistant.generateReply(
        prompt: 'Cuanto me falta para mi meta de aceites',
        snapshot: snapshot,
      );

      expect(reply, contains('Vende 3 aceites'));
      expect(reply, contains('te faltan 2'));
      expect(reply, contains('Hoy llevas 1 aceite'));
    });

    test('responde con ranking y ventaja actual', () {
      final reply = assistant.generateReply(
        prompt: 'Como voy en ranking',
        snapshot: snapshot,
      );

      expect(reply, contains('lugar 3'));
      expect(reply, contains('4 ventas'));
      expect(reply, contains('3 ventas de ventaja'));
    });
  });
}
