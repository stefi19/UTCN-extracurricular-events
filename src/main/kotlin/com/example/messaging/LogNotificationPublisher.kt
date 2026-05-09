package com.example.messaging

import org.slf4j.LoggerFactory

/**
 * Fallback notification publisher that logs messages instead of sending them to a broker.
 *
 * Design pattern: Strategy (LAB08)
 * Rationale: swappable at construction time — used in tests and when RabbitMQ is unavailable.
 */
class LogNotificationPublisher : NotificationPublisher {
    private val logger = LoggerFactory.getLogger(LogNotificationPublisher::class.java)

    override suspend fun publish(message: NotificationMessage) {
        logger.info(
            "NOTIFICATION [{}] userId={} email={} payload={}",
            message.eventType, message.userId, message.userEmail, message.payload
        )
    }
}
