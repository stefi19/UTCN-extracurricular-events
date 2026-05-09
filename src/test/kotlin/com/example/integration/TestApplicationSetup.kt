package com.example.integration

import com.example.controller.AuthController
import com.example.controller.EventController
import com.example.controller.RegistrationController
import com.example.dto.ErrorResponse
import com.example.fake.FakeCategoryDao
import com.example.fake.FakeEventDao
import com.example.fake.FakeRegistrationDao
import com.example.fake.FakeUserDao
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
import com.example.security.JwtManager
import com.example.service.AuthService
import com.example.service.EventService
import com.example.service.RegistrationService
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

/** No-op publisher used in integration tests — avoids RabbitMQ dependency. */
class FakeNotificationPublisher : NotificationPublisher {
    val published = mutableListOf<NotificationMessage>()
    override suspend fun publish(message: NotificationMessage) {
        published.add(message)
    }
}

fun ApplicationTestBuilder.setupTestApplication(
    userDao: FakeUserDao = FakeUserDao(),
    eventDao: FakeEventDao = FakeEventDao(),
    registrationDao: FakeRegistrationDao = FakeRegistrationDao(),
    publisher: FakeNotificationPublisher = FakeNotificationPublisher()
): Triple<AuthService, EventService, RegistrationService> {
    val jwtManager = JwtManager(TEST_JWT_SECRET)
    val authService = AuthService(userDao, jwtManager, publisher)
    val eventService = EventService(eventDao)
    val registrationService = RegistrationService(registrationDao, eventDao, publisher)

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
            authenticate {
                AuthController(authService).registerProtected(this)
                EventController(eventService).register(this)
                RegistrationController(registrationService).register(this)
            }
        }
    }

    return Triple(authService, eventService, registrationService)
}
