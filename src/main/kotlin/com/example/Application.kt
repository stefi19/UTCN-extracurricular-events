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
import com.example.messaging.LogNotificationPublisher
import com.example.messaging.RabbitMQNotificationPublisher
import com.example.security.JwtManager
import com.example.service.AuthService
import com.example.service.CategoryService
import com.example.service.DepartmentService
import com.example.service.EventService
import com.example.service.RegistrationService
import com.example.service.UserService
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
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
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.html.respondHtml
import io.ktor.server.http.content.staticResources
import kotlinx.coroutines.GlobalScope
import kotlinx.html.*
import org.slf4j.LoggerFactory

fun Application.module() {
    val logger = LoggerFactory.getLogger("Application")

    install(ContentNegotiation) {
        json()
    }

    install(CORS) {
        allowHost("localhost:4200")
        allowHost("127.0.0.1:4200")
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
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

    val dataSource = DatabaseFactory.createPostgresDataSource()
    DatabaseFactory.runMigrations(dataSource)

    val userDao = JdbcUserDao(dataSource)
    val eventDao = JdbcEventDao(dataSource)
    val registrationDao = JdbcRegistrationDao(dataSource)
    val categoryDao = JdbcCategoryDao(dataSource)
    val departmentDao = JdbcDepartmentDao(dataSource)

    val notificationPublisher = try {
        RabbitMQNotificationPublisher(GlobalScope)
    } catch (exception: Exception) {
        logger.warn("RabbitMQ unavailable, falling back to log publisher: {}", exception.message)
        LogNotificationPublisher()
    }

    val authService = AuthService(userDao, jwtManager, notificationPublisher)
    val userService = UserService(userDao)
    val eventService = EventService(eventDao)
    val registrationService = RegistrationService(registrationDao, eventDao, notificationPublisher)
    val categoryService = CategoryService(categoryDao)
    val departmentService = DepartmentService(departmentDao)

    val authController = AuthController(authService)
    val userController = UserController(userService)
    val eventController = EventController(eventService)
    val registrationController = RegistrationController(registrationService)
    val categoryController = CategoryController(categoryService)
    val departmentController = DepartmentController(departmentService)

    routing {
        // Serve static files (CSS, JS)
        staticResources("/static", "static")

        // Home page
        get("/") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"UTCN Events - Technical University of Cluj-Napoca" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/profile") { +"Profile" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    div(classes = "hero") {
                        div(classes = "container") {
                            h2 { +"Welcome to UTCN Events" }
                            p { +"Discover and register for exciting events at Technical University of Cluj-Napoca" }
                            a(href = "/events", classes = "btn") { +"Browse Events" }
                        }
                    }
                    main {
                        div(classes = "container") {
                            h2 { +"Featured Events" }
                            div(classes = "events-grid") {
                                id = "events-container"
                                div(classes = "loading") {
                                    +"Loading featured events..."
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/app.js") {}
                }
            }
        }

        // Events page
        get("/events") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"All Events - UTCN Events" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/profile") { +"Profile" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    main {
                        div(classes = "container") {
                            h2 { +"Upcoming Events" }
                            div(classes = "events-grid") {
                                id = "events-container"
                                div(classes = "loading") {
                                    +"Loading events..."
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/app.js") {}
                }
            }
        }

        // Login page
        get("/login") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"Login - UTCN Events" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/profile") { +"Profile" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    main {
                        div(classes = "container") {
                            div(classes = "login-container") {
                                h2 { +"Login to UTCN Events" }
                                form {
                                    id = "login-form"
                                    classes = setOf("login-form")
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "email"
                                            +"Email Address"
                                        }
                                        input(type = InputType.email, name = "email") {
                                            id = "email"
                                            required = true
                                            placeholder = "your.name@student.utcluj.ro"
                                        }
                                    }
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "password"
                                            +"Password"
                                        }
                                        input(type = InputType.password, name = "password") {
                                            id = "password"
                                            required = true
                                            placeholder = "Enter your password"
                                        }
                                    }
                                    div(classes = "error-message") {
                                        id = "error-message"
                                        style = "display: none; color: #c9302c; margin-bottom: 15px; padding: 10px; background: #f2dede; border-radius: 4px;"
                                    }
                                    button(type = ButtonType.submit, classes = "btn btn-primary") {
                                        +"Sign In"
                                    }
                                    p(classes = "login-footer") {
                                        style = "margin-top: 20px; text-align: center; color: #666;"
                                        +"Don't have an account? "
                                        a(href = "/signup") {
                                            style = "color: var(--utcn-navy);"
                                            +"Register here"
                                        }
                                    }
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/login.js") {}
                }
            }
        }

        // Signup page
        get("/signup") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"Sign Up - UTCN Events" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/profile") { +"Profile" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    main {
                        div(classes = "container") {
                            div(classes = "login-container") {
                                h2 { +"Create Your Account" }
                                form {
                                    id = "signup-form"
                                    classes = setOf("login-form")
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "firstName"
                                            +"First Name"
                                        }
                                        input(type = InputType.text, name = "firstName") {
                                            id = "firstName"
                                            required = true
                                            placeholder = "John"
                                        }
                                    }
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "lastName"
                                            +"Last Name"
                                        }
                                        input(type = InputType.text, name = "lastName") {
                                            id = "lastName"
                                            required = true
                                            placeholder = "Doe"
                                        }
                                    }
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "email"
                                            +"Email Address"
                                        }
                                        input(type = InputType.email, name = "email") {
                                            id = "email"
                                            required = true
                                            placeholder = "your.name@student.utcluj.ro"
                                        }
                                    }
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "password"
                                            +"Password"
                                        }
                                        input(type = InputType.password, name = "password") {
                                            id = "password"
                                            required = true
                                            placeholder = "Enter a strong password"
                                        }
                                    }
                                    div(classes = "form-group") {
                                        label {
                                            htmlFor = "confirmPassword"
                                            +"Confirm Password"
                                        }
                                        input(type = InputType.password, name = "confirmPassword") {
                                            id = "confirmPassword"
                                            required = true
                                            placeholder = "Re-enter your password"
                                        }
                                    }
                                    div(classes = "error-message") {
                                        id = "error-message"
                                        style = "display: none; color: #c9302c; margin-bottom: 15px; padding: 10px; background: #f2dede; border-radius: 4px;"
                                    }
                                    button(type = ButtonType.submit, classes = "btn btn-primary") {
                                        +"Create Account"
                                    }
                                    p(classes = "login-footer") {
                                        style = "margin-top: 20px; text-align: center; color: #666;"
                                        +"Already have an account? "
                                        a(href = "/login") {
                                            style = "color: var(--utcn-navy);"
                                            +"Login here"
                                        }
                                    }
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/signup.js") {}
                }
            }
        }

        // My Registrations page
        get("/my-registrations") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"My Registrations - UTCN Events" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    main {
                        div(classes = "container") {
                            h2 { +"My Event Registrations" }
                            div(classes = "events-grid") {
                                id = "registrations-container"
                                div(classes = "loading") {
                                    +"Loading your registrations..."
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/app.js") {}
                    script(src = "/static/js/registrations.js") {}
                }
            }
        }

        // Profile page
        get("/profile") {
            call.respondHtml {
                head {
                    meta(charset = "UTF-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
                    title { +"My Profile - UTCN Events" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    header {
                        div(classes = "container") {
                            nav {
                                h1 { +"UTCN Events" }
                                ul {
                                    li { a(href = "/") { +"Home" } }
                                    li { a(href = "/events") { +"Events" } }
                                    li { a(href = "/my-registrations") { +"My Registrations" } }
                                    li { a(href = "/profile") { +"Profile" } }
                                    li { a(href = "/login") { +"Login" } }
                                }
                            }
                        }
                    }
                    main {
                        div(classes = "container") {
                            h2 { +"My Profile" }
                            
                            div {
                                id = "profile-container"
                                div(classes = "loading") {
                                    +"Loading your profile..."
                                }
                            }
                            
                            div {
                                style = "margin-top: 3rem;"
                                h3 { +"My Recent Registrations" }
                                div {
                                    id = "profile-registrations-container"
                                    div(classes = "loading") {
                                        +"Loading your registrations..."
                                    }
                                }
                            }
                        }
                    }
                    footer {
                        div(classes = "container") {
                            p { +"© 2026 Technical University of Cluj-Napoca. All rights reserved." }
                        }
                    }
                    script(src = "/static/js/app.js") {}
                    script(src = "/static/js/profile.js") {}
                }
            }
        }

        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }

        authController.register(this)
        
        // Public events API (GET only - no authentication required)
        eventController.registerPublic(this)

        authenticate {
            authController.registerProtected(this)
            eventController.register(this)  // Protected operations (POST, PUT, DELETE)
            userController.register(this)
            registrationController.register(this)
            categoryController.register(this)
            departmentController.register(this)
        }
    }

    logger.info("Application started")
}