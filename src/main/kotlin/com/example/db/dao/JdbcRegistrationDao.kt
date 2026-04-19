package com.example.db.dao

import com.example.model.Registration
import javax.sql.DataSource
import java.time.LocalDateTime

class JdbcRegistrationDao(private val dataSource: DataSource) : RegistrationDao {
    
    override fun create(registration: Registration): Registration = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            INSERT INTO registrations(student_id, event_id, status, registered_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            RETURNING id, student_id, event_id, status, registered_at, cancelled_at
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, registration.studentId)
            statement.setLong(2, registration.eventId)
            statement.setString(3, registration.status)
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toRegistration()
            }
        }
    }

    override fun findById(id: Long): Registration? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, student_id, event_id, status, registered_at, cancelled_at
            FROM registrations
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toRegistration() else null
            }
        }
    }

    override fun findByStudentId(studentId: Long): List<Registration> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, student_id, event_id, status, registered_at, cancelled_at
            FROM registrations
            WHERE student_id = ?
            ORDER BY registered_at DESC
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, studentId)
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toRegistration())
                    }
                }
            }
        }
    }

    override fun findByEventId(eventId: Long): List<Registration> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, student_id, event_id, status, registered_at, cancelled_at
            FROM registrations
            WHERE event_id = ? AND status = 'REGISTERED'
            ORDER BY registered_at
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, eventId)
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toRegistration())
                    }
                }
            }
        }
    }

    override fun findByStudentAndEvent(studentId: Long, eventId: Long): Registration? = 
        dataSource.connection.use { connection ->
            connection.prepareStatement(
                """
                SELECT id, student_id, event_id, status, registered_at, cancelled_at
                FROM registrations
                WHERE student_id = ? AND event_id = ? AND status != 'CANCELLED'
                """.trimIndent()
            ).use { statement ->
                statement.setLong(1, studentId)
                statement.setLong(2, eventId)
                statement.executeQuery().use { rs ->
                    if (rs.next()) rs.toRegistration() else null
                }
            }
        }

    override fun updateStatus(id: Long, status: String): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE registrations
            SET status = ?, cancelled_at = CASE WHEN ? = 'CANCELLED' THEN CURRENT_TIMESTAMP ELSE cancelled_at END
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, status)
            statement.setString(2, status)
            statement.setLong(3, id)
            statement.executeUpdate() > 0
        }
    }

    override fun delete(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("DELETE FROM registrations WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }

    private fun java.sql.ResultSet.toRegistration(): Registration = Registration(
        id = getLong("id"),
        studentId = getLong("student_id"),
        eventId = getLong("event_id"),
        status = getString("status"),
        registeredAt = getString("registered_at"),
        cancelledAt = getString("cancelled_at")
    )
}

