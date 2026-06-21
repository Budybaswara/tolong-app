import 'package:dio/dio.dart';

class ApiClient {
  ApiClient()
      : dio = Dio(
          BaseOptions(
            baseUrl: const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: 'https://dokploy.closeclaw.site/tolong-api/v1',
            ),
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Accept': 'application/json'},
          ),
        );

  final Dio dio;

  Future<Map<String, dynamic>> getHome() async {
    final response = await dio.get<Map<String, dynamic>>('/home');
    return response.data ?? <String, dynamic>{};
  }

  Future<List<dynamic>> getCategories({String? module}) async {
    final response = await dio.get<List<dynamic>>(
      '/categories',
      queryParameters: {'module': module},
    );
    return response.data ?? <dynamic>[];
  }

  Future<Map<String, dynamic>> createReport(Map<String, dynamic> payload) async {
    final response = await dio.post<Map<String, dynamic>>('/reports', data: payload);
    return response.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> createEmergency(Map<String, dynamic> payload) async {
    final response = await dio.post<Map<String, dynamic>>('/emergencies', data: payload);
    return response.data ?? <String, dynamic>{};
  }

  Future<List<dynamic>> getAssistance() async {
    final response = await dio.get<List<dynamic>>('/assistance');
    return response.data ?? <dynamic>[];
  }

  Future<List<dynamic>> getProducts({String? query}) async {
    final response = await dio.get<List<dynamic>>('/products', queryParameters: {'q': query});
    return response.data ?? <dynamic>[];
  }

  Future<List<dynamic>> getJobs() async {
    final response = await dio.get<List<dynamic>>('/jobs');
    return response.data ?? <dynamic>[];
  }

  Future<List<dynamic>> getNews({bool featured = false}) async {
    final response = await dio.get<List<dynamic>>('/news', queryParameters: {'featured': featured});
    return response.data ?? <dynamic>[];
  }

  Future<List<dynamic>> getMapReports() async {
    final response = await dio.get<List<dynamic>>('/map/live-reports');
    return response.data ?? <dynamic>[];
  }

  Future<List<dynamic>> getNotifications({String? userId}) async {
    final response = await dio.get<List<dynamic>>('/notifications', queryParameters: {'userId': userId});
    return response.data ?? <dynamic>[];
  }

  Future<Map<String, dynamic>> sendAiMessage({
    required String message,
    String? conversationId,
    String? userId,
  }) async {
    final payload = <String, dynamic>{'message': message};
    if (conversationId != null) payload['conversationId'] = conversationId;
    if (userId != null) payload['userId'] = userId;
    final response = await dio.post<Map<String, dynamic>>(
      '/ai/chat',
      data: payload,
    );
    return response.data ?? <String, dynamic>{};
  }
}
