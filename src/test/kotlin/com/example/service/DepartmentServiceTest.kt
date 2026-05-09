package com.example.service

import com.example.dto.DepartmentRequest
import com.example.fake.FakeDepartmentDao
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class DepartmentServiceTest {
    private lateinit var service: DepartmentService

    @BeforeTest
    fun setUp() {
        service = DepartmentService(FakeDepartmentDao())
    }

    @Test
    fun createDepartmentSucceeds() {
        val response = service.create(DepartmentRequest("Computer Science"))
        assertEquals(1L, response.id)
        assertEquals("Computer Science", response.name)
    }

    @Test
    fun createDepartmentFailsOnBlankName() {
        assertFailsWith<IllegalArgumentException> {
            service.create(DepartmentRequest("  "))
        }
    }

    @Test
    fun createDepartmentFailsOnDuplicate() {
        service.create(DepartmentRequest("CS"))
        assertFailsWith<IllegalArgumentException> {
            service.create(DepartmentRequest("CS"))
        }
    }

    @Test
    fun createDepartmentFailsOnNameTooLong() {
        assertFailsWith<IllegalArgumentException> {
            service.create(DepartmentRequest("A".repeat(256)))
        }
    }

    @Test
    fun findAllReturnsList() {
        service.create(DepartmentRequest("CS"))
        service.create(DepartmentRequest("EE"))
        assertEquals(2, service.findAll().size)
    }

    @Test
    fun findByIdReturnsExisting() {
        service.create(DepartmentRequest("CS"))
        assertNotNull(service.findById(1L))
    }

    @Test
    fun findByIdReturnsNullForMissing() {
        assertNull(service.findById(999L))
    }

    @Test
    fun updateDepartmentSucceeds() {
        service.create(DepartmentRequest("Old"))
        val updated = service.update(1L, DepartmentRequest("New"))
        assertNotNull(updated)
        assertEquals("New", updated.name)
    }

    @Test
    fun deleteDepartmentSucceeds() {
        service.create(DepartmentRequest("CS"))
        assertTrue(service.delete(1L))
    }
}
