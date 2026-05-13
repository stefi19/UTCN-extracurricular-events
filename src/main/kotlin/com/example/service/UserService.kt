package com.example.service
import com.example.db.dao.UserDao
import com.example.dto.CreateOrganizerRequest
import com.example.dto.UserResponse
import com.example.model.User
import com.example.model.UserRole
import com.example.security.PasswordUtil
import org.slf4j.LoggerFactory
class UserService(private val userDao: UserDao) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    fun findAll(): Map<String, List<UserResponse>> {
        logger.info("Listing all users grouped by role")
        val students = userDao.findByRole(UserRole.STUDENT).map { it.toResponse() }
        val organizers = userDao.findByRole(UserRole.ORGANIZER).map { it.toResponse() }
        val admins = userDao.findByRole(UserRole.ADMIN).map { it.toResponse() }
        return mapOf("students" to students, "organizers" to organizers, "admins" to admins)
    }
    fun findByRole(role: UserRole): List<UserResponse> {
        logger.info("Getting users by role={}", role)
        return userDao.findByRole(role).map { it.toResponse() }
    }
    fun findById(id: Long): UserResponse? {
        logger.info("Getting user id={}", id)
        return userDao.findById(id)?.toResponse()
    }
    fun createOrganizer(request: CreateOrganizerRequest): UserResponse {
        logger.info("Creating organizer account email={}", request.email)
        require(request.firstName.isNotBlank()) { "First name cannot be empty" }
        require(request.lastName.isNotBlank()) { "Last name cannot be empty" }
        require(isValidEmail(request.email)) { "Invalid email format" }
        require(isValidPassword(request.password)) {
            "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
        }
        if (userDao.findByEmail(request.email) != null) {
            throw IllegalArgumentException("User with email ${request.email} already exists")
        }
        val organizer = User(
            id = 0,
            email = request.email.trim(),
            passwordHash = PasswordUtil.hashPassword(request.password),
            firstName = request.firstName.trim(),
            lastName = request.lastName.trim(),
            role = UserRole.ORGANIZER,
            departmentId = request.departmentId,
            isActive = true
        )
        val created = userDao.create(organizer)
        logger.info("Created organizer user id={}", created.id)
        return created.toResponse()
    }
    private fun isValidEmail(email: String): Boolean {
        val emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
        return emailRegex.matches(email)
    }
    private fun isValidPassword(password: String): Boolean {
        if (password.length < 8) return false
        if (!password.any { it.isUpperCase() }) return false
        if (!password.any { it.isLowerCase() }) return false
        if (!password.any { it.isDigit() }) return false
        if (!password.any { !it.isLetterOrDigit() }) return false
        return true
    }
    private fun User.toResponse() = UserResponse(
        id = id, email = email, firstName = firstName,
        lastName = lastName, role = role.name, departmentId = departmentId
    )
}
