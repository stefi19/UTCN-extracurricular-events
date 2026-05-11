package com.example.controller

import com.example.dto.EventRequest
import com.example.service.EventService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route

class EventController(private val eventService: EventService) {
    // Public routes (no authentication required)
    fun registerPublic(route: Route) {
        route.route("/api/events") {
            get {
                call.respond(eventService.listEvents())
            }

            get("/{id}") {
                val eventId = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                val event = eventService.getEvent(eventId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))

                call.respond(event)
            }
        }
    }

    // Protected routes (authentication required)
    fun register(route: Route) {
        route.route("/api/events") {
            post {
                val request = call.receive<EventRequest>()
                val created = eventService.createEvent(request)
                call.respond(HttpStatusCode.Created, created)
            }

            put("/{id}") {
                val eventId = call.parameters["id"]?.toLongOrNull()
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                val request = call.receive<EventRequest>()
                val updated = eventService.updateEvent(eventId, request)
                    ?: return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))

                call.respond(updated)
            }

            delete("/{id}") {
                val eventId = call.parameters["id"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                if (!eventService.deleteEvent(eventId)) {
                    return@delete call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))
                }

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
