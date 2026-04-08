import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:workfire/workfire.dart';
import '../core/haptics.dart';
import '../theme/app_colors.dart';

class CelebrationOverlay extends StatefulWidget {
  final String message;
  final VoidCallback onDismiss;

  const CelebrationOverlay({
    super.key,
    required this.message,
    required this.onDismiss,
  });

  @override
  State<CelebrationOverlay> createState() => _CelebrationOverlayState();
}

class _CelebrationOverlayState extends State<CelebrationOverlay>
    with TickerProviderStateMixin {
  late List<_ConfettiPiece> _confetti;
  late AnimationController _gravityController;
  final _random = Random();
  int _fireworkCount = 0;

  @override
  void initState() {
    super.initState();
    _confetti = List.generate(60, (_) => _ConfettiPiece(_random));
    _gravityController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    )..forward();

    // Trigger haptic bursts synchronized with fireworks
    _scheduleFireworkHaptics();

    Future.delayed(const Duration(milliseconds: 4000), () {
      if (mounted) widget.onDismiss();
    });
  }

  void _scheduleFireworkHaptics() {
    // Fire haptic bursts at each firework launch
    const delays = [0, 500, 1000, 1500, 2000];
    for (final delay in delays) {
      Future.delayed(Duration(milliseconds: delay), () {
        if (mounted) {
          Haptics.fireworkBurst();
          setState(() => _fireworkCount++);
        }
      });
    }
  }

  @override
  void dispose() {
    _gravityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onDismiss,
      child: Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            // Dim background
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.4),
              ).animate().fadeIn(duration: 200.ms),
            ),
            // Confetti falling from top
            ...List.generate(_confetti.length, (i) {
              return _ConfettiWidget(
                piece: _confetti[i],
                controller: _gravityController,
              );
            }),
            // Fireworks show
            if (_fireworkCount > 0)
              Positioned.fill(
                child: IgnorePointer(
                  child: FireworkShow(
                    fireworks: [
                      FireworkConfig(
                        delay: Duration.zero,
                        particleColors: [
                          AppColors.primary,
                          const Color(0xFFFF6B9D),
                        ],
                      ),
                      FireworkConfig(
                        delay: const Duration(milliseconds: 500),
                        particleColors: [
                          AppColors.secondary,
                          const Color(0xFF9D5CFF),
                        ],
                      ),
                      FireworkConfig(
                        delay: const Duration(milliseconds: 1000),
                        particleColors: [
                          AppColors.tertiary,
                          const Color(0xFF5CE1E6),
                        ],
                      ),
                      FireworkConfig(
                        delay: const Duration(milliseconds: 1500),
                        particleColors: [
                          AppColors.gold,
                          const Color(0xFFFFD700),
                        ],
                      ),
                      FireworkConfig(
                        delay: const Duration(milliseconds: 2000),
                        particleColors: [
                          AppColors.primary,
                          AppColors.secondary,
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            // Bouncing text in the center
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child:
                    Text(
                          'Completaste una meta diaria!\nSigue asi!',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.spaceGrotesk(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                            height: 1.3,
                            shadows: [
                              Shadow(
                                color: AppColors.primary.withValues(alpha: 0.6),
                                blurRadius: 20,
                              ),
                              const Shadow(
                                color: Colors.black54,
                                blurRadius: 10,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                        )
                        .animate()
                        .fadeIn(duration: 300.ms)
                        .scale(
                          begin: const Offset(0.3, 0.3),
                          end: const Offset(1.0, 1.0),
                          duration: 600.ms,
                          curve: Curves.elasticOut,
                        )
                        .then(delay: 200.ms)
                        .shimmer(
                          duration: 1200.ms,
                          color: Colors.white.withValues(alpha: 0.3),
                        ),
              ),
            ),
            // Small subtitle
            Positioned(
              bottom: MediaQuery.of(context).size.height * 0.25,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Toca para continuar',
                  style: GoogleFonts.manrope(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ).animate(delay: 1500.ms).fadeIn(duration: 400.ms),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- Confetti with gravity simulation ---
class _ConfettiPiece {
  final double startX;
  final double startY;
  final double size;
  final Color color;
  final double drift;
  final double speed;
  final double rotation;
  final bool isRect;
  final int delayMs;

  _ConfettiPiece(Random r)
    : startX = r.nextDouble(),
      startY = -(r.nextDouble() * 0.3 + 0.05),
      size = r.nextDouble() * 6 + 3,
      color = [
        AppColors.primary,
        AppColors.secondary,
        AppColors.tertiary,
        AppColors.gold,
        const Color(0xFFFF6B9D),
        Colors.white,
      ][r.nextInt(6)].withValues(alpha: 0.7 + r.nextDouble() * 0.3),
      drift = (r.nextDouble() - 0.5) * 0.15,
      speed = 0.6 + r.nextDouble() * 0.8,
      rotation = r.nextDouble() * 6.28,
      isRect = r.nextBool(),
      delayMs = r.nextInt(800);
}

class _ConfettiWidget extends StatelessWidget {
  final _ConfettiPiece piece;
  final AnimationController controller;

  const _ConfettiWidget({required this.piece, required this.controller});

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final effectiveT =
            ((controller.value * 3500 - piece.delayMs) / (3500 - piece.delayMs))
                .clamp(0.0, 1.0);
        if (effectiveT <= 0) return const SizedBox.shrink();

        final fallT = effectiveT * effectiveT * piece.speed;
        final x = piece.startX + piece.drift * effectiveT;
        final y = piece.startY + fallT * 1.3;

        final opacity = (1.0 - (effectiveT - 0.7).clamp(0.0, 1.0) * 3.33).clamp(
          0.0,
          1.0,
        );

        final angle = piece.rotation + effectiveT * 8;

        return Positioned(
          left: x * screenSize.width,
          top: y * screenSize.height,
          child: Opacity(
            opacity: opacity,
            child: Transform.rotate(angle: angle, child: child),
          ),
        );
      },
      child: piece.isRect
          ? Container(
              width: piece.size * 1.5,
              height: piece.size,
              decoration: BoxDecoration(
                color: piece.color,
                borderRadius: BorderRadius.circular(1.5),
              ),
            )
          : Container(
              width: piece.size,
              height: piece.size,
              decoration: BoxDecoration(
                color: piece.color,
                shape: BoxShape.circle,
              ),
            ),
    );
  }
}
