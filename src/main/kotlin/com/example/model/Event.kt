package com.example.model
data class Event(
    val id: Long,
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
