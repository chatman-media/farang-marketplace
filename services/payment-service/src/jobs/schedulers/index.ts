import {
  tonMonitoringQueue,
  paymentLifecycleQueue,
  webhookQueue,
  reconciliationQueue,
  maintenanceQueue,
} from "../index"

// Schedule recurring jobs
export const scheduleJobs = () => {
  console.log("📅 Scheduling recurring jobs...")

  // TON Monitoring Jobs
  tonMonitoringQueue.add(
    "check-pending-transactions",
    { batchSize: 50 },
    {
      repeat: { cron: "*/30 * * * * *" }, // Every 30 seconds
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  )

  tonMonitoringQueue.add(
    "update-exchange-rates",
    {},
    {
      repeat: { cron: "0 */5 * * * *" }, // Every 5 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  tonMonitoringQueue.add(
    "sync-jetton-balances",
    { walletAddress: process.env.TON_WALLET_ADDRESS },
    {
      repeat: { cron: "0 */10 * * * *" }, // Every 10 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  tonMonitoringQueue.add(
    "health-check-ton-network",
    {},
    {
      repeat: { cron: "0 */5 * * * *" }, // Every 5 minutes
      removeOnComplete: 3,
      removeOnFail: 2,
    },
  )

  // Payment Lifecycle Jobs
  paymentLifecycleQueue.add(
    "expire-old-payments",
    { batchSize: 100 },
    {
      repeat: { cron: "0 0 * * * *" }, // Every hour
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  paymentLifecycleQueue.add(
    "retry-failed-payments",
    { batchSize: 50, maxRetries: 3 },
    {
      repeat: { cron: "0 */15 * * * *" }, // Every 15 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  paymentLifecycleQueue.add(
    "process-refunds",
    { batchSize: 50 },
    {
      repeat: { cron: "0 */5 * * * *" }, // Every 5 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  paymentLifecycleQueue.add(
    "auto-complete-payments",
    { batchSize: 100, delayMinutes: 5 },
    {
      repeat: { cron: "0 */2 * * * *" }, // Every 2 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  // Webhook Processing Jobs
  webhookQueue.add(
    "retry-failed-webhooks",
    { batchSize: 50, maxRetries: 5 },
    {
      repeat: { cron: "0 */10 * * * *" }, // Every 10 minutes
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  webhookQueue.add(
    "cleanup-old-webhooks",
    { olderThanDays: 30 },
    {
      repeat: { cron: "0 0 2 * * *" }, // Daily at 2 AM
      removeOnComplete: 3,
      removeOnFail: 2,
    },
  )

  // Reconciliation Jobs
  reconciliationQueue.add(
    "reconcile-stripe-payments",
    { hoursBack: 24 },
    {
      repeat: { cron: "0 0 */6 * * *" }, // Every 6 hours
      removeOnComplete: 3,
      removeOnFail: 2,
    },
  )

  reconciliationQueue.add(
    "reconcile-ton-transactions",
    { hoursBack: 2 },
    {
      repeat: { cron: "0 0 * * * *" }, // Every hour
      removeOnComplete: 5,
      removeOnFail: 3,
    },
  )

  reconciliationQueue.add(
    "generate-daily-reports",
    {},
    {
      repeat: { cron: "0 0 0 * * *" }, // Daily at midnight
      removeOnComplete: 7,
      removeOnFail: 3,
    },
  )

  reconciliationQueue.add(
    "generate-weekly-reports",
    {},
    {
      repeat: { cron: "0 0 0 * * 1" }, // Weekly on Monday
      removeOnComplete: 4,
      removeOnFail: 2,
    },
  )

  // Maintenance Jobs
  maintenanceQueue.add(
    "cleanup-expired-payments",
    { olderThanDays: 90 },
    {
      repeat: { cron: "0 0 3 * * *" }, // Daily at 3 AM
      removeOnComplete: 3,
      removeOnFail: 2,
    },
  )

  maintenanceQueue.add(
    "archive-old-transactions",
    { olderThanDays: 365 },
    {
      repeat: { cron: "0 0 4 * * 0" }, // Weekly on Sunday at 4 AM
      removeOnComplete: 2,
      removeOnFail: 1,
    },
  )

  maintenanceQueue.add(
    "health-check-external-services",
    {},
    {
      repeat: { cron: "0 */5 * * * *" }, // Every 5 minutes
      removeOnComplete: 3,
      removeOnFail: 2,
    },
  )

  console.log("✅ All recurring jobs scheduled")
}

// Initialize job scheduling
if (process.env.NODE_ENV !== "test") {
  scheduleJobs()
}
