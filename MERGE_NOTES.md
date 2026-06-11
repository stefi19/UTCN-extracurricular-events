# UTCN Events + Hackcontrol Merge Notes

## Architecture

The merged product uses the UTCN Extracurricular Events Platform as the primary shell and canonical login surface. Hackcontrol remains a separate Next.js service for the hackathon domain because it already contains substantial working functionality: Prisma models, tRPC APIs, team submissions, judges, scoring criteria, winner selection, and Next.js pages.

This is a service integration, not an iframe and not a full data-model migration. It is the safest first merge because it preserves existing UTCN event registration behavior and preserves Hackcontrol workflows without rewriting them into Ktor.

## Services

- `backend`: Ktor app, UTCN HTML shell, REST APIs, JWT login, events, registrations, admin tools.
- `notification-service`: RabbitMQ notification consumer.
- `postgres`: UTCN PostgreSQL database with Flyway migrations.
- `rabbitmq`: notification broker.
- `hackcontrol`: Next.js Hackcontrol service exposed on `http://localhost:3000`.
- `hackcontrol-cockroach`: CockroachDB for Hackcontrol's existing Prisma schema.

## Routes Added

- UTCN shell: `/hackathons`
- Hackcontrol public module: `http://localhost:3000`
- Hackcontrol dashboard/module: `http://localhost:3000/app`

The UTCN navigation now includes `Hackathons`. Guests can open the public Hackcontrol listing. Logged-in users carry the UTCN `auth_token` cookie into Hackcontrol on localhost.

## Authentication Bridge

UTCN remains the canonical auth system:

- Cookie: `auth_token`
- Token type: HMAC SHA-256 JWT
- Secret shared with Hackcontrol through `UTCN_JWT_SECRET`

Hackcontrol still supports its existing NextAuth GitHub OAuth flow, but its server session lookup now falls back to the UTCN JWT cookie. When a UTCN user enters Hackcontrol, Hackcontrol verifies the cookie, maps the role, and upserts a local Hackcontrol user for Prisma relations.

Role mapping:

- UTCN `STUDENT` -> Hackcontrol `USER` / Participant
- UTCN `ORGANIZER` -> Hackcontrol `ORGANIZER`
- UTCN `ADMIN` -> Hackcontrol `ADMIN`

## Databases

Databases are intentionally separate in this pass:

- UTCN data stays in PostgreSQL and Flyway migrations.
- Hackcontrol data stays in CockroachDB and Prisma migrations.

Consolidating schemas would require a separate migration design for hackathons, teams, submissions, judges, criteria, scores, NextAuth accounts, and UTCN users. That is higher risk than the current service boundary.

## How to Run

From `project-stefi19`:

```bash
docker compose up --build
```

Open:

- UTCN app: `http://localhost:8080`
- Hackcontrol module: `http://localhost:3000`
- CockroachDB UI: `http://localhost:8081`
- Mailhog: `http://localhost:8025`
- RabbitMQ management: `http://localhost:15672`

## Environment Variables

Important local defaults are in `docker-compose.yml`:

- `JWT_SECRET`
- `UTCN_JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `HACKCONTROL_PUBLIC_URL`

For GitHub OAuth in Hackcontrol, set:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

GitHub OAuth is optional for the UTCN JWT bridge, but still required if you want the original Hackcontrol GitHub login flow.

## Limitations and TODOs

- The integration is cross-service. Hackcontrol URLs currently use `localhost:3000`; a production deployment should put both apps behind one reverse proxy and public origin.
- The UTCN JWT bridge upserts Hackcontrol users by email, but does not yet synchronize profile edits after first login beyond role/access updates.
- Hackcontrol still has NextAuth pages for legacy OAuth users. A future pass can remove or hide that login once UTCN-only auth is accepted.
- A future full merge could migrate Hackcontrol schema to PostgreSQL and expose hackathon APIs from Ktor, but that should be handled with dedicated data migrations and regression tests.
