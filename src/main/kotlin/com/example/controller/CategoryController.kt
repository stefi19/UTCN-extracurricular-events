package com.example.controller

import com.example.dto.CategoryRequest
import com.example.security.AuthorizationUtil
import com.example.service.CategoryService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route

class CategoryController(private val categoryService: CategoryService) {
    fun register(routing: Route) {
        routing.route("/api/categories") {
            get {
                call.respond(categoryService.findAll())
            }

            get("/{id}") {
                val categoryId = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid category ID"))

                val category = categoryService.findById(categoryId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "Category not found"))

                call.respond(category)
            }

            post {
                if (!AuthorizationUtil.requireAdmin(call)) return@post

                val request = call.receive<CategoryRequest>()
                val created = categoryService.create(request)
                call.respond(HttpStatusCode.Created, created)
            }

            put("/{id}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@put

                val categoryId = call.parameters["id"]?.toLongOrNull()
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid category ID"))

                val request = call.receive<CategoryRequest>()
                val updated = categoryService.update(categoryId, request)
                    ?: return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "Category not found"))

                call.respond(updated)
            }

            delete("/{id}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@delete

                val categoryId = call.parameters["id"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid category ID"))

                if (categoryService.delete(categoryId)) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("error" to "Category not found"))
                }
            }
        }
    }
}
