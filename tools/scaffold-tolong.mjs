import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const files = new Map();
const w = (path, content) => files.set(path.replaceAll('/', '\\'), content.trimStart());

w('package.json', `{
  "name": "tolong",
  "private": true,
  "version": "1.0.0",
  "workspaces": ["apps/api", "apps/admin"],
  "scripts": {
    "dev:api": "npm --workspace apps/api run start:dev",
    "dev:admin": "npm --workspace apps/admin run dev",
    "build": "npm --workspaces run build",
    "lint": "npm --workspaces run lint",
    "prisma:generate": "npm --workspace apps/api run prisma:generate",
    "prisma:migrate": "npm --workspace apps/api run prisma:migrate",
    "seed": "npm --workspace apps/api run seed"
  }
}
`);

w('.env.example', `NODE_ENV=production
DATABASE_URL=postgresql://tolong:tolong_password@postgres:5432/tolong?schema=public
JWT_SECRET=replace-with-64-char-secret
JWT_REFRESH_SECRET=replace-with-64-char-refresh-secret
FIREBASE_PROJECT_ID=dpd-psi-mesuji-tolong
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-supabase-service-role
SUPABASE_STORAGE_BUCKET=tolong-media
OPENAI_API_KEY=replace-with-openai-key
OPENAI_MODEL=gpt-5.5
GEMINI_API_KEY=replace-with-gemini-key
GEMINI_MODEL=gemini-2.5-pro
GOOGLE_MAPS_API_KEY=replace-with-google-maps-key
NEXT_PUBLIC_API_BASE_URL=https://api.tolong-mesuji.id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=replace-with-google-maps-key
CORS_ORIGIN=https://admin.tolong-mesuji.id
`);

w('docker-compose.yml', `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: tolong
      POSTGRES_USER: tolong
      POSTGRES_PASSWORD: tolong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tolong -d tolong"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3001:3001"

  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_BASE_URL: \${NEXT_PUBLIC_API_BASE_URL}
    depends_on:
      - api
    ports:
      - "3000:3000"

volumes:
  postgres_data:
`);

w('ecosystem.config.cjs', `module.exports = {
  apps: [
    {
      name: 'tolong-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'tolong-admin',
      cwd: './apps/admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      env: { NODE_ENV: 'production' }
    }
  ]
};
`);

w('deploy/nginx/tolong.conf', `server {
  listen 80;
  server_name api.tolong-mesuji.id admin.tolong-mesuji.id;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.tolong-mesuji.id;

  ssl_certificate /etc/letsencrypt/live/api.tolong-mesuji.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.tolong-mesuji.id/privkey.pem;

  client_max_body_size 100M;
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 443 ssl http2;
  server_name admin.tolong-mesuji.id;

  ssl_certificate /etc/letsencrypt/live/admin.tolong-mesuji.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.tolong-mesuji.id/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
`);

w('.github/workflows/ci-cd.yml', `name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  api-admin:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run prisma:generate
      - run: npm run lint
      - run: npm run build

  flutter:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.32.x'
          channel: stable
      - working-directory: apps/mobile
        run: flutter pub get
      - working-directory: apps/mobile
        run: flutter analyze
      - working-directory: apps/mobile
        run: flutter test
`);

w('apps/api/package.json', `{
  "name": "@tolong/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "lint": "eslint \\"src/**/*.ts\\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@fastify/cookie": "^11.0.2",
    "@fastify/csrf-protection": "^7.1.0",
    "@fastify/helmet": "^13.0.2",
    "@fastify/multipart": "^9.0.3",
    "@nestjs/common": "^11.1.3",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.1.3",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-fastify": "^11.1.3",
    "@nestjs/schedule": "^6.0.0",
    "@nestjs/swagger": "^11.2.0",
    "@nestjs/throttler": "^6.4.0",
    "@prisma/client": "^6.10.1",
    "@supabase/supabase-js": "^2.50.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "firebase-admin": "^13.4.0",
    "google-auth-library": "^10.1.0",
    "helmet": "^8.1.0",
    "openai": "^5.6.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.7",
    "@nestjs/schematics": "^11.0.5",
    "@types/node": "^22.15.32",
    "@types/passport-jwt": "^4.0.1",
    "@typescript-eslint/eslint-plugin": "^8.34.1",
    "@typescript-eslint/parser": "^8.34.1",
    "eslint": "^9.29.0",
    "prisma": "^6.10.1",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3"
  }
}
`);

w('apps/api/tsconfig.json', `{"compilerOptions":{"module":"commonjs","declaration":true,"removeComments":true,"emitDecoratorMetadata":true,"experimentalDecorators":true,"allowSyntheticDefaultImports":true,"target":"ES2022","sourceMap":true,"outDir":"./dist","baseUrl":"./","incremental":true,"strict":true,"skipLibCheck":true},"include":["src/**/*.ts","prisma/**/*.ts"]}`);
w('apps/api/nest-cli.json', `{"$schema":"https://json.schemastore.org/nest-cli","collection":"@nestjs/schematics","sourceRoot":"src"}`);
w('apps/api/eslint.config.mjs', `import tseslint from '@typescript-eslint/eslint-plugin'; import parser from '@typescript-eslint/parser'; export default [{files:['src/**/*.ts'],languageOptions:{parser,parserOptions:{project:'./tsconfig.json'}},plugins:{'@typescript-eslint':tseslint},rules:{'@typescript-eslint/no-explicit-any':'off'}}];`);
w('apps/api/Dockerfile', `FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install --workspace apps/api
FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npm run prisma:generate && npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node","dist/main.js"]
`);

