import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/haptics.dart';
import '../../theme/app_colors.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = _initialMessages;

  static final List<_ChatMessage> _initialMessages = [
    _ChatMessage(
      id: '1',
      text:
          'Buenos dias equipo. Hoy llega promocion de aceites Mobil 2x1. Ofrezcanlo a todos los clientes.',
      sender: 'Gerente Martinez',
      isMe: false,
      time: '8:02 AM',
      status: _ReadStatus.solved,
      isChannel: true,
    ),
    _ChatMessage(
      id: '2',
      text: 'Entendido jefe, ya le avisamos a los demas.',
      sender: 'Carlos M.',
      isMe: false,
      time: '8:05 AM',
      status: _ReadStatus.received,
      isChannel: true,
    ),
    _ChatMessage(
      id: '3',
      text: 'Listo, ya empece a ofrecerlo!',
      sender: 'Tu',
      isMe: true,
      time: '8:15 AM',
      status: _ReadStatus.received,
      isChannel: true,
    ),
    _ChatMessage(
      id: '4',
      text:
          'La bomba 3 esta tardando en despachar. Puede ser que necesite calibracion.',
      sender: 'Tu',
      isMe: true,
      time: '9:30 AM',
      status: _ReadStatus.onTheWay,
      isChannel: false,
    ),
    _ChatMessage(
      id: '5',
      text: 'Ya avise al tecnico. Llega en 20 minutos.',
      sender: 'Gerente Martinez',
      isMe: false,
      time: '9:35 AM',
      status: _ReadStatus.onTheWay,
      isChannel: false,
    ),
  ];

  static const _quickActions = [
    _QuickAction(
      Icons.local_gas_station_rounded,
      'Problema con bomba',
      Color(0xFFE53935),
    ),
    _QuickAction(Icons.inventory_2_rounded, 'Falta insumo', Color(0xFFFFAA5E)),
    _QuickAction(Icons.sell_rounded, 'Duda de promocion', Color(0xFF7A28FF)),
    _QuickAction(
      Icons.help_outline_rounded,
      'Otra consulta',
      Color(0xFF2DE2E2),
    ),
  ];

  int _activeTab = 0;

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    Haptics.tap();
    setState(() {
      _messages.add(
        _ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: text.trim(),
          sender: 'Tu',
          isMe: true,
          time: _formatNow(),
          status: _ReadStatus.received,
          isChannel: _activeTab == 0,
        ),
      );
    });
    _controller.clear();
    Future.delayed(const Duration(milliseconds: 100), () {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
    // Simulate gerente response
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      Haptics.tap();
      setState(() {
        _messages.add(
          _ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: 'Recibido. En un momento lo revisamos.',
            sender: 'Gerente Martinez',
            isMe: false,
            time: _formatNow(),
            status: _ReadStatus.received,
            isChannel: _activeTab == 0,
          ),
        );
      });
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent + 80,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    });
  }

  String _formatNow() {
    final now = DateTime.now();
    final h = now.hour > 12 ? now.hour - 12 : now.hour;
    final m = now.minute.toString().padLeft(2, '0');
    final p = now.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $p';
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _messages
        .where((m) => _activeTab == 0 ? m.isChannel : !m.isChannel)
        .toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundOf(context),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabs(),
            Expanded(
              child: filtered.isEmpty
                  ? _buildEmptyChat()
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      itemCount: filtered.length,
                      itemBuilder: (context, i) =>
                          _MessageBubble(message: filtered[i], index: i),
                    ),
            ),
            _buildQuickActions(),
            _buildInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 4),
      child: Row(
        children: [
          Text(
            'RendiChat',
            style: GoogleFonts.spaceGrotesk(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryOf(context),
            ),
          ),
          const Spacer(),
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: AppColors.success,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.success.withValues(alpha: 0.4),
                  blurRadius: 6,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'En linea',
            style: GoogleFonts.manrope(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.success,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildTabs() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 4),
      child: Row(
        children: [
          _ChatTab(
            label: 'Canal Estacion',
            icon: Icons.groups_rounded,
            isActive: _activeTab == 0,
            onTap: () {
              Haptics.selection();
              setState(() => _activeTab = 0);
            },
          ),
          const SizedBox(width: 10),
          _ChatTab(
            label: 'Gerente',
            icon: Icons.person_rounded,
            isActive: _activeTab == 1,
            badge: 1,
            onTap: () {
              Haptics.selection();
              setState(() => _activeTab = 1);
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 300.ms);
  }

  Widget _buildEmptyChat() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.chat_bubble_outline_rounded,
            size: 48,
            color: AppColors.textTertiary.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          Text(
            'Sin mensajes aun',
            style: GoogleFonts.manrope(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _quickActions.length,
        separatorBuilder: (_, i) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final action = _quickActions[i];
          return GestureDetector(
            onTap: () => _sendMessage(action.label),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: action.color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: action.color.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(action.icon, size: 16, color: action.color),
                  const SizedBox(width: 6),
                  Text(
                    action.label,
                    style: GoogleFonts.manrope(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: action.color,
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

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceOf(context),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.backgroundOf(context),
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _controller,
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimaryOf(context),
                ),
                decoration: InputDecoration(
                  hintText: 'Escribe un mensaje...',
                  hintStyle: GoogleFonts.manrope(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textTertiaryOf(context),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
                onSubmitted: _sendMessage,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _sendMessage(_controller.text),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final int badge;
  final VoidCallback onTap;

  const _ChatTab({
    required this.label,
    required this.icon,
    required this.isActive,
    this.badge = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive
                ? AppColors.primary.withValues(alpha: 0.1)
                : AppColors.surfaceOf(context),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isActive
                  ? AppColors.primary.withValues(alpha: 0.3)
                  : AppColors.textTertiaryOf(context).withValues(alpha: 0.1),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: isActive
                    ? AppColors.primary
                    : AppColors.textTertiaryOf(context),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.manrope(
                  fontSize: 13,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive
                      ? AppColors.primary
                      : AppColors.textSecondaryOf(context),
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 6),
                Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$badge',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final _ChatMessage message;
  final int index;

  const _MessageBubble({required this.message, required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            mainAxisAlignment: message.isMe
                ? MainAxisAlignment.end
                : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!message.isMe)
                Container(
                  width: 32,
                  height: 32,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      message.sender[0],
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                ),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: message.isMe
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : AppColors.surfaceOf(context),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(message.isMe ? 18 : 4),
                      bottomRight: Radius.circular(message.isMe ? 4 : 18),
                    ),
                    border: Border.all(
                      color: message.isMe
                          ? AppColors.primary.withValues(alpha: 0.15)
                          : AppColors.textTertiary.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!message.isMe)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            message.sender,
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.secondary,
                            ),
                          ),
                        ),
                      Text(
                        message.text,
                        style: GoogleFonts.manrope(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimaryOf(context),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            message.time,
                            style: GoogleFonts.manrope(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textTertiaryOf(context),
                            ),
                          ),
                          if (message.status != _ReadStatus.none) ...[
                            const SizedBox(width: 6),
                            Icon(
                              message.status.icon,
                              size: 14,
                              color: message.status.color,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              message.status.label,
                              style: GoogleFonts.manrope(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: message.status.color,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideX(
          begin: message.isMe ? 0.05 : -0.05,
          end: 0,
          duration: 300.ms,
          curve: Curves.easeOutCubic,
        );
  }
}

enum _ReadStatus {
  none('', Colors.transparent, Icons.circle),
  received('Recibido', AppColors.tertiary, Icons.check_circle_outline_rounded),
  onTheWay('En camino', AppColors.warning, Icons.local_shipping_rounded),
  solved('Solucionado', AppColors.success, Icons.task_alt_rounded);

  final String label;
  final Color color;
  final IconData icon;

  const _ReadStatus(this.label, this.color, this.icon);
}

class _ChatMessage {
  final String id;
  final String text;
  final String sender;
  final bool isMe;
  final String time;
  final _ReadStatus status;
  final bool isChannel;

  const _ChatMessage({
    required this.id,
    required this.text,
    required this.sender,
    required this.isMe,
    required this.time,
    this.status = _ReadStatus.none,
    this.isChannel = true,
  });
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;

  const _QuickAction(this.icon, this.label, this.color);
}
