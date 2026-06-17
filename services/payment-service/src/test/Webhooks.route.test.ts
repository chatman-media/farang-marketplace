import crypto from "crypto"
import { PaymentStatus, RefundStatus } from "@marketplace/shared-types"
import Fastify, { type FastifyInstance } from "fastify"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { ZodType } from "zod"

// ---------------------------------------------------------------------------
// Mock the service layer so webhook handlers can be exercised in isolation.
// The handlers only call these methods; we assert they are wired correctly and
// that HTTP status codes / error handling behave as expected.
// ---------------------------------------------------------------------------
const { paymentServiceMock, tonServiceMock } = vi.hoisted(() => ({
  paymentServiceMock: {
    findPaymentByTonTransaction: vi.fn(),
    updatePaymentStatus: vi.fn(),
    updatePaymentTransactionId: vi.fn(),
    updateRefundStatus: vi.fn(),
    handleStripePaymentSuccess: vi.fn(),
    handleStripePaymentFailure: vi.fn(),
    handleStripeDispute: vi.fn(),
  },
  tonServiceMock: {
    verifyTransaction: vi.fn(),
    generatePaymentUrl: vi.fn(),
  },
}))

vi.mock("../services/PaymentService", () => ({
  PaymentService: class {
    findPaymentByTonTransaction = paymentServiceMock.findPaymentByTonTransaction
    updatePaymentStatus = paymentServiceMock.updatePaymentStatus
    updatePaymentTransactionId = paymentServiceMock.updatePaymentTransactionId
    updateRefundStatus = paymentServiceMock.updateRefundStatus
    handleStripePaymentSuccess = paymentServiceMock.handleStripePaymentSuccess
    handleStripePaymentFailure = paymentServiceMock.handleStripePaymentFailure
    handleStripeDispute = paymentServiceMock.handleStripeDispute
  },
}))

vi.mock("../services/ModernTonService", () => ({
  ModernTonService: class {
    verifyTransaction = tonServiceMock.verifyTransaction
    generatePaymentUrl = tonServiceMock.generatePaymentUrl
  },
}))

import webhooksRoutes from "../routes/webhooks"

const WEBHOOK_SECRET = "test-stripe-secret"

// The route parses the signature as `signature.split("=")[1]`, so it must contain
// exactly one `=`. It also signs JSON.stringify(request.body), so we sign the
// stringified body object (Fastify preserves key order on round-trip).
function buildStripeSignature(body: unknown): string {
  const payload = JSON.stringify(body)
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload, "utf8").digest("hex")
  return `v1=${hmac}`
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify()
  // Mirror registerPaymentRoutes() so Zod request schemas validate as in prod.
  app.setValidatorCompiler(({ schema }) => (data) => {
    const result = (schema as unknown as ZodType).safeParse(data)
    return result.success ? { value: result.data } : { error: result.error as unknown as Error }
  })
  app.setSerializerCompiler(
    ({ schema }) =>
      (data) =>
        JSON.stringify((schema as unknown as ZodType).parse(data)),
  )
  await app.register(webhooksRoutes)
  await app.ready()
  return app
}

