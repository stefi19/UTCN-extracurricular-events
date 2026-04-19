package com.example.model

data class Category(
    val id: Long,
    val name: String
)

data class CategoryRequest(
    val name: String
)

data class Department(
    val id: Long,
    val name: String
)

data class DepartmentRequest(
    val name: String
)

