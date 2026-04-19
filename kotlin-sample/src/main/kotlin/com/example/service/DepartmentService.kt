package com.example.service

import com.example.db.dao.DepartmentDao
import com.example.dto.DepartmentRequest
import com.example.dto.DepartmentResponse
import com.example.model.Department

class DepartmentService(private val departmentDao: DepartmentDao) {

    fun findAll(): List<DepartmentResponse> =
        departmentDao.findAll().map { it.toResponse() }

    fun findById(id: Long): DepartmentResponse? =
        departmentDao.findById(id)?.toResponse()

    fun create(request: DepartmentRequest): DepartmentResponse {
        require(request.name.isNotBlank()) { "Department name cannot be empty" }

        val existing = departmentDao.findByName(request.name)
        if (existing != null) {
            throw IllegalArgumentException("Department '${request.name}' already exists")
        }

        val department = Department(id = 0, name = request.name.trim())
        return departmentDao.create(department).toResponse()
    }

    fun update(id: Long, request: DepartmentRequest): DepartmentResponse? {
        require(request.name.isNotBlank()) { "Department name cannot be empty" }

        val department = Department(id = id, name = request.name.trim())
        return departmentDao.update(id, department)?.toResponse()
    }

    fun delete(id: Long): Boolean = departmentDao.delete(id)

    private fun Department.toResponse() = DepartmentResponse(id = id, name = name)
}
