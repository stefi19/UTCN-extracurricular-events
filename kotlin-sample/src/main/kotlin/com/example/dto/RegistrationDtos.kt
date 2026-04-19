package com.example.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegistrationRequest(
    val eventId: Long
)

@Serializable
data class RegistrationResponse(
    val id: Long,
    val studentId: Long,
    val eventId: Long,
    val status: String,
    val registeredAt: String? = null,
    val cancelledAt: String? = null
)
