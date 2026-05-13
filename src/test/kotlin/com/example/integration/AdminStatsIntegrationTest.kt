package com.example.integration
import com.example.controller.AdminStatsResponse
import com.example.dto.AuthResponse
import com.example.dto.EventRequest
import com.example.dto.RegistrationRequest
import com.example.dto.RegisterRequest
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
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
class AdminStatsIntegrationTest {
    private suspend fun registerAndGetToken(
        client: HttpClient, email: String, role: String
    ): String = client.post("/api/auth/register") {
        contentType(ContentType.Application.Json)
        setBody(
            RegisterRequest(
                email = email, password = "Password1!",
                firstName = "Test", lastName = role.lowercase().replaceFirstChar { it.uppercase() }, role = role
            )
        )
    }.body<AuthResponse>().token
    @Test
    fun adminCanGetStats() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-stats@example.com", "ADMIN")
        val response = client.get("/api/admin/stats") { bearerAuth(adminToken) }
        assertEquals(HttpStatusCode.OK, response.status)
        val stats = response.body<AdminStatsResponse>()
        assertTrue(stats.users.total >= 1)
        assertTrue(stats.users.admins >= 1)
    }
    @Test
    fun nonAdminCannotGetStats() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val studentToken = registerAndGetToken(client, "student-stats@example.com", "STUDENT")
        val response = client.get("/api/admin/stats") { bearerAuth(studentToken) }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
    @Test
    fun unauthenticatedCannotGetStats() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val response = client.get("/api/admin/stats")
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
    @Test
    fun statsReflectCreatedEventsAndRegistrations() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-stats2@example.com", "ADMIN")
        val organizerToken = registerAndGetToken(client, "org-stats2@example.com", "ORGANIZER")
        val studentToken = registerAndGetToken(client, "stu-stats2@example.com", "STUDENT")
        val eventResponse = client.post("/api/events") {
            bearerAuth(organizerToken)
            contentType(ContentType.Application.Json)
            setBody(EventRequest(title = "Stats Event", description = "Desc", date = "2099-06-01", category = "Tech", department = "CS"))
        }
        val event = eventResponse.body<com.example.dto.EventResponse>()
        client.post("/api/registrations") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(RegistrationRequest(eventId = event.id))
        }
        val statsResponse = client.get("/api/admin/stats") { bearerAuth(adminToken) }
        assertEquals(HttpStatusCode.OK, statsResponse.status)
        val stats = statsResponse.body<AdminStatsResponse>()
        assertEquals(1, stats.events.total)
        assertEquals(1, stats.events.upcoming)
        assertEquals(1, stats.registrations.total)
        assertEquals(1, stats.registrations.registered)
        assertEquals(0, stats.registrations.attended)
        assertTrue(stats.users.students >= 1)
        assertTrue(stats.users.organizers >= 1)
    }
    @Test
    fun statsShowCorrectTaxonomyCounts() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-tax@example.com", "ADMIN")
        client.post("/api/categories") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(com.example.dto.CategoryRequest(name = "StatsCat"))
        }
        client.post("/api/departments") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(com.example.dto.DepartmentRequest(name = "StatsDept"))
        }
        val stats = client.get("/api/admin/stats") { bearerAuth(adminToken) }.body<AdminStatsResponse>()
        assertEquals(1, stats.taxonomy.categories)
        assertEquals(1, stats.taxonomy.departments)
    }
}
