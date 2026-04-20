# UTCN Extracurricular Events Platform

REST API for managing extracurricular events at the Technical University of Cluj-Napoca.
The server handles user authentication, event CRUD, student registrations, and admin operations for departments and categories.
Built with Kotlin and Ktor, backed by PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [How to Run](#how-to-run)
3. [Running Tests](#running-tests)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication](#authentication)
9. [Request and Response Examples](#request-and-response-examples)
10. [Validation Rules](#validation-rules)
11. [Error Handling](#error-handling)
12. [Postman Screenshots](#postman-screenshots)
13. [Tech Stack](#tech-stack)
14. [Environment Variables](#environment-variables)

---

## Prerequisites

- JDK 17 or higher
- Docker and Docker Compose

## How to Run

```bash
# 1. Start the database
docker-compose up -d

# 2. Build the project
./gradlew build -x test

# 3. Start the server
./gradlew run
```

The API will be available at http://localhost:8080.

To verify it is running:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

To stop the database:

```bash
docker-compose down
```

## Running Tests

```bash
./gradlew test
```

The test suite includes 80 unit tests covering all service classes, JWT token handling, and password hashing.
Tests use in-memory fake DAOs so they run without a database connection.

## Project Structure

```
src/
  main/kotlin/com/example/
    Application.kt              Ktor plugin setup, routing, dependency wiring
    Main.kt                     Entry point (embedded Netty server)
    controller/
      AuthController.kt         /auth/register, /auth/login, /auth/me
      EventController.kt        /api/events CRUD
      RegistrationController.kt /api/registrations
      CategoryController.kt     /api/categories CRUD (admin)
      DepartmentController.kt   /api/departments CRUD (admin)
      UserController.kt         /api/users (admin)
    service/
      AuthService.kt            Registration, login, token generation
      EventService.kt           Event CRUD with validation
      RegistrationService.kt    Student registration logic
      CategoryService.kt        Category CRUD with validation
      DepartmentService.kt      Department CRUD with validation
      UserService.kt            User listing by role
    db/
      DatabaseFactory.kt        HikariCP pool + Flyway migrations
      dao/
        EventDao.kt             Interface
        JdbcEventDao.kt         JDBC implementation
        UserDao.kt / JdbcUserDao.kt
        RegistrationDao.kt / JdbcRegistrationDao.kt
        CategoryDao.kt / JdbcCategoryDao.kt
        DepartmentDao.kt / JdbcDepartmentDao.kt
    model/
      Event.kt                  Event data class
      User.kt                   User data class + UserRole enum
      Registration.kt           Registration data class
      Category.kt               Category data class
      Department.kt             Department data class
    dto/
      AuthDtos.kt               RegisterRequest, LoginRequest, AuthResponse
      EventDtos.kt              EventRequest, EventResponse
      RegistrationDtos.kt       RegistrationRequest, RegistrationResponse
      AdminDtos.kt              CategoryRequest/Response, DepartmentRequest/Response
      UserDtos.kt               UserResponse
      ErrorResponse.kt          Standard error JSON shape
    security/
      JwtManager.kt             Token generation and verification
      PasswordUtil.kt           BCrypt hashing
      AuthorizationUtil.kt      Role checking helpers
  main/resources/db/
    migration/
      V1__create_events_table.sql
      V2__create_users_table.sql
      V3__create_registrations_table.sql
    schema.sql                  Full schema reference
  test/kotlin/com/example/
    fake/                       In-memory DAO stubs (no DB needed)
    service/                    Unit tests for all 6 services
    security/                   Unit tests for JwtManager and PasswordUtil
build.gradle.kts
docker-compose.yml
docs/
  README.md                     This file
  UTCN_Extracurricular_Events.pdf
```

## Architecture

```
Client (Postman / frontend)
         |
    HTTP requests
         |
    Controllers         Parse request, extract JWT claims, delegate to service
         |
    Services            Validate input, enforce business rules, call DAO
         |
    DAOs (JDBC)         Execute SQL with prepared statements
         |
    PostgreSQL           Stores all data, enforces constraints
```

StatusPages plugin intercepts exceptions thrown by services and returns consistent JSON error responses.

## Database Schema

### departments
| Column     | Type         | Constraints       |
|------------|--------------|-------------------|
| id         | BIGSERIAL    | PRIMARY KEY       |
| name       | VARCHAR(255) | NOT NULL, UNIQUE  |
| created_at | TIMESTAMP    | DEFAULT now()     |

### categories
| Column     | Type         | Constraints       |
|------------|--------------|-------------------|
| id         | BIGSERIAL    | PRIMARY KEY       |
| name       | VARCHAR(255) | NOT NULL, UNIQUE  |
| description| TEXT         |                   |
| created_at | TIMESTAMP    | DEFAULT now()     |

### users
| Column        | Type         | Constraints                          |
|---------------|--------------|--------------------------------------|
| id            | BIGSERIAL    | PRIMARY KEY                          |
| email         | VARCHAR(255) | NOT NULL, UNIQUE                     |
| password_hash | VARCHAR(255) | NOT NULL                             |
| first_name    | VARCHAR(255) | NOT NULL                             |
| last_name     | VARCHAR(255) | NOT NULL                             |
| role          | user_role    | ENUM: STUDENT, ORGANIZER, ADMIN      |
| department_id | BIGINT       | FK -> departments(id), nullable      |
| is_active     | BOOLEAN      | DEFAULT true                         |
| created_at    | TIMESTAMP    | DEFAULT now()                        |
| updated_at    | TIMESTAMP    | DEFAULT now()                        |

### events
| Column           | Type         | Constraints                  |
|------------------|--------------|------------------------------|
| id               | BIGSERIAL    | PRIMARY KEY                  |
| title            | VARCHAR(255) | NOT NULL                     |
| description      | TEXT         | NOT NULL                     |
| date             | VARCHAR(32)  | NOT NULL                     |
| category         | VARCHAR(120) | NOT NULL                     |
| department       | VARCHAR(120) | NOT NULL                     |
| organizer_id     | BIGINT       | FK -> users(id), nullable    |
| category_id      | BIGINT       | FK -> categories(id), nullable|
| location         | VARCHAR(255) | nullable                     |
| start_time       | TIMESTAMP    | nullable                     |
| end_time         | TIMESTAMP    | nullable                     |
| max_participants | INT          | nullable                     |
| created_at       | TIMESTAMP    | DEFAULT now()                |
| updated_at       | TIMESTAMP    | DEFAULT now()                |

### registrations
| Column        | Type         | Constraints                          |
|---------------|--------------|--------------------------------------|
| id            | BIGSERIAL    | PRIMARY KEY                          |
| student_id    | BIGINT       | NOT NULL, FK -> users(id)            |
| event_id      | BIGINT       | NOT NULL, FK -> events(id)           |
| status        | VARCHAR(50)  | DEFAULT 'REGISTERED'                 |
| registered_at | TIMESTAMP    | DEFAULT now()                        |
| cancelled_at  | TIMESTAMP    | nullable                             |

UNIQUE constraint on (student_id, event_id).

## API Endpoints

### Health Check

| Method | Path    | Auth | Description          |
|--------|---------|------|----------------------|
| GET    | /health | No   | Returns server status|

### Authentication

| Method | Path           | Auth  | Description                              |
|--------|----------------|-------|------------------------------------------|
| POST   | /auth/register | No    | Create a new user account                |
| POST   | /auth/login    | No    | Authenticate and receive a JWT token     |
| GET    | /auth/me       | JWT   | Get the currently authenticated user     |

### Events

| Method | Path              | Auth | Description                          |
|--------|-------------------|------|--------------------------------------|
| GET    | /api/events       | JWT  | List all events                      |
| GET    | /api/events/{id}  | JWT  | Get a single event by ID             |
| POST   | /api/events       | JWT  | Create a new event                   |
| PUT    | /api/events/{id}  | JWT  | Update an existing event             |
| DELETE | /api/events/{id}  | JWT  | Delete an event                      |

### Registrations

| Method | Path                                | Auth | Description                        |
|--------|-------------------------------------|------|------------------------------------|
| GET    | /api/registrations                  | JWT  | List current user's registrations  |
| POST   | /api/registrations                  | JWT  | Register for an event              |
| DELETE | /api/registrations/{registrationId} | JWT  | Cancel a registration              |
| GET    | /api/registrations/event/{eventId}  | JWT  | List participants of an event      |
| PUT    | /api/registrations/{id}/status      | JWT  | Update registration status         |

### Categories (admin)

| Method | Path                   | Auth | Description              |
|--------|------------------------|------|--------------------------|
| GET    | /api/categories        | JWT  | List all categories      |
| GET    | /api/categories/{id}   | JWT  | Get category by ID       |
| POST   | /api/categories        | JWT  | Create a category        |
| PUT    | /api/categories/{id}   | JWT  | Update a category        |
| DELETE | /api/categories/{id}   | JWT  | Delete a category        |

### Departments (admin)

| Method | Path                    | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| GET    | /api/departments        | JWT  | List all departments     |
| GET    | /api/departments/{id}   | JWT  | Get department by ID     |
| POST   | /api/departments        | JWT  | Create a department      |
| PUT    | /api/departments/{id}   | JWT  | Update a department      |
| DELETE | /api/departments/{id}   | JWT  | Delete a department      |

### Users (admin)

| Method | Path                | Auth | Description              |
|--------|---------------------|------|--------------------------|
| GET    | /api/users          | JWT  | List all users           |
| GET    | /api/users/{role}   | JWT  | List users by role       |

## Authentication

The API uses JWT (JSON Web Token) for authentication.

1. Register a user via `POST /auth/register`
2. Login via `POST /auth/login` to receive a token
3. Include the token in subsequent requests as a header:

```
Authorization: Bearer <token>
```

Tokens expire after 24 hours. Requests without a valid token to protected endpoints return 401.

## Request and Response Examples

### Register

Request:
```json
POST /auth/register
{
  "email": "student@utcn.ro",
  "password": "Secret123!",
  "firstName": "Maria",
  "lastName": "Popescu",
  "role": "STUDENT"
}
```

Response (201):
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

### Login

Request:
```json
POST /auth/login
{
  "email": "student@utcn.ro",
  "password": "Secret123!"
}
```

Response (200):
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

### Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

Response (200):
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

Request:
```json
POST /api/events
Authorization: Bearer <token>
{
  "title": "AI Workshop",
  "description": "Introduction to machine learning",
  "date": "2026-05-15",
  "category": "Workshop",
  "department": "Computer Science",
  "location": "Room 101",
  "maxParticipants": 30
}
```

Response (201):
```json
{
  "id": 1,
  "title": "AI Workshop",
  "description": "Introduction to machine learning",
  "date": "2026-05-15",
  "category": "Workshop",
  "department": "Computer Science",
  "organizerId": null,
  "categoryId": null,
  "location": "Room 101",
  "startTime": null,
  "endTime": null,
  "maxParticipants": 30
}
```

### Register for Event

Request:
```json
POST /api/registrations
Authorization: Bearer <token>
{
  "eventId": 1
}
```

Response (201):
```json
{
  "id": 1,
  "studentId": 1,
  "eventId": 1,
  "status": "REGISTERED",
  "registeredAt": "2026-04-20T10:30:00",
  "cancelledAt": null
}
```

### Create Category (admin)

Request:
```json
POST /api/categories
Authorization: Bearer <token>
{
  "name": "Workshop"
}
```

Response (201):
```json
{
  "id": 1,
  "name": "Workshop"
}
```

### Create Department (admin)

Request:
```json
POST /api/departments
Authorization: Bearer <token>
{
  "name": "Computer Science"
}
```

Response (201):
```json
{
  "id": 1,
  "name": "Computer Science"
}
```

## Validation Rules

### User Registration
- Email must contain @ and a domain
- Password must be at least 8 characters, with uppercase, lowercase, digit, and special character
- First name and last name cannot be blank
- Role must be one of: STUDENT, ORGANIZER, ADMIN

### Events
- Title and description cannot be blank
- Title must be at most 255 characters
- maxParticipants, if provided, must be positive

### Categories and Departments
- Name cannot be blank
- Name must be at most 255 characters
- Name must be unique (duplicate returns 409 Conflict)

### Registrations
- Cannot register for the same event twice
- Only the student who registered can cancel
- Status updates accept: REGISTERED, CANCELLED, WAITLISTED, ATTENDED

## Error Handling

All errors return a consistent JSON shape:

```json
{
  "error": "Description of the problem",
  "status": 400
}
```

| HTTP Status | Meaning                                              |
|-------------|------------------------------------------------------|
| 400         | Validation error (bad input, missing fields)         |
| 401         | Missing or invalid JWT token                         |
| 404         | Resource not found                                   |
| 409         | Conflict (duplicate email, duplicate registration)   |
| 500         | Unexpected server error                              |

## Postman Screenshots

The following screenshots demonstrate the main API flows tested in Postman.

### 1. User Registration
![Register](screenshots/01-register.png)

### 2. User Login
![Login](screenshots/02-login.png)

### 3. Access Protected Endpoint with Token
![Auth Me](screenshots/03-auth-me.png)

### 4. Unauthorized Access (no token)
![401 Error](screenshots/04-unauthorized.png)

### 5. Create Event
![Create Event](screenshots/05-create-event.png)

### 6. List Events
![List Events](screenshots/06-list-events.png)

### 7. Update Event
![Update Event](screenshots/07-update-event.png)

### 8. Delete Event
![Delete Event](screenshots/08-delete-event.png)

### 9. Register for Event
![Register for Event](screenshots/09-register-event.png)

### 10. List My Registrations
![My Registrations](screenshots/10-my-registrations.png)

### 11. Cancel Registration
![Cancel Registration](screenshots/11-cancel-registration.png)

### 12. Create Category (admin)
![Create Category](screenshots/12-create-category.png)

### 13. Create Department (admin)
![Create Department](screenshots/13-create-department.png)

### 14. Validation Error (weak password)
![Validation Error](screenshots/14-validation-error.png)

### 15. Duplicate Registration (409)
![Conflict Error](screenshots/15-conflict-error.png)

## Tech Stack

| Component      | Technology         | Version  |
|----------------|--------------------|----------|
| Language       | Kotlin             | 1.9.10   |
| Framework      | Ktor               | 2.3.12   |
| HTTP Server    | Netty              | embedded |
| Database       | PostgreSQL         | 15       |
| Connection Pool| HikariCP           | 5.0.1    |
| Migrations     | Flyway             | 10.10.0  |
| Authentication | Auth0 java-jwt     | 4.4.0    |
| Password Hash  | jBCrypt            | 0.4      |
| Serialization  | kotlinx-serialization | 1.6.0 |
| Logging        | Logback (SLF4J)    | 1.5.6    |
| Build Tool     | Gradle             | 8.10.2   |
| JDK            | 17+                | required |

## Environment Variables

| Variable          | Default                                      | Description             |
|-------------------|----------------------------------------------|-------------------------|
| PORT              | 8080                                         | Server port             |
| DATABASE_URL      | jdbc:postgresql://localhost:5432/utcnevents   | JDBC connection URL     |
| DATABASE_USER     | postgres                                     | Database username       |
| DATABASE_PASSWORD | postgres                                     | Database password       |
| JWT_SECRET        | (hardcoded)                                  | Secret for signing JWTs |

## Docker Services

```bash
docker-compose up -d    # start PostgreSQL + pgAdmin
docker-compose down     # stop all
```

- PostgreSQL: localhost:5432 (user: postgres, password: postgres, database: utcnevents)
- pgAdmin: localhost:5050 (email: admin@example.com, password: admin)
