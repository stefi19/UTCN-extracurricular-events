# UTCN Extracurricular Events - Setup Guide

## Project Overview
This is a Kotlin-based backend application for managing extracurricular events with JWT authentication and role-based authorization (Student, Organizer, Admin).

## Prerequisites
- JDK 17+
- PostgreSQL 15+
- Docker & Docker Compose (optional, for containerized PostgreSQL)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Ensure Docker is running**
   ```bash
   docker --version
   ```

2. **Start PostgreSQL and pgAdmin**
   ```bash
   cd kotlin-sample
   docker-compose up -d
   ```
   - PostgreSQL will be available at `localhost:5432`
   - pgAdmin will be available at `http://localhost:5050` (admin@example.com / admin)

3. **Build the project**
   ```bash
   ./gradlew build -x test
   ```

4. **Run the application**
   ```bash
   ./gradlew run
   ```
   The API will be available at `http://localhost:8080`

### Option 2: Manual PostgreSQL Setup

1. **Install PostgreSQL locally** (or use an existing instance)

2. **Create the database**
   ```bash
   createdb -U postgres utcnevents
   ```

3. **Set environment variables** (optional, defaults shown below)
   ```bash
   export DATABASE_URL=jdbc:postgresql://localhost:5432/utcnevents
   export DATABASE_USER=postgres
   export DATABASE_PASSWORD=postgres
   export JWT_SECRET=your-secure-secret-key-here
   ```

4. **Build and run**
   ```bash
   cd kotlin-sample
   ./gradlew build -x test
   ./gradlew run
   ```

## Database Migrations

The application uses **Flyway** for database migrations. Migrations are automatically run on startup and are located in:
```
src/main/resources/db/migration/
```

Current migrations:
- `V1__create_events_table.sql` - Events table
- `V2__create_users_table.sql` - Users, departments, categories, and authentication tables
- `V3__create_registrations_table.sql` - Event registrations table

## API Endpoints

### Authentication (Public)

#### Register a new user
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "departmentId": null
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "departmentId": null
  }
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User (Protected)
```bash
GET /auth/me
Authorization: Bearer <your_jwt_token>
```

### Events (Protected - requires authentication)

#### Get all events
```bash
GET /api/events
Authorization: Bearer <your_jwt_token>
```

#### Get event by ID
```bash
GET /api/events/{id}
Authorization: Bearer <your_jwt_token>
```

#### Create event (Organizer/Admin only)
```bash
POST /api/events
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "title": "Workshop: Kotlin Basics",
  "description": "Learn Kotlin programming",
  "date": "2026-05-15",
  "category": "Workshop",
  "department": "Computer Science"
}
```

#### Update event
```bash
PUT /api/events/{id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### Delete event
```bash
DELETE /api/events/{id}
Authorization: Bearer <your_jwt_token>
```

## User Roles

### STUDENT
- Browse events
- Register for events
- View personal registrations
- Cancel event registrations

### ORGANIZER
- Create events
- Edit own events
- Delete own events
- Manage event participants

### ADMIN
- Manage all users
- Manage departments and categories
- Supervise entire platform
- Full CRUD operations

## Password Requirements

Passwords must be at least 8 characters and contain:
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*-_)

## Authentication Flow

1. User registers or logs in
2. Server validates credentials and issues JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Server validates token on protected endpoints
5. Token expires after 24 hours (user must re-login)

## Database Schema

### users table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - BCrypt hashed password (never store plain passwords!)
- `first_name` - User's first name
- `last_name` - User's last name
- `role` - User role (STUDENT, ORGANIZER, ADMIN)
- `department_id` - Associated department
- `is_active` - Account status
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### events table
- `id` - Primary key
- `title` - Event title
- `description` - Event description
- `date` - Event date
- `category` - Event category
- `department` - Organizing department
- `organizer_id` - Reference to organizing user
- `location` - Event location
- `start_time` - Event start time
- `end_time` - Event end time
- `max_participants` - Maximum number of participants

### registrations table
- `id` - Primary key
- `student_id` - Student user ID
- `event_id` - Event ID
- `status` - Registration status (REGISTERED, CANCELLED, etc.)
- `registered_at` - Registration timestamp
- `cancelled_at` - Cancellation timestamp (if cancelled)

## Environment Variables

```bash
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/utcnevents
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secure-secret-key-here

# Storage Type (postgres or memory)
EVENTS_STORAGE=postgres
```

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@utcn.ro",
    "password": "AdminPass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'

# Login
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@utcn.ro",
    "password": "AdminPass123!"
  }' | jq -r '.token')

# Get current user
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get events
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman/Insomnia

1. Import the endpoints listed above
2. Register a user and copy the returned JWT token
3. Add token to Authorization header (Bearer scheme) for protected endpoints
4. Test each endpoint

## Security Features

✅ **Password Security**
- Passwords hashed with BCrypt (12 salt rounds)
- Never stored in plain text
- Strong password requirements enforced

✅ **JWT Authentication**
- Secure token generation with HMAC-256
- Configurable expiration time (24 hours)
- Issuer validation

✅ **Role-Based Access Control (RBAC)**
- Endpoints protected by user role
- Automatic authorization checks

✅ **Database Security**
- SQL prepared statements (prevents SQL injection)
- Connection pooling with HikariCP
- Type-safe DAO pattern

## Project Structure

```
src/main/kotlin/com/example/
├── Application.kt           # Main Ktor configuration
├── Main.kt                  # Entry point
├── controller/              # HTTP request handlers
│   ├── AuthController.kt
│   └── EventController.kt
├── service/                 # Business logic
│   ├── AuthService.kt
│   └── EventService.kt
├── db/                      # Database layer
│   ├── DatabaseFactory.kt
│   └── dao/
│       ├── UserDao.kt
│       ├── JdbcUserDao.kt
│       ├── EventDao.kt
│       └── JdbcEventDao.kt
├── model/                   # Data models
│   ├── User.kt
│   └── Event.kt
├── repository/              # Repository pattern
│   ├── EventRepository.kt
│   └── PostgresEventRepository.kt
├── security/                # Security utilities
│   ├── JwtManager.kt
│   └── PasswordUtil.kt
└── view/                    # Response formatters
```

## Troubleshooting

### "Connection refused" on startup
- Ensure PostgreSQL is running
- Check DATABASE_URL environment variable
- Verify database credentials

### "Migration failed"
- Check migration files in `src/main/resources/db/migration/`
- Ensure database user has permissions
- Check PostgreSQL logs for details

### "Invalid token" on protected endpoints
- Ensure JWT_SECRET matches between registration and validation
- Check token hasn't expired (24 hour expiration)
- Verify Authorization header format: `Bearer <token>`

## Next Steps

1. Implement role-based authorization middleware
2. Add department and category management endpoints
3. Add event registration endpoints
4. Add filtering and search functionality
5. Add file upload for event attachments
6. Implement email notifications
7. Add rate limiting and request validation
8. Add comprehensive logging

## License

MIT License - See LICENSE file for details

