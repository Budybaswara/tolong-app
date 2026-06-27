import 'package:shared_preferences/shared_preferences.dart';

class AuthSession {
  AuthSession._();

  static final AuthSession instance = AuthSession._();

  static const _accessTokenKey = 'tolong_access_token';
  static const _refreshTokenKey = 'tolong_refresh_token';
  static const _userIdKey = 'tolong_user_id';
  static const _displayNameKey = 'tolong_display_name';
  static const _roleKey = 'tolong_role';

  String? accessToken;
  String? refreshToken;
  String? userId;
  String? displayName;
  String? role;

  bool get isSignedIn => accessToken != null && accessToken!.isNotEmpty;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    accessToken = prefs.getString(_accessTokenKey);
    refreshToken = prefs.getString(_refreshTokenKey);
    userId = prefs.getString(_userIdKey);
    displayName = prefs.getString(_displayNameKey);
    role = prefs.getString(_roleKey);
  }

  Future<void> saveAuthPayload(Map<String, dynamic> payload) async {
    final user = (payload['user'] as Map?)?.cast<String, dynamic>();
    accessToken = payload['accessToken'] as String?;
    refreshToken = payload['refreshToken'] as String?;
    userId = user?['id'] as String?;
    displayName = user?['displayName'] as String?;
    role = user?['role'] as String?;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken ?? '');
    await prefs.setString(_refreshTokenKey, refreshToken ?? '');
    await prefs.setString(_userIdKey, userId ?? '');
    await prefs.setString(_displayNameKey, displayName ?? '');
    await prefs.setString(_roleKey, role ?? '');
  }

  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
    userId = null;
    displayName = null;
    role = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_displayNameKey);
    await prefs.remove(_roleKey);
  }
}
