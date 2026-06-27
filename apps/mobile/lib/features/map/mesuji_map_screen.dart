import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class MesujiMapScreen extends StatefulWidget {
  const MesujiMapScreen({super.key});

  @override
  State<MesujiMapScreen> createState() => _MesujiMapScreenState();
}

class _MesujiMapScreenState extends State<MesujiMapScreen> {
  final repository = TolongRepository();
  final center = const LatLng(-4.0416, 105.4026);
  Set<Marker> markers = <Marker>{};

  @override
  void initState() {
    super.initState();
    _loadMarkers();
  }

  Future<void> _loadMarkers() async {
    final reports = await repository.mapReports();
    setState(() {
      markers = reports.map((raw) {
        final item = raw as Map<String, dynamic>;
        final latitude =
            double.tryParse(item['latitude'].toString()) ?? center.latitude;
        final longitude =
            double.tryParse(item['longitude'].toString()) ?? center.longitude;
        return Marker(
          markerId: MarkerId(item['id'].toString()),
          position: LatLng(latitude, longitude),
          infoWindow: InfoWindow(
            title: item['title']?.toString(),
            snippet: item['status']?.toString(),
          ),
        );
      }).toSet();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Shell(
      index: 4,
      child: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                child: FeatureHeader(
                  eyebrow: 'Peta Live',
                  title: 'Peta Interaktif Mesuji',
                  subtitle:
                      'Filter marker laporan dan pantau lokasi aspirasi warga.',
                  icon: Icons.map,
                  gradient: const [Color(0xFF0F766E), Color(0xFF1D4ED8)],
                  trailing: StatusPill(
                    label: '${markers.length}',
                    icon: Icons.location_pin,
                    color: Colors.white,
                  ),
                ),
              ),
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(28),
                  ),
                  child: GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: center,
                      zoom: 10.5,
                    ),
                    markers: markers,
                    myLocationButtonEnabled: true,
                    myLocationEnabled: true,
                    zoomControlsEnabled: false,
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 100,
            child: GlassCard(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  const StatusPill(
                    label: 'Semua laporan',
                    icon: Icons.filter_alt,
                    color: tertiary,
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _loadMarkers,
                    icon: const Icon(Icons.refresh, color: primary),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
