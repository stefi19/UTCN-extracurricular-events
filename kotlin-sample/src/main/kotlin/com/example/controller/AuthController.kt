package com.example.controller

import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.service.AuthService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

class AuthController(private val authService: AuthService) {
    fun register(routing: Route) {
        routing.route("/auth") {
            post("/register") {
                try {
                    val request = call.receive<RegisterRequest>()
                    val response = authService.register(request)
                    call.respond(HttpStatusCode.Created, response)
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message.orEmpty()))
                }
            }

            post("/login") {
                try {
                    val request = call.receive<LoginRequest>()
                    val response = authService.login(request)
                    call.respond(response)
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("error" to e.message.orEmpty()))
                }
            }
        }
    }

    fun registerProtected(routing: Route) {
        routing.route("/auth") {
            get("/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject?.toLongOrNull()

                if (userId == null) {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid token"))
                    return@get
                }

                val userResponse = authService.getUserById(userId)
                if (userResponse != null) {
                    call.respond(userResponse)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("error" to "User not found"))
                }
            }
        }
    }
}
