package com.example.notification

interface EmailSender {
    fun send(to: String, subject: String, body: String)
}
