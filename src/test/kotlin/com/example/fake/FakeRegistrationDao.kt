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
    override fun findAll(): List<Registration> = registrations.values.toList()
    override fun findByStudentId(studentId: Long): List<Registration> =
        registrations.values.filter { it.studentId == studentId }
    override fun findByEventId(eventId: Long): List<Registration> =
        registrations.values.filter { it.eventId == eventId }
    override fun findByStudentAndEvent(studentId: Long, eventId: Long): Registration? =
        registrations.values.find { it.studentId == studentId && it.eventId == eventId && it.status != "CANCELLED" }
    override fun findByStudentAndEventAny(studentId: Long, eventId: Long): Registration? =
        registrations.values.find { it.studentId == studentId && it.eventId == eventId }
    override fun reactivate(id: Long, status: String): Registration? {
        val reg = registrations[id] ?: return null
        val reactivated = reg.copy(status = status, cancelledAt = null)
        registrations[id] = reactivated
        return reactivated
    }
    override fun countByEventIdAndStatus(eventId: Long, status: String): Int =
        registrations.values.count { it.eventId == eventId && it.status == status }
    override fun findFirstByEventIdAndStatus(eventId: Long, status: String): Registration? =
        registrations.values
            .filter { it.eventId == eventId && it.status == status }
            .sortedWith(compareBy<Registration> { it.registeredAt ?: "" }.thenBy { it.id })
            .firstOrNull()
    override fun updateStatus(id: Long, status: String): Boolean {
        val reg = registrations[id] ?: return false
        registrations[id] = reg.copy(
            status = status,
            cancelledAt = if (status == "CANCELLED") java.time.LocalDateTime.now().toString() else null
        )
        return true
    }
    override fun delete(id: Long): Boolean = registrations.remove(id) != null
}
