# Quick Start Guide - UTCN Events Authentication

## 🚀 Start Application in 3 Steps

### Step 1: Start Database
```bash
cd kotlin-sample
docker-compose up -d
```

Wait ~10 seconds for PostgreSQL to start.

### Step 2: Build
```bash
./gradlew build -x test
```

### Step 3: Run
```bash
./gradlew run
```

✅ Server is running at **http://localhost:8080**

---

## 🧪 Quick API Test

### 1️⃣ Register
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@utcn.edu",
    "password": "Student123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@utcn.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }
}
```

### 2️⃣ Save Token
```bash
TOKEN="<token_from_response>"
```

### 3️⃣ Get Profile
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4️⃣ Create Event (Organizer)
```bash
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Kotlin Workshop",
    "description": "Learn Kotlin",
    "date": "2026-06-15",
    "category": "Workshop",
    "department": "CS"
  }'
```

### 5️⃣ List Events
```bash
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Create Test Users

### Admin
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@utcn.edu",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### Organizer
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@utcn.edu",
    "password": "Organizer123!",
    "firstName": "Jane",
    "lastName": "Organizer",
    "role": "ORGANIZER"
  }'
```

---

## 🔐 Password Requirements

- ✅ At least 8 characters
- ✅ At least 1 UPPERCASE letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 digit
- ✅ At least 1 special character (!@#$%^&*-)

**Example:** `MyPassword123!`

---

## 📚 Complete API Endpoints

### Auth (Public)
```
POST   /auth/register           Register new user
POST   /auth/login              Login and get token
GET    /auth/me                 Get current profile (protected)
```

### Users (Admin Only)
```
GET    /api/users               Get all users
GET    /api/users/{role}        Get users by role
```

### Events (Protected)
```
GET    /api/events              List all events
GET    /api/events/{id}         Get event details
POST   /api/events              Create event
PUT    /api/events/{id}         Update event
DELETE /api/events/{id}         Delete event
```

### Registrations (Protected)
```
GET    /api/registrations       My registrations
POST   /api/registrations       Register for event
DELETE /api/registrations/{id}  Cancel registration
```

---

## 🛑 Stop Application

### Stop Server
```bash
# Press Ctrl+C in terminal running gradlew
```

### Stop Database
```bash
docker-compose down
```

### Remove Data
```bash
docker-compose down -v
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Run `docker-compose up -d` and wait 10s |
| Build fails | Run `./gradlew clean` first |
| Invalid token | Token expires after 24 hours, re-login |
| Port 8080 in use | Kill process: `lsof -i :8080` |
| Port 5432 in use | Kill process: `lsof -i :5432` |

---

## 📖 Documentation

- **AUTHENTICATION_SETUP.md** - Full setup guide
- **ROLE_IMPLEMENTATION_GUIDE.md** - Role-based features
- **IMPLEMENTATION_SUMMARY.md** - Complete overview
- **test-api.sh** - Automated tests

---

## 💾 Database Access

**pgAdmin UI:**
- URL: http://localhost:5050
- Email: admin@example.com
- Password: admin

**Direct Connection:**
- Host: localhost
- Port: 5432
- Database: utcnevents
- User: postgres
- Password: postgres

---

## 📝 Environment Variables

Create `.env` file in `kotlin-sample/`:
```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/utcnevents
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=your-secure-secret-key-here
EVENTS_STORAGE=postgres
```

---

## ✅ What's Working

✅ User registration with email validation
✅ Password hashing with BCrypt
✅ JWT token authentication
✅ Role-based authorization (STUDENT, ORGANIZER, ADMIN)
✅ Event CRUD operations
✅ Event registration system
✅ User management for admins
✅ PostgreSQL integration with Flyway migrations
✅ Docker Compose for easy setup
✅ Comprehensive error handling

---

## 🚀 Next Steps

1. **Frontend**: Build React/Vue client
2. **Advanced Features**: Search, filters, notifications
3. **Testing**: Add comprehensive test suite
4. **Deployment**: Set up CI/CD pipeline

---

**Happy coding! 🎉**

