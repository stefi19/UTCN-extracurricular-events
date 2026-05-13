package com.example.security
import org.mindrot.jbcrypt.BCrypt
object PasswordUtil {
    fun hashPassword(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt(12))
    }
    fun verifyPassword(password: String, hash: String): Boolean {
        return try {
            BCrypt.checkpw(password, hash)
        } catch (e: Exception) {
            false
        }
    }
}
