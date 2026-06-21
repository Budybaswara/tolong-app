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
      text: 'Halo! Saya AI TOLONG. Ada yang bisa saya bantu terkait layanan publik di Kabupaten Mesuji hari ini?',
      user: false,
    ),
  ];
  List<String> prompts = const [
    'Bagaimana cara lapor jalan rusak?',
    'Bantuan UMKM apa yang tersedia?',
    'Update berita Mesuji hari ini',
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
      final response = await repository.sendAiMessage(message: text, conversationId: conversationId);
      if (!mounted) return;
      setState(() {
        conversationId = response['conversationId']?.toString();
        messages.add(_ChatMessage(text: response['answer']?.toString() ?? 'AI belum memberikan jawaban.', user: false));
        prompts = (response['suggestedPrompts'] as List<dynamic>? ?? prompts).map((value) => value.toString()).toList();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        messages.add(
          _ChatMessage(
            text: 'AI belum aktif atau provider belum dikonfigurasi. Pesan Anda tetap bisa dijadikan aspirasi melalui menu Aspirasi.',
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
      child: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const SectionTitle('AI TOLONG Assistant'),
                const SizedBox(height: 12),
                ...messages.map((message) => _Bubble(message: message)),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: prompts
                      .map((prompt) => ActionChip(label: Text(prompt), onPressed: sending ? null : () => _send(prompt)))
                      .toList(),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Voice input akan diaktifkan setelah permission flow selesai.')),
                    );
                  },
                  icon: const Icon(Icons.mic),
                ),
                Expanded(
                  child: TextField(
                    controller: controller,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(hintText: 'Tulis pesan Anda...'),
                  ),
                ),
                IconButton(
                  onPressed: sending ? null : () => _send(),
                  icon: Icon(Icons.send, color: sending ? Colors.grey : primary),
                ),
              ],
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
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(maxWidth: 320),
        decoration: BoxDecoration(
          color: message.user ? primary : surfaceContainer,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(message.text, style: TextStyle(color: message.user ? Colors.white : onSurface)),
      ),
    );
  }
}
