import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AnimatedCounter extends StatelessWidget {
  final int value;
  final Color color;
  final double fontSize;

  const AnimatedCounter({
    super.key,
    required this.value,
    required this.color,
    this.fontSize = 28,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: value),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic,
      builder: (context, val, _) {
        return Text(
          '$val',
          style: GoogleFonts.spaceGrotesk(
            fontSize: fontSize,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        );
      },
    );
  }
}
