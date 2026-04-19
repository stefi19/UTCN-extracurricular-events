package com.example.service

import com.example.db.dao.DepartmentDao
import com.example.dto.DepartmentRequest
import com.example.dto.DepartmentResponse
import com.example.model.Department
import org.slf4j.LoggerFactory

class DepartmentService(private val departmentDao: DepartmentDao) {
    private val logger = LoggerFactory.getLogger(DepartmentService::class.java)

    fun findAll(): List<DepartmentResponse> {
        logger.info("Listing all departments")
        return departmentDao.findAll().map { it.toResponse() }
    }

    fun findById(id: Long): DepartmentResponse? {
        logger.info("Getting department id={}", id)
        return departmentDao.findById(id)?.toResponse()
    }

    fun create(request: DepartmentRequest): DepartmentResponse {
        logger.info("Creating department name={}", request.name)
        require(request.name.isNotBlank()) { "Department name cannot be empty" }
        require(request.name.length <= 255) { "Department name must not exceed 255 characters" }

        val existing = departmentDao.findByName(request.name)
        if (existing != null) {
            logger.warn("Duplicate department name={}", request.name)
            throw IllegalArgumentException("Department '${request.name}' already exists")
        }

        val created = departmentDao.create(Department(id = 0, name = request.name.trim())).toResponse()
        logger.info("Created department id={}", created.id)
        return created
    }

    fun update(id: Long, request: DepartmentRequest): DepartmentResponse? {
        logger.info("Updating department id={}", id)
        require(request.name.isNotBlank()) { "Department name cannot be empty" }
        return departmentDao.update(id, Department(id = id, name = request.name.trim()))?.toResponse()
    }

    fun delete(id: Long): Boolean {
        logger.info("Deleting department id={}", id)
        return departmentDao.delete(id)
    }

    private fun Department.toResponse() = DepartmentResponse(id = id, name = name)
}
