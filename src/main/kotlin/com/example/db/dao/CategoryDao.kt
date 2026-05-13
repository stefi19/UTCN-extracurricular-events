package com.example.db.dao
import com.example.model.Category
interface CategoryDao {
    fun findAll(): List<Category>
    fun findById(id: Long): Category?
    fun create(category: Category): Category
    fun update(id: Long, category: Category): Category?
    fun delete(id: Long): Boolean
    fun findByName(name: String): Category?
}
