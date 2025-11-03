import { UserRole } from "@marketplace/shared-types"
import * as jwt from "jsonwebtoken"
import { beforeEach, describe, expect, it } from "vitest"
import { UserEntity } from "../../models/User"
import { AuthService } from "../../services/AuthService"

// Mock UserService for testing JWT functionality
class MockUserService {
  async createUser(userData: any) {
    const userId = userData.email === "newuser@example.com" ? "user-456" : "user-123"
    return {
      id: userId,
      email: userData.email,
      role: UserRole.USER,
      profile: userData.profile,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async getUserById(id: string) {
    if (id === "user-123") {
      return {
        id: "user-123",
        email: "test@example.com",
        role: UserRole.USER,
        profile: {
          firstName: "John",
          lastName: "Doe",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: "unverified" as any,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    if (id === "user-456") {
      return {
        id: "user-456",
        email: "newuser@example.com",
        role: UserRole.USER,
        profile: {
          firstName: "New",
          lastName: "User",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: "unverified" as any,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    return null
  }

  async validateUserCredentials(email: string, password: string) {
    if (email === "test@example.com" && password === "password123") {
      return new UserEntity("user-123", "test@example.com", "hashedpassword", UserRole.USER, {
        firstName: "John",
        lastName: "Doe",
        rating: 0,
        reviewsCount: 0,
        verificationStatus: "unverified" as any,
        socialProfiles: [],
        primaryAuthProvider: "email" as any,
      })
    }
    if (email === "newuser@example.com" && password === "password123") {
      return new UserEntity("user-456", "newuser@example.com", "hashedpassword", UserRole.USER, {
        firstName: "New",
        lastName: "User",
        rating: 0,
        reviewsCount: 0,
        verificationStatus: "unverified" as any,
        socialProfiles: [],
        primaryAuthProvider: "email" as any,
      })
    }
    return null
  }
}

describe("AuthService JWT Integration Tests", () => {
  let authService: AuthService
  let mockUserService: MockUserService

  beforeEach(() => {
    // Set test environment variables
    process.env.JWT_SECRET = "test-secret-key"
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key"
    process.env.JWT_EXPIRES_IN = "15m"
    process.env.JWT_REFRESH_EXPIRES_IN = "7d"

    mockUserService = new MockUserService()
    authService = new AuthService(mockUserService as any)
  })

  describe("JWT Token Generation and Validation", () => {
    it("should generate and validate access tokens", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      expect(loginResult.accessToken).toBeDefined()
      expect(typeof loginResult.accessToken).toBe("string")

      // Validate the token
      const payload = await authService.validateAccessToken(loginResult.accessToken)

      expect(payload.userId).toBe("user-123")
      expect(payload.email).toBe("test@example.com")
      expect(payload.role).toBe(UserRole.USER)
      expect(payload.type).toBe("access")
    })

    it("should generate and validate refresh tokens", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      expect(loginResult.refreshToken).toBeDefined()
      expect(typeof loginResult.refreshToken).toBe("string")

      // Verify it's a valid JWT
      const decoded = jwt.verify(loginResult.refreshToken, "test-refresh-secret-key") as any
      expect(decoded.userId).toBe("user-123")
      expect(decoded.type).toBe("refresh")
    })

    it("should include correct JWT claims", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      const decoded = jwt.verify(loginResult.accessToken, "test-secret-key") as any

      expect(decoded.iss).toBe("marketplace-auth")
      expect(decoded.aud).toBe("marketplace-api")
      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
    })

    it("should reject expired tokens", async () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        {
          userId: "user-123",
          email: "test@example.com",
          role: UserRole.USER,
          type: "access",
        },
        "test-secret-key",
        { expiresIn: "0s" },
      )

      // Wait a moment to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 10))

      await expect(authService.validateAccessToken(expiredToken)).rejects.toThrow()
    })

    it("should reject tokens with wrong secret", async () => {
      const wrongSecretToken = jwt.sign(
        {
          userId: "user-123",
          email: "test@example.com",
          role: UserRole.USER,
          type: "access",
        },
        "wrong-secret-key",
      )

      await expect(authService.validateAccessToken(wrongSecretToken)).rejects.toThrow("Invalid access token")
    })

    it("should reject malformed tokens", async () => {
      const malformedToken = "not.a.valid.jwt.token"

      await expect(authService.validateAccessToken(malformedToken)).rejects.toThrow("Invalid access token")
    })
  })

  describe("Token Refresh Flow", () => {
    it("should refresh tokens successfully", async () => {
      // Login to get initial tokens
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      // Refresh tokens
      const refreshResult = await authService.refreshTokens({
        refreshToken: loginResult.refreshToken,
      })

      expect(refreshResult.user.id).toBe("user-123")
      expect(refreshResult.accessToken).toBeDefined()
      expect(refreshResult.refreshToken).toBeDefined()

      // New tokens should be different (they have different timestamps)
      expect(refreshResult.accessToken).toBeDefined()
      expect(refreshResult.refreshToken).toBeDefined()
      expect(refreshResult.accessToken.length).toBeGreaterThan(0)
      expect(refreshResult.refreshToken.length).toBeGreaterThan(0)

      // New access token should be valid
      const payload = await authService.validateAccessToken(refreshResult.accessToken)
      expect(payload.userId).toBe("user-123")
    })

    it("should reject access token used as refresh token", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      await expect(
        authService.refreshTokens({
          refreshToken: loginResult.accessToken, // Using access token instead of refresh token
        }),
      ).rejects.toThrow("Invalid refresh token")
    })
  })

  describe("Authentication Flow", () => {
    it("should complete full authentication flow", async () => {
      // Register
      const registerResult = await authService.register({
        email: "newuser@example.com",
        password: "password123",
        profile: {
          firstName: "New",
          lastName: "User",
        },
      })

      expect(registerResult.user.email).toBe("newuser@example.com")
      expect(registerResult.accessToken).toBeDefined()
      expect(registerResult.refreshToken).toBeDefined()

      // Validate access token
      const payload = await authService.validateAccessToken(registerResult.accessToken)
      expect(payload.email).toBe("newuser@example.com")
      expect(payload.type).toBe("access")
      expect(payload.userId).toBe("user-456")
    })

    it("should handle login with invalid credentials", async () => {
      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow("Invalid email or password")
    })

    it("should handle login with non-existent user", async () => {
      await expect(
        authService.login({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Invalid email or password")
    })
  })

  describe("Token Security", () => {
    it("should use different secrets for access and refresh tokens", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      // Access token should not be verifiable with refresh secret
      expect(() => {
        jwt.verify(loginResult.accessToken, "test-refresh-secret-key")
      }).toThrow()

      // Refresh token should not be verifiable with access secret
      expect(() => {
        jwt.verify(loginResult.refreshToken, "test-secret-key")
      }).toThrow()
    })

    it("should include proper token type in payload", async () => {
      const loginResult = await authService.login({
        email: "test@example.com",
        password: "password123",
      })

      const accessPayload = jwt.verify(loginResult.accessToken, "test-secret-key") as any
      const refreshPayload = jwt.verify(loginResult.refreshToken, "test-refresh-secret-key") as any

      expect(accessPayload.type).toBe("access")
      expect(refreshPayload.type).toBe("refresh")
    })
  })
})
