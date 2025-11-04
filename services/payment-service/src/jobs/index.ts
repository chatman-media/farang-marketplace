import logger from "@marketplace/logger"
import { Queue, QueueEvents } from "bullmq"
import { config } from "dotenv"
import { Redis } from "ioredis"

// Load environment variables
config()

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: Number.parseInt(process.env.REDIS_DB || "0", 10),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
}

// Create Redis connection
export const redis = new Redis(redisConfig)

// Job queues with modern BullMQ
export const tonMonitoringQueue = new Queue("ton-monitoring", { connection: redis })
export const paymentLifecycleQueue = new Queue("payment-lifecycle", { connection: redis })
export const webhookQueue = new Queue("webhook-processing", { connection: redis })
export const reconciliationQueue = new Queue("reconciliation", { connection: redis })
export const maintenanceQueue = new Queue("maintenance", { connection: redis })

// Queue events for monitoring
export const tonMonitoringEvents = new QueueEvents("ton-monitoring", { connection: redis })
export const paymentLifecycleEvents = new QueueEvents("payment-lifecycle", { connection: redis })
export const webhookEvents = new QueueEvents("webhook-processing", { connection: redis })
export const reconciliationEvents = new QueueEvents("reconciliation", { connection: redis })
export const maintenanceEvents = new QueueEvents("maintenance", { connection: redis })

// Initialize job processors after Redis connection is ready
import { createPaymentLifecycleWorker } from "./processors/paymentLifecycle"
import { createTonMonitoringWorker } from "./processors/tonMonitoring"
// TODO: Implement these processors
// import "./processors/webhookProcessing"
// import "./processors/reconciliation"
// import "./processors/maintenance"

// Create workers
export const tonMonitoringWorker = createTonMonitoringWorker(redis)
export const paymentLifecycleWorker = createPaymentLifecycleWorker(redis)

// Job schedulers
import "./schedulers/index"

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("🔄 Shutting down job queues and workers...")

  await Promise.all([
    tonMonitoringQueue.close(),
    paymentLifecycleQueue.close(),
    webhookQueue.close(),
    reconciliationQueue.close(),
    maintenanceQueue.close(),
    tonMonitoringWorker.close(),
    paymentLifecycleWorker.close(),
  ])

  await redis.quit()

  logger.info("✅ Job queues and workers shut down successfully")
}

process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)

export { gracefulShutdown as shutdownJobs }
