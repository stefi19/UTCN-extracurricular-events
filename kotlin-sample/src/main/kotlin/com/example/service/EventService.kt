package com.example.service

import com.example.model.Event
import com.example.model.EventRequest
import com.example.repository.EventRepository

class EventService(private val repository: EventRepository) {
    fun listEvents(): List<Event> = repository.findAll()

    fun getEvent(id: Long): Event? = repository.findById(id)

    fun createEvent(request: EventRequest): Event {
        validate(request)
        return repository.create(request.toEvent(id = 0L))
    }

    fun updateEvent(id: Long, request: EventRequest): Event? {
        validate(request)
        return repository.update(id, request.toEvent(id))
    }

    fun deleteEvent(id: Long): Boolean = repository.delete(id)

    private fun validate(request: EventRequest) {
        require(request.title.isNotBlank()) { "title must not be blank" }
        require(request.date.isNotBlank()) { "date must not be blank" }
        require(request.category.isNotBlank()) { "category must not be blank" }
        require(request.department.isNotBlank()) { "department must not be blank" }
    }

    private fun EventRequest.toEvent(id: Long): Event = Event(
        id = id,
        title = title.trim(),
        description = description.trim(),
        date = date.trim(),
        category = category.trim(),
        department = department.trim()
    )
}