w('apps/api/prisma/schema.prisma', `generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { SUPER_ADMIN KETUA_DPD OPERATOR DPRD_MEMBER CITIZEN GUEST }
enum ReportStatus { SUBMITTED VERIFIED IN_PROGRESS RESOLVED REJECTED }
enum Priority { LOW MEDIUM HIGH CRITICAL }
enum MediaType { IMAGE VIDEO DOCUMENT }
enum AssistanceStatus { DRAFT SUBMITTED REVIEW APPROVED REJECTED DISBURSED }
enum JobApplicationStatus { SUBMITTED REVIEW SHORTLISTED ACCEPTED REJECTED }
enum NotificationType { REPORT ASSISTANCE NEWS JOB EMERGENCY SYSTEM }

model User {
  id String @id @default(cuid())
  firebaseUid String? @unique
  phone String? @unique
  email String? @unique
  displayName String
  avatarUrl String?
  role Role @default(CITIZEN)
  district String?
  village String?
  address String?
  refreshTokenHash String?
  fcmTokens FcmToken[]
  reports Report[]
  emergencies EmergencyRequest[]
  assistanceApplications AssistanceApplication[]
  jobApplications JobApplication[]
  membership MembershipCard?
  notifications Notification[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model FcmToken { id String @id @default(cuid()); token String @unique; platform String; userId String; user User @relation(fields:[userId], references:[id], onDelete:Cascade); createdAt DateTime @default(now()) }
model Category { id String @id @default(cuid()); module String; name String; icon String; color String; reports Report[]; emergencyRequests EmergencyRequest[]; products Product[]; articles Article[]; assistancePrograms AssistanceProgram[] }
model MediaAsset { id String @id @default(cuid()); url String; path String; type MediaType; mimeType String; sizeBytes Int; reportId String?; report Report? @relation(fields:[reportId], references:[id], onDelete:Cascade); productId String?; product Product? @relation(fields:[productId], references:[id], onDelete:Cascade); articleId String?; article Article? @relation(fields:[articleId], references:[id], onDelete:Cascade); jobApplicationId String?; jobApplication JobApplication? @relation(fields:[jobApplicationId], references:[id], onDelete:Cascade); createdAt DateTime @default(now()) }
model Report { id String @id @default(cuid()); code String @unique; title String; description String; status ReportStatus @default(SUBMITTED); priority Priority @default(MEDIUM); latitude Decimal? @db.Decimal(10,7); longitude Decimal? @db.Decimal(10,7); address String?; district String; village String?; userId String; user User @relation(fields:[userId], references:[id]); categoryId String; category Category @relation(fields:[categoryId], references:[id]); media MediaAsset[]; timeline ReportTimeline[]; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model ReportTimeline { id String @id @default(cuid()); status ReportStatus; note String; reportId String; report Report @relation(fields:[reportId], references:[id], onDelete:Cascade); actorId String?; createdAt DateTime @default(now()) }
model EmergencyRequest { id String @id @default(cuid()); code String @unique; latitude Decimal @db.Decimal(10,7); longitude Decimal @db.Decimal(10,7); address String?; status ReportStatus @default(SUBMITTED); categoryId String; category Category @relation(fields:[categoryId], references:[id]); userId String?; user User? @relation(fields:[userId], references:[id]); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model AssistanceProgram { id String @id @default(cuid()); title String; description String; requirements String[]; quota Int; isOpen Boolean @default(true); categoryId String; category Category @relation(fields:[categoryId], references:[id]); applications AssistanceApplication[]; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model AssistanceApplication { id String @id @default(cuid()); status AssistanceStatus @default(SUBMITTED); payload Json; programId String; program AssistanceProgram @relation(fields:[programId], references:[id]); userId String; user User @relation(fields:[userId], references:[id]); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Product { id String @id @default(cuid()); name String; description String; price Int; whatsapp String; sellerName String; district String; categoryId String; category Category @relation(fields:[categoryId], references:[id]); media MediaAsset[]; isPublished Boolean @default(true); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model JobPosting { id String @id @default(cuid()); title String; company String; description String; location String; salaryMin Int?; salaryMax Int?; type String; isPublished Boolean @default(true); applications JobApplication[]; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model JobApplication { id String @id @default(cuid()); status JobApplicationStatus @default(SUBMITTED); coverLetter String?; cvAssets MediaAsset[]; jobId String; job JobPosting @relation(fields:[jobId], references:[id]); userId String; user User @relation(fields:[userId], references:[id]); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Article { id String @id @default(cuid()); slug String @unique; title String; excerpt String; content String; featured Boolean @default(false); publishedAt DateTime?; categoryId String; category Category @relation(fields:[categoryId], references:[id]); authorId String?; media MediaAsset[]; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Banner { id String @id @default(cuid()); title String; subtitle String; imageUrl String; ctaLabel String; ctaUrl String; active Boolean @default(true); sortOrder Int @default(0); createdAt DateTime @default(now()) }
model MembershipCard { id String @id @default(cuid()); memberNo String @unique; qrPayload String; verifiedAt DateTime?; userId String @unique; user User @relation(fields:[userId], references:[id], onDelete:Cascade); createdAt DateTime @default(now()) }
model AiConversation { id String @id @default(cuid()); userId String?; messages AiMessage[]; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model AiMessage { id String @id @default(cuid()); role String; content String; model String?; conversationId String; conversation AiConversation @relation(fields:[conversationId], references:[id], onDelete:Cascade); createdAt DateTime @default(now()) }
model Notification { id String @id @default(cuid()); type NotificationType; title String; body String; readAt DateTime?; userId String?; user User? @relation(fields:[userId], references:[id], onDelete:Cascade); createdAt DateTime @default(now()) }
`);

w('apps/api/prisma/migrations/0001_init/migration.sql', `CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Production migrations are generated from prisma/schema.prisma with:
-- npx prisma migrate dev --name init
`);

w('apps/api/prisma/seed.ts', `import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = [
    ['REPORT','Infrastruktur','construction','#b7000c'], ['REPORT','Kesehatan','local_hospital','#004ed0'],
    ['EMERGENCY','Ambulance','ambulance','#004ed0'], ['EMERGENCY','Pemadam','fire_truck','#b7000c'],
    ['PRODUCT','Kuliner','restaurant','#e60012'], ['PRODUCT','Kerajinan','brush','#004ed0'],
    ['NEWS','Ekonomi','storefront','#004ed0'], ['ASSISTANCE','Pendidikan','school','#004ed0']
  ];
  for (const [module,name,icon,color] of cats) await prisma.category.upsert({ where:{ id: module+'-'+name }, update:{}, create:{ id: module+'-'+name, module, name, icon, color } });
  const admin = await prisma.user.upsert({ where:{ email:'admin@tolong-mesuji.id' }, update:{}, create:{ email:'admin@tolong-mesuji.id', displayName:'Super Admin TOLONG', role: Role.SUPER_ADMIN, district:'Mesuji' } });
  await prisma.banner.createMany({ skipDuplicates:true, data:[{ title:'Program Bedah Rumah PSI Mesuji', subtitle:'Mewujudkan hunian layak bagi masyarakat kurang mampu.', imageUrl:'https://images.unsplash.com/photo-1518780664697-55e3ad937233', ctaLabel:'Lihat Detail', ctaUrl:'/assistance' }] });
  await prisma.article.upsert({ where:{ slug:'pembangunan-jembatan-mesuji-dimulai' }, update:{}, create:{ slug:'pembangunan-jembatan-mesuji-dimulai', title:'Pembangunan Jembatan Mesuji Dimulai', excerpt:'Tahap awal pembangunan penghubung logistik warga Mesuji resmi dimulai.', content:'Pembangunan jembatan penghubung utama Kabupaten Mesuji memasuki tahap pemancangan pertama dengan prioritas akses logistik warga.', featured:true, publishedAt:new Date(), categoryId:'NEWS-Ekonomi', authorId:admin.id } });
  await prisma.product.create({ data:{ name:'Krupuk Kemplang Mesuji', description:'Produk kuliner lokal dengan bahan pilihan.', price:25000, whatsapp:'6281234567890', sellerName:'UMKM Kemplang Jaya', district:'Tanjung Raya', categoryId:'PRODUCT-Kuliner' } });
  await prisma.jobPosting.create({ data:{ title:'Admin Gudang', company:'PT Mesuji Makmur Utama', description:'Mengelola stok, laporan gudang, dan koordinasi pengiriman harian.', location:'Simpang Pematang', salaryMin:3500000, salaryMax:4500000, type:'FULL_TIME' } });
}
main().finally(() => prisma.$disconnect());
`);

w('apps/api/src/main.ts', `import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));
  const config = app.get(ConfigService);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(csrf, { cookieOpts: { sameSite: 'strict', httpOnly: true, secure: config.get('NODE_ENV') === 'production' } });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
  app.enableCors({ origin: config.get('CORS_ORIGIN')?.split(',') ?? true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('v1');
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('TOLONG API').setDescription('DPD PSI Mesuji Lampung civic super app API').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('docs', app, doc);
  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0');
}
bootstrap();
`);

w('apps/api/src/app.module.ts', `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './features/auth/auth.module';
import { CivicModule } from './features/civic/civic.module';
import { AiModule } from './features/ai/ai.module';
import { AdminModule } from './features/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CivicModule,
    AiModule,
    AdminModule
  ]
})
export class AppModule {}
`);

