# Deployment Guide

Target: Hostinger VPS Ubuntu 24.04 with Dokploy, Docker, Nginx, and optional PM2.

## 1. VPS Setup

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
```

Install Dokploy from the official Dokploy installer, then create a project for TOLONG.

## 2. Environment

Copy `.env.example` into Dokploy environment variables and replace all secrets. Use strong 64+ character JWT secrets.

Important values:

```text
DATABASE_URL=postgresql://user:password@host:5432/tolong?schema=public
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.id/v1
CORS_ORIGIN=https://admin.your-domain.id
```

## 3. Deploy With Dokploy

Use:

```text
deploy/dokploy/docker-compose.yml
```

Git repository:

```text
https://github.com/Bankcash2026/tolong-app
```

The API image runs:

```bash
npx prisma migrate deploy && node dist/main.js
```

so database migrations are applied automatically before the API accepts traffic.

## 4. Nginx

Use `deploy/nginx/tolong.conf` as the reverse proxy base.

Expected upstreams:

- API: `127.0.0.1:3001`
- Admin: `127.0.0.1:3000`

## 5. SSL

```bash
sudo certbot --nginx -d api.your-domain.id -d admin.your-domain.id
```

## 6. Verification

```bash
curl https://api.your-domain.id/v1/health
curl https://api.your-domain.id/docs
```

Open admin domain and verify the dashboard loads analytics from `/v1/admin/analytics`.

## 7. PM2 Alternative

Docker is recommended for Dokploy. PM2 config is still provided in `ecosystem.config.cjs` for non-Dokploy VPS setups.
