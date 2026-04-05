import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/game_state.dart';
import '../../core/haptics.dart';
import '../../core/models.dart';
import '../../core/page_transitions.dart';
import '../../theme/app_colors.dart';
import 'camera_validation_screen.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  bool _ticketMode = false;

  void _openCamera(
    BuildContext context,
    GameState state,
    ProductType product,
  ) async {
    final result = await Navigator.of(context).push<bool>(
      SlideUpRoute(
        page: CameraValidationScreen(
          productLabel: product.label,
          productColor: product.color,
        ),
      ),
    );
    if (result == true && context.mounted) {
      state.registerSaleWithTicket(product);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, state, _) {
        final profile = state.profile;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(profile),
                const SizedBox(height: 24),
                Expanded(child: _buildProductGrid(context, state, profile)),
                if (state.lastFeedback != null)
                  _buildFeedbackBanner(state.lastFeedback!),
                const SizedBox(height: 16),
                _buildTotalCounter(profile),
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(UserProfile profile) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Registrar venta',
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimaryOf(context),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _ticketMode
                    ? 'Captura el ticket de venta'
                    : '1 tap = 1 venta registrada',
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondaryOf(context),
                ),
              ),
            ],
          ),
        ),
        _buildModeToggle(),
      ],
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildModeToggle() {
    return GestureDetector(
      onTap: () {
        Haptics.selection();
        setState(() => _ticketMode = !_ticketMode);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: _ticketMode
              ? AppColors.secondary.withValues(alpha: 0.12)
              : AppColors.textTertiary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _ticketMode
                ? AppColors.secondary.withValues(alpha: 0.25)
                : AppColors.textTertiary.withValues(alpha: 0.15),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _ticketMode ? Icons.touch_app_rounded : Icons.camera_alt_rounded,
              size: 16,
              color: _ticketMode
                  ? AppColors.secondary
                  : AppColors.textSecondaryOf(context),
            ),
            const SizedBox(width: 6),
            Text(
              _ticketMode ? 'Modo rápido' : 'Modo ticket',
              style: GoogleFonts.manrope(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _ticketMode
                    ? AppColors.secondary
                    : AppColors.textSecondaryOf(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductGrid(
    BuildContext context,
    GameState state,
    UserProfile profile,
  ) {
    final products = ProductType.values;
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 14.0;
        final rows = (products.length / 2).ceil();
        final cardWidth = (constraints.maxWidth - spacing) / 2;
        final cardHeight =
            (constraints.maxHeight - (spacing * (rows - 1))) / rows;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: products.asMap().entries.map((entry) {
            final i = entry.key;
            final product = entry.value;
            final count = profile.todaySales[product] ?? 0;
            return SizedBox(
              width: cardWidth,
              height: cardHeight,
              child: _ProductButton(
                product: product,
                count: count,
                index: i,
                onTap: _ticketMode
                    ? () => _openCamera(context, state, product)
                    : () => state.registerSale(product),
                isTicketMode: _ticketMode,
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildFeedbackBanner(String feedback) {
    return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.secondary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(
                Icons.insights_rounded,
                color: AppColors.secondary,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  feedback,
                  style: GoogleFonts.manrope(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondary,
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideY(begin: 0.2, end: 0, duration: 300.ms);
  }

  Widget _buildTotalCounter(UserProfile profile) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceOf(context),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadowOf(context),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.receipt_long_rounded,
              color: AppColors.primary,
              size: 20,
            ),
            const SizedBox(width: 10),
            Text(
              'Total hoy: ',
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondaryOf(context),
              ),
            ),
            Text(
              '${profile.todayTotalSales}',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductButton extends StatefulWidget {
  final ProductType product;
  final int count;
  final int index;
  final VoidCallback onTap;
  final bool isTicketMode;

  const _ProductButton({
    required this.product,
    required this.count,
    required this.index,
    required this.onTap,
    this.isTicketMode = false,
  });

  @override
  State<_ProductButton> createState() => _ProductButtonState();
}

class _ProductButtonState extends State<_ProductButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _showPlusOne = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 0.92).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _handleTap() {
    Haptics.sale();
    _pulseController.forward().then((_) => _pulseController.reverse());
    setState(() => _showPlusOne = true);
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _showPlusOne = false);
    });
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(scale: _pulseAnimation.value, child: child);
          },
          child: GestureDetector(
            onTap: _handleTap,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceOf(context),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: widget.product.color.withValues(alpha: 0.15),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: widget.product.color.withValues(alpha: 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                      BoxShadow(
                        color: AppColors.cardShadowOf(context),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: widget.product.color.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(
                          widget.product.icon,
                          color: widget.product.color,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.product.label,
                        style: GoogleFonts.manrope(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimaryOf(context),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${widget.count}',
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: widget.product.color,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_showPlusOne)
                  Positioned(
                    top: -10,
                    right: -5,
                    child:
                        Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.4,
                                    ),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Text(
                                '+1',
                                style: GoogleFonts.spaceGrotesk(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            )
                            .animate()
                            .fadeIn(duration: 100.ms)
                            .slideY(
                              begin: 0.3,
                              end: 0,
                              duration: 200.ms,
                              curve: Curves.easeOut,
                            )
                            .then()
                            .slideY(begin: 0, end: -0.5, duration: 500.ms)
                            .fadeOut(delay: 300.ms, duration: 200.ms),
                  ),
              ],
            ),
          ),
        )
        .animate(delay: Duration(milliseconds: 100 * widget.index))
        .fadeIn(duration: 400.ms)
        .slideY(
          begin: 0.15,
          end: 0,
          duration: 500.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
