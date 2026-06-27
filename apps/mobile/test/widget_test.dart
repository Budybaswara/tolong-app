import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tolong_mobile/main.dart';

void main() {
  testWidgets('shows the TOLONG auth screen', (tester) async {
    await tester.pumpWidget(const TolongApp());

    expect(find.text('TOLONG'), findsOneWidget);
    expect(
      find.text('Aplikasi layanan publik DPD PSI Mesuji Lampung'),
      findsOneWidget,
    );
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -360));
    await tester.pumpAndSettle();
    expect(find.text('Lanjut sebagai Tamu'), findsOneWidget);
  });
}
