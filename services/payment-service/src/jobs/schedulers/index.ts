import logger from "@marketplace/logger"
import { maintenanceQueue, paymentLifecycleQueue, reconciliationQueue, tonMonitoringQueue } from "../queues"

/**
 * Registers all recurring jobs. Imports queues from `../queues` (not `../index`)
 * to avoid an import cycle, and is invoked explicitly from `../index` after the
 * workers are created — it is not a top-level side effect.
 *
 * BullMQ dedupes repeatable jobs by their repeat key, so calling this more than
 * once is safe (no duplicate schedules).
 */
export const scheduleJobs = async (): Promise<void> => {
  logger.info("📅 Scheduling recurring jobs...")

  // --- TON monitoring ---
  await tonMonitoringQueue.add(
    "check-pending-transactions",
    { batchSize: 50 },
    { repeat: { pattern: "*/30 * * * * *" }, removeOnComplete: 10, removeOnFail: 5 },
  )
  await tonMonitoringQueue.add(
    "update-exchange-rates",
    {},
    { repeat: { pattern: "0 */5 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )
  await tonMonitoringQueue.add(
    "sync-jetton-balances",
    { walletAddress: process.env.TON_WALLET_ADDRESS },
    { repeat: { pattern: "0 */10 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )
  await tonMonitoringQueue.add(
    "health-check-ton-network",
    {},
    { repeat: { pattern: "0 */5 * * * *" }, removeOnComplete: 3, removeOnFail: 2 },
  )

  // --- Payment lifecycle ---
  await paymentLifecycleQueue.add(
    "expire-old-payments",
    { batchSize: 100 },
    { repeat: { pattern: "0 0 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )
  await paymentLifecycleQueue.add(
    "retry-failed-payments",
    { batchSize: 50, maxRetries: 3 },
    { repeat: { pattern: "0 */15 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )
  await paymentLifecycleQueue.add(
    "process-refunds",
    { batchSize: 50 },
    { repeat: { pattern: "0 */5 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )
  await paymentLifecycleQueue.add(
    "auto-complete-payments",
    { batchSize: 100, delayMinutes: 5 },
    { repeat: { pattern: "0 */2 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )

  // --- Reconciliation ---
  await reconciliationQueue.add(
    "reconcile-ton-transactions",
    { hoursBack: 2, batchSize: 100 },
    { repeat: { pattern: "0 0 * * * *" }, removeOnComplete: 5, removeOnFail: 3 },
  )

  // --- Maintenance ---
  await maintenanceQueue.add(
    "cleanup-old-jobs",
    { gracePeriodMs: 7 * 24 * 60 * 60 * 1000, limit: 1000 },
    { repeat: { pattern: "0 0 3 * * *" }, removeOnComplete: 3, removeOnFail: 2 },
  )
  await maintenanceQueue.add(
    "health-check-external-services",
    {},
    { repeat: { pattern: "0 */5 * * * *" }, removeOnComplete: 3, removeOnFail: 2 },
  )

  logger.info("✅ All recurring jobs scheduled")
}
