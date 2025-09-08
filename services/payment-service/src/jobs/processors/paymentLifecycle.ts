import { Worker, Job } from "bullmq"
import { redis } from "../index"
import { PaymentService } from "../../services/PaymentService"
import { db } from "../../db/connection"
import { payments, refunds } from "../../db/schema"
import { eq, and, lt, inArray } from "drizzle-orm"

const paymentService = new PaymentService()

// Process expired payments
async function expireOldPayments(job: Job) {
  const { batchSize = 100 } = job.data

  try {
    console.log("⏰ Processing expired payments...")

    const now = new Date()

    // Find payments that have expired
    const expiredPayments = await db
      .select()
      .from(payments)
      .where(and(lt(payments.expiresAt, now), inArray(payments.status, ["pending", "processing"])))
      .limit(batchSize)

    let expired = 0

    for (const payment of expiredPayments) {
      try {
        await paymentService.updatePaymentStatus(payment.id, "cancelled", "Payment expired")
        expired++
      } catch (error) {
        console.error(`Failed to expire payment ${payment.id}:`, error)
      }
    }

    console.log(`⏰ Expired ${expired} payments`)
    return { expired }
  } catch (error) {
    console.error("Failed to process expired payments:", error)
    throw error
  }
}

// Retry failed payments
async function retryFailedPayments(job: Job) {
  const { batchSize = 50, maxRetries = 3 } = job.data

  try {
    console.log("🔄 Retrying failed payments...")

    // Find failed payments that can be retried
    const failedPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, "failed"),
          // Note: retryCount and retryAfter fields need to be added to schema
        ),
      )
      .limit(batchSize)

    let retried = 0

    for (const payment of failedPayments) {
      try {
        // Reset to pending for retry
        await paymentService.updatePaymentStatus(payment.id, "pending", `Retry attempt`)

        retried++
      } catch (error) {
        console.error(`Failed to retry payment ${payment.id}:`, error)
      }
    }

    console.log(`🔄 Retried ${retried} failed payments`)
    return { retried }
  } catch (error) {
    console.error("Failed to retry failed payments:", error)
    throw error
  }
}

// Process pending refunds
async function processRefunds(job: Job) {
  const { batchSize = 50 } = job.data

  try {
    console.log("💸 Processing pending refunds...")

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
            console.log(`Processing TON refund for ${refund.id}`)
          } else if (originalPayment.paymentMethod.includes("stripe")) {
            // Process Stripe refund - would need to implement this method
            console.log(`Processing Stripe refund for ${refund.id}`)
          }

          processed++
        }
      } catch (error) {
        console.error(`Failed to process refund ${refund.id}:`, error)
      }
    }

    console.log(`💸 Processed ${processed} refunds`)
    return { processed }
  } catch (error) {
    console.error("Failed to process refunds:", error)
    throw error
  }
}

// Auto-complete confirmed payments
async function autoCompletePayments(job: Job) {
  const { batchSize = 100, delayMinutes = 5 } = job.data

  try {
    console.log("✅ Auto-completing confirmed payments...")

    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000)

    // Find confirmed payments that should be completed
    const confirmedPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.status, "confirmed"), lt(payments.confirmedAt, cutoffTime)))
      .limit(batchSize)

    let completed = 0

    for (const payment of confirmedPayments) {
      try {
        await paymentService.updatePaymentStatus(payment.id, "completed", "Auto-completed after confirmation delay")
        completed++
      } catch (error) {
        console.error(`Failed to complete payment ${payment.id}:`, error)
      }
    }

    console.log(`✅ Auto-completed ${completed} payments`)
    return { completed }
  } catch (error) {
    console.error("Failed to auto-complete payments:", error)
    throw error
  }
}

// Create worker for payment lifecycle jobs
const paymentLifecycleWorker = new Worker(
  "payment-lifecycle-v2",
  async (job: Job) => {
    const { type } = job.data

    switch (type) {
      case "expire-payments":
        return await expireOldPayments(job)
      case "retry-failed":
        return await retryFailedPayments(job)
      case "process-refunds":
        return await processRefunds(job)
      case "auto-complete":
        return await autoCompletePayments(job)
      default:
        throw new Error(`Unknown job type: ${type}`)
    }
  },
  { connection: redis },
)

console.log("🔄 Payment lifecycle job processors loaded")
