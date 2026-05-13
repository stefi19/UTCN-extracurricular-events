package com.example.integration
import com.example.controller.AuthController
import com.example.controller.CategoryController
import com.example.controller.DepartmentController
import com.example.controller.EventController
import com.example.controller.RegistrationController
import com.example.controller.UserController
import com.example.dto.ErrorResponse
import com.example.fake.FakeCategoryDao
import com.example.fake.FakeDepartmentDao
import com.example.fake.FakeEventDao
import com.example.fake.FakeNotificationPublisher
import com.example.fake.FakeRegistrationDao
import com.example.fake.FakeUserDao
import com.example.security.JwtManager
import com.example.service.AuthService
import com.example.service.CategoryService
import com.example.service.DepartmentService
import com.example.service.EventService
import com.example.service.RegistrationService
import com.example.service.UserService
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.routing
import io.ktor.server.testing.ApplicationTestBuilder
private const val TEST_JWT_SECRET = "test-secret-key-for-tests"
fun ApplicationTestBuilder.setupTestApplication(
    userDao: FakeUserDao = FakeUserDao(),
    eventDao: FakeEventDao = FakeEventDao(),
    registrationDao: FakeRegistrationDao = FakeRegistrationDao(),
    categoryDao: FakeCategoryDao = FakeCategoryDao(),
    departmentDao: FakeDepartmentDao = FakeDepartmentDao(),
    publisher: FakeNotificationPublisher = FakeNotificationPublisher()
): Triple<AuthService, EventService, RegistrationService> {
    val jwtManager = JwtManager(TEST_JWT_SECRET)
    val authService = AuthService(userDao, jwtManager, publisher)
    val userService = UserService(userDao)
    val eventService = EventService(eventDao, userDao)
    val registrationService = RegistrationService(
        registrationDao = registrationDao,
        eventDao = eventDao,
        userDao = userDao,
        notificationPublisher = publisher
    )
    val categoryService = CategoryService(categoryDao)
    val departmentService = DepartmentService(departmentDao)
    application {
        install(ContentNegotiation) { json() }
        install(StatusPages) {
            exception<IllegalArgumentException> { call, cause ->
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(cause.message.orEmpty(), 400))
            }
        }
        install(Authentication) {
            jwt {
                realm = jwtManager.realm
                verifier(jwtManager.verifier)
                validate { JWTPrincipal(it.payload) }
                challenge { _, _ ->
                    call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Unauthorized", 401))
                }
            }
        }
        routing {
            AuthController(authService).register(this)
            EventController(eventService).registerPublic(this)
            authenticate {
                AuthController(authService).registerProtected(this)
                EventController(eventService).register(this)
                UserController(userService).register(this)
                RegistrationController(registrationService).register(this)
                CategoryController(categoryService).register(this)
                DepartmentController(departmentService).register(this)
            }
        }
    }
    return Triple(authService, eventService, registrationService)
}
