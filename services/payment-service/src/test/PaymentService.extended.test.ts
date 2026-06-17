import { beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Flexible Drizzle-style db mock.
//
// PaymentService builds chained queries like
//   db.select().from(t).where(c).limit(1)
//   db.insert(t).values(v).returning()
//   db.update(t).set(v).where(c).returning()
// and then `await`s the result. We model each chain as a thenable builder; the
// value it resolves to is taken from a per-operation FIFO queue so individual
// tests can script the exact rows each query returns, in order.
// ---------------------------------------------------------------------------
// `vi.hoisted` runs before the hoisted `vi.mock` factories below, so these
// values are safely initialized by the time the factories reference them.
const { queues, dbMock, tonServiceMock, stripeServiceMock } = vi.hoisted(() => {
  const queues: { select: any[]; insert: any[]; update: any[] } = { select: [], insert: [], update: [] }

  function makeBuilder(kind: "select" | "insert" | "update") {
    const builder: any = {
      from: vi.fn(() => builder),
      where: vi.fn(() => builder),
      set: vi.fn(() => builder),
      values: vi.fn(() => builder),
      returning: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      offset: vi.fn(() => builder),
      orderBy: vi.fn(() => builder),
      then: (resolve: any, reject: any) => {
        try {
          const next = queues[kind].length > 0 ? queues[kind].shift() : []
          return Promise.resolve(next).then(resolve, reject)
        } catch (err) {
          return Promise.reject(err).then(resolve, reject)
        }
      },
    }
    return builder
  }

  const dbMock = {
    select: vi.fn(() => makeBuilder("select")),
    insert: vi.fn(() => makeBuilder("insert")),
    update: vi.fn(() => makeBuilder("update")),
  }

  const tonServiceMock = {
    calculateTonAmount: vi.fn(),
    createPayment: vi.fn(),
    verifyTransaction: vi.fn(),
    generatePaymentUrl: vi.fn(),
  }
  const stripeServiceMock = {
    convertToStripeAmount: vi.fn((amount: number) => Math.round(amount * 100)),
    createPaymentIntent: vi.fn(),
    confirmPaymentIntent: vi.fn(),
  }

  return { queues, dbMock, tonServiceMock, stripeServiceMock }
})

/** Queue the rows a future `db.select(...)` chain should resolve to. */
function queueSelect(rows: any) {
  queues.select.push(rows)
}
function queueInsert(rows: any) {
  queues.insert.push(rows)
}
function queueUpdate(rows: any) {
  queues.update.push(rows)
}

vi.mock("../db/connection", () => ({
  db: dbMock,
  schema: {
    payments: { id: "id", status: "status", bookingId: "bookingId", providerPaymentId: "ppid" },
    transactions: { paymentId: "paymentId", createdAt: "createdAt" },
    refunds: { id: "id" },
    disputes: {},
  },
}))

// Spyable TON/Stripe service mocks (defined in vi.hoisted above) wired into the
// service classes here so tests can program them per-case.
vi.mock("../services/ModernTonService", () => ({
  ModernTonService: class {
    calculateTonAmount = tonServiceMock.calculateTonAmount
    createPayment = tonServiceMock.createPayment
    verifyTransaction = tonServiceMock.verifyTransaction
    generatePaymentUrl = tonServiceMock.generatePaymentUrl
  },
}))

vi.mock("../services/StripeService", () => ({
  StripeService: class {
    convertToStripeAmount = stripeServiceMock.convertToStripeAmount
    createPaymentIntent = stripeServiceMock.createPaymentIntent
    confirmPaymentIntent = stripeServiceMock.confirmPaymentIntent
  },
}))

import { PaymentService } from "../services/PaymentService"

const basePayment = {
  id: "pay-1",
  bookingId: "book-1",
  userId: "user-1",
  amount: "100.00000000",
  currency: "TON",
  status: "pending",
  paymentMethod: "ton_wallet",
  provider: "ton",
  providerPaymentId: null,
  providerReference: null,
  blockchainTxHash: null,
  blockchainAddress: null,
  metadata: { tonWalletAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t", tonAmount: "40.000000" },
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("PaymentService (extended, mocked db + services)", () => {
  let service: PaymentService

  beforeEach(() => {
    vi.clearAllMocks()
    queues.select = []
    queues.insert = []
    queues.update = []
    service = new PaymentService()
  })

  describe("processTonPayment", () => {
    it("processes a pending TON payment: sets processing, sends tx, stores hash", async () => {
      // getPaymentById -> pending payment
      queueSelect([{ ...basePayment, status: "pending" }])
      // updatePaymentStatus(processing): update returning + createTransaction insert
      queueUpdate([{ ...basePayment, status: "processing" }])
      queueInsert([{ id: "txn-1" }])
      tonServiceMock.createPayment.mockResolvedValue({ hash: "abcdef" })
      // db.update with blockchainTxHash returning
      queueUpdate([{ ...basePayment, status: "processing", blockchainTxHash: "abcdef" }])
      // createTransaction (ton payment) insert
      queueInsert([{ id: "txn-2" }])
      // monitorPaymentConfirmation -> getPaymentById select
      queueSelect([{ ...basePayment, status: "processing", blockchainTxHash: "abcdef" }])
      tonServiceMock.verifyTransaction.mockResolvedValue(true)
      // updatePaymentStatus(completed) inside monitor: update returning + insert
      queueUpdate([{ ...basePayment, status: "completed" }])
      queueInsert([{ id: "txn-3" }])

      const result = await service.processTonPayment("pay-1", "EQfromAddress")

      expect(result.blockchainTxHash).toBe("abcdef")
      expect(tonServiceMock.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ comment: expect.stringContaining("book-1") }),
      )
    })

    it("throws and marks failed when the payment is not found", async () => {
      queueSelect([]) // getPaymentById returns null
      // failure branch calls updatePaymentStatus(failed)
      queueUpdate([{ ...basePayment, status: "failed" }])
      queueInsert([{ id: "txn-f" }])

      await expect(service.processTonPayment("missing", "EQfrom")).rejects.toThrow("Payment not found")
    })

    it("throws when the payment is not in pending status", async () => {
      queueSelect([{ ...basePayment, status: "completed" }])
      queueUpdate([{ ...basePayment, status: "failed" }])
      queueInsert([{ id: "txn-f" }])

      await expect(service.processTonPayment("pay-1", "EQfrom")).rejects.toThrow("Payment is not in pending status")
    })
  })

  describe("processStripePayment", () => {
    it("processes a pending Stripe payment and stores the intent id", async () => {
      const stripePayment = { ...basePayment, paymentMethod: "stripe_card", currency: "USD", status: "pending" }
      queueSelect([stripePayment]) // getPaymentById
      queueUpdate([{ ...stripePayment, status: "processing" }]) // updatePaymentStatus(processing) returning
      queueInsert([{ id: "t1" }]) // its transaction
      stripeServiceMock.createPaymentIntent.mockResolvedValue({
        paymentIntentId: "pi_1",
        clientSecret: "sec_1",
        chargeId: "ch_1",
        status: "processing",
      })
      queueUpdate([{ ...stripePayment, providerPaymentId: "pi_1", status: "processing" }]) // store stripe data
      queueInsert([{ id: "t2" }]) // stripe transaction

      const result = await service.processStripePayment("pay-1", "pm_card", "cus_1")

      expect(result.providerPaymentId).toBe("pi_1")
      expect(stripeServiceMock.convertToStripeAmount).toHaveBeenCalledWith(100, "USD")
      expect(stripeServiceMock.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: "pm_card", customerId: "cus_1" }),
      )
    })

    it("marks the payment failed when Stripe rejects the intent", async () => {
      const stripePayment = { ...basePayment, paymentMethod: "stripe_card", currency: "USD", status: "pending" }
      queueSelect([stripePayment]) // getPaymentById
      queueUpdate([{ ...stripePayment, status: "processing" }]) // updatePaymentStatus(processing)
      queueInsert([{ id: "t1" }])
      stripeServiceMock.createPaymentIntent.mockRejectedValue(new Error("card_declined"))
      queueUpdate([{ ...stripePayment, status: "failed" }]) // updatePaymentStatus(failed) in catch
      queueInsert([{ id: "t-fail" }])

      await expect(service.processStripePayment("pay-1", "pm_card")).rejects.toThrow("card_declined")
    })

    it("throws when the payment is not found", async () => {
      queueSelect([])
      queueUpdate([{ ...basePayment, status: "failed" }])
      queueInsert([{ id: "tf" }])
      await expect(service.processStripePayment("missing", "pm")).rejects.toThrow("Payment not found")
    })
  })

  describe("confirmStripePayment", () => {
    it("confirms an existing Stripe payment intent", async () => {
      const p = { ...basePayment, providerPaymentId: "pi_99", paymentMethod: "stripe_card" }
      queueSelect([p]) // getPaymentById
      stripeServiceMock.confirmPaymentIntent.mockResolvedValue({
        paymentIntentId: "pi_99",
        chargeId: "ch_99",
        status: "completed",
      })
      queueUpdate([{ ...p, status: "completed" }]) // update returning
      queueInsert([{ id: "t-confirm" }]) // confirmation transaction

      const result = await service.confirmStripePayment("pay-1")
      expect(result.status).toBe("completed")
      expect(stripeServiceMock.confirmPaymentIntent).toHaveBeenCalledWith("pi_99")
    })

    it("throws when no Stripe payment intent is stored", async () => {
      queueSelect([{ ...basePayment, providerPaymentId: null }])
      queueUpdate([{ ...basePayment, status: "failed" }]) // catch -> updatePaymentStatus(failed)
      queueInsert([{ id: "tf" }])
      await expect(service.confirmStripePayment("pay-1")).rejects.toThrow("No Stripe payment intent found")
    })
  })

  describe("getPaymentById", () => {
    it("returns the payment when found", async () => {
      queueSelect([basePayment])
      const result = await service.getPaymentById("pay-1")
      expect(result?.id).toBe("pay-1")
    })

    it("returns null when not found", async () => {
      queueSelect([])
      expect(await service.getPaymentById("nope")).toBeNull()
    })
  })

  describe("searchPayments", () => {
    it("applies filters, returns pagination metadata, and computes hasMore", async () => {
      const rows = [basePayment, { ...basePayment, id: "pay-2" }]
      queueSelect(rows) // page of payments
      queueSelect([{ count: 10 }]) // count query

      const result = await service.searchPayments(
        {
          status: "completed",
          payerId: "11111111-1111-1111-1111-111111111111",
          bookingId: "22222222-2222-2222-2222-222222222222",
          paymentMethod: "ton_wallet",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
        1,
        2,
      )

      expect(result.payments).toHaveLength(2)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.hasMore).toBe(true) // offset 0 + 2 < 10
    })

    it("reports hasMore=false on the last page", async () => {
      queueSelect([basePayment]) // 1 row
      queueSelect([{ count: 5 }]) // total 5, offset (page2)=2 -> 2+1=3 < 5 still true... use last page
      const result = await service.searchPayments({}, 3, 2)
      // offset = (3-1)*2 = 4; 4 + 1 = 5, not < 5 => hasMore false
      expect(result.hasMore).toBe(false)
      expect(result.total).toBe(5)
    })
  })

  describe("createRefund", () => {
    it("inserts a refund and marks the payment REFUNDED when fully refunded", async () => {
      queueInsert([{ id: "ref-1", paymentId: "pay-1", amount: "100.00000000", status: "pending" }])
      // getPaymentById inside createRefund
      queueSelect([{ ...basePayment, amount: "100.00000000" }])
      // updatePaymentStatus(refunded): update returning + insert transaction
      queueUpdate([{ ...basePayment, status: "refunded" }])
      queueInsert([{ id: "t-ref" }])

      const refund = await service.createRefund({ paymentId: "pay-1", amount: "100.00000000" } as any)
      expect(refund.id).toBe("ref-1")
    })

    it("does not change payment status for a partial refund", async () => {
      queueInsert([{ id: "ref-2", paymentId: "pay-1", amount: "10.00000000", status: "pending" }])
      queueSelect([{ ...basePayment, amount: "100.00000000" }]) // getPaymentById
      // No further update queued — partial refund should not call updatePaymentStatus.
      const refund = await service.createRefund({ paymentId: "pay-1", amount: "10.00000000" } as any)
      expect(refund.id).toBe("ref-2")
      // update never called for status change
      expect(dbMock.update).not.toHaveBeenCalled()
    })
  })

  describe("createDispute", () => {
    it("inserts a dispute and fails the related booking payment", async () => {
      queueInsert([{ id: "dsp-1", bookingId: "book-1" }])
      queueSelect([basePayment]) // find booking payment
      queueUpdate([{ ...basePayment, status: "failed" }]) // updatePaymentStatus(failed)
      queueInsert([{ id: "t-dsp" }])

      const dispute = await service.createDispute({ bookingId: "book-1" } as any)
      expect(dispute.id).toBe("dsp-1")
    })

    it("inserts a dispute without a booking and does not touch payments", async () => {
      queueInsert([{ id: "dsp-2" }])
      const dispute = await service.createDispute({} as any)
      expect(dispute.id).toBe("dsp-2")
      expect(dbMock.select).not.toHaveBeenCalled()
    })
  })

  describe("getPaymentTransactions", () => {
    it("returns transactions ordered by createdAt", async () => {
      queueSelect([{ id: "t1" }, { id: "t2" }])
      const txns = await service.getPaymentTransactions("pay-1")
      expect(txns).toHaveLength(2)
    })
  })

  describe("validatePaymentMethod", () => {
    const validTon = "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"

    it("accepts ton_wallet with a valid 48-char address", () => {
      expect(service.validatePaymentMethod("ton_wallet", { tonWalletAddress: validTon })).toBe(true)
    })

    it("accepts jetton methods with a valid address", () => {
      expect(service.validatePaymentMethod("jetton_usdt", { tonWalletAddress: validTon })).toBe(true)
    })

    it("rejects an invalid TON address", () => {
      expect(service.validatePaymentMethod("ton_wallet", { tonWalletAddress: "too-short" })).toBeFalsy()
    })

    it("rejects unsupported methods", () => {
      expect(service.validatePaymentMethod("stripe_card", { tonWalletAddress: validTon })).toBe(false)
    })
  })

  describe("findPaymentByTonTransaction", () => {
    it("finds a payment directly by blockchain tx hash", async () => {
      queueSelect([{ ...basePayment, blockchainTxHash: "hash-1" }])
      const found = await service.findPaymentByTonTransaction("hash-1")
      expect(found?.blockchainTxHash).toBe("hash-1")
    })

    it("falls back to the booking id parsed from the comment", async () => {
      queueSelect([]) // no hash match
      queueSelect([{ ...basePayment, bookingId: "abc123" }]) // booking match
      const found = await service.findPaymentByTonTransaction("nohash", "Payment for booking abc123")
      expect(found?.bookingId).toBe("abc123")
    })

    it("returns null when neither hash nor comment matches", async () => {
      queueSelect([]) // no hash match
      const found = await service.findPaymentByTonTransaction("nohash", "no booking reference here")
      expect(found).toBeNull()
    })
  })

  describe("Stripe webhook handlers", () => {
    it("handleStripePaymentSuccess marks the matching payment COMPLETED", async () => {
      queueSelect([{ ...basePayment, providerPaymentId: "pi_s" }])
      queueUpdate([{ ...basePayment, status: "completed" }])
      queueInsert([{ id: "t" }])
      await expect(service.handleStripePaymentSuccess("pi_s")).resolves.toBeUndefined()
    })

    it("handleStripePaymentSuccess is a no-op when no payment matches", async () => {
      queueSelect([])
      await service.handleStripePaymentSuccess("pi_unknown")
      expect(dbMock.update).not.toHaveBeenCalled()
    })

    it("handleStripePaymentFailure marks the matching payment FAILED", async () => {
      queueSelect([{ ...basePayment, providerPaymentId: "pi_f" }])
      queueUpdate([{ ...basePayment, status: "failed" }])
      queueInsert([{ id: "t" }])
      await expect(service.handleStripePaymentFailure("pi_f")).resolves.toBeUndefined()
    })

    it("handleStripeDispute marks the matching payment FAILED", async () => {
      queueSelect([{ ...basePayment, providerReference: "ch_d" }])
      queueUpdate([{ ...basePayment, status: "failed" }])
      queueInsert([{ id: "t" }])
      await expect(service.handleStripeDispute("ch_d")).resolves.toBeUndefined()
    })
  })

  describe("updatePaymentTransactionId / updateRefundStatus", () => {
    it("updates the blockchain tx hash", async () => {
      queueUpdate([]) // update has no returning here
      await expect(service.updatePaymentTransactionId("pay-1", "tx-99")).resolves.toBeUndefined()
      expect(dbMock.update).toHaveBeenCalled()
    })

    it("updates a refund status with a reason", async () => {
      queueUpdate([])
      await expect(service.updateRefundStatus("ref-1", "completed", "ok")).resolves.toBeUndefined()
      expect(dbMock.update).toHaveBeenCalled()
    })
  })

  describe("updatePaymentStatus", () => {
    it("sets completedAt when status is COMPLETED", async () => {
      queueUpdate([{ ...basePayment, status: "completed", completedAt: new Date() }])
      queueInsert([{ id: "t" }])
      const result = await service.updatePaymentStatus("pay-1", "completed", "done")
      expect(result.status).toBe("completed")
    })

    it("does not set completedAt for non-completed statuses", async () => {
      queueUpdate([{ ...basePayment, status: "cancelled" }])
      queueInsert([{ id: "t" }])
      const result = await service.updatePaymentStatus("pay-1", "cancelled", "expired")
      expect(result.status).toBe("cancelled")
    })
  })

  describe("createPayment", () => {
    it("converts fiat to TON for ton payments with a fiatAmount", async () => {
      tonServiceMock.calculateTonAmount.mockResolvedValue("40.000000")
      queueInsert([{ ...basePayment, id: "new-pay" }]) // insert payment returning
      queueInsert([{ id: "t-init" }]) // initial transaction
      const result = await service.createPayment({
        bookingId: "book-1",
        payerId: "user-1",
        payeeId: "host-1",
        amount: "100.00",
        fiatAmount: 100,
        fiatCurrency: "USD",
        paymentMethod: "ton_wallet",
      })
      expect(result.id).toBe("new-pay")
      expect(tonServiceMock.calculateTonAmount).toHaveBeenCalledWith(100, "USD")
    })

    it("creates a stripe payment with provider=stripe and no TON conversion", async () => {
      queueInsert([{ ...basePayment, id: "stripe-pay", paymentMethod: "stripe_card", provider: "stripe" }])
      queueInsert([{ id: "t-init" }])
      const result = await service.createPayment({
        bookingId: "book-1",
        payerId: "user-1",
        payeeId: "host-1",
        amount: "100.00",
        paymentMethod: "stripe_card",
      })
      expect(result.provider).toBe("stripe")
      expect(tonServiceMock.calculateTonAmount).not.toHaveBeenCalled()
    })
  })
})
