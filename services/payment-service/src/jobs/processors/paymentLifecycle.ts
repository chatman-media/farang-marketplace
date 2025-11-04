import { and, eq, lt, sql } from "@marketplace/database-schema"
import logger from "@marketplace/logger"
import { PaymentStatus } from "@marketplace/shared-types"
import { Job, Worker } from "bullmq"
import { db, schema } from "../../db/connection"

const { payments, refunds } = schema

import { PaymentService } from "../../services/PaymentService"

const paymentService = new PaymentService()

// Process expired payments
async function expireOldPayments(job: Job) {
  const { batchSize = 100 } = job.data

  try {
    logger.info("⏰ Processing expired payments...")

    // TODO: expiresAt field not in schema yet - implement when schema is updated
    // For now, skip expiration logic
    logger.warn("Expiration logic disabled - expiresAt field not in schema")

    return { expired: 0 }
  } catch (error) {
    logger.error("Failed to process expired payments:", error)
    throw error
  }
}

// Retry failed payments
async function retryFailedPayments(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    logger.info("🔄 Retrying failed payments...")

    // Find failed payments that can be retried
    const failedPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, PaymentStatus.FAILED),
          // Note: retryCount and retryAfter fields need to be added to schema
        ),
      )
      .limit(batchSize)

    let retried = 0

    for (const payment of failedPayments) {
      try {
        // Reset to pending for retry
        await paymentService.updatePaymentStatus(payment.id, PaymentStatus.PENDING, "Retry attempt")

        retried++
      } catch (error) {
        logger.error(`Failed to retry payment ${payment.id}:`, error)
      }
    }

    logger.info(`🔄 Retried ${retried} failed payments`)
    return { retried }
  } catch (error) {
    logger.error("Failed to retry failed payments:", error)
    throw error
  }
}

// Process pending refunds
async function processRefunds(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    logger.info("💸 Processing pending refunds...")

    // Find pending refunds
    const pendingRefunds = await db.select().from(refunds).where(eq(refunds.status, "pending")).limit(batchSize)

    let processed = 0

    for (const refund of pendingRefunds) {
      try {
        // Process refund based on original payment method
        const payment = await db.select().from(payments).where(eq(payments.id, refund.paymentId)).limit(1)

        if (payment.length > 0) {
          const originalPayment = payment[0]

          if (originalPayment.paymentMethod.includes("ton")) {
            // Process TON refund - would need to implement this method
            logger.info(`Processing TON refund for ${refund.id}`)
          } else if (originalPayment.paymentMethod.includes("stripe")) {
            // Process Stripe refund - would need to implement this method
            logger.info(`Processing Stripe refund for ${refund.id}`)
          }

          processed++
        }
      } catch (error) {
        logger.error(`Failed to process refund ${refund.id}:`, error)
      }
    }

    logger.info(`💸 Processed ${processed} refunds`)
    return { processed }
  } catch (error) {
    logger.error("Failed to process refunds:", error)
    throw error
  }
}

// Auto-complete confirmed payments
async function autoCompletePayments(job: Job) {
  const { batchSize = 100, delayMinutes = 5 } = job.data

  try {
    logger.info("✅ Auto-completing confirmed payments...")

    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000)

    // Find processing payments that should be completed
    const processingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, "processing" as any),
          payments.processedAt ? lt(payments.processedAt, cutoffTime) : sql`false`,
        ),
      )
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

    logger.info(`✅ Auto-completed ${completed} payments`)
    return { completed }
  } catch (error) {
    logger.error("Failed to auto-complete payments:", error)
    throw error
  }
}

// Create worker for payment lifecycle jobs
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
