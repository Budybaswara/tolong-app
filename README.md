# TOLONG

Full-stack civic mobile platform for **DPD PSI Mesuji Lampung**.

## Stack

- Mobile: Flutter 3.32+, Dart, Firebase Auth, FCM, Google Maps
- API: NestJS, TypeScript, Prisma, PostgreSQL, Firebase Admin, Supabase Storage, OpenAI, Gemini fallback
- Admin: Next.js 15, React 19, Recharts, Tailwind CSS
- Deployment: Docker/Dokploy, Hostinger VPS Ubuntu 24.04, Nginx, optional PM2

## Apps

- `apps/mobile`: Flutter citizen app built from the provided Stitch screens.
- `apps/api`: NestJS API with feature modules, Prisma schema, migrations, Swagger, rate limiting, JWT refresh tokens, Firebase Auth verification, Supabase signed upload, AI chat, reports, SOS, assistance, UMKM, jobs, news, map, membership, notifications, and admin analytics.
- `apps/admin`: responsive web admin dashboard for Super Admin, Ketua DPD, Operator, and DPRD Member workflows.

## Quick Start

```bash
cp .env.example .env
npm install
npm run prisma:generate
docker compose up -d postgres
npm run seed
npm run dev:api
npm run dev:admin
```

Open:

- API Swagger: `http://localhost:3001/docs`
- API health: `http://localhost:3001/v1/health`
- Admin: `http://localhost:3000`

Flutter:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/v1
```

## Dokploy Backend

The backend is Docker-first. The API container runs Prisma migrations before starting:

```bash
docker compose -f deploy/dokploy/docker-compose.yml up -d --build
```

For Dokploy, set environment variables from `.env.example` in the project settings and expose port `3001` for the API and `3000` for admin.

## Documentation

- [INSTALL.md](INSTALL.md)
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [ERD](docs/ERD.md)
- [Architecture](docs/ARCHITECTURE.md)
