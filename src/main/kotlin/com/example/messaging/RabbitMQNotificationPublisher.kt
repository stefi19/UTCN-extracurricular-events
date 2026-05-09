package com.example.messaging

import dev.kourier.amqp.connection.AMQPConfig
import dev.kourier.amqp.connection.createAMQPConnection
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

class RabbitMQNotificationPublisher(
    private val scope: CoroutineScope,
    private val exchange: String = "",
    private val routingKey: String = "notifications"
) : NotificationPublisher {

    private val logger = LoggerFactory.getLogger(RabbitMQNotificationPublisher::class.java)
    private val config: AMQPConfig = RabbitMQConnectionFactory.buildConfig()

    override suspend fun publish(message: NotificationMessage) {
        try {
            val connection = createAMQPConnection(scope, config)
            val channel = connection.openChannel()
            val body = Json.encodeToString(message).encodeToByteArray()
            channel.basicPublish(body, exchange, routingKey)
            logger.info("Published notification type={} userId={}", message.eventType, message.userId)
        } catch (exception: Exception) {
            logger.error("Failed to publish notification type={} userId={}: {}", message.eventType, message.userId, exception.message)
        }
    }
}