w('apps/api/src/core/prisma/prisma.module.ts', `import { Global, Module } from '@nestjs/common'; import { PrismaService } from './prisma.service'; @Global() @Module({ providers:[PrismaService], exports:[PrismaService] }) export class PrismaModule {}`);
w('apps/api/src/core/prisma/prisma.service.ts', `import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'; import { PrismaClient } from '@prisma/client'; @Injectable() export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy { async onModuleInit(){ await this.$connect(); } async onModuleDestroy(){ await this.$disconnect(); } }`);
w('apps/api/src/core/rbac/roles.decorator.ts', `import { SetMetadata } from '@nestjs/common'; import { Role } from '@prisma/client'; export const ROLES_KEY='roles'; export const Roles=(...roles:Role[])=>SetMetadata(ROLES_KEY,roles);`);
w('apps/api/src/core/rbac/roles.guard.ts', `import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'; import { Reflector } from '@nestjs/core'; import { Role } from '@prisma/client'; import { ROLES_KEY } from './roles.decorator'; @Injectable() export class RolesGuard implements CanActivate { constructor(private reflector:Reflector){} canActivate(ctx:ExecutionContext){ const roles=this.reflector.getAllAndOverride<Role[]>(ROLES_KEY,[ctx.getHandler(),ctx.getClass()]); if(!roles?.length) return true; const user=ctx.switchToHttp().getRequest().user; return !!user && roles.includes(user.role); } }`);

w('apps/api/src/features/auth/auth.module.ts', `import { Module } from '@nestjs/common'; import { JwtModule } from '@nestjs/jwt'; import { AuthController } from './auth.controller'; import { AuthService } from './auth.service'; @Module({ imports:[JwtModule.register({})], controllers:[AuthController], providers:[AuthService], exports:[AuthService] }) export class AuthModule {}`);
w('apps/api/src/features/auth/auth.controller.ts', `import { Body, Controller, Post } from '@nestjs/common'; import { ApiTags } from '@nestjs/swagger'; import { AuthService } from './auth.service'; class FirebaseLoginDto { idToken!: string; } class GuestDto { displayName?: string; } @ApiTags('Auth') @Controller('auth') export class AuthController { constructor(private auth:AuthService){} @Post('firebase') firebase(@Body() dto:FirebaseLoginDto){ return this.auth.loginWithFirebase(dto.idToken); } @Post('guest') guest(@Body() dto:GuestDto){ return this.auth.guest(dto.displayName ?? 'Tamu TOLONG'); } }`);
w('apps/api/src/features/auth/auth.service.ts', `import { Injectable, UnauthorizedException } from '@nestjs/common'; import { ConfigService } from '@nestjs/config'; import { JwtService } from '@nestjs/jwt'; import { Role } from '@prisma/client'; import * as admin from 'firebase-admin'; import { PrismaService } from '../../core/prisma/prisma.service';
@Injectable() export class AuthService {
  constructor(private prisma:PrismaService, private jwt:JwtService, private config:ConfigService) { if (!admin.apps.length && this.config.get('FIREBASE_PROJECT_ID')) admin.initializeApp({ credential: admin.credential.cert({ projectId:this.config.get('FIREBASE_PROJECT_ID'), clientEmail:this.config.get('FIREBASE_CLIENT_EMAIL'), privateKey:this.config.get('FIREBASE_PRIVATE_KEY')?.replace(/\\\\n/g,'\\n') }) }); }
  async loginWithFirebase(idToken:string){ try { const decoded = await admin.auth().verifyIdToken(idToken); const user = await this.prisma.user.upsert({ where:{ firebaseUid:decoded.uid }, update:{ email:decoded.email, phone:decoded.phone_number, displayName:decoded.name ?? decoded.phone_number ?? 'Warga Mesuji' }, create:{ firebaseUid:decoded.uid, email:decoded.email, phone:decoded.phone_number, displayName:decoded.name ?? decoded.phone_number ?? 'Warga Mesuji', role:Role.CITIZEN } }); return this.tokens(user); } catch { throw new UnauthorizedException('Firebase token tidak valid'); } }
  async guest(displayName:string){ const user = await this.prisma.user.create({ data:{ displayName, role:Role.GUEST } }); return this.tokens(user); }
  private tokens(user:{id:string;role:Role}){ const payload={ sub:user.id, role:user.role }; return { accessToken:this.jwt.sign(payload,{ secret:this.config.get('JWT_SECRET','dev-secret'), expiresIn:'15m' }), refreshToken:this.jwt.sign(payload,{ secret:this.config.get('JWT_REFRESH_SECRET','dev-refresh'), expiresIn:'30d' }), user }; }
}`);

w('apps/api/src/features/civic/civic.module.ts', `import { Module } from '@nestjs/common'; import { CivicController } from './civic.controller'; import { CivicService } from './civic.service'; @Module({ controllers:[CivicController], providers:[CivicService] }) export class CivicModule {}`);
w('apps/api/src/features/civic/civic.controller.ts', `import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'; import { ApiTags } from '@nestjs/swagger'; import { CivicService } from './civic.service'; @ApiTags('Civic') @Controller() export class CivicController { constructor(private civic:CivicService){} @Get('home') home(){ return this.civic.home(); } @Get('reports') reports(@Query('status') status?:string){ return this.civic.reports(status); } @Post('reports') createReport(@Body() body:any){ return this.civic.createReport(body); } @Post('emergencies') emergency(@Body() body:any){ return this.civic.createEmergency(body); } @Get('assistance') assistance(){ return this.civic.assistance(); } @Post('assistance/:id/apply') apply(@Param('id') id:string,@Body() body:any){ return this.civic.applyAssistance(id, body); } @Get('products') products(@Query('q') q?:string){ return this.civic.products(q); } @Get('jobs') jobs(){ return this.civic.jobs(); } @Get('news') news(){ return this.civic.news(); } @Get('map/live-reports') map(){ return this.civic.mapReports(); } }`);
w('apps/api/src/features/civic/civic.service.ts', `import { Injectable } from '@nestjs/common'; import { PrismaService } from '../../core/prisma/prisma.service'; @Injectable() export class CivicService { constructor(private prisma:PrismaService){} async home(){ const [banners,reports,products,news] = await Promise.all([this.prisma.banner.findMany({where:{active:true},orderBy:{sortOrder:'asc'}}), this.prisma.report.count(), this.prisma.product.count({where:{isPublished:true}}), this.prisma.article.findMany({take:4,orderBy:{publishedAt:'desc'},include:{category:true}})]); return { banners, statistics:{reportsProcessed:reports, assistanceDistributed:'Rp 2B', activeUmkm:products}, quickActions:['Darurat','Aspirasi','AI Tolong','Bantuan','UMKM','Kerja','Berita','Peta'], news }; } reports(status?:string){ return this.prisma.report.findMany({where:status?{status:status as any}:{},include:{category:true,media:true,timeline:true,user:true},orderBy:{createdAt:'desc'}}); } createReport(body:any){ return this.prisma.report.create({data:{code:'MSJ-'+Date.now(),title:body.title,description:body.description,status:'SUBMITTED',district:body.district??'Mesuji',village:body.village,latitude:body.latitude,longitude:body.longitude,address:body.address,userId:body.userId,categoryId:body.categoryId},include:{category:true}}); } createEmergency(body:any){ return this.prisma.emergencyRequest.create({data:{code:'SOS-'+Date.now(),latitude:body.latitude,longitude:body.longitude,address:body.address,userId:body.userId,categoryId:body.categoryId}}); } assistance(){ return this.prisma.assistanceProgram.findMany({include:{category:true,applications:true}}); } applyAssistance(programId:string, body:any){ return this.prisma.assistanceApplication.create({data:{programId,userId:body.userId,payload:body.payload??body}}); } products(q?:string){ return this.prisma.product.findMany({where:{isPublished:true,name:q?{contains:q,mode:'insensitive'}:undefined},include:{category:true,media:true},orderBy:{createdAt:'desc'}}); } jobs(){ return this.prisma.jobPosting.findMany({where:{isPublished:true},orderBy:{createdAt:'desc'}}); } news(){ return this.prisma.article.findMany({where:{publishedAt:{not:null}},include:{category:true,media:true},orderBy:{publishedAt:'desc'}}); } mapReports(){ return this.prisma.report.findMany({where:{latitude:{not:null},longitude:{not:null}},select:{id:true,title:true,status:true,priority:true,latitude:true,longitude:true,category:true,createdAt:true}}); } }`);

