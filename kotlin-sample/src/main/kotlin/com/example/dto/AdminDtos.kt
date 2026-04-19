package com.example.dto

import kotlinx.serialization.Serializable

@Serializable
data class CategoryRequest(
    val name: String
)

@Serializable
data class CategoryResponse(
    val id: Long,
    val name: String
)

@Serializable
data class DepartmentRequest(
    val name: String
)

@Serializable
data class DepartmentResponse(
    val id: Long,
    val name: String
)
