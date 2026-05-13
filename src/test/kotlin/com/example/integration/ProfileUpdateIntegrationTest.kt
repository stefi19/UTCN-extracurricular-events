package com.example.integration
import com.example.dto.AuthResponse
import com.example.dto.RegisterRequest
import com.example.dto.UpdateProfileRequest
import com.example.dto.UserResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
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
class ProfileUpdateIntegrationTest {
    private suspend fun registerAndGetToken(
        client: HttpClient, email: String = "user-profile@example.com"
    ): String = client.post("/api/auth/register") {
        contentType(ContentType.Application.Json)
        setBody(
            RegisterRequest(
                email = email, password = "Password1!",
                firstName = "John", lastName = "Doe"
            )
        )
    }.body<AuthResponse>().token
    @Test
    fun profileUpdateChangesFirstAndLastName() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client)
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(firstName = "Jane", lastName = "Smith"))
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<UserResponse>()
        assertEquals("Jane", body.firstName)
        assertEquals("Smith", body.lastName)
    }
    @Test
    fun profileUpdateChangesEmail() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "change-email@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(email = "updated-email@example.com"))
        }
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("updated-email@example.com", response.body<UserResponse>().email)
    }
    @Test
    fun profileUpdateChangesPassword() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "pw-change@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(currentPassword = "Password1!", newPassword = "NewPass2@"))
        }
        assertEquals(HttpStatusCode.OK, response.status)
    }
    @Test
    fun profileUpdateFailsWithWrongCurrentPassword() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "wrong-pw@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(currentPassword = "WrongPass1!", newPassword = "NewPass2@"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun profileUpdateFailsWithNewPasswordButNoCurrentPassword() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "no-current-pw@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(newPassword = "NewPass2@"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun profileUpdateFailsWithWeakNewPassword() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "weak-new-pw@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(currentPassword = "Password1!", newPassword = "short"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun profileUpdateFailsWithBlankFirstName() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "blank-fn@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(firstName = "  "))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun profileUpdateFailsWithInvalidEmail() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val token = registerAndGetToken(client, "invalid-email@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(email = "not-an-email"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun profileUpdateRequiresAuthentication() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val response = client.put("/api/auth/profile") {
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(firstName = "Unauthenticated"))
        }
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
    @Test
    fun profileUpdateFailsWhenEmailAlreadyTaken() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        registerAndGetToken(client, "taken@example.com")
        val token = registerAndGetToken(client, "other@example.com")
        val response = client.put("/api/auth/profile") {
            bearerAuth(token)
            contentType(ContentType.Application.Json)
            setBody(UpdateProfileRequest(email = "taken@example.com"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
}
