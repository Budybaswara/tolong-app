import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: .08),
                      blurRadius: 22,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  'assets/logo/tolong.png',
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'TOLONG',
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: primary,
                ),
              ),
              const Text(
                'DPD PSI Mesuji Lampung',
                style: TextStyle(fontSize: 16, color: Color(0xFF5F3F3B)),
              ),
              const Spacer(),
              FilledButton(
                onPressed: () => context.go('/home'),
                child: const Text('Masuk dengan Nomor HP'),
              ),
              OutlinedButton(
                onPressed: () => context.go('/home'),
                child: const Text('Masuk dengan Google'),
              ),
              TextButton(
                onPressed: () => context.go('/home'),
                child: const Text('Lanjut sebagai Tamu'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
