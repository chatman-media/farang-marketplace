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

/** Re-fetch one of our own rows by id, failing clearly if it's missing. */
async function fetchOne(id: string) {
  const rows = await db.select().from(payments).where(eq(payments.id, id))
  expect(rows, `payment ${id} should still exist after the processor ran`).toHaveLength(1)
  return rows[0]
}

const job = (data: Record<string, unknown>) => ({ data }) as any

// These hit the real `payments` table and run the processors, which query it
// GLOBALLY. In CI every workspace's suite runs in parallel against one shared
// DB, so a row can be concurrently removed mid-test — inherently flaky there.
// Run locally / in an isolated DB (the default); skip under the shared CI run.
const describeLifecycle = process.env.CI ? describe.skip : describe.sequential

describeLifecycle("payment lifecycle processors", () => {
  afterAll(async () => {
    if (created.length === 0) return
    await db.delete(transactions).where(inArray(transactions.paymentId, created))
    await db.delete(payments).where(inArray(payments.id, created))
  })

  it("expires pending/processing payments past their expiry, leaving others", async () => {
    const expiredOne = await insertPayment({ status: "pending", expiresAt: new Date(Date.now() - 60_000) })
    const stillValid = await insertPayment({ status: "pending", expiresAt: new Date(Date.now() + 60 * 60_000) })
    const noExpiry = await insertPayment({ status: "pending" })

    await __testables.expireOldPayments(job({ batchSize: 500 }))

    expect((await fetchOne(expiredOne.id)).status).toBe(PaymentStatus.CANCELLED)
    expect((await fetchOne(stillValid.id)).status).toBe(PaymentStatus.PENDING)
    expect((await fetchOne(noExpiry.id)).status).toBe(PaymentStatus.PENDING)
  })

  it("requeues failed payments with retry budget and increments retryCount with backoff", async () => {
    const retryable = await insertPayment({ status: "failed", retryCount: 0 })
    const exhausted = await insertPayment({ status: "failed", retryCount: 3 })

    await __testables.retryFailedPayments(job({ batchSize: 500, maxRetries: 3 }))

    const a = await fetchOne(retryable.id)
    expect(a.status).toBe(PaymentStatus.PENDING)
    expect(a.retryCount).toBe(1)
    expect(a.nextRetryAt).not.toBeNull()

    const b = await fetchOne(exhausted.id)
    expect(b.status).toBe(PaymentStatus.FAILED)
    expect(b.retryCount).toBe(3)
  })

  it("auto-completes payments processing past the delay window", async () => {
    const stale = await insertPayment({ status: "processing", processedAt: new Date(Date.now() - 10 * 60_000) })
    const recent = await insertPayment({ status: "processing", processedAt: new Date() })

    await __testables.autoCompletePayments(job({ batchSize: 500, delayMinutes: 5 }))

    expect((await fetchOne(stale.id)).status).toBe(PaymentStatus.COMPLETED)
    expect((await fetchOne(recent.id)).status).toBe(PaymentStatus.PROCESSING)
  })
})
