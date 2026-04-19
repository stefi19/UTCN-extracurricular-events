package com.example.service

import com.example.db.dao.RegistrationDao
import com.example.db.dao.EventDao
import com.example.model.Registration
import com.example.model.RegistrationRequest

class RegistrationService(
    private val registrationDao: RegistrationDao,
    private val eventDao: EventDao
) {
    fun registerStudent(studentId: Long, eventId: Long): Registration {
        // Check if student already registered
        val existing = registrationDao.findByStudentAndEvent(studentId, eventId)
        if (existing != null) {
            throw IllegalArgumentException("You are already registered for this event")
        }

        // Check if event exists
        eventDao.findById(eventId)
            ?: throw IllegalArgumentException("Event not found")

        // Create registration
        val registration = Registration(
            id = 0,
            studentId = studentId,
            eventId = eventId,
            status = "REGISTERED"
        )

        return registrationDao.create(registration)
    }

    fun getStudentRegistrations(studentId: Long): List<Registration> {
        return registrationDao.findByStudentId(studentId)
    }

    fun getEventParticipants(eventId: Long): List<Registration> {
        return registrationDao.findByEventId(eventId)
    }

    fun cancelRegistration(studentId: Long, registrationId: Long): Boolean {
        val registration = registrationDao.findById(registrationId)
            ?: throw IllegalArgumentException("Registration not found")

        // Only the student who registered can cancel
        if (registration.studentId != studentId) {
            throw IllegalArgumentException("You can only cancel your own registration")
        }

        // Don't allow cancelling already cancelled registrations
        if (registration.status == "CANCELLED") {
            throw IllegalArgumentException("Registration is already cancelled")
        }

        return registrationDao.updateStatus(registrationId, "CANCELLED")
    }

    fun updateRegistrationStatus(registrationId: Long, status: String, userRole: String): Boolean {
        // Only ADMIN and ORGANIZER can update status
        if (userRole !in listOf("ADMIN", "ORGANIZER")) {
            throw IllegalArgumentException("You don't have permission to update registration status")
        }

        val validStatuses = setOf("REGISTERED", "CANCELLED", "ATTENDED", "NO_SHOW")
        if (status !in validStatuses) {
            throw IllegalArgumentException("Invalid status: $status")
        }

        return registrationDao.updateStatus(registrationId, status)
    }

    fun getRegistrationById(registrationId: Long): Registration? {
        return registrationDao.findById(registrationId)
    }
}


