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
@Serializable
data class ParticipantDetailsResponse(
    val id: Long,
    val studentId: Long,
    val studentFirstName: String,
    val studentLastName: String,
    val studentEmail: String,
    val eventId: Long,
    val status: String,
    val registeredAt: String? = null,
    val cancelledAt: String? = null
)
