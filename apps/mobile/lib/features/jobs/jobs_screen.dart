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
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const SectionTitle('TOLONG Kerja'),
              const SizedBox(height: 12),
              GlassCard(
                child: ListTile(
                  leading: const Icon(Icons.contact_page, color: primary),
                  title: const Text('Upload CV Digital'),
                  subtitle: const Text('CV tersimpan aman melalui Supabase Storage.'),
                  trailing: FilledButton(onPressed: () {}, child: const Text('Upload')),
                ),
              ),
              if (snapshot.connectionState == ConnectionState.waiting) const LinearProgressIndicator(),
              if (items.isEmpty && snapshot.connectionState != ConnectionState.waiting)
                const GlassCard(child: Text('Lowongan kerja akan tampil setelah admin menambahkan data.')),
              ...items.map((raw) {
                final item = raw as Map<String, dynamic>;
                final salaryMin = item['salaryMin'];
                final salaryMax = item['salaryMax'];
                final salary = salaryMin == null ? 'Gaji mengikuti ketentuan perusahaan' : 'Rp $salaryMin - Rp $salaryMax';
                return GlassCard(
                  child: ListTile(
                    leading: const Icon(Icons.work, color: primary),
                    title: Text(item['title']?.toString() ?? 'Lowongan'),
                    subtitle: Text('${item['company'] ?? 'Perusahaan'} - ${item['location'] ?? 'Mesuji'}\n$salary'),
                    trailing: OutlinedButton(onPressed: () {}, child: const Text('Lamar')),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
