package com.example.fake
import com.example.db.dao.CategoryDao
import com.example.model.Category
class FakeCategoryDao : CategoryDao {
    private val categories = mutableMapOf<Long, Category>()
    private var nextId = 1L
    override fun findAll(): List<Category> = categories.values.toList()
    override fun findById(id: Long): Category? = categories[id]
    override fun findByName(name: String): Category? = categories.values.find { it.name == name }
    override fun create(category: Category): Category {
        val created = category.copy(id = nextId++)
        categories[created.id] = created
        return created
    }
    override fun update(id: Long, category: Category): Category? {
        if (!categories.containsKey(id)) return null
        val updated = category.copy(id = id)
        categories[id] = updated
        return updated
    }
    override fun delete(id: Long): Boolean = categories.remove(id) != null
}
