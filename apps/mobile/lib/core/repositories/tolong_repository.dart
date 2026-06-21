import '../network/api_client.dart';

class TolongRepository {
  TolongRepository({ApiClient? api}) : api = api ?? ApiClient();

  final ApiClient api;

  Future<Map<String, dynamic>> home() => api.getHome();
  Future<List<dynamic>> categories({String? module}) => api.getCategories(module: module);
  Future<Map<String, dynamic>> createReport(Map<String, dynamic> payload) => api.createReport(payload);
  Future<Map<String, dynamic>> createEmergency(Map<String, dynamic> payload) => api.createEmergency(payload);
  Future<List<dynamic>> assistance() => api.getAssistance();
  Future<List<dynamic>> products({String? query}) => api.getProducts(query: query);
  Future<List<dynamic>> jobs() => api.getJobs();
  Future<List<dynamic>> news() => api.getNews();
  Future<List<dynamic>> mapReports() => api.getMapReports();
  Future<List<dynamic>> notifications() => api.getNotifications();
  Future<Map<String, dynamic>> sendAiMessage({
    required String message,
    String? conversationId,
  }) =>
      api.sendAiMessage(message: message, conversationId: conversationId);
}
