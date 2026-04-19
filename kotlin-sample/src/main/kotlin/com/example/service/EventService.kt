package com.example.service

import com.example.db.dao.EventDao
import com.example.dto.EventRequest
import com.example.dto.EventResponse
import com.example.model.Event

class EventService(private val eventDao: EventDao) {

    fun listEvents(): List<EventResponse> =
        eventDao.findAll().map { it.toResponse() }

    fun getEvent(id: Long): EventResponse? =
        eventDao.findById(id)?.toResponse()

    fun createEvent(request: EventRequest): EventResponse {
        validate(request)
        val event = Event(
            id = 0,
            title = request.title.trim(),
            description = request.description.trim(),
            date = request.date.trim(),
            category = request.category.trim(),
            department = request.department.trim()
        )
        return eventDao.create(event).toResponse()
    }

    fun updateEvent(id: Long, request: EventRequest): EventResponse? {
        validate(request)
        val event = Event(
            id = id,
            title = request.title.trim(),
            description = request.description.trim(),
            date = request.date.trim(),
            category = request.category.trim(),
            department = request.department.trim()
        )
        return eventDao.update(id, event)?.toResponse()
    }

    fun deleteEvent(id: Long): Boolean = eventDao.delete(id)

    private fun validate(request: EventRequest) {
        require(request.title.isNotBlank()) { "title must not be blank" }
        require(request.date.isNotBlank()) { "date must not be blank" }
        require(request.category.isNotBlank()) { "category must not be blank" }
        require(request.department.isNotBlank()) { "department must not be blank" }
    }

    private fun Event.toResponse() = EventResponse(
        id = id,
        title = title,
        description = description,
        date = date,
        category = category,
        department = department
    )
}
