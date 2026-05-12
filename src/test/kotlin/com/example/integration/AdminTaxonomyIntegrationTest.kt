package com.example.integration

import com.example.dto.AuthResponse
import com.example.dto.CategoryRequest
import com.example.dto.CategoryResponse
import com.example.dto.DepartmentRequest
import com.example.dto.DepartmentResponse
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

class AdminTaxonomyIntegrationTest {

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
    fun adminCanCrudCategories() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-cat@example.com", "ADMIN")

        val createResponse = client.post("/api/categories") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(CategoryRequest(name = "Workshops"))
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)
        val created = createResponse.body<CategoryResponse>()

        val updateResponse = client.put("/api/categories/${created.id}") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(CategoryRequest(name = "Hands-on Workshops"))
        }
        assertEquals(HttpStatusCode.OK, updateResponse.status)
        assertEquals("Hands-on Workshops", updateResponse.body<CategoryResponse>().name)

        val deleteResponse = client.delete("/api/categories/${created.id}") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)
    }

    @Test
    fun studentCannotCreateCategory() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val studentToken = registerAndGetToken(client, "student-cat@example.com", "STUDENT")

        val response = client.post("/api/categories") {
            bearerAuth(studentToken)
            contentType(ContentType.Application.Json)
            setBody(CategoryRequest(name = "Forbidden Category"))
        }

        assertEquals(HttpStatusCode.Forbidden, response.status)
    }

    @Test
    fun adminGetsBadRequestForInvalidCategoryId() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-invalid-cat@example.com", "ADMIN")

        val response = client.get("/api/categories/not-a-number") {
            bearerAuth(adminToken)
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun adminCanCrudDepartments() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-dept@example.com", "ADMIN")

        val createResponse = client.post("/api/departments") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(DepartmentRequest(name = "Computer Science"))
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)
        val created = createResponse.body<DepartmentResponse>()

        val listResponse = client.get("/api/departments") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.OK, listResponse.status)
        assertEquals(1, listResponse.body<List<DepartmentResponse>>().size)

        val updateResponse = client.put("/api/departments/${created.id}") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(DepartmentRequest(name = "Automation and Computer Science"))
        }
        assertEquals(HttpStatusCode.OK, updateResponse.status)

        val deleteResponse = client.delete("/api/departments/${created.id}") {
            bearerAuth(adminToken)
        }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)
    }

    @Test
    fun studentCannotDeleteDepartment() = testApplication {
        setupTestApplication()
        val client = createClient { install(ContentNegotiation) { json() } }
        val adminToken = registerAndGetToken(client, "admin-seed-dept@example.com", "ADMIN")
        val studentToken = registerAndGetToken(client, "student-dept@example.com", "STUDENT")

        val created = client.post("/api/departments") {
            bearerAuth(adminToken)
            contentType(ContentType.Application.Json)
            setBody(DepartmentRequest(name = "Electrical Engineering"))
        }.body<DepartmentResponse>()

        val response = client.delete("/api/departments/${created.id}") {
            bearerAuth(studentToken)
        }

        assertEquals(HttpStatusCode.Forbidden, response.status)
    }
}
