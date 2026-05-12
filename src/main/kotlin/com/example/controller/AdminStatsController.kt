package com.example.controller

import com.example.model.UserRole
import com.example.security.AuthorizationUtil
import com.example.service.CategoryService
import com.example.service.DepartmentService
import com.example.service.EventService
import com.example.service.RegistrationService
import com.example.service.UserService
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable
import java.time.LocalDate

@Serializable
data class AdminStatsResponse(
    val users: UserStats,
    val events: EventStats,
    val registrations: RegistrationStats,
    val taxonomy: TaxonomyStats
)

@Serializable
data class UserStats(
    val total: Int,
    val students: Int,
    val organizers: Int,
    val admins: Int
)

@Serializable
data class EventStats(
    val total: Int,
    val upcoming: Int,
    val byCategory: Map<String, Int>
)

@Serializable
data class RegistrationStats(
    val total: Int,
    val registered: Int,
    val attended: Int,
    val cancelled: Int,
    val noShow: Int
)

@Serializable
data class TaxonomyStats(
    val categories: Int,
    val departments: Int
)

class AdminStatsController(
    private val userService: UserService,
    private val eventService: EventService,
    private val registrationService: RegistrationService,
    private val categoryService: CategoryService,
    private val departmentService: DepartmentService
) {
    fun register(routing: Route) {
        routing.route("/api/admin") {
            get("/stats") {
                if (!AuthorizationUtil.requireAdmin(call)) return@get

                val today = LocalDate.now().toString()

                val allUsers = userService.findAll()
                val students = allUsers["students"]?.size ?: 0
                val organizers = allUsers["organizers"]?.size ?: 0
                val admins = allUsers["admins"]?.size ?: 0
                val totalUsers = students + organizers + admins

                val events = eventService.listEvents()
                val totalEvents = events.size
                val upcomingEvents = events.count { it.date >= today }
                val byCategory = events
                    .groupBy { it.category.ifBlank { "Other" } }
                    .mapValues { it.value.size }

                val registrations = registrationService.getAllRegistrations()
                val totalRegs = registrations.size
                val regRegistered = registrations.count { reg -> reg.status == "REGISTERED" }
                val regAttended = registrations.count { reg -> reg.status == "ATTENDED" }
                val regCancelled = registrations.count { reg -> reg.status == "CANCELLED" }
                val regNoShow = registrations.count { reg -> reg.status == "NO_SHOW" }

                val categories = categoryService.findAll().size
                val departments = departmentService.findAll().size

                call.respond(
                    AdminStatsResponse(
                        users = UserStats(totalUsers, students, organizers, admins),
                        events = EventStats(totalEvents, upcomingEvents, byCategory),
                        registrations = RegistrationStats(
                            totalRegs, regRegistered, regAttended, regCancelled, regNoShow
                        ),
                        taxonomy = TaxonomyStats(categories, departments)
                    )
                )
            }
        }
    }
}
