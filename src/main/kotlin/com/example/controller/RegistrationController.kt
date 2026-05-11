package com.example.controller

import com.example.dto.RegistrationRequest
import com.example.service.RegistrationService
import com.example.security.AuthorizationUtil
import com.example.model.UserRole
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

class RegistrationController(private val registrationService: RegistrationService) {
    fun register(routing: Route) {
        routing.route("/api/registrations") {
            get {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@get call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))

                val registrations = registrationService.getStudentRegistrations(userId)
                call.respond(registrations)
            }

            post {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@post call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))

                val request = call.receive<RegistrationRequest>()
                val registration = registrationService.registerStudent(userId, request.eventId)
                call.respond(HttpStatusCode.Created, registration)
            }

            delete("/{registrationId}") {
                val userId = AuthorizationUtil.getUserIdFromPrincipal(call)
                    ?: return@delete call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))

                val registrationId = call.parameters["registrationId"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid registration ID"))

                if (registrationService.cancelRegistration(userId, registrationId)) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("error" to "Registration not found"))
                }
            }

            get("/event/{eventId}") {
                if (!AuthorizationUtil.requireRole(call, UserRole.ORGANIZER, UserRole.ADMIN)) {
                    return@get
                }

                val eventId = call.parameters["eventId"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid event ID"))

                val participants = registrationService.getEventParticipants(eventId)
                call.respond(participants)
            }

            get("/event/{eventId}/details") {
                if (!AuthorizationUtil.requireRole(call, UserRole.ORGANIZER, UserRole.ADMIN)) {
                    return@get
                }

                val eventId = call.parameters["eventId"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid event ID"))

                val participants = registrationService.getEventParticipantsDetailed(eventId)
                call.respond(participants)
            }

            put("/{registrationId}/status") {
                val userRole = AuthorizationUtil.getUserRoleFromPrincipal(call)
                    ?: return@put call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))

                val registrationId = call.parameters["registrationId"]?.toLongOrNull()
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid registration ID"))

                val statusUpdate = call.receive<Map<String, String>>()
                val status = statusUpdate["status"]
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Status field is required"))

                registrationService.updateRegistrationStatus(registrationId, status, userRole.name)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
