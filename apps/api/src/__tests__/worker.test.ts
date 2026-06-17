import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Tests the background-worker entrypoint (worker.ts) without standing up Redis
 * or BullMQ. Every heavy collaborator is mocked:
 *   - `@marketplace/logger`        → silent spies
 *   - `@marketplace/crm-service/cron`     → fake CronService
 *   - `@marketplace/payment-service/jobs` → fake jobs module
 *   - `./env`                       → lets each test pick NODE_ENV
 *
 * Modules are reset per-test so the worker's module-level `cron`/`paymentJobs`
 * singletons start clean each time.
 */

const logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

vi.mock("@marketplace/logger", () => ({
  default: logger,
}))

describe("worker entrypoint", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.doUnmock("../env")
    vi.doUnmock("@marketplace/crm-service/cron")
    vi.doUnmock("@marketplace/payment-service/jobs")
  })

  it("startWorkers is a no-op in the test environment", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "test" } }))

    const cronStart = vi.fn()
    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = cronStart
        stop = vi.fn()
      },
    }))
    vi.doMock("@marketplace/payment-service/jobs", () => ({ shutdownJobs: vi.fn() }))

    const { startWorkers } = await import("../worker")
    await startWorkers()

    // The early return means the cron service is never constructed/started.
    expect(cronStart).not.toHaveBeenCalled()
  })

  it("starts cron and payment jobs outside the test environment", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "production" } }))

    const cronStart = vi.fn().mockResolvedValue(undefined)
    const cronStop = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = cronStart
        stop = cronStop
      },
    }))
    const shutdownJobs = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@marketplace/payment-service/jobs", () => ({ shutdownJobs }))

    const { startWorkers, stopWorkers } = await import("../worker")
    await startWorkers()

    expect(cronStart).toHaveBeenCalledTimes(1)

    // stopWorkers should tear down both subsystems it started.
    await stopWorkers()
    expect(cronStop).toHaveBeenCalledTimes(1)
    expect(shutdownJobs).toHaveBeenCalledTimes(1)
  })

  it("continues when the CRM cron subsystem fails to start", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "production" } }))

    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = vi.fn().mockRejectedValue(new Error("cron down"))
        stop = vi.fn()
      },
    }))
    const shutdownJobs = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@marketplace/payment-service/jobs", () => ({ shutdownJobs }))

    const { startWorkers } = await import("../worker")
    // Must not throw even though cron.start rejected — error is caught + logged.
    await expect(startWorkers()).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith("Failed to start CRM cron service:", expect.any(Error))
    // Payment jobs still attempted after the cron failure.
    expect(logger.info).toHaveBeenCalledWith("⚙️  Payment BullMQ jobs started")
  })

  it("continues when the payment jobs module fails to load", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "production" } }))

    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = vi.fn().mockResolvedValue(undefined)
        stop = vi.fn().mockResolvedValue(undefined)
      },
    }))
    vi.doMock("@marketplace/payment-service/jobs", () => {
      throw new Error("redis unavailable")
    })

    const { startWorkers } = await import("../worker")
    await expect(startWorkers()).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to start payment BullMQ jobs (continuing without them):",
      expect.any(Error),
    )
  })

  it("stopWorkers is safe when nothing was started", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "production" } }))
    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = vi.fn()
        stop = vi.fn()
      },
    }))
    vi.doMock("@marketplace/payment-service/jobs", () => ({ shutdownJobs: vi.fn() }))

    const { stopWorkers } = await import("../worker")
    // No startWorkers() call → cron/paymentJobs are undefined.
    await expect(stopWorkers()).resolves.toBeUndefined()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it("stopWorkers swallows and logs errors thrown during teardown", async () => {
    vi.doMock("../env", () => ({ env: { NODE_ENV: "production" } }))

    const cronStop = vi.fn().mockRejectedValue(new Error("stop failed"))
    vi.doMock("@marketplace/crm-service/cron", () => ({
      CronService: class {
        start = vi.fn().mockResolvedValue(undefined)
        stop = cronStop
      },
    }))
    vi.doMock("@marketplace/payment-service/jobs", () => ({
      shutdownJobs: vi.fn().mockResolvedValue(undefined),
    }))

    const { startWorkers, stopWorkers } = await import("../worker")
    await startWorkers()
    await expect(stopWorkers()).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith("Error stopping workers:", expect.any(Error))
  })
})
