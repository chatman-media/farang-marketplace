import { and, eq, inArray, isNull, lt, lte, or } from "@marketplace/database-schema"
import logger from "@marketplace/logger"
import { PaymentStatus } from "@marketplace/shared-types"
import { Job, Worker } from "bullmq"
import { db, schema } from "../../db/connection"
import { PaymentService } from "../../services/PaymentService"
import { StripeService } from "../../services/StripeService"

const { payments, refunds } = schema

const paymentService = new PaymentService()
const stripeService = new StripeService()

// Cap exponential backoff at 60 minutes.
const MAX_BACKOFF_MS = 60 * 60 * 1000

/** Cancel payments that are still pending/processing past their expiry. */
async function expireOldPayments(job: Job) {
  const { batchSize = 100 } = job.data
  const now = new Date()

  try {
    logger.info("⏰ Processing expired payments...")

    // `lt(expiresAt, now)` excludes rows where expiresAt is NULL.
    const expired = await db
      .select()
      .from(payments)
      .where(
        and(inArray(payments.status, [PaymentStatus.PENDING, PaymentStatus.PROCESSING]), lt(payments.expiresAt, now)),
      )
      .limit(batchSize)

    let count = 0
    for (const payment of expired) {
      try {
        await paymentService.updatePaymentStatus(payment.id, PaymentStatus.CANCELLED, "Payment expired")
        count++
      } catch (error) {
        logger.error(`Failed to expire payment ${payment.id}:`, error)
      }
    }

    logger.info(`⏰ Expired ${count} payment(s)`)
    return { expired: count }
  } catch (error) {
    logger.error("Failed to process expired payments:", error)
    throw error
  }
}

/** Re-queue failed payments that still have retry budget and are due for a retry. */
async function retryFailedPayments(job: Job) {
  const { batchSize = 50, maxRetries = 3 } = job.data
  const now = new Date()

  try {
    logger.info("🔄 Retrying failed payments...")

    const failedPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, PaymentStatus.FAILED),
          lt(payments.retryCount, maxRetries),
          // Due for retry: never scheduled, or the scheduled time has passed.
          or(isNull(payments.nextRetryAt), lte(payments.nextRetryAt, now)),
        ),
      )
      .limit(batchSize)

    let retried = 0
    for (const payment of failedPayments) {
      try {
        const nextRetryCount = (payment.retryCount ?? 0) + 1
        const backoffMs = Math.min(2 ** nextRetryCount * 60 * 1000, MAX_BACKOFF_MS)

        await db
          .update(payments)
          .set({
            status: PaymentStatus.PENDING,
            retryCount: nextRetryCount,
            nextRetryAt: new Date(now.getTime() + backoffMs),
            updatedAt: now,
          })
          .where(eq(payments.id, payment.id))

        retried++
      } catch (error) {
        logger.error(`Failed to retry payment ${payment.id}:`, error)
      }
    }

    logger.info(`🔄 Retried ${retried} failed payment(s)`)
    return { retried }
  } catch (error) {
    logger.error("Failed to retry failed payments:", error)
    throw error
  }
}

/** Process pending refunds through their payment gateway and advance their state. */
async function processRefunds(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    logger.info("💸 Processing pending refunds...")

    const pendingRefunds = await db.select().from(refunds).where(eq(refunds.status, "pending")).limit(batchSize)

    let processed = 0
    for (const refund of pendingRefunds) {
      // Claim the refund so a concurrent run won't pick it up.
      await db.update(refunds).set({ status: "processing", updatedAt: new Date() }).where(eq(refunds.id, refund.id))

      try {
        const paymentRows = await db.select().from(payments).where(eq(payments.id, refund.paymentId)).limit(1)
        const payment = paymentRows[0]
        if (!payment) {
          throw new Error(`Refund ${refund.id} references a missing payment`)
        }

        if (payment.paymentMethod.includes("stripe")) {
          if (!payment.providerPaymentId) {
            throw new Error(`Stripe payment ${payment.id} has no provider payment id`)
          }
          // Stripe expects the amount in the minor currency unit (e.g. satang).
          const amountMinor = Math.round(Number.parseFloat(refund.amount) * 100)
          const stripeRefund = await stripeService.createRefund({
            paymentIntentId: payment.providerPaymentId,
            amount: amountMinor,
            reason: "requested_by_customer",
          })

          await db
            .update(refunds)
            .set({
              status: "completed",
              providerRefundId: stripeRefund.id,
              processedAt: new Date(),
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(refunds.id, refund.id))
          await db
            .update(payments)
            .set({ status: PaymentStatus.REFUNDED, updatedAt: new Date() })
            .where(eq(payments.id, payment.id))
          processed++
        } else {
          // TON / PromptPay refunds are handled manually for now — leave pending.
          logger.warn(`Refund ${refund.id} (${payment.paymentMethod}) needs manual processing — leaving pending`)
          await db.update(refunds).set({ status: "pending", updatedAt: new Date() }).where(eq(refunds.id, refund.id))
        }
      } catch (error) {
        logger.error(`Failed to process refund ${refund.id}:`, error)
        // Revert the claim so it can be retried next run.
        await db.update(refunds).set({ status: "pending", updatedAt: new Date() }).where(eq(refunds.id, refund.id))
      }
    }

    logger.info(`💸 Processed ${processed} refund(s)`)
    return { processed }
  } catch (error) {
    logger.error("Failed to process refunds:", error)
    throw error
  }
}

/** Complete payments that have been in `processing` longer than the delay window. */
async function autoCompletePayments(job: Job) {
  const { batchSize = 100, delayMinutes = 5 } = job.data

  try {
    logger.info("✅ Auto-completing confirmed payments...")

    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000)

    const processingPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.status, PaymentStatus.PROCESSING), lt(payments.processedAt, cutoffTime)))
      .limit(batchSize)

    let completed = 0
    for (const payment of processingPayments) {
      try {
        await paymentService.updatePaymentStatus(
          payment.id,
          PaymentStatus.COMPLETED,
          "Auto-completed after processing delay",
        )
        completed++
      } catch (error) {
        logger.error(`Failed to complete payment ${payment.id}:`, error)
      }
    }

    logger.info(`✅ Auto-completed ${completed} payment(s)`)
    return { completed }
  } catch (error) {
    logger.error("Failed to auto-complete payments:", error)
    throw error
  }
}

/** Create the worker that runs payment-lifecycle jobs. */
export function createPaymentLifecycleWorker(redisConnection: any) {
  const worker = new Worker(
    "payment-lifecycle",
    async (job: Job) => {
      switch (job.name) {
        case "expire-old-payments":
          return await expireOldPayments(job)
        case "retry-failed-payments":
          return await retryFailedPayments(job)
        case "process-refunds":
          return await processRefunds(job)
        case "auto-complete-payments":
          return await autoCompletePayments(job)
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    },
    { connection: redisConnection },
  )

  logger.info("🔄 Payment lifecycle job processors loaded")
  return worker
}

// Exported for unit testing.
export const __testables = { expireOldPayments, retryFailedPayments, processRefunds, autoCompletePayments }
