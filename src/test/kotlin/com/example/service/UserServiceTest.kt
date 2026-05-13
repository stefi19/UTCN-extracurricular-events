package com.example.service
import com.example.dto.CreateOrganizerRequest
import com.example.fake.FakeUserDao
import com.example.model.UserRole
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
class UserServiceTest {
    private lateinit var service: UserService
    private lateinit var userDao: FakeUserDao
    private fun validOrganizerRequest(email: String = "organizer@example.com") = CreateOrganizerRequest(
        email = email, password = "Organizer1!", firstName = "Nora", lastName = "Smith"
    )
    @BeforeTest
    fun setUp() {
        userDao = FakeUserDao()
        service = UserService(userDao)
    }
    @Test
    fun findAllReturnsEmptyMapsInitially() {
        val result = service.findAll()
        assertTrue(result["students"]!!.isEmpty())
        assertTrue(result["organizers"]!!.isEmpty())
        assertTrue(result["admins"]!!.isEmpty())
    }
    @Test
    fun findAllGroupsUsersByRole() {
        service.createOrganizer(validOrganizerRequest("org@example.com"))
        val authService = AuthService(userDao, com.example.security.JwtManager("test-secret-key-for-tests"))
        authService.register(
            com.example.dto.RegisterRequest(email = "s@example.com", password = "Password1!", firstName = "A", lastName = "B")
        )
        val result = service.findAll()
        assertEquals(1, result["students"]!!.size)
        assertEquals(1, result["organizers"]!!.size)
    }
    @Test
    fun findByRoleReturnsOnlyMatchingRole() {
        service.createOrganizer(validOrganizerRequest("org@example.com"))
        val organizers = service.findByRole(UserRole.ORGANIZER)
        assertEquals(1, organizers.size)
        assertEquals("ORGANIZER", organizers[0].role)
        val students = service.findByRole(UserRole.STUDENT)
        assertTrue(students.isEmpty())
    }
    @Test
    fun findByIdReturnsCreatedOrganizer() {
        val created = service.createOrganizer(validOrganizerRequest())
        val found = service.findById(created.id)
        assertNotNull(found)
        assertEquals(created.email, found.email)
    }
    @Test
    fun findByIdReturnsNullForUnknownId() {
        assertNull(service.findById(999L))
    }
    @Test
    fun createOrganizerReturnsOrganizerRole() {
        val response = service.createOrganizer(validOrganizerRequest())
        assertEquals("ORGANIZER", response.role)
        assertEquals("organizer@example.com", response.email)
        assertEquals("Nora", response.firstName)
        assertEquals("Smith", response.lastName)
    }
    @Test
    fun createOrganizerTrimsWhitespace() {
        val response = service.createOrganizer(
            validOrganizerRequest().copy(firstName = "  Ana  ", lastName = "  Pop  ")
        )
        assertEquals("Ana", response.firstName)
        assertEquals("Pop", response.lastName)
    }
    @Test
    fun createOrganizerFailsOnBlankFirstName() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest().copy(firstName = "  "))
        }
    }
    @Test
    fun createOrganizerFailsOnBlankLastName() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest().copy(lastName = ""))
        }
    }
    @Test
    fun createOrganizerFailsOnInvalidEmail() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest(email = "not-an-email"))
        }
    }
    @Test
    fun createOrganizerFailsOnWeakPassword() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest().copy(password = "short"))
        }
    }
    @Test
    fun createOrganizerFailsOnPasswordWithoutUppercase() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest().copy(password = "organizer1!"))
        }
    }
    @Test
    fun createOrganizerFailsOnPasswordWithoutSpecialChar() {
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest().copy(password = "Organizer1"))
        }
    }
    @Test
    fun createOrganizerFailsOnDuplicateEmail() {
        service.createOrganizer(validOrganizerRequest())
        assertFailsWith<IllegalArgumentException> {
            service.createOrganizer(validOrganizerRequest())
        }
    }
}
