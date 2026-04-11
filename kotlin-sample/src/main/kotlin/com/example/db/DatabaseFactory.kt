package com.example.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import javax.sql.DataSource

object DatabaseFactory {
    fun createPostgresDataSource(): DataSource {
        val config = HikariConfig().apply {
            jdbcUrl = System.getenv("DATABASE_URL") ?: "jdbc:postgresql://localhost:5432/utcnevents"
            username = System.getenv("DATABASE_USER") ?: "postgres"
            password = System.getenv("DATABASE_PASSWORD") ?: "postgres"
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 5
            isAutoCommit = true
            transactionIsolation = "TRANSACTION_READ_COMMITTED"
            validate()
        }
        return HikariDataSource(config)
    }

    fun initializeSchema(dataSource: DataSource) {
        val schemaSql = this::class.java.classLoader
            .getResource("db/schema.sql")
            ?.readText()
            ?: error("Missing db/schema.sql resource")

        dataSource.connection.use { connection ->
            connection.createStatement().use { statement ->
                statement.execute(schemaSql)
            }
        }
    }
}

