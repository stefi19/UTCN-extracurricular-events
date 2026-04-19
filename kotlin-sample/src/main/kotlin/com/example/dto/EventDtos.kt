package com.example.dto

import kotlinx.serialization.Serializable

@Serializable
data class EventRequest(
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String
)

@Serializable
data class EventResponse(
    val id: Long,
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String
)
