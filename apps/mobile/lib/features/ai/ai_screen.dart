import 'package:flutter/material.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class AiScreen extends StatefulWidget {
  const AiScreen({super.key});

  @override
  State<AiScreen> createState() => _AiScreenState();
}

class _AiScreenState extends State<AiScreen> {
  final repository = TolongRepository();
  final controller = TextEditingController();
  final messages = <_ChatMessage>[
    const _ChatMessage(
      text:
          'Halo! Saya AI TOLONG. Pilih prompt cepat atau tulis pertanyaan layanan publik Mesuji.',
      user: false,
    ),
  ];
  List<String> prompts = const [
    'Bagaimana cara lapor jalan rusak?',
    'Bantuan UMKM apa yang tersedia?',
    'Ringkas berita Mesuji hari ini',
  ];
  String? conversationId;
  bool sending = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> _send([String? prompt]) async {
    final text = (prompt ?? controller.text).trim();
    if (text.length < 2 || sending) return;

    setState(() {
      sending = true;
      controller.clear();
      messages.add(_ChatMessage(text: text, user: true));
    });

    try {
      final response = await repository.sendAiMessage(
        message: text,
        conversationId: conversationId,
      );
      if (!mounted) return;
      setState(() {
        conversationId = response['conversationId']?.toString();
        messages.add(
          _ChatMessage(
            text:
                response['answer']?.toString() ??
                'AI belum memberikan jawaban.',
            user: false,
          ),
        );
        prompts = (response['suggestedPrompts'] as List<dynamic>? ?? prompts)
            .map((value) => value.toString())
            .toList();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        messages.add(
          const _ChatMessage(
            text:
                'AI belum aktif atau provider belum dikonfigurasi. Pertanyaan ini tetap bisa Anda jadikan aspirasi melalui menu Aspirasi.',
            user: false,
          ),
        );
      });
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 2,
      child: Stack(
        children: [
          AppScrollPage(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 156),
            children: [
              const FeatureHeader(
                eyebrow: 'AI Assistant',
                title: 'Tanya TOLONG AI',
                subtitle:
                    'GPT menjawab lebih dulu, Gemini menjadi fallback saat provider utama belum siap.',
                icon: Icons.auto_awesome,
                gradient: [Color(0xFF7C3AED), Color(0xFF1D4ED8)],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: prompts
                    .map(
                      (prompt) => ActionChip(
                        label: Text(prompt),
                        onPressed: sending ? null : () => _send(prompt),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 16),
              ...messages.map((message) => _Bubble(message: message)),
              if (sending)
                const Align(
                  alignment: Alignment.centerLeft,
                  child: StatusPill(
                    label: 'AI sedang mengetik...',
                    icon: Icons.more_horiz,
                    color: tertiary,
                  ),
                ),
            ],
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: GlassCard(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Voice input akan diaktifkan setelah permission flow selesai.',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.mic, color: primary),
                    ),
                    Expanded(
                      child: TextField(
                        controller: controller,
                        onSubmitted: (_) => _send(),
                        decoration: const InputDecoration(
                          hintText: 'Tulis pesan Anda...',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                        ),
                      ),
                    ),
                    IconButton.filled(
                      onPressed: sending ? null : () => _send(),
                      icon: const Icon(Icons.send),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  const _ChatMessage({required this.text, required this.user});

  final String text;
  final bool user;
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});

  final _ChatMessage message;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: message.user ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        constraints: const BoxConstraints(maxWidth: 330),
        decoration: BoxDecoration(
          gradient: message.user
              ? const LinearGradient(colors: redGradient)
              : null,
          color: message.user ? null : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(message.user ? 20 : 6),
            bottomRight: Radius.circular(message.user ? 6 : 20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .06),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: message.user ? Colors.white : onSurface,
            height: 1.4,
          ),
        ),
      ),
    );
  }
}
