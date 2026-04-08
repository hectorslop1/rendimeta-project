import 'package:flutter/material.dart';
import 'models.dart';

enum TicketStatus {
  capturing('Capturando', Color(0xFF7A28FF), Icons.camera_alt_rounded),
  processing('Procesando', Color(0xFFFFAA5E), Icons.hourglass_top_rounded),
  pending('En revision', Color(0xFFFFAA5E), Icons.schedule_rounded),
  validated('Validada', Color(0xFF4CAF50), Icons.check_circle_rounded),
  rejected('Rechazada', Color(0xFFE53935), Icons.cancel_rounded);

  final String label;
  final Color color;
  final IconData icon;

  const TicketStatus(this.label, this.color, this.icon);
}

class TicketRecord {
  final String id;
  final ProductType product;
  final DateTime timestamp;
  final TicketStatus status;
  final int xpReward;

  const TicketRecord({
    required this.id,
    required this.product,
    required this.timestamp,
    required this.status,
    this.xpReward = 5,
  });

  TicketRecord copyWith({TicketStatus? status}) => TicketRecord(
        id: id,
        product: product,
        timestamp: timestamp,
        status: status ?? this.status,
        xpReward: xpReward,
      );
}
