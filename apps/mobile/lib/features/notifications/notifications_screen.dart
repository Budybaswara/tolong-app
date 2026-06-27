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
  Widget build(BuildContext context) {
    return Shell(
      index: 4,
      child: FutureBuilder<List<dynamic>>(
        future: notifications,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Notification Center',
                title: 'Semua kabar penting',
                subtitle:
                    'Push notification, status laporan, dan broadcast admin tampil di sini.',
                icon: Icons.notifications_active,
                gradient: blueGradient,
              ),
              const SizedBox(height: 16),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.notifications_none,
                  title: 'Belum ada notifikasi',
                  body: 'Notifikasi dari admin dan sistem akan muncul di sini.',
                )
              else
                ...items.map((raw) {
                  final item = raw as Map<String, dynamic>;
                  return InfoRowCard(
                    icon: Icons.notifications_active,
                    title: item['title']?.toString() ?? 'Notifikasi',
                    subtitle: item['body']?.toString() ?? '',
                    color: primary,
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}