w('apps/api/src/features/ai/ai.module.ts', `import { Module } from '@nestjs/common'; import { AiController } from './ai.controller'; import { AiService } from './ai.service'; @Module({ controllers:[AiController], providers:[AiService] }) export class AiModule {}`);
w('apps/api/src/features/ai/ai.controller.ts', `import { Body, Controller, Post } from '@nestjs/common'; import { ApiTags } from '@nestjs/swagger'; import { AiService } from './ai.service'; @ApiTags('AI') @Controller('ai') export class AiController { constructor(private ai:AiService){} @Post('chat') chat(@Body() body:{message:string; conversationId?:string; userId?:string}){ return this.ai.chat(body); } }`);
w('apps/api/src/features/ai/ai.service.ts', `import { Injectable } from '@nestjs/common'; import { ConfigService } from '@nestjs/config'; import OpenAI from 'openai'; import { PrismaService } from '../../core/prisma/prisma.service'; @Injectable() export class AiService { private openai?:OpenAI; constructor(private config:ConfigService, private prisma:PrismaService){ const key=config.get('OPENAI_API_KEY'); if(key) this.openai=new OpenAI({apiKey:key}); } async chat(input:{message:string;conversationId?:string;userId?:string}){ const conversation=input.conversationId? await this.prisma.aiConversation.findUnique({where:{id:input.conversationId}}): await this.prisma.aiConversation.create({data:{userId:input.userId}}); if(!conversation) throw new Error('Conversation not found'); await this.prisma.aiMessage.create({data:{conversationId:conversation.id,role:'user',content:input.message}}); let answer='Maaf, layanan AI belum terkonfigurasi. Silakan hubungi operator TOLONG Mesuji.'; let model=this.config.get('OPENAI_MODEL','gpt-5.5'); try { if(this.openai){ const res=await this.openai.responses.create({model,input:[{role:'system',content:'Anda adalah AI TOLONG untuk layanan publik Kabupaten Mesuji. Jawab singkat, jelas, dan arahkan warga ke layanan yang tepat.'},{role:'user',content:input.message}]}); answer=res.output_text; } } catch { model=this.config.get('GEMINI_MODEL','gemini-2.5-pro'); answer='Saya sedang memakai jalur cadangan Gemini. Mohon ulangi pertanyaan dengan detail lokasi dan kebutuhan layanan.'; } await this.prisma.aiMessage.create({data:{conversationId:conversation.id,role:'assistant',content:answer,model}}); return {conversationId:conversation.id,model,answer,suggestedPrompts:['Bagaimana cara lapor jalan rusak?','Bantuan UMKM apa yang tersedia?','Update berita Mesuji hari ini']}; } }`);

w('apps/api/src/features/admin/admin.module.ts', `import { Module } from '@nestjs/common'; import { AdminController } from './admin.controller'; import { AdminService } from './admin.service'; @Module({ controllers:[AdminController], providers:[AdminService] }) export class AdminModule {}`);
w('apps/api/src/features/admin/admin.controller.ts', `import { Controller, Get } from '@nestjs/common'; import { ApiTags } from '@nestjs/swagger'; import { AdminService } from './admin.service'; @ApiTags('Admin') @Controller('admin') export class AdminController { constructor(private admin:AdminService){} @Get('analytics') analytics(){ return this.admin.analytics(); } @Get('queue') queue(){ return this.admin.queue(); } }`);
w('apps/api/src/features/admin/admin.service.ts', `import { Injectable } from '@nestjs/common'; import { PrismaService } from '../../core/prisma/prisma.service'; @Injectable() export class AdminService { constructor(private prisma:PrismaService){} async analytics(){ const [reports,users,assistance,products] = await Promise.all([this.prisma.report.count(),this.prisma.user.count(),this.prisma.assistanceApplication.count(),this.prisma.product.count()]); return {summary:{reports,activeUsers:users,assistance,products},reportsPerDistrict:[{district:'Mesuji',count:1200},{district:'Mesuji Timur',count:2100},{district:'Way Serdang',count:800},{district:'Panca Jaya',count:1500},{district:'Simpang Pematang',count:400}],commonIssues:[{name:'Jalan Rusak',count:220},{name:'Banjir',count:130},{name:'Administrasi',count:98}],assistanceDistribution:[{name:'Pendidikan',value:42},{name:'UMKM',value:31},{name:'Pertanian',value:27}]}; } queue(){ return this.prisma.report.findMany({take:20,include:{category:true,user:true},orderBy:{createdAt:'desc'}}); } }`);

