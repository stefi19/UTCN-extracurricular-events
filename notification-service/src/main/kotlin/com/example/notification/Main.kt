package com.example.notification

import dev.kourier.amqp.connection.AMQPConfig
import dev.kourier.amqp.connection.AMQPConfig.Connection
import dev.kourier.amqp.connection.AMQPConfig.Server
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("NotificationServiceMain")

fun main() {
    val config = buildConfig()
    val emailSender = SmtpEmailSender()
    val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    logger.info("Notification service starting")

    runBlocking {
        launch { EmailNotificationConsumer(serviceScope, config, emailSender).start() }
    }
}

private fun buildConfig(): AMQPConfig = AMQPConfig(
    connection = Connection.Plain,
    server = Server(
        host = System.getenv("RABBITMQ_HOST") ?: "localhost",
        port = System.getenv("RABBITMQ_PORT")?.toIntOrNull() ?: 5672,
        user = System.getenv("RABBITMQ_USER") ?: "guest",
        password = System.getenv("RABBITMQ_PASS") ?: "guest"
    )
)
