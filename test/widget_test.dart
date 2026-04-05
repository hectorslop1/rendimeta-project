import 'package:flutter_test/flutter_test.dart';
import 'package:rendimeta/main.dart';

void main() {
  testWidgets('App renders smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const RendimetaApp());
    await tester.pumpAndSettle();
    expect(find.text('Inicio'), findsOneWidget);
  });
}
