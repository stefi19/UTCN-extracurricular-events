package com.example.security
import com.example.model.UserRole
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
object AuthorizationUtil {
    suspend fun getUserIdFromPrincipal(call: ApplicationCall): Long? {
        val principal = call.principal<JWTPrincipal>()
        return principal?.subject?.toLongOrNull()
    }
    suspend fun getUserRoleFromPrincipal(call: ApplicationCall): UserRole? {
        val principal = call.principal<JWTPrincipal>()
        val role = principal?.payload?.getClaim("role")?.asString()
        return role?.let { UserRole.valueOf(it) }
    }
    suspend fun hasRole(call: ApplicationCall, vararg requiredRoles: UserRole): Boolean {
        val userRole = getUserRoleFromPrincipal(call) ?: return false
        return userRole in requiredRoles
    }
    suspend fun requireRole(call: ApplicationCall, vararg requiredRoles: UserRole): Boolean {
        if (!hasRole(call, *requiredRoles)) {
            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Insufficient permissions"))
            return false
        }
        return true
    }
    suspend fun requireAdmin(call: ApplicationCall): Boolean {
        return requireRole(call, UserRole.ADMIN)
    }
    suspend fun requireOrganizerOrAdmin(call: ApplicationCall): Boolean {
        return requireRole(call, UserRole.ORGANIZER, UserRole.ADMIN)
    }
    suspend fun getPrincipal(call: ApplicationCall): JWTPrincipal? {
        return call.principal<JWTPrincipal>()
    }
}
