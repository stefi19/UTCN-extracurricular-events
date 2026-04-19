package com.example.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import com.example.model.JwtClaims
import com.example.model.UserRole
import java.util.*

class JwtManager(private val secret: String = System.getenv("JWT_SECRET") ?: "your-secret-key-change-this-in-production") {
    private val algorithm = Algorithm.HMAC256(secret)
    private val issuer = "utcn-events-api"
    private val expirationTimeMs = 24 * 60 * 60 * 1000L // 24 hours

    fun generateToken(userId: Long, email: String, role: UserRole): String {
        return JWT.create()
            .withIssuer(issuer)
            .withSubject(userId.toString())
            .withClaim("email", email)
            .withClaim("role", role.name)
            .withExpiresAt(Date(System.currentTimeMillis() + expirationTimeMs))
            .sign(algorithm)
    }

    fun verifyToken(token: String): JwtClaims? {
        return try {
            val decodedJWT = JWT.require(algorithm)
                .withIssuer(issuer)
                .build()
                .verify(token)

            val userId = decodedJWT.subject.toLong()
            val email = decodedJWT.getClaim("email").asString()
            val role = UserRole.valueOf(decodedJWT.getClaim("role").asString())

            JwtClaims(userId, email, role)
        } catch (e: JWTVerificationException) {
            null
        }
    }
}

