import logger from "@marketplace/logger"
import { Job, Worker } from "bullmq"
import { ModernTonService } from "../../services/ModernTonService"
import { allQueues } from "../queues"

const tonService = new ModernTonService()

/** Remove completed/failed BullMQ jobs older than the grace period from every queue. */
async function cleanupOldJobs(job: Job) {
  const { gracePeriodMs = 7 * 24 * 60 * 60 * 1000, limit = 1000 } = job.data

  try {
    logger.info("🧹 Cleaning up old jobs...")

    let removed = 0
    for (const queue of allQueues) {
      const completed = await queue.clean(gracePeriodMs, limit, "completed")
      const failed = await queue.clean(gracePeriodMs, limit, "failed")
      removed += completed.length + failed.length
    }

    logger.info(`🧹 Cleaned up ${removed} old job(s)`)
    return { removed }
  } catch (error) {
    logger.error("Failed to clean up old jobs:", error)
    throw error
  }
}

/** Probe external payment dependencies so degraded ones surface in logs/metrics. */
async function healthCheckExternalServices(_job: Job) {
  try {
    const tonHealthy = await tonService.isNetworkHealthy().catch(() => false)
    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY)

    const status = { ton: tonHealthy, stripe: stripeConfigured, checkedAt: new Date().toISOString() }
    logger.info("🩺 External service health:", status)
    return status
  } catch (error) {
    logger.error("Failed external-service health check:", error)
    throw error
  }
}

/** Create the worker that runs maintenance jobs. */
export function createMaintenanceWorker(redisConnection: any) {
  const worker = new Worker(
    "maintenance",
    async (job: Job) => {
      switch (job.name) {
        case "cleanup-old-jobs":
          return await cleanupOldJobs(job)
        case "health-check-external-services":
          return await healthCheckExternalServices(job)
        default:
          throw new Error(`Unknown job name: ${job.name}`)
      }
    },
    { connection: redisConnection },
  )

  logger.info("🧹 Maintenance job processors loaded")
  return worker
}

export const __testables = { cleanupOldJobs, healthCheckExternalServices }
