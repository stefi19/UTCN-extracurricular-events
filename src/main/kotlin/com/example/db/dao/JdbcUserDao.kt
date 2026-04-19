package com.example.db.dao

import com.example.model.User
import com.example.model.UserRole
import javax.sql.DataSource

class JdbcUserDao(private val dataSource: DataSource) : UserDao {
    override fun findByEmail(email: String): User? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, email, password_hash, first_name, last_name, role, 
                   department_id, is_active, created_at, updated_at
            FROM users
            WHERE email = ?
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, email)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toUser() else null
            }
        }
    }

    override fun findById(id: Long): User? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, email, password_hash, first_name, last_name, role, 
                   department_id, is_active, created_at, updated_at
            FROM users
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toUser() else null
            }
        }
    }

    override fun create(user: User): User = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            INSERT INTO users(email, password_hash, first_name, last_name, role, 
                            department_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id, email, password_hash, first_name, last_name, role, 
                      department_id, is_active, created_at, updated_at
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, user.email)
            statement.setString(2, user.passwordHash)
            statement.setString(3, user.firstName)
            statement.setString(4, user.lastName)
            statement.setString(5, user.role.name)
            if (user.departmentId != null) {
                statement.setLong(6, user.departmentId)
            } else {
                statement.setNull(6, java.sql.Types.BIGINT)
            }
            statement.setBoolean(7, user.isActive)
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toUser()
            }
        }
    }

    override fun update(id: Long, user: User): User? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            UPDATE users
            SET email = ?, password_hash = ?, first_name = ?, last_name = ?, 
                role = ?, department_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING id, email, password_hash, first_name, last_name, role, 
                      department_id, is_active, created_at, updated_at
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, user.email)
            statement.setString(2, user.passwordHash)
            statement.setString(3, user.firstName)
            statement.setString(4, user.lastName)
            statement.setString(5, user.role.name)
            if (user.departmentId != null) {
                statement.setLong(6, user.departmentId)
            } else {
                statement.setNull(6, java.sql.Types.BIGINT)
            }
            statement.setBoolean(7, user.isActive)
            statement.setLong(8, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toUser() else null
            }
        }
    }

    override fun delete(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("DELETE FROM users WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }

    override fun findByRole(role: UserRole): List<User> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            """
            SELECT id, email, password_hash, first_name, last_name, role, 
                   department_id, is_active, created_at, updated_at
            FROM users
            WHERE role = ?
            ORDER BY id
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, role.name)
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toUser())
                    }
                }
            }
        }
    }

    private fun java.sql.ResultSet.toUser(): User = User(
        id = getLong("id"),
        email = getString("email"),
        passwordHash = getString("password_hash"),
        firstName = getString("first_name"),
        lastName = getString("last_name"),
        role = UserRole.valueOf(getString("role")),
        departmentId = getLong("department_id").takeIf { wasNull().not() },
        isActive = getBoolean("is_active"),
        createdAt = getString("created_at"),
        updatedAt = getString("updated_at")
    )
}

