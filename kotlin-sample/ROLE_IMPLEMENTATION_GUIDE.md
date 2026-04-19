# Role-Based Implementation Guide

## Overview
This guide explains how to implement role-specific features for each user type in the UTCN Extracurricular Events system.

## User Roles and Permissions

### STUDENT Role
Students can:
- Browse all events
- Register for events
- View their own registrations
- Cancel their own registrations
- Update their profile

#### Student Endpoints (Examples to implement)
```
GET    /api/events                    # Browse all events
GET    /api/events/{id}               # Get event details
GET    /api/registrations             # Get my registrations
POST   /api/registrations/{eventId}   # Register for event
DELETE /api/registrations/{eventId}   # Cancel registration
GET    /api/profile                   # Get my profile
PUT    /api/profile                   # Update my profile
```

### ORGANIZER Role
Organizers can:
- Create events
- Edit own events
- Delete own events
- View event participants
- Manage participant status
- View event statistics

#### Organizer Endpoints (Examples to implement)
```
GET    /api/events                    # Get my events
POST   /api/events                    # Create event
PUT    /api/events/{id}               # Update event
DELETE /api/events/{id}               # Delete event
GET    /api/events/{id}/participants  # Get event participants
PUT    /api/events/{id}/participants/{userId}  # Update participant status
GET    /api/events/{id}/statistics    # Get event statistics
```

### ADMIN Role
Admins can:
- Manage all users (view, create, update, delete)
- Manage departments and categories
- View all events (including deleted)
- Override permissions
- View platform statistics
- Access audit logs

#### Admin Endpoints (Examples to implement)
```
GET    /api/admin/users               # List all users
POST   /api/admin/users               # Create user
PUT    /api/admin/users/{id}          # Update user
DELETE /api/admin/users/{id}          # Delete user
GET    /api/admin/departments         # List departments
POST   /api/admin/departments         # Create department
PUT    /api/admin/departments/{id}    # Update department
DELETE /api/admin/departments/{id}    # Delete department
GET    /api/admin/categories          # List categories
POST   /api/admin/categories          # Create category
GET    /api/admin/statistics          # Platform statistics
```

## Implementation Pattern

### 1. Authorization Check in Controller
```kotlin
// Check role and respond with Forbidden if not authorized
if (!AuthorizationUtil.requireAdmin(call)) return@get

// Or check for multiple roles
if (!AuthorizationUtil.requireRole(call, UserRole.ORGANIZER, UserRole.ADMIN)) return@post
```

### 2. Authorization in Service Layer
```kotlin
class EventService(private val repository: EventRepository) {
    fun deleteEvent(userId: Long, eventId: Long, userRole: UserRole): Boolean {
        // Only allow organizer of event or admin
        val event = repository.getEvent(eventId) ?: return false
        if (userRole != UserRole.ADMIN && event.organizerId != userId) {
            throw IllegalArgumentException("You can only delete your own events")
        }
        return repository.deleteEvent(eventId)
    }
}
```

### 3. Middleware for Consistency
```kotlin
suspend inline fun <reified T : Any> authenticatedRequest(
    call: ApplicationCall,
    requireRoles: Array<UserRole> = arrayOf(),
    body: suspend (userId: Long, role: UserRole) -> T
) {
    val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
    val role = AuthorizationUtil.getUserRoleFromPrincipal(call)
    
    if (userId == null || role == null) {
        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid token"))
        return
    }
    
    if (requireRoles.isNotEmpty() && !AuthorizationUtil.hasRole(call, *requireRoles)) {
        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Insufficient permissions"))
        return
    }
    
    try {
        val result = body(userId, role)
        call.respond(result)
    } catch (e: Exception) {
        call.respond(HttpStatusCode.InternalServerError, 
            mapOf("error" to e.message.orEmpty()))
    }
}
```

## Example Implementation: Student Registration Feature

### Model
```kotlin
data class Registration(
    val id: Long,
    val studentId: Long,
    val eventId: Long,
    val status: String,  // REGISTERED, CANCELLED, ATTENDED
    val registeredAt: String,
    val cancelledAt: String? = null
)
```

### DAO
```kotlin
interface RegistrationDao {
    fun create(registration: Registration): Registration
    fun findById(id: Long): Registration?
    fun findByStudentId(studentId: Long): List<Registration>
    fun findByEventId(eventId: Long): List<Registration>
    fun delete(id: Long): Boolean
    fun findByStudentAndEvent(studentId: Long, eventId: Long): Registration?
    fun updateStatus(id: Long, status: String): Boolean
}
```

