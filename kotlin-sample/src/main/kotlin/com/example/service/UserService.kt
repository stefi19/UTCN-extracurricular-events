package com.example.service

import com.example.db.dao.UserDao
import com.example.dto.UserResponse
import com.example.model.User
import com.example.model.UserRole

class UserService(private val userDao: UserDao) {

    fun findAll(): Map<String, List<UserResponse>> {
        val students = userDao.findByRole(UserRole.STUDENT).map { it.toResponse() }
        val organizers = userDao.findByRole(UserRole.ORGANIZER).map { it.toResponse() }
        val admins = userDao.findByRole(UserRole.ADMIN).map { it.toResponse() }
        return mapOf("students" to students, "organizers" to organizers, "admins" to admins)
    }

    fun findByRole(role: UserRole): List<UserResponse> =
        userDao.findByRole(role).map { it.toResponse() }

    fun findById(id: Long): UserResponse? =
        userDao.findById(id)?.toResponse()

    private fun User.toResponse() = UserResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role.name,
        departmentId = departmentId
    )
}
