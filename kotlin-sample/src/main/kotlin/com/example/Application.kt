package com.example

import com.example.controller.EventController
import com.example.db.DatabaseFactory
import com.example.repository.EventRepository
import com.example.repository.InMemoryEventRepository
import com.example.repository.PostgresEventRepository
import com.example.service.EventService
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }

    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(mapOf("error" to cause.message.orEmpty()))
        }
    }

    val repository: EventRepository = when ((System.getenv("EVENTS_STORAGE") ?: "memory").lowercase()) {
        "postgres", "postgresql" -> {
            val dataSource = DatabaseFactory.createPostgresDataSource()
            DatabaseFactory.initializeSchema(dataSource)
            PostgresEventRepository(dataSource)
        }
        else -> InMemoryEventRepository()
    }

    val service = EventService(repository)
    val controller = EventController(service)

    routing {
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }
        controller.register(this)
    }
}
