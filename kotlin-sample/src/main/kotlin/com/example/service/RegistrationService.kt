package com.example.service

import com.example.db.dao.EventDao
import com.example.db.dao.RegistrationDao
import com.example.dto.RegistrationResponse
import com.example.model.Registration
import org.slf4j.LoggerFactory

class RegistrationService(
    private val registrationDao: RegistrationDao,
    private val eventDao: EventDao
) {
    private val logger = LoggerFactory.getLogger(RegistrationService::class.java)

    fun registerStudent(studentId: Long, eventId: Long): RegistrationResponse {
        logger.info("Registering student={} for event={}", studentId, eventId)

        val existing = registrationDao.findByStudentAndEvent(studentId, eventId)
        if (existing != null) {
            logger.warn("Duplicate registration: student={} event={}", studentId, eventId)
            throw IllegalArgumentException("You are already registered for this event")
        }

        eventDao.findById(eventId)
            ?: throw IllegalArgumentException("Event not found")

        val registration = Registration(id = 0, studentId = studentId, eventId = eventId, status = "REGISTERED")
        val created = registrationDao.create(registration).toResponse()
        logger.info("Created registration id={}", created.id)
        return created
    }

    fun getStudentRegistrations(studentId: Long): List<RegistrationResponse> {
        logger.info("Getting registrations for student={}", studentId)
        return registrationDao.findByStudentId(studentId).map { it.toResponse() }
    }

    fun getEventParticipants(eventId: Long): List<RegistrationResponse> {
        logger.info("Getting participants for event={}", eventId)
        return registrationDao.findByEventId(eventId).map { it.toResponse() }
    }

    fun cancelRegistration(studentId: Long, registrationId: Long): Boolean {
        logger.info("Cancelling registration={} by student={}", registrationId, studentId)

        val registration = registrationDao.findById(registrationId)
            ?: throw IllegalArgumentException("Registration not found")

        if (registration.studentId != studentId) {
            throw IllegalArgumentException("You can only cancel your own registration")
        }

        if (registration.status == "CANCELLED") {
            throw IllegalArgumentException("Registration is already cancelled")
        }

        val result = registrationDao.updateStatus(registrationId, "CANCELLED")
        logger.info("Cancelled registration={}", registrationId)
        return result
    }

    fun updateRegistrationStatus(registrationId: Long, status: String, userRole: String): Boolean {
        logger.info("Updating registration={} status={} by role={}", registrationId, status, userRole)

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
        id = id, studentId = studentId, eventId = eventId,
        status = status, registeredAt = registeredAt, cancelledAt = cancelledAt
    )
}
