package com.example.service

import com.example.db.dao.EventDao
import com.example.dto.EventRequest
import com.example.dto.EventResponse
import com.example.model.Event
import org.slf4j.LoggerFactory

class EventService(private val eventDao: EventDao) {
    private val logger = LoggerFactory.getLogger(EventService::class.java)

    fun listEvents(): List<EventResponse> {
        logger.info("Listing all events")
        return eventDao.findAll().map { it.toResponse() }
    }

    fun getEvent(id: Long): EventResponse? {
        logger.info("Getting event id={}", id)
        return eventDao.findById(id)?.toResponse()
    }

    fun createEvent(request: EventRequest): EventResponse {
        logger.info("Creating event title={}", request.title)
        validate(request)
        val event = Event(
            id = 0,
            title = request.title.trim(),
            description = request.description.trim(),
            date = request.date.trim(),
            category = request.category.trim(),
            department = request.department.trim(),
            organizerId = request.organizerId,
            categoryId = request.categoryId,
            location = request.location?.trim(),
            startTime = request.startTime?.trim(),
            endTime = request.endTime?.trim(),
            maxParticipants = request.maxParticipants
        )
        val created = eventDao.create(event).toResponse()
        logger.info("Created event id={}", created.id)
        return created
    }

    fun updateEvent(id: Long, request: EventRequest): EventResponse? {
        logger.info("Updating event id={}", id)
        validate(request)
        val event = Event(
            id = id,
            title = request.title.trim(),
            description = request.description.trim(),
            date = request.date.trim(),
            category = request.category.trim(),
            department = request.department.trim(),
            organizerId = request.organizerId,
            categoryId = request.categoryId,
            location = request.location?.trim(),
            startTime = request.startTime?.trim(),
            endTime = request.endTime?.trim(),
            maxParticipants = request.maxParticipants
        )
        val updated = eventDao.update(id, event)?.toResponse()
        if (updated != null) logger.info("Updated event id={}", id)
        else logger.warn("Event id={} not found for update", id)
        return updated
    }

    fun deleteEvent(id: Long): Boolean {
        logger.info("Deleting event id={}", id)
        val deleted = eventDao.delete(id)
        if (deleted) logger.info("Deleted event id={}", id)
        else logger.warn("Event id={} not found for delete", id)
        return deleted
    }

    private fun validate(request: EventRequest) {
        require(request.title.isNotBlank()) { "title must not be blank" }
        require(request.title.length <= 255) { "title must not exceed 255 characters" }
        require(request.description.isNotBlank()) { "description must not be blank" }
        require(request.date.isNotBlank()) { "date must not be blank" }
        require(request.category.isNotBlank()) { "category must not be blank" }
        require(request.department.isNotBlank()) { "department must not be blank" }
        request.maxParticipants?.let {
            require(it > 0) { "maxParticipants must be positive" }
        }
        request.location?.let {
            require(it.length <= 255) { "location must not exceed 255 characters" }
        }
    }

    private fun Event.toResponse() = EventResponse(
        id = id, title = title, description = description, date = date,
        category = category, department = department, organizerId = organizerId,
        categoryId = categoryId, location = location, startTime = startTime,
        endTime = endTime, maxParticipants = maxParticipants
    )
}
