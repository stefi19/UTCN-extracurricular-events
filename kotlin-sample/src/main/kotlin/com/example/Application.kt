package com.example

import com.example.controller.AuthController
import com.example.controller.EventController
import com.example.controller.AdminController
import com.example.controller.RegistrationController
import com.example.controller.UserController
import com.example.db.DatabaseFactory
import com.example.db.dao.JdbcCategoryDao
import com.example.db.dao.JdbcDepartmentDao
import com.example.db.dao.JdbcEventDao
import com.example.db.dao.JdbcRegistrationDao
import com.example.db.dao.JdbcUserDao
import com.example.security.JwtManager
import com.example.service.AuthService
import com.example.service.EventService
import com.example.service.RegistrationService
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
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

    val jwtManager = JwtManager()
    val secret = System.getenv("JWT_SECRET") ?: "your-secret-key-change-this-in-production"

    install(Authentication) {
        jwt {
            realm = "ktor sample app"
            verifier(JWT.require(Algorithm.HMAC256(secret))
                .withIssuer("utcn-events-api")
                .build())
            validate { jwtCredential ->
                JWTPrincipal(jwtCredential.payload)
            }
        }
    }

    // Database
    val dataSource = DatabaseFactory.createPostgresDataSource()
    DatabaseFactory.runMigrations(dataSource)

    // DAOs
    val userDao = JdbcUserDao(dataSource)
    val eventDao = JdbcEventDao(dataSource)
    val registrationDao = JdbcRegistrationDao(dataSource)
    val categoryDao = JdbcCategoryDao(dataSource)
    val departmentDao = JdbcDepartmentDao(dataSource)

    // Services
    val authService = AuthService(userDao, jwtManager)
    val eventService = EventService(eventDao)
    val registrationService = RegistrationService(registrationDao, eventDao)

    // Controllers
    val authController = AuthController(authService)
    val eventController = EventController(eventService)
    val userController = UserController(authService)
    val registrationController = RegistrationController(registrationService)
    val adminController = AdminController(categoryDao, departmentDao)

    routing {
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }

        // Public auth endpoints
        authController.register(this)

        // Protected endpoints
        authenticate {
            authController.registerProtected(this)
            eventController.register(this)
            userController.register(this)
            registrationController.register(this)
            adminController.register(this)
        }
    }
}
