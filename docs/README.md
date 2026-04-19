# UTCN Extracurricular Events Platform

REST API backend for managing extracurricular events at the Technical University of Cluj-Napoca (UTCN).
Built with Kotlin and Ktor.

## Prerequisites

- JDK 17+
- Docker and Docker Compose

## How to Run

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Build the project
./gradlew build -x test

# Run the server
./gradlew run
```

The API will be available at `http://localhost:8080`.

## Running Tests

```bash
./gradlew test
```

## Tech Stack

| Component  | Technology        |
|------------|-------------------|
| Language   | Kotlin 1.9.10     |
| Framework  | Ktor 2.3.12       |
| Database   | PostgreSQL 15     |
| Migrations | Flyway            |
| Auth       | Auth0 java-jwt 4.4|
| Hashing    | jBCrypt 0.4       |
| Build      | Gradle 8.10.2     |

## Project Structure

```
src/
  main/kotlin/com/example/
    Application.kt              Ktor configuration, routing, plugins
    Main.kt                     Entry point
    controller/                 HTTP route handlers
    service/                    Business logic and validation
    db/dao/                     DAO interfaces and JDBC implementations
    model/                      Data classes
    dto/                        Request/response serialization objects
    security/                   JwtManager, PasswordUtil, AuthorizationUtil
  main/resources/db/
    schema.sql                  Full schema reference
    migration/                  Flyway migrations (V1-V3)
  test/kotlin/com/example/
    fake/                       In-memory DAO stubs for testing
    service/                    Service layer unit tests
    security/                   JWT and password unit tests
build.gradle.kts
docker-compose.yml
docs/
  UTCN_Extracurricular_Events.pdf
```

## Architecture

```
Controllers  ->  Services  ->  DAOs  ->  PostgreSQL
   (HTTP)       (Business)    (Data)
```

- Controllers parse HTTP requests and delegate to services
- Services enforce validation and business rules
- DAOs execute SQL via JDBC and return model objects
- StatusPages plugin catches exceptions and returns JSON error responses

## API Endpoints

### Authentication (public)

| Method | Path             | Description           |
|--------|------------------|-----------------------|
| POST   | /auth/register   | Register a new user   |
| POST   | /auth/login      | Login, receive JWT    |
| GET    | /auth/me         | Get current user info |

### Events (protected)

| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | /api/events       | List all events  |
| POST   | /api/events       | Create event     |
| PUT    | /api/events/{id}  | Update event     |
| DELETE | /api/events/{id}  | Delete event     |

### Registrations (protected)

| Method | Path                             | Description             |
|--------|----------------------------------|-------------------------|
| GET    | /api/registrations               | My registrations        |
| POST   | /api/registrations               | Register for event      |
| DELETE | /api/registrations/{id}          | Cancel registration     |
| GET    | /api/registrations/event/{id}    | Event participants      |
| PUT    | /api/registrations/{id}/status   | Update status (organizer)|

### Categories (admin only)

| Method | Path                   | Description       |
|--------|------------------------|-------------------|
| GET    | /api/categories        | List categories   |
| POST   | /api/categories        | Create category   |
| PUT    | /api/categories/{id}   | Update category   |
| DELETE | /api/categories/{id}   | Delete category   |

### Departments (admin only)

| Method | Path                    | Description       |
|--------|-------------------------|-------------------|
| GET    | /api/departments        | List departments  |
| POST   | /api/departments        | Create department |
| PUT    | /api/departments/{id}   | Update department |
| DELETE | /api/departments/{id}   | Delete department |

### Users (admin only)

| Method | Path                | Description       |
|--------|---------------------|-------------------|
| GET    | /api/users          | List all users    |
| GET    | /api/users/{role}   | Filter by role    |

## User Roles

- **Student** - browse events, register/cancel registrations
- **Organizer** - create and manage own events, view participants
- **Admin** - manage users, departments, categories

## Security

- Passwords hashed with BCrypt (12 rounds)
- JWT tokens with 24-hour expiry
- Role-based route guards
- Prepared statements for SQL injection prevention
- Input validation on all write operations

## Docker Services

```bash
docker-compose up -d    # start
docker-compose down     # stop
```

- PostgreSQL: localhost:5432 (user: postgres, password: postgres)
- pgAdmin: localhost:5050 (email: admin@example.com, password: admin)
