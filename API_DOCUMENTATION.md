# API Documentation

Swagger is available at `/docs` when the API is running.

Base URL:

```text
http://localhost:3001/v1
```

## Health

- `GET /health` checks NestJS and PostgreSQL connectivity.

## Auth

- `POST /auth/firebase` accepts Firebase ID token from phone OTP or Google Login and returns JWT access/refresh tokens.
- `POST /auth/guest` creates a guest session.
- `POST /auth/refresh` rotates access and refresh tokens.
- `POST /auth/logout` invalidates stored refresh token.
- `POST /auth/fcm-token` stores FCM token for push notifications.

## Citizen App

- `GET /home` returns banners, statistics, quick actions, categories, and news.
- `GET /categories?module=REPORT`
- `GET /reports?status=SUBMITTED&district=Tanjung%20Raya`
- `POST /reports`
- `PATCH /reports/:id/status`
- `POST /media-assets`
- `GET /emergencies`
- `POST /emergencies`
- `PATCH /emergencies/:id/status`
- `GET /assistance`
- `POST /assistance/:id/apply`
- `PATCH /assistance/applications/:id/status`
- `GET /products?q=kemplang&categoryId=PRODUCT-Kuliner`
- `GET /jobs`
- `POST /jobs/:id/apply`
- `PATCH /jobs/applications/:id/status`
- `GET /news?featured=true`
- `GET /map/live-reports`
- `POST /membership`
- `GET /membership/verify/:memberNo`
- `GET /notifications?userId=...`
- `POST /notifications`

## AI

- `POST /ai/chat`

The service uses OpenAI first and falls back to Gemini when OpenAI fails. Conversations and messages are stored in Prisma.

## Storage

- `POST /storage/signed-upload`

Returns a Supabase signed upload URL and public URL for report photos, videos, articles, jobs, products, or profiles.

## Admin

- `GET /admin/analytics`
- `GET /admin/queue`
- `GET /admin/users`
- `PATCH /admin/users/:id/role`
- `PATCH /admin/reports/:id/status`
- `POST /admin/assistance`
- `PATCH /admin/assistance/applications/:id/status`
- `POST /admin/products`
- `POST /admin/jobs`
- `PATCH /admin/jobs/applications/:id/status`
- `POST /admin/news`
- `POST /admin/banners`
- `PATCH /admin/banners/:id/active`
