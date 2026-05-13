package com.example.db.dao
import com.example.model.ReminderOutboxItem
import java.time.LocalDateTime
interface ReminderOutboxDao {
    fun schedule(item: ReminderOutboxItem): ReminderOutboxItem
    fun claimDue(now: LocalDateTime, limit: Int): List<ReminderOutboxItem>
    fun markSent(id: Long): Boolean
    fun markFailedForRetry(id: Long, error: String, retryAt: LocalDateTime): Boolean
    fun markCancelledByRegistrationId(registrationId: Long): Boolean
}
