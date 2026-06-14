import logger from "@marketplace/logger"
import { createMaintenanceWorker } from "./processors/maintenance"
import { createPaymentLifecycleWorker } from "./processors/paymentLifecycle"
import { createReconciliationWorker } from "./processors/reconciliation"
import { createTonMonitoringWorker } from "./processors/tonMonitoring"
import { allQueueEvents, allQueues, redis } from "./queues"
import { scheduleJobs } from "./schedulers"

// Re-export queues/connection for consumers (e.g. routes) that need them.
export * from "./queues"

// Create workers — one per queue. They start consuming immediately.
export const tonMonitoringWorker = createTonMonitoringWorker(redis)
export const paymentLifecycleWorker = createPaymentLifecycleWorker(redis)
export const reconciliationWorker = createReconciliationWorker(redis)
export const maintenanceWorker = createMaintenanceWorker(redis)

const workers = [tonMonitoringWorker, paymentLifecycleWorker, reconciliationWorker, maintenanceWorker]

// Register the recurring schedules (no-op in tests).
if (process.env.NODE_ENV !== "test") {
  scheduleJobs().catch((error) => logger.error("Failed to schedule recurring jobs:", error))
}

// Graceful shutdown — closes workers, then queues, then the Redis connection.
// Idempotent: the owner of the process (the worker entrypoint) calls this; the
// guard makes a second call (e.g. from a signal handler) a no-op rather than a
// "Connection is closed" error.
let shuttingDown = false
const gracefulShutdown = async () => {
  if (shuttingDown) return
  shuttingDown = true

  logger.info("🔄 Shutting down job queues and workers...")

  await Promise.all(workers.map((w) => w.close()))
  await Promise.all(allQueueEvents.map((e) => e.close()))
  await Promise.all(allQueues.map((q) => q.close()))
  await redis.quit()

  logger.info("✅ Job queues and workers shut down successfully")
}

export { gracefulShutdown as shutdownJobs }
