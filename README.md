# UTCN Events and Hackathons Platform

A unified platform for UTCN extracurricular events and hackathons.

The product combines:

- UTCN Extracurricular Events Platform: Kotlin/Ktor, PostgreSQL, RabbitMQ, vanilla JavaScript/CSS, JWT auth with an HttpOnly cookie.
- Hackcontrol: embedded Next.js, TypeScript, Prisma, CockroachDB, tRPC, NextAuth, team submissions, judges, scoring, and winner selection.

The UTCN application is the main product shell. Hackcontrol is included in this repository under `./hackcontrol` and runs as the hackathon module. Users enter hackathons from the UTCN navigation through `/hackathons`, then continue into the Hackcontrol service on `http://localhost:3000`.

## Current Architecture

This repository uses a service-based merge. The services run together with Docker Compose, but each domain keeps the framework and database that already worked.

| Service | Path | Technology | Responsibility |
|---|---|---|---|
| `backend` | `./src` | Kotlin/Ktor | UTCN web shell, REST API, auth, events, registrations, admin tools |
| `notification-service` | `./notification-service` | Kotlin | RabbitMQ notification consumer |
| `postgres` | Docker image | PostgreSQL | UTCN users, events, registrations, categories, departments |
| `rabbitmq` | Docker image | RabbitMQ | Async notifications |
| `hackcontrol` | `./hackcontrol` | Next.js/TypeScript/tRPC | Hackathons, teams, submissions, judges, scoring, winners |
| `hackcontrol-cockroach` | Docker image | CockroachDB | Hackcontrol Prisma schema |
| `mailhog` | Docker image | Mailhog | Local email testing |
| `pgadmin` | Docker image | pgAdmin | PostgreSQL inspection |

The merge is intentionally not a full rewrite. Moving all Hackcontrol features into Ktor/PostgreSQL would require a larger schema and API migration. The current integration keeps both feature sets working while presenting them as one product.

## Main User Flows

### Guests

- Open `http://localhost:8080`.
- Browse public UTCN events at `/events`.
- Open `/hackathons` from the navigation.
- View the public Hackcontrol hackathon listing at `http://localhost:3000`.

### Students

- Register or log in through the UTCN platform.
- Browse and register for extracurricular events.
- Join the waiting list automatically when an event reaches its seat limit.
- Track registrations at `/my-registrations`.
- Open `/hackathons` and participate in hackathons.
- Join teams and submit projects through Hackcontrol.

### Organizers

- Log in through the UTCN platform.
- Manage events in `/organizer-panel`.
- Open `/hackathons` and manage hackathons in Hackcontrol.
- Review submissions, announcements, judges, and scoring workflows where permitted.

### Admins

- Manage users, organizers, categories, departments, and stats.
- Manage events and hackathons.
- Access Hackcontrol admin-level hackathon workflows.

## Authentication

UTCN auth is the canonical login system.

- UTCN sets an HttpOnly JWT cookie named `auth_token`.
- Ktor validates this cookie for UTCN API routes.
- Hackcontrol also reads `auth_token` and verifies it with the same JWT secret through `UTCN_JWT_SECRET`.
- If the UTCN cookie is valid, Hackcontrol creates or updates a local Prisma user so existing Hackcontrol relations can work.

Role mapping:

| UTCN role | Hackcontrol role |
|---|---|
| `STUDENT` | `USER` / Participant |
| `ORGANIZER` | `ORGANIZER` |
| `ADMIN` | `ADMIN` |

Hackcontrol still supports GitHub OAuth through NextAuth. This is useful for the original Hackcontrol login flow, but the preferred unified product flow is UTCN login.

## GitHub OAuth Setup

GitHub OAuth is optional for the UTCN JWT bridge, but required if you want the Hackcontrol GitHub button to work.

Create a GitHub OAuth App with:

```text
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

Set either modern names:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

or legacy names:

```bash
GITHUB_ID=...
GITHUB_SECRET=...
```

Hackcontrol accepts both naming styles. If no GitHub credentials are configured, the Hackcontrol `/auth` page shows a UTCN login fallback instead of a broken GitHub login button.

## Routes

### UTCN Shell

| Route | Purpose |
|---|---|
| `/` | Home dashboard, role-aware after login |
| `/events` | Public event list |
| `/my-registrations` | Student registrations |
| `/profile` | User profile |
| `/organizer-panel` | Organizer event management |
| `/admin-dashboard` | Admin stats dashboard |
| `/admin-organizers` | Admin organizer account management |
| `/admin-taxonomy` | Admin categories and departments |
| `/hackathons` | Unified entry point into Hackcontrol |

### UTCN API

| Route | Purpose |
|---|---|
| `/api/auth/register` | Register and set `auth_token` |
| `/api/auth/login` | Log in and set `auth_token` |
| `/api/auth/logout` | Clear `auth_token` |
| `/api/auth/me` | Current authenticated user |
| `/api/auth/profile` | Profile update |
| `/api/events` | Event CRUD/listing |
| `/api/registrations` | Event registrations, waiting list joins, cancellations |
| `/api/categories` | Category management |
| `/api/departments` | Department management |
| `/api/users` | Admin user management |
| `/api/admin/stats` | Admin dashboard stats |

### Hackcontrol

| Route | Purpose |
|---|---|
| `http://localhost:3000` | Public hackathon landing/listing |
| `http://localhost:3000/app` | Hackathon dashboard |
| `http://localhost:3000/app/[url]` | Hackathon management/judging/submission workflow |
| `http://localhost:3000/hackathon/[url]` | Public hackathon page |
| `http://localhost:3000/auth` | NextAuth/GitHub login or UTCN fallback |
| `http://localhost:3000/api/trpc/[trpc]` | Hackcontrol tRPC API |
| `http://localhost:3000/api/utcn/session` | UTCN JWT bridge session endpoint |

