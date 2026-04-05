import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/haptics.dart';
import '../../theme/app_colors.dart';
import '../shell/main_shell.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentPage = 0;

  static const _pages = [
    _OnboardingPage(
      icon: Icons.rocket_launch_rounded,
      gradientColors: [Color(0xFFE6007A), Color(0xFF7A28FF)],
      title: 'Bienvenido a Rendimeta',
      subtitle:
          'Tu plataforma de gamificacion para vendedores de gasolinera. Cada venta suma, cada meta se recompensa.',
      illustrationTag: 'rocket',
    ),
    _OnboardingPage(
      icon: Icons.emoji_events_rounded,
      gradientColors: [Color(0xFF7A28FF), Color(0xFF2DE2E2)],
      title: 'Gana XP y sube de nivel',
      subtitle:
          'Registra ventas, completa misiones y entrena para ganar puntos de experiencia. Desbloquea insignias y alcanza el Top 3.',
      illustrationTag: 'trophy',
    ),
    _OnboardingPage(
      icon: Icons.school_rounded,
      gradientColors: [Color(0xFF2DE2E2), Color(0xFF00B894)],
      title: 'Capacitate en segundos',
      subtitle:
          'Videos cortos con tecnicas de venta probadas. Practica con simulaciones interactivas de clientes reales.',
      illustrationTag: 'learn',
    ),
    _OnboardingPage(
      icon: Icons.camera_alt_rounded,
      gradientColors: [Color(0xFFFFAA5E), Color(0xFFE6007A)],
      title: 'Valida con ticket',
      subtitle:
          'Captura tu ticket de venta para verificacion automatica. Todo se sincroniza en tiempo real con tu estacion.',
      illustrationTag: 'camera',
    ),
  ];

  void _goToNext() {
    Haptics.selection();
    if (_currentPage < _pages.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  void _finish() {
    Haptics.success();
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const MainShell(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Pages
          PageView.builder(
            controller: _controller,
            itemCount: _pages.length,
            onPageChanged: (i) {
              Haptics.selection();
              setState(() => _currentPage = i);
            },
            itemBuilder: (context, i) => _PageContent(page: _pages[i]),
          ),
          // Bottom controls
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(32, 0, 32, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildDots(),
                    const SizedBox(height: 32),
                    _buildButton(),
                    if (_currentPage < _pages.length - 1) ...[
                      const SizedBox(height: 12),
                      _buildSkip(),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(_pages.length, (i) {
        final isActive = i == _currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          width: isActive ? 28 : 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            gradient: isActive ? AppColors.primaryGradient : null,
            color: isActive ? null : Colors.white.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  Widget _buildButton() {
    final isLast = _currentPage == _pages.length - 1;
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _goToNext,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          elevation: 0,
        ),
        child: Text(
          isLast ? 'Comenzar' : 'Siguiente',
          style: GoogleFonts.spaceGrotesk(
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildSkip() {
    return TextButton(
      onPressed: _finish,
      child: Text(
        'Saltar',
        style: GoogleFonts.manrope(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Colors.white.withValues(alpha: 0.6),
        ),
      ),
    );
  }
}

// --- Page data model ---
class _OnboardingPage {
  final IconData icon;
  final List<Color> gradientColors;
  final String title;
  final String subtitle;
  final String illustrationTag;

  const _OnboardingPage({
    required this.icon,
    required this.gradientColors,
    required this.title,
    required this.subtitle,
    required this.illustrationTag,
  });
}

// --- Page content ---
class _PageContent extends StatelessWidget {
  final _OnboardingPage page;

  const _PageContent({required this.page});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: page.gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          // Pattern overlay
          Positioned.fill(
            child: CustomPaint(painter: _OnboardingPatternPainter()),
          ),
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(32, 40, 32, 160),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon circle
                  Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.25),
                            width: 2,
                          ),
                        ),
                        child: Icon(page.icon, color: Colors.white, size: 56),
                      )
                      .animate()
                      .scale(
                        begin: const Offset(0.6, 0.6),
                        end: const Offset(1, 1),
                        duration: 600.ms,
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 48),
                  // Title
                  Text(
                        page.title,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 30,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.2,
                          letterSpacing: -0.5,
                        ),
                      )
                      .animate()
                      .fadeIn(delay: 200.ms, duration: 500.ms)
                      .slideY(
                        begin: 0.2,
                        end: 0,
                        delay: 200.ms,
                        duration: 500.ms,
                        curve: Curves.easeOutCubic,
                      ),
                  const SizedBox(height: 18),
                  // Subtitle
                  Text(
                        page.subtitle,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.85),
                          height: 1.5,
                        ),
                      )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 500.ms)
                      .slideY(
                        begin: 0.2,
                        end: 0,
                        delay: 400.ms,
                        duration: 500.ms,
                        curve: Curves.easeOutCubic,
                      ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Decorative background pattern ---
class _OnboardingPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Diagonal lines
    for (double i = -size.height; i < size.width + size.height; i += 50) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }

    // Decorative circles
    final circlePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(size.width * 0.85, size.height * 0.15),
      100,
      circlePaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.1, size.height * 0.8),
      70,
      circlePaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.45),
      40,
      circlePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
