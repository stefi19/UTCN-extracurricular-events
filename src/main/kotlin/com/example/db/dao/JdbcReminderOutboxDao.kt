package com.example.db.dao
import com.example.model.ReminderOutboxItem
import java.sql.Types
import java.time.LocalDateTime
import javax.sql.DataSource
class JdbcReminderOutboxDao(private val dataSource: DataSource) : ReminderOutboxDao {
    override fun schedule(item: ReminderOutboxItem): ReminderOutboxItem = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            INSERT INTO reminder_outbox(
                registration_id, student_id, event_id, recipient_email,
                event_title, event_date, event_start_time, event_location,
                event_category, event_department, student_first_name,
                send_at, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            ON CONFLICT (registration_id) DO UPDATE
            SET send_at = EXCLUDED.send_at,
                recipient_email = EXCLUDED.recipient_email,
                event_title = EXCLUDED.event_title,
                event_date = EXCLUDED.event_date,
                event_start_time = EXCLUDED.event_start_time,
                event_location = EXCLUDED.event_location,
                event_category = EXCLUDED.event_category,
                event_department = EXCLUDED.event_department,
                student_first_name = EXCLUDED.student_first_name,
                updated_at = CURRENT_TIMESTAMP,
                status = CASE
                    WHEN reminder_outbox.status = 'SENT' THEN reminder_outbox.status
                    ELSE 'PENDING'
                END
            RETURNING id, registration_id, student_id, event_id, recipient_email,
                      event_title, event_date, event_start_time, event_location,
                      event_category, event_department, student_first_name,
                      send_at, status, attempt_count
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, item.registrationId)
            statement.setLong(2, item.studentId)
            statement.setLong(3, item.eventId)
            statement.setString(4, item.recipientEmail)
            statement.setString(5, item.eventTitle)
            statement.setString(6, item.eventDate)
            setNullable(statement, 7, item.eventStartTime)
            setNullable(statement, 8, item.eventLocation)
            setNullable(statement, 9, item.eventCategory)
            setNullable(statement, 10, item.eventDepartment)
            setNullable(statement, 11, item.studentFirstName)
            statement.setObject(12, LocalDateTime.parse(item.sendAt))
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toReminderOutboxItem()
            }
        }
    }
    override fun claimDue(now: LocalDateTime, limit: Int): List<ReminderOutboxItem> = dataSource.connection.use { connection ->
        connection.autoCommit = false
        try {
            val claimed = connection.prepareStatement(
                """
                WITH due AS (
                    SELECT id
                    FROM reminder_outbox
                    WHERE status = 'PENDING' AND send_at <= ?
                    ORDER BY send_at ASC
                    LIMIT ?
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE reminder_outbox ro
                SET status = 'PROCESSING',
                    updated_at = CURRENT_TIMESTAMP,
                    attempt_count = ro.attempt_count + 1
                FROM due
                WHERE ro.id = due.id
                RETURNING ro.id, ro.registration_id, ro.student_id, ro.event_id, ro.recipient_email,
                          ro.event_title, ro.event_date, ro.event_start_time, ro.event_location,
                          ro.event_category, ro.event_department, ro.student_first_name,
                          ro.send_at, ro.status, ro.attempt_count
                """.trimIndent()
            ).use { statement ->
                statement.setObject(1, now)
                statement.setInt(2, limit)
                statement.executeQuery().use { rs ->
                    buildList {
                        while (rs.next()) {
                            add(rs.toReminderOutboxItem())
                        }
                    }
                }
            }
            connection.commit()
            claimed
        } catch (exception: Exception) {
            connection.rollback()
            throw exception
        } finally {
            connection.autoCommit = true
        }
    }
    override fun markSent(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE reminder_outbox
            SET status = 'SENT',
                sent_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP,
                last_error = NULL
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }
    override fun markFailedForRetry(id: Long, error: String, retryAt: LocalDateTime): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE reminder_outbox
            SET status = 'PENDING',
                send_at = ?,
                updated_at = CURRENT_TIMESTAMP,
                last_error = ?
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setObject(1, retryAt)
            statement.setString(2, error.take(1000))
            statement.setLong(3, id)
            statement.executeUpdate() > 0
        }
    }
    override fun markCancelledByRegistrationId(registrationId: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE reminder_outbox
            SET status = 'CANCELLED',
                updated_at = CURRENT_TIMESTAMP
            WHERE registration_id = ?
              AND status IN ('PENDING', 'PROCESSING')
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, registrationId)
            statement.executeUpdate() > 0
        }
    }
    private fun setNullable(statement: java.sql.PreparedStatement, index: Int, value: String?) {
        if (value == null) statement.setNull(index, Types.VARCHAR) else statement.setString(index, value)
    }
    private fun java.sql.ResultSet.toReminderOutboxItem(): ReminderOutboxItem = ReminderOutboxItem(
        id = getLong("id"),
        registrationId = getLong("registration_id"),
        studentId = getLong("student_id"),
        eventId = getLong("event_id"),
        recipientEmail = getString("recipient_email"),
        eventTitle = getString("event_title"),
        eventDate = getString("event_date"),
        eventStartTime = getString("event_start_time"),
        eventLocation = getString("event_location"),
        eventCategory = getString("event_category"),
        eventDepartment = getString("event_department"),
        studentFirstName = getString("student_first_name"),
        sendAt = getString("send_at"),
        status = getString("status"),
        attemptCount = getInt("attempt_count")
    )
}
