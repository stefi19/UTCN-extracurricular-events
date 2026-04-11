package com.example.view

import com.example.model.Event
import kotlinx.serialization.Serializable

@Serializable
data class EventView(
    val id: Long,
    val title: String,
    val description: String,
    val date: String,
    val category: String,
    val department: String
)

fun Event.toView(): EventView = EventView(
    id = id,
    title = title,
    description = description,
    date = date,
    category = category,
    department = department
)

