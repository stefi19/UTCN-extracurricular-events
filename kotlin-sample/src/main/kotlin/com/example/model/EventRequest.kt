package com.example.model

import kotlinx.serialization.Serializable

@Serializable
data class EventRequest(
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String
)

