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
            child: AppScrollPage(
              children: [
                if (snapshot.connectionState == ConnectionState.waiting)
                  const LinearProgressIndicator(),
                if (snapshot.hasError) _ApiErrorCard(onRetry: _refresh),
                _HeroBanner(
                  banner: banners.isNotEmpty ? _map(banners.first) : null,
                ),
                const SizedBox(height: 20),
                const SectionTitle('Layanan Cepat'),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.28,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: [
                    FeatureTile(
                      icon: Icons.emergency_share,
                      title: 'Darurat SOS',
                      subtitle: 'Kirim lokasi cepat',
                      color: primary,
                      badge: 'Prioritas',
                      onTap: () => context.go('/sos'),
                    ),
                    FeatureTile(
                      icon: Icons.campaign,
                      title: 'Aspirasi',
                      subtitle: 'Lapor isu desa',
                      color: tertiary,
                      onTap: () => context.go('/aspirasi'),
                    ),
                    FeatureTile(
                      icon: Icons.auto_awesome,
                      title: 'AI Tolong',
                      subtitle: 'Tanya layanan publik',
                      color: const Color(0xFF7C3AED),
                      onTap: () => context.go('/ai'),
                    ),
                    FeatureTile(
                      icon: Icons.volunteer_activism,
                      title: 'Bantuan',
                      subtitle: 'Program dan status',
                      color: success,
                      onTap: () => context.go('/assistance'),
                    ),
                    FeatureTile(
                      icon: Icons.storefront,
                      title: 'UMKM',
                      subtitle: 'Produk lokal Mesuji',
                      color: warning,
                      onTap: () => context.go('/market'),
                    ),
                    FeatureTile(
                      icon: Icons.map,
                      title: 'Peta Live',
                      subtitle: 'Pantau laporan warga',
                      color: const Color(0xFF0F766E),
                      onTap: () => context.go('/map'),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                const SectionTitle('Aktivitas Mesuji'),
                const SizedBox(height: 12),
                SizedBox(
                  height: 124,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _StatCard(
                        '${stats['reportsProcessed'] ?? 0}',
                        'Laporan diproses',
                        Icons.task_alt,
                        redGradient,
                      ),
                      _StatCard(
                        '${stats['emergencyOpen'] ?? 0}',
                        'SOS aktif',
                        Icons.sos,
                        [primaryContainer, warning],
                      ),
                      _StatCard(
                        '${stats['assistanceApproved'] ?? 0}',
                        'Bantuan disetujui',
                        Icons.handshake,
                        [success, const Color(0xFF0F766E)],
                      ),
                      _StatCard(
                        '${stats['activeUmkm'] ?? 0}',
                        'UMKM aktif',
                        Icons.store,
                        blueGradient,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                SectionTitle(
                  'Info Terkini',
                  action: TextButton(
                    onPressed: () => context.go('/profile'),
                    child: const Text('Lihat semua'),
                  ),
                ),
                const SizedBox(height: 12),
                if (news.isEmpty)
                  const EmptyStateCard(
                    icon: Icons.newspaper,
                    title: 'Belum ada berita',
                    body:
                        'Berita resmi akan tampil otomatis setelah admin menerbitkan artikel.',
                  )
                else
                  ...news.take(4).map((raw) => _NewsPreview(item: _map(raw))),
              ],
            ),
          );
        },
      ),
    );
  }

  List<dynamic> _list(Object? value) =>
      value is List<dynamic> ? value : <dynamic>[];
  Map<String, dynamic> _map(Object? value) =>
      value is Map<String, dynamic> ? value : <String, dynamic>{};
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.banner});

  final Map<String, dynamic>? banner;

  @override
  Widget build(BuildContext context) {
    final imageUrl = banner?['imageUrl']?.toString();
    return Container(
      height: 230,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(
          colors: redGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        image: imageUrl == null || imageUrl.isEmpty
            ? null
            : DecorationImage(
                image: NetworkImage(imageUrl),
                fit: BoxFit.cover,
                opacity: .42,
              ),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: .24),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -34,
            top: -28,
            child: Icon(
              Icons.favorite,
              color: Colors.white.withValues(alpha: .12),
              size: 150,
            ),
          ),
          Positioned(
            right: 18,
            top: 18,
            child: Image.asset('assets/logo/tolong.png', width: 54, height: 54),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const StatusPill(
                  label: 'Live Mesuji',
                  icon: Icons.bolt,
                  color: Colors.white,
                ),
                const Spacer(),
                Text(
                  banner?['title']?.toString() ?? 'TOLONG Mesuji',
                  style: const TextStyle(
                    fontFamily: 'Plus Jakarta Sans',
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    height: 1.05,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  banner?['subtitle']?.toString() ??
                      'Layanan publik digital DPD PSI Mesuji Lampung.',
                  style: const TextStyle(color: Colors.white, height: 1.45),
                ),
                const SizedBox(height: 14),
                FilledButton.tonalIcon(
                  onPressed: () => context.go('/aspirasi'),
                  icon: const Icon(Icons.arrow_forward),
                  label: Text(banner?['ctaLabel']?.toString() ?? 'Mulai Lapor'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.value, this.label, this.icon, this.gradient);

  final String value;
  final String label;
  final IconData icon;
  final List<Color> gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 170,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: gradient.first.withValues(alpha: .24),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Plus Jakarta Sans',
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _NewsPreview extends StatelessWidget {
  const _NewsPreview({required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    return InfoRowCard(
      icon: Icons.newspaper,
      title: item['title']?.toString() ?? 'Berita Mesuji',
      subtitle:
          item['excerpt']?.toString() ?? 'Informasi resmi DPD PSI Mesuji.',
      trailing: const Icon(Icons.chevron_right, color: muted),
      onTap: () {
        final slug = item['slug']?.toString();
        if (slug == null || slug.isEmpty) return;
        context.go('/news/$slug', extra: item);
      },
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
      child: EmptyStateCard(
        icon: Icons.cloud_off,
        title: 'API belum terhubung',
        body:
            'Data lokal kosong ditampilkan sementara. Coba muat ulang setelah koneksi normal.',
        action: OutlinedButton(
          onPressed: onRetry,
          child: const Text('Coba lagi'),
        ),
      ),
    );
  }
}
