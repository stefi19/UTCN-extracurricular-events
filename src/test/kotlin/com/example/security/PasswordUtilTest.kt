package com.example.security
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
class PasswordUtilTest {
    @Test
    fun hashAndVerifySucceeds() {
        val hash = PasswordUtil.hashPassword("MyPassword123!")
        assertTrue(PasswordUtil.verifyPassword("MyPassword123!", hash))
    }
    @Test
    fun verifyFailsOnWrongPassword() {
        val hash = PasswordUtil.hashPassword("CorrectPassword1!")
        assertFalse(PasswordUtil.verifyPassword("WrongPassword1!", hash))
    }
    @Test
    fun hashesAreDifferentForSamePassword() {
        val hash1 = PasswordUtil.hashPassword("Password1!")
        val hash2 = PasswordUtil.hashPassword("Password1!")
        assertTrue(hash1 != hash2) 
    }
    @Test
    fun verifyReturnsFalseForGarbage() {
        assertFalse(PasswordUtil.verifyPassword("test", "not-a-bcrypt-hash"))
    }
}
