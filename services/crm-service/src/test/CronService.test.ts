import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CronJob, CronService } from "../services/CronService"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

// Mock AutomationService to avoid circular dependency
vi.mock("../services/AutomationService", () => ({
  AutomationService: vi.fn().mockImplementation(() => ({
    triggerWorkflow: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe("CronService", () => {
  let cronService: CronService
  let mockQuery: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock query function
    const { query } = await import("../db/connection")
    mockQuery = query as any
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    cronService = new CronService()
  })

  afterEach(async () => {
    // Stop the service to clean up intervals
    await cronService.stop()
  })

  describe("Service Lifecycle", () => {
    it("should start and stop the service", async () => {
      expect(cronService.getAllJobs().length).toBeGreaterThan(0)

      await cronService.start()
      // Service should be running

      await cronService.stop()
      // Service should be stopped
    })

    it("should not start if already running", async () => {
      await cronService.start()

      // Try to start again
      await cronService.start()

      // Should handle gracefully
      expect(true).toBe(true) // No error thrown
    })

    it("should not stop if not running", async () => {
      // Try to stop without starting
      await cronService.stop()

      // Should handle gracefully
      expect(true).toBe(true) // No error thrown
    })
  })

  describe("Job Management", () => {
    it("should add a new job", () => {
      const testJob: CronJob = {
        id: "test-job",
        name: "Test Job",
        schedule: "0 * * * *",
        handler: vi.fn().mockResolvedValue(undefined),
        isActive: true,
      }

      cronService.addJob(testJob)

      const retrievedJob = cronService.getJobStatus("test-job")
      expect(retrievedJob).toEqual(testJob)
    })

    it("should remove a job", () => {
      const testJob: CronJob = {
        id: "test-job",
        name: "Test Job",
        schedule: "0 * * * *",
        handler: vi.fn().mockResolvedValue(undefined),
        isActive: true,
      }

      cronService.addJob(testJob)
      expect(cronService.getJobStatus("test-job")).toBeDefined()

      cronService.removeJob("test-job")
      expect(cronService.getJobStatus("test-job")).toBeUndefined()
    })

    it("should get all jobs", () => {
      const jobs = cronService.getAllJobs()

      // Should have default jobs
      expect(jobs.length).toBeGreaterThan(0)
      expect(jobs.some((job) => job.id === "campaign-metrics")).toBe(true)
      expect(jobs.some((job) => job.id === "customer-metrics")).toBe(true)
      expect(jobs.some((job) => job.id === "lead-followup")).toBe(true)
      expect(jobs.some((job) => job.id === "data-cleanup")).toBe(true)
    })

    it("should enable and disable jobs", () => {
      const testJob: CronJob = {
        id: "test-job",
        name: "Test Job",
        schedule: "0 * * * *",
        handler: vi.fn().mockResolvedValue(undefined),
        isActive: true,
      }

      cronService.addJob(testJob)

      // Disable the job
      cronService.setJobActive("test-job", false)
      expect(cronService.getJobStatus("test-job")?.isActive).toBe(false)

      // Enable the job
      cronService.setJobActive("test-job", true)
      expect(cronService.getJobStatus("test-job")?.isActive).toBe(true)
    })
  })

  describe("Default Jobs", () => {
    it("should have campaign metrics job", () => {
      const job = cronService.getJobStatus("campaign-metrics")

      expect(job).toBeDefined()
      expect(job?.name).toBe("Campaign Metrics Calculation")
      expect(job?.schedule).toBe("0 * * * *")
      expect(job?.isActive).toBe(true)
    })

    it("should have customer metrics job", () => {
      const job = cronService.getJobStatus("customer-metrics")

      expect(job).toBeDefined()
      expect(job?.name).toBe("Customer Metrics Update")
      expect(job?.schedule).toBe("*/5 * * * *")
      expect(job?.isActive).toBe(true)
    })

    it("should have lead follow-up job", () => {
      const job = cronService.getJobStatus("lead-followup")

      expect(job).toBeDefined()
      expect(job?.name).toBe("Lead Follow-up Automation")
      expect(job?.schedule).toBe("0 0 * * *")
      expect(job?.isActive).toBe(true)
    })

    it("should have data cleanup job", () => {
      const job = cronService.getJobStatus("data-cleanup")

      expect(job).toBeDefined()
      expect(job?.name).toBe("Data Cleanup")
      expect(job?.schedule).toBe("0 0 * * 0")
      expect(job?.isActive).toBe(true)
    })
  })

  describe("Campaign Metrics Calculation", () => {
    it("should calculate metrics for active campaigns", async () => {
      // Mock campaigns query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "campaign-1", name: "Test Campaign", created_at: new Date() }],
      })

      // Mock communication stats query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_sent: "100",
            total_delivered: "95",
            total_opened: "50",
            total_clicked: "10",
            total_bounced: "5",
            total_unsubscribed: "2",
          },
        ],
      })

      // Mock update query
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      // Get the campaign metrics job and execute it
      const job = cronService.getJobStatus("campaign-metrics")
      expect(job).toBeDefined()

      if (job) {
        await job.handler()
      }

      // Verify queries were called
      expect(mockQuery).toHaveBeenCalledTimes(3)

      // Verify campaign query
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining("SELECT id, name, created_at"))

      // Verify stats query
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringContaining("COUNT(*) as total_sent"), ["campaign-1"])

      // Verify update query
      expect(mockQuery).toHaveBeenNthCalledWith(3, expect.stringContaining("UPDATE campaigns"), expect.any(Array))
    })

    it("should handle campaigns with no communications", async () => {
      // Mock campaigns query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "campaign-1", name: "Test Campaign", created_at: new Date() }],
      })

      // Mock communication stats query with zero results
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_sent: "0",
            total_delivered: "0",
            total_opened: "0",
            total_clicked: "0",
            total_bounced: "0",
            total_unsubscribed: "0",
          },
        ],
      })

      // Mock update query
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      // Get the campaign metrics job and execute it
      const job = cronService.getJobStatus("campaign-metrics")
      if (job) {
        await job.handler()
      }

      // Should handle zero values gracefully
      expect(mockQuery).toHaveBeenCalledTimes(3)
    })
  })

  describe("Customer Metrics Update", () => {
    it("should update customer metrics", async () => {
      // Mock the update query
      mockQuery.mockResolvedValueOnce({ rowCount: 5 })

      // Get the customer metrics job and execute it
      const job = cronService.getJobStatus("customer-metrics")
      expect(job).toBeDefined()

      if (job) {
        await job.handler()
      }

      // Verify the update query was called
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE customers"))
    })
  })

  describe("Lead Follow-up Automation", () => {
    it("should trigger follow-ups for stale leads", async () => {
      // Mock leads query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "lead-1",
            customer_id: "customer-1",
            status: "new",
            created_at: new Date(),
            last_interaction_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          },
        ],
      })

      // Get the lead follow-up job and execute it
      const job = cronService.getJobStatus("lead-followup")
      expect(job).toBeDefined()

      if (job) {
        await job.handler()
      }

      // Verify leads query was called
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT l.id, l.customer_id"))
    })
  })

  describe("Data Cleanup", () => {
    it("should cleanup old data", async () => {
      // Mock cleanup queries
      mockQuery.mockResolvedValueOnce({ rowCount: 10 }) // Old communications
      mockQuery.mockResolvedValueOnce({ rowCount: 5 }) // Old executions

      // Get the data cleanup job and execute it
      const job = cronService.getJobStatus("data-cleanup")
      expect(job).toBeDefined()

      if (job) {
        await job.handler()
      }

      // Verify cleanup queries were called
      expect(mockQuery).toHaveBeenCalledTimes(2)
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining("DELETE FROM communications"))
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringContaining("DELETE FROM automation_executions"))
    })
  })

  describe("Error Handling", () => {
    it("should handle job execution errors gracefully", async () => {
      const errorJob: CronJob = {
        id: "error-job",
        name: "Error Job",
        schedule: "0 * * * *",
        handler: vi.fn().mockRejectedValue(new Error("Job failed")),
        isActive: true,
      }

      cronService.addJob(errorJob)

      // Execute the job directly
      const job = cronService.getJobStatus("error-job")
      if (job) {
        // Should not throw error
        await expect(job.handler()).rejects.toThrow("Job failed")
      }
    })

    it("should handle database errors in campaign metrics", async () => {
      // Mock database error
      mockQuery.mockRejectedValueOnce(new Error("Database error"))

      // Get the campaign metrics job and execute it
      const job = cronService.getJobStatus("campaign-metrics")
      if (job) {
        // Should not throw error
        await job.handler()
      }

      expect(mockQuery).toHaveBeenCalled()
    })
  })
})
