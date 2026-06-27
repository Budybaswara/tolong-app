import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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
  late final Future<List<dynamic>> categories = repository.categories(
    module: 'REPORT',
  );
  String? categoryId;
  bool useLocation = true;
  bool submitting = false;
  bool uploading = false;
  final picker = ImagePicker();
  final List<Map<String, dynamic>> media = [];

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
      _message(
        'Kategori laporan belum tersedia. Tambahkan kategori REPORT dari admin.',
      );
      return;
    }
    if (titleController.text.trim().length < 5 ||
        descriptionController.text.trim().length < 20) {
      _message(
        'Lengkapi judul minimal 5 karakter dan deskripsi minimal 20 karakter.',
      );
      return;
    }

    setState(() => submitting = true);
    try {
      final report = await repository.createReport({
        'title': titleController.text.trim(),
        'description': descriptionController.text.trim(),
        'district': districtController.text.trim().isEmpty
            ? 'Mesuji'
            : districtController.text.trim(),
        if (villageController.text.trim().isNotEmpty)
          'village': villageController.text.trim(),
        'categoryId': categoryId,
        'priority': 'MEDIUM',
        if (media.isNotEmpty) 'media': media,
        if (useLocation) 'latitude': -4.0416,
        if (useLocation) 'longitude': 105.4026,
        if (useLocation) 'address': 'Lokasi perkiraan Mesuji, Lampung',
      });
      if (!mounted) return;
      _message('Aspirasi terkirim: ${report['code'] ?? 'menunggu kode'}');
      titleController.clear();
      descriptionController.clear();
      villageController.clear();
      setState(() => media.clear());
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

  Future<void> _pickAndUpload(ImageSource source, {bool video = false}) async {
    setState(() => uploading = true);
    try {
      final file = video
          ? await picker.pickVideo(source: source)
          : await picker.pickImage(source: source, imageQuality: 78);
      if (file == null) return;
      final uploaded = await repository.uploadMedia(
        folder: 'reports',
        path: file.path,
        fileName: file.name,
      );
      media.add({
        'url': uploaded['publicUrl'],
        'path': uploaded['path'],
        'type': video ? 'VIDEO' : 'IMAGE',
        'mimeType': uploaded['contentType'] ?? (video ? 'video/mp4' : 'image/jpeg'),
        'sizeBytes': uploaded['sizeBytes'] ?? 1,
      });
      if (!mounted) return;
      setState(() {});
      _message('${video ? 'Video' : 'Foto'} berhasil diupload.');
    } catch (error) {
      if (!mounted) return;
      _message('Upload gagal: $error');
    } finally {
      if (mounted) setState(() => uploading = false);
    }
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

          return AppScrollPage(
            children: [
              const FeatureHeader(
                eyebrow: 'Aspirasi Warga',
                title: 'Laporkan isu di sekitar Anda',
                subtitle:
                    'Tulis laporan lengkap, tambahkan lokasi, lalu pantau statusnya dari admin.',
                icon: Icons.campaign,
                gradient: blueGradient,
              ),
              const SizedBox(height: 16),
              GlassCard(
                child: Column(
                  children: [
                    _StepRow(
                      number: '1',
                      title: 'Isi detail',
                      body: 'Judul, kategori, wilayah, dan deskripsi.',
                    ),
                    _StepRow(
                      number: '2',
                      title: 'Lampirkan bukti',
                      body: 'Foto/video akan tersambung ke Supabase Storage.',
                    ),
                    _StepRow(
                      number: '3',
                      title: 'Pantau timeline',
                      body: 'Operator memperbarui status dari dashboard admin.',
                    ),
                  ],
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
                        prefixIcon: Icon(Icons.title),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: categoryId,
                      decoration: const InputDecoration(
                        labelText: 'Kategori',
                        prefixIcon: Icon(Icons.category),
                      ),
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
                      decoration: const InputDecoration(
                        labelText: 'Kecamatan/Kabupaten',
                        prefixIcon: Icon(Icons.location_city),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: villageController,
                      decoration: const InputDecoration(
                        labelText: 'Desa/Kelurahan',
                        prefixIcon: Icon(Icons.home_work_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descriptionController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Deskripsi Detail',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: uploading ? null : () => _pickAndUpload(ImageSource.camera),
                            icon: const Icon(Icons.add_a_photo),
                            label: Text(uploading ? 'Upload...' : 'Foto'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: uploading ? null : () => _pickAndUpload(ImageSource.gallery, video: true),
                            icon: const Icon(Icons.videocam),
                            label: const Text('Video'),
                          ),
                        ),
                      ],
                    ),
                    if (media.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: StatusPill(
                          label: '${media.length} media siap dikirim',
                          icon: Icons.attach_file,
                          color: success,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    SwitchListTile(
                      value: useLocation,
                      onChanged: (value) => setState(() => useLocation = value),
                      title: const Text('Kirim lokasi Mesuji sementara'),
                      subtitle: const Text(
                        'Diganti GPS real saat permission aktif.',
                      ),
                    ),
                    FilledButton.icon(
                      onPressed: submitting ? null : _submit,
                      icon: submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                      label: Text(
                        submitting ? 'Mengirim...' : 'Kirim Aspirasi',
                      ),
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

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.number,
    required this.title,
    required this.body,
  });

  final String number;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: primary.withValues(alpha: .1),
            foregroundColor: primary,
            child: Text(number),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                Text(body, style: const TextStyle(color: muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
