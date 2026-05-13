package com.example.messaging
import dev.kourier.amqp.connection.AMQPConfig
import org.slf4j.LoggerFactory
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
