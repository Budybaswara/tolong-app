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
  late final Future<List<dynamic>> categories = repository.categories(module: 'EMERGENCY');
  String? selectedCategoryId;
  String selectedCategoryName = 'Ambulance';
  bool sending = false;

  Future<void> _sendSos() async {
    if (selectedCategoryId == null) {
      _message('Kategori darurat belum tersedia. Jalankan seed backend atau tambah kategori EMERGENCY.');
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
    if (!enabled || permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
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
    return Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
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
            selectedCategoryName = first['name']?.toString() ?? selectedCategoryName;
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'Darurat SOS',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: primary,
                ),
              ),
              const Text('Tahan tombol SOS untuk mengirim lokasi darurat.', textAlign: TextAlign.center),
              const SizedBox(height: 32),
              Center(
                child: GestureDetector(
                  onLongPress: sending ? null : _sendSos,
                  child: Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: sending ? Colors.grey : primary,
                      border: Border.all(color: Colors.white, width: 8),
                      boxShadow: [BoxShadow(color: primary.withValues(alpha: .35), blurRadius: 40, spreadRadius: 8)],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.emergency, color: Colors.white, size: 72),
                        Text(
                          sending ? 'KIRIM' : 'SOS',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (snapshot.connectionState == ConnectionState.waiting) const LinearProgressIndicator(),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: items.map((raw) {
                  final item = raw as Map<String, dynamic>;
                  final id = item['id']?.toString();
                  final name = item['name']?.toString() ?? 'Darurat';
                  final active = id == selectedCategoryId;
                  return InkWell(
                    onTap: () => setState(() {
                      selectedCategoryId = id;
                      selectedCategoryName = name;
                    }),
                    borderRadius: BorderRadius.circular(16),
                    child: GlassCard(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.local_hospital, color: active ? primary : onSurface),
                          const SizedBox(height: 8),
                          Text(name, style: TextStyle(fontWeight: FontWeight.w700, color: active ? primary : onSurface)),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (items.isEmpty && snapshot.connectionState != ConnectionState.waiting)
                const GlassCard(child: Text('Kategori darurat akan tampil setelah admin menambahkan data.')),
              const SizedBox(height: 16),
              const GlassCard(
                child: ListTile(
                  leading: Icon(Icons.location_on, color: primary),
                  title: Text('Lokasi Anda Sekarang'),
                  subtitle: Text('GPS perangkat akan dikirim saat SOS. Jika GPS mati, aplikasi memakai titik fallback Mesuji.'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
