package com.example.messaging

import dev.kourier.amqp.connection.AMQPConfig
import org.slf4j.LoggerFactory

/**
 * Singleton configuration provider for RabbitMQ.
 *
 * Design pattern: Singleton (LAB08)
 * Rationale: configuration is loaded once from environment variables and remains read-only.
 * It holds no request-specific or mutable state, making it safe to share globally.
 *
 * Note: actual connections are suspend-based (Kourier AMQP library) and are opened
 * by each publisher/consumer that needs them, using their own coroutine scope.
 */
object RabbitMQConnectionFactory {
    private val logger = LoggerFactory.getLogger(RabbitMQConnectionFactory::class.java)

    private val host: String get() = System.getenv("RABBITMQ_HOST") ?: "localhost"
    private val port: Int get() = System.getenv("RABBITMQ_PORT")?.toIntOrNull() ?: 5672
    private val username: String get() = System.getenv("RABBITMQ_USER") ?: "guest"
    private val password: String get() = System.getenv("RABBITMQ_PASS") ?: "guest"

    fun buildConfig(): AMQPConfig {
        logger.info("Building RabbitMQ config for {}:{}", host, port)
        return AMQPConfig(
            connection = AMQPConfig.Connection.Plain,
            server = AMQPConfig.Server(
                host = host,
                port = port,
                user = username,
                password = password
            )
        )
    }
}

