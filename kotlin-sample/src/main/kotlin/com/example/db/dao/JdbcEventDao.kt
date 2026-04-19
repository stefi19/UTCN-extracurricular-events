package com.example.db.dao

import com.example.model.Event
import javax.sql.DataSource

class JdbcEventDao(private val dataSource: DataSource) : EventDao {

    private val selectColumns = """
        id, title, description, date, category, department,
        organizer_id, category_id, location, start_time, end_time, max_participants
    """.trimIndent()

    override fun findAll(): List<Event> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT $selectColumns FROM events ORDER BY id"
        ).use { statement ->
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toEvent())
                    }
                }
            }
        }
    }

    override fun findById(id: Long): Event? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT $selectColumns FROM events WHERE id = ?"
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toEvent() else null
            }
        }
    }

    override fun create(event: Event): Event = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            INSERT INTO events(title, description, date, category, department,
                               organizer_id, category_id, location, start_time, end_time, max_participants)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING $selectColumns
            """.trimIndent()
        ).use { statement ->
            bindEvent(statement, event)
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toEvent()
            }
        }
    }

    override fun update(id: Long, event: Event): Event? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE events
            SET title = ?, description = ?, date = ?, category = ?, department = ?,
                organizer_id = ?, category_id = ?, location = ?, start_time = ?, end_time = ?,
                max_participants = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING $selectColumns
            """.trimIndent()
        ).use { statement ->
            bindEvent(statement, event)
            statement.setLong(12, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toEvent() else null
            }
        }
    }

    override fun delete(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("DELETE FROM events WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }

    private fun bindEvent(statement: java.sql.PreparedStatement, event: Event) {
        statement.setString(1, event.title)
        statement.setString(2, event.description)
        statement.setString(3, event.date)
        statement.setString(4, event.category)
        statement.setString(5, event.department)
        if (event.organizerId != null) statement.setLong(6, event.organizerId) else statement.setNull(6, java.sql.Types.BIGINT)
        if (event.categoryId != null) statement.setLong(7, event.categoryId) else statement.setNull(7, java.sql.Types.BIGINT)
        if (event.location != null) statement.setString(8, event.location) else statement.setNull(8, java.sql.Types.VARCHAR)
        if (event.startTime != null) statement.setString(9, event.startTime) else statement.setNull(9, java.sql.Types.TIMESTAMP)
        if (event.endTime != null) statement.setString(10, event.endTime) else statement.setNull(10, java.sql.Types.TIMESTAMP)
        if (event.maxParticipants != null) statement.setInt(11, event.maxParticipants) else statement.setNull(11, java.sql.Types.INTEGER)
    }

    private fun java.sql.ResultSet.toEvent(): Event = Event(
        id = getLong("id"),
        title = getString("title"),
        description = getString("description"),
        date = getString("date"),
        category = getString("category"),
        department = getString("department"),
        organizerId = getLong("organizer_id").takeIf { !wasNull() },
        categoryId = getLong("category_id").takeIf { !wasNull() },
        location = getString("location"),
        startTime = getString("start_time"),
        endTime = getString("end_time"),
        maxParticipants = getInt("max_participants").takeIf { !wasNull() }
    )
}
