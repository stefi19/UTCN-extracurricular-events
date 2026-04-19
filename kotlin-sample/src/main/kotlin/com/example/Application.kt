package com.example

import com.example.controller.AuthController
import com.example.controller.CategoryController
import com.example.controller.DepartmentController
import com.example.controller.EventController
import com.example.controller.RegistrationController
import com.example.controller.UserController
import com.example.db.DatabaseFactory
import com.example.db.dao.JdbcCategoryDao
import com.example.db.dao.JdbcDepartmentDao
import com.example.db.dao.JdbcEventDao
import com.example.db.dao.JdbcRegistrationDao
import com.example.db.dao.JdbcUserDao
import com.example.dto.ErrorResponse
import com.example.security.JwtManager
import com.example.service.AuthService
import com.example.service.CategoryService
import com.example.service.DepartmentService
import com.example.service.EventService
import com.example.service.RegistrationService
import com.example.service.UserService
import io.ktor.http.HttpStatusCode
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
import org.slf4j.LoggerFactory

fun Application.module() {
    val logger = LoggerFactory.getLogger("Application")

    install(ContentNegotiation) {
        json()
    }

    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            val status = HttpStatusCode.BadRequest
            call.respond(status, ErrorResponse(cause.message.orEmpty(), status.value))
        }
        exception<IllegalStateException> { call, cause ->
            val status = HttpStatusCode.Conflict
            call.respond(status, ErrorResponse(cause.message.orEmpty(), status.value))
        }
        exception<Exception> { call, cause ->
            logger.error("Unhandled exception", cause)
            val status = HttpStatusCode.InternalServerError
            call.respond(status, ErrorResponse("Internal server error", status.value))
        }
    }

    val jwtManager = JwtManager()

    install(Authentication) {
        jwt {
            realm = jwtManager.realm
            verifier(jwtManager.verifier)
            validate { jwtCredential ->
                JWTPrincipal(jwtCredential.payload)
            }
            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    ErrorResponse("Token is invalid or expired", HttpStatusCode.Unauthorized.value)
                )
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
    val userService = UserService(userDao)
    val eventService = EventService(eventDao)
    val registrationService = RegistrationService(registrationDao, eventDao)
    val categoryService = CategoryService(categoryDao)
    val departmentService = DepartmentService(departmentDao)

    // Controllers
    val authController = AuthController(authService)
    val userController = UserController(userService)
    val eventController = EventController(eventService)
    val registrationController = RegistrationController(registrationService)
    val categoryController = CategoryController(categoryService)
    val departmentController = DepartmentController(departmentService)

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
            categoryController.register(this)
            departmentController.register(this)
        }
    }

    logger.info("Application started")
}
