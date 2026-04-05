import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onAction;
  final String? actionLabel;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onAction,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CustomPaint(
                  size: const Size(120, 120),
                  painter: _EmptyIllustrationPainter(icon: icon),
                )
                .animate()
                .fadeIn(duration: 600.ms)
                .scale(
                  begin: const Offset(0.8, 0.8),
                  end: const Offset(1, 1),
                  duration: 600.ms,
                  curve: Curves.elasticOut,
                ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
            if (onAction != null && actionLabel != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ).animate().fadeIn(delay: 400.ms, duration: 400.ms),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmptyIllustrationPainter extends CustomPainter {
  final IconData icon;

  _EmptyIllustrationPainter({required this.icon});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    final outerCircle = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.06)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, size.width / 2, outerCircle);

    final middleCircle = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.08)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, size.width / 3, middleCircle);

    final dashedRing = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    const dashCount = 24;
    for (int i = 0; i < dashCount; i++) {
      final angle = (i / dashCount) * 3.14159 * 2;
      if (i % 2 == 0) {
        final r = size.width / 2 - 4;
        final start = Offset(
          center.dx + r * 0.92 * math.cos(angle),
          center.dy + r * 0.92 * math.sin(angle),
        );
        final end = Offset(
          center.dx + r * math.cos(angle),
          center.dy + r * math.sin(angle),
        );
        canvas.drawLine(start, end, dashedRing);
      }
    }

    final accentDot = Paint()
      ..color = AppColors.tertiary.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(size.width * 0.82, size.height * 0.18),
      6,
      accentDot,
    );
    canvas.drawCircle(
      Offset(size.width * 0.15, size.height * 0.78),
      4,
      accentDot,
    );

    final iconPainter = TextPainter(
      text: TextSpan(
        text: String.fromCharCode(icon.codePoint),
        style: TextStyle(
          fontSize: 40,
          fontFamily: icon.fontFamily,
          package: icon.fontPackage,
          color: AppColors.primary.withValues(alpha: 0.5),
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    iconPainter.layout();
    iconPainter.paint(
      canvas,
      Offset(
        center.dx - iconPainter.width / 2,
        center.dy - iconPainter.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
