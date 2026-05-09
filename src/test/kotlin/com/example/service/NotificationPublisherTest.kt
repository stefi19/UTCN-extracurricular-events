package com.example.service

import com.example.dto.RegisterRequest
import com.example.fake.FakeEventDao
import com.example.fake.FakeNotificationPublisher
import com.example.fake.FakeRegistrationDao
import com.example.fake.FakeUserDao
import com.example.model.Event
import com.example.security.JwtManager
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NotificationPublisherTest {

    private lateinit var publisher: FakeNotificationPublisher

    @BeforeTest
    fun setUp() {
        publisher = FakeNotificationPublisher()
    }

    @Test
    fun authServicePublishesUserRegisteredOnRegister() {
        val service = AuthService(FakeUserDao(), JwtManager("test-secret-key-for-tests"), publisher)
        service.register(RegisterRequest(email = "a@b.com", password = "Password1!", firstName = "Ana", lastName = "Pop"))
        assertEquals(1, publisher.countByType("USER_REGISTERED"))
        assertEquals("a@b.com", publisher.published[0].userEmail)
    }

    @Test
    fun authServiceDoesNotPublishOnLogin() {
        val service = AuthService(FakeUserDao(), JwtManager("test-secret-key-for-tests"), publisher)
        service.register(RegisterRequest(email = "a@b.com", password = "Password1!", firstName = "Ana", lastName = "Pop"))
        publisher.published.clear()
        service.login(com.example.dto.LoginRequest(email = "a@b.com", password = "Password1!"))
        assertTrue(publisher.published.isEmpty())
    }

    @Test
    fun registrationServicePublishesEventRegistrationOnRegister() {
        val eventDao = FakeEventDao()
        eventDao.create(Event(id = 0, title = "E", description = "D", date = "2026-06-01", category = "C", department = "D"))
        val service = RegistrationService(FakeRegistrationDao(), eventDao, publisher)
        service.registerStudent(studentId = 5L, eventId = 1L)
        assertEquals(1, publisher.countByType("EVENT_REGISTRATION"))
        assertEquals(5L, publisher.published[0].userId)
    }

    @Test
    fun registrationServicePublishesRegistrationCancelledOnCancel() {
        val eventDao = FakeEventDao()
        eventDao.create(Event(id = 0, title = "E", description = "D", date = "2026-06-01", category = "C", department = "D"))
        val service = RegistrationService(FakeRegistrationDao(), eventDao, publisher)
        val reg = service.registerStudent(studentId = 5L, eventId = 1L)
        publisher.published.clear()
        service.cancelRegistration(studentId = 5L, registrationId = reg.id)
        assertEquals(1, publisher.countByType("REGISTRATION_CANCELLED"))
    }

    @Test
    fun noPublisherDoesNotCrash() {
        val service = AuthService(FakeUserDao(), JwtManager("test-secret-key-for-tests"), notificationPublisher = null)
        val response = service.register(RegisterRequest(email = "a@b.com", password = "Password1!", firstName = "Ana", lastName = "Pop"))
        assertTrue(response.token.isNotBlank())
    }
}
