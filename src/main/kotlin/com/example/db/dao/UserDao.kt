package com.example.db.dao

import com.example.model.User
import com.example.model.UserRole

interface UserDao {
    fun findByEmail(email: String): User?
    fun findById(id: Long): User?
    fun create(user: User): User
    fun update(id: Long, user: User): User?
    fun delete(id: Long): Boolean
    fun findByRole(role: UserRole): List<User>
}

