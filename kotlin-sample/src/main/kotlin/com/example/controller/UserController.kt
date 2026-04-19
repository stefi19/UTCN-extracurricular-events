package com.example.controller

import com.example.model.UserRole
import com.example.service.UserService
import com.example.security.AuthorizationUtil
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

class UserController(private val userService: UserService) {
    fun register(routing: Route) {
        routing.route("/api/users") {
            get {
                if (!AuthorizationUtil.requireAdmin(call)) return@get

                call.respond(userService.findAll())
            }

            get("/{role}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@get

                val roleStr = call.parameters["role"]?.uppercase()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Role is required"))

                val role = try {
                    UserRole.valueOf(roleStr)
                } catch (e: IllegalArgumentException) {
                    return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid role: $roleStr"))
                }

                call.respond(userService.findByRole(role))
            }
        }
    }
}