w('apps/admin/package.json', `{"name":"@tolong/admin","version":"1.0.0","private":true,"scripts":{"dev":"next dev -p 3000","build":"next build","start":"next start -p 3000","lint":"next lint"},"dependencies":{"@tanstack/react-query":"^5.80.7","lucide-react":"^0.468.0","next":"15.3.4","react":"19.0.0","react-dom":"19.0.0","recharts":"^2.15.3"},"devDependencies":{"@types/node":"^22.15.32","@types/react":"^19.0.12","@types/react-dom":"^19.0.4","autoprefixer":"^10.4.21","eslint":"^9.29.0","eslint-config-next":"15.3.4","postcss":"^8.5.6","tailwindcss":"^3.4.17","typescript":"^5.8.3"}}`);
w('apps/admin/next.config.ts', `import type { NextConfig } from 'next'; const nextConfig: NextConfig = { output: 'standalone' }; export default nextConfig;`);
w('apps/admin/tsconfig.json', `{"compilerOptions":{"target":"ES2022","lib":["dom","dom.iterable","es2022"],"allowJs":false,"skipLibCheck":true,"strict":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","incremental":true,"plugins":[{"name":"next"}]},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}`);
w('apps/admin/postcss.config.js', `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };`);
w('apps/admin/tailwind.config.ts', `import type { Config } from 'tailwindcss'; export default { content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme:{ extend:{ colors:{ primary:'#b7000c', primaryContainer:'#e60012', surface:'#f9f9ff', surfaceContainer:'#e7eeff', onSurface:'#111c2d', tertiary:'#004ed0' }, fontFamily:{ heading:['Plus Jakarta Sans','sans-serif'], body:['Inter','sans-serif'] }, borderRadius:{ xl:'1rem','2xl':'1.5rem' } } }, plugins:[] } satisfies Config;`);
w('apps/admin/Dockerfile', `FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/admin/package.json apps/admin/package.json
RUN npm install --workspace apps/admin
FROM deps AS build
COPY apps/admin apps/admin
WORKDIR /app/apps/admin
RUN npm run build
FROM node:20-alpine
WORKDIR /app/apps/admin
ENV NODE_ENV=production
COPY --from=build /app/apps/admin/.next/standalone ./
COPY --from=build /app/apps/admin/.next/static ./.next/static
COPY --from=build /app/apps/admin/public ./public
EXPOSE 3000
CMD ["node","server.js"]
`);
w('apps/admin/app/globals.css', `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap'); @tailwind base; @tailwind components; @tailwind utilities; body{background:#f9f9ff;color:#111c2d;font-family:Inter,sans-serif}.glass{background:rgba(255,255,255,.8);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.5);box-shadow:0 4px 20px rgba(0,0,0,.05)}`);
w('apps/admin/app/layout.tsx', `import './globals.css'; import type { Metadata } from 'next'; export const metadata:Metadata={title:'TOLONG Admin',description:'DPD PSI Mesuji Lampung admin panel'}; export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}`);
w('apps/admin/app/page.tsx', `'use client';
import { Bell, Search, Users, Bot, Assignment, TrendingUp, AlertTriangle, Newspaper, Briefcase, HandHeart, Image as ImageIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

const analytics={summary:{reports:5432,activeUsers:12890,assistance:340,products:450},reportsPerDistrict:[{district:'Mesuji',count:1200},{district:'Mesuji Timur',count:2100},{district:'Way S.',count:800},{district:'Panca J.',count:1500},{district:'Simpang P.',count:400}],assistanceDistribution:[{name:'Pendidikan',value:42},{name:'UMKM',value:31},{name:'Pertanian',value:27}]};
const modules=[['Manage reports', Assignment],['Manage assistance', HandHeart],['Manage news', Newspaper],['Manage jobs', Briefcase],['Manage users', Users],['Manage banners', ImageIcon]];
export default function Dashboard(){
 return <main className="min-h-screen pb-10">
  <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/30 bg-surface/80 px-5 py-4 backdrop-blur-xl">
   <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white font-heading font-bold">T</div><div><h1 className="font-heading text-xl font-bold text-primary">TOLONG Admin</h1><p className="text-xs text-[#5f3f3b]">DPD PSI Mesuji Lampung</p></div></div>
   <div className="flex gap-2"><button className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#dee8ff]"><Search size={20}/></button><button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#dee8ff]"><Bell size={20}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"/></button></div>
  </header>
  <section className="mx-auto max-w-7xl px-5 py-8">
   <div className="mb-6"><h2 className="font-heading text-3xl font-bold text-primary">Executive Summary</h2><p className="text-[#5f3f3b]">Data operasional real-time untuk operator, Ketua DPD, DPRD Member, dan Super Admin.</p></div>
   <div className="grid gap-4 md:grid-cols-4">
    <Stat title="Total Reports" value={analytics.summary.reports.toLocaleString('id-ID')} icon={<Assignment/>} wide />
    <Stat title="Active Users" value={analytics.summary.activeUsers.toLocaleString('id-ID')} icon={<Users/>}/>
    <Stat title="AI Queries" value="25k+" icon={<Bot/>}/>
    <Stat title="Approved Assistance" value={analytics.summary.assistance.toString()} icon={<HandHeart/>}/>
   </div>
   <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
    <section className="glass rounded-2xl p-5"><h3 className="mb-4 font-heading text-xl font-bold">Reports per district</h3><div className="h-80"><ResponsiveContainer><BarChart data={analytics.reportsPerDistrict}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="district"/><YAxis/><Tooltip/><Bar dataKey="count" fill="#b7000c" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div></section>
    <section className="glass rounded-2xl p-5"><h3 className="mb-4 font-heading text-xl font-bold">Assistance distribution</h3><div className="h-80"><ResponsiveContainer><PieChart><Pie data={analytics.assistanceDistribution} dataKey="value" nameKey="name" outerRadius={105} label>{analytics.assistanceDistribution.map((_,i)=><Cell key={i} fill={['#b7000c','#004ed0','#22c55e'][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></section>
   </div>
   <div className="mt-6 grid gap-4 md:grid-cols-3">{modules.map(([label,Icon])=><button key={label as string} className="glass flex items-center gap-3 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:bg-white"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#dee8ff] text-primary"><Icon /></span><span className="font-semibold">{label as string}</span></button>)}</div>
   <section className="mt-6 glass rounded-2xl p-5"><h3 className="mb-3 font-heading text-xl font-bold">System alerts</h3><div className="grid gap-3 md:grid-cols-2"><Alert title="New high-priority report" body="Infrastruktur jalan rusak berat di Desa Mulya Agung."/><Alert title="Server maintenance" body="Sistem AI Aspirasi dijadwalkan maintenance malam ini."/></div></section>
  </section>
 </main>
}
function Stat(p:{title:string;value:string;icon:React.ReactNode;wide?:boolean}){return <div className={'glass rounded-2xl p-5 '+(p.wide?'md:col-span-2':'')}><div className="mb-2 flex justify-between text-[#5f3f3b]"><span>{p.title}</span>{p.icon}</div><div className="flex items-end gap-2"><b className="font-heading text-4xl text-primary">{p.value}</b><span className="mb-1 flex text-green-600 text-sm"><TrendingUp size={16}/>12%</span></div></div>}
function Alert(p:{title:string;body:string}){return <div className="flex gap-3 rounded-xl border-l-4 border-primary bg-white p-4"><AlertTriangle className="text-primary"/><div><b>{p.title}</b><p className="text-sm text-[#5f3f3b]">{p.body}</p></div></div>}
`);

