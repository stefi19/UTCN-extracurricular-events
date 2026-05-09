package com.example.fake

import com.example.db.dao.UserDao
import com.example.model.User
import com.example.model.UserRole

class FakeUserDao : UserDao {
    private val users = mutableMapOf<Long, User>()
    private var nextId = 1L

    override fun findByEmail(email: String): User? = users.values.find { it.email == email }

    override fun findById(id: Long): User? = users[id]

    override fun create(user: User): User {
        val created = user.copy(id = nextId++)
        users[created.id] = created
        return created
    }

    override fun update(id: Long, user: User): User? {
        if (!users.containsKey(id)) return null
        val updated = user.copy(id = id)
        users[id] = updated
        return updated
    }

    override fun delete(id: Long): Boolean = users.remove(id) != null

    override fun findByRole(role: UserRole): List<User> = users.values.filter { it.role == role }
}
