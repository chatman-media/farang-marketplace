import { PaymentStatus } from "@marketplace/shared-types"
import Fastify, { type FastifyInstance } from "fastify"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { ZodType } from "zod"

// ---------------------------------------------------------------------------
// Exercise the /payments route handlers with a mocked service layer, through a
// real Fastify instance configured with the same Zod validator/serializer as
// production (registerPaymentRoutes).
// ---------------------------------------------------------------------------
const { paymentServiceMock, tonServiceMock } = vi.hoisted(() => ({
  paymentServiceMock: {
    createPayment: vi.fn(),
    getPaymentById: vi.fn(),
    updatePaymentStatus: vi.fn(),
    searchPayments: vi.fn(),
  },
  tonServiceMock: {
    generatePaymentUrl: vi.fn(),
  },
}))

vi.mock("../services/PaymentService", () => ({
  PaymentService: class {
    createPayment = paymentServiceMock.createPayment
    getPaymentById = paymentServiceMock.getPaymentById
    updatePaymentStatus = paymentServiceMock.updatePaymentStatus
    searchPayments = paymentServiceMock.searchPayments
  },
}))

vi.mock("../services/ModernTonService", () => ({
  ModernTonService: class {
    generatePaymentUrl = tonServiceMock.generatePaymentUrl
  },
}))

import paymentsRoutes from "../routes/payments"

const PAYMENT_ID = "63340d77-ccc9-4fb0-b71e-b10d7711ebd9"
const BOOKING_ID = "4f427046-beae-4c6b-8683-9245567feec4"

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify()
  app.setValidatorCompiler(({ schema }) => (data) => {
    const result = (schema as unknown as ZodType).safeParse(data)
    return result.success ? { value: result.data } : { error: result.error as unknown as Error }
  })
  app.setSerializerCompiler(
    ({ schema }) =>
      (data) =>
        JSON.stringify((schema as unknown as ZodType).parse(data)),
  )
  await app.register(paymentsRoutes)
  await app.ready()
  return app
}

