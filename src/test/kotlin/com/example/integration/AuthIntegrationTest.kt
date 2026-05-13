package com.example.integration
import com.example.dto.AuthResponse
import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.dto.UserResponse
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.post
import io.ktor.client.request.get
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
class AuthIntegrationTest {
    private fun registerRequest(email: String = "student@example.com") = RegisterRequest(
        email = email, password = "Password1!", firstName = "Jane", lastName = "Doe"
    )
    @Test
    fun registerEndpointReturns201WithToken() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        assertEquals(HttpStatusCode.Created, response.status)
        val body = response.body<AuthResponse>()
        assertTrue(body.token.isNotBlank())
        assertEquals("student@example.com", body.user.email)
    }
    @Test
    fun loginEndpointReturns200WithToken() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        val response = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest(email = "student@example.com", password = "Password1!"))
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<AuthResponse>()
        assertTrue(body.token.isNotBlank())
    }
    @Test
    fun loginWithWrongPasswordReturns400() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        val response = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest(email = "student@example.com", password = "WrongPass1!"))
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
    @Test
    fun meEndpointRequiresToken() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
    val response = client.get("/api/auth/me")
        assertEquals(HttpStatusCode.Unauthorized, response.status)
    }
    @Test
    fun meEndpointReturnsUserWithValidToken() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val registerResponse = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }.body<AuthResponse>()
        val response = client.get("/api/auth/me") {
            bearerAuth(registerResponse.token)
        }
        assertEquals(HttpStatusCode.OK, response.status)
        val body = response.body<UserResponse>()
        assertNotNull(body)
    }
    @Test
    fun registerDuplicateEmailReturns400() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        val response = client.post("/api/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(registerRequest())
        }
        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
}
