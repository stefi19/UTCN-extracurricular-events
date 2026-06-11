# UTCN Extracurricular Events Platform

A full-stack web application for managing extracurricular events at the Technical University of Cluj-Napoca.
Students can browse, register for, and track events. Organizers can create and manage their events. Admins manage users, categories, and departments.
Built with Kotlin and Ktor (backend), vanilla JavaScript and CSS (frontend), backed by PostgreSQL with RabbitMQ for async notifications.

The platform now integrates an embedded Hackcontrol service as the hackathon management module. See `MERGE_NOTES.md` for the merged architecture, auth bridge, Docker services, GitHub OAuth callback URL, and limitations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [How to Run](#how-to-run)
3. [Running Tests](#running-tests)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Microservices](#microservices)
7. [Design Patterns](#design-patterns)
8. [Frontend](#frontend)
9. [Authentication & Security](#authentication--security)
10. [Cookie Policy & Consent](#cookie-policy--consent)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [Request and Response Examples](#request-and-response-examples)
14. [Validation Rules](#validation-rules)
15. [Error Handling](#error-handling)
16. [Postman Screenshots](#postman-screenshots)
17. [Tech Stack](#tech-stack)
18. [Environment Variables](#environment-variables)

---

## Prerequisites

- JDK 17 or higher
- Docker and Docker Compose

## How to Run

```bash
# Start all services (database, RabbitMQ, notification-service, backend)
docker compose up -d

# Open the app
open http://localhost:8080
```

To rebuild after source changes:

```bash
docker compose build backend
docker compose up -d backend
```

To verify the backend is running:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

To stop all services:

```bash
docker compose down
```

### Running locally (without Docker)

```bash
# Start only the database and RabbitMQ
docker compose up -d db rabbitmq

# Build and run the backend
./gradlew run
```

## Running Tests

```bash
./gradlew test
```

The test suite includes unit tests for all service classes, JWT token handling, password hashing, and notification publishing.
It also includes HTTP integration tests using Ktor's `testApplication` for auth and event routes.
Tests use in-memory fake DAOs and a `FakeNotificationPublisher` — no external dependencies required.

## Project Structure

```
src/
  main/kotlin/com/example/
    Application.kt              Ktor plugin setup, routing, HTML page rendering, dependency wiring
    Main.kt                     Entry point (embedded Netty server)
    controller/
      AuthController.kt         /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me, /api/auth/profile
      EventController.kt        /api/events CRUD
      RegistrationController.kt /api/registrations
      CategoryController.kt     /api/categories CRUD (admin)
      DepartmentController.kt   /api/departments CRUD (admin)
      UserController.kt         /api/users (admin)
      AdminStatsController.kt   /api/admin/stats (admin)
    service/
      AuthService.kt            Registration, login, token generation
      EventService.kt           Event CRUD with validation
      RegistrationService.kt    Student registration logic (register, cancel, re-register)
      CategoryService.kt        Category CRUD with validation
      DepartmentService.kt      Department CRUD with validation
      UserService.kt            User listing by role
    messaging/
      NotificationPublisher.kt          Port (interface)
      NotificationMessage.kt            Message DTO
      RabbitMQConnectionFactory.kt      Singleton config (env vars)
      RabbitMQNotificationPublisher.kt  Real adapter (AMQP)
      LogNotificationPublisher.kt       Fallback adapter (logs only)
    db/
      DatabaseFactory.kt        HikariCP pool + Flyway migrations
      dao/
        EventDao.kt / JdbcEventDao.kt
        UserDao.kt / JdbcUserDao.kt
        RegistrationDao.kt / JdbcRegistrationDao.kt
        CategoryDao.kt / JdbcCategoryDao.kt
        DepartmentDao.kt / JdbcDepartmentDao.kt
        ReminderOutboxDao.kt / JdbcReminderOutboxDao.kt
    model/
      Event.kt, User.kt, Registration.kt, Category.kt, Department.kt, ReminderOutboxItem.kt
    dto/
      AuthDtos.kt, EventDtos.kt, RegistrationDtos.kt, AdminDtos.kt, UserDtos.kt, ErrorResponse.kt
    security/
      JwtManager.kt, PasswordUtil.kt, AuthorizationUtil.kt
  main/resources/
    db/migration/               Flyway SQL migrations (V1-V7)
    static/
      css/style.css             Dark-themed SPA stylesheet (includes cookie banner styles)
      js/
        app.js                  Main SPA logic (home, events, registrations)
        organizer.js            Organizer panel
        registrations.js        My registrations page
        profile.js              Profile page
        login.js                Login page
        signup.js               Signup page
        admin-dashboard.js      Admin dashboard
        admin-organizers.js     Admin organizer management
        admin-taxonomy.js       Admin category/department management
        cookies.js              Cookie consent banner (shown once per browser)
  test/kotlin/com/example/
    fake/                       In-memory DAO + publisher stubs
    service/                    Unit tests for all services
    security/                   Unit tests for JwtManager and PasswordUtil
    integration/                HTTP integration tests using testApplication
notification-service/           Standalone microservice (separate Gradle project)
  src/main/kotlin/com/example/notification/
    Main.kt
    NotificationConsumer.kt
    UserNotificationConsumer.kt
    RegistrationNotificationConsumer.kt
    NotificationMessage.kt
  Dockerfile
  build.gradle.kts
build.gradle.kts
docker-compose.yml
docs/README.md
```

## Architecture

The backend follows **Hexagonal Architecture** (Ports and Adapters):

```
+-----------------------------------------------------------------+
|                        Ktor HTTP Server                         |
|                                                                 |
|  Browser (Vanilla JS SPA)                                       |
|       |                                                         |
|  Controllers  ------------------------------------------------> |
|  (HTTP Adapter)          Services (Domain Core)                 |
|                          - AuthService                          |
|                          - EventService                         |
|                          - RegistrationService                  |
|                               |               |                 |
|                      DAO Port |    Notification Port            |
|                       (Interface)    (Interface)                |
|                          |               |                      |
|                    JdbcDao          RabbitMQPublisher           |
|                   (Adapter)      or LogPublisher (fallback)     |
|                          |               |                      |
|                     PostgreSQL       RabbitMQ --> notification- |
|                                                   service       |
+-----------------------------------------------------------------+
```

**Ports** are Kotlin interfaces (`UserDao`, `EventDao`, `NotificationPublisher`) that the domain core depends on.
**Adapters** are concrete implementations (`JdbcUserDao`, `RabbitMQNotificationPublisher`) wired at startup in `Application.kt`.
**Fake adapters** (`FakeUserDao`, `FakeNotificationPublisher`) are used in tests with no external dependencies.

StatusPages intercepts all service exceptions and maps them to consistent JSON error responses.

## Microservices

The platform consists of two independently deployable services:

| Service | Language | Responsibility |
|---|---|---|
| `utcn-events-api` | Kotlin / Ktor | REST API + SPA frontend |
| `notification-service` | Kotlin | Async consumer — processes notification events from RabbitMQ |

**Message flow:**

```
utcn-events-api  --(publish)-->  RabbitMQ  --(consume)-->  notification-service
                                queue: notifications
```

Events published to the `notifications` queue:

| Event type | Published when |
|---|---|
| `USER_REGISTERED` | A new user registers |
| `EVENT_REGISTRATION` | A student registers for an event |
| `REGISTRATION_CANCELLED` | A student cancels a registration |

## Design Patterns

| Pattern | Where | Purpose |
|---|---|---|
| **Hexagonal / Ports & Adapters** | `dao/` interfaces + `Jdbc*Dao` implementations | Decouple domain logic from persistence; swap real DAO for fake in tests |
| **Singleton** | `RabbitMQConnectionFactory` | Single point of RabbitMQ config; reads env vars once |
| **Strategy** | `NotificationPublisher` interface | Swap `RabbitMQNotificationPublisher` for `LogNotificationPublisher` or `FakeNotificationPublisher` without changing service code |
| **Template Method** | `NotificationConsumer` (abstract) | Fixed consume loop; subclasses override `handleMessage()` |

## Frontend

The frontend is a vanilla JavaScript SPA served directly by the Ktor backend from `src/main/resources/static/`.

### Pages

| URL | File | Access |
|---|---|---|
| `/` | `app.js` | All — gamified home page (role-aware) |
| `/events` | `app.js` | All — event browser with upcoming/past tabs |
| `/login` | `login.js` | Guest |
| `/signup` | `signup.js` | Guest |
| `/my-registrations` | `registrations.js` | Student |
| `/profile` | `profile.js` | Authenticated |
| `/organizer-panel` | `organizer.js` | Organizer |
| `/admin-dashboard` | `admin-dashboard.js` | Admin |
| `/admin-organizers` | `admin-organizers.js` | Admin |
| `/admin-taxonomy` | `admin-taxonomy.js` | Admin |

### Key Frontend Features

- **Gamified home page**: Students see a rank card (Newcomer → Legend) based on registration count, stat cards, upcoming event countdown panel, category breakdown, and a discover section. Organizers see their event stats. Guests see platform highlights.
- **Upcoming / Past event tabs**: The events page splits events into two tabs — upcoming and past — with automatic classification based on event start time.
- **Re-registration**: Students who previously cancelled a registration can re-register for the same event.
- **Dark cyber theme**: Full dark UI with CSS grid background, UTCN red accent (`#c8102e`), Space Grotesk + Inter typography.
- **Password strength UX**: The signup form shows a live strength bar (Weak → Fair → Strong → Very Strong), a show/hide toggle for the password field, and inline field hints. Strength is computed from length, uppercase, lowercase, digit, and special character rules.
- **Cookie consent banner**: Shown on the first visit to any page. Displays a details table of every cookie set by the platform. The user's choice is stored in `localStorage` and the banner is never shown again. See [Cookie Policy & Consent](#cookie-policy--consent).

---

## Authentication & Security

### How it works

Authentication is **dual-mode**: every protected endpoint accepts the JWT via either an **HttpOnly cookie** (browser flow) or a standard **`Authorization: Bearer <token>` header** (API / test flow). Both are verified by the same JWT verifier — the cookie is just a different transport.

#### Browser login flow

```
1. User submits login form  →  POST /api/auth/login  (credentials: 'include')
2. Backend validates credentials
3. Backend sets:
     Set-Cookie: auth_token=<JWT>; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400
4. Browser stores the cookie — JavaScript cannot read it (HttpOnly)
5. All subsequent same-origin requests automatically carry the cookie
6. Backend JWT plugin reads the cookie first, then falls back to Authorization header
```

#### API / test flow (Bearer header)

```
Authorization: Bearer <token>
```

Integration tests continue to use `bearerAuth(token)` — no changes required there.

#### Logout

```
POST /api/auth/logout
```

The server responds with `Set-Cookie: auth_token=; Max-Age=0` which immediately expires the cookie in the browser. The frontend also clears all localStorage session keys.

### JWT Details

| Property | Value |
|---|---|
| Algorithm | HMAC-SHA256 (HS256) |
| Expiry | 24 hours |
| Claim: `sub` | User ID (string) |
| Secret | `JWT_SECRET` env var (fallback hardcoded for local dev) |

### Password Rules

Passwords must satisfy **all** of the following:

| Rule | Requirement |
|---|---|
| Length | At least 8 characters |
| Uppercase | At least one A–Z character |
| Lowercase | At least one a–z character |
| Digit | At least one 0–9 character |
| Special character | At least one of `!@#$%^&*()_+-=[]{};\|':",./<>?` |

Passwords are hashed with **bcrypt** (jBCrypt, cost factor 10) before storage. Plain-text passwords are never persisted.

### Role-Based Access

| Role | Permissions |
|---|---|
| `STUDENT` | Browse events, register / cancel registrations, view own profile |
| `ORGANIZER` | All student permissions + create / edit / delete own events, view participant lists |
| `ADMIN` | All organizer permissions + manage users, categories, departments, view platform stats |

---

## Cookie Policy & Consent

### Cookies set by this platform

| Cookie | Purpose | Type | HttpOnly | Duration |
|---|---|---|---|---|
| `auth_token` | Keeps the user securely signed in. Carries the JWT so the browser does not need to manage it in JavaScript. | Strictly Necessary | ✅ Yes | 24 hours |

No tracking, advertising, analytics, or third-party cookies are set at any point.

### Why HttpOnly?

`HttpOnly` means the cookie **cannot be read or modified by JavaScript** (`document.cookie` returns nothing for it). This eliminates the most common XSS attack vector — a malicious script injected into the page cannot steal the session token.

### Cookie Consent Banner

The platform shows a **GDPR-style consent banner** on the first visit to any page. It is implemented entirely in `cookies.js` with no external dependencies.

**Behaviour:**
- Appears as a bottom-anchored modal card with a semi-transparent overlay
- A **Details ▼** toggle expands a table listing every cookie: name, purpose, type, and duration
- Two action buttons: **Accept All** and **Necessary Only** (functionally identical since only strictly necessary cookies are used)
- On click, the choice is saved to `localStorage` under the key `cookies_consent` and the banner fades out
- On subsequent page loads, the banner is skipped entirely
- Fully accessible: keyboard focus is trapped inside the banner, the first button receives focus automatically, ARIA roles and labels are set correctly

**To reset the consent (for testing):**

```javascript
localStorage.removeItem('cookies_consent');
location.reload();
```

---

## Database Schema

### departments
| Column     | Type         | Constraints      |
|------------|--------------|------------------|
| id         | BIGSERIAL    | PRIMARY KEY      |
| name       | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP    | DEFAULT now()    |

### categories
| Column      | Type         | Constraints      |
|-------------|--------------|------------------|
| id          | BIGSERIAL    | PRIMARY KEY      |
| name        | VARCHAR(255) | NOT NULL, UNIQUE |
| description | TEXT         |                  |
| created_at  | TIMESTAMP    | DEFAULT now()    |

### users
| Column        | Type         | Constraints                     |
|---------------|--------------|---------------------------------|
| id            | BIGSERIAL    | PRIMARY KEY                     |
| email         | VARCHAR(255) | NOT NULL, UNIQUE                |
| password_hash | VARCHAR(255) | NOT NULL                        |
| first_name    | VARCHAR(255) | NOT NULL                        |
| last_name     | VARCHAR(255) | NOT NULL                        |
| role          | user_role    | ENUM: STUDENT, ORGANIZER, ADMIN |
| department_id | BIGINT       | FK -> departments(id), nullable |
| is_active     | BOOLEAN      | DEFAULT true                    |
| created_at    | TIMESTAMP    | DEFAULT now()                   |
| updated_at    | TIMESTAMP    | DEFAULT now()                   |

### events
| Column           | Type         | Constraints                    |
|------------------|--------------|--------------------------------|
| id               | BIGSERIAL    | PRIMARY KEY                    |
| title            | VARCHAR(255) | NOT NULL                       |
| description      | TEXT         | NOT NULL                       |
| date             | VARCHAR(32)  | NOT NULL                       |
| category         | VARCHAR(120) | NOT NULL                       |
| department       | VARCHAR(120) | NOT NULL                       |
| organizer_id     | BIGINT       | FK -> users(id), nullable      |
| category_id      | BIGINT       | FK -> categories(id), nullable |
| location         | VARCHAR(255) | nullable                       |
| start_time       | TIMESTAMP    | nullable                       |
| end_time         | TIMESTAMP    | nullable                       |
| max_participants | INT          | nullable                       |
| created_at       | TIMESTAMP    | DEFAULT now()                  |
| updated_at       | TIMESTAMP    | DEFAULT now()                  |

### registrations
| Column        | Type        | Constraints                |
|---------------|-------------|----------------------------|
| id            | BIGSERIAL   | PRIMARY KEY                |
| student_id    | BIGINT      | NOT NULL, FK -> users(id)  |
| event_id      | BIGINT      | NOT NULL, FK -> events(id) |
| status        | VARCHAR(50) | DEFAULT 'REGISTERED'       |
| registered_at | TIMESTAMP   | DEFAULT now()              |
| cancelled_at  | TIMESTAMP   | nullable                   |

UNIQUE constraint on `(student_id, event_id)`. Re-registration after cancellation reactivates the existing row instead of inserting a new one.

### reminder_outbox
| Column     | Type      | Constraints   |
|------------|-----------|---------------|
| id         | BIGSERIAL | PRIMARY KEY   |
| event_id   | BIGINT    | NOT NULL      |
| student_id | BIGINT    | NOT NULL      |
| send_at    | TIMESTAMP | NOT NULL      |
| sent       | BOOLEAN   | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT now() |

---

## API Endpoints

### Health Check

| Method | Path    | Auth | Description           |
|--------|---------|------|-----------------------|
| GET    | /health | No   | Returns server status |

### Authentication

| Method | Path               | Auth | Description                                              |
|--------|--------------------|------|----------------------------------------------------------|
| POST   | /api/auth/register | No   | Create a new user account; sets `auth_token` cookie      |
| POST   | /api/auth/login    | No   | Authenticate and receive a JWT; sets `auth_token` cookie |
| POST   | /api/auth/logout   | No   | Expires the `auth_token` cookie (Max-Age=0)              |
| GET    | /api/auth/me       | JWT  | Get the currently authenticated user                     |
| PUT    | /api/auth/profile  | JWT  | Update profile (name, department)                        |

### Events

| Method | Path             | Auth | Description                    |
|--------|------------------|------|--------------------------------|
| GET    | /api/events      | No   | List all events                |
| GET    | /api/events/{id} | No   | Get a single event by ID       |
| POST   | /api/events      | JWT  | Create a new event (organizer) |
| PUT    | /api/events/{id} | JWT  | Update an existing event       |
| DELETE | /api/events/{id} | JWT  | Delete an event                |

### Registrations

| Method | Path                                       | Auth | Description                            |
|--------|--------------------------------------------|------|----------------------------------------|
| GET    | /api/registrations                         | JWT  | List current user's registrations      |
| POST   | /api/registrations                         | JWT  | Register for an event (or re-register) |
| DELETE | /api/registrations/{registrationId}        | JWT  | Cancel a registration                  |
| GET    | /api/registrations/event/{eventId}         | JWT  | List participant IDs of an event       |
| GET    | /api/registrations/event/{eventId}/details | JWT  | List participant details of an event   |
| PUT    | /api/registrations/{registrationId}/status | JWT  | Update registration status             |

### Categories (admin)

| Method | Path                 | Auth | Description         |
|--------|----------------------|------|---------------------|
| GET    | /api/categories      | JWT  | List all categories |
| GET    | /api/categories/{id} | JWT  | Get category by ID  |
| POST   | /api/categories      | JWT  | Create a category   |
| PUT    | /api/categories/{id} | JWT  | Update a category   |
| DELETE | /api/categories/{id} | JWT  | Delete a category   |

### Departments (admin)

| Method | Path                  | Auth | Description          |
|--------|-----------------------|------|----------------------|
| GET    | /api/departments      | JWT  | List all departments |
| GET    | /api/departments/{id} | JWT  | Get department by ID |
| POST   | /api/departments      | JWT  | Create a department  |
| PUT    | /api/departments/{id} | JWT  | Update a department  |
| DELETE | /api/departments/{id} | JWT  | Delete a department  |

### Users (admin)

| Method | Path                  | Auth | Description                 |
|--------|-----------------------|------|-----------------------------|
| GET    | /api/users/{role}     | JWT  | List users by role          |
| POST   | /api/users/organizers | JWT  | Create an organizer account |

### Admin Stats (admin)

| Method | Path             | Auth | Description                         |
|--------|------------------|------|-------------------------------------|
| GET    | /api/admin/stats | JWT  | Platform statistics (users, events) |

---

## Request and Response Examples

### Register

```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@utcn.ro",
  "password": "Secret123!",
  "firstName": "Maria",
  "lastName": "Popescu",
  "role": "STUDENT"
}
```

Response `201 Created`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "student@utcn.ro",
    "firstName": "Maria",
    "lastName": "Popescu",
    "role": "STUDENT",
    "departmentId": null
  }
}
```

Also sets: `Set-Cookie: auth_token=eyJ...; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`

### Login

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@utcn.ro",
  "password": "Secret123!"
}
```

Response `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "student@utcn.ro",
    "firstName": "Maria",
    "lastName": "Popescu",
    "role": "STUDENT",
    "departmentId": null
  }
}
```

Also sets: `Set-Cookie: auth_token=eyJ...; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`

### Logout

```
POST /api/auth/logout
```

Response `204 No Content`

Sets: `Set-Cookie: auth_token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`

### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>        (or via auth_token cookie)
```

Response `200 OK`:
```json
{
  "id": 1,
  "email": "student@utcn.ro",
  "firstName": "Maria",
  "lastName": "Popescu",
  "role": "STUDENT",
  "departmentId": null
}
```

### Create Event

```json
POST /api/events
Authorization: Bearer <token>

{
  "title": "AI Workshop",
  "description": "Introduction to machine learning",
  "date": "2026-09-15",
  "category": "Workshop",
  "department": "Computer Science",
  "location": "Room 101",
  "startTime": "2026-09-15T10:00:00",
  "endTime": "2026-09-15T12:00:00",
  "maxParticipants": 30
}
```

Response `201 Created`:
```json
{
  "id": 1,
  "title": "AI Workshop",
  "description": "Introduction to machine learning",
  "date": "2026-09-15",
  "category": "Workshop",
  "department": "Computer Science",
  "organizerId": 6,
  "categoryId": 6,
  "location": "Room 101",
  "startTime": "2026-09-15T10:00:00",
  "endTime": "2026-09-15T12:00:00",
  "maxParticipants": 30
}
```

### Register for Event

```json
POST /api/registrations
Authorization: Bearer <token>

{
  "eventId": 1
}
```

Response `201 Created`:
```json
{
  "id": 1,
  "studentId": 1,
  "eventId": 1,
  "status": "REGISTERED",
  "registeredAt": "2026-05-12T10:30:00",
  "cancelledAt": null
}
```

### Create Category (admin)

```json
POST /api/categories
Authorization: Bearer <token>

{
  "name": "Workshop"
}
```

Response `201 Created`:
```json
{ "id": 1, "name": "Workshop" }
```

### Create Department (admin)

```json
POST /api/departments
Authorization: Bearer <token>

{
  "name": "Computer Science"
}
```

Response `201 Created`:
```json
{ "id": 1, "name": "Computer Science" }
```

---

## Validation Rules

### User Registration
- Email must contain `@` and a domain
- Password must be at least 8 characters with uppercase, lowercase, digit, and special character
- First name and last name cannot be blank
- Role must be one of: `STUDENT`, `ORGANIZER`, `ADMIN`

### Events
- Title and description cannot be blank
- Title must be at most 255 characters
- `maxParticipants`, if provided, must be positive

### Categories and Departments
- Name cannot be blank
- Name must be at most 255 characters
- Name must be unique (duplicate returns 409 Conflict)

### Registrations
- Students cannot register for the same event twice (re-registration after cancellation is allowed)
- Only the student who registered can cancel
- Status updates accept: `REGISTERED`, `CANCELLED`, `WAITLISTED`, `ATTENDED`

---

## Error Handling

All errors return a consistent JSON shape:

```json
{
  "error": "Description of the problem",
  "status": 400
}
```

| HTTP Status | Meaning                                            |
|-------------|----------------------------------------------------|
| 400         | Validation error (bad input, missing fields)       |
| 401         | Missing or invalid JWT token                       |
| 404         | Resource not found                                 |
| 409         | Conflict (duplicate email, duplicate registration) |
| 500         | Unexpected server error                            |

---

## Postman Screenshots

### Health Check
![Health](screenshots/health.png)

### Register Student
![Register Student](screenshots/register_student.png)

### Register Organiser
![Register Organiser](screenshots/register_organiser.png)

### Create Admin
![Create Admin](screenshots/create_admin.png)

### Login
![Login](screenshots/login.png)

### Get Current User
![Get Current User](screenshots/get_current_user.png)

### Validation Error - Weak Password
![Weak Password](screenshots/weak_password.png)

### Create Department (admin token)
![Create Department](screenshots/create_department_admintoken.png)

### Create Department - Insufficient Permissions
![Insufficient Permissions](screenshots/create_department_invalidpermissions.png)

### List Departments
![List Departments](screenshots/list_departments.png)

### Create Category
![Create Category](screenshots/create_category.png)

### List Categories
![List Categories](screenshots/list_categories.png)

### Create Event
![Create Event](screenshots/create_event.png)

### List All Events
![List All Events](screenshots/list_all_events.png)

### Get Event by ID
![Get Event by ID](screenshots/get_event_byID.png)

### Update Event
![Update Event](screenshots/update_event.png)

### Delete Event
![Delete Event](screenshots/delete_event.png)

### Register for Event
![Register for Event](screenshots/register_for_event.png)

### List My Registrations
![List My Registrations](screenshots/list_MY_registrations.png)

### List Participants for an Event
![List Participants](screenshots/list_participants_for_an_event.png)

### Try to Double Register (409 Conflict)
![Double Register](screenshots/try_to_double_reister.png)

### Cancel Registration
![Cancel Registration](screenshots/cancel_registrations.png)

### List All Users
![List All Users](screenshots/list_all_users.png)

### List Users by Role
![List Users by Role](screenshots/list_users_byRole.png)

---

## Tech Stack

| Component       | Technology            | Version  |
|-----------------|-----------------------|----------|
| Language        | Kotlin                | 1.9.10   |
| Framework       | Ktor                  | 2.3.12   |
| HTTP Server     | Netty                 | embedded |
| Database        | PostgreSQL            | 15       |
| Connection Pool | HikariCP              | 5.0.1    |
| Migrations      | Flyway                | 10.10.0  |
| Authentication  | Auth0 java-jwt        | 4.4.0    |
| Password Hash   | jBCrypt               | 0.4      |
| Serialization   | kotlinx-serialization | 1.6.0    |
| Logging         | Logback (SLF4J)       | 1.5.6    |
| Build Tool      | Gradle                | 8.10.2   |
| JDK             | 17+                   | required |
| Frontend        | Vanilla JS / CSS      | —        |

---

## Environment Variables

| Variable          | Default                                     | Description             |
|-------------------|---------------------------------------------|-------------------------|
| PORT              | 8080                                        | Server port             |
| DATABASE_URL      | jdbc:postgresql://localhost:5432/utcnevents | JDBC connection URL     |
| DATABASE_USER     | postgres                                    | Database username       |
| DATABASE_PASSWORD | postgres                                    | Database password       |
| JWT_SECRET        | (hardcoded fallback)                        | Secret for signing JWTs |
| RABBITMQ_HOST     | localhost                                   | RabbitMQ host           |
| RABBITMQ_PORT     | 5672                                        | RabbitMQ port           |
| RABBITMQ_USER     | guest                                       | RabbitMQ username       |
| RABBITMQ_PASS     | guest                                       | RabbitMQ password       |

## Docker Services

```bash
docker compose up -d    # start all services
docker compose down     # stop all
```

| Service             | Port  | Credentials                          |
|---------------------|-------|--------------------------------------|
| PostgreSQL          | 5432  | user: postgres / password: postgres  |
| pgAdmin             | 5050  | email: admin@example.com / pw: admin |
| RabbitMQ            | 5672  | user: guest / password: guest        |
| RabbitMQ Management | 15672 | user: guest / password: guest        |
| Backend API         | 8080  | —                                    |
