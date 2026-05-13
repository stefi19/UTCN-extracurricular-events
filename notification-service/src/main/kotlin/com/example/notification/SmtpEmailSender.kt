package com.example.notification

import jakarta.mail.Authenticator
import jakarta.mail.Message
import jakarta.mail.PasswordAuthentication
import jakarta.mail.Session
import jakarta.mail.Transport
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import java.util.Properties

class SmtpEmailSender : EmailSender {
    private val logger = LoggerFactory.getLogger(SmtpEmailSender::class.java)

    private val host = System.getenv("SMTP_HOST") ?: "localhost"
    private val port = System.getenv("SMTP_PORT") ?: "1025"
    private val username = System.getenv("SMTP_USER")
    private val password = System.getenv("SMTP_PASS")
    private val fromAddress = System.getenv("SMTP_FROM") ?: "noreply@utcn-events.local"
    private val authEnabled = (System.getenv("SMTP_AUTH") ?: "false").toBooleanStrictOrNull() ?: false
    private val startTlsEnabled = (System.getenv("SMTP_STARTTLS") ?: "false").toBooleanStrictOrNull() ?: false

    private val session: Session by lazy {
        val props = Properties().apply {
            put("mail.smtp.host", host)
            put("mail.smtp.port", port)
            put("mail.smtp.auth", authEnabled.toString())
            put("mail.smtp.starttls.enable", startTlsEnabled.toString())
        }

        if (authEnabled && !username.isNullOrBlank() && !password.isNullOrBlank()) {
            Session.getInstance(props, object : Authenticator() {
                override fun getPasswordAuthentication(): PasswordAuthentication {
                    return PasswordAuthentication(username, password)
                }
            })
        } else {
            Session.getInstance(props)
        }
    }

    override fun send(to: String, subject: String, body: String) {
        if (to.isBlank()) {
            logger.warn("Skipping email with blank recipient. subject={}", subject)
            return
        }

        val message = MimeMessage(session).apply {
            setFrom(InternetAddress(fromAddress))
            setRecipients(Message.RecipientType.TO, InternetAddress.parse(to))
            setSubject(subject)
            setText(body)
        }

        Transport.send(message)
        logger.info("Email sent to={} subject={}", to, subject)
    }
}
