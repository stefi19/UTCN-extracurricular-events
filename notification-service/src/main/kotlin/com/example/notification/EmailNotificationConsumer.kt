package com.example.notification

import dev.kourier.amqp.connection.AMQPConfig
import kotlinx.coroutines.CoroutineScope
import org.slf4j.LoggerFactory

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
            "EVENT_REGISTRATION" -> sendRegistrationConfirmation(message)
            "EVENT_REMINDER_DUE" -> sendReminder(message)
            "REGISTRATION_CANCELLED" -> sendCancellationNotice(message)
            else -> logger.debug("Skipping unsupported eventType={}", message.eventType)
        }
    }

    private fun sendWelcome(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) return

        val firstName = message.payload["firstName"]?.ifBlank { "student" } ?: "student"
        val subject = "Bine ai venit în aplicația UTCN Events"
        val body = """
            Salut, $firstName!
            
            Bine ai venit în aplicație! Contul tău a fost creat cu succes pe platforma UTCN Events.
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

    private fun sendReminder(message: NotificationMessage) {
        val recipient = message.userEmail
        if (recipient.isBlank()) return

        val eventTitle = message.payload["eventTitle"].orUnknown("eveniment")
        val eventDate = message.payload["eventDate"].orUnknown("data neprecizată")
        val eventStartTime = message.payload["eventStartTime"].orUnknown("ora neprecizată")
        val eventLocation = message.payload["eventLocation"].orUnknown("locație neprecizată")
        val firstName = message.payload["studentFirstName"].orUnknown("student")

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

    private fun String?.orUnknown(defaultValue: String): String = this?.takeIf { it.isNotBlank() } ?: defaultValue
}
