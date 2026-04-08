import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class Sparkline extends StatelessWidget {
  final List<double> data;
  final Color? lineColor;
  final Color? fillColor;
  final double height;
  final double strokeWidth;

  const Sparkline({
    super.key,
    required this.data,
    this.lineColor,
    this.fillColor,
    this.height = 40,
    this.strokeWidth = 2,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: CustomPaint(
        size: Size.infinite,
        painter: _SparklinePainter(
          data: data,
          lineColor: lineColor ?? AppColors.primary,
          fillColor: fillColor ?? AppColors.primary.withValues(alpha: 0.1),
          strokeWidth: strokeWidth,
        ),
      ),
    );
  }
}

class _SparklinePainter extends CustomPainter {
  final List<double> data;
  final Color lineColor;
  final Color fillColor;
  final double strokeWidth;

  _SparklinePainter({
    required this.data,
    required this.lineColor,
    required this.fillColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final maxVal = data.reduce((a, b) => a > b ? a : b);
    final minVal = data.reduce((a, b) => a < b ? a : b);
    final range = maxVal - minVal == 0 ? 1.0 : maxVal - minVal;

    final points = <Offset>[];
    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i] - minVal) / range) * size.height * 0.85 - size.height * 0.075;
      points.add(Offset(x, y));
    }

    final fillPath = Path()..moveTo(0, size.height);
    for (int i = 0; i < points.length; i++) {
      if (i == 0) {
        fillPath.lineTo(points[i].dx, points[i].dy);
      } else {
        final cp1x = (points[i - 1].dx + points[i].dx) / 2;
        fillPath.cubicTo(
          cp1x, points[i - 1].dy,
          cp1x, points[i].dy,
          points[i].dx, points[i].dy,
        );
      }
    }
    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [fillColor, fillColor.withValues(alpha: 0)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    final linePath = Path();
    for (int i = 0; i < points.length; i++) {
      if (i == 0) {
        linePath.moveTo(points[i].dx, points[i].dy);
      } else {
        final cp1x = (points[i - 1].dx + points[i].dx) / 2;
        linePath.cubicTo(
          cp1x, points[i - 1].dy,
          cp1x, points[i].dy,
          points[i].dx, points[i].dy,
        );
      }
    }

    final linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(linePath, linePaint);

    final dotPaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(points.last, 4, dotPaint);

    final dotGlow = Paint()
      ..color = lineColor.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(points.last, 7, dotGlow);
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter oldDelegate) =>
      data != oldDelegate.data || lineColor != oldDelegate.lineColor;
}
