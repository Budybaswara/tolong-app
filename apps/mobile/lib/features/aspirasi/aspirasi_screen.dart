import 'package:flutter/material.dart';

import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class AspirasiScreen extends StatefulWidget {
  const AspirasiScreen({super.key});

  @override
  State<AspirasiScreen> createState() => _AspirasiScreenState();
}

class _AspirasiScreenState extends State<AspirasiScreen> {
  final repository = TolongRepository();
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  final districtController = TextEditingController(text: 'Mesuji');
  final villageController = TextEditingController();
  late final Future<List<dynamic>> categories = repository.categories(module: 'REPORT');
  String? categoryId;
  bool useLocation = true;
  bool submitting = false;

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    districtController.dispose();
    villageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (categoryId == null) {
      _message('Kategori laporan belum tersedia. Jalankan seed backend atau tambah kategori REPORT.');
      return;
    }
    if (titleController.text.trim().length < 5 || descriptionController.text.trim().length < 20) {
      _message('Lengkapi judul minimal 5 karakter dan deskripsi minimal 20 karakter.');
      return;
    }

    setState(() => submitting = true);
    try {
      final report = await repository.createReport({
        'title': titleController.text.trim(),
        'description': descriptionController.text.trim(),
        'district': districtController.text.trim().isEmpty ? 'Mesuji' : districtController.text.trim(),
        if (villageController.text.trim().isNotEmpty) 'village': villageController.text.trim(),
        'categoryId': categoryId,
        'priority': 'MEDIUM',
        if (useLocation) 'latitude': -4.0416,
        if (useLocation) 'longitude': 105.4026,
        if (useLocation) 'address': 'Lokasi perkiraan Mesuji, Lampung',
      });
      if (!mounted) return;
      _message('Aspirasi terkirim: ${report['code'] ?? 'menunggu kode'}');
      titleController.clear();
      descriptionController.clear();
      villageController.clear();
    } catch (error) {
      if (!mounted) return;
      _message('Gagal mengirim aspirasi: $error');
    } finally {
      if (mounted) setState(() => submitting = false);
    }
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
          if (categoryId == null && items.isNotEmpty) {
            final first = items.first as Map<String, dynamic>;
            categoryId = first['id']?.toString();
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'Sampaikan Aspirasi Anda',
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: primary,
                ),
              ),
              const SizedBox(height: 16),
              GlassCard(
                child: Column(
                  children: [
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Judul Aspirasi',
                        hintText: 'Contoh: Perbaikan jalan desa',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: categoryId,
                      decoration: const InputDecoration(labelText: 'Kategori'),
                      items: items.map((raw) {
                        final item = raw as Map<String, dynamic>;
                        return DropdownMenuItem<String>(
                          value: item['id']?.toString(),
                          child: Text(item['name']?.toString() ?? 'Kategori'),
                        );
                      }).toList(),
                      onChanged: (value) => setState(() => categoryId = value),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: districtController,
                      decoration: const InputDecoration(labelText: 'Kecamatan/Kabupaten'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: villageController,
                      decoration: const InputDecoration(labelText: 'Desa/Kelurahan (opsional)'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(labelText: 'Deskripsi Detail'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: () => _message('Upload foto akan memakai Supabase Storage pada tahap berikutnya.'),
                          icon: const Icon(Icons.add_a_photo),
                          label: const Text('Foto'),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: () => _message('Upload video akan memakai Supabase Storage pada tahap berikutnya.'),
                          icon: const Icon(Icons.videocam),
                          label: const Text('Video'),
                        ),
                      ],
                    ),
                    SwitchListTile(
                      value: useLocation,
                      onChanged: (value) => setState(() => useLocation = value),
                      title: const Text('Gunakan lokasi Mesuji sementara'),
                    ),
                    FilledButton(
                      onPressed: submitting ? null : _submit,
                      child: Text(submitting ? 'Mengirim...' : 'Kirim Aspirasi'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Status Aspirasi Terakhir', style: TextStyle(fontWeight: FontWeight.w800)),
                    ListTile(
                      leading: Icon(Icons.check_circle, color: primary),
                      title: Text('Submitted'),
                      subtitle: Text('Aspirasi yang dikirim akan masuk antrean admin.'),
                    ),
                    ListTile(
                      leading: Icon(Icons.sync, color: tertiary),
                      title: Text('In Progress'),
                      subtitle: Text('Operator dapat memperbarui status dari admin panel.'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
