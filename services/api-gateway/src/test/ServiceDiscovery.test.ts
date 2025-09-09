import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ServiceDiscovery } from "../services/ServiceDiscovery.js"

// Mock fetch globally
global.fetch = vi.fn()

describe("ServiceDiscovery", () => {
  let serviceDiscovery: ServiceDiscovery

  beforeEach(() => {
    serviceDiscovery = new ServiceDiscovery()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await serviceDiscovery.stop()
  })

  describe("initialization", () => {
    it("should initialize with configured services", () => {
      const services = serviceDiscovery.getAllServices()
      expect(services).toHaveLength(8) // 8 microservices

      const serviceNames = services.map((s) => s.name)
      expect(serviceNames).toContain("user-service")
      expect(serviceNames).toContain("listing-service")
      expect(serviceNames).toContain("payment-service")
      expect(serviceNames).toContain("booking-service")
      expect(serviceNames).toContain("agency-service")
      expect(serviceNames).toContain("ai-service")
      expect(serviceNames).toContain("voice-service")
      expect(serviceNames).toContain("crm-service")
    })

    it("should initialize all services as unhealthy", () => {
      const services = serviceDiscovery.getAllServices()
      services.forEach((service) => {
        expect(service.health.healthy).toBe(false)
      })
    })
  })

  describe("service health checking", () => {
    it("should mark service as healthy when health check succeeds", async () => {
      const mockFetch = fetch as any
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response)

      await serviceDiscovery.start()

      // Wait a bit for health check to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      const userService = serviceDiscovery.getService("user-service")
      expect(userService?.health.healthy).toBe(true)
      expect(userService?.health.responseTime).toBeGreaterThanOrEqual(0)
    })

    it("should mark service as unhealthy when health check fails", async () => {
      const mockFetch = fetch as any
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"))

      await serviceDiscovery.start()

      // Wait a bit for health check to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      const userService = serviceDiscovery.getService("user-service")
      expect(userService?.health.healthy).toBe(false)
      expect(userService?.health.error).toContain("Connection refused")
    })

    it("should emit events when service health changes", async () => {
      const mockFetch = fetch as any
      const serviceUpSpy = vi.fn()
      const serviceDownSpy = vi.fn()
      const healthChangedSpy = vi.fn()

      serviceDiscovery.on("serviceUp", serviceUpSpy)
      serviceDiscovery.on("serviceDown", serviceDownSpy)
      serviceDiscovery.on("healthChanged", healthChangedSpy)

      // First check - service becomes healthy
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response)

      await serviceDiscovery.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(serviceUpSpy).toHaveBeenCalledWith("user-service", expect.any(Object))
      expect(healthChangedSpy).toHaveBeenCalledWith("user-service", true, expect.any(Object))
    })
  })

  describe("service retrieval", () => {
    it("should return healthy service", async () => {
      const mockFetch = fetch as any
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response)

      await serviceDiscovery.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const healthyService = serviceDiscovery.getHealthyService("user-service")
      expect(healthyService).toBeDefined()
      expect(healthyService?.health.healthy).toBe(true)
    })

    it("should not return unhealthy service", async () => {
      const mockFetch = fetch as any
      mockFetch.mockRejectedValue(new Error("Service down"))

      await serviceDiscovery.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const healthyService = serviceDiscovery.getHealthyService("user-service")
      expect(healthyService).toBeUndefined()
    })

    it("should return service URL for healthy service", async () => {
      const mockFetch = fetch as any
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response)

      await serviceDiscovery.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const serviceUrl = serviceDiscovery.getServiceUrl("user-service")
      expect(serviceUrl).toBe("http://localhost:3001")
    })
  })

  describe("statistics", () => {
    it("should return correct statistics", async () => {
      const mockFetch = fetch as any
      // Make half the services healthy
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" } as Response) // user-service
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" } as Response) // listing-service
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" } as Response) // payment-service
        .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" } as Response) // booking-service
        .mockRejectedValueOnce(new Error("Service down")) // agency-service
        .mockRejectedValueOnce(new Error("Service down")) // ai-service
        .mockRejectedValueOnce(new Error("Service down")) // voice-service
        .mockRejectedValueOnce(new Error("Service down")) // crm-service

      await serviceDiscovery.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const stats = serviceDiscovery.getStats()
      expect(stats.total).toBe(8)
      expect(stats.healthy).toBe(4)
      expect(stats.unhealthy).toBe(4)
      expect(stats.healthyPercentage).toBe(50)
    })
  })

  describe("lifecycle", () => {
    it("should start and stop correctly", async () => {
      const startedSpy = vi.fn()
      const stoppedSpy = vi.fn()

      serviceDiscovery.on("started", startedSpy)
      serviceDiscovery.on("stopped", stoppedSpy)

      await serviceDiscovery.start()
      expect(startedSpy).toHaveBeenCalled()

      await serviceDiscovery.stop()
      expect(stoppedSpy).toHaveBeenCalled()
    })

    it("should not start if already running", async () => {
      await serviceDiscovery.start()

      // Try to start again
      await serviceDiscovery.start()

      // Should still be running normally
      expect(serviceDiscovery.getAllServices()).toHaveLength(8)
    })

    it("should not stop if not running", async () => {
      // Try to stop without starting
      await serviceDiscovery.stop()

      // Should not throw error
      expect(true).toBe(true)
    })
  })
})
