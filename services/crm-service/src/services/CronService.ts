import logger from "@marketplace/logger"
import { query } from "../db/connection"
import { SegmentationService } from "./SegmentationService"

export interface CronJob {
  id: string
  name: string
  schedule: string // cron expression
  handler: () => Promise<void>
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
}

export interface CampaignMetrics {
  campaignId: string
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  totalUnsubscribed: number
  conversionRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
  updatedAt: Date
}

export class CronService {
  private jobs: Map<string, CronJob> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  constructor() {
    this.setupDefaultJobs()
  }

  // Start the cron service
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info("CronService is already running")
      return
    }

    this.isRunning = true
    logger.info("🚀 Starting CronService...")

    // Start all active jobs
    for (const [jobId, job] of this.jobs) {
      if (job.isActive) {
        await this.startJob(jobId)
      }
    }

    logger.info(`✅ CronService started with ${this.jobs.size} jobs`)
  }

  // Stop the cron service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.info("CronService is not running")
      return
    }

    this.isRunning = false
    logger.info("🛑 Stopping CronService...")

    // Stop all running intervals
    for (const [jobId, interval] of this.intervals) {
      clearInterval(interval)
      this.intervals.delete(jobId)
    }

    logger.info("✅ CronService stopped")
  }

  // Add a new cron job
  addJob(job: CronJob): void {
    this.jobs.set(job.id, job)
    logger.info(`📝 Added cron job: ${job.name}`)

    if (this.isRunning && job.isActive) {
      this.startJob(job.id)
    }
  }

  // Remove a cron job
  removeJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    // Stop the job if it's running
    const interval = this.intervals.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(jobId)
    }

    this.jobs.delete(jobId)
    logger.info(`🗑️ Removed cron job: ${job.name}`)
  }

  // Start a specific job
  private async startJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || !job.isActive) return

    // Parse cron schedule to milliseconds (simplified)
    const intervalMs = this.parseScheduleToMs(job.schedule)

    // Run immediately if it's the first time
    if (!job.lastRun) {
      await this.executeJob(job)
    }

    // Set up recurring execution
    const interval = setInterval(async () => {
      await this.executeJob(job)
    }, intervalMs)

    this.intervals.set(jobId, interval)
    logger.info(`⏰ Started cron job: ${job.name} (every ${intervalMs}ms)`)
  }

  // Execute a job
  private async executeJob(job: CronJob): Promise<void> {
    try {
      logger.info(`🔄 Executing job: ${job.name}`)

      const startTime = Date.now()
      await job.handler()
      const duration = Date.now() - startTime

      // Update job metadata
      job.lastRun = new Date()
      job.nextRun = new Date(Date.now() + this.parseScheduleToMs(job.schedule))

      logger.info(`✅ Job completed: ${job.name} (${duration}ms)`)
    } catch (error) {
      logger.error(`❌ Job failed: ${job.name}`, error)
    }
  }

  // Parse cron schedule to milliseconds (simplified implementation)
  private parseScheduleToMs(schedule: string): number {
    // Simplified cron parser - supports basic patterns
    switch (schedule) {
      case "*/5 * * * *": // Every 5 minutes
        return 5 * 60 * 1000
      case "0 * * * *": // Every hour
        return 60 * 60 * 1000
      case "0 0 * * *": // Every day at midnight
        return 24 * 60 * 60 * 1000
      case "0 0 * * 0": // Every week (Sunday)
        return 7 * 24 * 60 * 60 * 1000
      case "0 0 1 * *": // Every month (1st day)
        return 30 * 24 * 60 * 60 * 1000
      case "0 */6 * * *": // Every 6 hours
        return 6 * 60 * 60 * 1000
      default:
        // Default to 1 hour for unknown patterns
        logger.warn(`Unknown cron schedule: ${schedule}, defaulting to 1 hour`)
        return 60 * 60 * 1000
    }
  }

  // Setup default cron jobs
  private setupDefaultJobs(): void {
    // Campaign metrics calculation job
    this.addJob({
      id: "campaign-metrics",
      name: "Campaign Metrics Calculation",
      schedule: "0 * * * *", // Every hour
      handler: this.calculateCampaignMetrics.bind(this),
      isActive: true,
    })

    // Customer metrics update job
    this.addJob({
      id: "customer-metrics",
      name: "Customer Metrics Update",
      schedule: "*/5 * * * *", // Every 5 minutes
      handler: this.updateCustomerMetrics.bind(this),
      isActive: true,
    })

    // Lead follow-up automation
    this.addJob({
      id: "lead-followup",
      name: "Lead Follow-up Automation",
      schedule: "0 0 * * *", // Every day at midnight
      handler: this.triggerLeadFollowups.bind(this),
      isActive: true,
    })

    // Data cleanup job
    this.addJob({
      id: "data-cleanup",
      name: "Data Cleanup",
      schedule: "0 0 * * 0", // Every week (Sunday)
      handler: this.cleanupOldData.bind(this),
      isActive: true,
    })

    // Segment membership recalculation
    this.addJob({
      id: "segment-recalculation",
      name: "Segment Membership Recalculation",
      schedule: "0 */6 * * *", // Every 6 hours
      handler: this.recalculateSegmentMemberships.bind(this),
      isActive: true,
    })
  }

  // Calculate campaign metrics
  private async calculateCampaignMetrics(): Promise<void> {
    try {
      // Get all active campaigns
      const campaignsResult = await query(`
        SELECT id, name, created_at 
        FROM campaigns 
        WHERE is_active = true
      `)

      for (const campaign of campaignsResult.rows) {
        const metrics = await this.getCampaignMetrics(campaign.id)
        await this.saveCampaignMetrics(campaign.id, metrics)
      }

      logger.info(`📊 Updated metrics for ${campaignsResult.rows.length} campaigns`)
    } catch (error) {
      logger.error("Failed to calculate campaign metrics:", error)
    }
  }

  // Get campaign metrics from database
  private async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    // Get communication stats for this campaign
    const statsResult = await query(
      `
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered,
        COUNT(CASE WHEN status = 'opened' THEN 1 END) as total_opened,
        COUNT(CASE WHEN status = 'clicked' THEN 1 END) as total_clicked,
        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as total_bounced,
        COUNT(CASE WHEN status = 'unsubscribed' THEN 1 END) as total_unsubscribed
      FROM communications 
      WHERE campaign_id = $1
    `,
      [campaignId],
    )

    const stats = statsResult.rows[0]
    const totalSent = Number.parseInt(stats.total_sent, 10) || 0
    const totalDelivered = Number.parseInt(stats.total_delivered, 10) || 0
    const totalOpened = Number.parseInt(stats.total_opened, 10) || 0
    const totalClicked = Number.parseInt(stats.total_clicked, 10) || 0
    const totalBounced = Number.parseInt(stats.total_bounced, 10) || 0
    const totalUnsubscribed = Number.parseInt(stats.total_unsubscribed, 10) || 0

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0

    // Calculate conversion rate (simplified - based on clicks)
    const conversionRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0

    return {
      campaignId,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
      conversionRate,
      openRate,
      clickRate,
      bounceRate,
      unsubscribeRate,
      updatedAt: new Date(),
    }
  }

  // Save campaign metrics to database
  private async saveCampaignMetrics(campaignId: string, metrics: CampaignMetrics): Promise<void> {
    await query(
      `
      UPDATE campaigns 
      SET 
        total_sent = $2,
        total_delivered = $3,
        total_opened = $4,
        total_clicked = $5,
        total_bounced = $6,
        total_unsubscribed = $7,
        conversion_rate = $8,
        open_rate = $9,
        click_rate = $10,
        bounce_rate = $11,
        unsubscribe_rate = $12,
        metrics_updated_at = $13
      WHERE id = $1
    `,
      [
        campaignId,
        metrics.totalSent,
        metrics.totalDelivered,
        metrics.totalOpened,
        metrics.totalClicked,
        metrics.totalBounced,
        metrics.totalUnsubscribed,
        metrics.conversionRate,
        metrics.openRate,
        metrics.clickRate,
        metrics.bounceRate,
        metrics.unsubscribeRate,
        metrics.updatedAt,
      ],
    )
  }

  // Update customer metrics
  private async updateCustomerMetrics(): Promise<void> {
    try {
      // Update total interactions for all customers
      await query(`
        UPDATE customers 
        SET total_interactions = (
          SELECT COUNT(*) 
          FROM communications 
          WHERE customer_id = customers.id
        ),
        last_interaction_at = (
          SELECT MAX(created_at) 
          FROM communications 
          WHERE customer_id = customers.id
        )
        WHERE id IN (
          SELECT DISTINCT customer_id 
          FROM communications 
          WHERE created_at > NOW() - INTERVAL '5 minutes'
        )
      `)

      logger.info("📈 Updated customer metrics")
    } catch (error) {
      logger.error("Failed to update customer metrics:", error)
    }
  }

  // Trigger lead follow-up automations
  private async triggerLeadFollowups(): Promise<void> {
    try {
      // Find leads that need follow-up (no contact in 3+ days)
      const leadsResult = await query(`
        SELECT l.id, l.customer_id, l.status, l.created_at,
               c.last_interaction_at
        FROM leads l
        JOIN customers c ON l.customer_id = c.id
        WHERE l.status IN ('new', 'contacted', 'qualified')
          AND (c.last_interaction_at IS NULL 
               OR c.last_interaction_at < NOW() - INTERVAL '3 days')
          AND l.created_at > NOW() - INTERVAL '30 days'
      `)

      // Import AutomationService dynamically to avoid circular dependency
      const { AutomationService } = await import("./AutomationService")
      const automationService = new AutomationService()

      for (const lead of leadsResult.rows) {
        await automationService.triggerWorkflow("lead_follow_up", {
          leadId: lead.id,
          customerId: lead.customer_id,
          trigger: "scheduled_followup",
        })
      }

      logger.info(`🎯 Triggered follow-ups for ${leadsResult.rows.length} leads`)
    } catch (error) {
      logger.error("Failed to trigger lead follow-ups:", error)
    }
  }

  // Cleanup old data
  private async cleanupOldData(): Promise<void> {
    try {
      // Delete old communications (older than 1 year)
      const oldCommsResult = await query(`
        DELETE FROM communications 
        WHERE created_at < NOW() - INTERVAL '1 year'
      `)

      // Delete old automation executions (older than 3 months)
      const oldExecutionsResult = await query(`
        DELETE FROM automation_executions 
        WHERE created_at < NOW() - INTERVAL '3 months'
      `)

      logger.info(
        `🧹 Cleaned up ${oldCommsResult.rowCount} old communications and ${oldExecutionsResult.rowCount} old executions`,
      )
    } catch (error) {
      logger.error("Failed to cleanup old data:", error)
    }
  }

  // Get job status
  getJobStatus(jobId: string): CronJob | undefined {
    return this.jobs.get(jobId)
  }

  // Get all jobs
  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values())
  }

  // Enable/disable a job
  setJobActive(jobId: string, isActive: boolean): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.isActive = isActive

    if (this.isRunning) {
      if (isActive) {
        this.startJob(jobId)
      } else {
        const interval = this.intervals.get(jobId)
        if (interval) {
          clearInterval(interval)
          this.intervals.delete(jobId)
        }
      }
    }

    logger.info(`${isActive ? "✅ Enabled" : "❌ Disabled"} job: ${job.name}`)
  }

  // Recalculate segment memberships
  private async recalculateSegmentMemberships(): Promise<void> {
    try {
      const segmentationService = new SegmentationService()
      await segmentationService.recalculateAllSegmentMemberships()

      logger.info("🎯 Recalculated all segment memberships")
    } catch (error) {
      logger.error("❌ Failed to recalculate segment memberships:", error)
      throw error
    }
  }
}
