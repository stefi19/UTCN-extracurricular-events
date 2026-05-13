package com.example.controller
import com.example.dto.DepartmentRequest
import com.example.security.AuthorizationUtil
import com.example.service.DepartmentService
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
class DepartmentController(private val departmentService: DepartmentService) {
    fun register(routing: Route) {
        routing.route("/api/departments") {
            get {
                call.respond(departmentService.findAll())
            }
            get("/{id}") {
                val departmentId = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid department ID"))
                val department = departmentService.findById(departmentId)
                    ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "Department not found"))
                call.respond(department)
            }
            post {
                if (!AuthorizationUtil.requireAdmin(call)) return@post
                val request = call.receive<DepartmentRequest>()
                val created = departmentService.create(request)
                call.respond(HttpStatusCode.Created, created)
            }
            put("/{id}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@put
                val departmentId = call.parameters["id"]?.toLongOrNull()
                    ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid department ID"))
                val request = call.receive<DepartmentRequest>()
                val updated = departmentService.update(departmentId, request)
                    ?: return@put call.respond(HttpStatusCode.NotFound, mapOf("error" to "Department not found"))
                call.respond(updated)
            }
            delete("/{id}") {
                if (!AuthorizationUtil.requireAdmin(call)) return@delete
                val departmentId = call.parameters["id"]?.toLongOrNull()
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid department ID"))
                if (departmentService.delete(departmentId)) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("error" to "Department not found"))
                }
            }
        }
    }
}
