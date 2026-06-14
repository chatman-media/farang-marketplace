import { Queue, QueueEvents } from "bullmq"
import { config } from "dotenv"
import { Redis } from "ioredis"

// Load environment variables
config()

// Redis connection configuration.
// NOTE: BullMQ requires `maxRetriesPerRequest: null` for its blocking workers.
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: Number.parseInt(process.env.REDIS_DB || "0", 10),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

// Single shared Redis connection for all queues/workers.
export const redis = new Redis(redisConfig)

// Job queues. This module is the single source of truth for queue instances —
// processors, schedulers and the jobs entrypoint all import from here, so there
// is no import cycle back through `index.ts`.
export const tonMonitoringQueue = new Queue("ton-monitoring", { connection: redis })
export const paymentLifecycleQueue = new Queue("payment-lifecycle", { connection: redis })
export const reconciliationQueue = new Queue("reconciliation", { connection: redis })
export const maintenanceQueue = new Queue("maintenance", { connection: redis })

// Queue events for monitoring.
export const tonMonitoringEvents = new QueueEvents("ton-monitoring", { connection: redis })
export const paymentLifecycleEvents = new QueueEvents("payment-lifecycle", { connection: redis })
export const reconciliationEvents = new QueueEvents("reconciliation", { connection: redis })
export const maintenanceEvents = new QueueEvents("maintenance", { connection: redis })

export const allQueues = [tonMonitoringQueue, paymentLifecycleQueue, reconciliationQueue, maintenanceQueue]
export const allQueueEvents = [tonMonitoringEvents, paymentLifecycleEvents, reconciliationEvents, maintenanceEvents]
