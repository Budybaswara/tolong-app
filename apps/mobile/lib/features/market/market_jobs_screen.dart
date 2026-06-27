import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class MarketJobsScreen extends StatefulWidget {
  const MarketJobsScreen({super.key});

  @override
  State<MarketJobsScreen> createState() => _MarketJobsScreenState();
}

class _MarketJobsScreenState extends State<MarketJobsScreen> {
  final repository = TolongRepository();
  final searchController = TextEditingController();
  late Future<List<dynamic>> products = repository.products();

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  void _search(String query) {
    setState(() {
      products = repository.products(
        query: query.trim().isEmpty ? null : query.trim(),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 3,
      child: FutureBuilder<List<dynamic>>(
        future: products,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'UMKM Marketplace',
                title: 'Belanja produk lokal Mesuji',
                subtitle:
                    'Cari produk warga, hubungi penjual langsung lewat WhatsApp.',
                icon: Icons.storefront,
                gradient: [warning, primary],
              ),
              const SizedBox(height: 16),
              GlassCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: TextField(
                  controller: searchController,
                  onSubmitted: _search,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search),
                    hintText: 'Cari produk lokal Mesuji...',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    suffixIcon: IconButton(
                      onPressed: () => _search(searchController.text),
                      icon: const Icon(Icons.arrow_forward),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.storefront,
                  title: 'Produk belum tersedia',
                  body:
                      'Produk UMKM akan tampil setelah admin menambahkan data.',
                )
              else
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: .66,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: items
                      .map((raw) => _ProductCard(product: _map(raw)))
                      .toList(),
                ),
            ],
          );
        },
      ),
    );
  }

  Map<String, dynamic> _map(Object? value) =>
      value is Map<String, dynamic> ? value : <String, dynamic>{};
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final Map<String, dynamic> product;

  @override
  Widget build(BuildContext context) {
    final name = product['name']?.toString() ?? 'Produk UMKM';
    final seller = product['sellerName']?.toString() ?? 'Penjual lokal';
    final whatsapp = product['whatsapp']?.toString();
    final price = product['price'];
    final media = product['media'] is List
        ? product['media'] as List
        : const [];
    final imageUrl = media.isNotEmpty && media.first is Map
        ? (media.first as Map)['url']?.toString()
        : null;

    return GlassCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: imageUrl == null || imageUrl.isEmpty
                    ? const LinearGradient(
                        colors: [Color(0xFFFFF1F2), Color(0xFFEAF0FF)],
                      )
                    : null,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(22),
                ),
                image: imageUrl == null || imageUrl.isEmpty
                    ? null
                    : DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                      ),
              ),
              child: imageUrl == null || imageUrl.isEmpty
                  ? const Icon(Icons.storefront, size: 54, color: primary)
                  : null,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                Text(
                  seller,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: muted),
                ),
                const SizedBox(height: 4),
                Text(
                  price == null ? 'Hubungi penjual' : 'Rp $price',
                  style: const TextStyle(
                    color: primary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: whatsapp == null || whatsapp.isEmpty
                        ? null
                        : () => launchUrl(
                            Uri.parse(
                              'https://wa.me/${_normalizeWa(whatsapp)}',
                            ),
                          ),
                    child: const Text('Pesan WA'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _normalizeWa(String value) {
    final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.startsWith('0')) return '62${digits.substring(1)}';
    return digits;
  }
}
