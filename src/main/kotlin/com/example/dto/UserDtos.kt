package com.example.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val departmentId: Long? = null
)

@Serializable
data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val currentPassword: String? = null,
    val newPassword: String? = null
)

@Serializable
data class CreateOrganizerRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val departmentId: Long? = null
)
