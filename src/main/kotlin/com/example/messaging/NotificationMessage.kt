package com.example.messaging
import kotlinx.serialization.Serializable
@Serializable
data class NotificationMessage(
    val eventType: String,
    val userId: Long,
    val userEmail: String,
    val payload: Map<String, String> = emptyMap()
)
