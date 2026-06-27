import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  final repository = TolongRepository();
  late final Future<List<dynamic>> categories = repository.categories(
    module: 'EMERGENCY',
  );
  late final Future<List<dynamic>> contacts = repository.emergencyContacts();
  String? selectedCategoryId;
  String selectedCategoryName = 'Ambulance';
  bool sending = false;

  Future<void> _sendSos() async {
    if (selectedCategoryId == null) {
      _message(
        'Kategori darurat belum tersedia. Tambahkan kategori EMERGENCY dari admin.',
      );
      return;
    }
    setState(() => sending = true);
    try {
      final position = await _position();
      final sos = await repository.createEmergency({
        'latitude': position.latitude,
        'longitude': position.longitude,
        'address': 'Lokasi GPS dari aplikasi TOLONG',
        'categoryId': selectedCategoryId,
      });
      if (!mounted) return;
      _message('SOS terkirim: ${sos['code'] ?? selectedCategoryName}');
    } catch (error) {
      if (!mounted) return;
      _message('Gagal mengirim SOS: $error');
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Future<Position> _position() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (!enabled ||
        permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return Position(
        longitude: 105.4026,
        latitude: -4.0416,
        timestamp: DateTime.now(),
        accuracy: 250,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      );
    }
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  void _message(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 1,
      child: FutureBuilder<List<dynamic>>(
        future: categories,
        builder: (context, snapshot) {
          final items = snapshot.data ?? <dynamic>[];
          if (selectedCategoryId == null && items.isNotEmpty) {
            final first = items.first as Map<String, dynamic>;
            selectedCategoryId = first['id']?.toString();
            selectedCategoryName =
                first['name']?.toString() ?? selectedCategoryName;
          }

          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Emergency',
                title: 'SOS cepat dengan lokasi GPS',
                subtitle:
                    'Tahan tombol merah untuk mengirim permintaan darurat ke operator.',
                icon: Icons.emergency_share,
              ),
              const SizedBox(height: 26),
              Center(
                child: GestureDetector(
                  onLongPress: sending ? null : _sendSos,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      _Ring(size: 270, opacity: .08),
                      _Ring(size: 232, opacity: .15),
                      Container(
                        width: 196,
                        height: 196,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: sending
                                ? [Colors.grey, Colors.grey.shade600]
                                : redGradient,
                          ),
                          border: Border.all(color: Colors.white, width: 8),
                          boxShadow: [
                            BoxShadow(
                              color: primary.withValues(alpha: .35),
                              blurRadius: 44,
                              spreadRadius: 8,
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              sending ? Icons.sync : Icons.sos,
                              color: Colors.white,
                              size: 66,
                            ),
                            Text(
                              sending ? 'KIRIM' : 'SOS',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 34,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 4,
                              ),
                            ),
                            const Text(
                              'tahan tombol',
                              style: TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),
              SectionTitle(
                'Kategori Darurat',
                action: StatusPill(
                  label: selectedCategoryName,
                  icon: Icons.check_circle,
                ),
              ),
              const SizedBox(height: 12),
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(),
              if (items.isEmpty &&
                  snapshot.connectionState != ConnectionState.waiting)
                const EmptyStateCard(
                  icon: Icons.category,
                  title: 'Kategori belum tersedia',
                  body: 'Tambahkan kategori darurat dari dashboard admin.',
                )
              else
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.45,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  children: items.map((raw) {
                    final item = raw as Map<String, dynamic>;
                    final id = item['id']?.toString();
                    final name = item['name']?.toString() ?? 'Darurat';
                    final active = id == selectedCategoryId;
                    return FeatureTile(
                      icon: name.toLowerCase().contains('pemadam')
                          ? Icons.local_fire_department
                          : Icons.local_hospital,
                      title: name,
                      subtitle: active ? 'Kategori dipilih' : 'Tap untuk pilih',
                      color: active ? primary : tertiary,
                      badge: active ? 'Aktif' : null,
                      onTap: () => setState(() {
                        selectedCategoryId = id;
                        selectedCategoryName = name;
                      }),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 16),
              const InfoRowCard(
                icon: Icons.location_on,
                title: 'Lokasi otomatis',
                subtitle:
                    'GPS perangkat dikirim saat SOS. Jika GPS mati, aplikasi memakai titik fallback Mesuji.',
                color: tertiary,
              ),
              const SizedBox(height: 16),
              const SectionTitle('Kontak Darurat Resmi'),
              const SizedBox(height: 12),
              FutureBuilder<List<dynamic>>(
                future: contacts,
                builder: (context, contactSnapshot) {
                  final contactItems = contactSnapshot.data ?? <dynamic>[];
                  if (contactSnapshot.connectionState == ConnectionState.waiting) {
                    return const LinearProgressIndicator();
                  }
                  if (contactItems.isEmpty) {
                    return const EmptyStateCard(
                      icon: Icons.phone,
                      title: 'Kontak belum tersedia',
                      body: 'Admin dapat menambahkan kontak darurat dari Security Center.',
                    );
                  }
                  return Column(
                    children: contactItems.take(5).map((raw) {
                      final item = raw as Map<String, dynamic>;
                      return InfoRowCard(
                        icon: Icons.phone_in_talk,
                        title: item['name']?.toString() ?? 'Kontak SOS',
                        subtitle: '${item['category'] ?? 'Darurat'} - ${item['phone'] ?? '-'}',
                        color: primary,
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.size, required this.opacity});

  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: primary.withValues(alpha: opacity),
      ),
    );
  }
}
