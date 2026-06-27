import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'features/ai/ai_screen.dart';
import 'features/aspirasi/aspirasi_screen.dart';
import 'features/assistance/assistance_screen.dart';
import 'features/auth/auth_screen.dart';
import 'features/emergency/emergency_screen.dart';
import 'features/home/home_screen.dart';
import 'features/jobs/jobs_screen.dart';
import 'features/map/mesuji_map_screen.dart';
import 'features/market/market_jobs_screen.dart';
import 'features/news/profile_news_screen.dart';
import 'features/notifications/notifications_screen.dart';
import 'theme.dart';

void main() => runApp(const TolongApp());

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const AuthScreen()),
    GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
    GoRoute(path: '/sos', builder: (context, state) => const EmergencyScreen()),
    GoRoute(
      path: '/aspirasi',
      builder: (context, state) => const AspirasiScreen(),
    ),
    GoRoute(path: '/ai', builder: (context, state) => const AiScreen()),
    GoRoute(
      path: '/assistance',
      builder: (context, state) => const AssistanceScreen(),
    ),
    GoRoute(
      path: '/market',
      builder: (context, state) => const MarketJobsScreen(),
    ),
    GoRoute(path: '/jobs', builder: (context, state) => const JobsScreen()),
    GoRoute(path: '/map', builder: (context, state) => const MesujiMapScreen()),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileNewsScreen(),
    ),
    GoRoute(
      path: '/news/:slug',
      builder: (context, state) => NewsDetailScreen(
        slug: state.pathParameters['slug'] ?? '',
        initialArticle: state.extra is Map<String, dynamic>
            ? state.extra as Map<String, dynamic>
            : null,
      ),
    ),
  ],
);

class TolongApp extends StatelessWidget {
  const TolongApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'TOLONG',
      theme: tolongTheme,
      routerConfig: router,
    );
  }
}
