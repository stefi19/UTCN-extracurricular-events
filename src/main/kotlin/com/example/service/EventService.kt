package com.example.service
import com.example.db.dao.EventDao
import com.example.db.dao.RegistrationDao
import com.example.db.dao.UserDao
import com.example.dto.EventRequest
import com.example.dto.EventResponse
import com.example.model.Event
import org.slf4j.LoggerFactory
class EventService(
    private val eventDao: EventDao,
    private val userDao: UserDao? = null,
    private val registrationDao: RegistrationDao? = null
) {
    private val logger = LoggerFactory.getLogger(EventService::class.java)
    fun listEvents(): List<EventResponse> {
        logger.info("Listing all events")
        val organizerCache = mutableMapOf<Long, String?>()
        return eventDao.findAll().map { it.toResponse(organizerCache) }
    }
    fun getEvent(id: Long): EventResponse? {
        logger.info("Getting event id={}", id)
        val organizerCache = mutableMapOf<Long, String?>()
        return eventDao.findById(id)?.toResponse(organizerCache)
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
        val organizerCache = mutableMapOf<Long, String?>()
        val created = eventDao.create(event).toResponse(organizerCache)
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
        val organizerCache = mutableMapOf<Long, String?>()
        val updated = eventDao.update(id, event)?.toResponse(organizerCache)
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
    private fun Event.toResponse(organizerCache: MutableMap<Long, String?>): EventResponse {
        val registeredCount = registrationDao?.countByEventIdAndStatus(id, "REGISTERED") ?: 0
        val waitlistedCount = registrationDao?.countByEventIdAndStatus(id, "WAITLISTED") ?: 0
        val availableSeats = maxParticipants?.let { (it - registeredCount).coerceAtLeast(0) }
        return EventResponse(
            id = id, title = title, description = description, date = date,
            category = category, department = department, organizerId = organizerId,
            organizerName = resolveOrganizerName(organizerId, organizerCache),
            categoryId = categoryId, location = location, startTime = startTime,
            endTime = endTime, maxParticipants = maxParticipants,
            registeredCount = registeredCount, waitlistedCount = waitlistedCount,
            availableSeats = availableSeats
        )
    }
    private fun resolveOrganizerName(
        organizerId: Long?,
        organizerCache: MutableMap<Long, String?>
    ): String? {
        val id = organizerId ?: return null
        return organizerCache.getOrPut(id) {
            val user = userDao?.findById(id) ?: return@getOrPut null
            "${user.firstName} ${user.lastName}".trim().ifBlank { user.email }
        }
    }
}
