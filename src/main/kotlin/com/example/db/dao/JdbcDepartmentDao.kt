package com.example.db.dao

import com.example.model.Department
import javax.sql.DataSource

class JdbcDepartmentDao(private val dataSource: DataSource) : DepartmentDao {
    override fun findAll(): List<Department> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM departments ORDER BY id"
        ).use { statement ->
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toDepartment())
                    }
                }
            }
        }
    }

    override fun findById(id: Long): Department? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM departments WHERE id = ?"
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toDepartment() else null
            }
        }
    }

    override fun create(department: Department): Department = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "INSERT INTO departments(name) VALUES (?) RETURNING id, name"
        ).use { statement ->
            statement.setString(1, department.name)
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toDepartment()
            }
        }
    }

    override fun update(id: Long, department: Department): Department? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "UPDATE departments SET name = ? WHERE id = ? RETURNING id, name"
        ).use { statement ->
            statement.setString(1, department.name)
            statement.setLong(2, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toDepartment() else null
            }
        }
    }

    override fun delete(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("DELETE FROM departments WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }

    override fun findByName(name: String): Department? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM departments WHERE LOWER(name) = LOWER(?)"
        ).use { statement ->
            statement.setString(1, name)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toDepartment() else null
            }
        }
    }

    private fun java.sql.ResultSet.toDepartment(): Department = Department(
        id = getLong("id"),
        name = getString("name")
    )
}

