package com.example.service
import com.example.dto.EventRequest
import com.example.fake.FakeEventDao
import com.example.fake.FakeUserDao
import com.example.model.User
import com.example.model.UserRole
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
class EventServiceTest {
    private lateinit var service: EventService
    private fun validRequest(title: String = "Test Event") = EventRequest(
        title = title, description = "A test event", date = "2026-06-01",
        category = "Workshop", department = "CS"
    )
    @BeforeTest
    fun setUp() {
        service = EventService(FakeEventDao())
    }
    @Test
    fun createEventReturnsResponse() {
        val response = service.createEvent(validRequest())
        assertEquals(1L, response.id)
        assertEquals("Test Event", response.title)
    }
    @Test
    fun listEventsReturnsAll() {
        service.createEvent(validRequest("A"))
        service.createEvent(validRequest("B"))
        assertEquals(2, service.listEvents().size)
    }
    @Test
    fun getEventReturnsExisting() {
        service.createEvent(validRequest())
        assertNotNull(service.getEvent(1L))
    }
    @Test
    fun getEventReturnsNullForMissing() {
        assertNull(service.getEvent(999L))
    }
    @Test
    fun updateEventReturnsUpdated() {
        service.createEvent(validRequest())
        val updated = service.updateEvent(1L, validRequest("Updated"))
        assertNotNull(updated)
        assertEquals("Updated", updated.title)
    }
    @Test
    fun updateEventReturnsNullForMissing() {
        assertNull(service.updateEvent(999L, validRequest()))
    }
    @Test
    fun deleteEventReturnsTrue() {
        service.createEvent(validRequest())
        assertTrue(service.deleteEvent(1L))
    }
    @Test
    fun deleteEventReturnsFalseForMissing() {
        assertTrue(!service.deleteEvent(999L))
    }
    @Test
    fun createEventTrimsWhitespace() {
        val response = service.createEvent(validRequest("  Spaced  "))
        assertEquals("Spaced", response.title)
    }
    @Test
    fun createEventFailsOnBlankTitle() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(validRequest(title = "   "))
        }
    }
    @Test
    fun createEventFailsOnBlankDate() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(EventRequest(title = "T", description = "D", date = "", category = "C", department = "D"))
        }
    }
    @Test
    fun createEventFailsOnBlankCategory() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(EventRequest(title = "T", description = "D", date = "2026-01-01", category = "  ", department = "D"))
        }
    }
    @Test
    fun createEventFailsOnBlankDepartment() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(EventRequest(title = "T", description = "D", date = "2026-01-01", category = "C", department = ""))
        }
    }
    @Test
    fun createEventFailsOnBlankDescription() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(EventRequest(title = "T", description = "  ", date = "2026-01-01", category = "C", department = "D"))
        }
    }
    @Test
    fun createEventFailsOnZeroMaxParticipants() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(validRequest().copy(maxParticipants = 0))
        }
    }
    @Test
    fun createEventFailsOnNegativeMaxParticipants() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(validRequest().copy(maxParticipants = -5))
        }
    }
    @Test
    fun createEventAcceptsOptionalFields() {
        val response = service.createEvent(validRequest().copy(
            location = "Room 101", maxParticipants = 50, organizerId = 1L, categoryId = 2L
        ))
        assertEquals("Room 101", response.location)
        assertEquals(50, response.maxParticipants)
        assertEquals(1L, response.organizerId)
        assertEquals(2L, response.categoryId)
    }
    @Test
    fun createEventTitleTooLong() {
        assertFailsWith<IllegalArgumentException> {
            service.createEvent(validRequest(title = "A".repeat(256)))
        }
    }
    @Test
    fun listEventsIncludesOrganizerNameWhenOrganizerExists() {
        val userDao = FakeUserDao()
        val createdUser = userDao.create(
            User(
                id = 0,
                email = "organizer@test.com",
                passwordHash = "hash",
                firstName = "Olivia",
                lastName = "Organizer",
                role = UserRole.ORGANIZER
            )
        )
        val serviceWithUsers = EventService(FakeEventDao(), userDao)
        serviceWithUsers.createEvent(validRequest().copy(organizerId = createdUser.id))
        val event = serviceWithUsers.listEvents().first()
        assertEquals("Olivia Organizer", event.organizerName)
    }
}
