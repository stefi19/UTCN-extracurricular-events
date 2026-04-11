package com.example

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ApplicationTest {
    @Test
    fun healthEndpointReturnsOk() = testApplication {
        application {
            module()
        }

        val response = client.get("/health")

        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue(response.bodyAsText().contains("ok"))
    }

    @Test
    fun eventCrudFlowWorks() = testApplication {
        application {
            module()
        }

        val createResponse = client.post("/api/events") {
            contentType(ContentType.Application.Json)
            setBody(
                """
                {
                  "title":"Coding Contest",
                  "description":"Algo challenge",
                  "date":"2026-05-20",
                  "category":"Contest",
                  "department":"CS"
                }
                """.trimIndent()
            )
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)

        val listResponse = client.get("/api/events")
        assertEquals(HttpStatusCode.OK, listResponse.status)
        assertTrue(listResponse.bodyAsText().contains("Coding Contest"))

        val updateResponse = client.put("/api/events/1") {
            contentType(ContentType.Application.Json)
            setBody(
                """
                {
                  "title":"Coding Contest Finals",
                  "description":"Final round",
                  "date":"2026-05-22",
                  "category":"Contest",
                  "department":"CS"
                }
                """.trimIndent()
            )
        }
        assertEquals(HttpStatusCode.OK, updateResponse.status)

        val deleteResponse = client.delete("/api/events/1")
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)
    }
}

