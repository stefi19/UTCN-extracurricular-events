package com.example.messaging

interface NotificationPublisher {
    suspend fun publish(message: NotificationMessage)
}
