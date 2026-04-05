import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

class XpProgressBar extends StatelessWidget {
  final double progress;
  final String levelName;
  final String? nextLevelName;
  final int currentXp;
  final int? nextLevelXp;

  const XpProgressBar({
    super.key,
    required this.progress,
    required this.levelName,
    this.nextLevelName,
    required this.currentXp,
    this.nextLevelXp,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  levelName,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
                if (nextLevelName != null)
                  Text(
                    nextLevelName!,
                    style: GoogleFonts.manrope(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondaryOf(context),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Stack(
              children: [
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: AppColors.backgroundOf(context),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                AnimatedFractionallySizedBox(
                  duration: const Duration(milliseconds: 800),
                  curve: Curves.easeOutCubic,
                  widthFactor: progress.clamp(0.02, 1.0),
                  child: Container(
                    height: 12,
                    decoration: BoxDecoration(
                      gradient: AppColors.xpBarGradient,
                      borderRadius: BorderRadius.circular(6),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$currentXp XP',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondaryOf(context),
                  ),
                ),
                if (nextLevelXp != null)
                  Text(
                    '$nextLevelXp XP',
                    style: GoogleFonts.manrope(
                      fontSize: 11,
                      color: AppColors.textTertiaryOf(context),
                    ),
                  ),
              ],
            ),
          ],
        )
        .animate()
        .fadeIn(duration: 400.ms)
        .slideX(begin: -0.05, end: 0, duration: 400.ms);
  }
}