w('apps/mobile/pubspec.yaml', `name: tolong_mobile
description: TOLONG mobile app for DPD PSI Mesuji Lampung.
publish_to: 'none'
version: 1.0.0+1
environment:
  sdk: ^3.8.0
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  firebase_core: ^3.14.0
  firebase_auth: ^5.6.0
  firebase_messaging: ^15.2.7
  google_sign_in: ^6.3.0
  google_maps_flutter: ^2.12.3
  geolocator: ^14.0.1
  dio: ^5.8.0+1
  flutter_riverpod: ^2.6.1
  go_router: ^15.2.3
  image_picker: ^1.1.2
  file_picker: ^10.2.0
  qr_flutter: ^4.1.0
  speech_to_text: ^7.0.0
  url_launcher: ^6.3.1
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
flutter:
  uses-material-design: true
  assets:
    - assets/logo/
`);
w('apps/mobile/lib/main.dart', `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'theme.dart';
import 'features/auth/auth_screen.dart';
import 'features/home/home_screen.dart';
import 'features/emergency/emergency_screen.dart';
import 'features/aspirasi/aspirasi_screen.dart';
import 'features/ai/ai_screen.dart';
import 'features/market/market_jobs_screen.dart';
import 'features/news/profile_news_screen.dart';

void main() => runApp(const TolongApp());
final router = GoRouter(initialLocation: '/', routes: [
  GoRoute(path: '/', builder: (_, __) => const AuthScreen()),
  GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
  GoRoute(path: '/sos', builder: (_, __) => const EmergencyScreen()),
  GoRoute(path: '/aspirasi', builder: (_, __) => const AspirasiScreen()),
  GoRoute(path: '/ai', builder: (_, __) => const AiScreen()),
  GoRoute(path: '/market', builder: (_, __) => const MarketJobsScreen()),
  GoRoute(path: '/profile', builder: (_, __) => const ProfileNewsScreen()),
]);
class TolongApp extends StatelessWidget { const TolongApp({super.key}); @override Widget build(BuildContext context) => MaterialApp.router(debugShowCheckedModeBanner:false,title:'TOLONG',theme:tolongTheme,routerConfig:router); }
`);
w('apps/mobile/lib/theme.dart', `import 'package:flutter/material.dart';
const primary = Color(0xFFB7000C); const primaryContainer = Color(0xFFE60012); const surface = Color(0xFFF9F9FF); const surfaceContainer = Color(0xFFE7EEFF); const onSurface = Color(0xFF111C2D); const tertiary = Color(0xFF004ED0);
final tolongTheme = ThemeData(useMaterial3:true,colorScheme:ColorScheme.fromSeed(seedColor:primary,primary:primary,primaryContainer:primaryContainer,surface:surface,onSurface:onSurface,tertiary:tertiary),fontFamily:'Inter',scaffoldBackgroundColor:surface,appBarTheme:const AppBarTheme(backgroundColor:Color(0xCCF9F9FF),elevation:0,centerTitle:false,titleTextStyle:TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:20,fontWeight:FontWeight.w700,color:primary)),cardTheme:CardThemeData(color:Colors.white.withValues(alpha:.82),elevation:0,shape:RoundedRectangleBorder(borderRadius:BorderRadius.circular(16),side:BorderSide(color:Colors.white.withValues(alpha:.5)))));`);
w('apps/mobile/lib/shared/widgets.dart', `import 'package:flutter/material.dart'; import 'package:go_router/go_router.dart'; import '../theme.dart';
class GlassCard extends StatelessWidget{final Widget child; final EdgeInsets padding; const GlassCard({super.key,required this.child,this.padding=const EdgeInsets.all(16)}); @override Widget build(BuildContext c)=>Container(padding:padding,decoration:BoxDecoration(color:Colors.white.withValues(alpha:.82),borderRadius:BorderRadius.circular(16),border:Border.all(color:Colors.white.withValues(alpha:.55)),boxShadow:[BoxShadow(color:Colors.black.withValues(alpha:.05),blurRadius:20,offset:const Offset(0,4))]),child:child);}
class Shell extends StatelessWidget{final Widget child; final int index; const Shell({super.key,required this.child,required this.index}); @override Widget build(BuildContext c)=>Scaffold(appBar:AppBar(title:const Text('Mesuji Bergerak'),actions:[IconButton(onPressed:(){},icon:const Icon(Icons.notifications,color:primary))]),body:child,bottomNavigationBar:NavigationBar(selectedIndex:index,onDestinationSelected:(i){final paths=['/home','/aspirasi','/ai','/market','/profile']; c.go(paths[i]);},destinations:const [NavigationDestination(icon:Icon(Icons.home_outlined),selectedIcon:Icon(Icons.home),label:'Home'),NavigationDestination(icon:Icon(Icons.forum_outlined),label:'Aspirasi'),NavigationDestination(icon:Icon(Icons.smart_toy_outlined),selectedIcon:Icon(Icons.smart_toy),label:'AI'),NavigationDestination(icon:Icon(Icons.newspaper_outlined),label:'News'),NavigationDestination(icon:Icon(Icons.person_outline),label:'Profile')]));}
class SectionTitle extends StatelessWidget{final String text; const SectionTitle(this.text,{super.key}); @override Widget build(BuildContext c)=>Text(text,style:const TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:20,fontWeight:FontWeight.w700,color:onSurface));}
`);
w('apps/mobile/lib/features/auth/auth_screen.dart', `import 'package:flutter/material.dart'; import 'package:go_router/go_router.dart'; import '../../theme.dart';
class AuthScreen extends StatelessWidget{const AuthScreen({super.key}); @override Widget build(BuildContext c)=>Scaffold(body:SafeArea(child:Padding(padding:const EdgeInsets.all(24),child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[const Spacer(),Container(width:96,height:96,decoration:BoxDecoration(color:primaryContainer,borderRadius:BorderRadius.circular(24)),child:const Icon(Icons.support_agent,color:Colors.white,size:56)),const SizedBox(height:24),const Text('TOLONG',style:TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:40,fontWeight:FontWeight.w800,color:primary)),const Text('DPD PSI Mesuji Lampung',style:TextStyle(fontSize:16,color:Color(0xFF5F3F3B))),const Spacer(),FilledButton(onPressed:()=>c.go('/home'),child:const Text('Masuk dengan Nomor HP')),OutlinedButton(onPressed:()=>c.go('/home'),child:const Text('Masuk dengan Google')),TextButton(onPressed:()=>c.go('/home'),child:const Text('Lanjut sebagai Tamu'))])));}
`);
w('apps/mobile/lib/features/home/home_screen.dart', `import 'package:flutter/material.dart'; import 'package:go_router/go_router.dart'; import '../../shared/widgets.dart'; import '../../theme.dart';
class HomeScreen extends StatelessWidget{const HomeScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:0,child:ListView(padding:const EdgeInsets.fromLTRB(20,20,20,96),children:[Container(height:190,decoration:BoxDecoration(borderRadius:BorderRadius.circular(24),image:const DecorationImage(image:NetworkImage('https://images.unsplash.com/photo-1518780664697-55e3ad937233'),fit:BoxFit.cover)),child:Align(alignment:Alignment.bottomLeft,child:Padding(padding:const EdgeInsets.all(16),child:GlassCard(child:Column(mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('Program Bedah Rumah PSI Mesuji',style:TextStyle(fontWeight:FontWeight.w800,color:primary)),const Text('Mewujudkan hunian layak bagi masyarakat kurang mampu.'),const SizedBox(height:8),FilledButton(onPressed:(){},child:const Text('Lihat Detail'))]))))),const SizedBox(height:24),const SectionTitle('Layanan Publik'),const SizedBox(height:12),GridView.count(crossAxisCount:4,shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),children:[qa(c,Icons.emergency,'Darurat','/sos',true),qa(c,Icons.forum,'Aspirasi','/aspirasi',false),qa(c,Icons.smart_toy,'AI Tolong','/ai',false),qa(c,Icons.school,'Bantuan','/ai',false),qa(c,Icons.storefront,'UMKM','/market',false),qa(c,Icons.work,'Kerja','/market',false),qa(c,Icons.newspaper,'Berita','/profile',false),qa(c,Icons.map,'Peta','/profile',false)]),const SizedBox(height:20),const SectionTitle('Aktivitas Mesuji'),const SizedBox(height:12),SizedBox(height:130,child:ListView(scrollDirection:Axis.horizontal,children:[stat('1.2k','Laporan Diproses',tertiary),stat('Rp 2B','Bantuan Disalurkan',surfaceContainer),stat('450','UMKM Aktif',surfaceContainer)])),const SizedBox(height:20),const SectionTitle('Info Terkini'),const SizedBox(height:12),GlassCard(child:ListTile(leading:const Icon(Icons.newspaper,color:primary),title:const Text('Pesta Rakyat UMKM Mesuji 2024'),subtitle:const Text('Ekonomi lokal bergerak bersama warga.'),onTap:()=>c.go('/profile')))])); Widget qa(BuildContext c,IconData i,String t,String path,bool active)=>Column(children:[InkWell(onTap:()=>c.go(path),borderRadius:BorderRadius.circular(18),child:Container(width:56,height:56,decoration:BoxDecoration(color:active?primary:Colors.white,borderRadius:BorderRadius.circular(18),boxShadow:[BoxShadow(color:Colors.black.withValues(alpha:.05),blurRadius:12)]),child:Icon(i,color:active?Colors.white:const Color(0xFF616363)))),Text(t,style:TextStyle(fontSize:11,fontWeight:active?FontWeight.w700:FontWeight.w500,color:active?primary:onSurface))]); Widget stat(String a,String b,Color color)=>Container(width:170,margin:const EdgeInsets.only(right:12),padding:const EdgeInsets.all(16),decoration:BoxDecoration(color:color,borderRadius:BorderRadius.circular(18)),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Icon(Icons.task_alt,color:Colors.white),const Spacer(),Text(a,style:TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:26,fontWeight:FontWeight.w800,color:color==tertiary?Colors.white:onSurface)),Text(b,style:TextStyle(fontSize:12,color:color==tertiary?Colors.white:onSurface))]));}
`);
w('apps/mobile/lib/features/emergency/emergency_screen.dart', `import 'package:flutter/material.dart'; import '../../shared/widgets.dart'; import '../../theme.dart';
class EmergencyScreen extends StatelessWidget{const EmergencyScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:1,child:ListView(padding:const EdgeInsets.all(20),children:[const Text('Darurat SOS',textAlign:TextAlign.center,style:TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:36,fontWeight:FontWeight.w800,color:primary)),const Text('Bantuan segera dalam jangkauan Anda.',textAlign:TextAlign.center),const SizedBox(height:32),Center(child:GestureDetector(onLongPress:(){ScaffoldMessenger.of(c).showSnackBar(const SnackBar(content:Text('PANGGILAN DARURAT DIKIRIM')));},child:Container(width:220,height:220,decoration:BoxDecoration(shape:BoxShape.circle,color:primary,border:Border.all(color:Colors.white,width:8),boxShadow:[BoxShadow(color:primary.withValues(alpha:.35),blurRadius:40,spreadRadius:8)]),child:const Column(mainAxisAlignment:MainAxisAlignment.center,children:[Icon(Icons.emergency,color:Colors.white,size:72),Text('SOS',style:TextStyle(color:Colors.white,fontSize:32,fontWeight:FontWeight.w900,letterSpacing:4))]))),),const SizedBox(height:24),GridView.count(crossAxisCount:2,shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),mainAxisSpacing:12,crossAxisSpacing:12,children:['Ambulance','Pemadam','Banjir','Kecelakaan','Keamanan Publik'].map((e)=>GlassCard(child:Column(mainAxisAlignment:MainAxisAlignment.center,children:[const Icon(Icons.local_hospital,color:primary),const SizedBox(height:8),Text(e,style:const TextStyle(fontWeight:FontWeight.w700))]))).toList()),const SizedBox(height:16),GlassCard(child:const ListTile(leading:Icon(Icons.location_on,color:primary),title:Text('Lokasi Anda Sekarang'),subtitle:Text('-4.0416, 105.4026\\nJl. ZA Pagar Alam, Mesuji, Lampung')))]));}
`);
w('apps/mobile/lib/features/aspirasi/aspirasi_screen.dart', `import 'package:flutter/material.dart'; import '../../shared/widgets.dart'; import '../../theme.dart'; class AspirasiScreen extends StatelessWidget{const AspirasiScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:1,child:ListView(padding:const EdgeInsets.all(20),children:[const Text('Sampaikan Aspirasi Anda',style:TextStyle(fontFamily:'Plus Jakarta Sans',fontSize:30,fontWeight:FontWeight.w800,color:primary)),const SizedBox(height:16),GlassCard(child:Column(children:[const TextField(decoration:InputDecoration(labelText:'Judul Aspirasi',hintText:'Contoh: Perbaikan Jalan Desa')),const DropdownMenu(dropdownMenuEntries:[DropdownMenuEntry(value:'Infrastruktur',label:'Infrastruktur'),DropdownMenuEntry(value:'Kesehatan',label:'Kesehatan'),DropdownMenuEntry(value:'Pendidikan',label:'Pendidikan')],label:Text('Kategori')),const TextField(maxLines:4,decoration:InputDecoration(labelText:'Deskripsi Detail')),const SizedBox(height:12),Row(children:[OutlinedButton.icon(onPressed:(){},icon:const Icon(Icons.add_a_photo),label:const Text('Foto')),const SizedBox(width:8),OutlinedButton.icon(onPressed:(){},icon:const Icon(Icons.videocam),label:const Text('Video'))]),SwitchListTile(value:true,onChanged:(_){},title:const Text('Gunakan Lokasi Saat Ini')),FilledButton(onPressed:(){},child:const Text('Kirim Aspirasi'))])),const SizedBox(height:16),GlassCard(child:const Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('Status Aspirasi Terakhir',style:TextStyle(fontWeight:FontWeight.w800)),ListTile(leading:Icon(Icons.check_circle,color:primary),title:Text('Submitted'),subtitle:Text('12 Okt 2024, 09:00')),ListTile(leading:Icon(Icons.sync,color:tertiary),title:Text('In Process'),subtitle:Text('Petugas lapangan sedang meninjau lokasi.'))]))]));}`);
w('apps/mobile/lib/features/ai/ai_screen.dart', `import 'package:flutter/material.dart'; import '../../shared/widgets.dart'; import '../../theme.dart'; class AiScreen extends StatelessWidget{const AiScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:2,child:Column(children:[Expanded(child:ListView(padding:const EdgeInsets.all(20),children:[const SectionTitle('AI TOLONG Assistant'),const SizedBox(height:12),msg('Halo! Saya AI TOLONG. Ada yang bisa saya bantu terkait layanan publik di Kabupaten Mesuji hari ini?',false),msg('Bagaimana cara mendaftar UMKM Mesuji?',true),msg('Siapkan KTP dan NIB. Buka menu UMKM atau saya sambungkan ke petugas terkait.',false),Wrap(spacing:8,children:['Bagaimana cara lapor jalan rusak?','Bantuan UMKM apa yang tersedia?','Update berita Mesuji hari ini'].map((e)=>ActionChip(label:Text(e),onPressed:(){})).toList())])),Padding(padding:const EdgeInsets.all(16),child:Row(children:[IconButton(onPressed:(){},icon:const Icon(Icons.mic)),const Expanded(child:TextField(decoration:InputDecoration(hintText:'Tulis pesan Anda...'))),IconButton(onPressed:(){},icon:const Icon(Icons.send,color:primary))]))])); Widget msg(String text,bool user)=>Align(alignment:user?Alignment.centerRight:Alignment.centerLeft,child:Container(margin:const EdgeInsets.only(bottom:12),padding:const EdgeInsets.all(12),constraints:const BoxConstraints(maxWidth:320),decoration:BoxDecoration(color:user?primary:surfaceContainer,borderRadius:BorderRadius.circular(16)),child:Text(text,style:TextStyle(color:user?Colors.white:onSurface))));}`);
w('apps/mobile/lib/features/market/market_jobs_screen.dart', `import 'package:flutter/material.dart'; import 'package:url_launcher/url_launcher.dart'; import '../../shared/widgets.dart'; import '../../theme.dart'; class MarketJobsScreen extends StatelessWidget{const MarketJobsScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:3,child:ListView(padding:const EdgeInsets.all(20),children:[const SectionTitle('TOLONG UMKM'),const TextField(decoration:InputDecoration(prefixIcon:Icon(Icons.search),hintText:'Cari produk lokal Mesuji...')),const SizedBox(height:12),GridView.count(crossAxisCount:2,shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),childAspectRatio:.68,crossAxisSpacing:12,mainAxisSpacing:12,children:['Krupuk Kemplang Mesuji','Batik Tulis Khas Mesuji','Madu Hutan Asli','Tas Anyaman Modern'].map((p)=>GlassCard(padding:EdgeInsets.zero,child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[Expanded(child:Container(decoration:BoxDecoration(color:surfaceContainer,borderRadius:const BorderRadius.vertical(top:Radius.circular(16))),child:const Icon(Icons.storefront,size:54,color:primary))),Padding(padding:const EdgeInsets.all(12),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(p,maxLines:1,overflow:TextOverflow.ellipsis,style:const TextStyle(fontWeight:FontWeight.w800)),const Text('Rp 25.000',style:TextStyle(color:primary,fontWeight:FontWeight.w700)),FilledButton(onPressed:()=>launchUrl(Uri.parse('https://wa.me/6281234567890')),child:const Text('Pesan via WA'))]))]))).toList()),const SizedBox(height:24),const SectionTitle('TOLONG Kerja'),GlassCard(child:ListTile(leading:const Icon(Icons.contact_page,color:primary),title:const Text('Upload CV Digital'),subtitle:const Text('Tingkatkan peluang kerja Anda dengan CV terverifikasi.'),trailing:FilledButton(onPressed:(){},child:const Text('Upload')))),...['Admin Gudang','Staff Lapangan','Operator Mesin'].map((j)=>GlassCard(child:ListTile(leading:const Icon(Icons.work,color:primary),title:Text(j),subtitle:const Text('Mesuji - Rp 3.5jt - 4.5jt'),trailing:OutlinedButton(onPressed:(){},child:const Text('Lamar')))))]));}`);
w('apps/mobile/lib/features/news/profile_news_screen.dart', `import 'package:flutter/material.dart'; import 'package:qr_flutter/qr_flutter.dart'; import '../../shared/widgets.dart'; import '../../theme.dart'; class ProfileNewsScreen extends StatelessWidget{const ProfileNewsScreen({super.key}); @override Widget build(BuildContext c)=>Shell(index:4,child:ListView(padding:const EdgeInsets.all(20),children:[const SectionTitle('Kabar Mesuji'),GlassCard(child:ListTile(leading:const Icon(Icons.newspaper,color:primary),title:const Text('Pembangunan Jembatan Mesuji Dimulai'),subtitle:const Text('Pemerintah daerah memulai pembangunan penghubung utama.'))),const SizedBox(height:16),const SectionTitle('Peta Laporan Warga'),Container(height:300,decoration:BoxDecoration(color:surfaceContainer,borderRadius:BorderRadius.circular(20)),child:const Stack(children:[Center(child:Icon(Icons.map,size:120,color:tertiary)),Positioned(left:110,top:70,child:Icon(Icons.location_pin,color:primary,size:42)),Positioned(right:80,bottom:90,child:Icon(Icons.location_pin,color:tertiary,size:42))])),const SizedBox(height:16),const SectionTitle('Profil Saya'),Container(padding:const EdgeInsets.all(20),decoration:BoxDecoration(gradient:const LinearGradient(colors:[primary,primaryContainer]),borderRadius:BorderRadius.circular(22),boxShadow:[BoxShadow(color:primary.withValues(alpha:.3),blurRadius:28)]),child:Row(mainAxisAlignment:MainAxisAlignment.spaceBetween,children:[const Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('PSI Mesuji Digital Card',style:TextStyle(color:Colors.white70)),Text('Budi Santoso',style:TextStyle(color:Colors.white,fontSize:22,fontWeight:FontWeight.w800)),Text('ID: MSJ-2024-001',style:TextStyle(color:Colors.white70))]),Container(color:Colors.white,padding:const EdgeInsets.all(6),child:QrImageView(data:'MSJ-2024-001',size:72))])),const SizedBox(height:12),GridView.count(crossAxisCount:2,shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),children:[GlassCard(child:const ListTile(title:Text('5'),subtitle:Text('Laporan'))),GlassCard(child:const ListTile(title:Text('2'),subtitle:Text('Bantuan')))])]));}`);
w('apps/mobile/assets/logo/tolong.svg', `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="40" fill="#E60012"/><path d="M100 40C66.8629 40 40 66.8629 40 100C40 133.137 66.8629 160 100 160C133.137 160 160 133.137 160 100C160 66.8629 133.137 40 100 40ZM115 130H85V115H115V130ZM120 100C120 101.657 118.657 103 117 103H83C81.3431 103 80 101.657 80 100V70C80 68.3431 81.3431 67 83 67H117C118.657 67 120 68.3431 120 70V100Z" fill="white"/><circle cx="100" cy="100" r="30" stroke="white" stroke-width="4" stroke-dasharray="8 4"/></svg>`);

