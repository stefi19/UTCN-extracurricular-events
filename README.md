# 🎓 UTCN Extracurricular Events Platform

> A comprehensive platform for managing and discovering extracurricular events at the Technical University of Cluj-Napoca

## 📋 Project Overview

This is a modern client-server application built with **Kotlin** and **Ktor** that provides:

- 🔐 **Secure authentication** with JWT tokens
- 👥 **Role-based access control** for Students, Organizers, and Admins
- 📅 **Event management system** for creating and discovering events
- ✅ **Event registration** with participant tracking
- 🔒 **Enterprise-grade security** with password hashing and authorization

## ⚡ Quick Start

### Prerequisites
- **JDK 17+**
- **Docker & Docker Compose**
- **Gradle** (included via wrapper)

### Run in 3 Steps

```bash
# 1. Start PostgreSQL
cd kotlin-sample
docker-compose up -d

# 2. Build
./gradlew build -x test

# 3. Run
./gradlew run
```

✅ API available at **http://localhost:8080**

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [`DEPLOYMENT_READY.md`](./DEPLOYMENT_READY.md) | **Executive summary** - Start here! |
| [`kotlin-sample/QUICK_START.md`](./kotlin-sample/QUICK_START.md) | **5-minute setup guide** |
| [`kotlin-sample/AUTHENTICATION_SETUP.md`](./kotlin-sample/AUTHENTICATION_SETUP.md) | Complete setup & API reference |
| [`kotlin-sample/ROLE_IMPLEMENTATION_GUIDE.md`](./kotlin-sample/ROLE_IMPLEMENTATION_GUIDE.md) | Role-based features |
| [`kotlin-sample/IMPLEMENTATION_SUMMARY.md`](./kotlin-sample/IMPLEMENTATION_SUMMARY.md) | Technical overview |
| [`kotlin-sample/IMPLEMENTATION_CHECKLIST.md`](./kotlin-sample/IMPLEMENTATION_CHECKLIST.md) | What's implemented |

## 🚀 Features

### Authentication & Security
- ✅ User registration with email validation
- ✅ Secure login with JWT tokens (24-hour expiration)
- ✅ BCrypt password hashing (12 salt rounds)
- ✅ Strong password enforcement
- ✅ Role-based authorization

### User Roles
- **Student**: Browse events, register for events, manage registrations
- **Organizer**: Create and manage events, view participants
- **Admin**: Manage users, departments, categories, supervise platform

### Event Management
- ✅ CRUD operations for events
- ✅ Event registration system
- ✅ Participant tracking
- ✅ Registration status management

### Database
- ✅ PostgreSQL 15 integration
- ✅ Flyway migrations for version control
- ✅ Proper indexing and constraints
- ✅ Connection pooling with HikariCP

## 🏗️ Architecture

### Layered Architecture
```
Controllers (HTTP)
    ↓
Services (Business Logic)
    ↓
DAOs (Database Access)
    ↓
PostgreSQL (Data)
```

### Components
- **Controllers**: Handle HTTP requests/responses
- **Services**: Implement business logic
- **DAOs**: Manage database operations
- **Security**: JWT and password management
- **Models**: Data structures

## 🔐 Security

### Password Security
- Minimum 8 characters
- Contains uppercase, lowercase, digit, special character
- BCrypt hashing with 12 salt rounds
- Never stored in plain text

### API Security
- JWT authentication on all protected endpoints
- Role-based authorization checks
- SQL injection prevention with prepared statements
- Resource ownership validation

### Database Security
- Foreign key constraints
- Proper access control
- Audit timestamps
- Connection pooling

## 📊 API Endpoints

### Authentication (Public)
```
POST   /auth/register     Register new user
POST   /auth/login        Login and receive JWT
GET    /auth/me           Get current user (protected)
```

### User Management (Admin)
```
GET    /api/users         Get all users
GET    /api/users/{role}  Get users by role
```

### Events (Protected)
```
GET    /api/events        List all events
POST   /api/events        Create event
PUT    /api/events/{id}   Update event
DELETE /api/events/{id}   Delete event
```

### Registrations (Protected)
```
GET    /api/registrations              Get my registrations
POST   /api/registrations              Register for event
DELETE /api/registrations/{id}         Cancel registration
GET    /api/registrations/event/{id}   Get event participants
```

## 🧪 Testing

### Automated Testing
```bash
./kotlin-sample/test-api.sh
```

This tests:
- User registration (all roles)
- Login functionality
- Role-based authorization
- Event creation
- API access control

### Manual Testing
See QUICK_START.md for cURL examples

## 🐳 Docker Setup

### Start Services
```bash
cd kotlin-sample
docker-compose up -d
```

### Access pgAdmin (Database UI)
- **URL**: http://localhost:5050
- **Email**: admin@example.com
- **Password**: admin

