package com.example.notification

import dev.kourier.amqp.connection.AMQPConfig
import kotlinx.coroutines.CoroutineScope
import org.slf4j.LoggerFactory

/**
 * Handles EVENT_REGISTRATION and REGISTRATION_CANCELLED events.
 */
class RegistrationNotificationConsumer(
    scope: CoroutineScope,
    config: AMQPConfig
) : NotificationConsumer(scope, config, "notifications") {

    private val logger = LoggerFactory.getLogger(RegistrationNotificationConsumer::class.java)

    override fun handleMessage(message: NotificationMessage) {
        when (message.eventType) {
            "EVENT_REGISTRATION" -> {
                val eventId = message.payload["eventId"] ?: "?"
                logger.info(
                    "Registration confirmation → userId={} eventId={}",
                    message.userId, eventId
                )
            }
            "REGISTRATION_CANCELLED" -> {
                val registrationId = message.payload["registrationId"] ?: "?"
                logger.info(
                    "Registration cancellation → userId={} registrationId={}",
                    message.userId, registrationId
                )
            }
            else -> logger.debug("Skipping eventType={} for RegistrationNotificationConsumer", message.eventType)
        }
    }
}
