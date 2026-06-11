package com.example.db.dao
import com.example.model.Registration
interface RegistrationDao {
    fun create(registration: Registration): Registration
    fun findById(id: Long): Registration?
    fun findAll(): List<Registration>
    fun findByStudentId(studentId: Long): List<Registration>
    fun findByEventId(eventId: Long): List<Registration>
    fun findByStudentAndEvent(studentId: Long, eventId: Long): Registration?
    fun findByStudentAndEventAny(studentId: Long, eventId: Long): Registration?
    fun reactivate(id: Long, status: String = "REGISTERED"): Registration?
    fun countByEventIdAndStatus(eventId: Long, status: String): Int
    fun findFirstByEventIdAndStatus(eventId: Long, status: String): Registration?
    fun updateStatus(id: Long, status: String): Boolean
    fun delete(id: Long): Boolean
}
