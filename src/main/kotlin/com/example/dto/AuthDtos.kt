package com.example.dto
import kotlinx.serialization.Serializable
@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val role: String = "STUDENT",
    val departmentId: Long? = null
)
@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)
@Serializable
data class AuthResponse(
    val token: String,
    val user: UserResponse
)
