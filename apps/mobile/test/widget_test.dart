import 'package:flutter_test/flutter_test.dart';
import 'package:tolong_mobile/main.dart';

void main() {
  testWidgets('shows the TOLONG auth screen', (tester) async {
    await tester.pumpWidget(const TolongApp());

    expect(find.text('TOLONG'), findsOneWidget);
    expect(find.text('DPD PSI Mesuji Lampung'), findsOneWidget);
    expect(find.text('Lanjut sebagai Tamu'), findsOneWidget);
  });
}
