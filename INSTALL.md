# INSTALL

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- Flutter 3.32+
- PostgreSQL 16 if running without Docker

## Backend + Admin

```bash
cp .env.example .env
npm install
npm run prisma:generate
docker compose up -d postgres
npm run prisma:migrate
npm run seed
npm run dev:api
npm run dev:admin
```

## Mobile

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/v1
```

Use `http://localhost:3001/v1` for iOS simulator and `http://10.0.2.2:3001/v1` for Android emulator.

## Required Runtime Secrets

Set these in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `CORS_ORIGIN`
