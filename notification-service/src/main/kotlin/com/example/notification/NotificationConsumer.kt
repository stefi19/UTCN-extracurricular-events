package com.example.notification

import dev.kourier.amqp.channel.AMQPChannel
import dev.kourier.amqp.connection.AMQPConfig
import dev.kourier.amqp.connection.AMQPConnection
import dev.kourier.amqp.connection.createAMQPConnection
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.awaitCancellation
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

/**
 * Abstract base consumer that handles AMQP connection lifecycle and message deserialization.
 *
 * Design pattern: Template Method (LAB08)
 * Rationale: connect/declare/consume loop is fixed; subclasses override handleMessage() to
 *            define what to do with each notification type.
 */
abstract class NotificationConsumer(
    private val scope: CoroutineScope,
    private val config: AMQPConfig,
    private val queueName: String
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    /** Template method — subclasses define notification handling logic. */
    protected abstract fun handleMessage(message: NotificationMessage)

    suspend fun start() {
        logger.info("Starting consumer queue={}", queueName)
        val connection: AMQPConnection = createAMQPConnection(scope, config)
        val channel: AMQPChannel = connection.openChannel()

        channel.queueDeclare(name = queueName, durable = true, exclusive = false, autoDelete = false)

        channel.basicConsume(queue = queueName, noAck = true, onDelivery = { delivery ->
            try {
                val message = Json.decodeFromString<NotificationMessage>(delivery.message.body.decodeToString())
                logger.info("Received eventType={} userId={}", message.eventType, message.userId)
                handleMessage(message)
            } catch (exception: Exception) {
                logger.error("Failed to process message: {}", exception.message)
            }
        })

        logger.info("Consumer started queue={} — waiting for messages", queueName)
        awaitCancellation()
    }
}
