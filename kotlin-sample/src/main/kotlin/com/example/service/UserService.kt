package com.example.service

import com.example.db.dao.UserDao
import com.example.dto.UserResponse
import com.example.model.User
import com.example.model.UserRole
import org.slf4j.LoggerFactory

class UserService(private val userDao: UserDao) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)

    fun findAll(): Map<String, List<UserResponse>> {
        logger.info("Listing all users grouped by role")
        val students = userDao.findByRole(UserRole.STUDENT).map { it.toResponse() }
        val organizers = userDao.findByRole(UserRole.ORGANIZER).map { it.toResponse() }
        val admins = userDao.findByRole(UserRole.ADMIN).map { it.toResponse() }
        return mapOf("students" to students, "organizers" to organizers, "admins" to admins)
    }

    fun findByRole(role: UserRole): List<UserResponse> {
        logger.info("Getting users by role={}", role)
        return userDao.findByRole(role).map { it.toResponse() }
    }

    fun findById(id: Long): UserResponse? {
        logger.info("Getting user id={}", id)
        return userDao.findById(id)?.toResponse()
    }

    private fun User.toResponse() = UserResponse(
        id = id, email = email, firstName = firstName,
        lastName = lastName, role = role.name, departmentId = departmentId
    )
}
