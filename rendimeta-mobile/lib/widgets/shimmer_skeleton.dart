import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: AppColors.textTertiary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(borderRadius),
          ),
        )
        .animate(onPlay: (c) => c.repeat())
        .shimmer(
          duration: 1200.ms,
          color: AppColors.textTertiary.withValues(alpha: 0.12),
        );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      ShimmerBox(width: 120, height: 16),
                      SizedBox(height: 8),
                      ShimmerBox(width: 160, height: 28),
                    ],
                  ),
                ),
                const ShimmerBox(width: 64, height: 36, borderRadius: 20),
              ],
            ),
            const SizedBox(height: 24),
            const ShimmerBox(
              width: double.infinity,
              height: 140,
              borderRadius: 20,
            ),
            const SizedBox(height: 20),
            const ShimmerBox(width: 150, height: 20),
            const SizedBox(height: 14),
            const ShimmerBox(
              width: double.infinity,
              height: 72,
              borderRadius: 16,
            ),
            const SizedBox(height: 10),
            const ShimmerBox(
              width: double.infinity,
              height: 72,
              borderRadius: 16,
            ),
            const SizedBox(height: 10),
            const ShimmerBox(
              width: double.infinity,
              height: 72,
              borderRadius: 16,
            ),
            const SizedBox(height: 20),
            const ShimmerBox(width: 130, height: 20),
            const SizedBox(height: 14),
            Row(
              children: List.generate(
                4,
                (i) => const Expanded(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: ShimmerBox(
                      width: double.infinity,
                      height: 90,
                      borderRadius: 16,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SalesSkeleton extends StatelessWidget {
  const SalesSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(child: ShimmerBox(width: 180, height: 28)),
            const SizedBox(height: 8),
            const Center(child: ShimmerBox(width: 220, height: 14)),
            const SizedBox(height: 32),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                physics: const NeverScrollableScrollPhysics(),
                children: List.generate(
                  4,
                  (i) => const ShimmerBox(
                    width: double.infinity,
                    height: double.infinity,
                    borderRadius: 24,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const ShimmerBox(
              width: double.infinity,
              height: 60,
              borderRadius: 16,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class TrainingSkeleton extends StatelessWidget {
  const TrainingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(child: ShimmerBox(width: 160, height: 28)),
            const SizedBox(height: 8),
            const Center(child: ShimmerBox(width: 100, height: 14)),
            const SizedBox(height: 24),
            Expanded(
              child: ShimmerBox(
                width: double.infinity,
                height: double.infinity,
                borderRadius: 28,
              ),
            ),
            const SizedBox(height: 16),
            const Center(
              child: ShimmerBox(width: 60, height: 8, borderRadius: 4),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
        child: Column(
          children: [
            const ShimmerBox(width: 90, height: 90, borderRadius: 45),
            const SizedBox(height: 14),
            const ShimmerBox(width: 140, height: 22),
            const SizedBox(height: 6),
            const ShimmerBox(width: 180, height: 14),
            const SizedBox(height: 24),
            Row(
              children: List.generate(
                3,
                (i) => const Expanded(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4),
                    child: ShimmerBox(
                      width: double.infinity,
                      height: 80,
                      borderRadius: 16,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const ShimmerBox(
              width: double.infinity,
              height: 80,
              borderRadius: 20,
            ),
            const SizedBox(height: 20),
            const ShimmerBox(width: 120, height: 20),
            const SizedBox(height: 14),
            Expanded(
              child: GridView.count(
                crossAxisCount: 3,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                physics: const NeverScrollableScrollPhysics(),
                children: List.generate(
                  9,
                  (i) => const ShimmerBox(
                    width: double.infinity,
                    height: double.infinity,
                    borderRadius: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
