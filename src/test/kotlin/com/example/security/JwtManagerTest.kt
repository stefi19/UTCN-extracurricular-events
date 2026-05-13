package com.example.security
import com.example.model.UserRole
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
class JwtManagerTest {
    private val jwtManager = JwtManager("test-secret-key-for-jwt-testing")
    @Test
    fun generateTokenReturnsNonEmptyString() {
        val token = jwtManager.generateToken(1L, "test@example.com", UserRole.STUDENT)
        assertTrue(token.isNotBlank())
    }
    @Test
    fun verifyTokenReturnsCorrectClaims() {
        val token = jwtManager.generateToken(42L, "user@test.com", UserRole.ADMIN)
        val claims = jwtManager.verifyToken(token)
        assertNotNull(claims)
        assertEquals(42L, claims.userId)
        assertEquals("user@test.com", claims.email)
        assertEquals(UserRole.ADMIN, claims.role)
    }
    @Test
    fun verifyTokenReturnsNullForInvalidToken() {
        assertNull(jwtManager.verifyToken("invalid.jwt.token"))
    }
    @Test
    fun verifyTokenReturnsNullForTokenFromDifferentSecret() {
        val otherManager = JwtManager("different-secret")
        val token = otherManager.generateToken(1L, "test@test.com", UserRole.STUDENT)
        assertNull(jwtManager.verifyToken(token))
    }
    @Test
    fun verifierIsNotNull() {
        assertNotNull(jwtManager.verifier)
    }
    @Test
    fun tokensForDifferentUsersAreDifferent() {
        val token1 = jwtManager.generateToken(1L, "a@a.com", UserRole.STUDENT)
        val token2 = jwtManager.generateToken(2L, "b@b.com", UserRole.ADMIN)
        assertTrue(token1 != token2)
    }
}
