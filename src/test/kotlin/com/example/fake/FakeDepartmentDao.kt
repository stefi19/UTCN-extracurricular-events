package com.example.fake
import com.example.db.dao.DepartmentDao
import com.example.model.Department
class FakeDepartmentDao : DepartmentDao {
    private val departments = mutableMapOf<Long, Department>()
    private var nextId = 1L
    override fun findAll(): List<Department> = departments.values.toList()
    override fun findById(id: Long): Department? = departments[id]
    override fun findByName(name: String): Department? = departments.values.find { it.name == name }
    override fun create(department: Department): Department {
        val created = department.copy(id = nextId++)
        departments[created.id] = created
        return created
    }
    override fun update(id: Long, department: Department): Department? {
        if (!departments.containsKey(id)) return null
        val updated = department.copy(id = id)
        departments[id] = updated
        return updated
    }
    override fun delete(id: Long): Boolean = departments.remove(id) != null
}
