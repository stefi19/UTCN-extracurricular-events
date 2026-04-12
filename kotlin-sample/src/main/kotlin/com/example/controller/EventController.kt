package com.example.controller

import com.example.model.EventRequest
import com.example.service.EventService
import com.example.view.toView
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

class EventController(private val service: EventService) {
    fun register(route: Route) {
        route.route("/api/events") {
            get {
                call.respond(service.listEvents().map { it.toView() })
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                val event = service.getEvent(id)
                    ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))

                call.respond(event.toView())
            }

            post {
                val request = call.receive<EventRequest>()
                val created = service.createEvent(request)
                call.respond(HttpStatusCode.Created, created.toView())
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                val request = call.receive<EventRequest>()
                val updated = service.updateEvent(id, request)
                    ?: return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))

                call.respond(updated.toView())
            }

            delete("/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid event id"))

                if (!service.deleteEvent(id)) {
                    return@delete call.respond(HttpStatusCode.NotFound, mapOf("error" to "event not found"))
                }

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
