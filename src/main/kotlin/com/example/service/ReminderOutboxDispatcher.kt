package com.example.service
import com.example.db.dao.ReminderOutboxDao
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import java.time.LocalDateTime
class ReminderOutboxDispatcher(
    private val reminderOutboxDao: ReminderOutboxDao,
    private val notificationPublisher: NotificationPublisher,
    private val pollIntervalMs: Long = (System.getenv("REMINDER_POLL_INTERVAL_MS") ?: "15000").toLongOrNull() ?: 15_000L,
    private val batchSize: Int = (System.getenv("REMINDER_BATCH_SIZE") ?: "50").toIntOrNull() ?: 50,
    private val retryDelayMinutes: Long = (System.getenv("REMINDER_RETRY_DELAY_MINUTES") ?: "5").toLongOrNull() ?: 5L
) {
    private val logger = LoggerFactory.getLogger(ReminderOutboxDispatcher::class.java)
    fun start(scope: CoroutineScope) {
        scope.launch {
            logger.info("Reminder outbox dispatcher started (poll={}ms, batch={})", pollIntervalMs, batchSize)
            while (isActive) {
                processBatch()
                delay(pollIntervalMs)
            }
        }
    }
    private suspend fun processBatch() {
        val due = runCatching {
            reminderOutboxDao.claimDue(LocalDateTime.now(), batchSize)
        }.onFailure {
            logger.error("Reminder claim batch failed: {}", it.message)
        }.getOrElse { emptyList() }
        for (item in due) {
            val message = NotificationMessage(
                eventType = "EVENT_REMINDER_DUE",
                userId = item.studentId,
                userEmail = item.recipientEmail,
                payload = mapOf(
                    "outboxId" to item.id.toString(),
                    "registrationId" to item.registrationId.toString(),
                    "eventId" to item.eventId.toString(),
                    "eventTitle" to item.eventTitle,
                    "eventDate" to item.eventDate,
                    "eventStartTime" to (item.eventStartTime ?: ""),
                    "eventLocation" to (item.eventLocation ?: ""),
                    "eventCategory" to (item.eventCategory ?: ""),
                    "eventDepartment" to (item.eventDepartment ?: ""),
                    "studentFirstName" to (item.studentFirstName ?: "student")
                )
            )
            runCatching {
                notificationPublisher.publish(message)
                reminderOutboxDao.markSent(item.id)
                logger.info("Reminder dispatched outboxId={} registrationId={}", item.id, item.registrationId)
            }.onFailure { exception ->
                val retryAt = LocalDateTime.now().plusMinutes(retryDelayMinutes)
                reminderOutboxDao.markFailedForRetry(item.id, exception.message ?: "publish failed", retryAt)
                logger.error(
                    "Reminder dispatch failed outboxId={} retryAt={}: {}",
                    item.id,
                    retryAt,
                    exception.message
                )
            }
        }
    }
}
