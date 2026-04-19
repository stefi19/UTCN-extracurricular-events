package com.example.service

import com.example.db.dao.UserDao
import com.example.model.*
import com.example.security.JwtManager
import com.example.security.PasswordUtil

class AuthService(
    private val userDao: UserDao,
    private val jwtManager: JwtManager
) {
    fun register(request: UserRegisterRequest): AuthResponse {
        // Check if user already exists
        val existingUser = userDao.findByEmail(request.email)
        if (existingUser != null) {
            throw IllegalArgumentException("User with email ${request.email} already exists")
        }

        // Validate email format
        if (!isValidEmail(request.email)) {
            throw IllegalArgumentException("Invalid email format")
        }

        // Validate password strength
        if (!isValidPassword(request.password)) {
            throw IllegalArgumentException("Password must be at least 8 characters long and contain uppercase, lowercase, digit, and special character")
        }

        // Validate names
        if (request.firstName.isBlank() || request.lastName.isBlank()) {
            throw IllegalArgumentException("First name and last name cannot be empty")
        }

        // Hash password
        val passwordHash = PasswordUtil.hashPassword(request.password)

        // Create user
        val user = User(
            id = 0,
            email = request.email,
            passwordHash = passwordHash,
            firstName = request.firstName,
            lastName = request.lastName,
            role = request.role,
            departmentId = request.departmentId,
            isActive = true
        )

        val createdUser = userDao.create(user)

        // Generate token
        val token = jwtManager.generateToken(createdUser.id, createdUser.email, createdUser.role)

        return AuthResponse(
            token = token,
            user = createdUser.toResponse()
        )
    }

    fun login(request: UserLoginRequest): AuthResponse {
        // Find user by email
        val user = userDao.findByEmail(request.email)
            ?: throw IllegalArgumentException("Invalid email or password")

        // Check if user is active
        if (!user.isActive) {
            throw IllegalArgumentException("User account is inactive")
        }

        // Verify password
        if (!PasswordUtil.verifyPassword(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid email or password")
        }

        // Generate token
        val token = jwtManager.generateToken(user.id, user.email, user.role)

        return AuthResponse(
            token = token,
            user = user.toResponse()
        )
    }

    fun validateToken(token: String): JwtClaims? {
        return jwtManager.verifyToken(token)
    }

    fun getUserById(id: Long): UserResponse? {
        return userDao.findById(id)?.toResponse()
    }

    fun updateUser(id: Long, firstName: String?, lastName: String?, departmentId: Long?): UserResponse? {
        val user = userDao.findById(id) ?: return null

        val updatedUser = user.copy(
            firstName = firstName ?: user.firstName,
            lastName = lastName ?: user.lastName,
            departmentId = departmentId ?: user.departmentId
        )

        return userDao.update(id, updatedUser)?.toResponse()
    }

    fun getUsersByRole(role: UserRole): List<UserResponse> {
        return userDao.findByRole(role).map { it.toResponse() }
    }

    private fun isValidEmail(email: String): Boolean {
        val emailRegex = "^[A-Za-z0-9+_.-]+@(.+)\$".toRegex()
        return emailRegex.matches(email)
    }

    private fun isValidPassword(password: String): Boolean {
        if (password.length < 8) return false
        if (!password.any { it.isUpperCase() }) return false
        if (!password.any { it.isLowerCase() }) return false
        if (!password.any { it.isDigit() }) return false
        if (!password.any { !it.isLetterOrDigit() && it !in listOf('-', '_') }) return false
        return true
    }

    private fun User.toResponse() = UserResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        departmentId = departmentId
    )
}