describe("webhook routes", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /webhooks/ton", () => {
    const baseBody = {
      transaction_hash: "hash-abc",
      from_address: "EQfrom",
      to_address: "EQto",
      amount: "1000000000",
      timestamp: 1700000000,
      confirmed: true,
    }

    it("confirms a payment when the tx is found and verified", async () => {
      paymentServiceMock.findPaymentByTonTransaction.mockResolvedValue({ id: "pay-1" })
      tonServiceMock.verifyTransaction.mockResolvedValue(true)
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: "pay-1", status: "completed" })

      const res = await app.inject({ method: "POST", url: "/webhooks/ton", payload: baseBody })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ success: true, processed: true })
      expect(paymentServiceMock.updatePaymentStatus).toHaveBeenCalledWith(
        "pay-1",
        PaymentStatus.COMPLETED,
        expect.stringContaining("hash-abc"),
      )
    })

    it("does not update status when the on-chain verification fails", async () => {
      paymentServiceMock.findPaymentByTonTransaction.mockResolvedValue({ id: "pay-2" })
      tonServiceMock.verifyTransaction.mockResolvedValue(false)

      const res = await app.inject({ method: "POST", url: "/webhooks/ton", payload: baseBody })

      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.updatePaymentStatus).not.toHaveBeenCalled()
    })

    it("succeeds (no-op) when no payment matches the transaction", async () => {
      paymentServiceMock.findPaymentByTonTransaction.mockResolvedValue(null)
      const res = await app.inject({ method: "POST", url: "/webhooks/ton", payload: baseBody })
      expect(res.statusCode).toBe(200)
      expect(tonServiceMock.verifyTransaction).not.toHaveBeenCalled()
    })

    it("does not trust the client-supplied confirmed flag and re-verifies on-chain", async () => {
      // confirmed: false must NOT short-circuit; the server always re-verifies
      // the transaction itself (CodeQL js/user-controlled-bypass hardening).
      paymentServiceMock.findPaymentByTonTransaction.mockResolvedValue({ id: "pay-3" })
      tonServiceMock.verifyTransaction.mockResolvedValue(true)
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: "pay-3" })

      const res = await app.inject({
        method: "POST",
        url: "/webhooks/ton",
        payload: { ...baseBody, confirmed: false },
      })

      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.findPaymentByTonTransaction).toHaveBeenCalled()
      expect(tonServiceMock.verifyTransaction).toHaveBeenCalledWith("hash-abc")
      expect(paymentServiceMock.updatePaymentStatus).toHaveBeenCalled()
    })

    it("returns 500 when the service throws", async () => {
      paymentServiceMock.findPaymentByTonTransaction.mockRejectedValue(new Error("db down"))
      const res = await app.inject({ method: "POST", url: "/webhooks/ton", payload: baseBody })
      expect(res.statusCode).toBe(500)
      expect(res.json().success).toBe(false)
    })

    it("rejects a malformed body with a validation error", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/ton",
        payload: { transaction_hash: "x" }, // missing required fields
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe("POST /webhooks/stripe", () => {
    const stripeBody = {
      id: "evt_1",
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1" } },
      created: 1700000000,
    }

    it("rejects requests with a missing signature header", async () => {
      const res = await app.inject({ method: "POST", url: "/webhooks/stripe", payload: stripeBody })
      expect(res.statusCode).toBe(400)
      expect(res.json().error).toMatch(/Missing signature|Invalid signature/)
    })

    it("rejects an invalid signature", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": "v1=deadbeef" },
        payload: stripeBody,
      })
      expect(res.statusCode).toBe(400)
      // Either an explicit mismatch or the timingSafeEqual length guard.
      expect(res.json().error).toMatch(/Invalid signature|Signature verification failed/)
    })

    it("routes payment_intent.succeeded to the success handler", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": buildStripeSignature(stripeBody) },
        payload: stripeBody,
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.handleStripePaymentSuccess).toHaveBeenCalledWith("pi_1")
    })

    it("routes payment_intent.payment_failed to the failure handler", async () => {
      const body = { ...stripeBody, type: "payment_intent.payment_failed", data: { object: { id: "pi_2" } } }
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": buildStripeSignature(body) },
        payload: body,
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.handleStripePaymentFailure).toHaveBeenCalledWith("pi_2")
    })

    it("routes charge.dispute.created to the dispute handler", async () => {
      const body = { ...stripeBody, type: "charge.dispute.created", data: { object: { charge: "ch_9" } } }
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": buildStripeSignature(body) },
        payload: body,
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.handleStripeDispute).toHaveBeenCalledWith("ch_9")
    })

    it("acknowledges an unhandled event type without calling any handler", async () => {
      const body = { ...stripeBody, type: "invoice.created" }
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": buildStripeSignature(body) },
        payload: body,
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.handleStripePaymentSuccess).not.toHaveBeenCalled()
    })

    it("returns 500 when a handler throws", async () => {
      paymentServiceMock.handleStripePaymentSuccess.mockRejectedValue(new Error("boom"))
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/stripe",
        headers: { "stripe-signature": buildStripeSignature(stripeBody) },
        payload: stripeBody,
      })
      expect(res.statusCode).toBe(500)
    })
  })

  describe("POST /webhooks/payment", () => {
    const validId = "63340d77-ccc9-4fb0-b71e-b10d7711ebd9"

    it("updates payment status and stores the transaction id", async () => {
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: validId })
      paymentServiceMock.updatePaymentTransactionId.mockResolvedValue(undefined)

      const res = await app.inject({
        method: "POST",
        url: "/webhooks/payment",
        payload: { payment_id: validId, status: PaymentStatus.COMPLETED, transaction_id: "tx-1", reason: "done" },
      })

      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.updatePaymentStatus).toHaveBeenCalledWith(validId, PaymentStatus.COMPLETED, "done")
      expect(paymentServiceMock.updatePaymentTransactionId).toHaveBeenCalledWith(validId, "tx-1")
    })

    it("skips the transaction id update when none is provided", async () => {
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: validId })
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/payment",
        payload: { payment_id: validId, status: PaymentStatus.CANCELLED },
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.updatePaymentTransactionId).not.toHaveBeenCalled()
    })

    it("rejects a non-uuid payment_id", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/payment",
        payload: { payment_id: "not-a-uuid", status: PaymentStatus.COMPLETED },
      })
      expect(res.statusCode).toBe(400)
    })

    it("returns 500 when the update throws", async () => {
      paymentServiceMock.updatePaymentStatus.mockRejectedValue(new Error("fail"))
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/payment",
        payload: { payment_id: validId, status: PaymentStatus.COMPLETED },
      })
      expect(res.statusCode).toBe(500)
    })
  })

  describe("POST /webhooks/refund", () => {
    const refundId = "4f427046-beae-4c6b-8683-9245567feec4"
    const paymentId = "1e02300b-4cd0-40ba-b9ab-5da857457994"

    it("marks the payment refunded when the refund is completed", async () => {
      paymentServiceMock.updateRefundStatus.mockResolvedValue(undefined)
      paymentServiceMock.updatePaymentStatus.mockResolvedValue({ id: paymentId })

      const res = await app.inject({
        method: "POST",
        url: "/webhooks/refund",
        payload: { refund_id: refundId, payment_id: paymentId, amount: "10.00", status: RefundStatus.COMPLETED },
      })

      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.updateRefundStatus).toHaveBeenCalledWith(refundId, RefundStatus.COMPLETED, undefined)
      expect(paymentServiceMock.updatePaymentStatus).toHaveBeenCalledWith(
        paymentId,
        PaymentStatus.REFUNDED,
        "Refund completed",
      )
    })

    it("does not change payment status for a non-completed refund", async () => {
      paymentServiceMock.updateRefundStatus.mockResolvedValue(undefined)
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/refund",
        payload: { refund_id: refundId, payment_id: paymentId, amount: "10.00", status: RefundStatus.PENDING },
      })
      expect(res.statusCode).toBe(200)
      expect(paymentServiceMock.updatePaymentStatus).not.toHaveBeenCalled()
    })

    it("rejects an invalid refund status enum", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/webhooks/refund",
        payload: { refund_id: refundId, payment_id: paymentId, amount: "10.00", status: "bogus" },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe("GET /webhooks/health", () => {
    it("reports all webhook channels as active", async () => {
      const res = await app.inject({ method: "GET", url: "/webhooks/health" })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.status).toBe("healthy")
      expect(body.webhooks).toEqual({ ton: "active", stripe: "active", payment: "active", refund: "active" })
    })
  })
})
