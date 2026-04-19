package com.example.service

import com.example.dto.CategoryRequest
import com.example.fake.FakeCategoryDao
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CategoryServiceTest {
    private lateinit var service: CategoryService

    @BeforeTest
    fun setUp() {
        service = CategoryService(FakeCategoryDao())
    }

    @Test
    fun createCategorySucceeds() {
        val response = service.create(CategoryRequest("Workshop"))
        assertEquals(1L, response.id)
        assertEquals("Workshop", response.name)
    }

    @Test
    fun createCategoryTrimsName() {
        val response = service.create(CategoryRequest("  Workshop  "))
        assertEquals("Workshop", response.name)
    }

    @Test
    fun createCategoryFailsOnBlankName() {
        assertFailsWith<IllegalArgumentException> {
            service.create(CategoryRequest("   "))
        }
    }

    @Test
    fun createCategoryFailsOnDuplicate() {
        service.create(CategoryRequest("Workshop"))
        assertFailsWith<IllegalArgumentException> {
            service.create(CategoryRequest("Workshop"))
        }
    }

    @Test
    fun createCategoryFailsOnNameTooLong() {
        assertFailsWith<IllegalArgumentException> {
            service.create(CategoryRequest("A".repeat(256)))
        }
    }

    @Test
    fun findAllReturnsAllCategories() {
        service.create(CategoryRequest("A"))
        service.create(CategoryRequest("B"))
        assertEquals(2, service.findAll().size)
    }

    @Test
    fun findByIdReturnsExisting() {
        service.create(CategoryRequest("Workshop"))
        assertNotNull(service.findById(1L))
    }

    @Test
    fun findByIdReturnsNullForMissing() {
        assertNull(service.findById(999L))
    }

    @Test
    fun updateCategorySucceeds() {
        service.create(CategoryRequest("Old"))
        val updated = service.update(1L, CategoryRequest("New"))
        assertNotNull(updated)
        assertEquals("New", updated.name)
    }

    @Test
    fun updateCategoryReturnsNullForMissing() {
        assertNull(service.update(999L, CategoryRequest("Name")))
    }

    @Test
    fun deleteCategorySucceeds() {
        service.create(CategoryRequest("Workshop"))
        assertTrue(service.delete(1L))
    }

    @Test
    fun deleteCategoryReturnsFalseForMissing() {
        assertTrue(!service.delete(999L))
    }
}
