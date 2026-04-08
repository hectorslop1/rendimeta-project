enum RendimetaVoiceAssistantStatus {
  idle,
  connecting,
  listening,
  processing,
  speaking,
  ending,
  error,
}

class VoiceAssistantMessage {
  const VoiceAssistantMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final String role;
  final String content;
  final DateTime createdAt;

  bool get isUser => role == 'user';
}
