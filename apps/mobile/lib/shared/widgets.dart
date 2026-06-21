import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .82),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: .55)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

class Shell extends StatelessWidget {
  final Widget child;
  final int index;

  const Shell({
    super.key,
    required this.child,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset(
                'assets/logo/tolong.png',
                width: 34,
                height: 34,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
            const Text('TOLONG Mesuji'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => context.go('/notifications'),
            icon: const Icon(Icons.notifications, color: primary),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          final paths = ['/home', '/aspirasi', '/ai', '/market', '/profile'];
          context.go(paths[i]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.forum_outlined), label: 'Aspirasi'),
          NavigationDestination(icon: Icon(Icons.smart_toy_outlined), selectedIcon: Icon(Icons.smart_toy), label: 'AI'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), label: 'UMKM'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String text;

  const SectionTitle(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: onSurface,
      ),
    );
  }
}
