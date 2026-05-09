package com.example.service

import com.example.db.dao.UserDao
import com.example.dto.AuthResponse
import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.dto.UserResponse
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
import com.example.model.User
import com.example.model.UserRole
import com.example.security.JwtManager
import com.example.security.PasswordUtil
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory

class AuthService(
    private val userDao: UserDao,
    private val jwtManager: JwtManager,
    private val notificationPublisher: NotificationPublisher? = null
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)

    fun register(request: RegisterRequest): AuthResponse {
        logger.info("Registering user email={}", request.email)

        if (!isValidEmail(request.email)) {
            throw IllegalArgumentException("Invalid email format")
        }
        if (!isValidPassword(request.password)) {
            throw IllegalArgumentException("Password must be at least 8 characters with uppercase, lowercase, digit, and special character")
        }
        if (request.firstName.isBlank() || request.lastName.isBlank()) {
            throw IllegalArgumentException("First name and last name cannot be empty")
        }

        val existingUser = userDao.findByEmail(request.email)
        if (existingUser != null) {
            logger.warn("Registration failed: email={} already exists", request.email)
            throw IllegalArgumentException("User with email ${request.email} already exists")
        }

        val role = try {
            UserRole.valueOf(request.role.uppercase())
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Invalid role: ${request.role}")
        }

        val passwordHash = PasswordUtil.hashPassword(request.password)
        val user = User(
            id = 0, email = request.email, passwordHash = passwordHash,
            firstName = request.firstName, lastName = request.lastName,
            role = role, departmentId = request.departmentId, isActive = true
        )

        val createdUser = userDao.create(user)
        val token = jwtManager.generateToken(createdUser.id, createdUser.email, createdUser.role)
        logger.info("Registered user id={} role={}", createdUser.id, createdUser.role)

        runBlocking {
            notificationPublisher?.publish(
                NotificationMessage(
                    eventType = "USER_REGISTERED",
                    userId = createdUser.id,
                    userEmail = createdUser.email,
                    payload = mapOf("firstName" to createdUser.firstName, "lastName" to createdUser.lastName)
                )
            )
        }

        return AuthResponse(token = token, user = createdUser.toResponse())
    }

    fun login(request: LoginRequest): AuthResponse {
        logger.info("Login attempt email={}", request.email)

        require(request.email.isNotBlank()) { "Email must not be blank" }
        require(request.password.isNotBlank()) { "Password must not be blank" }

        val user = userDao.findByEmail(request.email)
            ?: throw IllegalArgumentException("Invalid email or password")

        if (!user.isActive) {
            logger.warn("Login failed: inactive user email={}", request.email)
            throw IllegalArgumentException("User account is inactive")
        }

        if (!PasswordUtil.verifyPassword(request.password, user.passwordHash)) {
            logger.warn("Login failed: bad password for email={}", request.email)
            throw IllegalArgumentException("Invalid email or password")
        }

        val token = jwtManager.generateToken(user.id, user.email, user.role)
        logger.info("Login successful userId={}", user.id)
        return AuthResponse(token = token, user = user.toResponse())
    }

    fun getUserById(id: Long): UserResponse? {
        logger.info("Getting user id={}", id)
        return userDao.findById(id)?.toResponse()
    }

    fun getUsersByRole(role: UserRole): List<UserResponse> {
        logger.info("Getting users by role={}", role)
        return userDao.findByRole(role).map { it.toResponse() }
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
