import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'theme.dart';
import 'features/auth/auth_screen.dart';
import 'features/home/home_screen.dart';
import 'features/emergency/emergency_screen.dart';
import 'features/aspirasi/aspirasi_screen.dart';
import 'features/ai/ai_screen.dart';
import 'features/market/market_jobs_screen.dart';
import 'features/news/profile_news_screen.dart';
import 'features/assistance/assistance_screen.dart';
import 'features/jobs/jobs_screen.dart';
import 'features/map/mesuji_map_screen.dart';
import 'features/notifications/notifications_screen.dart';

void main() => runApp(const TolongApp());
final router = GoRouter(initialLocation: '/', routes: [
  GoRoute(path: '/', builder: (_, __) => const AuthScreen()),
  GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
  GoRoute(path: '/sos', builder: (_, __) => const EmergencyScreen()),
  GoRoute(path: '/aspirasi', builder: (_, __) => const AspirasiScreen()),
  GoRoute(path: '/ai', builder: (_, __) => const AiScreen()),
  GoRoute(path: '/assistance', builder: (_, __) => const AssistanceScreen()),
  GoRoute(path: '/market', builder: (_, __) => const MarketJobsScreen()),
  GoRoute(path: '/jobs', builder: (_, __) => const JobsScreen()),
  GoRoute(path: '/map', builder: (_, __) => const MesujiMapScreen()),
  GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
  GoRoute(path: '/profile', builder: (_, __) => const ProfileNewsScreen()),
]);
class TolongApp extends StatelessWidget { const TolongApp({super.key}); @override Widget build(BuildContext context) => MaterialApp.router(debugShowCheckedModeBanner:false,title:'TOLONG',theme:tolongTheme,routerConfig:router); }
