import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../core/auth/auth_session.dart';
import '../../core/repositories/tolong_repository.dart';
import '../../shared/widgets.dart';
import '../../theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final repository = TolongRepository();
  final phoneController = TextEditingController();
  final otpController = TextEditingController();

  String? verificationId;
  String? errorText;
  String? infoText;
  String? loadingAction;

  bool get isBusy => loadingAction != null;

  @override
  void dispose() {
    phoneController.dispose();
    otpController.dispose();
    super.dispose();
  }

  Future<void> _loginAsGuest() async {
    await _run('guest', () async {
      final payload = await repository.guestLogin();
      await _completeLogin(payload);
    });
  }

  Future<void> _loginWithGoogle() async {
    await _run('google', () async {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) return;

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCredential = await FirebaseAuth.instance.signInWithCredential(
        credential,
      );
      final idToken = await userCredential.user?.getIdToken();
      if (idToken == null) {
        throw FirebaseAuthException(
          code: 'missing-token',
          message: 'Token Firebase tidak tersedia.',
        );
      }

      final payload = await repository.loginWithFirebaseToken(idToken);
      await _completeLogin(payload);
    });
  }

  Future<void> _sendOtp() async {
    final phoneNumber = _normalizeIndonesianPhone(phoneController.text);
    if (phoneNumber == null) {
      setState(() {
        errorText = 'Masukkan nomor HP aktif, contoh 081234567890.';
      });
      return;
    }

    setState(() {
      loadingAction = 'otp';
      errorText = null;
      infoText = null;
    });

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (credential) async {
        await _signInWithPhoneCredential(credential);
      },
      verificationFailed: (exception) {
        if (!mounted) return;
        setState(() {
          loadingAction = null;
          errorText = _friendlyAuthError(exception);
        });
      },
      codeSent: (id, _) {
        if (!mounted) return;
        setState(() {
          verificationId = id;
          loadingAction = null;
          infoText = 'Kode OTP sudah dikirim ke $phoneNumber.';
        });
      },
      codeAutoRetrievalTimeout: (id) {
        verificationId = id;
      },
    );
  }

  Future<void> _verifyOtp() async {
    final id = verificationId;
    final smsCode = otpController.text.trim();
    if (id == null || smsCode.length < 4) {
      setState(() {
        errorText = 'Masukkan kode OTP yang diterima melalui SMS.';
      });
      return;
    }

    await _run('verifyOtp', () async {
      final credential = PhoneAuthProvider.credential(
        verificationId: id,
        smsCode: smsCode,
      );
      await _signInWithPhoneCredential(credential);
    });
  }

  Future<void> _signInWithPhoneCredential(PhoneAuthCredential credential) async {
    final userCredential = await FirebaseAuth.instance.signInWithCredential(
      credential,
    );
    final idToken = await userCredential.user?.getIdToken();
    if (idToken == null) {
      throw FirebaseAuthException(
        code: 'missing-token',
        message: 'Token Firebase tidak tersedia.',
      );
    }
    final payload = await repository.loginWithFirebaseToken(idToken);
    await _completeLogin(payload);
  }

  Future<void> _completeLogin(Map<String, dynamic> payload) async {
    await AuthSession.instance.saveAuthPayload(payload);
    await _registerFcmToken();
    if (mounted) context.go('/home');
  }

  Future<void> _registerFcmToken() async {
    try {
      await FirebaseMessaging.instance.requestPermission();
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await repository.registerFcmToken(token);
      }
      FirebaseMessaging.instance.onTokenRefresh.listen((token) {
        repository.registerFcmToken(token);
      });
    } catch (_) {
      // Login must not fail only because notification permission/token failed.
    }
  }

  Future<void> _run(String action, Future<void> Function() task) async {
    setState(() {
      loadingAction = action;
      errorText = null;
      infoText = null;
    });

    try {
      await task();
    } on FirebaseAuthException catch (exception) {
      if (!mounted) return;
      setState(() {
        errorText = _friendlyAuthError(exception);
      });
    } catch (exception) {
      if (!mounted) return;
      setState(() {
        errorText = 'Login gagal. Periksa koneksi dan konfigurasi server.';
      });
    } finally {
      if (mounted && loadingAction == action) {
        setState(() {
          loadingAction = null;
        });
      }
    }
  }

  String? _normalizeIndonesianPhone(String value) {
    final digits = value.replaceAll(RegExp(r'[^0-9+]'), '');
    if (digits.startsWith('+62') && digits.length >= 11) return digits;
    if (digits.startsWith('62') && digits.length >= 10) return '+$digits';
    if (digits.startsWith('0') && digits.length >= 10) {
      return '+62${digits.substring(1)}';
    }
    return null;
  }

  String _friendlyAuthError(FirebaseAuthException exception) {
    return switch (exception.code) {
      'invalid-phone-number' => 'Format nomor HP belum valid.',
      'invalid-verification-code' => 'Kode OTP tidak cocok.',
      'too-many-requests' => 'Terlalu banyak percobaan. Coba lagi nanti.',
      'network-request-failed' => 'Koneksi internet bermasalah.',
      _ => exception.message ?? 'Autentikasi gagal.',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AppScrollPage(
        padding: const EdgeInsets.fromLTRB(24, 58, 24, 28),
        children: [
          Center(
            child: Container(
              width: 132,
              height: 132,
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(34),
                boxShadow: [
                  BoxShadow(
                    color: primary.withValues(alpha: .2),
                    blurRadius: 42,
                    offset: const Offset(0, 18),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: Image.asset('assets/logo/tolong.png', fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(height: 26),
          const Text(
            'TOLONG',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 42,
              fontWeight: FontWeight.w900,
              color: primary,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Aplikasi layanan publik DPD PSI Mesuji Lampung',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: muted, height: 1.45),
          ),
          const SizedBox(height: 28),
          const GlassCard(
            gradient: darkGradient,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StatusPill(
                  label: 'Siaga warga',
                  icon: Icons.verified_user,
                  color: Colors.white,
                ),
                SizedBox(height: 18),
                Text(
                  'Darurat, aspirasi, bantuan, UMKM, kerja, dan berita dalam satu aplikasi.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Masuk sebagai warga Mesuji untuk mengirim laporan dan mengikuti progres dari dashboard operator.',
                  style: TextStyle(color: Colors.white70, height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  decoration: const InputDecoration(
                    labelText: 'Nomor HP',
                    hintText: '081234567890',
                    prefixIcon: Icon(Icons.phone_android),
                  ),
                ),
                if (verificationId != null) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: otpController,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'Kode OTP',
                      prefixIcon: Icon(Icons.pin),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: isBusy
                      ? null
                      : verificationId == null
                      ? _sendOtp
                      : _verifyOtp,
                  icon: _ButtonIcon(
                    busy: loadingAction == 'otp' || loadingAction == 'verifyOtp',
                    icon: Icons.sms_outlined,
                  ),
                  label: Text(
                    verificationId == null ? 'Kirim OTP' : 'Verifikasi OTP',
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: isBusy ? null : _loginWithGoogle,
                  icon: _ButtonIcon(
                    busy: loadingAction == 'google',
                    icon: Icons.g_mobiledata,
                    size: 28,
                  ),
                  label: const Text('Masuk dengan Google'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: isBusy ? null : _loginAsGuest,
                  child: loadingAction == 'guest'
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Lanjut sebagai Tamu'),
                ),
              ],
            ),
          ),
          if (errorText != null || infoText != null) ...[
            const SizedBox(height: 12),
            _AuthMessage(
              text: errorText ?? infoText!,
              isError: errorText != null,
            ),
          ],
          const SizedBox(height: 18),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              StatusPill(label: 'GPS SOS'),
              SizedBox(width: 8),
              StatusPill(label: 'AI Assistant', color: tertiary),
              SizedBox(width: 8),
              StatusPill(label: 'QR Member', color: success),
            ],
          ),
        ],
      ),
    );
  }
}

class _ButtonIcon extends StatelessWidget {
  const _ButtonIcon({required this.busy, required this.icon, this.size});

  final bool busy;
  final IconData icon;
  final double? size;

  @override
  Widget build(BuildContext context) {
    if (busy) {
      return const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }
    return Icon(icon, size: size);
  }
}

class _AuthMessage extends StatelessWidget {
  const _AuthMessage({required this.text, required this.isError});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? primary : success;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: .2)),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }
}
