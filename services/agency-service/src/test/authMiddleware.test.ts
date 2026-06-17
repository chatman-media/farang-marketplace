import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireAgencyOwnership,
  requireAgencyStaff,
  requireRole,
  requireUserOrAdmin,
} from "../middleware/auth"
import { createMockReply, createMockRequest } from "./helpers/fastifyMock"

const JWT_SECRET = "test-jwt-secret-key-for-agencies"

function tokenFor(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET)
}

describe("auth middleware", () => {
  const originalSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
  })

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret
  })

  describe("authenticateToken", () => {
    it("rejects requests without a token", async () => {
      const reply = createMockReply()
      await authenticateToken(createMockRequest(), reply)
      expect(reply.code).toHaveBeenCalledWith(401)
      expect(reply.sent.message).toBe("Access token required")
    })

    it("returns 500 when JWT_SECRET is not configured", async () => {
      process.env.JWT_SECRET = ""
      const reply = createMockReply()
      const req = createMockRequest({ headers: { authorization: "Bearer abc" } })
      await authenticateToken(req, reply)
      expect(reply.code).toHaveBeenCalledWith(500)
      expect(reply.sent.message).toBe("Server configuration error")
    })

    it("rejects an invalid token with 403", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ headers: { authorization: "Bearer not-a-real-token" } })
      await authenticateToken(req, reply)
      expect(reply.code).toHaveBeenCalledWith(403)
      expect(reply.sent.message).toBe("Invalid or expired token")
    })

    it("attaches the decoded user for a valid token", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        headers: { authorization: `Bearer ${tokenFor({ id: "user-1", role: "admin" })}` },
      })
      await authenticateToken(req, reply)
      expect(req.user).toMatchObject({ id: "user-1", role: "admin" })
      expect(reply.code).not.toHaveBeenCalled()
    })
  })

  describe("requireRole", () => {
    it("rejects when there is no authenticated user", async () => {
      const reply = createMockReply()
      await requireRole("admin")(createMockRequest(), reply)
      expect(reply.code).toHaveBeenCalledWith(401)
    })

    it("rejects users without an allowed role", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "u", role: "user" } })
      await requireRole("admin")(req, reply)
      expect(reply.code).toHaveBeenCalledWith(403)
      expect(reply.sent.message).toBe("Insufficient permissions")
    })

    it("allows users with an allowed role", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "u", role: "agency_owner" } })
      await requireRole("agency_owner", "admin")(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("requireAdmin allows admins and blocks others", async () => {
      const ok = createMockReply()
      await requireAdmin(createMockRequest({ user: { id: "u", role: "admin" } }), ok)
      expect(ok.code).not.toHaveBeenCalled()

      const blocked = createMockReply()
      await requireAdmin(createMockRequest({ user: { id: "u", role: "user" } }), blocked)
      expect(blocked.code).toHaveBeenCalledWith(403)
    })

    it("requireAgencyStaff allows owner, manager and admin", async () => {
      for (const role of ["agency_owner", "agency_manager", "admin"]) {
        const reply = createMockReply()
        await requireAgencyStaff(createMockRequest({ user: { id: "u", role } }), reply)
        expect(reply.code).not.toHaveBeenCalled()
      }
      const blocked = createMockReply()
      await requireAgencyStaff(createMockRequest({ user: { id: "u", role: "user" } }), blocked)
      expect(blocked.code).toHaveBeenCalledWith(403)
    })
  })

  describe("requireAgencyOwnership", () => {
    it("rejects unauthenticated requests", async () => {
      const reply = createMockReply()
      await requireAgencyOwnership(createMockRequest(), reply)
      expect(reply.code).toHaveBeenCalledWith(401)
    })

    it("allows admins to access any agency", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "u", role: "admin" }, params: { agencyId: "any" } })
      await requireAgencyOwnership(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("allows owners to access their own agency (from params)", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        user: { id: "u", role: "agency_owner", agencyId: "agency-1" },
        params: { agencyId: "agency-1" },
      })
      await requireAgencyOwnership(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("allows managers using the agencyId from the body", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        user: { id: "u", role: "agency_manager", agencyId: "agency-2" },
        params: {},
        body: { agencyId: "agency-2" },
      })
      await requireAgencyOwnership(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("blocks owners accessing another agency", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        user: { id: "u", role: "agency_owner", agencyId: "agency-1" },
        params: { agencyId: "agency-2" },
      })
      await requireAgencyOwnership(req, reply)
      expect(reply.code).toHaveBeenCalledWith(403)
      expect(reply.sent.message).toContain("only manage your own agency")
    })

    it("blocks plain users", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        user: { id: "u", role: "user" },
        params: { agencyId: "agency-1" },
      })
      await requireAgencyOwnership(req, reply)
      expect(reply.code).toHaveBeenCalledWith(403)
    })
  })

  describe("optionalAuth", () => {
    it("continues without a user when no token is present", async () => {
      const reply = createMockReply()
      const req = createMockRequest()
      await optionalAuth(req, reply)
      expect(req.user).toBeUndefined()
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("continues without a user when JWT_SECRET is missing", async () => {
      process.env.JWT_SECRET = ""
      const reply = createMockReply()
      const req = createMockRequest({ headers: { authorization: "Bearer abc" } })
      await optionalAuth(req, reply)
      expect(req.user).toBeUndefined()
    })

    it("attaches the user for a valid token", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        headers: { authorization: `Bearer ${tokenFor({ id: "user-9", role: "user" })}` },
      })
      await optionalAuth(req, reply)
      expect(req.user).toMatchObject({ id: "user-9" })
    })

    it("continues without a user for an invalid token", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ headers: { authorization: "Bearer garbage" } })
      await optionalAuth(req, reply)
      expect(req.user).toBeUndefined()
      expect(reply.code).not.toHaveBeenCalled()
    })
  })

  describe("requireUserOrAdmin", () => {
    it("rejects unauthenticated requests", async () => {
      const reply = createMockReply()
      await requireUserOrAdmin(createMockRequest(), reply)
      expect(reply.code).toHaveBeenCalledWith(401)
    })

    it("allows admins for any user id", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "admin-1", role: "admin" }, params: { userId: "someone" } })
      await requireUserOrAdmin(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("allows a user to access their own data (params)", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "user-1", role: "user" }, params: { userId: "user-1" } })
      await requireUserOrAdmin(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("allows a user to access their own data (body)", async () => {
      const reply = createMockReply()
      const req = createMockRequest({
        user: { id: "user-1", role: "user" },
        params: {},
        body: { userId: "user-1" },
      })
      await requireUserOrAdmin(req, reply)
      expect(reply.code).not.toHaveBeenCalled()
    })

    it("blocks a user accessing another user's data", async () => {
      const reply = createMockReply()
      const req = createMockRequest({ user: { id: "user-1", role: "user" }, params: { userId: "user-2" } })
      await requireUserOrAdmin(req, reply)
      expect(reply.code).toHaveBeenCalledWith(403)
      expect(reply.sent.message).toContain("only access your own data")
    })
  })
})
