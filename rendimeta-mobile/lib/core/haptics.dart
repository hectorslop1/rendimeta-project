import 'package:flutter/services.dart';

class Haptics {
  Haptics._();

  static void tap() {
    HapticFeedback.lightImpact();
  }

  static void success() {
    HapticFeedback.mediumImpact();
    Future.delayed(const Duration(milliseconds: 80), () {
      HapticFeedback.lightImpact();
    });
  }

  static void levelUp() {
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 100), () {
      HapticFeedback.mediumImpact();
    });
    Future.delayed(const Duration(milliseconds: 200), () {
      HapticFeedback.lightImpact();
    });
  }

  static void error() {
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 150), () {
      HapticFeedback.heavyImpact();
    });
  }

  static void selection() {
    HapticFeedback.selectionClick();
  }

  static void sale() {
    HapticFeedback.mediumImpact();
  }

  static void celebration() {
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 120), () {
      HapticFeedback.mediumImpact();
    });
    Future.delayed(const Duration(milliseconds: 240), () {
      HapticFeedback.lightImpact();
    });
  }

  static void fireworkBurst() {
    HapticFeedback.heavyImpact();
  }

  static void giftOpen() {
    HapticFeedback.heavyImpact();
    Future.delayed(const Duration(milliseconds: 100), () {
      HapticFeedback.mediumImpact();
    });
    Future.delayed(const Duration(milliseconds: 200), () {
      HapticFeedback.heavyImpact();
    });
    Future.delayed(const Duration(milliseconds: 350), () {
      HapticFeedback.lightImpact();
    });
  }
}
