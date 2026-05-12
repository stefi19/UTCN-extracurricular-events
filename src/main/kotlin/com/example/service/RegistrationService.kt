package com.example.service

import com.example.db.dao.EventDao
import com.example.db.dao.RegistrationDao
import com.example.db.dao.ReminderOutboxDao
import com.example.db.dao.UserDao
import com.example.dto.ParticipantDetailsResponse
import com.example.dto.RegistrationResponse
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
import com.example.model.Registration
import com.example.model.ReminderOutboxItem
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

class RegistrationService(
    private val registrationDao: RegistrationDao,
    private val eventDao: EventDao,
    private val userDao: UserDao? = null,
    private val reminderOutboxDao: ReminderOutboxDao? = null,
    private val notificationPublisher: NotificationPublisher? = null
) {
    private val logger = LoggerFactory.getLogger(RegistrationService::class.java)
    private val reminderHoursBefore: Long = (System.getenv("REMINDER_HOURS_BEFORE") ?: "3").toLongOrNull() ?: 3L

    fun getAllRegistrations(): List<RegistrationResponse> {
        logger.info("Getting all registrations (admin)")
        return registrationDao.findAll().map { it.toResponse() }
    }

    fun registerStudent(studentId: Long, eventId: Long): RegistrationResponse {
        logger.info("Registering student={} for event={}", studentId, eventId)

        val existing = registrationDao.findByStudentAndEventAny(studentId, eventId)
        if (existing != null) {
            if (existing.status == "CANCELLED") {
                // Re-register: reactivate the cancelled row
                logger.info("Re-activating cancelled registration id={} for student={} event={}", existing.id, studentId, eventId)
                val reactivated = registrationDao.reactivate(existing.id)
                    ?: throw IllegalStateException("Failed to reactivate registration")
                return reactivated.toResponse()
            }
            logger.warn("Duplicate registration: student={} event={}", studentId, eventId)
            throw IllegalArgumentException("You are already registered for this event")
        }

        val event = eventDao.findById(eventId)
            ?: throw IllegalArgumentException("Event not found")

        val student = userDao?.findById(studentId)

        val registration = Registration(id = 0, studentId = studentId, eventId = eventId, status = "REGISTERED")
        val created = registrationDao.create(registration).toResponse()
        logger.info("Created registration id={}", created.id)

    scheduleReminderOutbox(created.id, studentId, eventId, event, student)

        runBlocking {
            notificationPublisher?.publish(
                NotificationMessage(
                    eventType = "EVENT_REGISTRATION",
                    userId = studentId,
                    userEmail = student?.email.orEmpty(),
                    payload = mapOf(
                        "eventId" to eventId.toString(),
                        "registrationId" to created.id.toString(),
                        "eventTitle" to event.title,
                        "eventDate" to event.date,
                        "eventStartTime" to (event.startTime ?: ""),
                        "eventLocation" to (event.location ?: ""),
                        "eventCategory" to event.category,
                        "eventDepartment" to event.department,
                        "studentFirstName" to (student?.firstName ?: ""),
                        "studentLastName" to (student?.lastName ?: "")
                    )
                )
            )
        }

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

    fun getEventParticipantsDetailed(eventId: Long): List<ParticipantDetailsResponse> {
        logger.info("Getting detailed participants for event={}", eventId)
        return registrationDao.findByEventId(eventId).map { registration ->
            val student = userDao?.findById(registration.studentId)
            ParticipantDetailsResponse(
                id = registration.id,
                studentId = registration.studentId,
                studentFirstName = student?.firstName ?: "Student",
                studentLastName = student?.lastName ?: "#${registration.studentId}",
                studentEmail = student?.email ?: "Unavailable",
                eventId = registration.eventId,
                status = registration.status,
                registeredAt = registration.registeredAt,
                cancelledAt = registration.cancelledAt
            )
        }
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

        if (result) {
            val student = userDao?.findById(studentId)
            reminderOutboxDao?.markCancelledByRegistrationId(registrationId)
            runBlocking {
                notificationPublisher?.publish(
                    NotificationMessage(
                        eventType = "REGISTRATION_CANCELLED",
                        userId = studentId,
                        userEmail = student?.email.orEmpty(),
                        payload = mapOf("registrationId" to registrationId.toString())
                    )
                )
            }
        }

        return result
    }

    private fun scheduleReminderOutbox(
        registrationId: Long,
        studentId: Long,
        eventId: Long,
        event: com.example.model.Event,
        student: com.example.model.User?
    ) {
        val sendAt = computeReminderTime(event)
        if (sendAt == null) {
            logger.warn("Reminder outbox skipped: cannot parse event time for eventId={}", eventId)
            return
        }

        val recipient = student?.email
        if (recipient.isNullOrBlank()) {
            logger.warn("Reminder outbox skipped: no recipient email for studentId={}", studentId)
            return
        }

        val item = ReminderOutboxItem(
            id = 0,
            registrationId = registrationId,
            studentId = studentId,
            eventId = eventId,
            recipientEmail = recipient,
            eventTitle = event.title,
            eventDate = event.date,
            eventStartTime = event.startTime,
            eventLocation = event.location,
            eventCategory = event.category,
            eventDepartment = event.department,
            studentFirstName = student.firstName,
            sendAt = sendAt.toString(),
            status = "PENDING"
        )

        runCatching {
            reminderOutboxDao?.schedule(item)
        }.onFailure {
            logger.error("Failed to persist reminder outbox registrationId={}: {}", registrationId, it.message)
        }
    }

    private fun computeReminderTime(event: com.example.model.Event): LocalDateTime? {
        val eventStart = parseEventStart(event.startTime, event.date) ?: return null
        return eventStart.minusHours(reminderHoursBefore)
    }

    private fun parseEventStart(startTimeRaw: String?, dateRaw: String): LocalDateTime? {
        parseDateTime(startTimeRaw)?.let { return it }
        parseDate(dateRaw)?.let { return it.atTime(LocalTime.of(9, 0)) }
        return null
    }

    private fun parseDateTime(value: String?): LocalDateTime? {
        if (value.isNullOrBlank()) return null

        val patterns = listOf(
            DateTimeFormatter.ISO_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
        )

        for (formatter in patterns) {
            try {
                return LocalDateTime.parse(value.trim(), formatter)
            } catch (_: DateTimeParseException) {
                // continue
            }
        }

        return null
    }

    private fun parseDate(value: String?): LocalDate? {
        if (value.isNullOrBlank()) return null
        return try {
            LocalDate.parse(value.trim(), DateTimeFormatter.ISO_DATE)
        } catch (_: DateTimeParseException) {
            null
        }
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
