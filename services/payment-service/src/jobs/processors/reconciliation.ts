import { and, gte, inArray, isNotNull } from "@marketplace/database-schema"
import logger from "@marketplace/logger"
import { PaymentStatus } from "@marketplace/shared-types"
import { Job, Worker } from "bullmq"
import { db, schema } from "../../db/connection"
import { ModernTonService } from "../../services/ModernTonService"
import { PaymentService } from "../../services/PaymentService"

const { payments } = schema

const tonService = new ModernTonService()
const paymentService = new PaymentService()

/**
 * Re-verify TON payments that are still pending/processing but already carry an
 * on-chain tx hash, and complete the ones confirmed on-chain. This is the safety
 * net for transactions that were submitted but whose confirmation webhook/poll
 * was missed.
 */
async function reconcileTonTransactions(job: Job) {
  const { hoursBack = 2, batchSize = 100 } = job.data
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

  try {
    logger.info("🔗 Reconciling TON transactions...")

    const candidates = await db
      .select()
      .from(payments)
      .where(
        and(
          inArray(payments.status, [PaymentStatus.PENDING, PaymentStatus.PROCESSING]),
          isNotNull(payments.blockchainTxHash),
          gte(payments.createdAt, since),
        ),
      )
      .limit(batchSize)

    let reconciled = 0
    for (const payment of candidates) {
      if (!payment.paymentMethod.includes("ton") && payment.provider !== "ton") {
        continue
      }
      try {
        const verified = await tonService.verifyTransaction(payment.blockchainTxHash as string)
        if (verified) {
          await paymentService.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, "Reconciled on-chain")
          reconciled++
        }
      } catch (error) {
        logger.error(`Failed to reconcile payment ${payment.id}:`, error)
      }
    }

    logger.info(`🔗 Reconciled ${reconciled} TON payment(s)`)
    return { reconciled }
  } catch (error) {
    logger.error("Failed to reconcile TON transactions:", error)
    throw error
  }
}

/** Create the worker that runs reconciliation jobs. */
export function createReconciliationWorker(redisConnection: any) {
  const worker = new Worker(
    "reconciliation",
    async (job: Job) => {
      switch (job.name) {
        case "reconcile-ton-transactions":
          return await reconcileTonTransactions(job)
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    },
    { connection: redisConnection },
  )

  logger.info("🔗 Reconciliation job processors loaded")
  return worker
}

export const __testables = { reconcileTonTransactions }
