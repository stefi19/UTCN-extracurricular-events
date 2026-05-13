package com.example.integration
import com.example.dto.AuthResponse
import com.example.dto.EventRequest
import com.example.dto.EventResponse
import com.example.dto.RegistrationRequest
import com.example.dto.RegistrationResponse
import com.example.dto.RegisterRequest
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
class RegistrationIntegrationTest {
    private suspend fun registerAndGetToken(client: HttpClient, email: String, role: String = "STUDENT"): String =
        client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(
                RegisterRequest(
                    email = email, password = "Password1!",
                    firstName = "Test", lastName = role.lowercase().replaceFirstChar { it.uppercase() }, role = role
                )
            )
        }.body<AuthResponse>().token
    private suspend fun createEvent(client: HttpClient, token: String, title: String = "Test Event"): EventResponse =
        client.post("/api/events") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(EventRequest(title = title, description = "Desc", date = "2026-06-01", category = "Tech", department = "CS"))
        }.body<EventResponse>()
    @Test
    fun studentCanRegisterForEvent() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-reg@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-reg@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val response = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        assertEquals(HttpStatusCode.Created, response.status)
        val registration = response.body<RegistrationResponse>()
        assertEquals("REGISTERED", registration.status)
        assertEquals(event.id, registration.eventId)
    }
    @Test
    fun studentCannotRegisterTwiceForSameEvent() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-dup@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-dup@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        val secondResponse = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        assertEquals(HttpStatusCode.BadRequest, secondResponse.status)
    }
    @Test
    fun studentCanGetOwnRegistrations() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-list@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-list@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        val response = client.get("/api/registrations") { bearerAuth(studentToken) }
        assertEquals(HttpStatusCode.OK, response.status)
        val registrations = response.body<List<RegistrationResponse>>()
        assertEquals(1, registrations.size)
        assertEquals(event.id, registrations[0].eventId)
    }
    @Test
    fun studentCanCancelRegistration() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-cancel@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-cancel@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val registration = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }.body<RegistrationResponse>()
        val cancelResponse = client.delete("/api/registrations/${registration.id}") {
            bearerAuth(studentToken)
        }
        assertEquals(HttpStatusCode.NoContent, cancelResponse.status)
    }
    @Test
    fun cancelUnknownRegistrationReturns400() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val studentToken = registerAndGetToken(client, "stu-unknown@example.com", "STUDENT")
        val cancelResponse = client.delete("/api/registrations/9999") {
            bearerAuth(studentToken)
        }
        assertEquals(HttpStatusCode.BadRequest, cancelResponse.status)
    }
    @Test
    fun cancelWithInvalidIdReturns400() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val studentToken = registerAndGetToken(client, "stu-invalid-id@example.com", "STUDENT")
        val cancelResponse = client.delete("/api/registrations/not-a-number") {
            bearerAuth(studentToken)
        }
        assertEquals(HttpStatusCode.BadRequest, cancelResponse.status)
    }
    @Test
    fun organizerCanGetEventParticipants() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-part@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-part@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        val response = client.get("/api/registrations/event/${event.id}") {
            bearerAuth(organizerToken)
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val participants = response.body<List<RegistrationResponse>>()
        assertEquals(1, participants.size)
    }
    @Test
    fun studentCannotGetEventParticipants() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-part2@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-part2@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val response = client.get("/api/registrations/event/${event.id}") {
            bearerAuth(studentToken)
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
    @Test
    fun organizerCanUpdateRegistrationStatus() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-status@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-status@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val registration = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }.body<RegistrationResponse>()
        val updateResponse = client.put("/api/registrations/${registration.id}/status") {
            bearerAuth(organizerToken)
            contentType(ContentType.Application.Json)
            setBody(mapOf("status" to "ATTENDED"))
        }
        assertEquals(HttpStatusCode.NoContent, updateResponse.status)
    }
    @Test
    fun studentCannotUpdateRegistrationStatus() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-status2@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-status2@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val registration = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }.body<RegistrationResponse>()
        val updateResponse = client.put("/api/registrations/${registration.id}/status") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(mapOf("status" to "ATTENDED"))
        }
        assertEquals(HttpStatusCode.BadRequest, updateResponse.status)
    }
    @Test
    fun registrationWithoutAuthReturns401() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val response = client.get("/api/registrations")
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
    @Test
    fun reRegistrationAfterCancellationSucceeds() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val organizerToken = registerAndGetToken(client, "org-rereg@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-rereg@example.com", "STUDENT")
        val event = createEvent(client, organizerToken)
        val reg = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }.body<RegistrationResponse>()
        client.delete("/api/registrations/${reg.id}") { bearerAuth(studentToken) }
        val reRegResponse = client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        assertEquals(HttpStatusCode.Created, reRegResponse.status)
        assertEquals("REGISTERED", reRegResponse.body<RegistrationResponse>().status)
    }
}
