package com.example.controller

import com.example.model.UserRole
import com.example.service.AuthService
import com.example.security.AuthorizationUtil
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

class UserController(private val authService: AuthService) {
    fun register(routing: Route) {
        routing.route("/api/users") {
            // Get all users (Admin only)
            get {
                if (!AuthorizationUtil.requireAdmin(call)) return@get

                try {
                    val students = authService.getUsersByRole(UserRole.STUDENT)
                    val organizers = authService.getUsersByRole(UserRole.ORGANIZER)
                    val admins = authService.getUsersByRole(UserRole.ADMIN)

                    call.respond(mapOf(
                        "students" to students,
                        "organizers" to organizers,
                        "admins" to admins
                    ))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, 
                        mapOf("error" to "Failed to fetch users: ${e.message}"))
                }
            }

            // Get users by role (Admin only)
            get("/{role}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@get

                try {
                    val roleStr = call.parameters["role"]?.uppercase() ?: return@get
                    val role = try {
                        UserRole.valueOf(roleStr)
                    } catch (e: IllegalArgumentException) {
                        return@get call.respond(HttpStatusCode.BadRequest, 
                            mapOf("error" to "Invalid role: $roleStr"))
                    }

                    val users = authService.getUsersByRole(role)
                    call.respond(users)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, 
                        mapOf("error" to "Failed to fetch users: ${e.message}"))
                }
            }
        }
    }
}