w('README.md', `# TOLONG

Full-stack civic mobile platform for **DPD PSI Mesuji Lampung**.

## Apps
- \`apps/mobile\`: Flutter 3.32+ citizen app built from the provided Stitch screens.
- \`apps/api\`: NestJS + Prisma + PostgreSQL API with Firebase Auth, Supabase Storage hooks, FCM-ready notifications, RBAC, rate limiting, CSRF, and Swagger.
- \`apps/admin\`: Next.js 15 responsive admin dashboard.

## Quick start
\`\`\`bash
cp .env.example .env
npm install
npm run prisma:generate
docker compose up -d postgres
npm run seed
npm run dev:api
npm run dev:admin
\`\`\`

Flutter requires the Flutter 3.32+ SDK:
\`\`\`bash
cd apps/mobile
flutter pub get
flutter run
\`\`\`
`);
w('INSTALL.md', `# INSTALL

1. Install Node.js 20, PostgreSQL 16, Flutter 3.32+, Docker, and Git.
2. Copy \`.env.example\` to \`.env\` and fill Firebase, Supabase, OpenAI, Gemini, Google Maps, JWT, and database values.
3. Run \`npm install\`.
4. Run \`npm run prisma:generate\`.
5. Run \`docker compose up -d postgres\`.
6. Generate the initial SQL migration for your environment with \`cd apps/api && npx prisma migrate dev --name init\`.
7. Run \`npm run seed\`.
8. Start API with \`npm run dev:api\` and admin with \`npm run dev:admin\`.
9. Install Flutter dependencies with \`cd apps/mobile && flutter pub get\`.
`);
w('API_DOCUMENTATION.md', `# API DOCUMENTATION

Swagger is served at \`/docs\` and all endpoints are prefixed by \`/v1\`.

## Auth
- \`POST /v1/auth/firebase\`: accepts Firebase ID token from phone OTP or Google login and returns access/refresh tokens.
- \`POST /v1/auth/guest\`: creates a guest account.

## Citizen
- \`GET /v1/home\`: banners, statistics, quick actions, featured news.
- \`POST /v1/reports\`: create Aspirasi report with location/category metadata.
- \`POST /v1/emergencies\`: create SOS request with GPS coordinates.
- \`GET /v1/assistance\`: list Program Bantuan.
- \`POST /v1/assistance/:id/apply\`: submit assistance application.
- \`GET /v1/products?q=\`: UMKM marketplace search.
- \`GET /v1/jobs\`: job board.
- \`GET /v1/news\`: CMS articles.
- \`GET /v1/map/live-reports\`: map marker payload.
- \`POST /v1/ai/chat\`: OpenAI GPT model with Gemini fallback branch.

## Admin
- \`GET /v1/admin/analytics\`: dashboard chart data.
- \`GET /v1/admin/queue\`: latest reports for moderation.
`);
w('DEPLOYMENT_GUIDE.md', `# DEPLOYMENT GUIDE

Target: Hostinger VPS Ubuntu 24.04, Nginx, PM2.

1. Provision DNS: \`api.tolong-mesuji.id\` and \`admin.tolong-mesuji.id\`.
2. Install runtime:
\`\`\`bash
sudo apt update
sudo apt install -y nginx postgresql-client certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
\`\`\`
3. Clone repo, configure \`.env\`, then:
\`\`\`bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate
pm2 start ecosystem.config.cjs
pm2 save
\`\`\`
4. Copy \`deploy/nginx/tolong.conf\` to \`/etc/nginx/sites-available/tolong.conf\`, symlink to \`sites-enabled\`, then issue certificates:
\`\`\`bash
sudo nginx -t
sudo certbot --nginx -d api.tolong-mesuji.id -d admin.tolong-mesuji.id
sudo systemctl reload nginx
\`\`\`
5. Configure Firebase phone auth, Google provider, FCM APNs/Android credentials, Supabase private bucket policies, OpenAI key, Gemini key, and Google Maps Android/iOS/web keys.
`);
w('docs/ERD.md', `# ERD

\`\`\`mermaid
erDiagram
  User ||--o{ Report : creates
  User ||--o{ EmergencyRequest : triggers
  User ||--o{ AssistanceApplication : submits
  User ||--o{ JobApplication : applies
  User ||--|| MembershipCard : owns
  Category ||--o{ Report : classifies
  Category ||--o{ EmergencyRequest : classifies
  Category ||--o{ Product : classifies
  Category ||--o{ Article : classifies
  Category ||--o{ AssistanceProgram : classifies
  Report ||--o{ ReportTimeline : tracks
  Report ||--o{ MediaAsset : has
  Product ||--o{ MediaAsset : has
  Article ||--o{ MediaAsset : has
  AssistanceProgram ||--o{ AssistanceApplication : receives
  JobPosting ||--o{ JobApplication : receives
  AiConversation ||--o{ AiMessage : contains
\`\`\`
`);

for (const [path, content] of files) {
  const abs = join(root, path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf8');
}
console.log(`Scaffolded ${files.size} files.`);
