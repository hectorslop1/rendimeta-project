import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../../../theme/app_colors.dart';
import '../../domain/voice_assistant_models.dart';

class RendimetaVoiceOrb extends StatefulWidget {
  const RendimetaVoiceOrb({
    super.key,
    required this.status,
    required this.amplitude,
    this.size = 220,
  });

  final RendimetaVoiceAssistantStatus status;
  final double amplitude;
  final double size;

  @override
  State<RendimetaVoiceOrb> createState() => _RendimetaVoiceOrbState();
}

class _RendimetaVoiceOrbState extends State<RendimetaVoiceOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  )..repeat();

  double _smoothedAmplitude = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final target = widget.amplitude.clamp(0.0, 1.0);
        _smoothedAmplitude = ui.lerpDouble(_smoothedAmplitude, target, 0.14)!;

        return CustomPaint(
          size: Size.square(widget.size),
          painter: _RendimetaVoiceOrbPainter(
            phase: _controller.value * math.pi * 2,
            amplitude: _smoothedAmplitude,
            status: widget.status,
          ),
        );
      },
    );
  }
}

class _RendimetaVoiceOrbPainter extends CustomPainter {
  const _RendimetaVoiceOrbPainter({
    required this.phase,
    required this.amplitude,
    required this.status,
  });

  final double phase;
  final double amplitude;
  final RendimetaVoiceAssistantStatus status;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final baseRadius = size.width * 0.33;
    final amplitudeBoost = switch (status) {
      RendimetaVoiceAssistantStatus.connecting => 8,
      RendimetaVoiceAssistantStatus.listening => 18 + (amplitude * 30),
      RendimetaVoiceAssistantStatus.processing => 10 + (amplitude * 8),
      RendimetaVoiceAssistantStatus.speaking => 14 + (amplitude * 24),
      RendimetaVoiceAssistantStatus.ending => 8,
      RendimetaVoiceAssistantStatus.error => 8,
      RendimetaVoiceAssistantStatus.idle => 9,
    };
    final radius = baseRadius + amplitudeBoost;

    final orbPath = _buildBlobPath(center, radius);
    final glowColor = switch (status) {
      RendimetaVoiceAssistantStatus.connecting =>
        AppColors.secondary.withValues(alpha: 0.22),
      RendimetaVoiceAssistantStatus.listening => AppColors.tertiary.withValues(
        alpha: 0.42,
      ),
      RendimetaVoiceAssistantStatus.processing =>
        AppColors.secondary.withValues(alpha: 0.30),
      RendimetaVoiceAssistantStatus.speaking => AppColors.primary.withValues(
        alpha: 0.44,
      ),
      RendimetaVoiceAssistantStatus.ending => AppColors.primary.withValues(
        alpha: 0.18,
      ),
      RendimetaVoiceAssistantStatus.error => AppColors.error.withValues(
        alpha: 0.28,
      ),
      RendimetaVoiceAssistantStatus.idle => AppColors.primary.withValues(
        alpha: 0.24,
      ),
    };

    final glowPaint = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 40)
      ..color = glowColor;
    canvas.drawCircle(center, radius + 14, glowPaint);

    canvas.save();
    canvas.clipPath(orbPath);

    final orbRect = Rect.fromCircle(center: center, radius: radius + 28);
    final radial = Paint()
      ..shader = ui.Gradient.radial(
        center,
        radius + 28,
        const [
          Color(0xFFFFFBFE),
          Color(0xFFFFC8E7),
          Color(0xFFE6007A),
          Color(0xFF7A28FF),
        ],
        const [0, 0.34, 0.72, 1],
      );
    canvas.drawRect(orbRect, radial);

    _paintRibbon(
      canvas,
      orbRect,
      center,
      angle: phase * 0.65,
      colors: const [
        Color(0x00FFFFFF),
        Color(0x7FFFE4F3),
        Color(0xAAFF7FD1),
        Color(0x003DDBD6),
      ],
      stops: const [0.0, 0.26, 0.74, 1.0],
      widthFactor: 0.34,
      verticalBias: -0.2,
    );
    _paintRibbon(
      canvas,
      orbRect,
      center,
      angle: (phase * -0.75) + 1.25,
      colors: const [
        Color(0x00FFFFFF),
        Color(0x6636F8F4),
        Color(0xA02DE2E2),
        Color(0x007A28FF),
      ],
      stops: const [0.0, 0.22, 0.76, 1.0],
      widthFactor: 0.26,
      verticalBias: 0.18,
    );

    final highlightPaint = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20)
      ..color = Colors.white.withValues(alpha: 0.58);
    canvas.drawCircle(
      center.translate(-radius * 0.22, -radius * 0.32),
      radius * 0.24,
      highlightPaint,
    );

    canvas.restore();

    final outlinePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = Colors.white.withValues(alpha: 0.18);
    canvas.drawPath(orbPath, outlinePaint);
  }

  Path _buildBlobPath(Offset center, double radius) {
    final distortion = switch (status) {
      RendimetaVoiceAssistantStatus.connecting => 0.04,
      RendimetaVoiceAssistantStatus.listening => 0.09 + (amplitude * 0.13),
      RendimetaVoiceAssistantStatus.processing => 0.055,
      RendimetaVoiceAssistantStatus.speaking => 0.07 + (amplitude * 0.09),
      RendimetaVoiceAssistantStatus.ending => 0.038,
      RendimetaVoiceAssistantStatus.error => 0.045,
      RendimetaVoiceAssistantStatus.idle => 0.036,
    };

    final path = Path();
    const segments = 58;
    for (var i = 0; i <= segments; i++) {
      final t = (i / segments) * math.pi * 2;
      final wave = math.sin((t * 3) + phase) * distortion;
      final wave2 = math.cos((t * 5) - (phase * 1.15)) * distortion * 0.55;
      final currentRadius = radius * (1 + wave + wave2);
      final point = Offset(
        center.dx + (math.cos(t) * currentRadius),
        center.dy + (math.sin(t) * currentRadius),
      );
      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    path.close();
    return path;
  }

  void _paintRibbon(
    Canvas canvas,
    Rect rect,
    Offset center, {
    required double angle,
    required List<Color> colors,
    required List<double> stops,
    required double widthFactor,
    required double verticalBias,
  }) {
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(angle);
    canvas.translate(-center.dx, -center.dy);

    final ribbonRect = Rect.fromCenter(
      center: center.translate(0, rect.height * verticalBias),
      width: rect.width * 1.35,
      height: rect.height * widthFactor,
    );
    final paint = Paint()
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18)
      ..shader = ui.Gradient.linear(
        ribbonRect.topLeft,
        ribbonRect.bottomRight,
        colors,
        stops,
      );

    final ribbonPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          ribbonRect,
          Radius.circular(ribbonRect.height * 0.9),
        ),
      );
    canvas.drawPath(ribbonPath, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _RendimetaVoiceOrbPainter oldDelegate) {
    return oldDelegate.phase != phase ||
        oldDelegate.amplitude != amplitude ||
        oldDelegate.status != status;
  }
}
