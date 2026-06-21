import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class ProfileNewsScreen extends StatefulWidget {
  const ProfileNewsScreen({super.key});

  @override
  State<ProfileNewsScreen> createState() => _ProfileNewsScreenState();
}

class _ProfileNewsScreenState extends State<ProfileNewsScreen> {
  final repository = TolongRepository();
  late final Future<List<dynamic>> news = repository.news();

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 4,
      child: FutureBuilder<List<dynamic>>(
        future: news,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const SectionTitle('Kabar Mesuji'),
              if (snapshot.connectionState == ConnectionState.waiting) const LinearProgressIndicator(),
              if (items.isEmpty && snapshot.connectionState != ConnectionState.waiting)
                const GlassCard(child: Text('Berita akan tampil setelah admin menerbitkan artikel.')),
              ...items.take(5).map((raw) {
                final item = raw as Map<String, dynamic>;
                return GlassCard(
                  child: ListTile(
                    leading: const Icon(Icons.newspaper, color: primary),
                    title: Text(item['title']?.toString() ?? 'Berita Mesuji'),
                    subtitle: Text(item['excerpt']?.toString() ?? ''),
                  ),
                );
              }),
              const SizedBox(height: 16),
              const SectionTitle('Peta Laporan Warga'),
              Container(
                height: 300,
                decoration: BoxDecoration(
                  color: surfaceContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Stack(
                  children: [
                    Center(child: Icon(Icons.map, size: 120, color: tertiary)),
                    Positioned(left: 110, top: 70, child: Icon(Icons.location_pin, color: primary, size: 42)),
                    Positioned(right: 80, bottom: 90, child: Icon(Icons.location_pin, color: tertiary, size: 42)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const SectionTitle('Profil Saya'),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [primary, primaryContainer]),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [BoxShadow(color: primary.withValues(alpha: .3), blurRadius: 28)],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PSI Mesuji Digital Card', style: TextStyle(color: Colors.white70)),
                          Text(
                            'Tamu TOLONG',
                            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                          ),
                          Text('ID: GUEST-MSJ', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(6),
                      child: QrImageView(data: 'GUEST-MSJ', size: 72),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: const [
                  GlassCard(child: ListTile(title: Text('0'), subtitle: Text('Laporan'))),
                  GlassCard(child: ListTile(title: Text('0'), subtitle: Text('Bantuan'))),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
