package com.example.model

data class ReminderOutboxItem(
    val id: Long,
    val registrationId: Long,
    val studentId: Long,
    val eventId: Long,
    val recipientEmail: String,
    val eventTitle: String,
    val eventDate: String,
    val eventStartTime: String? = null,
    val eventLocation: String? = null,
    val eventCategory: String? = null,
    val eventDepartment: String? = null,
    val studentFirstName: String? = null,
    val sendAt: String,
    val status: String,
    val attemptCount: Int = 0
)
