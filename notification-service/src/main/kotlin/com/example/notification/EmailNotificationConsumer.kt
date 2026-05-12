package com.example.notification

import dev.kourier.amqp.connection.AMQPConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

/**
 * Single consumer for all notification events to avoid message loss
 * caused by multiple competing consumers on the same queue.
 */
class EmailNotificationConsumer(
    private val scope: CoroutineScope,
    config: AMQPConfig,
    private val emailSender: EmailSender,
    private val reminderHoursBefore: Long = (System.getenv("REMINDER_HOURS_BEFORE") ?: "3").toLongOrNull() ?: 3L
) : NotificationConsumer(scope, config, "notifications") {

    private val logger = LoggerFactory.getLogger(EmailNotificationConsumer::class.java)

    override fun handleMessage(message: NotificationMessage) {
        when (message.eventType) {
            "USER_REGISTERED" -> sendWelcome(message)
            "EVENT_REGISTRATION" -> {
                sendRegistrationConfirmation(message)
                scheduleReminder(message)
            }
            "REGISTRATION_CANCELLED" -> sendCancellationNotice(message)
            else -> logger.debug("Skipping unsupported eventType={}", message.eventType)
        }
    }

    private fun sendWelcome(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) return

        val firstName = message.payload["firstName"]?.ifBlank { "student" } ?: "student"
        val subject = "Bun venit pe UTCN Events"
        val body = """
            Salut, $firstName!
            
            Contul tău a fost creat cu succes pe platforma UTCN Events.
            De acum poți descoperi evenimente și te poți înscrie rapid.
            
            Succes,
            Echipa UTCN Events
        """.trimIndent()

        runCatching { emailSender.send(recipient, subject, body) }
            .onFailure { logger.error("Failed to send welcome email to={}: {}", recipient, it.message) }
    }

    private fun sendRegistrationConfirmation(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) {
            logger.warn("Registration confirmation skipped: missing userEmail for userId={}", message.userId)
            return
        }

        val eventTitle = message.payload["eventTitle"].orUnknown("eveniment")
        val eventDate = message.payload["eventDate"].orUnknown("data neprecizată")
        val eventStartTime = message.payload["eventStartTime"].orUnknown("ora neprecizată")
        val eventLocation = message.payload["eventLocation"].orUnknown("locație neprecizată")
        val category = message.payload["eventCategory"].orUnknown("-" )
        val department = message.payload["eventDepartment"].orUnknown("-")
        val firstName = message.payload["studentFirstName"].orUnknown("student")

        val subject = "Confirmare înscriere: $eventTitle"
        val body = """
            Salut, $firstName!
            
            Înscrierea ta la evenimentul "$eventTitle" a fost confirmată.
            
            Detalii:
            - Data: $eventDate
            - Ora start: $eventStartTime
            - Locație: $eventLocation
            - Tip: $category
            - Departament: $department
            
            Vei primi și un reminder cu câteva ore înainte de eveniment.
            
            Succes,
            Echipa UTCN Events
        """.trimIndent()

        runCatching { emailSender.send(recipient, subject, body) }
            .onFailure { logger.error("Failed to send registration confirmation to={}: {}", recipient, it.message) }
    }

    private fun scheduleReminder(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) return

        val eventStart = parseEventStart(message.payload)
        if (eventStart == null) {
            logger.warn("Cannot schedule reminder: no parseable event date/time for userId={}", message.userId)
            return
        }

        val reminderTime = eventStart.minusHours(reminderHoursBefore)
        val delayMillis = reminderTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - System.currentTimeMillis()

        if (delayMillis <= 0) {
            logger.info(
                "Reminder skipped (event is too close or past): userId={} eventStart={}",
                message.userId,
                eventStart
            )
            return
        }

        val eventTitle = message.payload["eventTitle"].orUnknown("eveniment")
        val eventDate = message.payload["eventDate"].orUnknown("data neprecizată")
        val eventStartTime = message.payload["eventStartTime"].orUnknown("ora neprecizată")
        val eventLocation = message.payload["eventLocation"].orUnknown("locație neprecizată")
        val firstName = message.payload["studentFirstName"].orUnknown("student")

        logger.info(
            "Scheduling reminder in {} ms for userId={} eventTitle={}",
            delayMillis,
            message.userId,
            eventTitle
        )

        scope.launch {
            delay(delayMillis)
            val subject = "Reminder: $eventTitle începe în curând"
            val body = """
                Salut, $firstName!
                
                Acesta este reminder-ul tău pentru evenimentul "$eventTitle".
                
                Evenimentul începe în aproximativ $reminderHoursBefore ore.
                
                Detalii:
                - Data: $eventDate
                - Ora start: $eventStartTime
                - Locație: $eventLocation
                
                Ne vedem acolo!
                Echipa UTCN Events
            """.trimIndent()

            runCatching { emailSender.send(recipient, subject, body) }
                .onFailure { logger.error("Failed to send reminder to={}: {}", recipient, it.message) }
        }
    }

    private fun sendCancellationNotice(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) return

        val registrationId = message.payload["registrationId"].orUnknown("?")
        val subject = "Confirmare anulare înscriere"
        val body = """
            Înscrierea ta a fost anulată cu succes.
            
            ID înscriere: $registrationId
            
            Dacă a fost o greșeală, te poți înscrie din nou din platformă.
            
            Echipa UTCN Events
        """.trimIndent()

        runCatching { emailSender.send(recipient, subject, body) }
            .onFailure { logger.error("Failed to send cancellation email to={}: {}", recipient, it.message) }
    }

    private fun parseEventStart(payload: Map<String, String>): LocalDateTime? {
        val startTimeRaw = payload["eventStartTime"]?.trim().orEmpty()
        val dateRaw = payload["eventDate"]?.trim().orEmpty()

        parseDateTime(startTimeRaw)?.let { return it }
        parseDate(dateRaw)?.let { return it.atTime(LocalTime.of(9, 0)) }
        return null
    }

    private fun parseDateTime(value: String): LocalDateTime? {
        if (value.isBlank()) return null

        val patterns = listOf(
            DateTimeFormatter.ISO_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
        )

        for (formatter in patterns) {
            try {
                return LocalDateTime.parse(value, formatter)
            } catch (_: DateTimeParseException) {
                // try next formatter
            }
        }

        return null
    }

    private fun parseDate(value: String): LocalDate? {
        if (value.isBlank()) return null
        return try {
            LocalDate.parse(value, DateTimeFormatter.ISO_DATE)
        } catch (_: DateTimeParseException) {
            null
        }
    }

    private fun String?.orUnknown(defaultValue: String): String = this?.takeIf { it.isNotBlank() } ?: defaultValue
}
