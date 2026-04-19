package com.example.db.dao

import com.example.model.Category
import javax.sql.DataSource

class JdbcCategoryDao(private val dataSource: DataSource) : CategoryDao {
    override fun findAll(): List<Category> = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM categories ORDER BY id"
        ).use { statement ->
            statement.executeQuery().use { rs ->
                buildList {
                    while (rs.next()) {
                        add(rs.toCategory())
                    }
                }
            }
        }
    }

    override fun findById(id: Long): Category? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM categories WHERE id = ?"
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toCategory() else null
            }
        }
    }

    override fun create(category: Category): Category = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "INSERT INTO categories(name) VALUES (?) RETURNING id, name"
        ).use { statement ->
            statement.setString(1, category.name)
            statement.executeQuery().use { rs ->
                rs.next()
                rs.toCategory()
            }
        }
    }

    override fun update(id: Long, category: Category): Category? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "UPDATE categories SET name = ? WHERE id = ? RETURNING id, name"
        ).use { statement ->
            statement.setString(1, category.name)
            statement.setLong(2, id)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toCategory() else null
            }
        }
    }

    override fun delete(id: Long): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("DELETE FROM categories WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate() > 0
        }
    }

    override fun findByName(name: String): Category? = dataSource.connection.use { connection ->
        connection.prepareStatement(
            "SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)"
        ).use { statement ->
            statement.setString(1, name)
            statement.executeQuery().use { rs ->
                if (rs.next()) rs.toCategory() else null
            }
        }
    }

    private fun java.sql.ResultSet.toCategory(): Category = Category(
        id = getLong("id"),
        name = getString("name")
    )
}

