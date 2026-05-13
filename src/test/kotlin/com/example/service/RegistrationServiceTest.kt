package com.example.service
import com.example.fake.FakeEventDao
import com.example.fake.FakeRegistrationDao
import com.example.model.Event
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
class RegistrationServiceTest {
    private lateinit var service: RegistrationService
    private lateinit var eventDao: FakeEventDao
    @BeforeTest
    fun setUp() {
        eventDao = FakeEventDao()
        service = RegistrationService(FakeRegistrationDao(), eventDao)
        eventDao.create(Event(id = 0, title = "Event", description = "Desc", date = "2026-06-01", category = "C", department = "D"))
    }
    @Test
    fun registerStudentSucceeds() {
        val response = service.registerStudent(studentId = 10L, eventId = 1L)
        assertEquals("REGISTERED", response.status)
        assertEquals(10L, response.studentId)
        assertEquals(1L, response.eventId)
    }
    @Test
    fun registerStudentFailsOnDuplicate() {
        service.registerStudent(10L, 1L)
        assertFailsWith<IllegalArgumentException> {
            service.registerStudent(10L, 1L)
        }
    }
    @Test
    fun registerStudentFailsOnMissingEvent() {
        assertFailsWith<IllegalArgumentException> {
            service.registerStudent(10L, 999L)
        }
    }
    @Test
    fun getStudentRegistrationsReturnsCorrectList() {
        service.registerStudent(10L, 1L)
        val registrations = service.getStudentRegistrations(10L)
        assertEquals(1, registrations.size)
    }
    @Test
    fun getStudentRegistrationsReturnsEmptyForUnknown() {
        assertTrue(service.getStudentRegistrations(999L).isEmpty())
    }
    @Test
    fun getEventParticipantsReturnsList() {
        service.registerStudent(10L, 1L)
        service.registerStudent(20L, 1L)
        assertEquals(2, service.getEventParticipants(1L).size)
    }
    @Test
    fun cancelRegistrationSucceeds() {
        service.registerStudent(10L, 1L)
        assertTrue(service.cancelRegistration(10L, 1L))
    }
    @Test
    fun cancelRegistrationFailsForWrongStudent() {
        service.registerStudent(10L, 1L)
        assertFailsWith<IllegalArgumentException> {
            service.cancelRegistration(20L, 1L)
        }
    }
    @Test
    fun cancelRegistrationFailsForMissing() {
        assertFailsWith<IllegalArgumentException> {
            service.cancelRegistration(10L, 999L)
        }
    }
    @Test
    fun cancelRegistrationFailsIfAlreadyCancelled() {
        service.registerStudent(10L, 1L)
        service.cancelRegistration(10L, 1L)
        assertFailsWith<IllegalArgumentException> {
            service.cancelRegistration(10L, 1L)
        }
    }
    @Test
    fun updateRegistrationStatusSucceedsForAdmin() {
        service.registerStudent(10L, 1L)
        assertTrue(service.updateRegistrationStatus(1L, "ATTENDED", "ADMIN"))
    }
    @Test
    fun updateRegistrationStatusSucceedsForOrganizer() {
        service.registerStudent(10L, 1L)
        assertTrue(service.updateRegistrationStatus(1L, "NO_SHOW", "ORGANIZER"))
    }
    @Test
    fun updateRegistrationStatusFailsForStudent() {
        service.registerStudent(10L, 1L)
        assertFailsWith<IllegalArgumentException> {
            service.updateRegistrationStatus(1L, "ATTENDED", "STUDENT")
        }
    }
    @Test
    fun updateRegistrationStatusFailsForInvalidStatus() {
        service.registerStudent(10L, 1L)
        assertFailsWith<IllegalArgumentException> {
            service.updateRegistrationStatus(1L, "INVALID", "ADMIN")
        }
    }
    @Test
    fun getAllRegistrationsReturnsAllAcrossStudents() {
        eventDao.create(Event(id = 0, title = "Event 2", description = "Desc", date = "2026-07-01", category = "C", department = "D"))
        service.registerStudent(10L, 1L)
        service.registerStudent(20L, 2L)
        assertEquals(2, service.getAllRegistrations().size)
    }
    @Test
    fun getAllRegistrationsReturnsEmptyInitially() {
        assertTrue(service.getAllRegistrations().isEmpty())
    }
    @Test
    fun getEventParticipantsDetailedIncludesStudentFallback() {
        service.registerStudent(99L, 1L)
        val details = service.getEventParticipantsDetailed(1L)
        assertEquals(1, details.size)
        assertEquals(99L, details[0].studentId)
        assertTrue(details[0].studentFirstName.isNotBlank())
        assertTrue(details[0].studentLastName.isNotBlank())
    }
    @Test
    fun reactivatesCancelledRegistrationInsteadOfCreatingNew() {
        val first = service.registerStudent(10L, 1L)
        service.cancelRegistration(10L, first.id)
        val reactivated = service.registerStudent(10L, 1L)
        assertEquals("REGISTERED", reactivated.status)
        assertEquals(1, service.getStudentRegistrations(10L).count { it.status == "REGISTERED" })
    }
}
