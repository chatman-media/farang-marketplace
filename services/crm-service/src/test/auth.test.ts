import { beforeEach, describe, expect, it, vi } from "vitest"
import { authenticateToken, requireRole } from "../middleware/auth"

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
  verify: vi.fn(),
}))

import jwt from "jsonwebtoken"

describe("Auth Middleware", () => {
  let mockRequest: any
  let mockReply: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      headers: {},
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    // Set default JWT_SECRET for tests
    process.env.JWT_SECRET = "test-secret"
  })

  describe("authenticateToken", () => {
    it("should authenticate valid token", async () => {
      const token = "valid-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      const decodedToken = {
        id: "user-123",
        email: "test@test.com",
        role: "admin",
      }

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any)

      await authenticateToken(mockRequest, mockReply)

      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret")
      expect(mockRequest.user).toEqual({
        id: "user-123",
        role: "admin",
        email: "test@test.com",
      })
      expect(mockReply.code).not.toHaveBeenCalled()
    })

    it("should authenticate token with userId instead of id", async () => {
      const token = "valid-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      const decodedToken = {
        userId: "user-456",
        email: "test@test.com",
        role: "user",
      }

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any)

      await authenticateToken(mockRequest, mockReply)

      expect(mockRequest.user).toEqual({
        id: "user-456",
        role: "user",
        email: "test@test.com",
      })
    })

    it("should use default role if not provided", async () => {
      const token = "valid-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      const decodedToken = {
        id: "user-123",
        email: "test@test.com",
      }

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any)

      await authenticateToken(mockRequest, mockReply)

      expect(mockRequest.user.role).toBe("user")
    })

    it("should return 401 if no token provided", async () => {
      mockRequest.headers.authorization = undefined

      await authenticateToken(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(401)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Access token is required",
      })
    })

    it("should return 401 if authorization header is malformed", async () => {
      mockRequest.headers.authorization = "InvalidFormat"

      await authenticateToken(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(401)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Access token is required",
      })
    })

    it("should return 403 if token is invalid", async () => {
      const token = "invalid-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token")
      })

      await authenticateToken(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Invalid or expired token",
      })
    })

    it("should return 403 if token is expired", async () => {
      const token = "expired-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Token expired")
      })

      await authenticateToken(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Invalid or expired token",
      })
    })

    it("should use fallback secret if JWT_SECRET not set", async () => {
      delete process.env.JWT_SECRET

      const token = "valid-token"
      mockRequest.headers.authorization = `Bearer ${token}`

      const decodedToken = {
        id: "user-123",
        email: "test@test.com",
        role: "admin",
      }

      vi.mocked(jwt.verify).mockReturnValue(decodedToken as any)

      await authenticateToken(mockRequest, mockReply)

      expect(jwt.verify).toHaveBeenCalledWith(token, "fallback-secret")
    })
  })

  describe("requireRole", () => {
    it("should allow access for user with required role", async () => {
      mockRequest.user = {
        id: "user-123",
        role: "admin",
        email: "admin@test.com",
      }

      const middleware = requireRole(["admin", "agency_owner"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
      expect(mockReply.send).not.toHaveBeenCalled()
    })

    it("should allow access for any matching role", async () => {
      mockRequest.user = {
        id: "user-123",
        role: "agency_manager",
        email: "manager@test.com",
      }

      const middleware = requireRole(["admin", "agency_owner", "agency_manager"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).not.toHaveBeenCalled()
    })

    it("should return 401 if user not authenticated", async () => {
      mockRequest.user = undefined

      const middleware = requireRole(["admin"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(401)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Authentication required",
      })
    })

    it("should return 403 if user role not in required roles", async () => {
      mockRequest.user = {
        id: "user-123",
        role: "user",
        email: "user@test.com",
      }

      const middleware = requireRole(["admin", "agency_owner"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Access denied. Required roles: admin, agency_owner",
      })
    })

    it("should show correct required roles in error message", async () => {
      mockRequest.user = {
        id: "user-123",
        role: "user",
        email: "user@test.com",
      }

      const middleware = requireRole(["admin"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Access denied. Required roles: admin",
      })
    })

    it("should handle multiple required roles", async () => {
      mockRequest.user = {
        id: "user-123",
        role: "user",
        email: "user@test.com",
      }

      const middleware = requireRole(["admin", "agency_owner", "agency_manager"])
      await middleware(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Access denied. Required roles: admin, agency_owner, agency_manager",
      })
    })
  })
})
