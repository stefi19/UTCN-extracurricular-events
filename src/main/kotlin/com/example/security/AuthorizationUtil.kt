package com.example.security

import com.example.model.UserRole
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond

/**
 * Authorization utility for role-based access control
 */
object AuthorizationUtil {
    
    /**
     * Get user ID from JWT principal
     */
    suspend fun getUserIdFromPrincipal(call: ApplicationCall): Long? {
        val principal = call.principal<JWTPrincipal>()
        return principal?.subject?.toLongOrNull()
    }

    /**
     * Get user role from JWT principal
     */
    suspend fun getUserRoleFromPrincipal(call: ApplicationCall): UserRole? {
        val principal = call.principal<JWTPrincipal>()
        val role = principal?.payload?.getClaim("role")?.asString()
        return role?.let { UserRole.valueOf(it) }
    }

    /**
     * Check if user has required role(s)
     * Returns true if user has any of the provided roles
     */
    suspend fun hasRole(call: ApplicationCall, vararg requiredRoles: UserRole): Boolean {
        val userRole = getUserRoleFromPrincipal(call) ?: return false
        return userRole in requiredRoles
    }

    /**
     * Require specific role(s), respond with Forbidden if not authorized
     */
    suspend fun requireRole(call: ApplicationCall, vararg requiredRoles: UserRole): Boolean {
        if (!hasRole(call, *requiredRoles)) {
            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Insufficient permissions"))
            return false
        }
        return true
    }

    /**
     * Require user to be admin
     */
    suspend fun requireAdmin(call: ApplicationCall): Boolean {
        return requireRole(call, UserRole.ADMIN)
    }

    /**
     * Require user to be organizer or admin
     */
    suspend fun requireOrganizerOrAdmin(call: ApplicationCall): Boolean {
        return requireRole(call, UserRole.ORGANIZER, UserRole.ADMIN)
    }

    /**
     * Get principal with null check
     */
    suspend fun getPrincipal(call: ApplicationCall): JWTPrincipal? {
        return call.principal<JWTPrincipal>()
    }
}


