package com.example.fake
import com.example.db.dao.EventDao
import com.example.model.Event
class FakeEventDao : EventDao {
    private val events = mutableMapOf<Long, Event>()
    private var nextId = 1L
    override fun findAll(): List<Event> = events.values.toList()
    override fun findById(id: Long): Event? = events[id]
    override fun create(event: Event): Event {
        val created = event.copy(id = nextId++)
        events[created.id] = created
        return created
    }
    override fun update(id: Long, event: Event): Event? {
        if (!events.containsKey(id)) return null
        val updated = event.copy(id = id)
        events[id] = updated
        return updated
    }
    override fun delete(id: Long): Boolean = events.remove(id) != null
}
