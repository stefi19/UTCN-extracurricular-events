package com.example.controller

import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.dto.UpdateProfileRequest
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
import io.ktor.server.routing.put
import io.ktor.server.routing.route

class AuthController(private val authService: AuthService) {
    fun register(routing: Route) {
        routing.route("/api/auth") {
            post("/register") {
                val request = call.receive<RegisterRequest>()
                val response = authService.register(request)
                call.respond(HttpStatusCode.Created, response)
            }

            post("/login") {
                val request = call.receive<LoginRequest>()
                val response = authService.login(request)
                call.respond(response)
            }
        }
    }

    fun registerProtected(routing: Route) {
        routing.route("/api/auth") {
            get("/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject?.toLongOrNull()
                    ?: throw IllegalArgumentException("Invalid token")

                val userResponse = authService.getUserById(userId)
                    ?: throw IllegalArgumentException("User not found")

                call.respond(userResponse)
            }
            
            put("/profile") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject?.toLongOrNull()
                    ?: throw IllegalArgumentException("Invalid token")
                
                val request = call.receive<UpdateProfileRequest>()
                val updatedUser = authService.updateProfile(userId, request)
                call.respond(updatedUser)
            }
        }
    }
}
