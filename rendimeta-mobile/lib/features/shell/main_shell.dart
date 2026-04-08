import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:reward_popup/reward_popup.dart';
import '../../core/game_state.dart';
import '../../core/haptics.dart';
import '../../theme/app_colors.dart';
import '../../widgets/celebration_overlay.dart';
import '../../widgets/shimmer_skeleton.dart';
import '../../widgets/validation_success_animation.dart';
import '../chat/chat_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../sales/sales_screen.dart';
import '../training/training_screen.dart';
import '../profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _showSkeleton = false;
  bool _rewardPopupShowing = false;
  late PageController _pageController;

  final _screens = const <Widget>[
    DashboardScreen(),
    SalesScreen(),
    TrainingScreen(),
    ChatScreen(),
    ProfileScreen(),
  ];

  final _skeletons = const <Widget>[
    DashboardSkeleton(),
    SalesSkeleton(),
    TrainingSkeleton(),
    SalesSkeleton(),
    ProfileSkeleton(),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (index == _currentIndex) return;
    Haptics.selection();
    _showSkeletonBriefly();
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  void _onPageChanged(int index) {
    if (index == _currentIndex) return;
    Haptics.selection();
    setState(() => _currentIndex = index);
    if (index == 3) {
      context.read<GameState>().clearUnreadChat();
    }
  }

  void _showSkeletonBriefly() {
    setState(() => _showSkeleton = true);
    Future.delayed(const Duration(milliseconds: 350), () {
      if (mounted) setState(() => _showSkeleton = false);
    });
  }

  void _showRewardPopup(BuildContext ctx, GameState state) {
    if (_rewardPopupShowing) return;
    _rewardPopupShowing = true;
    state.dismissAllMissionsReward();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await showRewardPopup(
        ctx,
        backgroundColor: Colors.black.withValues(alpha: 0.7),
        child: Center(
          child: GestureDetector(
            onTap: () {
              state.claimAllMissionsReward();
              Navigator.of(ctx).pop();
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.5),
                        blurRadius: 40,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.card_giftcard_rounded,
                    color: Colors.white,
                    size: 64,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Completaste todas\ntus metas!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.spaceGrotesk(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Toca el regalo para reclamar\n+50 XP',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.manrope(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
      _rewardPopupShowing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<GameState>(
      builder: (context, state, _) {
        // Trigger reward popup when all missions are completed
        if (state.showAllMissionsReward && !_rewardPopupShowing) {
          _showRewardPopup(context, state);
        }

        return Stack(
          children: [
            Scaffold(
              backgroundColor: AppColors.backgroundOf(context),
              body: Stack(
                children: [
                  PageView(
                    controller: _pageController,
                    onPageChanged: _onPageChanged,
                    physics: const BouncingScrollPhysics(),
                    children: _screens,
                  ),
                  if (_showSkeleton)
                    Positioned.fill(
                      child: Container(
                        color: AppColors.backgroundOf(context),
                        child: _skeletons[_currentIndex],
                      ),
                    ),
                ],
              ),
              bottomNavigationBar: _buildBottomNav(state),
            ),
            if (state.showCelebration)
              CelebrationOverlay(
                message: state.celebrationMessage,
                onDismiss: state.dismissCelebration,
              ),
            if (state.showValidationAnimation)
              Positioned.fill(
                child: Container(
                  color: Colors.black.withValues(alpha: 0.7),
                  child: ValidationSuccessAnimation(
                    onComplete: state.dismissValidationAnimation,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildBottomNav(GameState state) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceOf(context),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: Icons.home_rounded,
                label: 'Inicio',
                isSelected: _currentIndex == 0,
                onTap: () => _onTabTapped(0),
              ),
              _NavItem(
                icon: Icons.add_circle_rounded,
                label: 'Registrar',
                isSelected: _currentIndex == 1,
                onTap: () => _onTabTapped(1),
                isPrimary: true,
              ),
              _NavItem(
                icon: Icons.school_rounded,
                label: 'Capacitar',
                isSelected: _currentIndex == 2,
                onTap: () => _onTabTapped(2),
              ),
              _NavItem(
                icon: Icons.chat_rounded,
                label: 'Chat',
                isSelected: _currentIndex == 3,
                onTap: () => _onTabTapped(3),
                badge: state.unreadChatCount,
              ),
              _NavItem(
                icon: Icons.person_rounded,
                label: 'Perfil',
                isSelected: _currentIndex == 4,
                onTap: () => _onTabTapped(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isPrimary;
  final int badge;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.isPrimary = false,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (isPrimary
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : AppColors.primary.withValues(alpha: 0.08))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  child: Icon(
                    icon,
                    size: isSelected ? 26 : 22,
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.textTertiaryOf(context),
                  ),
                ),
                if (badge > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.surfaceOf(context),
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '$badge',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.manrope(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected
                    ? AppColors.primary
                    : AppColors.textTertiaryOf(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
