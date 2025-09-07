import { describe, it, expect, beforeEach } from "vitest"
import { AuthController } from "../../controllers/AuthController"
import { AuthService } from "../../services/AuthService"
import { z } from "zod"

// Mock request and response objects
const createMockRequest = (body: any = {}, headers: any = {}) => ({
  body,
  headers: {
    "x-request-id": "test-request-id",
    ...headers,
  },
  user: undefined as any,
})

const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: function (code: number) {
      this.statusCode = code
      return this
    },
    json: function (data: any) {
      this.jsonData = data
      return this
    },
  }
  return res
}

// Mock UserService for testing
class MockUserService {
  async createUser(userData: any) {
    if (userData.email === "existing@example.com") {
      throw new Error("User with this email already exists")
    }
    return {
      id: userData.email === "newuser@example.com" ? "user-456" : "user-123",
      email: userData.email,
      role: "user",
      profile: userData.profile,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  async validateUserCredentials(email: string, password: string) {
    if (email === "test@example.com" && password === "password123") {
      return {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashedpassword",
        role: "user",
        profile: {
          firstName: "John",
          lastName: "Doe",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: "unverified",
        },
        isActive: true,
        toPublicUser: () => ({
          id: "user-123",
          email: "test@example.com",
          role: "user",
          profile: {
            firstName: "John",
            lastName: "Doe",
            rating: 0,
            reviewsCount: 0,
            verificationStatus: "unverified",
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    }
    if (email === "newuser@example.com" && password === "password123") {
      return {
        id: "user-456",
        email: "newuser@example.com",
        passwordHash: "hashedpassword",
        role: "user",
        profile: {
          firstName: "New",
          lastName: "User",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: "unverified",
        },
        isActive: true,
        toPublicUser: () => ({
          id: "user-456",
          email: "newuser@example.com",
          role: "user",
          profile: {
            firstName: "New",
            lastName: "User",
            rating: 0,
            reviewsCount: 0,
            verificationStatus: "unverified",
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    }
    return null
  }
}

describe("AuthController Unit Tests", () => {
  let authController: AuthController
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
    authController = new AuthController(authService)
  })

  describe("Login Controller", () => {
    it("should handle valid login request", async () => {
      const req = createMockRequest({
        email: "test@example.com",
        password: "password123",
      })
      const res = createMockResponse()

      await authController.login(req as any, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.message).toBe("Login successful")
      expect(res.jsonData.data).toHaveProperty("user")
      expect(res.jsonData.data).toHaveProperty("accessToken")
      expect(res.jsonData.data).toHaveProperty("refreshToken")
    })

    it("should handle invalid email format", async () => {
      const req = createMockRequest({
        email: "invalid-email",
        password: "password123",
      })
      const res = createMockResponse()

      await authController.login(req as any, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error.code).toBe("VALIDATION_ERROR")
      expect(res.jsonData.error.message).toBe("Invalid request data")
    })

    it("should handle missing password", async () => {
      const req = createMockRequest({
        email: "test@example.com",
      })
      const res = createMockResponse()

      await authController.login(req as any, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error.code).toBe("VALIDATION_ERROR")
    })

    it("should handle invalid credentials", async () => {
      const req = createMockRequest({
        email: "test@example.com",
        password: "wrongpassword",
      })
      const res = createMockResponse()

      await authController.login(req as any, res as any)

      expect(res.statusCode).toBe(401)
      expect(res.jsonData.error.code).toBe("AUTHENTICATION_FAILED")
    })
  })

  describe("Register Controller", () => {
    it("should handle valid registration request", async () => {
      const req = createMockRequest({
        email: "newuser@example.com",
        password: "password123",
        profile: {
          firstName: "New",
          lastName: "User",
        },
      })
      const res = createMockResponse()

      await authController.register(req as any, res as any)

      expect(res.statusCode).toBe(201)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.message).toBe("Registration successful")
      expect(res.jsonData.data).toHaveProperty("user")
      expect(res.jsonData.data).toHaveProperty("accessToken")
      expect(res.jsonData.data).toHaveProperty("refreshToken")
    })

    it("should handle invalid email format", async () => {
      const req = createMockRequest({
        email: "invalid-email",
        password: "password123",
        profile: {
          firstName: "New",
          lastName: "User",
        },
      })
      const res = createMockResponse()

      await authController.register(req as any, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error.code).toBe("VALIDATION_ERROR")
    })

    it("should handle short password", async () => {
      const req = createMockRequest({
        email: "newuser@example.com",
        password: "123",
        profile: {
          firstName: "New",
          lastName: "User",
        },
      })
      const res = createMockResponse()

      await authController.register(req as any, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error.code).toBe("VALIDATION_ERROR")
    })

    it("should handle existing email", async () => {
      const req = createMockRequest({
        email: "existing@example.com",
        password: "password123",
        profile: {
          firstName: "Existing",
          lastName: "User",
        },
      })
      const res = createMockResponse()

      await authController.register(req as any, res as any)

      expect(res.statusCode).toBe(409)
      expect(res.jsonData.error.code).toBe("CONFLICT")
    })
  })

  describe("Logout Controller", () => {
    it("should handle logout request", async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await authController.logout(req as any, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.message).toBe("Logout successful")
    })
  })

  describe("Validate Token Controller", () => {
    it("should validate valid token", async () => {
      // First login to get a valid token
      const loginReq = createMockRequest({
        email: "test@example.com",
        password: "password123",
      })
      const loginRes = createMockResponse()
      await authController.login(loginReq as any, loginRes as any)

      const accessToken = loginRes.jsonData.data.accessToken

      // Now validate the token
      const req = createMockRequest(
        {},
        {
          authorization: `Bearer ${accessToken}`,
        }
      )
      const res = createMockResponse()

      await authController.validateToken(req as any, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.data.valid).toBe(true)
      expect(res.jsonData.data.payload).toHaveProperty("userId")
      expect(res.jsonData.data.payload).toHaveProperty("email")
    })

    it("should handle missing authorization header", async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await authController.validateToken(req as any, res as any)

      expect(res.statusCode).toBe(400)
      expect(res.jsonData.error.code).toBe("MISSING_TOKEN")
    })

    it("should handle invalid token", async () => {
      const req = createMockRequest(
        {},
        {
          authorization: "Bearer invalid.token.here",
        }
      )
      const res = createMockResponse()

      await authController.validateToken(req as any, res as any)

      expect(res.statusCode).toBe(401)
      expect(res.jsonData.error.code).toBe("INVALID_TOKEN")
    })
  })

  describe("Get Profile Controller", () => {
    it("should get profile for authenticated user", async () => {
      const req = createMockRequest()
      req.user = {
        userId: "user-123",
        email: "test@example.com",
        role: "user",
        type: "access",
      }
      const res = createMockResponse()

      await authController.getProfile(req as any, res as any)

      expect(res.statusCode).toBe(200)
      expect(res.jsonData.success).toBe(true)
      expect(res.jsonData.data.userId).toBe("user-123")
      expect(res.jsonData.data.email).toBe("test@example.com")
    })

    it("should handle unauthenticated request", async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await authController.getProfile(req as any, res as any)

      expect(res.statusCode).toBe(401)
      expect(res.jsonData.error.code).toBe("AUTHENTICATION_REQUIRED")
    })
  })
})
