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
