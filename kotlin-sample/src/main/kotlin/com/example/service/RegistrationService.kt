package com.example.service

import com.example.db.dao.EventDao
import com.example.db.dao.RegistrationDao
import com.example.dto.RegistrationResponse
import com.example.model.Registration

class RegistrationService(
    private val registrationDao: RegistrationDao,
    private val eventDao: EventDao
) {
    fun registerStudent(studentId: Long, eventId: Long): RegistrationResponse {
        val existing = registrationDao.findByStudentAndEvent(studentId, eventId)
        if (existing != null) {
            throw IllegalArgumentException("You are already registered for this event")
        }

        eventDao.findById(eventId)
            ?: throw IllegalArgumentException("Event not found")

        val registration = Registration(
            id = 0,
            studentId = studentId,
            eventId = eventId,
            status = "REGISTERED"
        )

        return registrationDao.create(registration).toResponse()
    }

    fun getStudentRegistrations(studentId: Long): List<RegistrationResponse> {
        return registrationDao.findByStudentId(studentId).map { it.toResponse() }
    }

    fun getEventParticipants(eventId: Long): List<RegistrationResponse> {
        return registrationDao.findByEventId(eventId).map { it.toResponse() }
    }

    fun cancelRegistration(studentId: Long, registrationId: Long): Boolean {
        val registration = registrationDao.findById(registrationId)
            ?: throw IllegalArgumentException("Registration not found")

        if (registration.studentId != studentId) {
            throw IllegalArgumentException("You can only cancel your own registration")
        }

        if (registration.status == "CANCELLED") {
            throw IllegalArgumentException("Registration is already cancelled")
        }

        return registrationDao.updateStatus(registrationId, "CANCELLED")
    }

    fun updateRegistrationStatus(registrationId: Long, status: String, userRole: String): Boolean {
        if (userRole !in listOf("ADMIN", "ORGANIZER")) {
            throw IllegalArgumentException("You don't have permission to update registration status")
        }

        val validStatuses = setOf("REGISTERED", "CANCELLED", "ATTENDED", "NO_SHOW")
        if (status !in validStatuses) {
            throw IllegalArgumentException("Invalid status: $status")
        }

        return registrationDao.updateStatus(registrationId, status)
    }

    private fun Registration.toResponse() = RegistrationResponse(
        id = id,
        studentId = studentId,
        eventId = eventId,
        status = status,
        registeredAt = registeredAt,
        cancelledAt = cancelledAt
    )
}
