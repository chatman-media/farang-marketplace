import logger from "@marketplace/logger"
import { env } from "./env"

/**
 * Background-worker entrypoint (separate process from the HTTP server).
 *
 * Owns the BullMQ payment jobs and the CRM cron service so they can be scaled
 * and restarted independently of the web tier. The HTTP server (`server.ts`)
 * does NOT import these — only this process (or `RUN_WORKERS_INLINE=1`) starts
 * them, so the web tier never opens Redis worker connections or runs timers.
 */

// Holds the loaded payment jobs module so we can shut its queues/workers down.
let paymentJobs: { shutdownJobs: () => Promise<void> } | undefined
// Holds the CRM cron service instance.
let cron: { stop: () => Promise<void> } | undefined

export async function startWorkers(): Promise<void> {
  if (env.NODE_ENV === "test") {
    return
  }

  // Each subsystem is isolated so a failure in one doesn't take down the other.

  // CRM cron (setInterval-based background jobs).
  try {
    const { CronService } = await import("@marketplace/crm-service/cron")
    const cronService = new CronService()
    await cronService.start()
    cron = cronService
    logger.info("⏰ CRM cron service started")
  } catch (error) {
    logger.error("Failed to start CRM cron service:", error)
  }

  // Payment BullMQ — off by default. The payment job system has pre-existing
  // bugs (circular imports between queues/processors/schedulers cause a TDZ
  // error, and several processors are still stubbed). Enable only after those
  // are fixed by setting ENABLE_PAYMENT_JOBS=1.
  if (process.env.ENABLE_PAYMENT_JOBS === "1") {
    try {
      paymentJobs = (await import("@marketplace/payment-service/jobs")) as unknown as {
        shutdownJobs: () => Promise<void>
      }
      logger.info("⚙️  Payment BullMQ jobs started")
    } catch (error) {
      logger.error("Failed to start payment BullMQ jobs (continuing without them):", error)
    }
  } else {
    logger.info("⏭️  Payment BullMQ jobs disabled (set ENABLE_PAYMENT_JOBS=1 to enable)")
  }
}

export async function stopWorkers(): Promise<void> {
  try {
    if (cron) await cron.stop()
    if (paymentJobs?.shutdownJobs) await paymentJobs.shutdownJobs()
  } catch (error) {
    logger.error("Error stopping workers:", error)
  }
}

// When run directly as the worker process.
async function main(): Promise<void> {
  await startWorkers()
  logger.info("🛠️  Worker process ready")
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, stopping workers`)
    await stopWorkers()
    process.exit(0)
  }
  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error("Worker failed to start:", error)
    process.exit(1)
  })
}
