import { authMiddleware, optionalAuthMiddleware } from "@marketplace/auth"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"

/**
 * Registers the single, shared authentication mechanism.
 *
 * Wrapped in `fastify-plugin` so the `authenticate` / `optionalAuthenticate`
 * decorators escape encapsulation and are visible inside every mounted module
 * (modules opt in per-route via `{ preHandler: [app.authenticate] }`). The
 * decorator type augmentation lives in `@marketplace/auth`.
 */
export default fp(
  async (app: FastifyInstance) => {
    app.decorate("authenticate", authMiddleware)
    app.decorate("optionalAuthenticate", optionalAuthMiddleware)
  },
  { name: "auth-decorator" },
)
