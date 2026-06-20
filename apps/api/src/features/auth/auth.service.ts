import { createHash, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../core/prisma/prisma.service';

type JwtPayload = { sub: string; role: Role; sessionId: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    if (!admin.apps.length && this.config.get('FIREBASE_PROJECT_ID') && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey
        })
      });
    }
  }

  async loginWithFirebase(idToken: string) {
    if (!admin.apps.length) throw new UnauthorizedException('Firebase Admin belum dikonfigurasi');
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const displayName = decoded.name ?? decoded.phone_number ?? decoded.email ?? 'Warga Mesuji';
      const user = await this.prisma.user.upsert({
        where: { firebaseUid: decoded.uid },
        update: {
          email: decoded.email,
          phone: decoded.phone_number,
          displayName,
          avatarUrl: decoded.picture
        },
        create: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          phone: decoded.phone_number,
          displayName,
          avatarUrl: decoded.picture,
          role: Role.CITIZEN
        }
      });
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Firebase token tidak valid');
    }
  }

  async guest(displayName = 'Tamu TOLONG') {
    const user = await this.prisma.user.create({
      data: { displayName, role: Role.GUEST }
    });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh')
      });
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
      if (user.refreshTokenHash !== this.hash(refreshToken)) {
        throw new UnauthorizedException('Refresh token tidak cocok');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return { success: true };
  }

  async registerFcmToken(userId: string, token: string, platform: string) {
    return this.prisma.fcmToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform }
    });
  }

  async verifyAccessToken(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Bearer token wajib dikirim');
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('JWT_SECRET', 'dev-secret')
      });
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
      return { id: user.id, role: user.role, displayName: user.displayName, email: user.email, phone: user.phone };
    } catch {
      throw new UnauthorizedException('Access token tidak valid');
    }
  }

  private async issueTokens(user: Pick<User, 'id' | 'role' | 'displayName' | 'email' | 'phone'>) {
    const sessionId = randomUUID();
    const payload: JwtPayload = { sub: user.id, role: user.role, sessionId };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET', 'dev-secret'),
      expiresIn: '15m'
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh'),
      expiresIn: '30d'
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: this.hash(refreshToken) }
    });
    return { accessToken, refreshToken, user };
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
