# Security Design — tafeito-api

**Date:** 2026-05-21  
**Scope:** HTTPS, HTTP headers, CORS, rate limiting, input validation hardening

---

## Context

NestJS REST API exposed directly to the internet on a VPS. Currently has:
- `ValidationPipe` with `whitelist: true` and `transform: true`
- `class-validator` decorators on DTOs
- JWT auth middleware

Missing: HTTPS, security headers, CORS configuration, rate limiting, input length constraints.

---

## Architecture

### 1. HTTPS — NestJS `httpsOptions` + Let's Encrypt

NestJS reads TLS certificates from Certbot-managed paths directly via `httpsOptions` in `main.ts`. App listens on port 443.

**Certificate acquisition (one-time, on VPS):**
```bash
certbot certonly --standalone -d seudominio.com
```

**`main.ts` changes:**
```typescript
import * as fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

const httpsOptions = isProduction
  ? {
      key: fs.readFileSync(process.env.TLS_KEY_PATH!),
      cert: fs.readFileSync(process.env.TLS_CERT_PATH!),
    }
  : undefined;

const app = await NestFactory.create(AppModule, { httpsOptions });
await app.listen(isProduction ? 443 : 3000);
```

In development (`NODE_ENV` unset or `development`), app runs HTTP on port 3000 as before.

**Environment variables added:**
```
TLS_KEY_PATH=/etc/letsencrypt/live/<domain>/privkey.pem
TLS_CERT_PATH=/etc/letsencrypt/live/<domain>/fullchain.pem
```

**Certificate renewal:**

Certbot deploy hooks stop and restart the app around renewal (brief downtime ~seconds, every 90 days):

```bash
# /etc/letsencrypt/renewal-hooks/pre/stop-tafeito.sh
#!/bin/bash
systemctl stop tafeito-api

# /etc/letsencrypt/renewal-hooks/post/start-tafeito.sh
#!/bin/bash
systemctl start tafeito-api
```

Certbot renewal cron runs automatically via `certbot renew` (installed by default with Certbot).

---

### 2. HTTP Security Headers — Helmet

`@nestjs/helmet` wraps the `helmet` package and applies secure HTTP headers by default:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (modern browsers use CSP instead)
- `Strict-Transport-Security` (forces HTTPS)
- Content Security Policy

Applied globally in `main.ts` before any other middleware:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

**Package:** `npm install helmet`

---

### 3. CORS — Fixed Frontend Origin

API accepts requests only from the frontend domain. Configured via environment variable so domain can change between environments without code changes.

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

**Environment variable added:**
```
FRONTEND_URL=https://seudominio.com.br
```

Any other origin receives a CORS error before hitting any route handler.

---

### 4. Rate Limiting — @nestjs/throttler

Two tiers:

| Tier | Limit | TTL | Applied to |
|------|-------|-----|-----------|
| Global | 100 req | 60s | All routes |
| Auth | 5 req | 60s | `POST /auth/login`, `POST /users` (registration) |

**Module config (`app.module.ts`):**
```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
```

**Guard registered globally (`app.module.ts`):**
```typescript
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

**Auth routes override (`auth.controller.ts`, `users.controller.ts`):**
```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
login() { ... }
```

Returns `429 Too Many Requests` on violation.

**Package:** `npm install @nestjs/throttler`

---

### 5. Input Validation Hardening

#### ValidationPipe

Add `forbidNonWhitelisted: true` to reject requests with unexpected fields:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

#### DTO Constraints

Add `@MaxLength` / `@MinLength` to all string fields across all DTOs. Rules:

| Field | MinLength | MaxLength |
|-------|-----------|-----------|
| `name` | — | 100 |
| `email` | — | 254 (RFC 5321) |
| `password` | 8 | 128 |
| `identification` | — | 50 |
| Generic text fields | — | 500 |
| Comment/description fields | — | 2000 |

**Affected DTOs:**
- `CreateUserDto`, `UpdateUserDto`
- `LoginUserDto`
- `CreateServiceDto` (if string fields present)
- `CreateBudgetRequestDto`, `CancelBudgetRequestDto`
- `CreateProposalDto` (and related)
- `ReviewDto` (comment field)
- `MessageDto` (chat message content)

---

## Files Changed

| File | Change |
|------|--------|
| `src/main.ts` | Add `httpsOptions`, `helmet()`, `enableCors()`, update `ValidationPipe` |
| `src/app.module.ts` | Add `ThrottlerModule`, `APP_GUARD` |
| `src/modules/auth/infra/controllers/auth.controller.ts` | Add `@Throttle` on login |
| `src/modules/users/infra/controllers/users.controller.ts` | Add `@Throttle` on registration |
| `src/modules/users/application/dto/create-user.dto.ts` | Add length constraints |
| `src/modules/auth/application/dto/login-user.dto.ts` | Add length constraints |
| All other DTOs with string fields | Add `@MaxLength` |
| `.env` | Add `TLS_KEY_PATH`, `TLS_CERT_PATH`, `FRONTEND_URL` |

## Packages to Install

```bash
npm install helmet @nestjs/throttler
```

---

## Out of Scope

- CSRF protection (JWT-based API, no cookies with session state — not applicable)
- SQL injection (Drizzle ORM parameterizes all queries — already protected)
- File upload validation (no file upload endpoints currently)
- mTLS / API keys for service-to-service auth
