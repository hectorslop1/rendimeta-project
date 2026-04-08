import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../../core/game_state.dart';
import '../../../theme/app_colors.dart';
import '../domain/rendimeta_assistant_snapshot.dart';
import '../domain/voice_assistant_models.dart';
import '../services/rendimeta_voice_assistant_controller.dart';
import 'widgets/rendimeta_voice_orb.dart';

class VoiceAssistantScreen extends StatefulWidget {
  const VoiceAssistantScreen({super.key});

  @override
  State<VoiceAssistantScreen> createState() => _VoiceAssistantScreenState();
}

class _VoiceAssistantScreenState extends State<VoiceAssistantScreen> {
  final RendimetaVoiceAssistantController _assistantController =
      RendimetaVoiceAssistantController();
  bool _isClosing = false;

  RendimetaAssistantSnapshot get _snapshot =>
      RendimetaAssistantSnapshot.fromGameState(context.read<GameState>());

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _assistantController.startSession(_snapshot);
    });
  }

  @override
  void dispose() {
    _assistantController.dispose();
    super.dispose();
  }

  Future<void> _closeVoiceMode() async {
    if (_isClosing) return;
    _isClosing = true;
    try {
      await _assistantController.endSession();
    } finally {
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    }
  }

  Future<void> _toggleMic() async {
    await _assistantController.toggleMic(_snapshot);
  }

  @override
  Widget build(BuildContext context) {
    final textPrimary = AppColors.textPrimaryOf(context);
    final textSecondary = AppColors.textSecondaryOf(context);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop || _isClosing) return;
        await _closeVoiceMode();
      },
      child: AnimatedBuilder(
        animation: _assistantController,
        builder: (context, _) {
          return Scaffold(
            backgroundColor: const Color(0xFFF7F8FA),
            body: SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 10, 18, 0),
                    child: Row(
                      children: [
                        _RoundIconButton(
                          icon: Icons.chevron_left_rounded,
                          onTap: _closeVoiceMode,
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                'Conversando con RendiCoach',
                                style: GoogleFonts.spaceGrotesk(
                                  color: textPrimary,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Coach de metas, ventas y ranking',
                                style: GoogleFonts.manrope(
                                  color: textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 46),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Expanded(
                    child: Column(
                      children: [
                        const SizedBox(height: 12),
                        RepaintBoundary(
                          child: RendimetaVoiceOrb(
                            status: _assistantController.status,
                            amplitude: _assistantController.orbAmplitude,
                            size: 224,
                          ),
                        ),
                        const SizedBox(height: 28),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: AnimatedOpacity(
                            opacity:
                                _assistantController.visibleTranscript.isEmpty
                                ? 0.6
                                : 1,
                            duration: const Duration(milliseconds: 220),
                            child: Text(
                              _assistantController.visibleTranscript,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.manrope(
                                color: textPrimary.withValues(alpha: 0.78),
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                height: 1.45,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          _statusLabel(_assistantController.status),
                          style: GoogleFonts.manrope(
                            color: textSecondary,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _ContextStrip(snapshot: _snapshot),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 1,
                    height: 1,
                    child: RTCVideoView(
                      _assistantController.remoteAudioRenderer,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _VoiceActionButton(
                          backgroundColor: _assistantController.isMicMuted
                              ? const Color(0xFFEFF7FF)
                              : const Color(0xFFFFEEF6),
                          foregroundColor: _assistantController.isMicMuted
                              ? AppColors.secondary
                              : AppColors.primary,
                          icon: _assistantController.isMicMuted
                              ? Icons.mic_off_rounded
                              : Icons.mic_rounded,
                          label: _assistantController.isMicMuted
                              ? 'Activar'
                              : 'Silenciar',
                          onTap: _toggleMic,
                        ),
                        _VoiceActionButton(
                          backgroundColor: Colors.white,
                          foregroundColor: textPrimary,
                          icon: Icons.close_rounded,
                          label: 'Terminar',
                          onTap: _closeVoiceMode,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String _statusLabel(RendimetaVoiceAssistantStatus status) {
    return switch (status) {
      RendimetaVoiceAssistantStatus.connecting => 'Conectando voz...',
      RendimetaVoiceAssistantStatus.listening => 'Escuchando',
      RendimetaVoiceAssistantStatus.processing => 'Procesando',
      RendimetaVoiceAssistantStatus.speaking => 'Respondiendo',
      RendimetaVoiceAssistantStatus.ending => 'Cerrando conversación...',
      RendimetaVoiceAssistantStatus.error => 'Ocurrió un problema',
      RendimetaVoiceAssistantStatus.idle => 'Listo',
    };
  }
}

class _ContextStrip extends StatelessWidget {
  const _ContextStrip({required this.snapshot});

  final RendimetaAssistantSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final pendingMission = snapshot.profile.missions.where(
      (m) => !m.isCompleted,
    );
    final nextMission = pendingMission.isEmpty ? null : pendingMission.first;

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 10,
      runSpacing: 10,
      children: [
        _ContextPill(
          icon: Icons.sell_rounded,
          label: '${snapshot.profile.todayTotalSales} ventas hoy',
          color: AppColors.primary,
        ),
        _ContextPill(
          icon: Icons.emoji_events_rounded,
          label: '${snapshot.profile.xp} XP',
          color: AppColors.secondary,
        ),
        _ContextPill(
          icon: Icons.flag_rounded,
          label: nextMission == null
              ? 'Metas completas'
              : 'Meta: ${nextMission.current}/${nextMission.target}',
          color: AppColors.tertiary,
        ),
      ],
    );
  }
}

class _ContextPill extends StatelessWidget {
  const _ContextPill({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 46,
          height: 46,
          child: Icon(icon, color: AppColors.textPrimaryOf(context)),
        ),
      ),
    );
  }
}

class _VoiceActionButton extends StatelessWidget {
  const _VoiceActionButton({
    required this.backgroundColor,
    required this.foregroundColor,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final Color backgroundColor;
  final Color foregroundColor;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: backgroundColor,
          shape: const CircleBorder(),
          elevation: 4,
          shadowColor: Colors.black.withValues(alpha: 0.08),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: SizedBox(
              width: 68,
              height: 68,
              child: Icon(icon, color: foregroundColor, size: 28),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: GoogleFonts.manrope(
            color: AppColors.textSecondaryOf(context),
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
