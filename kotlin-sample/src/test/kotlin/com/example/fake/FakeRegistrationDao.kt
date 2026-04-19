package com.example.fake

import com.example.db.dao.RegistrationDao
import com.example.model.Registration

class FakeRegistrationDao : RegistrationDao {
    private val registrations = mutableMapOf<Long, Registration>()
    private var nextId = 1L

    override fun create(registration: Registration): Registration {
        val created = registration.copy(id = nextId++)
        registrations[created.id] = created
        return created
    }

    override fun findById(id: Long): Registration? = registrations[id]

    override fun findByStudentId(studentId: Long): List<Registration> =
        registrations.values.filter { it.studentId == studentId }

    override fun findByEventId(eventId: Long): List<Registration> =
        registrations.values.filter { it.eventId == eventId }

    override fun findByStudentAndEvent(studentId: Long, eventId: Long): Registration? =
        registrations.values.find { it.studentId == studentId && it.eventId == eventId }

    override fun updateStatus(id: Long, status: String): Boolean {
        val reg = registrations[id] ?: return false
        registrations[id] = reg.copy(status = status)
        return true
    }

    override fun delete(id: Long): Boolean = registrations.remove(id) != null
}
