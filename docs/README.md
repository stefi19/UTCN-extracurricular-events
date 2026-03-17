# UTCN Extracurricular Events — Client-Server Application

This repository contains a client-server application for managing extracurricular events at the Technical University of Cluj-Napoca (UTCN).

Project goal
- Provide a platform to create, view, edit and delete extracurricular events (workshops, contests, student activities, etc.).
- Offer user interfaces for students and organizers and an administrative panel for event management.

Planned core features
- REST/GraphQL API for CRUD operations on events.
- Client (web/mobile) for browsing events and registrations.
- Authentication and authorization with roles (student, organizer, admin).
- Filtering and searching by date, category, and department.

Chosen learning stack
- Backend: Kotlin (recommended frameworks: Ktor for a lightweight approach or Spring Boot for a full-featured stack). This project is a great way to learn Kotlin and modern server-side Kotlin tooling.
- Client: Kotlin Multiplatform (optional) or a web frontend (React, Vue, Angular) — choose what you want to learn.
- Database: PostgreSQL (recommended) or MongoDB.

How to get started (high level)
1. Choose the backend framework (Ktor or Spring Boot) and create a new Kotlin project.
2. Define the Event model and implement API endpoints for create/read/update/delete.
3. Add authentication (JWT/session) and role-based access control.
4. Build a simple client to consume the API and show events.

Running locally
Detailed setup and run instructions for the chosen stack will be added once the server and client skeletons are implemented. For now, typical steps will include:

```zsh
# create a Kotlin project (example using Gradle for Ktor)
# curl -s https://start.ktor.io | bash -s -- --engine=netty --group=com.example --artifact=utcnevents

# build
./gradlew build

# run (depends on chosen framework)
./gradlew run
```

Next steps
- Implement a minimal Kotlin server skeleton (Ktor or Spring Boot) with Event CRUD endpoints.
- Create a minimal client (web or Kotlin Multiplatform) to display and create events.
- Add database persistence (PostgreSQL) and basic tests.