package com.example.service
import com.example.db.dao.CategoryDao
import com.example.dto.CategoryRequest
import com.example.dto.CategoryResponse
import com.example.model.Category
import org.slf4j.LoggerFactory
class CategoryService(private val categoryDao: CategoryDao) {
    private val logger = LoggerFactory.getLogger(CategoryService::class.java)
    fun findAll(): List<CategoryResponse> {
        logger.info("Listing all categories")
        return categoryDao.findAll().map { it.toResponse() }
    }
    fun findById(id: Long): CategoryResponse? {
        logger.info("Getting category id={}", id)
        return categoryDao.findById(id)?.toResponse()
    }
    fun create(request: CategoryRequest): CategoryResponse {
        logger.info("Creating category name={}", request.name)
        require(request.name.isNotBlank()) { "Category name cannot be empty" }
        require(request.name.length <= 255) { "Category name must not exceed 255 characters" }
        val existing = categoryDao.findByName(request.name)
        if (existing != null) {
            logger.warn("Duplicate category name={}", request.name)
            throw IllegalArgumentException("Category '${request.name}' already exists")
        }
        val created = categoryDao.create(Category(id = 0, name = request.name.trim())).toResponse()
        logger.info("Created category id={}", created.id)
        return created
    }
    fun update(id: Long, request: CategoryRequest): CategoryResponse? {
        logger.info("Updating category id={}", id)
        require(request.name.isNotBlank()) { "Category name cannot be empty" }
        return categoryDao.update(id, Category(id = id, name = request.name.trim()))?.toResponse()
    }
    fun delete(id: Long): Boolean {
        logger.info("Deleting category id={}", id)
        return categoryDao.delete(id)
    }
    private fun Category.toResponse() = CategoryResponse(id = id, name = name)
}
