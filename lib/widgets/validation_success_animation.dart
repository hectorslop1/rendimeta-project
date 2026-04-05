import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/haptics.dart';
import '../theme/app_colors.dart';

class ValidationSuccessAnimation extends StatefulWidget {
  final VoidCallback onComplete;

  const ValidationSuccessAnimation({super.key, required this.onComplete});

  @override
  State<ValidationSuccessAnimation> createState() =>
      _ValidationSuccessAnimationState();
}

class _ValidationSuccessAnimationState extends State<ValidationSuccessAnimation>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _particlesController;
  late Animation<double> _scaleAnimation;
  final List<_Particle> _particles = [];

  @override
  void initState() {
    super.initState();

    // Pulse animation
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.0,
          end: 1.05,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.05,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 50,
      ),
    ]).animate(_pulseController);

    // Particles animation
    _particlesController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // Generate particles
    _generateParticles();

    // Trigger haptics
    Haptics.tap();

    // Start animations
    _pulseController.forward().then((_) {
      // Medium impact at peak
      Haptics.sale();
    });

    _particlesController.forward().then((_) {
      widget.onComplete();
    });
  }

  void _generateParticles() {
    final random = math.Random();
    for (int i = 0; i < 20; i++) {
      _particles.add(
        _Particle(
          startX: 0.5 + (random.nextDouble() - 0.5) * 0.2,
          startY: 0.8,
          endX: 0.5 + (random.nextDouble() - 0.5) * 0.8,
          endY: -0.2 + random.nextDouble() * 0.3,
          size: 4 + random.nextDouble() * 6,
          rotation: random.nextDouble() * math.pi * 2,
          delay: random.nextDouble() * 0.2,
        ),
      );
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _particlesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Checkmark with pulse
        Center(
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        blurRadius: 30,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 56,
                  ),
                ),
              );
            },
          ),
        ),
        // Particles
        AnimatedBuilder(
          animation: _particlesController,
          builder: (context, child) {
            return CustomPaint(
              painter: _ParticlesPainter(
                particles: _particles,
                progress: _particlesController.value,
              ),
              size: Size.infinite,
            );
          },
        ),
      ],
    );
  }
}

class _Particle {
  final double startX;
  final double startY;
  final double endX;
  final double endY;
  final double size;
  final double rotation;
  final double delay;

  _Particle({
    required this.startX,
    required this.startY,
    required this.endX,
    required this.endY,
    required this.size,
    required this.rotation,
    required this.delay,
  });
}

class _ParticlesPainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ParticlesPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;

    for (final particle in particles) {
      // Apply delay
      final adjustedProgress =
          ((progress - particle.delay) / (1.0 - particle.delay)).clamp(
            0.0,
            1.0,
          );

      if (adjustedProgress <= 0) continue;

      // Calculate position with upward trajectory
      final x =
          size.width *
          (particle.startX +
              (particle.endX - particle.startX) * adjustedProgress);
      final y =
          size.height *
          (particle.startY +
              (particle.endY - particle.startY) * adjustedProgress);

      // Fade out
      final opacity = (1.0 - adjustedProgress).clamp(0.0, 1.0);
      paint.color = AppColors.primary.withValues(alpha: opacity);

      // Draw particle (circle or rectangle)
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.rotation * adjustedProgress);

      if (particle.size > 6) {
        // Rectangle confetti
        canvas.drawRect(
          Rect.fromCenter(
            center: Offset.zero,
            width: particle.size,
            height: particle.size * 0.6,
          ),
          paint,
        );
      } else {
        // Circle confetti
        canvas.drawCircle(Offset.zero, particle.size / 2, paint);
      }

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlesPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
