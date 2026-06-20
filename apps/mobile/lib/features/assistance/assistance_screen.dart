import 'package:flutter/material.dart';
import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class AssistanceScreen extends StatefulWidget {
  const AssistanceScreen({super.key});

  @override
  State<AssistanceScreen> createState() => _AssistanceScreenState();
}

class _AssistanceScreenState extends State<AssistanceScreen> {
  final repository = TolongRepository();
  late final Future<List<dynamic>> programs = repository.assistance();

  @override
  Widget build(BuildContext context) => Shell(
        index: 0,
        child: FutureBuilder<List<dynamic>>(
          future: programs,
          builder: (context, snapshot) {
            final items = snapshot.data ?? <dynamic>[];
            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text('Program Bantuan', style: TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 30, fontWeight: FontWeight.w800, color: primary)),
                const Text('Ajukan bantuan, pantau status, dan lengkapi syarat dari aplikasi.'),
                const SizedBox(height: 16),
                if (snapshot.connectionState == ConnectionState.waiting) const LinearProgressIndicator(),
                if (items.isEmpty && snapshot.connectionState != ConnectionState.waiting) const GlassCard(child: Text('Belum ada program bantuan aktif dari API.')),
                ...items.map((raw) {
                  final item = raw as Map<String, dynamic>;
                  final requirements = (item['requirements'] as List<dynamic>? ?? <dynamic>[]).join(' • ');
                  return GlassCard(
                    child: ListTile(
                      leading: const Icon(Icons.volunteer_activism, color: primary),
                      title: Text(item['title']?.toString() ?? 'Program Bantuan'),
                      subtitle: Text('${item['description'] ?? ''}\nSyarat: $requirements'),
                      trailing: FilledButton(onPressed: () {}, child: const Text('Ajukan')),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      );
}
