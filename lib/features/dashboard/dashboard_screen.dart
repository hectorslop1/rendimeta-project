import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/game_state.dart';
import '../../core/haptics.dart';
import '../../core/models.dart';
import '../../core/ticket_model.dart';
import '../../theme/app_colors.dart';
import '../../widgets/coach_bubble.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/sparkline.dart';
import '../../widgets/sync_indicator.dart';
import '../../widgets/xp_progress_bar.dart';
import '../../core/page_transitions.dart';
import '../simulation/simulation_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, state, _) {
        final profile = state.profile;
        return RefreshIndicator(
          onRefresh: () async {
            Haptics.tap();
            state.simulateRefresh();
            await Future.delayed(const Duration(milliseconds: 1200));
          },
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          displacement: 60,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: _HeroHeader(state: state, profile: profile),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLevelCard(context, profile),
                      const SizedBox(height: 16),
                      CoachBubble(message: state.coachMessage),
                      if (state.alertMessage != null)
                        _buildAlert(state.alertMessage!),
                      if (state.tickets.isNotEmpty) ...[
                        _buildPendingTickets(context, state),
                        const SizedBox(height: 20),
                      ],
                      _buildMissionsSection(context, profile),
                      const SizedBox(height: 20),
                      _buildTodaySalesWithTrend(context, state, profile),
                      const SizedBox(height: 20),
                      _buildRankingPreview(context, state),
                      const SizedBox(height: 20),
                      _buildSimulationBanner(context),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLevelCard(BuildContext context, UserProfile profile) {
    return GlassCard(
          gradient: AppColors.subtleGradient,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.trending_up_rounded,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Nivel ${profile.level.index_ + 1}',
                          style: GoogleFonts.manrope(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textSecondaryOf(context),
                          ),
                        ),
                        Text(
                          profile.level.title,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimaryOf(context),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              XpProgressBar(
                progress: profile.levelProgress,
                levelName: profile.level.title,
                nextLevelName: profile.nextLevel?.title,
                currentXp: profile.xp,
                nextLevelXp: profile.nextLevel?.xpRequired,
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(delay: 100.ms, duration: 500.ms)
        .slideY(begin: 0.1, end: 0, duration: 500.ms);
  }

  Widget _buildAlert(String message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child:
          Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.warning,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        message,
                        style: GoogleFonts.manrope(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              )
              .animate()
              .fadeIn(delay: 200.ms, duration: 400.ms)
              .shimmer(
                delay: 1000.ms,
                duration: 1500.ms,
                color: AppColors.warning.withValues(alpha: 0.2),
              ),
    );
  }

  Widget _buildPendingTickets(BuildContext context, GameState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.receipt_long_rounded,
              color: AppColors.secondary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              'Tickets recientes',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimaryOf(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 80,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: state.tickets.length > 5 ? 5 : state.tickets.length,
            separatorBuilder: (_, i) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final ticket = state.tickets[i];
              return _TicketChip(ticket: ticket);
            },
          ),
        ),
      ],
    ).animate().fadeIn(delay: 150.ms, duration: 400.ms);
  }

  Widget _buildMissionsSection(BuildContext context, UserProfile profile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.flag_rounded, color: AppColors.primary, size: 22),
            const SizedBox(width: 8),
            Text(
              'Misiones del dia',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimaryOf(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...profile.missions.asMap().entries.map((entry) {
          final i = entry.key;
          final mission = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _MissionTile(mission: mission, index: i),
          );
        }),
      ],
    ).animate().fadeIn(delay: 200.ms, duration: 500.ms);
  }

  Widget _buildTodaySalesWithTrend(
    BuildContext context,
    GameState state,
    UserProfile profile,
  ) {
    return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Ventas de hoy',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryOf(context),
                  ),
                ),
                const Spacer(),
                Text(
                  'Prom: ${state.weeklyAverage.toStringAsFixed(1)}/dia',
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondaryOf(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            GlassCard(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Sparkline(
                    data: state.weeklyTrend,
                    lineColor: AppColors.primary,
                    fillColor: AppColors.primary.withValues(alpha: 0.12),
                    height: 50,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Hoy']
                        .map(
                          (d) => Text(
                            d,
                            style: GoogleFonts.manrope(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textTertiary,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: ProductType.values.map((product) {
                final count = profile.todaySales[product] ?? 0;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: GlassCard(
                      padding: const EdgeInsets.symmetric(
                        vertical: 14,
                        horizontal: 8,
                      ),
                      child: Column(
                        children: [
                          Icon(product.icon, color: product.color, size: 26),
                          const SizedBox(height: 8),
                          Text(
                            '$count',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimaryOf(context),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            product.label,
                            style: GoogleFonts.manrope(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondaryOf(context),
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        )
        .animate()
        .fadeIn(delay: 300.ms, duration: 500.ms)
        .slideY(begin: 0.05, end: 0, duration: 500.ms);
  }

  Widget _buildRankingPreview(BuildContext context, GameState state) {
    final top3 = state.ranking.take(3).toList();
    return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.leaderboard_rounded,
                    color: AppColors.secondary,
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Ranking semanal',
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimaryOf(context),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Tu: #${state.ranking.firstWhere((r) => r.isCurrentUser).position}',
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ...top3.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: entry.position == 1
                              ? AppColors.gold
                              : entry.position == 2
                              ? AppColors.silver
                              : AppColors.bronze,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${entry.position}',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          entry.name,
                          style: GoogleFonts.manrope(
                            fontSize: 14,
                            fontWeight: entry.isCurrentUser
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: entry.isCurrentUser
                                ? AppColors.primary
                                : AppColors.textPrimaryOf(context),
                          ),
                        ),
                      ),
                      Text(
                        '${entry.totalSales} ventas',
                        style: GoogleFonts.manrope(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondaryOf(context),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(delay: 400.ms, duration: 500.ms)
        .slideY(begin: 0.05, end: 0, duration: 500.ms);
  }

  Widget _buildSimulationBanner(BuildContext context) {
    return GestureDetector(
          onTap: () {
            Haptics.tap();
            Navigator.of(
              context,
            ).push(SlideUpRoute(page: const SimulationScreen()));
          },
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF7A28FF), Color(0xFF2DE2E2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.secondary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.psychology_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Modo simulacion',
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Practica con un cliente virtual',
                        style: GoogleFonts.manrope(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ],
            ),
          ),
        )
        .animate()
        .fadeIn(delay: 500.ms, duration: 500.ms)
        .slideY(begin: 0.05, end: 0, duration: 500.ms);
  }
}

// --- Hero Header with animated gradient ---
class _HeroHeader extends StatefulWidget {
  final GameState state;
  final UserProfile profile;

  const _HeroHeader({required this.state, required this.profile});

  @override
  State<_HeroHeader> createState() => _HeroHeaderState();
}

class _HeroHeaderState extends State<_HeroHeader>
    with SingleTickerProviderStateMixin {
  late AnimationController _gradientController;

  @override
  void initState() {
    super.initState();
    _gradientController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _gradientController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _gradientController,
      builder: (context, child) {
        final t = _gradientController.value;
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(-1 + t * 0.5, -1),
              end: Alignment(1 - t * 0.5, 1),
              colors: [
                AppColors.primary.withValues(alpha: 0.04 + t * 0.04),
                AppColors.secondary.withValues(alpha: 0.02 + t * 0.03),
                AppColors.background,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
          child: child,
        );
      },
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${widget.state.greeting},',
                            style: GoogleFonts.manrope(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.profile.name,
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SyncIndicator(
                      isSyncing: widget.state.isSyncing,
                      isOnline: widget.state.isOnline,
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.local_fire_department_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${widget.profile.streak}',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ).animate().scale(
                      delay: 300.ms,
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                    ),
                  ],
                )
                .animate()
                .fadeIn(duration: 400.ms)
                .slideY(begin: -0.1, end: 0, duration: 400.ms),
            const SizedBox(height: 10),
            // Motivational phrase
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.tertiary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.tertiary.withValues(alpha: 0.12),
                ),
              ),
              child: Text(
                '"${widget.state.motivationalPhrase}"',
                style: GoogleFonts.manrope(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
          ],
        ),
      ),
    );
  }
}

// --- Ticket Chip ---
class _TicketChip extends StatelessWidget {
  final TicketRecord ticket;

  const _TicketChip({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Container(
          width: 140,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surfaceOf(context),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: ticket.status.color.withValues(alpha: 0.2),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.cardShadowOf(context),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    ticket.product.icon,
                    color: ticket.product.color,
                    size: 18,
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: ticket.status.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          ticket.status.icon,
                          size: 10,
                          color: ticket.status.color,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          ticket.status.label,
                          style: GoogleFonts.manrope(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: ticket.status.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              Text(
                ticket.product.label,
                style: GoogleFonts.manrope(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimaryOf(context),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideX(begin: 0.1, end: 0, duration: 300.ms);
  }
}

class _MissionTile extends StatelessWidget {
  final DailyMission mission;
  final int index;

  const _MissionTile({required this.mission, required this.index});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: mission.isCompleted
                      ? AppColors.success.withValues(alpha: 0.15)
                      : AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  mission.isCompleted
                      ? Icons.check_circle_rounded
                      : mission.product?.icon ?? Icons.school_rounded,
                  color: mission.isCompleted
                      ? AppColors.success
                      : mission.product?.color ?? AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      mission.description,
                      style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: mission.isCompleted
                            ? AppColors.textTertiaryOf(context)
                            : AppColors.textPrimaryOf(context),
                        decoration: mission.isCompleted
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: mission.progress,
                              minHeight: 6,
                              backgroundColor: AppColors.backgroundOf(context),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                mission.isCompleted
                                    ? AppColors.success
                                    : AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '${mission.current}/${mission.target}',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondaryOf(context),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '+${mission.xpReward}',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.secondary,
                  ),
                ),
              ),
            ],
          ),
        )
        .animate(delay: Duration(milliseconds: 100 * index))
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.05, end: 0, duration: 400.ms);
  }
}
