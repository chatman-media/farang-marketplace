import { eq, inArray } from "@marketplace/database-schema"
import { PaymentStatus } from "@marketplace/shared-types"
import { afterAll, describe, expect, it } from "vitest"
import { db, schema } from "../db/connection"
import { __testables } from "../jobs/processors/paymentLifecycle"

const { payments, transactions } = schema

const created: string[] = []

async function insertPayment(overrides: Record<string, unknown>) {
  const [row] = await db
    .insert(payments)
    .values({
      amount: "100.00000000",
      currency: "THB",
      paymentMethod: "ton_wallet",
      provider: "ton",
      totalAmount: "100.00000000",
      ...overrides,
    } as any)
    .returning()
  created.push(row.id)
  return row
}

const job = (data: Record<string, unknown>) => ({ data }) as any

describe("payment lifecycle processors", () => {
  afterAll(async () => {
    if (created.length === 0) return
    // Remove transaction rows created by updatePaymentStatus before the payments.
    await db.delete(transactions).where(inArray(transactions.paymentId, created))
    await db.delete(payments).where(inArray(payments.id, created))
  })

  it("expires pending/processing payments past their expiry, leaving others", async () => {
    const past = new Date(Date.now() - 60_000)
    const future = new Date(Date.now() + 60 * 60_000)
    const expiredOne = await insertPayment({ status: "pending", expiresAt: past })
    const stillValid = await insertPayment({ status: "pending", expiresAt: future })
    const noExpiry = await insertPayment({ status: "pending" })

    const result = await __testables.expireOldPayments(job({ batchSize: 100 }))
    expect(result.expired).toBeGreaterThanOrEqual(1)

    const [a] = await db.select().from(payments).where(eq(payments.id, expiredOne.id))
    expect(a.status).toBe(PaymentStatus.CANCELLED)
    const [b] = await db.select().from(payments).where(eq(payments.id, stillValid.id))
    expect(b.status).toBe(PaymentStatus.PENDING)
    const [c] = await db.select().from(payments).where(eq(payments.id, noExpiry.id))
    expect(c.status).toBe(PaymentStatus.PENDING)
  })

  it("requeues failed payments with retry budget and increments retryCount with backoff", async () => {
    const retryable = await insertPayment({ status: "failed", retryCount: 0 })
    const exhausted = await insertPayment({ status: "failed", retryCount: 3 })

    const result = await __testables.retryFailedPayments(job({ batchSize: 100, maxRetries: 3 }))
    expect(result.retried).toBeGreaterThanOrEqual(1)

    const [a] = await db.select().from(payments).where(eq(payments.id, retryable.id))
    expect(a.status).toBe(PaymentStatus.PENDING)
    expect(a.retryCount).toBe(1)
    expect(a.nextRetryAt).not.toBeNull()

    const [b] = await db.select().from(payments).where(eq(payments.id, exhausted.id))
    expect(b.status).toBe(PaymentStatus.FAILED)
    expect(b.retryCount).toBe(3)
  })

  it("auto-completes payments processing past the delay window", async () => {
    const stale = await insertPayment({ status: "processing", processedAt: new Date(Date.now() - 10 * 60_000) })
    const recent = await insertPayment({ status: "processing", processedAt: new Date() })

    const result = await __testables.autoCompletePayments(job({ batchSize: 100, delayMinutes: 5 }))
    expect(result.completed).toBeGreaterThanOrEqual(1)

    const [a] = await db.select().from(payments).where(eq(payments.id, stale.id))
    expect(a.status).toBe(PaymentStatus.COMPLETED)
    const [b] = await db.select().from(payments).where(eq(payments.id, recent.id))
    expect(b.status).toBe(PaymentStatus.PROCESSING)
  })
})
