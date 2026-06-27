import 'package:flutter/material.dart';

const primary = Color(0xFFB7000C);
const primaryContainer = Color(0xFFE60012);
const surface = Color(0xFFF7F8FC);
const surfaceContainer = Color(0xFFEAF0FF);
const onSurface = Color(0xFF101828);
const muted = Color(0xFF667085);
const tertiary = Color(0xFF004ED0);
const success = Color(0xFF16A34A);
const warning = Color(0xFFF97316);

const redGradient = [Color(0xFFE60012), Color(0xFF8F0009)];
const blueGradient = [Color(0xFF1D64F2), Color(0xFF003D9C)];
const darkGradient = [Color(0xFF172033), Color(0xFF0B1220)];
const softGradient = [Color(0xFFFFF6F7), Color(0xFFEAF0FF)];

final tolongTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: primary,
    primary: primary,
    primaryContainer: primaryContainer,
    surface: surface,
    onSurface: onSurface,
    tertiary: tertiary,
  ),
  fontFamily: 'Inter',
  scaffoldBackgroundColor: surface,
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 18,
      fontWeight: FontWeight.w800,
      color: onSurface,
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE3E8F4)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE3E8F4)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: primary, width: 1.4),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w800),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: primary,
      side: const BorderSide(color: Color(0xFFE3E8F4)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontWeight: FontWeight.w800),
    ),
  ),
  cardTheme: CardThemeData(
    color: Colors.white.withValues(alpha: .9),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
      side: BorderSide(color: Colors.white.withValues(alpha: .7)),
    ),
  ),
);
