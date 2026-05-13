package com.example.messaging
import org.slf4j.LoggerFactory
class LogNotificationPublisher : NotificationPublisher {
    private val logger = LoggerFactory.getLogger(LogNotificationPublisher::class.java)
    override suspend fun publish(message: NotificationMessage) {
        logger.info(
            "NOTIFICATION [{}] userId={} email={} payload={}",
            message.eventType, message.userId, message.userEmail, message.payload
        )
    }
}
