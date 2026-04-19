# API Endpoints Specification - UTCN Events Platform

## Base URL
```
http://localhost:8080
```

## Authentication Endpoints

### Register New User
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "departmentId": null
}

Response (201 Created):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "departmentId": null
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "departmentId": null
  }
}
```

### Get Current User Profile
```
GET /auth/me
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "departmentId": null
}
```

## Event Endpoints

### Get All Events
```
GET /api/events
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "title": "Kotlin Workshop",
    "description": "Learn modern Kotlin",
    "date": "2026-06-15",
    "category": "Workshop",
    "department": "Computer Science"
  }
]
```

### Get Event by ID
```
GET /api/events/{id}
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "id": 1,
  "title": "Kotlin Workshop",
  "description": "Learn modern Kotlin",
  "date": "2026-06-15",
  "category": "Workshop",
  "department": "Computer Science"
}
```

### Create Event (Organizer/Admin)
```
POST /api/events
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "title": "Kotlin Workshop",
  "description": "Learn modern Kotlin",
  "date": "2026-06-15",
  "category": "Workshop",
  "department": "Computer Science"
}

Response (201 Created):
{
  "id": 1,
  "title": "Kotlin Workshop",
  "description": "Learn modern Kotlin",
  "date": "2026-06-15",
  "category": "Workshop",
  "department": "Computer Science"
}
```

### Update Event (Organizer/Admin)
```
PUT /api/events/{id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "title": "Kotlin Workshop - Updated",
  "description": "Learn modern Kotlin - Updated",
  "date": "2026-06-16",
  "category": "Workshop",
  "department": "Computer Science"
}

Response (200 OK):
{
  "id": 1,
  "title": "Kotlin Workshop - Updated",
  "description": "Learn modern Kotlin - Updated",
  "date": "2026-06-16",
  "category": "Workshop",
  "department": "Computer Science"
}
```

### Delete Event (Organizer/Admin)
```
DELETE /api/events/{id}
Authorization: Bearer <JWT_TOKEN>

Response (204 No Content)
```

## Registration Endpoints

### Get My Registrations (Student)
```
GET /api/registrations
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "studentId": 5,
    "eventId": 1,
    "status": "REGISTERED",
    "registeredAt": "2026-04-19T12:00:00",
    "cancelledAt": null
  }
]
```

### Register for Event (Student)
```
POST /api/registrations
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "eventId": 1
}

Response (201 Created):
{
  "id": 1,
  "studentId": 5,
  "eventId": 1,
  "status": "REGISTERED",
  "registeredAt": "2026-04-19T12:00:00",
  "cancelledAt": null
}
```

### Cancel Registration (Student)
```
DELETE /api/registrations/{registrationId}
Authorization: Bearer <JWT_TOKEN>

Response (204 No Content)
```

### Get Event Participants (Organizer/Admin)
```
GET /api/registrations/event/{eventId}
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "studentId": 5,
    "eventId": 1,
    "status": "REGISTERED",
    "registeredAt": "2026-04-19T12:00:00",
    "cancelledAt": null
  }
]
```

### Update Registration Status (Organizer/Admin)
```
PUT /api/registrations/{registrationId}/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "status": "ATTENDED"
}

Response (204 No Content)

Valid Status Values: REGISTERED, CANCELLED, ATTENDED, NO_SHOW
```

## User Management Endpoints (Admin Only)

### Get All Users
```
GET /api/users
Authorization: Bearer <JWT_TOKEN> (Admin)

Response (200 OK):
{
  "students": [
    {
      "id": 5,
      "email": "student@utcn.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "departmentId": 1
    }
  ],
  "organizers": [
    {
      "id": 6,
      "email": "organizer@utcn.edu",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "ORGANIZER",
      "departmentId": 2
    }
  ],
  "admins": [
    {
      "id": 7,
      "email": "admin@utcn.edu",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "departmentId": null
    }
  ]
}
```

### Get Users by Role
```
GET /api/users/{role}
Authorization: Bearer <JWT_TOKEN> (Admin)

Path Parameters:
- role: STUDENT | ORGANIZER | ADMIN

Response (200 OK):
[
  {
    "id": 5,
    "email": "student@utcn.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "departmentId": 1
  }
]
```

## Administrative Endpoints (Admin Only)

### Get All Categories
```
GET /api/admin/categories
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "name": "Workshop"
  },
  {
    "id": 2,
    "name": "Conference"
  }
]
```

### Create Category
```
POST /api/admin/categories
Authorization: Bearer <JWT_TOKEN> (Admin)
Content-Type: application/json

Request Body:
{
  "name": "Workshop"
}

Response (201 Created):
{
  "id": 1,
  "name": "Workshop"
}
```

### Update Category
```
PUT /api/admin/categories/{id}
Authorization: Bearer <JWT_TOKEN> (Admin)
Content-Type: application/json

Request Body:
{
  "name": "Workshop - Updated"
}

Response (200 OK):
{
  "id": 1,
  "name": "Workshop - Updated"
}
```

### Delete Category
```
DELETE /api/admin/categories/{id}
Authorization: Bearer <JWT_TOKEN> (Admin)

Response (204 No Content)
```

### Get All Departments
```
GET /api/admin/departments
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
[
  {
    "id": 1,
    "name": "Computer Science"
  },
  {
    "id": 2,
    "name": "Engineering"
  }
]
```

### Create Department
```
POST /api/admin/departments
Authorization: Bearer <JWT_TOKEN> (Admin)
Content-Type: application/json

Request Body:
{
  "name": "Computer Science"
}

Response (201 Created):
{
  "id": 1,
  "name": "Computer Science"
}
```

### Update Department
```
PUT /api/admin/departments/{id}
Authorization: Bearer <JWT_TOKEN> (Admin)
Content-Type: application/json

Request Body:
{
  "name": "Computer Science - Updated"
}

Response (200 OK):
{
  "id": 1,
  "name": "Computer Science - Updated"
}
```

### Delete Department
```
DELETE /api/admin/departments/{id}
Authorization: Bearer <JWT_TOKEN> (Admin)

Response (204 No Content)
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid JWT |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

Token expires after 24 hours. To continue using the API, re-login to get a new token.

## Error Responses

```json
{
  "error": "Meaningful error message"
}
```

## Role-Based Access Control

| Endpoint | STUDENT | ORGANIZER | ADMIN |
|----------|---------|-----------|-------|
| GET /api/events | ✓ | ✓ | ✓ |
| POST /api/events | ✗ | ✓ | ✓ |
| PUT /api/events/{id} | ✗ | ✓* | ✓ |
| DELETE /api/events/{id} | ✗ | ✓* | ✓ |
| GET /api/registrations | ✓ | ✓ | ✓ |
| POST /api/registrations | ✓ | ✓ | ✓ |
| DELETE /api/registrations/{id} | ✓* | ✓ | ✓ |
| GET /api/users | ✗ | ✗ | ✓ |
| GET /api/admin/categories | ✗ | ✗ | ✓ |
| POST /api/admin/categories | ✗ | ✗ | ✓ |
| PUT /api/admin/categories/{id} | ✗ | ✗ | ✓ |
| DELETE /api/admin/categories/{id} | ✗ | ✗ | ✓ |
| GET /api/admin/departments | ✗ | ✗ | ✓ |
| POST /api/admin/departments | ✗ | ✗ | ✓ |
| PUT /api/admin/departments/{id} | ✗ | ✗ | ✓ |
| DELETE /api/admin/departments/{id} | ✗ | ✗ | ✓ |

\* Only for own resources

