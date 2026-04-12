package com.example.repository

import com.example.db.dao.EventDao
import com.example.model.Event

class PostgresEventRepository(private val dao: EventDao) : EventRepository {
    override fun findAll(): List<Event> = dao.findAll()

    override fun findById(id: Long): Event? = dao.findById(id)

    override fun create(event: Event): Event = dao.create(event)

    override fun update(id: Long, event: Event): Event? = dao.update(id, event)

    override fun delete(id: Long): Boolean = dao.delete(id)
}