describe("payments routes", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.TON_WALLET_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /payments", () => {
    it("creates a TON payment and includes a TON payment url + qr code", async () => {
      paymentServiceMock.createPayment.mockResolvedValue({
        id: PAYMENT_ID,
        status: PaymentStatus.PENDING,
        amount: "10.5",
        currency: "TON",
        paymentMethod: "ton_wallet",
      })
      tonServiceMock.generatePaymentUrl.mockReturnValue("ton://transfer/EQxxx?amount=1")

      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: {
          bookingId: BOOKING_ID,
          amount: "10.5",
          method: "ton_wallet",
          walletAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
          comment: "stay",
        },
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(body.data.paymentId).toBe(PAYMENT_ID)
      expect(body.data.tonPaymentUrl).toBe("ton://transfer/EQxxx?amount=1")
      expect(body.data.qrCode).toContain("data:image/png;base64")
      expect(tonServiceMock.generatePaymentUrl).toHaveBeenCalled()
    })

    it("creates a stripe payment without TON url/qr", async () => {
      paymentServiceMock.createPayment.mockResolvedValue({
        id: PAYMENT_ID,
        status: PaymentStatus.PENDING,
        amount: "20",
        currency: "USD",
        paymentMethod: "stripe_card",
      })

      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: { bookingId: BOOKING_ID, amount: "20", currency: "USD", method: "stripe_card" },
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.data.tonPaymentUrl).toBeUndefined()
      expect(tonServiceMock.generatePaymentUrl).not.toHaveBeenCalled()
    })

    it("rejects an invalid amount format (too many decimals)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: { bookingId: BOOKING_ID, amount: "10.1234567", method: "ton_wallet" },
      })
      expect(res.statusCode).toBe(400)
      expect(paymentServiceMock.createPayment).not.toHaveBeenCalled()
    })

    it("rejects an unsupported payment method", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: { bookingId: BOOKING_ID, amount: "10", method: "bitcoin" },
      })
      expect(res.statusCode).toBe(400)
    })

    it("rejects a non-uuid bookingId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: { bookingId: "nope", amount: "10", method: "ton_wallet" },
      })
      expect(res.statusCode).toBe(400)
    })

    it("returns 500 when the service throws", async () => {
      paymentServiceMock.createPayment.mockRejectedValue(new Error("insert failed"))
      const res = await app.inject({
        method: "POST",
        url: "/payments",
        payload: { bookingId: BOOKING_ID, amount: "10", method: "ton_wallet" },
      })
      expect(res.statusCode).toBe(500)
      expect(res.json().success).toBe(false)
    })
  })

  describe("GET /payments/:id", () => {
    it("returns a found payment", async () => {
      paymentServiceMock.getPaymentById.mockResolvedValue({ id: PAYMENT_ID, status: "pending" })
      const res = await app.inject({ method: "GET", url: `/payments/${PAYMENT_ID}` })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(PAYMENT_ID)
    })

    it("returns 404 when the payment is missing", async () => {
      paymentServiceMock.getPaymentById.mockResolvedValue(null)
      const res = await app.inject({ method: "GET", url: `/payments/${PAYMENT_ID}` })
      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe("Payment not found")
    })

    it("rejects a non-uuid id with 400", async () => {
      const res = await app.inject({ method: "GET", url: "/payments/not-a-uuid" })
      expect(res.statusCode).toBe(400)
    })

    it("returns 500 when the service throws", async () => {
      paymentServiceMock.getPaymentById.mockRejectedValue(new Error("db error"))
      const res = await app.inject({ method: "GET", url: `/payments/${PAYMENT_ID}` })
      expect(res.statusCode).toBe(500)
    })
  })

  describe("PATCH /payments/:id/status", () => {
    it("updates the status", async () => {
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: PAYMENT_ID, status: "completed" })
      const res = await app.inject({
        method: "PATCH",
        url: `/payments/${PAYMENT_ID}/status`,
        payload: { status: PaymentStatus.COMPLETED, reason: "manual" },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.status).toBe("completed")
      expect(paymentServiceMock.updatePaymentStatus).toHaveBeenCalledWith(PAYMENT_ID, PaymentStatus.COMPLETED, "manual")
    })

    it("rejects an invalid status enum", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/payments/${PAYMENT_ID}/status`,
        payload: { status: "totally_invalid" },
      })
      expect(res.statusCode).toBe(400)
    })

    it("returns 500 when the update throws", async () => {
      paymentServiceMock.updatePaymentStatus.mockRejectedValue(new Error("fail"))
      const res = await app.inject({
        method: "PATCH",
        url: `/payments/${PAYMENT_ID}/status`,
        payload: { status: PaymentStatus.CANCELLED },
      })
      expect(res.statusCode).toBe(500)
    })
  })

  describe("GET /payments/search", () => {
    // NOTE: the search schema types `page`/`limit` as z.number() with defaults,
    // but query-string values arrive as strings. With this Zod validator there
    // is no coercion, so the endpoint only validates when those params are
    // OMITTED (defaults apply). Passing them as strings yields a 400 — see the
    // dedicated test below. (Reported as a likely production bug.)
    it("returns search results when relying on default pagination", async () => {
      paymentServiceMock.searchPayments.mockResolvedValue({
        payments: [{ id: PAYMENT_ID }],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      })
      const res = await app.inject({ method: "GET", url: "/payments/search" })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.total).toBe(1)
      expect(paymentServiceMock.searchPayments).toHaveBeenCalled()
    })

    it("passes status/date filters through to the service", async () => {
      paymentServiceMock.searchPayments.mockResolvedValue({
        payments: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      })
      const res = await app.inject({
        method: "GET",
        url: "/payments/search?status=completed&startDate=2024-01-01&endDate=2024-12-31",
      })
      expect(res.statusCode).toBe(200)
      const [filters] = paymentServiceMock.searchPayments.mock.calls[0]
      expect(filters.status).toBe("completed")
      expect(filters.startDate).toBeInstanceOf(Date)
      expect(filters.endDate).toBeInstanceOf(Date)
    })

    it("rejects string page/limit query params (no Zod coercion)", async () => {
      const res = await app.inject({ method: "GET", url: "/payments/search?page=1&limit=20" })
      expect(res.statusCode).toBe(400)
    })

    it("returns 500 when search throws", async () => {
      paymentServiceMock.searchPayments.mockRejectedValue(new Error("search fail"))
      const res = await app.inject({ method: "GET", url: "/payments/search" })
      expect(res.statusCode).toBe(500)
    })
  })
})
