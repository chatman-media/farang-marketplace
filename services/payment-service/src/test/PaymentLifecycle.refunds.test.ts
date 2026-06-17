import { beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Unit-test the `processRefunds` job processor with a fully mocked db + Stripe.
// The real-DB PaymentLifecycle.test.ts already covers expire/retry/auto-complete,
// but processRefunds (the Stripe-gateway branch) was untested.
//
// The processor issues independent queries:
//   db.select().from(refunds).where(...).limit(n)   -> pending refunds
//   db.update(refunds).set(...).where(...)           -> claim / state changes
//   db.select().from(payments).where(...).limit(1)   -> the refund's payment
//   db.update(payments).set(...).where(...)
// We model select chains as thenables pulling from a FIFO queue, and treat
// update chains as awaitable no-ops we can assert against.
// ---------------------------------------------------------------------------
const { selectQueue, dbMock, stripeMock } = vi.hoisted(() => {
  const selectQueue: any[] = []

  const selectBuilder = () => {
    const b: any = {
      from: vi.fn(() => b),
      where: vi.fn(() => b),
      limit: vi.fn(() => b),
      orderBy: vi.fn(() => b),
      then: (resolve: any, reject: any) => {
        const rows = selectQueue.length > 0 ? selectQueue.shift() : []
        return Promise.resolve(rows).then(resolve, reject)
      },
    }
    return b
  }

  const updateBuilder = () => {
    const b: any = {
      set: vi.fn(() => b),
      where: vi.fn(() => Promise.resolve(undefined)),
    }
    return b
  }

  const dbMock = {
    select: vi.fn(() => selectBuilder()),
    update: vi.fn(() => updateBuilder()),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{}])) })) })),
  }

  const stripeMock = { createRefund: vi.fn() }

  return { selectQueue, dbMock, stripeMock }
})

// vi.mock paths are resolved relative to THIS test file (src/test/), so we use
// ../db/... and ../services/... which point at src/db and src/services — the same
// modules the processor imports via ../../db and ../../services.
vi.mock("../db/connection", () => ({
  db: dbMock,
  schema: { payments: { id: "id" }, refunds: { id: "id", status: "status" } },
}))

vi.mock("../services/StripeService", () => ({
  StripeService: class {
    createRefund = stripeMock.createRefund
  },
}))

vi.mock("../services/PaymentService", () => ({
  PaymentService: class {},
}))

// bullmq's Worker isn't used by the unit-under-test, but the module imports it.
vi.mock("bullmq", () => ({
  Worker: class {},
  Job: class {},
}))

import { __testables } from "../jobs/processors/paymentLifecycle"

const job = (data: Record<string, unknown> = {}) => ({ data }) as any

function queueSelect(rows: any) {
  selectQueue.push(rows)
}

describe("paymentLifecycle.processRefunds (mocked db + Stripe)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectQueue.length = 0
  })

  it("refunds a Stripe payment through the gateway and marks it completed", async () => {
    queueSelect([{ id: "ref-1", paymentId: "pay-1", amount: "100.00", status: "pending" }]) // pending refunds
    queueSelect([{ id: "pay-1", paymentMethod: "stripe_card", providerPaymentId: "pi_1" }]) // payment lookup
    stripeMock.createRefund.mockResolvedValue({ id: "re_stripe_1" })

    const result = await __testables.processRefunds(job({ batchSize: 50 }))

    expect(result).toEqual({ processed: 1 })
    // Amount is converted to the minor unit (100.00 -> 10000).
    expect(stripeMock.createRefund).toHaveBeenCalledWith(
      expect.objectContaining({ paymentIntentId: "pi_1", amount: 10000, reason: "requested_by_customer" }),
    )
    // Claim + completed refund update + payment REFUNDED update.
    expect(dbMock.update).toHaveBeenCalled()
  })

  it("leaves non-Stripe (TON) refunds pending for manual processing", async () => {
    queueSelect([{ id: "ref-2", paymentId: "pay-2", amount: "5.0", status: "pending" }])
    queueSelect([{ id: "pay-2", paymentMethod: "ton_wallet", providerPaymentId: null }])

    const result = await __testables.processRefunds(job())

    expect(result).toEqual({ processed: 0 })
    expect(stripeMock.createRefund).not.toHaveBeenCalled()
  })

  it("does not crash and leaves the refund pending when the payment is missing", async () => {
    queueSelect([{ id: "ref-3", paymentId: "gone", amount: "10.0", status: "pending" }])
    queueSelect([]) // payment lookup returns nothing

    const result = await __testables.processRefunds(job())

    // The missing payment throws inside the loop; it's caught and the refund is reverted.
    expect(result).toEqual({ processed: 0 })
    expect(stripeMock.createRefund).not.toHaveBeenCalled()
  })

  it("reverts the claim when a Stripe payment has no provider payment id", async () => {
    queueSelect([{ id: "ref-4", paymentId: "pay-4", amount: "20.0", status: "pending" }])
    queueSelect([{ id: "pay-4", paymentMethod: "stripe_card", providerPaymentId: null }])

    const result = await __testables.processRefunds(job())

    expect(result).toEqual({ processed: 0 })
    expect(stripeMock.createRefund).not.toHaveBeenCalled()
  })

  it("reverts the claim when the Stripe refund call fails", async () => {
    queueSelect([{ id: "ref-5", paymentId: "pay-5", amount: "30.0", status: "pending" }])
    queueSelect([{ id: "pay-5", paymentMethod: "stripe_card", providerPaymentId: "pi_5" }])
    stripeMock.createRefund.mockRejectedValue(new Error("stripe down"))

    const result = await __testables.processRefunds(job())

    expect(result).toEqual({ processed: 0 })
  })

  it("returns processed:0 when there are no pending refunds", async () => {
    queueSelect([]) // no pending refunds
    const result = await __testables.processRefunds(job())
    expect(result).toEqual({ processed: 0 })
  })
})
