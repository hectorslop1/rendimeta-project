import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/game_state.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';
import '../voice_assistant/domain/rendimeta_assistant_snapshot.dart';

class AiTextAssistantScreen extends StatefulWidget {
  const AiTextAssistantScreen({super.key});

  @override
  State<AiTextAssistantScreen> createState() => _AiTextAssistantScreenState();
}

class _AiTextAssistantScreenState extends State<AiTextAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final OpenAiChatService _chatService = OpenAiChatService();
  final List<_AiMessage> _messages = <_AiMessage>[
    const _AiMessage(
      sender: 'RendiCoach',
      content:
          'Pregúntame por tus metas, ventas, ranking o qué te conviene ofrecer.',
      isUser: false,
    ),
  ];
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final prompt = _controller.text.trim();
    if (prompt.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
      _messages.add(_AiMessage(sender: 'Tú', content: prompt, isUser: true));
    });
    _controller.clear();
    _scrollToBottom();

    final snapshot = RendimetaAssistantSnapshot.fromGameState(
      context.read<GameState>(),
    );

    try {
      final reply = await _chatService.reply(
        prompt: prompt,
        snapshot: snapshot,
        history: _buildHistory(),
      );
      if (!mounted) return;
      setState(() {
        _messages.add(
          _AiMessage(sender: 'RendiCoach', content: reply, isUser: false),
        );
      });
    } catch (error) {
      if (!mounted) return;
      final safe = _humanizeError(error);
      setState(() {
        _messages.add(
          _AiMessage(
            sender: 'RendiCoach',
            content: safe,
            isUser: false,
            isError: true,
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
        _scrollToBottom();
      }
    }
  }

  List<OpenAiChatMessage> _buildHistory() {
    // Excluye el mensaje inicial "Pregúntame..." y limita contexto.
    final turns = _messages.skip(1).where((m) => !m.isError).toList();
    final recent = turns.length <= 10
        ? turns
        : turns.sublist(turns.length - 10);

    return recent
        .map(
          (m) => OpenAiChatMessage(
            role: m.isUser ? 'user' : 'assistant',
            content: m.content,
          ),
        )
        .toList(growable: false);
  }

  String _humanizeError(Object error) {
    final raw = error.toString().toLowerCase();
    if (raw.contains('openai_api_key') || raw.contains('api key')) {
      return 'La IA no está disponible por configuración. Avísale a tu administrador.';
    }
    if (raw.contains('insufficient_quota') || raw.contains('quota')) {
      return 'La IA no está disponible en este momento. Intenta más tarde.';
    }
    if (raw.contains('timed out') || raw.contains('timeout')) {
      return 'La IA tardó demasiado en responder. Intenta de nuevo.';
    }
    if (raw.contains('network') || raw.contains('socket')) {
      return 'No pude conectarme para responder. Revisa tu internet e inténtalo otra vez.';
    }
    return 'No pude responder en este momento. Intenta de nuevo.';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundOf(context),
      appBar: AppBar(
        backgroundColor: AppColors.backgroundOf(context),
        elevation: 0,
        title: Text(
          'IA Texto',
          style: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryOf(context),
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return Align(
                  alignment: message.isUser
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    constraints: const BoxConstraints(maxWidth: 320),
                    decoration: BoxDecoration(
                      color: message.isUser
                          ? AppColors.primary.withValues(alpha: 0.12)
                          : message.isError
                          ? AppColors.error.withValues(alpha: 0.10)
                          : AppColors.surfaceOf(context),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: message.isError
                            ? AppColors.error.withValues(alpha: 0.20)
                            : message.isUser
                            ? AppColors.primary.withValues(alpha: 0.22)
                            : AppColors.textTertiaryOf(
                                context,
                              ).withValues(alpha: 0.10),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.sender,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: message.isError
                                ? AppColors.error
                                : message.isUser
                                ? AppColors.primary
                                : AppColors.secondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          message.content,
                          style: GoogleFonts.manrope(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimaryOf(context),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      style: GoogleFonts.manrope(
                        color: AppColors.textPrimaryOf(context),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Escribe tu pregunta...',
                        hintStyle: GoogleFonts.manrope(
                          color: AppColors.textTertiaryOf(context),
                        ),
                        filled: true,
                        fillColor: AppColors.surfaceOf(context),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(
                    onPressed: _isSending ? null : _send,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(16),
                    ),
                    child: _isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded),
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

class _AiMessage {
  const _AiMessage({
    required this.sender,
    required this.content,
    required this.isUser,
    this.isError = false,
  });

  final String sender;
  final String content;
  final bool isUser;
  final bool isError;
}
