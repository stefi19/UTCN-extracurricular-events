package com.example.model

enum class UserRole {
    STUDENT, ORGANIZER, ADMIN
}

data class User(
    val id: Long,
    val email: String,
    val passwordHash: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val departmentId: Long? = null,
    val isActive: Boolean = true,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class UserRegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole = UserRole.STUDENT,
    val departmentId: Long? = null
)

data class UserLoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val user: UserResponse
)

data class UserResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val departmentId: Long? = null
)

data class JwtClaims(
    val userId: Long,
    val email: String,
    val role: UserRole
)

