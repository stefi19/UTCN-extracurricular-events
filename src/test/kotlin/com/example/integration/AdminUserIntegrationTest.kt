package com.example.integration
import com.example.dto.AuthResponse
import com.example.dto.CreateOrganizerRequest
import com.example.dto.RegisterRequest
import com.example.dto.UserResponse
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
class AdminUserIntegrationTest {
    private suspend fun registerAndGetToken(
        client: HttpClient,
        email: String,
        role: String
    ): String {
        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(
                RegisterRequest(
                    email = email,
                    password = "Password1!",
                    firstName = "Test",
                    lastName = role.lowercase().replaceFirstChar { it.uppercase() },
                    role = role
                )
            )
        }
        return response.body<AuthResponse>().token
    }
    @Test
    fun adminCanCreateOrganizerAndReadOrganizerList() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-users@example.com", "ADMIN")
        val createResponse = client.post("/api/users/organizers") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(
                CreateOrganizerRequest(
                    email = "new-organizer@example.com",
                    password = "Organizer1!",
                    firstName = "Nora",
                    lastName = "Admin"
                )
            )
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)
        assertEquals("ORGANIZER", createResponse.body<UserResponse>().role)
        val roleResponse = client.get("/api/users/organizer") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.OK, roleResponse.status)
        assertTrue(roleResponse.body<List<UserResponse>>().any { it.email == "new-organizer@example.com" })
    }
    @Test
    fun nonAdminCannotCreateOrganizer() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val studentToken = registerAndGetToken(client, "student-users@example.com", "STUDENT")
        val response = client.post("/api/users/organizers") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(
                CreateOrganizerRequest(
                    email = "blocked-organizer@example.com",
                    password = "Organizer1!",
                    firstName = "Blocked",
                    lastName = "User"
                )
            )
        }
        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
    @Test
    fun createOrganizerWithWeakPasswordReturnsBadRequest() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-weak-pass@example.com", "ADMIN")
        val response = client.post("/api/users/organizers") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(
                CreateOrganizerRequest(
                    email = "weak-organizer@example.com",
                    password = "weak",
                    firstName = "Weak",
                    lastName = "Password"
                )
            )
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun invalidRoleFilterReturnsBadRequest() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-invalid-role@example.com", "ADMIN")
        val response = client.get("/api/users/notarole") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun adminCanGetUsersGroupedByRole() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-list-users@example.com", "ADMIN")
        registerAndGetToken(client, "student-list-users@example.com", "STUDENT")
        val response = client.get("/api/users") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<Map<String, List<UserResponse>>>()
        assertTrue(body.containsKey("students"))
        assertTrue(body.containsKey("organizers"))
        assertTrue(body.containsKey("admins"))
        assertTrue(body.getValue("admins").any { it.email == "admin-list-users@example.com" })
    }
}
