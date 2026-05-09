package com.example.notification

import dev.kourier.amqp.connection.AMQPConfig
import kotlinx.coroutines.CoroutineScope
import org.slf4j.LoggerFactory

/**
 * Handles USER_REGISTERED events — logs a welcome notification.
 */
class UserNotificationConsumer(
    scope: CoroutineScope,
    config: AMQPConfig
) : NotificationConsumer(scope, config, "notifications") {

    private val logger = LoggerFactory.getLogger(UserNotificationConsumer::class.java)

    override fun handleMessage(message: NotificationMessage) {
        when (message.eventType) {
            "USER_REGISTERED" -> {
                val firstName = message.payload["firstName"] ?: "User"
                logger.info(
                    "Welcome email → userId={} email={} name={}",
                    message.userId, message.userEmail, firstName
                )
            }
            else -> logger.debug("Skipping eventType={} for UserNotificationConsumer", message.eventType)
        }
    }
}