### Service
```kotlin
class RegistrationService(
    private val registrationDao: RegistrationDao,
    private val eventDao: EventDao
) {
    fun registerStudent(studentId: Long, eventId: Long): Registration {
        // Check if student already registered
        val existing = registrationDao.findByStudentAndEvent(studentId, eventId)
        if (existing != null) {
            throw IllegalArgumentException("Student already registered for this event")
        }
        
        // Check if event exists and has space
        val event = eventDao.findById(eventId)
            ?: throw IllegalArgumentException("Event not found")
        
        // Create registration
        val registration = Registration(
            id = 0,
            studentId = studentId,
            eventId = eventId,
            status = "REGISTERED",
            registeredAt = LocalDateTime.now().toString()
        )
        
        return registrationDao.create(registration)
    }
    
    fun getStudentRegistrations(studentId: Long): List<Registration> {
        return registrationDao.findByStudentId(studentId)
    }
    
    fun cancelRegistration(studentId: Long, registrationId: Long): Boolean {
        val registration = registrationDao.findById(registrationId)
            ?: return false
        
        // Only student or admin can cancel
        if (registration.studentId != studentId) {
            throw IllegalArgumentException("Can only cancel your own registration")
        }
        
        return registrationDao.updateStatus(registrationId, "CANCELLED")
    }
}
```

### Controller
```kotlin
class RegistrationController(
    private val registrationService: RegistrationService,
    private val authService: AuthService
) {
    fun register(routing: Route) {
        routing.route("/api/registrations") {
            // Get my registrations (Student)
            get {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@get call.respond(HttpStatusCode.Unauthorized, 
                        mapOf("error" to "Unauthorized"))
                
                try {
                    val registrations = registrationService.getStudentRegistrations(userId)
                    call.respond(registrations)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError,
                        mapOf("error" to e.message.orEmpty()))
                }
            }
            
            // Register for event (Student)
            post("/{eventId}") {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@post call.respond(HttpStatusCode.Unauthorized,
                        mapOf("error" to "Unauthorized"))
                
                val eventId = call.parameters["eventId"]?.toLongOrNull()
                    ?: return@post call.respond(HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid event ID"))
                
                try {
                    val registration = registrationService.registerStudent(userId, eventId)
                    call.respond(HttpStatusCode.Created, registration)
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.BadRequest,
                        mapOf("error" to e.message.orEmpty()))
                }
            }
            
            // Cancel registration (Student)
            delete("/{registrationId}") {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@delete call.respond(HttpStatusCode.Unauthorized,
                        mapOf("error" to "Unauthorized"))
                
                val registrationId = call.parameters["registrationId"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid registration ID"))
                
                try {
                    if (registrationService.cancelRegistration(userId, registrationId)) {
                        call.respond(HttpStatusCode.NoContent)
                    } else {
                        call.respond(HttpStatusCode.NotFound,
                            mapOf("error" to "Registration not found"))
                    }
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.Forbidden,
                        mapOf("error" to e.message.orEmpty()))
                }
            }
        }
    }
}
```

## Testing Role-Based Features

### Test Student Features
```bash
# Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@utcn.edu","password":"StudentPass123!"}' \
  | jq -r '.token')

# Register for event
curl -X POST http://localhost:8080/api/registrations/1 \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Get my registrations
curl -X GET http://localhost:8080/api/registrations \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Test Organizer Features
```bash
# Login as organizer
ORG_TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@utcn.edu","password":"OrganizerPass123!"}' \
  | jq -r '.token')

# Create event
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Event","description":"Test","date":"2026-06-15","category":"Workshop","department":"CS"}'

# Get event participants
curl -X GET http://localhost:8080/api/events/1/participants \
  -H "Authorization: Bearer $ORG_TOKEN"
```

### Test Admin Features
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@utcn.edu","password":"AdminPass123!"}' \
  | jq -r '.token')

# Get all users
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get platform statistics
curl -X GET http://localhost:8080/api/admin/statistics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Security Best Practices

1. **Always check authorization in the controller**
   - Don't rely only on service layer validation
   - Use `AuthorizationUtil` for consistent checks

2. **Validate user ownership before operations**
   - Ensure user can only modify their own data
   - Verify admin or owner status for sensitive operations

3. **Log sensitive operations**
   - Log all admin operations
   - Log permission denials
   - Maintain audit trail

4. **Use prepared statements**
   - All DAO methods use prepared statements
   - Prevents SQL injection

5. **Validate input thoroughly**
   - Check all parameters
   - Validate role enum values
   - Sanitize user input

## Next Steps

1. Implement registration feature (DAO, Service, Controller)
2. Implement event management for organizers
3. Implement admin user management
4. Implement audit logging
5. Add rate limiting
6. Add request validation
7. Add email notifications
8. Implement event statistics

