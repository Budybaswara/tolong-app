import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/widgets.dart';
import '../../theme.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppScrollPage(
        padding: const EdgeInsets.fromLTRB(24, 58, 24, 28),
        children: [
          Center(
            child: Container(
              width: 132,
              height: 132,
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(34),
                boxShadow: [
                  BoxShadow(
                    color: primary.withValues(alpha: .2),
                    blurRadius: 42,
                    offset: const Offset(0, 18),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: Image.asset('assets/logo/tolong.png', fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(height: 26),
          const Text(
            'TOLONG',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 42,
              fontWeight: FontWeight.w900,
              color: primary,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Aplikasi layanan publik DPD PSI Mesuji Lampung',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: muted, height: 1.45),
          ),
          const SizedBox(height: 28),
          const GlassCard(
            gradient: darkGradient,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StatusPill(
                  label: 'Siaga warga',
                  icon: Icons.verified_user,
                  color: Colors.white,
                ),
                SizedBox(height: 18),
                Text(
                  'Darurat, aspirasi, bantuan, UMKM, kerja, dan berita dalam satu aplikasi.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Masuk sebagai warga Mesuji untuk mengirim laporan dan mengikuti progres dari dashboard operator.',
                  style: TextStyle(color: Colors.white70, height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => context.go('/home'),
            icon: const Icon(Icons.phone_android),
            label: const Text('Masuk dengan Nomor HP'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => context.go('/home'),
            icon: const Icon(Icons.g_mobiledata, size: 28),
            label: const Text('Masuk dengan Google'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.go('/home'),
            child: const Text('Lanjut sebagai Tamu'),
          ),
          const SizedBox(height: 18),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              StatusPill(label: 'GPS SOS'),
              SizedBox(width: 8),
              StatusPill(label: 'AI Assistant', color: tertiary),
              SizedBox(width: 8),
              StatusPill(label: 'QR Member', color: success),
            ],
          ),
        ],
      ),
    );
  }
}
