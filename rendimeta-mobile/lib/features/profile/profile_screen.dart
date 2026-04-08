import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/game_state.dart';
import '../../core/haptics.dart';
import '../../core/models.dart';
import '../../core/theme_notifier.dart';
import '../../theme/app_colors.dart';
import '../../widgets/animated_progress_ring.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/xp_progress_bar.dart';
import '../auth/login_screen.dart';
import '../../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _rankingExpanded = false;

  Future<void> _logout() async {
    Haptics.tap();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Cerrar sesión',
          style: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryOf(context),
          ),
        ),
        content: Text(
          '¿Estás seguro que deseas cerrar sesión?',
          style: GoogleFonts.manrope(color: AppColors.textSecondaryOf(context)),
        ),
        backgroundColor: AppColors.surfaceOf(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancelar',
              style: GoogleFonts.manrope(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'Cerrar sesión',
              style: GoogleFonts.manrope(
                color: AppColors.error,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await SupabaseClientService.client.auth.signOut();
      } catch (_) {}

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, state, _) {
        final profile = state.profile;
        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                  child: Column(
                    children: [
                      _buildProfileHeader(profile),
                      const SizedBox(height: 24),
                      _buildStatsRow(profile),
                      const SizedBox(height: 24),
                      _buildLevelProgress(profile),
                      const SizedBox(height: 28),
                      _buildBadgesSection(profile),
                      const SizedBox(height: 28),
                      _buildRankingSection(state),
                      const SizedBox(height: 28),
                      _buildThemeToggle(context),
                      const SizedBox(height: 16),
                      _buildLogoutButton(),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProfileHeader(UserProfile profile) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            AnimatedProgressRing(
              progress: profile.levelProgress,
              size: 116,
              strokeWidth: 6,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    profile.name[0].toUpperCase(),
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 38,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
              ),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${profile.level.index_ + 1}',
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ).animate().scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
          duration: 500.ms,
          curve: Curves.elasticOut,
        ),
        const SizedBox(height: 16),
        Text(
          profile.name,
          style: GoogleFonts.spaceGrotesk(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryOf(context),
          ),
        ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
        const SizedBox(height: 4),
        Text(
          profile.station,
          style: GoogleFonts.manrope(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondaryOf(context),
          ),
        ).animate().fadeIn(delay: 150.ms, duration: 400.ms),
        const SizedBox(height: 6),
        Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                profile.level.title,
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            )
            .animate()
            .fadeIn(delay: 200.ms, duration: 400.ms)
            .scale(
              begin: const Offset(0.9, 0.9),
              end: const Offset(1, 1),
              delay: 200.ms,
              duration: 400.ms,
              curve: Curves.easeOut,
            ),
      ],
    );
  }

  Widget _buildStatsRow(UserProfile profile) {
    return Row(
      children: [
        _StatCard(
          icon: Icons.bolt_rounded,
          value: '${profile.xp}',
          label: 'XP Total',
          color: AppColors.primary,
          index: 0,
        ),
        const SizedBox(width: 12),
        _StatCard(
          icon: Icons.local_fire_department_rounded,
          value: '${profile.streak}',
          label: 'Racha',
          color: AppColors.warning,
          index: 1,
        ),
        const SizedBox(width: 12),
        _StatCard(
          icon: Icons.receipt_long_rounded,
          value: '${profile.totalSales}',
          label: 'Ventas',
          color: AppColors.secondary,
          index: 2,
        ),
      ],
    );
  }

  Widget _buildLevelProgress(UserProfile profile) {
    return GlassCard(
      child: XpProgressBar(
        progress: profile.levelProgress,
        levelName: profile.level.title,
        nextLevelName: profile.nextLevel?.title,
        currentXp: profile.xp,
        nextLevelXp: profile.nextLevel?.xpRequired,
      ),
    ).animate().fadeIn(delay: 300.ms, duration: 500.ms);
  }

  Widget _buildBadgesSection(UserProfile profile) {
    final unlockedCount = profile.badges.where((b) => b.unlocked).length;
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.gold.withValues(alpha: 0.25),
                      AppColors.warning.withValues(alpha: 0.15),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: AppColors.gold,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Insignias',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimaryOf(context),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      profile.badges.isEmpty
                          ? 'Sin insignias cargadas'
                          : '$unlockedCount de ${profile.badges.length} desbloqueadas',
                      style: GoogleFonts.manrope(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondaryOf(context),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: profile.badges.isEmpty
                  ? 0
                  : unlockedCount / profile.badges.length,
              minHeight: 5,
              backgroundColor: AppColors.backgroundOf(context),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
            ),
          ),
          const SizedBox(height: 18),
          // Badges grid: 3 columns
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.82,
            ),
            itemCount: profile.badges.length,
            itemBuilder: (context, i) {
              return _BadgeCard(badge: profile.badges[i]);
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms, duration: 500.ms);
  }

  Widget _buildRankingSection(GameState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () {
            Haptics.tap();
            setState(() => _rankingExpanded = !_rankingExpanded);
          },
          child: Row(
            children: [
              const Icon(
                Icons.leaderboard_rounded,
                color: AppColors.secondary,
                size: 22,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Ranking semanal',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryOf(context),
                  ),
                ),
              ),
              Icon(
                _rankingExpanded
                    ? Icons.keyboard_arrow_up_rounded
                    : Icons.keyboard_arrow_down_rounded,
                color: AppColors.textSecondaryOf(context),
                size: 24,
              ),
            ],
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child: _rankingExpanded
              ? Column(
                  children: [
                    const SizedBox(height: 16),
                    ...state.ranking.asMap().entries.map((entry) {
                      final i = entry.key;
                      final rank = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _RankingTile(entry: rank, index: i),
                      );
                    }),
                  ],
                )
              : const SizedBox.shrink(),
        ),
      ],
    ).animate().fadeIn(delay: 500.ms, duration: 500.ms);
  }

  Widget _buildThemeToggle(BuildContext context) {
    final themeNotifier = context.watch<ThemeNotifier>();
    final isDark = themeNotifier.isDark;
    return GlassCard(
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.secondary.withValues(alpha: 0.15)
                  : AppColors.warning.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
              color: isDark ? AppColors.secondary : AppColors.warning,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Modo oscuro',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryOf(context),
                  ),
                ),
                Text(
                  isDark ? 'Activado' : 'Desactivado',
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondaryOf(context),
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: isDark,
            onChanged: (_) {
              Haptics.tap();
              themeNotifier.toggle();
            },
            activeTrackColor: AppColors.primary,
            activeThumbColor: Colors.white,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 600.ms, duration: 500.ms);
  }

  Widget _buildLogoutButton() {
    return GlassCard(
      child: InkWell(
        onTap: _logout,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.logout_rounded,
                  color: AppColors.error,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  'Cerrar sesión',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                color: AppColors.error.withValues(alpha: 0.5),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 700.ms, duration: 500.ms);
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final int index;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child:
          GlassCard(
                padding: const EdgeInsets.symmetric(
                  vertical: 18,
                  horizontal: 12,
                ),
                child: Column(
                  children: [
                    Icon(icon, color: color, size: 26),
                    const SizedBox(height: 10),
                    Text(
                      value,
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimaryOf(context),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      label,
                      style: GoogleFonts.manrope(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondaryOf(context),
                      ),
                    ),
                  ],
                ),
              )
              .animate(delay: Duration(milliseconds: 200 + index * 100))
              .fadeIn(duration: 400.ms)
              .slideY(begin: 0.1, end: 0, duration: 400.ms),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final Badge badge;

  const _BadgeCard({required this.badge});

  Color get _tierColor {
    switch (badge.tier) {
      case BadgeTier.gold:
        return const Color(0xFFD4A000);
      case BadgeTier.silver:
        return const Color(0xFF8E8E93);
      case BadgeTier.bronze:
        return const Color(0xFFBE7023);
    }
  }

  Color get _tierBgColor {
    switch (badge.tier) {
      case BadgeTier.gold:
        return const Color(0xFFFFFBEB);
      case BadgeTier.silver:
        return const Color(0xFFF7F7F8);
      case BadgeTier.bronze:
        return const Color(0xFFFFF5EB);
    }
  }

  List<Color> get _tierGradient {
    switch (badge.tier) {
      case BadgeTier.gold:
        return [
          const Color(0xFFFFD700),
          const Color(0xFFE8A800),
          const Color(0xFFFFA500),
        ];
      case BadgeTier.silver:
        return [
          const Color(0xFFD0D0D0),
          const Color(0xFFB0B0B0),
          const Color(0xFF9E9E9E),
        ];
      case BadgeTier.bronze:
        return [
          const Color(0xFFD4903C),
          const Color(0xFFCD7F32),
          const Color(0xFFB8690E),
        ];
    }
  }

  String get _tierLabel {
    switch (badge.tier) {
      case BadgeTier.gold:
        return 'ORO';
      case BadgeTier.silver:
        return 'PLATA';
      case BadgeTier.bronze:
        return 'BRONCE';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () {
        Haptics.tap();
        _showBadgeDetail(context);
      },
      child: Container(
        decoration: BoxDecoration(
          color: badge.unlocked
              ? (isDark ? AppColors.surfaceOf(context) : _tierBgColor)
              : AppColors.backgroundOf(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: badge.unlocked
                ? _tierColor.withValues(alpha: 0.20)
                : AppColors.textTertiaryOf(context).withValues(alpha: 0.12),
            width: 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon circle with gradient for unlocked, gray for locked
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: badge.unlocked
                    ? LinearGradient(
                        colors: _tierGradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: badge.unlocked
                    ? null
                    : AppColors.textTertiaryOf(context).withValues(alpha: 0.10),
                boxShadow: badge.unlocked
                    ? [
                        BoxShadow(
                          color: _tierColor.withValues(alpha: 0.30),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : [],
              ),
              child: Icon(
                badge.unlocked ? badge.icon : Icons.lock_outline_rounded,
                color: badge.unlocked
                    ? Colors.white
                    : AppColors.textTertiaryOf(context).withValues(alpha: 0.5),
                size: 22,
              ),
            ),
            const SizedBox(height: 8),
            // Badge name
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                badge.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.manrope(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: badge.unlocked
                      ? AppColors.textPrimaryOf(context)
                      : AppColors.textTertiaryOf(context),
                  height: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 4),
            // Tier label
            if (badge.unlocked)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _tierColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _tierLabel,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    color: _tierColor,
                    letterSpacing: 1,
                  ),
                ),
              )
            else
              Text(
                'Bloqueada',
                style: GoogleFonts.manrope(
                  fontSize: 9,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textTertiaryOf(
                    context,
                  ).withValues(alpha: 0.6),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showBadgeDetail(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: AppColors.surfaceOf(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiaryOf(context).withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: badge.unlocked
                    ? LinearGradient(
                        colors: _tierGradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: badge.unlocked ? null : AppColors.backgroundOf(context),
                border: badge.unlocked
                    ? null
                    : Border.all(
                        color: AppColors.textTertiaryOf(
                          context,
                        ).withValues(alpha: 0.2),
                        width: 2,
                      ),
                boxShadow: badge.unlocked
                    ? [
                        BoxShadow(
                          color: _tierColor.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : [],
              ),
              child: Icon(
                badge.unlocked ? badge.icon : Icons.lock_outline_rounded,
                color: badge.unlocked
                    ? Colors.white
                    : AppColors.textTertiaryOf(context),
                size: 38,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              badge.name,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimaryOf(context),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              badge.description,
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondaryOf(context),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: _tierColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _tierLabel,
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: _tierColor,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _RankingTile extends StatelessWidget {
  final RankingEntry entry;
  final int index;

  const _RankingTile({required this.entry, required this.index});

  @override
  Widget build(BuildContext context) {
    final isTop3 = entry.position <= 3;
    return GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          gradient: entry.isCurrentUser ? AppColors.subtleGradient : null,
          child: Row(
            children: [
              if (isTop3)
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: entry.position == 1
                        ? AppColors.gold
                        : entry.position == 2
                        ? AppColors.silver
                        : AppColors.bronze,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.workspace_premium_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                )
              else
                SizedBox(
                  width: 32,
                  height: 32,
                  child: Center(
                    child: Text(
                      '${entry.position}',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              const SizedBox(width: 14),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: entry.isCurrentUser
                      ? AppColors.primary.withValues(alpha: 0.15)
                      : AppColors.background,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    entry.name[0],
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: entry.isCurrentUser
                          ? AppColors.primary
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.isCurrentUser ? '${entry.name} (Tu)' : entry.name,
                      style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: entry.isCurrentUser
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: entry.isCurrentUser
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '${entry.totalSales}',
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: entry.isCurrentUser
                      ? AppColors.primary
                      : AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                'ventas',
                style: GoogleFonts.manrope(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
        )
        .animate(delay: Duration(milliseconds: 50 * index))
        .fadeIn(duration: 300.ms)
        .slideX(begin: 0.05, end: 0, duration: 300.ms);
  }
}
