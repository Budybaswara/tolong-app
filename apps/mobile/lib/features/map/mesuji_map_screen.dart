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
        final latitude = double.tryParse(item['latitude'].toString()) ?? center.latitude;
        final longitude = double.tryParse(item['longitude'].toString()) ?? center.longitude;
        return Marker(
          markerId: MarkerId(item['id'].toString()),
          position: LatLng(latitude, longitude),
          infoWindow: InfoWindow(title: item['title']?.toString(), snippet: item['status']?.toString()),
        );
      }).toSet();
    });
  }

  @override
  Widget build(BuildContext context) => Shell(
        index: 4,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Row(
                children: [
                  const Expanded(child: SectionTitle('Peta Interaktif Mesuji')),
                  Chip(label: Text('${markers.length} laporan')),
                ],
              ),
            ),
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(target: center, zoom: 10.5),
                  markers: markers,
                  myLocationButtonEnabled: true,
                  myLocationEnabled: true,
                ),
              ),
            ),
          ],
        ),
      );
}
