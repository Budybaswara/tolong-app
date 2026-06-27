import 'package:flutter/material.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final repository = TolongRepository();
  late final Future<List<dynamic>> jobs = repository.jobs();

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 3,
      child: FutureBuilder<List<dynamic>>(
        future: jobs,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Job Board',
                title: 'Lowongan kerja sekitar Mesuji',
                subtitle:
                    'Upload CV digital dan lamar lowongan yang diposting admin.',
                icon: Icons.work,
                gradient: blueGradient,
              ),
              const SizedBox(height: 16),
              InfoRowCard(
                icon: Icons.contact_page,
                title: 'CV Digital',
                subtitle:
                    'Simpan CV dan dokumen lamaran untuk dipakai berkali-kali.',
                color: tertiary,
                trailing: FilledButton(
                  onPressed: () {},
                  child: const Text('Upload'),
                ),
              ),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.business_center,
                  title: 'Belum ada lowongan',
                  body:
                      'Lowongan kerja akan tampil setelah admin menambahkan data.',
                )
              else
                ...items.map(
                  (raw) => _JobCard(item: raw as Map<String, dynamic>),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final salaryMin = item['salaryMin'];
    final salaryMax = item['salaryMax'];
    final salary = salaryMin == null
        ? 'Gaji mengikuti ketentuan perusahaan'
        : 'Rp $salaryMin - Rp $salaryMax';
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const StatusPill(
                label: 'Aktif',
                icon: Icons.check_circle,
                color: success,
              ),
              const Spacer(),
              StatusPill(
                label: item['type']?.toString() ?? 'FULL_TIME',
                color: tertiary,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item['title']?.toString() ?? 'Lowongan',
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            '${item['company'] ?? 'Perusahaan'} - ${item['location'] ?? 'Mesuji'}',
            style: const TextStyle(color: muted),
          ),
          const SizedBox(height: 8),
          Text(
            salary,
            style: const TextStyle(color: primary, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.send),
            label: const Text('Lamar Sekarang'),
          ),
        ],
      ),
    );
  }
}
