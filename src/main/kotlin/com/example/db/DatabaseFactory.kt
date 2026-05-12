package com.example.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.flywaydb.core.Flyway
import javax.sql.DataSource

object DatabaseFactory {
    fun createPostgresDataSource(): DataSource {
        val host = System.getenv("DB_HOST") ?: "localhost"
        val port = System.getenv("DB_PORT") ?: "5432"
        val name = System.getenv("DB_NAME") ?: "utcnevents"
        val jdbcFromParts = "jdbc:postgresql://$host:$port/$name"

        val config = HikariConfig().apply {
            jdbcUrl = System.getenv("DATABASE_URL") ?: jdbcFromParts
            username = System.getenv("DATABASE_USER") ?: System.getenv("DB_USER") ?: "postgres"
            password = System.getenv("DATABASE_PASSWORD") ?: System.getenv("DB_PASSWORD") ?: "postgres"
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 5
            isAutoCommit = true
            transactionIsolation = "TRANSACTION_READ_COMMITTED"
            validate()
        }
        return HikariDataSource(config)
    }

    fun runMigrations(dataSource: DataSource) {
        val flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .load()
        flyway.repair()
        flyway.migrate()
    }
}
