package com.example.db.dao

import com.example.model.Department

interface DepartmentDao {
    fun findAll(): List<Department>
    fun findById(id: Long): Department?
    fun create(department: Department): Department
    fun update(id: Long, department: Department): Department?
    fun delete(id: Long): Boolean
    fun findByName(name: String): Department?
}

