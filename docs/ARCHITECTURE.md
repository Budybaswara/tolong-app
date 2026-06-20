# Architecture

## Backend

The API uses a feature-based NestJS structure:

- `auth`: Firebase token verification, guest login, JWT, refresh token rotation, FCM token storage.
- `civic`: public app workflows for reports, SOS, assistance, products, jobs, news, map, membership, and notifications.
- `ai`: OpenAI primary provider with Gemini fallback and persisted conversations.
- `storage`: Supabase Storage signed upload URLs.
- `admin`: analytics and management endpoints.
- `core`: Prisma and RBAC utilities.

Data access is isolated behind services that use Prisma. Controllers receive validated DTOs and delegate business logic to services.

## Mobile

The Flutter app is feature-based:

- `features/auth`
- `features/home`
- `features/emergency`
- `features/aspirasi`
- `features/ai`
- `features/assistance`
- `features/market`
- `features/jobs`
- `features/map`
- `features/news`
- `features/notifications`

`core/network` contains the Dio API client. `core/repositories` contains the app repository layer.

## Admin

The Next.js admin dashboard fetches live analytics and report queues from the NestJS API. It is responsive and organized around operational modules: reports, assistance, news, jobs, users, banners, UMKM, and RBAC.

## Security

- Firebase Auth is the identity provider for phone OTP and Google Login.
- Backend issues short-lived JWT access tokens and long-lived refresh tokens.
- Refresh tokens are SHA-256 hashed before storage.
- Nest validation pipes whitelist DTO fields.
- Prisma parameterized queries protect database access.
- Fastify Helmet, CORS, CSRF plugin registration, and rate limiting are enabled.
- RBAC utilities are available for role-protected handlers.
