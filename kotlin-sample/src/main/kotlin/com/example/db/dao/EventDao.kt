package com.example.db.dao

import com.example.model.Event

interface EventDao {
    fun findAll(): List<Event>
    fun findById(id: Long): Event?
    fun create(event: Event): Event
    fun update(id: Long, event: Event): Event?
    fun delete(id: Long): Boolean
}