### Stop Services
```bash
docker-compose down
```

## 📁 Project Structure

```
project-stefi19/
├── docs/
│   └── README.md
├── kotlin-sample/
│   ├── src/main/kotlin/com/example/
│   │   ├── controller/        (HTTP handlers)
│   │   ├── service/           (Business logic)
│   │   ├── db/dao/            (Database access)
│   │   ├── model/             (Data models)
│   │   ├── security/          (Auth utilities)
│   │   └── repository/        (Repository pattern)
│   ├── src/main/resources/db/migration/
│   │   ├── V1__create_events_table.sql
│   │   ├── V2__create_users_table.sql
│   │   └── V3__create_registrations_table.sql
│   ├── build.gradle.kts
│   ├── docker-compose.yml
│   ├── test-api.sh
│   └── documentation/*.md
└── DEPLOYMENT_READY.md
```

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Language** | Kotlin | 1.9.10 |
| **Framework** | Ktor | 2.3.12 |
| **Database** | PostgreSQL | 15 |
| **Auth** | JWT | Auth0 4.4.0 |
| **Hashing** | BCrypt | 0.4 |
| **Build** | Gradle | 8.10.2 |
| **JDK** | 17+ | Required |

## 📋 Requirements Met

### Core Features ✅
- [x] User registration and login
- [x] JWT-based authentication
- [x] Role-based authorization
- [x] Event management
- [x] Event registration system
- [x] User profile management

### Security ✅
- [x] Password hashing with BCrypt
- [x] JWT token authentication
- [x] Role-based access control
- [x] SQL injection prevention
- [x] Input validation
- [x] Resource ownership checks

### Infrastructure ✅
- [x] PostgreSQL database
- [x] Flyway migrations
- [x] Docker Compose setup
- [x] Environment-based configuration
- [x] Connection pooling

### Documentation ✅
- [x] Setup guides
- [x] API reference
- [x] Code examples
- [x] Troubleshooting
- [x] Implementation guides

## 🚦 Getting Started

### Step 1: Read Documentation
Start with [`DEPLOYMENT_READY.md`](./DEPLOYMENT_READY.md) for overview
Then see [`kotlin-sample/QUICK_START.md`](./kotlin-sample/QUICK_START.md) for setup

### Step 2: Setup Environment
```bash
cd kotlin-sample
docker-compose up -d
```

### Step 3: Build & Run
```bash
./gradlew build -x test
./gradlew run
```

### Step 4: Test API
```bash
./test-api.sh
```

### Step 5: Start Developing
See ROLE_IMPLEMENTATION_GUIDE.md for adding features

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure `docker-compose up -d` is running |
| Build fails | Run `./gradlew clean` first |
| Port in use | Kill process on port 8080 or 5432 |
| Database error | Check PostgreSQL is healthy: `docker-compose ps` |

For more help, see QUICK_START.md troubleshooting section.

## 📈 What's Implemented

### Phase 1 ✅ (Complete)
- User authentication (registration & login)
- JWT token generation and validation
- Role-based authorization
- Event CRUD operations
- Event registration system
- User management for admins

### Phase 2 📋 (Future)
- Email notifications
- Event search and filtering
- Advanced analytics
- Frontend application

### Phase 3 📋 (Future)
- Mobile app
- Social features
- File uploads
- Payment integration

## 👥 User Roles

### 👨‍🎓 Student
Can:
- Browse all events
- Register for events
- View personal registrations
- Cancel registrations
- Update profile

### 👩‍🏫 Organizer
Can:
- Create events
- Edit own events
- Delete own events
- View event participants
- Manage participant status

### 🔐 Admin
Can:
- Manage all users
- Manage departments and categories
- View all events
- Access admin dashboard
- Full platform control

## 🔗 Quick Links

- 📚 [Full Documentation](./kotlin-sample/AUTHENTICATION_SETUP.md)
- 🚀 [Quick Start Guide](./kotlin-sample/QUICK_START.md)
- 🏗️ [Implementation Summary](./kotlin-sample/IMPLEMENTATION_SUMMARY.md)
- 📋 [Checklist](./kotlin-sample/IMPLEMENTATION_CHECKLIST.md)
- 🎯 [Deployment Ready](./DEPLOYMENT_READY.md)

## 📞 Support

- Check the documentation in `kotlin-sample/` directory
- Review QUICK_START.md for common issues
- See test-api.sh for working examples
- Check src/ comments for code explanations

## 📄 License

MIT License - See LICENSE file for details

## 🎊 Status

✅ **Project Status**: COMPLETE AND DEPLOYMENT READY

- Build: ✅ Passing
- Security: ✅ High
- Documentation: ✅ Comprehensive
- Testing: ✅ Ready

---

**Ready to get started?** Read [`DEPLOYMENT_READY.md`](./DEPLOYMENT_READY.md) first!

