package com.example.service

import com.example.db.dao.CategoryDao
import com.example.dto.CategoryRequest
import com.example.dto.CategoryResponse
import com.example.model.Category

class CategoryService(private val categoryDao: CategoryDao) {

    fun findAll(): List<CategoryResponse> =
        categoryDao.findAll().map { it.toResponse() }

    fun findById(id: Long): CategoryResponse? =
        categoryDao.findById(id)?.toResponse()

    fun create(request: CategoryRequest): CategoryResponse {
        require(request.name.isNotBlank()) { "Category name cannot be empty" }

        val existing = categoryDao.findByName(request.name)
        if (existing != null) {
            throw IllegalArgumentException("Category '${request.name}' already exists")
        }

        val category = Category(id = 0, name = request.name.trim())
        return categoryDao.create(category).toResponse()
    }

    fun update(id: Long, request: CategoryRequest): CategoryResponse? {
        require(request.name.isNotBlank()) { "Category name cannot be empty" }

        val category = Category(id = id, name = request.name.trim())
        return categoryDao.update(id, category)?.toResponse()
    }

    fun delete(id: Long): Boolean = categoryDao.delete(id)

    private fun Category.toResponse() = CategoryResponse(id = id, name = name)
}
