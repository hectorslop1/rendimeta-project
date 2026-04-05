import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/game_state.dart';
import '../../core/haptics.dart';
import '../../core/models.dart';
import '../../theme/app_colors.dart';

class SimulationScreen extends StatefulWidget {
  const SimulationScreen({super.key});

  @override
  State<SimulationScreen> createState() => _SimulationScreenState();
}

class _SimulationScreenState extends State<SimulationScreen>
    with TickerProviderStateMixin {
  int _step = 0;
  int _score = 0;
  bool _finished = false;
  int? _selectedOption;
  String _lastBranch = 'neutral';

  // Timer
  static const int _timerSeconds = 15;
  late AnimationController _timerController;
  Timer? _autoSelectTimer;

  @override
  void initState() {
    super.initState();
    _timerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: _timerSeconds),
    );
    _startTimer();
  }

  @override
  void dispose() {
    _timerController.dispose();
    _autoSelectTimer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timerController.reset();
    _timerController.forward();
    _autoSelectTimer?.cancel();
    _autoSelectTimer = Timer(const Duration(seconds: _timerSeconds), () {
      if (_selectedOption == null && mounted) {
        Haptics.error();
        _selectOption(-1); // timeout
      }
    });
  }

  // Branching scenario tree
  List<_SimScenario> get _scenarios {
    return [
      const _SimScenario(
        clientMessage: 'Hola, vengo a cargar gasolina. Lleno por favor.',
        options: [
          _SimOption(
            text:
                'Claro! Mientras carga, le muestro nuestros aceites premium en promocion',
            isCorrect: true,
            branch: 'assertive',
            feedback:
                'Excelente! Aprovechaste el momento para ofrecer un producto.',
          ),
          _SimOption(
            text: 'Muy bien, solo gasolina. Le aviso cuando termine.',
            isCorrect: false,
            branch: 'timid',
            feedback: 'Perdiste la oportunidad de venta cruzada.',
          ),
          _SimOption(
            text: 'Si, ahora le cobro. Son 800 pesos.',
            isCorrect: false,
            branch: 'passive',
            feedback:
                'No ofreciste ningun producto. Cada cliente es una oportunidad.',
          ),
        ],
      ),
      // Step 2 changes based on branch
      if (_lastBranch == 'assertive')
        const _SimScenario(
          clientMessage:
              'Hmm, no se... El aceite esta caro. Realmente lo necesito?',
          options: [
            _SimOption(
              text:
                  'Es una inversion en su motor. Ademas hoy tiene 15% de descuento.',
              isCorrect: true,
              branch: 'closing',
              feedback:
                  'Perfecto! Justificaste el valor y agregaste urgencia con la promo.',
            ),
            _SimOption(
              text: 'Bueno, si no quiere no hay problema. Algo mas?',
              isCorrect: false,
              branch: 'retreat',
              feedback:
                  'Cediste muy rapido. Intenta dar un argumento antes de retirarte.',
            ),
            _SimOption(
              text: 'Si, cada 5000 km se debe cambiar. Su motor lo agradecera.',
              isCorrect: false,
              branch: 'pushy',
              feedback:
                  'Buen dato, pero falta el cierre. Agrega la promocion o beneficio.',
            ),
          ],
        )
      else if (_lastBranch == 'timid')
        const _SimScenario(
          clientMessage: 'Ya termino? Ok, cuanto es?',
          options: [
            _SimOption(
              text:
                  'Son 800 pesos. Por cierto, tenemos aromatizantes nuevos, le interesa?',
              isCorrect: true,
              branch: 'recover',
              feedback:
                  'Bien! Recuperaste la oportunidad al ofrecer al cobrar.',
            ),
            _SimOption(
              text: 'Son 800. Aqui tiene su cambio. Buen dia.',
              isCorrect: false,
              branch: 'lost',
              feedback:
                  'Dejaste ir al cliente sin intentar nada. Oportunidad perdida.',
            ),
            _SimOption(
              text: 'Son 800. Oiga, no quiere que le revise el aceite?',
              isCorrect: false,
              branch: 'awkward',
              feedback:
                  'El momento ya paso. Ofrece algo nuevo, no vuelvas al aceite.',
            ),
          ],
        )
      else
        const _SimScenario(
          clientMessage: 'Aqui tiene los 800 pesos.',
          options: [
            _SimOption(
              text:
                  'Gracias! Oiga, llevese un aromatizante, estan en oferta 2x1.',
              isCorrect: true,
              branch: 'lastchance',
              feedback:
                  'Ultimo intento, pero lo hiciste bien con una oferta atractiva.',
            ),
            _SimOption(
              text: 'Gracias, vuelva pronto.',
              isCorrect: false,
              branch: 'gone',
              feedback:
                  'Cero productos adicionales. Esta venta fue solo gasolina.',
            ),
            _SimOption(
              text: 'Gracias. Quiere su ticket?',
              isCorrect: false,
              branch: 'neutral_end',
              feedback: 'Correcto pero no aprovechaste para vender nada mas.',
            ),
          ],
        ),
      // Step 3 - final closing
      if (_lastBranch == 'closing' || _lastBranch == 'recover')
        const _SimScenario(
          clientMessage:
              'Ok, me convenciste. Dame el aceite y un aromatizante tambien.',
          options: [
            _SimOption(
              text:
                  'Excelente eleccion! Le recomiendo el de lavanda, es el favorito. Le doy su ticket.',
              isCorrect: true,
              branch: 'perfect',
              feedback:
                  'Cierre perfecto! Recomendaste, cerraste y diste servicio.',
            ),
            _SimOption(
              text: 'Ok, aqui tiene. Algo mas?',
              isCorrect: false,
              branch: 'ok',
              feedback:
                  'Vendiste, pero sin personalizar. La recomendacion suma puntos.',
            ),
            _SimOption(
              text: 'Claro, son 150 pesos extra.',
              isCorrect: false,
              branch: 'cold',
              feedback:
                  'Ir directo al precio sin entusiasmo baja la experiencia.',
            ),
          ],
        )
      else
        const _SimScenario(
          clientMessage: 'Bueno, solo eso entonces. Gracias.',
          options: [
            _SimOption(
              text:
                  'Gracias por venir! La proxima vez pregunteme por nuestras promociones.',
              isCorrect: true,
              branch: 'seed',
              feedback: 'Bien! Sembraste la semilla para la proxima visita.',
            ),
            _SimOption(
              text: 'Hasta luego, que le vaya bien.',
              isCorrect: false,
              branch: 'nothing',
              feedback: 'Despedida correcta pero sin valor agregado.',
            ),
            _SimOption(
              text: 'Seguro no quiere nada? Tenemos muchas cosas...',
              isCorrect: false,
              branch: 'desperate',
              feedback: 'Sonar desesperado no genera confianza. Se natural.',
            ),
          ],
        ),
    ];
  }

  void _selectOption(int optionIndex) {
    if (_selectedOption != null) return;
    _autoSelectTimer?.cancel();
    _timerController.stop();

    if (optionIndex == -1) {
      // Timeout
      setState(() => _selectedOption = -1);
      return;
    }

    Haptics.tap();
    final scenario = _scenarios[_step];
    setState(() {
      _selectedOption = optionIndex;
      if (scenario.options[optionIndex].isCorrect) {
        _score += 10;
        Haptics.success();
      }
      _lastBranch = scenario.options[optionIndex].branch;
    });
  }

  void _nextStep() {
    Haptics.selection();
    if (_step + 1 >= _scenarios.length) {
      setState(() => _finished = true);
      final gameState = context.read<GameState>();
      if (_score >= 20) {
        gameState.registerSale(
          _score == 30 ? ProductType.values[0] : ProductType.values[1],
        );
      }
      return;
    }
    setState(() {
      _step++;
      _selectedOption = null;
    });
    _startTimer();
  }

  void _restart() {
    Haptics.tap();
    setState(() {
      _step = 0;
      _score = 0;
      _finished = false;
      _selectedOption = null;
      _lastBranch = 'neutral';
    });
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Modo simulacion',
          style: GoogleFonts.spaceGrotesk(
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_score pts',
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
      ),
      body: SafeArea(child: _finished ? _buildResults() : _buildScenario()),
    );
  }

  Widget _buildScenario() {
    final scenarios = _scenarios;
    if (_step >= scenarios.length) return const SizedBox.shrink();
    final scenario = scenarios[_step];

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProgressDots(scenarios.length),
          const SizedBox(height: 8),
          if (_selectedOption == null) _buildTimerBar(),
          const SizedBox(height: 20),
          _buildClientBubble(scenario.clientMessage),
          const SizedBox(height: 24),
          if (_selectedOption == -1)
            _buildTimeoutMessage()
          else ...[
            Text(
              'Tu respuesta:',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ).animate().fadeIn(delay: 400.ms, duration: 300.ms),
            const SizedBox(height: 14),
            ...scenario.options.asMap().entries.map((entry) {
              final i = entry.key;
              final option = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _buildOptionCard(option, i),
              );
            }),
          ],
          const Spacer(),
          if (_selectedOption != null && _selectedOption != -1)
            _buildFeedbackAndNext(scenario),
          if (_selectedOption == -1)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _nextStep,
                child: Text(
                  _step + 1 >= scenarios.length
                      ? 'Ver resultados'
                      : 'Siguiente',
                ),
              ),
            ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
        ],
      ),
    );
  }

  Widget _buildTimerBar() {
    return AnimatedBuilder(
      animation: _timerController,
      builder: (context, _) {
        final progress = _timerController.value;
        final isLow = progress > 0.7;
        return Column(
          children: [
            Row(
              children: [
                Icon(
                  Icons.timer_rounded,
                  size: 16,
                  color: isLow ? AppColors.error : AppColors.textTertiary,
                ),
                const SizedBox(width: 6),
                Text(
                  '${(_timerSeconds * (1 - progress)).ceil()}s',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isLow ? AppColors.error : AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                if (isLow)
                  Text(
                        'Decide rapido!',
                        style: GoogleFonts.manrope(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.error,
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .shimmer(
                        duration: 800.ms,
                        color: AppColors.error.withValues(alpha: 0.3),
                      ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: 1 - progress,
                minHeight: 4,
                backgroundColor: AppColors.textTertiary.withValues(alpha: 0.1),
                valueColor: AlwaysStoppedAnimation(
                  isLow ? AppColors.error : AppColors.primary,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTimeoutMessage() {
    return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.error.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(Icons.timer_off_rounded, color: AppColors.error, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Se te acabo el tiempo! En la isla real, cada segundo cuenta.',
                  style: GoogleFonts.manrope(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms)
        .shake(duration: 400.ms, hz: 3, offset: const Offset(2, 0));
  }

  Widget _buildProgressDots(int total) {
    return Row(
      children: List.generate(total, (i) {
        final isActive = i == _step;
        final isDone = i < _step;
        return Expanded(
          child: Container(
            height: 6,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              gradient: isDone || isActive ? AppColors.primaryGradient : null,
              color: isDone || isActive
                  ? null
                  : AppColors.textTertiary.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        );
      }),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildClientBubble(String message) {
    return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.tertiary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_rounded,
                color: AppColors.tertiary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                    bottomRight: Radius.circular(18),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.cardShadow,
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cliente',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.tertiary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      message,
                      style: GoogleFonts.manrope(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        )
        .animate()
        .fadeIn(duration: 400.ms)
        .slideX(
          begin: -0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildOptionCard(_SimOption option, int index) {
    final isSelected = _selectedOption == index;
    final showResult = _selectedOption != null;
    final isCorrect = option.isCorrect;

    Color bgColor = AppColors.surface;
    Color borderColor = Colors.transparent;
    if (showResult && isSelected) {
      bgColor = isCorrect
          ? AppColors.success.withValues(alpha: 0.08)
          : AppColors.error.withValues(alpha: 0.08);
      borderColor = isCorrect ? AppColors.success : AppColors.error;
    } else if (showResult && isCorrect) {
      bgColor = AppColors.success.withValues(alpha: 0.05);
      borderColor = AppColors.success.withValues(alpha: 0.3);
    }

    return GestureDetector(
          onTap: () => _selectOption(index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: showResult
                    ? borderColor
                    : AppColors.textTertiary.withValues(alpha: 0.15),
                width: showResult && (isSelected || isCorrect) ? 2 : 1,
              ),
              boxShadow: [
                if (!showResult)
                  BoxShadow(
                    color: AppColors.cardShadow,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: showResult && isSelected
                        ? (isCorrect ? AppColors.success : AppColors.error)
                        : AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: showResult && isSelected
                        ? Icon(
                            isCorrect
                                ? Icons.check_rounded
                                : Icons.close_rounded,
                            color: Colors.white,
                            size: 16,
                          )
                        : Text(
                            String.fromCharCode(65 + index),
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    option.text,
                    style: GoogleFonts.manrope(
                      fontSize: 14,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.w500,
                      color: AppColors.textPrimary,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        )
        .animate(delay: Duration(milliseconds: 500 + index * 100))
        .fadeIn(duration: 300.ms)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 300.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildFeedbackAndNext(_SimScenario scenario) {
    final option = scenario.options[_selectedOption!];
    return Column(
      children: [
        Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: option.isCorrect
                    ? AppColors.success.withValues(alpha: 0.1)
                    : AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    option.isCorrect
                        ? Icons.lightbulb_rounded
                        : Icons.info_outline_rounded,
                    color: option.isCorrect
                        ? AppColors.success
                        : AppColors.warning,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      option.feedback,
                      style: GoogleFonts.manrope(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: option.isCorrect
                            ? AppColors.success
                            : AppColors.warning,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            )
            .animate()
            .fadeIn(duration: 300.ms)
            .slideY(begin: 0.1, end: 0, duration: 300.ms),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _nextStep,
            child: Text(
              _step + 1 >= _scenarios.length ? 'Ver resultados' : 'Siguiente',
            ),
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 300.ms),
      ],
    );
  }

  Widget _buildResults() {
    final maxScore = _scenarios.length * 10;
    final percentage = (_score / maxScore * 100).round();
    final isPerfect = _score == maxScore;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    gradient: isPerfect
                        ? AppColors.primaryGradient
                        : const LinearGradient(
                            colors: [AppColors.warning, AppColors.secondary],
                          ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '$percentage%',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                )
                .animate()
                .scale(
                  begin: const Offset(0.5, 0.5),
                  end: const Offset(1, 1),
                  duration: 600.ms,
                  curve: Curves.elasticOut,
                )
                .fadeIn(duration: 300.ms),
            const SizedBox(height: 28),
            Text(
              isPerfect ? 'Vendedor estrella!' : 'Buen intento!',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
            const SizedBox(height: 10),
            Text(
              isPerfect
                  ? 'Respondiste todo correctamente. Dominas la venta.'
                  : 'Sigue practicando para mejorar tus tecnicas.',
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ).animate().fadeIn(delay: 400.ms, duration: 400.ms),
            const SizedBox(height: 12),
            Text(
              '$_score/$maxScore puntos',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _restart,
                child: const Text('Intentar de nuevo'),
              ),
            ).animate().fadeIn(delay: 600.ms, duration: 400.ms),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Volver al inicio',
                style: GoogleFonts.manrope(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ).animate().fadeIn(delay: 700.ms, duration: 400.ms),
          ],
        ),
      ),
    );
  }
}

class _SimScenario {
  final String clientMessage;
  final List<_SimOption> options;

  const _SimScenario({required this.clientMessage, required this.options});
}

class _SimOption {
  final String text;
  final bool isCorrect;
  final String branch;
  final String feedback;

  const _SimOption({
    required this.text,
    required this.isCorrect,
    required this.branch,
    required this.feedback,
  });
}
