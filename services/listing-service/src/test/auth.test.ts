import type { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { adminMiddleware, authMiddleware, optionalAuthMiddleware } from "../middleware/auth"

const SECRET = "auth-test-secret"

let prevSecret: string | undefined

beforeAll(() => {
  prevSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = SECRET
})

afterAll(() => {
  if (prevSecret === undefined) {
    delete process.env.JWT_SECRET
  } else {
    process.env.JWT_SECRET = prevSecret
  }
})

function makeReply() {
  const reply = {
    statusCode: undefined as number | undefined,
    payload: undefined as unknown,
    code: vi.fn(function (this: any, c: number) {
      this.statusCode = c
      return this
    }),
    send: vi.fn(function (this: any, p: unknown) {
      this.payload = p
      return this
    }),
  }
  return reply as unknown as FastifyReply & {
    statusCode: number
    payload: any
    code: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

function makeRequest(headers: Record<string, string> = {}, user?: any): FastifyRequest {
  return { headers, user } as unknown as FastifyRequest
}

function token(payload: Record<string, unknown>, secret = SECRET, opts?: jwt.SignOptions): string {
  return jwt.sign(payload, secret, opts)
}

describe("authMiddleware", () => {
  it("rejects requests with no Authorization header (401)", async () => {
    const reply = makeReply()
    await authMiddleware(makeRequest({}), reply)
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.payload.message).toBe("Access token required")
  })

  it("rejects an Authorization header that is not a Bearer token (401)", async () => {
    const reply = makeReply()
    await authMiddleware(makeRequest({ authorization: "Basic abc" }), reply)
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.payload.message).toBe("Access token required")
  })

  it("populates request.user for a valid token", async () => {
    const reply = makeReply()
    const req = makeRequest({
      authorization: `Bearer ${token({ id: "u1", email: "u1@test.local", role: "user", verified: true })}`,
    })
    await authMiddleware(req, reply)
    expect(reply.code).not.toHaveBeenCalled()
    expect(req.user).toEqual({ id: "u1", email: "u1@test.local", role: "user", verified: true })
  })

  it("returns 401 for a token signed with the wrong secret", async () => {
    const reply = makeReply()
    const req = makeRequest({
      authorization: `Bearer ${token({ id: "u1", email: "x@y.z", role: "user", verified: true }, "wrong-secret")}`,
    })
    await authMiddleware(req, reply)
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.payload.message).toBe("Invalid access token")
    expect(req.user).toBeUndefined()
  })

  it("returns 401 for an expired token", async () => {
    const reply = makeReply()
    // expiresIn -1 -> already expired
    const req = makeRequest({
      authorization: `Bearer ${token({ id: "u1", email: "x@y.z", role: "user", verified: true }, SECRET, { expiresIn: -1 })}`,
    })
    await authMiddleware(req, reply)
    expect(reply.code).toHaveBeenCalledWith(401)
    // jwt throws TokenExpiredError which extends JsonWebTokenError; either of the
    // two 401 branches is acceptable, but both report a 401.
    expect([401]).toContain(reply.statusCode)
  })

  it("returns 401 for a malformed token", async () => {
    const reply = makeReply()
    const req = makeRequest({ authorization: "Bearer not.a.real.jwt" })
    await authMiddleware(req, reply)
    expect(reply.code).toHaveBeenCalledWith(401)
  })
})

describe("optionalAuthMiddleware", () => {
  it("continues without user when no header is present", async () => {
    const reply = makeReply()
    const req = makeRequest({})
    await optionalAuthMiddleware(req, reply)
    expect(reply.code).not.toHaveBeenCalled()
    expect(req.user).toBeUndefined()
  })

  it("continues without user for a non-Bearer header", async () => {
    const reply = makeReply()
    const req = makeRequest({ authorization: "Token foo" })
    await optionalAuthMiddleware(req, reply)
    expect(req.user).toBeUndefined()
    expect(reply.code).not.toHaveBeenCalled()
  })

  it("sets request.user for a valid token", async () => {
    const reply = makeReply()
    const req = makeRequest({
      authorization: `Bearer ${token({ id: "u9", email: "u9@test.local", role: "admin", verified: true })}`,
    })
    await optionalAuthMiddleware(req, reply)
    expect(req.user?.id).toBe("u9")
    expect(req.user?.role).toBe("admin")
  })

  it("swallows an invalid token and continues without user", async () => {
    const reply = makeReply()
    const req = makeRequest({ authorization: "Bearer garbage" })
    await optionalAuthMiddleware(req, reply)
    expect(req.user).toBeUndefined()
    expect(reply.code).not.toHaveBeenCalled()
  })
})

describe("adminMiddleware", () => {
  it("returns 401 when there is no authenticated user", async () => {
    const reply = makeReply()
    await adminMiddleware(makeRequest({}), reply)
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.payload.message).toBe("Authentication required")
  })

  it("returns 403 for a non-admin, non-manager role", async () => {
    const reply = makeReply()
    await adminMiddleware(makeRequest({}, { id: "u1", role: "user" }), reply)
    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.payload.message).toBe("Admin access required")
  })

  it("allows an admin (no reply sent)", async () => {
    const reply = makeReply()
    await adminMiddleware(makeRequest({}, { id: "u1", role: "admin" }), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it("allows an agency_manager (no reply sent)", async () => {
    const reply = makeReply()
    await adminMiddleware(makeRequest({}, { id: "u1", role: "agency_manager" }), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })
})
