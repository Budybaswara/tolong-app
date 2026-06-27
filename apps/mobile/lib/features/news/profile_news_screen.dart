import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

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
          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Kabar & Profil',
                title: 'Info Mesuji dan kartu digital',
                subtitle:
                    'Baca berita terbaru, pantau peta laporan, dan tampilkan QR keanggotaan.',
                icon: Icons.badge,
                gradient: darkGradient,
              ),
              const SizedBox(height: 16),
              const SectionTitle('Kabar Mesuji'),
              const SizedBox(height: 12),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.newspaper,
                  title: 'Belum ada berita',
                  body: 'Berita akan tampil setelah admin menerbitkan artikel.',
                )
              else
                ...items.take(5).map((raw) {
                  final item = raw as Map<String, dynamic>;
                  return InfoRowCard(
                    icon: Icons.newspaper,
                    title: item['title']?.toString() ?? 'Berita Mesuji',
                    subtitle: item['excerpt']?.toString() ?? '',
                    trailing: const Icon(Icons.chevron_right, color: muted),
                    onTap: () {
                      final slug = item['slug']?.toString();
                      if (slug == null || slug.isEmpty) return;
                      context.go('/news/$slug', extra: item);
                    },
                  );
                }),
              const SizedBox(height: 16),
              const SectionTitle('Peta Laporan Warga'),
              const SizedBox(height: 12),
              Container(
                height: 250,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEAF0FF), Color(0xFFFFF1F2)],
                  ),
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: [
                    BoxShadow(
                      color: tertiary.withValues(alpha: .12),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -20,
                      top: -20,
                      child: Icon(
                        Icons.map,
                        size: 150,
                        color: tertiary.withValues(alpha: .16),
                      ),
                    ),
                    const Positioned(
                      left: 34,
                      top: 34,
                      child: StatusPill(
                        label: 'Live reports',
                        icon: Icons.radar,
                        color: tertiary,
                      ),
                    ),
                    const Positioned(
                      left: 90,
                      top: 88,
                      child: Icon(Icons.location_pin, color: primary, size: 46),
                    ),
                    const Positioned(
                      right: 86,
                      bottom: 82,
                      child: Icon(
                        Icons.location_pin,
                        color: tertiary,
                        size: 42,
                      ),
                    ),
                    const Positioned(
                      left: 42,
                      bottom: 34,
                      right: 42,
                      child: Text(
                        'Marker laporan akan bergerak dari data live warga dan operator.',
                        style: TextStyle(color: muted, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const SectionTitle('Profil Saya'),
              const SizedBox(height: 12),
              GlassCard(
                gradient: redGradient,
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PSI Mesuji Digital Card',
                            style: TextStyle(color: Colors.white70),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Tamu TOLONG',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 23,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'ID: GUEST-MSJ',
                            style: TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(8),
                      child: QrImageView(data: 'GUEST-MSJ', size: 82),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.8,
                crossAxisSpacing: 12,
                children: const [
                  GlassCard(
                    child: ListTile(
                      title: Text(
                        '0',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      subtitle: Text('Laporan'),
                    ),
                  ),
                  GlassCard(
                    child: ListTile(
                      title: Text(
                        '0',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      subtitle: Text('Bantuan'),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class NewsDetailScreen extends StatefulWidget {
  const NewsDetailScreen({super.key, required this.slug, this.initialArticle});

  final String slug;
  final Map<String, dynamic>? initialArticle;

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  final repository = TolongRepository();
  late final Future<Map<String, dynamic>> article = widget.initialArticle == null
      ? repository.newsDetail(widget.slug)
      : Future.value(widget.initialArticle!);

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 4,
      child: FutureBuilder<Map<String, dynamic>>(
        future: article,
        builder: (context, snapshot) {
          final item = snapshot.data ?? widget.initialArticle;
          if (snapshot.connectionState == ConnectionState.waiting &&
              item == null) {
            return const AppScrollPage(
              children: [
                SizedBox(height: 18),
                LinearProgressIndicator(),
              ],
            );
          }
          if (item == null) {
            return AppScrollPage(
              children: [
                EmptyStateCard(
                  icon: Icons.article_outlined,
                  title: 'Berita tidak ditemukan',
                  body:
                      'Artikel tidak tersedia atau koneksi ke server sedang bermasalah.',
                  action: OutlinedButton.icon(
                    onPressed: () => context.go('/profile'),
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Kembali'),
                  ),
                ),
              ],
            );
          }

          final media = _media(item['media']);
          final category = _map(item['category']);
          final title = item['title']?.toString() ?? 'Berita Mesuji';
          final excerpt = item['excerpt']?.toString() ?? '';
          final content = item['content']?.toString() ?? '';
          final author = item['authorName']?.toString();
          final sourceName = item['sourceName']?.toString();
          final sourceUrl = item['sourceUrl']?.toString();
          final publishedAt = _formatDate(item['publishedAt']?.toString());

          return AppScrollPage(
            children: [
              TextButton.icon(
                onPressed: () => context.go('/profile'),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Kembali ke berita'),
              ),
              const SizedBox(height: 8),
              if (media.isNotEmpty) _NewsMediaHero(media: media.first),
              if (media.isNotEmpty) const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusPill(
                    label: category['name']?.toString() ?? 'Berita',
                    icon: Icons.newspaper,
                    color: primary,
                  ),
                  if (publishedAt != null)
                    StatusPill(
                      label: publishedAt,
                      icon: Icons.schedule,
                      color: tertiary,
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  height: 1.08,
                  color: onSurface,
                ),
              ),
              const SizedBox(height: 10),
              if (excerpt.isNotEmpty)
                Text(
                  excerpt,
                  style: const TextStyle(
                    color: muted,
                    fontSize: 16,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              const SizedBox(height: 16),
              _NewsMetaCard(
                author: author,
                sourceName: sourceName,
                sourceUrl: sourceUrl,
              ),
              const SizedBox(height: 16),
              GlassCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _paragraphs(content)
                      .map(
                        (paragraph) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            paragraph,
                            style: const TextStyle(
                              color: onSurface,
                              fontSize: 15,
                              height: 1.62,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              if (media.length > 1) ...[
                const SizedBox(height: 18),
                const SectionTitle('Lampiran Media'),
                const SizedBox(height: 12),
                ...media.skip(1).map(
                      (asset) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _NewsMediaHero(media: asset, compact: true),
                      ),
                    ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _NewsMetaCard extends StatelessWidget {
  const _NewsMetaCard({
    required this.author,
    required this.sourceName,
    required this.sourceUrl,
  });

  final String? author;
  final String? sourceName;
  final String? sourceUrl;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          _MetaRow(
            icon: Icons.edit_note,
            label: 'Penulis',
            value: _clean(author) ?? 'Admin TOLONG',
          ),
          const Divider(height: 18),
          _MetaRow(
            icon: Icons.verified_outlined,
            label: 'Sumber',
            value: _clean(sourceName) ?? 'DPD PSI Mesuji',
            trailing: _clean(sourceUrl) == null
                ? null
                : TextButton.icon(
                    onPressed: () => _openUrl(sourceUrl!),
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: const Text('Buka'),
                  ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({
    required this.icon,
    required this.label,
    required this.value,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final String value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: primary, size: 22),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w900)),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}

class _NewsMediaHero extends StatelessWidget {
  const _NewsMediaHero({required this.media, this.compact = false});

  final Map<String, dynamic> media;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final url = media['url']?.toString();
    final type = media['type']?.toString();
    if (url == null || url.isEmpty) return const SizedBox.shrink();
    if (type == 'VIDEO') return _InlineVideo(url: url, compact: compact);
    return ClipRRect(
      borderRadius: BorderRadius.circular(compact ? 20 : 28),
      child: AspectRatio(
        aspectRatio: compact ? 16 / 9 : 4 / 3,
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Container(
            color: surfaceContainer,
            child: const Center(
              child: Icon(Icons.broken_image_outlined, color: muted, size: 34),
            ),
          ),
        ),
      ),
    );
  }
}

class _InlineVideo extends StatefulWidget {
  const _InlineVideo({required this.url, this.compact = false});

  final String url;
  final bool compact;

  @override
  State<_InlineVideo> createState() => _InlineVideoState();
}

class _InlineVideoState extends State<_InlineVideo> {
  late final VideoPlayerController controller;
  late final Future<void> ready;

  @override
  void initState() {
    super.initState();
    controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    ready = controller.initialize();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.compact ? 20 : 28),
      child: FutureBuilder<void>(
        future: ready,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return AspectRatio(
              aspectRatio: widget.compact ? 16 / 9 : 4 / 3,
              child: Container(
                color: const Color(0xFF111827),
                child: const Center(child: CircularProgressIndicator()),
              ),
            );
          }
          return GestureDetector(
            onTap: () {
              setState(() {
                controller.value.isPlaying
                    ? controller.pause()
                    : controller.play();
              });
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                AspectRatio(
                  aspectRatio: controller.value.aspectRatio,
                  child: VideoPlayer(controller),
                ),
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 180),
                  opacity: controller.value.isPlaying ? 0 : 1,
                  child: Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: .58),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

Map<String, dynamic> _map(Object? value) =>
    value is Map<String, dynamic> ? value : <String, dynamic>{};

List<Map<String, dynamic>> _media(Object? value) {
  if (value is! List) return <Map<String, dynamic>>[];
  return value.whereType<Map<String, dynamic>>().toList();
}

List<String> _paragraphs(String value) {
  final paragraphs = value
      .split(RegExp(r'\n\s*\n'))
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList();
  return paragraphs.isEmpty ? ['Belum ada keterangan artikel.'] : paragraphs;
}

String? _formatDate(String? value) {
  if (value == null) return null;
  final date = DateTime.tryParse(value);
  if (date == null) return null;
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

String? _clean(String? value) {
  final trimmed = value?.trim();
  return trimmed == null || trimmed.isEmpty ? null : trimmed;
}

Future<void> _openUrl(String value) async {
  final uri = Uri.tryParse(value);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
