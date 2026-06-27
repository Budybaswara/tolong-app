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
  Widget build(BuildContext context) {
    return Shell(
      index: 0,
      child: FutureBuilder<List<dynamic>>(
        future: programs,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Program Bantuan',
                title: 'Ajukan bantuan dengan mudah',
                subtitle:
                    'Pilih program, cek syarat, dan siapkan pengajuan digital.',
                icon: Icons.volunteer_activism,
                gradient: [success, Color(0xFF0F766E)],
              ),
              const SizedBox(height: 16),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (snapshot.hasError)
                const EmptyStateCard(
                  icon: Icons.cloud_off,
                  title: 'API bantuan belum bisa dihubungi',
                  body: 'Coba lagi setelah backend siap.',
                )
              else if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.handshake,
                  title: 'Belum ada program aktif',
                  body:
                      'Program bantuan akan tampil setelah admin mempublikasikannya.',
                )
              else
                ...items.map(
                  (raw) => _ProgramCard(item: raw as Map<String, dynamic>),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  const _ProgramCard({required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final requirements = (item['requirements'] as List<dynamic>? ?? <dynamic>[])
        .map((value) => value.toString())
        .toList();
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const StatusPill(
                label: 'Dibuka',
                icon: Icons.check_circle,
                color: success,
              ),
              const Spacer(),
              StatusPill(
                label: 'Kuota ${item['quota'] ?? '-'}',
                icon: Icons.groups,
                color: tertiary,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            item['title']?.toString() ?? 'Program Bantuan',
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            item['description']?.toString() ?? '',
            style: const TextStyle(color: muted, height: 1.45),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: requirements.isEmpty
                ? [const StatusPill(label: 'Syarat menyusul', color: warning)]
                : requirements
                      .map(
                        (requirement) =>
                            StatusPill(label: requirement, color: tertiary),
                      )
                      .toList(),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.assignment_turned_in),
            label: const Text('Ajukan Sekarang'),
          ),
        ],
      ),
    );
  }
}
