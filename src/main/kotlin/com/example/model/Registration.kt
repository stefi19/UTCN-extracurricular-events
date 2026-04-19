package com.example.model

data class Registration(
    val id: Long,
    val studentId: Long,
    val eventId: Long,
    val status: String = "REGISTERED",
    val registeredAt: String? = null,
    val cancelledAt: String? = null
)
