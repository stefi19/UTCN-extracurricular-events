package com.example.repository

import com.example.model.Event

interface EventRepository {
    fun findAll(): List<Event>
    fun findById(id: Long): Event?
    fun create(event: Event): Event
    fun update(id: Long, event: Event): Event?
    fun delete(id: Long): Boolean
}

class InMemoryEventRepository : EventRepository {
    private val events = linkedMapOf<Long, Event>()
    private var nextId = 1L

    override fun findAll(): List<Event> = events.values.toList()

    override fun findById(id: Long): Event? = events[id]

    override fun create(event: Event): Event {
        val stored = event.copy(id = nextId++)
        events[stored.id] = stored
        return stored
    }

    override fun update(id: Long, event: Event): Event? {
        if (!events.containsKey(id)) return null
        val updated = event.copy(id = id)
        events[id] = updated
        return updated
    }

    override fun delete(id: Long): Boolean = events.remove(id) != null
}
