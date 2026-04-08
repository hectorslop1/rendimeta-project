import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand colors (fixed across themes)
  static const Color primary = Color(0xFFE6007A);
  static const Color secondary = Color(0xFF7A28FF);
  static const Color tertiary = Color(0xFF2DE2E2);
  static const Color success = Color(0xFF00B894);
  static const Color warning = Color(0xFFFDAA5E);
  static const Color error = Color(0xFFFF6B6B);
  static const Color gold = Color(0xFFFFD700);
  static const Color silver = Color(0xFFC0C0C0);
  static const Color bronze = Color(0xFFCD7F32);

  // Theme-adaptive colors — light
  static const Color _bgLight = Color(0xFFF8F9FA);
  static const Color _surfaceLight = Colors.white;
  static const Color _textPrimaryLight = Color(0xFF2D3436);
  static const Color _textSecondaryLight = Color(0xFF636E72);
  static const Color _textTertiaryLight = Color(0xFFB2BEC3);
  static const Color _cardShadowLight = Color(0x0A000000);

  // Theme-adaptive colors — dark
  static const Color _bgDark = Color(0xFF121212);
  static const Color _surfaceDark = Color(0xFF1E1E1E);
  static const Color _textPrimaryDark = Color(0xFFECECEC);
  static const Color _textSecondaryDark = Color(0xFFA0A0A0);
  static const Color _textTertiaryDark = Color(0xFF5A5A5A);
  static const Color _cardShadowDark = Color(0x20000000);

  // Brightness check helper
  static bool _isDark(BuildContext? ctx) {
    if (ctx == null) return false;
    return Theme.of(ctx).brightness == Brightness.dark;
  }

  // Static const defaults (light theme — preserves const usage across app)
  static const Color background = _bgLight;
  static const Color surface = _surfaceLight;
  static const Color textPrimary = _textPrimaryLight;
  static const Color textSecondary = _textSecondaryLight;
  static const Color textTertiary = _textTertiaryLight;
  static const Color cardShadow = _cardShadowLight;

  static Color backgroundOf(BuildContext ctx) =>
      _isDark(ctx) ? _bgDark : _bgLight;
  static Color surfaceOf(BuildContext ctx) =>
      _isDark(ctx) ? _surfaceDark : _surfaceLight;
  static Color textPrimaryOf(BuildContext ctx) =>
      _isDark(ctx) ? _textPrimaryDark : _textPrimaryLight;
  static Color textSecondaryOf(BuildContext ctx) =>
      _isDark(ctx) ? _textSecondaryDark : _textSecondaryLight;
  static Color textTertiaryOf(BuildContext ctx) =>
      _isDark(ctx) ? _textTertiaryDark : _textTertiaryLight;
  static Color cardShadowOf(BuildContext ctx) =>
      _isDark(ctx) ? _cardShadowDark : _cardShadowLight;

  // Gradients (unchanged across themes)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient primaryGradientVertical = LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient subtleGradient = LinearGradient(
    colors: [Color(0xFFFFF0F7), Color(0xFFF0ECFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient subtleGradientOf(BuildContext ctx) => _isDark(ctx)
      ? const LinearGradient(
          colors: [Color(0xFF2A1525), Color(0xFF1E1830)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        )
      : subtleGradient;

  static const LinearGradient xpBarGradient = LinearGradient(
    colors: [primary, secondary, tertiary],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}
