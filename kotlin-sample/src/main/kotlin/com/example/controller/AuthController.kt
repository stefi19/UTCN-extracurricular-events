package com.example.controller

import com.example.model.UserLoginRequest
import com.example.model.UserRegisterRequest
import com.example.service.AuthService
import io.ktor.server.application.call
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.auth.jwt.JWTPrincipal
import com.example.model.JwtClaims

class AuthController(private val authService: AuthService) {
    fun register(routing: Route) {
        routing.route("/auth") {
            post("/register") {
                try {
                    val request = call.receive<UserRegisterRequest>()
                    val response = authService.register(request)
                    call.respond(response)
                } catch (e: IllegalArgumentException) {
                    call.respond(mapOf("error" to e.message.orEmpty()))
                } catch (e: Exception) {
                    call.respond(mapOf("error" to "Registration failed: ${e.message}"))
                }
            }

            post("/login") {
                try {
                    val request = call.receive<UserLoginRequest>()
                    val response = authService.login(request)
                    call.respond(response)
                } catch (e: IllegalArgumentException) {
                    call.respond(mapOf("error" to e.message.orEmpty()))
                } catch (e: Exception) {
                    call.respond(mapOf("error" to "Login failed: ${e.message}"))
                }
            }

            get("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    if (principal != null) {
                        val userIdStr = principal.subject
                        if (!userIdStr.isNullOrBlank()) {
                            val userId = userIdStr.toLong()
                            val userResponse = authService.getUserById(userId)
                            if (userResponse != null) {
                                call.respond(userResponse)
                            } else {
                                call.respond(mapOf("error" to "User not found"))
                            }
                        } else {
                            call.respond(mapOf("error" to "Invalid token"))
                        }
                    } else {
                        call.respond(mapOf("error" to "Unauthorized"))
                    }
                } catch (e: Exception) {
                    call.respond(mapOf("error" to "Failed to fetch user: ${e.message}"))
                }
            }
        }
    }
}


