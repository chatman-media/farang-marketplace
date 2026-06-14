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

  // Payment BullMQ — importing the module creates its Redis connection, queues,
  // workers (TON monitoring, payment lifecycle, reconciliation, maintenance) and
  // registers the recurring schedules.
  try {
    paymentJobs = (await import("@marketplace/payment-service/jobs")) as unknown as {
      shutdownJobs: () => Promise<void>
    }
    logger.info("⚙️  Payment BullMQ jobs started")
  } catch (error) {
    logger.error("Failed to start payment BullMQ jobs (continuing without them):", error)
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
  let stopping = false
  const shutdown = async (signal: string) => {
    if (stopping) return
    stopping = true
    logger.info(`${signal} received, stopping workers`)
    // Force-exit if graceful shutdown stalls (e.g. BullMQ timers keeping the
    // event loop alive after resources are released).
    const forceExit = setTimeout(() => process.exit(0), 5000)
    forceExit.unref?.()
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
