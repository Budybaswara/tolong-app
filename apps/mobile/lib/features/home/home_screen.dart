import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final repository = TolongRepository();
  late Future<Map<String, dynamic>> home = repository.home();

  Future<void> _refresh() async {
    setState(() {
      home = repository.home();
    });
    await home;
  }

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 0,
      child: FutureBuilder<Map<String, dynamic>>(
        future: home,
        builder: (context, snapshot) {
          final data = snapshot.data ?? <String, dynamic>{};
          final banners = _list(data['banners']);
          final news = _list(data['news']);
          final stats = (data['statistics'] as Map?) ?? <String, dynamic>{};

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 96),
              children: [
                if (snapshot.connectionState == ConnectionState.waiting)
                  const LinearProgressIndicator(),
                if (snapshot.hasError) _ApiErrorCard(onRetry: _refresh),
                _HeroBanner(
                  banner: banners.isNotEmpty ? _map(banners.first) : null,
                ),
                const SizedBox(height: 24),
                const SectionTitle('Layanan Publik'),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _quickAction(context, Icons.emergency, 'Darurat', '/sos', true),
                    _quickAction(context, Icons.forum, 'Aspirasi', '/aspirasi', false),
                    _quickAction(context, Icons.smart_toy, 'AI Tolong', '/ai', false),
                    _quickAction(context, Icons.school, 'Bantuan', '/assistance', false),
                    _quickAction(context, Icons.storefront, 'UMKM', '/market', false),
                    _quickAction(context, Icons.work, 'Kerja', '/jobs', false),
                    _quickAction(context, Icons.newspaper, 'Berita', '/profile', false),
                    _quickAction(context, Icons.map, 'Peta', '/map', false),
                  ],
                ),
                const SizedBox(height: 20),
                const SectionTitle('Aktivitas Mesuji'),
                const SizedBox(height: 12),
                SizedBox(
                  height: 130,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _stat('${stats['reportsProcessed'] ?? 0}', 'Laporan diproses', tertiary),
                      _stat('${stats['emergencyOpen'] ?? 0}', 'SOS aktif', primaryContainer),
                      _stat('${stats['assistanceApproved'] ?? 0}', 'Bantuan disetujui', surfaceContainer),
                      _stat('${stats['activeUmkm'] ?? 0}', 'UMKM aktif', surfaceContainer),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const SectionTitle('Info Terkini'),
                const SizedBox(height: 12),
                if (news.isEmpty)
                  const GlassCard(
                    child: Text('Berita resmi akan tampil setelah admin menerbitkan artikel.'),
                  )
                else
                  ...news.take(4).map((raw) {
                    final item = _map(raw);
                    return GlassCard(
                      child: ListTile(
                        leading: const Icon(Icons.newspaper, color: primary),
                        title: Text(item['title']?.toString() ?? 'Berita Mesuji'),
                        subtitle: Text(item['excerpt']?.toString() ?? ''),
                        onTap: () => context.go('/profile'),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _quickAction(
    BuildContext context,
    IconData icon,
    String label,
    String path,
    bool active,
  ) {
    return Column(
      children: [
        InkWell(
          onTap: () => context.go(path),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: active ? primary : Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .05), blurRadius: 12)],
            ),
            child: Icon(icon, color: active ? Colors.white : const Color(0xFF616363)),
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            color: active ? primary : onSurface,
          ),
        ),
      ],
    );
  }

  Widget _stat(String value, String label, Color color) {
    final dark = color == tertiary || color == primaryContainer;
    return Container(
      width: 170,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.task_alt, color: dark ? Colors.white : primary),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: dark ? Colors.white : onSurface,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: dark ? Colors.white : onSurface),
          ),
        ],
      ),
    );
  }

  List<dynamic> _list(Object? value) => value is List<dynamic> ? value : <dynamic>[];
  Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic> ? value : <String, dynamic>{};
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.banner});

  final Map<String, dynamic>? banner;

  @override
  Widget build(BuildContext context) {
    final imageUrl = banner?['imageUrl']?.toString();
    return Container(
      height: 190,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: primaryContainer,
        image: imageUrl == null || imageUrl.isEmpty
            ? null
            : DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover),
      ),
      child: Align(
        alignment: Alignment.bottomLeft,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: GlassCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  banner?['title']?.toString() ?? 'TOLONG Mesuji',
                  style: const TextStyle(fontWeight: FontWeight.w800, color: primary),
                ),
                Text(
                  banner?['subtitle']?.toString() ?? 'Layanan publik digital DPD PSI Mesuji Lampung.',
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () => context.go('/assistance'),
                  child: Text(banner?['ctaLabel']?.toString() ?? 'Mulai'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ApiErrorCard extends StatelessWidget {
  const _ApiErrorCard({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        child: Row(
          children: [
            const Expanded(child: Text('API belum bisa dihubungi. Data lokal kosong ditampilkan sementara.')),
            TextButton(onPressed: onRetry, child: const Text('Coba lagi')),
          ],
        ),
      ),
    );
  }
}
