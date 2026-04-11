package com.example.repository

import com.example.model.Event
import javax.sql.DataSource

class PostgresEventRepository(private val dataSource: DataSource) : EventRepository {
    override fun findAll(): List<Event> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, title, description, date, category, department
            FROM events
            ORDER BY id
            """.trimIndent()
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
            """
            SELECT id, title, description, date, category, department
            FROM events
            WHERE id = ?
            """.trimIndent()
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
            INSERT INTO events(title, description, date, category, department)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, title, description, date, category, department
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, event.title)
            statement.setString(2, event.description)
            statement.setString(3, event.date)
            statement.setString(4, event.category)
            statement.setString(5, event.department)
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
            SET title = ?, description = ?, date = ?, category = ?, department = ?
            WHERE id = ?
            RETURNING id, title, description, date, category, department
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, event.title)
            statement.setString(2, event.description)
            statement.setString(3, event.date)
            statement.setString(4, event.category)
            statement.setString(5, event.department)
            statement.setLong(6, id)
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

    private fun java.sql.ResultSet.toEvent(): Event = Event(
        id = getLong("id"),
        title = getString("title"),
        description = getString("description"),
        date = getString("date"),
        category = getString("category"),
        department = getString("department")
    )
}

