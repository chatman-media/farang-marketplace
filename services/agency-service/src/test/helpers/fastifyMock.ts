import { vi } from "vitest"

/**
 * Minimal FastifyReply test double that records `.code()` and `.send()` calls.
 */
export function createMockReply(): any {
  const reply: any = {
    statusCode: 200,
    sent: undefined,
    code: vi.fn((status: number) => {
      reply.statusCode = status
      return reply
    }),
    send: vi.fn((payload: unknown) => {
      reply.sent = payload
      return reply
    }),
  }
  return reply
}

/**
 * Minimal FastifyRequest test double.
 */
export function createMockRequest(overrides: Record<string, unknown> = {}): any {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    user: undefined,
    ...overrides,
  }
}
