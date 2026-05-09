package com.example.dto

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val error: String,
    val status: Int
)
