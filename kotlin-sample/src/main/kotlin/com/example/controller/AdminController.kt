package com.example.controller

import com.example.db.dao.CategoryDao
import com.example.db.dao.DepartmentDao
import com.example.model.Category
import com.example.dto.CategoryRequest
import com.example.model.Department
import com.example.dto.DepartmentRequest
import com.example.security.AuthorizationUtil
import com.example.model.UserRole
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

class AdminController(
    private val categoryDao: CategoryDao,
    private val departmentDao: DepartmentDao
) {
    fun register(routing: Route) {
        routing.route("/api/admin") {
            // Categories endpoints
            route("/categories") {
                // GET all categories (Public)
                get {
                    try {
                        val categories = categoryDao.findAll()
                        call.respond(categories)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // POST create category (Admin only)
                post {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@post

                        val request = call.receive<CategoryRequest>()
                        if (request.name.isBlank()) {
                            return@post call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Category name cannot be empty"))
                        }

                        // Check if category already exists
                        val existing = categoryDao.findByName(request.name)
                        if (existing != null) {
                            return@post call.respond(HttpStatusCode.Conflict,
                                mapOf("error" to "Category already exists"))
                        }

                        val category = Category(id = 0, name = request.name)
                        val created = categoryDao.create(category)
                        call.respond(HttpStatusCode.Created, created)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // PUT update category (Admin only)
                put("/{id}") {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@put

                        val categoryId = call.parameters["id"]?.toLongOrNull()
                            ?: return@put call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Invalid category ID"))

                        val request = call.receive<CategoryRequest>()
                        if (request.name.isBlank()) {
                            return@put call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Category name cannot be empty"))
                        }

                        val category = Category(id = categoryId, name = request.name)
                        val updated = categoryDao.update(categoryId, category)
                        if (updated != null) {
                            call.respond(updated)
                        } else {
                            call.respond(HttpStatusCode.NotFound,
                                mapOf("error" to "Category not found"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // DELETE category (Admin only)
                delete("/{id}") {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@delete

                        val categoryId = call.parameters["id"]?.toLongOrNull()
                            ?: return@delete call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Invalid category ID"))

                        if (categoryDao.delete(categoryId)) {
                            call.respond(HttpStatusCode.NoContent)
                        } else {
                            call.respond(HttpStatusCode.NotFound,
                                mapOf("error" to "Category not found"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }
            }

            // Departments endpoints
            route("/departments") {
                // GET all departments (Public)
                get {
                    try {
                        val departments = departmentDao.findAll()
                        call.respond(departments)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // POST create department (Admin only)
                post {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@post

                        val request = call.receive<DepartmentRequest>()
                        if (request.name.isBlank()) {
                            return@post call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Department name cannot be empty"))
                        }

                        // Check if department already exists
                        val existing = departmentDao.findByName(request.name)
                        if (existing != null) {
                            return@post call.respond(HttpStatusCode.Conflict,
                                mapOf("error" to "Department already exists"))
                        }

                        val department = Department(id = 0, name = request.name)
                        val created = departmentDao.create(department)
                        call.respond(HttpStatusCode.Created, created)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // PUT update department (Admin only)
                put("/{id}") {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@put

                        val departmentId = call.parameters["id"]?.toLongOrNull()
                            ?: return@put call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Invalid department ID"))

                        val request = call.receive<DepartmentRequest>()
                        if (request.name.isBlank()) {
                            return@put call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Department name cannot be empty"))
                        }

                        val department = Department(id = departmentId, name = request.name)
                        val updated = departmentDao.update(departmentId, department)
                        if (updated != null) {
                            call.respond(updated)
                        } else {
                            call.respond(HttpStatusCode.NotFound,
                                mapOf("error" to "Department not found"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }

                // DELETE department (Admin only)
                delete("/{id}") {
                    try {
                        if (!AuthorizationUtil.requireAdmin(call)) return@delete

                        val departmentId = call.parameters["id"]?.toLongOrNull()
                            ?: return@delete call.respond(HttpStatusCode.BadRequest,
                                mapOf("error" to "Invalid department ID"))

                        if (departmentDao.delete(departmentId)) {
                            call.respond(HttpStatusCode.NoContent)
                        } else {
                            call.respond(HttpStatusCode.NotFound,
                                mapOf("error" to "Department not found"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError,
                            mapOf("error" to e.message.orEmpty()))
                    }
                }
            }
        }
    }
}