## Databases

The product currently uses two databases:

- PostgreSQL for UTCN platform data.
- CockroachDB for Hackcontrol Prisma data.

This keeps the first integrated product stable. A future full merge could migrate Hackcontrol models into PostgreSQL and expose hackathon APIs through Ktor, but that should be done with a dedicated migration plan.

## Prerequisites

- Docker and Docker Compose
- JDK 21 for local backend development
- Node.js 18+ if running Hackcontrol outside Docker

## Run Everything With Docker

From the repository root:

```bash
docker compose up --build
```

Open:

- UTCN app: `http://localhost:8080`
- Hackathons gateway: `http://localhost:8080/hackathons`
- Hackcontrol module: `http://localhost:3000`
- CockroachDB UI: `http://localhost:8081`
- pgAdmin: `http://localhost:5050`
- RabbitMQ management: `http://localhost:15672`
- Mailhog: `http://localhost:8025`

Stop all services:

```bash
docker compose down
```

Remove local database volumes:

```bash
docker compose down -v
```

## Environment Variables

The local Docker Compose file includes development defaults for required internal secrets. Change them for real deployments.

| Variable | Used by | Purpose |
|---|---|---|
| `JWT_SECRET` | UTCN backend | Signs UTCN JWT cookies |
| `UTCN_JWT_SECRET` | Hackcontrol | Verifies UTCN `auth_token` cookie |
| `NEXTAUTH_SECRET` | Hackcontrol | NextAuth secret |
| `NEXTAUTH_URL` | Hackcontrol | Public Hackcontrol origin |
| `DATABASE_URL` | Hackcontrol | CockroachDB Prisma URL |
| `HACKCONTROL_PUBLIC_URL` | UTCN backend | URL used by `/hackathons` links |
| `GITHUB_CLIENT_ID` / `GITHUB_ID` | Hackcontrol | GitHub OAuth client id |
| `GITHUB_CLIENT_SECRET` / `GITHUB_SECRET` | Hackcontrol | GitHub OAuth client secret |
| `SMTP_*` | notification service | Email notification delivery. Docker defaults to Mailhog; override for real SMTP. |
| `REMINDER_HOURS_BEFORE` | notification service | Reminder scheduling |

## Local Development

### UTCN Backend

Run tests:

```bash
./gradlew test
```

Run the backend directly after starting PostgreSQL and RabbitMQ:

```bash
docker compose up -d postgres rabbitmq
./gradlew run
```

### Hackcontrol

Hackcontrol is embedded in `./hackcontrol`.

Install dependencies:

```bash
cd hackcontrol
npm install
```

Type-check:

```bash
npm run ts:check
```

Build:

```bash
SKIP_ENV_VALIDATION=true npm run build
```

Run with Docker Compose from the repository root for the easiest database/auth setup:

```bash
docker compose up --build hackcontrol hackcontrol-cockroach
```

## Validation Checklist

Use this checklist after integration changes:

```bash
./gradlew test
cd hackcontrol && npm install && npm run ts:check
cd hackcontrol && SKIP_ENV_VALIDATION=true npm run build
docker compose config
docker compose up --build -d
curl http://localhost:8080/health
curl http://localhost:8080/hackathons
curl http://localhost:3000/api/auth/providers
```

Expected:

- `/health` returns `{"status":"ok"}`.
- `/hackathons` returns the UTCN-styled hackathon gateway page.
- `http://localhost:3000` serves Hackcontrol.
- `http://localhost:3000/auth` shows GitHub login when GitHub env vars are configured, otherwise a UTCN login fallback.
- Hackcontrol logs show Prisma migrations applied successfully.

## Project Structure

```text
.
├── src/                         UTCN Ktor backend and static frontend
├── notification-service/         RabbitMQ notification consumer
├── hackcontrol/                  Embedded Next.js Hackcontrol service
│   ├── prisma/                   Hackcontrol Prisma schema and migrations
│   ├── src/pages/                Next.js pages and API routes
│   ├── src/trpc/                 tRPC routers and API client
│   └── src/lib/utcn-auth.ts      UTCN JWT bridge
├── docs/README.md                Original detailed UTCN documentation
├── MERGE_NOTES.md                Merge strategy and limitations
├── docker-compose.yml            Unified runtime
└── build.gradle.kts              UTCN backend build
```

## Current Limitations

- Hackcontrol is integrated as a service, not migrated into Ktor.
- UTCN and Hackcontrol data are not stored in one consolidated schema yet.
- The auth bridge synchronizes users by email and role, but not every profile field.
- Local development uses different ports: UTCN on `8080`, Hackcontrol on `3000`.
- A production deployment should put both services behind one reverse proxy and public domain.

## Deeper Future Merge

A future full merge can:

- Move Hackcontrol data models into PostgreSQL.
- Replace tRPC endpoints with Ktor REST endpoints.
- Remove NextAuth if UTCN-only auth becomes the final direction.
- Add a reverse proxy so `/hackathons` and Hackcontrol routes share one origin.
- Add integration tests that cover UTCN login into Hackcontrol participation and organizer workflows.
