package com.example.fake
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
class FakeNotificationPublisher : NotificationPublisher {
    val published = mutableListOf<NotificationMessage>()
    override suspend fun publish(message: NotificationMessage) {
        published.add(message)
    }
    fun countByType(eventType: String): Int = published.count { it.eventType == eventType }
}
