import 'package:flutter/material.dart';
import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final repository = TolongRepository();
  late final Future<List<dynamic>> notifications = repository.notifications();

  @override
  Widget build(BuildContext context) => Shell(
        index: 4,
        child: FutureBuilder<List<dynamic>>(
          future: notifications,
          builder: (context, snapshot) {
            final items = snapshot.data ?? <dynamic>[];
            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const SectionTitle('Notifikasi'),
                const SizedBox(height: 12),
                if (snapshot.connectionState == ConnectionState.waiting) const LinearProgressIndicator(),
                if (items.isEmpty && snapshot.connectionState != ConnectionState.waiting) const GlassCard(child: Text('Belum ada notifikasi.')),
                ...items.map((raw) {
                  final item = raw as Map<String, dynamic>;
                  return GlassCard(
                    child: ListTile(
                      leading: const Icon(Icons.notifications_active, color: primary),
                      title: Text(item['title']?.toString() ?? 'Notifikasi'),
                      subtitle: Text(item['body']?.toString() ?? ''),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      );
}
