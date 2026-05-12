package com.example.service

import com.example.dto.LoginRequest
import com.example.dto.RegisterRequest
import com.example.fake.FakeUserDao
import com.example.messaging.NotificationMessage
import com.example.messaging.NotificationPublisher
import com.example.security.JwtManager
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class AuthServiceTest {
    private lateinit var service: AuthService

    private fun validRegister(email: String = "test@example.com") = RegisterRequest(
        email = email, password = "Password1!", firstName = "John", lastName = "Doe"
    )

    @BeforeTest
    fun setUp() {
        service = AuthService(FakeUserDao(), JwtManager("test-secret-key-for-tests"))
    }

    @Test
    fun registerReturnsTokenAndUser() {
        val response = service.register(validRegister())
        assertTrue(response.token.isNotBlank())
        assertEquals("test@example.com", response.user.email)
        assertEquals("STUDENT", response.user.role)
    }

    @Test
    fun registerPublishesWelcomeNotification() {
        val publisher = CapturingNotificationPublisher()
        service = AuthService(FakeUserDao(), JwtManager("test-secret-key-for-tests"), publisher)

        service.register(validRegister())

        assertEquals(1, publisher.messages.size)
        val message = publisher.messages.first()
        assertEquals("USER_REGISTERED", message.eventType)
        assertEquals("test@example.com", message.userEmail)
        assertEquals("John", message.payload["firstName"])
        assertEquals("Doe", message.payload["lastName"])
    }

    @Test
    fun registerAssignsRole() {
        val response = service.register(validRegister().copy(role = "ORGANIZER"))
        assertEquals("ORGANIZER", response.user.role)
    }

    @Test
    fun registerFailsOnDuplicateEmail() {
        service.register(validRegister())
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister())
        }
    }

    @Test
    fun registerFailsOnInvalidEmail() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister(email = "not-an-email"))
        }
    }

    @Test
    fun registerFailsOnWeakPassword() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(password = "short"))
        }
    }

    @Test
    fun registerFailsOnPasswordWithoutUppercase() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(password = "password1!"))
        }
    }

    @Test
    fun registerFailsOnPasswordWithoutSpecialChar() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(password = "Password1"))
        }
    }

    @Test
    fun registerFailsOnBlankFirstName() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(firstName = "  "))
        }
    }

    @Test
    fun registerFailsOnBlankLastName() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(lastName = ""))
        }
    }

    @Test
    fun registerFailsOnInvalidRole() {
        assertFailsWith<IllegalArgumentException> {
            service.register(validRegister().copy(role = "SUPERUSER"))
        }
    }

    @Test
    fun loginReturnsTokenAndUser() {
        service.register(validRegister())
        val response = service.login(LoginRequest("test@example.com", "Password1!"))
        assertTrue(response.token.isNotBlank())
        assertEquals("test@example.com", response.user.email)
    }

    @Test
    fun loginFailsOnWrongEmail() {
        service.register(validRegister())
        assertFailsWith<IllegalArgumentException> {
            service.login(LoginRequest("wrong@example.com", "Password1!"))
        }
    }

    @Test
    fun loginFailsOnWrongPassword() {
        service.register(validRegister())
        assertFailsWith<IllegalArgumentException> {
            service.login(LoginRequest("test@example.com", "WrongPass1!"))
        }
    }

    @Test
    fun loginFailsOnBlankEmail() {
        assertFailsWith<IllegalArgumentException> {
            service.login(LoginRequest("", "Password1!"))
        }
    }

    @Test
    fun loginFailsOnBlankPassword() {
        assertFailsWith<IllegalArgumentException> {
            service.login(LoginRequest("test@example.com", ""))
        }
    }

    @Test
    fun getUserByIdReturnsUser() {
        service.register(validRegister())
        val user = service.getUserById(1L)
        assertNotNull(user)
        assertEquals("test@example.com", user.email)
    }

    @Test
    fun getUserByIdReturnsNullForMissing() {
        assertEquals(null, service.getUserById(999L))
    }

    private class CapturingNotificationPublisher : NotificationPublisher {
        val messages = mutableListOf<NotificationMessage>()

        override suspend fun publish(message: NotificationMessage) {
            messages += message
        }
    }
}
