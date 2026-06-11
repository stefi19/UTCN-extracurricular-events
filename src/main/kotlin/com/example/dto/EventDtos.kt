package com.example.dto
import kotlinx.serialization.Serializable
@Serializable
data class EventRequest(
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String,
    val organizerId: Long? = null,
    val categoryId: Long? = null,
    val location: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val maxParticipants: Int? = null
)
@Serializable
data class EventResponse(
    val id: Long,
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String,
    val organizerId: Long? = null,
    val organizerName: String? = null,
    val categoryId: Long? = null,
    val location: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val maxParticipants: Int? = null,
    val registeredCount: Int = 0,
    val waitlistedCount: Int = 0,
    val availableSeats: Int? = null
)
