import jwt from "jsonwebtoken"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { JWTPayload } from "../middleware/auth.js"

// Import auth functions dynamically to avoid environment loading issues
let authMiddleware: any
let optionalAuthMiddleware: any
let apiKeyMiddleware: any
let isPublicRoute: any
let getRequiredRoles: any
let hasRole: any
let hasAgencyAccess: any

// Mock Fastify request and reply
const createMockRequest = (overrides = {}) => ({
  url: "/api/test",
  headers: {},
  log: {
    error: vi.fn(),
  },
  ...overrides,
})

const createMockReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
})

describe("Auth Middleware", () => {
  const JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only"

  beforeEach(async () => {
    process.env.JWT_SECRET = JWT_SECRET
    process.env.CONSUL_PORT = "8500"
    vi.clearAllMocks()

    // Import auth functions after setting environment
    const authModule = await import("../middleware/auth.js")
    authMiddleware = authModule.authMiddleware
    optionalAuthMiddleware = authModule.optionalAuthMiddleware
    apiKeyMiddleware = authModule.apiKeyMiddleware
    isPublicRoute = authModule.isPublicRoute
    getRequiredRoles = authModule.getRequiredRoles
    hasRole = authModule.hasRole
    hasAgencyAccess = authModule.hasAgencyAccess
  })

  describe("isPublicRoute", () => {
    it("should identify public routes correctly", () => {
      expect(isPublicRoute("/")).toBe(true)
      expect(isPublicRoute("/health")).toBe(true)
      expect(isPublicRoute("/metrics")).toBe(true)
      expect(isPublicRoute("/api/auth/login")).toBe(true)
      expect(isPublicRoute("/api/auth/register")).toBe(true)
      expect(isPublicRoute("/api/listings")).toBe(true)
      expect(isPublicRoute("/api/listings/123")).toBe(true)
      expect(isPublicRoute("/api/real-estate")).toBe(true)
      expect(isPublicRoute("/api/service-providers")).toBe(true)
    })

    it("should identify protected routes correctly", () => {
      expect(isPublicRoute("/api/bookings")).toBe(false)
      expect(isPublicRoute("/api/payments")).toBe(false)
      expect(isPublicRoute("/api/crm")).toBe(false)
      expect(isPublicRoute("/api/admin")).toBe(false)
    })
  })

  describe("getRequiredRoles", () => {
    it("should return required roles for role-based routes", () => {
      expect(getRequiredRoles("/api/admin/users")).toEqual(["admin"])
      expect(getRequiredRoles("/api/agencies/123/manage")).toEqual(["admin", "agency_owner", "agency_manager"])
      expect(getRequiredRoles("/api/crm/campaigns")).toEqual(["admin", "agency_owner", "agency_manager"])
    })

    it("should return null for routes without role restrictions", () => {
      expect(getRequiredRoles("/api/listings")).toBeNull()
      expect(getRequiredRoles("/api/bookings")).toBeNull()
      expect(getRequiredRoles("/api/payments")).toBeNull()
    })
  })

  describe("authMiddleware", () => {
    it("should allow public routes without authentication", async () => {
      const request = createMockRequest({ url: "/api/auth/login" })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
    })

    it("should reject requests without authorization header", async () => {
      const request = createMockRequest({ url: "/api/bookings" })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "MISSING_TOKEN",
          message: "Access token required",
        }),
      )
    })

    it("should reject requests with invalid authorization header", async () => {
      const request = createMockRequest({
        url: "/api/bookings",
        headers: { authorization: "Invalid token" },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "MISSING_TOKEN",
        }),
      )
    })

    it("should accept valid JWT token", async () => {
      const payload: JWTPayload = {
        id: "user123",
        email: "test@example.com",
        role: "user",
      }
      const token = jwt.sign(payload, JWT_SECRET)

      const request = createMockRequest({
        url: "/api/bookings",
        headers: { authorization: `Bearer ${token}` },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
      expect((request as any).user).toEqual(payload)
    })

    it("should reject expired JWT token", async () => {
      const payload: JWTPayload = {
        id: "user123",
        email: "test@example.com",
        role: "user",
      }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "-1h" }) // Expired

      const request = createMockRequest({
        url: "/api/bookings",
        headers: { authorization: `Bearer ${token}` },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "TOKEN_EXPIRED",
        }),
      )
    })

    it("should reject invalid JWT token", async () => {
      const request = createMockRequest({
        url: "/api/bookings",
        headers: { authorization: "Bearer invalid.jwt.token" },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "INVALID_TOKEN",
        }),
      )
    })

    it("should enforce role-based access control", async () => {
      const payload: JWTPayload = {
        id: "user123",
        email: "test@example.com",
        role: "user", // Not admin
      }
      const token = jwt.sign(payload, JWT_SECRET)

      const request = createMockRequest({
        url: "/api/admin/users",
        headers: { authorization: `Bearer ${token}` },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(403)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "INSUFFICIENT_PERMISSIONS",
        }),
      )
    })

    it("should allow access with correct role", async () => {
      const payload: JWTPayload = {
        id: "admin123",
        email: "admin@example.com",
        role: "admin",
      }
      const token = jwt.sign(payload, JWT_SECRET)

      const request = createMockRequest({
        url: "/api/admin/users",
        headers: { authorization: `Bearer ${token}` },
      })
      const reply = createMockReply()

      await authMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
      expect((request as any).user).toEqual(payload)
    })
  })

  describe("optionalAuthMiddleware", () => {
    it("should continue without authentication when no token provided", async () => {
      const request = createMockRequest({ url: "/api/listings" })
      const reply = createMockReply()

      await optionalAuthMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
      expect((request as any).user).toBeUndefined()
    })

    it("should set user when valid token provided", async () => {
      const payload: JWTPayload = {
        id: "user123",
        email: "test@example.com",
        role: "user",
      }
      const token = jwt.sign(payload, JWT_SECRET)

      const request = createMockRequest({
        url: "/api/listings",
        headers: { authorization: `Bearer ${token}` },
      })
      const reply = createMockReply()

      await optionalAuthMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
      expect((request as any).user).toEqual(payload)
    })

    it("should continue without authentication when invalid token provided", async () => {
      const request = createMockRequest({
        url: "/api/listings",
        headers: { authorization: "Bearer invalid.token" },
      })
      const reply = createMockReply()

      await optionalAuthMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
      expect((request as any).user).toBeUndefined()
    })
  })

  describe("apiKeyMiddleware", () => {
    beforeEach(() => {
      process.env.VALID_API_KEYS = "key1,key2,key3"
    })

    it("should reject requests without API key", async () => {
      const request = createMockRequest()
      const reply = createMockReply()

      await apiKeyMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "MISSING_API_KEY",
        }),
      )
    })

    it("should reject requests with invalid API key", async () => {
      const request = createMockRequest({
        headers: { "x-api-key": "invalid-key" },
      })
      const reply = createMockReply()

      await apiKeyMiddleware(request as any, reply as any)

      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "INVALID_API_KEY",
        }),
      )
    })

    it("should accept requests with valid API key", async () => {
      const request = createMockRequest({
        headers: { "x-api-key": "key1" },
      })
      const reply = createMockReply()

      await apiKeyMiddleware(request as any, reply as any)

      expect(reply.code).not.toHaveBeenCalled()
      expect(reply.send).not.toHaveBeenCalled()
    })
  })

  describe("utility functions", () => {
    describe("hasRole", () => {
      it("should return true when user has required role", () => {
        const user: JWTPayload = { id: "1", email: "test@example.com", role: "admin" }
        expect(hasRole(user, ["admin", "user"])).toBe(true)
        expect(hasRole(user, ["admin"])).toBe(true)
      })

      it("should return false when user does not have required role", () => {
        const user: JWTPayload = { id: "1", email: "test@example.com", role: "user" }
        expect(hasRole(user, ["admin"])).toBe(false)
      })

      it("should return false when user is undefined", () => {
        expect(hasRole(undefined, ["admin"])).toBe(false)
      })
    })

    describe("hasAgencyAccess", () => {
      it("should return true for admin users", () => {
        const user: JWTPayload = { id: "1", email: "admin@example.com", role: "admin" }
        expect(hasAgencyAccess(user, "agency123")).toBe(true)
      })

      it("should return true when user belongs to the agency", () => {
        const user: JWTPayload = {
          id: "1",
          email: "manager@example.com",
          role: "agency_manager",
          agencyId: "agency123",
        }
        expect(hasAgencyAccess(user, "agency123")).toBe(true)
      })

      it("should return false when user does not belong to the agency", () => {
        const user: JWTPayload = {
          id: "1",
          email: "manager@example.com",
          role: "agency_manager",
          agencyId: "agency456",
        }
        expect(hasAgencyAccess(user, "agency123")).toBe(false)
      })

      it("should return false when user is undefined", () => {
        expect(hasAgencyAccess(undefined, "agency123")).toBe(false)
      })
    })
  })
})
