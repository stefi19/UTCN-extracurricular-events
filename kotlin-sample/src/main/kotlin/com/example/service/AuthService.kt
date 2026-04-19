package com.example.service

import com.example.db.dao.UserDao
import com.example.dto.AuthResponse
import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.dto.UserResponse
import com.example.model.User
import com.example.model.UserRole
import com.example.security.JwtManager
import com.example.security.PasswordUtil

class AuthService(
    private val userDao: UserDao,
    private val jwtManager: JwtManager
) {
    fun register(request: RegisterRequest): AuthResponse {
        val existingUser = userDao.findByEmail(request.email)
        if (existingUser != null) {
            throw IllegalArgumentException("User with email ${request.email} already exists")
        }

        if (!isValidEmail(request.email)) {
            throw IllegalArgumentException("Invalid email format")
        }

        if (!isValidPassword(request.password)) {
            throw IllegalArgumentException("Password must be at least 8 characters with uppercase, lowercase, digit, and special character")
        }

        if (request.firstName.isBlank() || request.lastName.isBlank()) {
            throw IllegalArgumentException("First name and last name cannot be empty")
        }

        val role = try {
            UserRole.valueOf(request.role.uppercase())
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Invalid role: ${request.role}")
        }

        val passwordHash = PasswordUtil.hashPassword(request.password)

        val user = User(
            id = 0,
            email = request.email,
            passwordHash = passwordHash,
            firstName = request.firstName,
            lastName = request.lastName,
            role = role,
            departmentId = request.departmentId,
            isActive = true
        )

        val createdUser = userDao.create(user)
        val token = jwtManager.generateToken(createdUser.id, createdUser.email, createdUser.role)

        return AuthResponse(
            token = token,
            user = createdUser.toResponse()
        )
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userDao.findByEmail(request.email)
            ?: throw IllegalArgumentException("Invalid email or password")

        if (!user.isActive) {
            throw IllegalArgumentException("User account is inactive")
        }

        if (!PasswordUtil.verifyPassword(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid email or password")
        }

        val token = jwtManager.generateToken(user.id, user.email, user.role)

        return AuthResponse(
            token = token,
            user = user.toResponse()
        )
    }

    fun getUserById(id: Long): UserResponse? {
        return userDao.findById(id)?.toResponse()
    }

    fun getUsersByRole(role: UserRole): List<UserResponse> {
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
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role.name,
        departmentId = departmentId
    )
}
