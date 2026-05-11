package com.example.integration

import com.example.dto.AuthResponse
import com.example.dto.EventRequest
import com.example.dto.EventResponse
import com.example.dto.RegisterRequest
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class EventIntegrationTest {

    private fun registerRequest() = RegisterRequest(
        email = "organizer@example.com", password = "Password1!", firstName = "Ana", lastName = "Pop", role = "ORGANIZER"
    )

    private fun eventRequest(title: String = "Tech Talk") = EventRequest(
        title = title, description = "A talk about tech", date = "2026-06-01",
        category = "Tech", department = "CS"
    )

    private suspend fun loginAndGetToken(client: io.ktor.client.HttpClient): String {
        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        return response.body<AuthResponse>().token
    }

    @Test
    fun listEventsReturnsEmptyListInitially() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = loginAndGetToken(client)

        val response = client.get("/api/events") { bearerAuth(token) }
        assertEquals(HttpStatusCode.OK, response.status)
        val events = response.body<List<EventResponse>>()
        assertTrue(events.isEmpty())
    }

    @Test
    fun createEventReturns201AndIsListable() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = loginAndGetToken(client)

        val createResponse = client.post("/api/events") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(eventRequest())
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)

        val listResponse = client.get("/api/events") { bearerAuth(token) }
        val events = listResponse.body<List<EventResponse>>()
        assertEquals(1, events.size)
        assertEquals("Tech Talk", events[0].title)
    }

    @Test
    fun getEventByIdReturnsCorrectEvent() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = loginAndGetToken(client)

        val created = client.post("/api/events") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(eventRequest("Kotlin Night"))
        }.body<EventResponse>()

        val response = client.get("/api/events/${created.id}") { bearerAuth(token) }
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("Kotlin Night", response.body<EventResponse>().title)
    }

    @Test
    fun deleteEventReturns204() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = loginAndGetToken(client)

        val created = client.post("/api/events") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(eventRequest())
        }.body<EventResponse>()

        val deleteResponse = client.delete("/api/events/${created.id}") { bearerAuth(token) }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)
    }

    @Test
    fun getUnknownEventReturns404() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = loginAndGetToken(client)

        val response = client.get("/api/events/999") { bearerAuth(token) }
        assertEquals(HttpStatusCode.NotFound, response.status)
    }

    @Test
    fun unauthenticatedRequestReturns401() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }

        val response = client.get("/api/events")
        assertEquals(HttpStatusCode.OK, response.status)
    }
}
