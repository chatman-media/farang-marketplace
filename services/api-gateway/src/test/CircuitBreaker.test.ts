import { describe, it, expect, beforeEach, vi } from "vitest"
import { CircuitBreaker, CircuitState, CircuitBreakerManager } from "../services/CircuitBreaker.js"

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      threshold: 3,
      timeout: 1000,
      name: "test-service",
    })
  })

  describe("initial state", () => {
    it("should start in CLOSED state", () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      expect(circuitBreaker.getFailureCount()).toBe(0)
      expect(circuitBreaker.isClosed()).toBe(true)
      expect(circuitBreaker.isOpen()).toBe(false)
      expect(circuitBreaker.isHalfOpen()).toBe(false)
    })
  })

  describe("successful operations", () => {
    it("should execute successful operations", async () => {
      const operation = vi.fn().mockResolvedValue("success")

      const result = await circuitBreaker.execute(operation)

      expect(result).toBe("success")
      expect(operation).toHaveBeenCalledOnce()
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      expect(circuitBreaker.getFailureCount()).toBe(0)
    })

    it("should reset failure count on success", async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error("fail"))
      const successOperation = vi.fn().mockResolvedValue("success")

      // Fail once
      try {
        await circuitBreaker.execute(failingOperation)
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1)

      // Then succeed
      await circuitBreaker.execute(successOperation)

      expect(circuitBreaker.getFailureCount()).toBe(0)
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })
  })

  describe("failing operations", () => {
    it("should track failures", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      try {
        await circuitBreaker.execute(operation)
      } catch {}

      expect(circuitBreaker.getFailureCount()).toBe(1)
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should open circuit after threshold failures", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation)
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
      expect(circuitBreaker.getFailureCount()).toBe(3)
      expect(circuitBreaker.isOpen()).toBe(true)
    })

    it("should reject operations when circuit is open", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation)
        } catch {}
      }

      // Try to execute when open
      await expect(circuitBreaker.execute(operation)).rejects.toThrow("Circuit breaker is OPEN")

      // Operation should not be called
      expect(operation).toHaveBeenCalledTimes(3) // Only the initial failures
    })
  })

  describe("half-open state", () => {
    it("should transition to half-open after timeout", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation)
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      // Wait for timeout (using a shorter timeout for testing)
      circuitBreaker = new CircuitBreaker({
        threshold: 3,
        timeout: 10, // 10ms
        name: "test-service",
      })

      // Open it again
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation)
        } catch {}
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 20))

      // Next operation should transition to half-open
      const successOperation = vi.fn().mockResolvedValue("success")
      await circuitBreaker.execute(successOperation)

      // Should be in half-open state after first success
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN)

      // Need more successes to fully close
      await circuitBreaker.execute(successOperation)
      await circuitBreaker.execute(successOperation)

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should require multiple successes to close from half-open", async () => {
      const failOperation = vi.fn().mockRejectedValue(new Error("fail"))
      const successOperation = vi.fn().mockResolvedValue("success")

      // Use shorter timeout for testing
      circuitBreaker = new CircuitBreaker({
        threshold: 3,
        timeout: 10,
        name: "test-service",
      })

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation)
        } catch {}
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 20))

      // First success should put it in half-open, but not close it
      await circuitBreaker.execute(successOperation)
      // Need more successes to fully close
      await circuitBreaker.execute(successOperation)
      await circuitBreaker.execute(successOperation)

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it("should go back to open if failure occurs in half-open", async () => {
      const failOperation = vi.fn().mockRejectedValue(new Error("fail"))

      // Use shorter timeout for testing
      circuitBreaker = new CircuitBreaker({
        threshold: 3,
        timeout: 10,
        name: "test-service",
      })

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failOperation)
        } catch {}
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 20))

      // Fail in half-open state
      try {
        await circuitBreaker.execute(failOperation)
      } catch {}

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)
    })
  })

  describe("reset functionality", () => {
    it("should reset circuit breaker state", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation)
        } catch {}
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN)

      // Reset
      circuitBreaker.reset()

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED)
      expect(circuitBreaker.getFailureCount()).toBe(0)
      expect(circuitBreaker.getLastFailureTime()).toBeUndefined()
      expect(circuitBreaker.getNextAttemptTime()).toBeUndefined()
    })
  })

  describe("statistics", () => {
    it("should provide circuit breaker statistics", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Fail once
      try {
        await circuitBreaker.execute(operation)
      } catch {}

      const stats = circuitBreaker.getStats()

      expect(stats.name).toBe("test-service")
      expect(stats.state).toBe(CircuitState.CLOSED)
      expect(stats.failureCount).toBe(1)
      expect(stats.threshold).toBe(3)
      expect(stats.timeout).toBe(1000)
      expect(stats.isHealthy).toBe(true)
      expect(stats.lastFailureTime).toBeInstanceOf(Date)
    })
  })
})

describe("CircuitBreakerManager", () => {
  let manager: CircuitBreakerManager

  beforeEach(() => {
    manager = new CircuitBreakerManager()
  })

  describe("circuit breaker management", () => {
    it("should create and manage circuit breakers", () => {
      const breaker1 = manager.getOrCreate("service1", { threshold: 5, timeout: 2000 })
      const breaker2 = manager.getOrCreate("service2", { threshold: 3, timeout: 1000 })

      expect(breaker1).toBeInstanceOf(CircuitBreaker)
      expect(breaker2).toBeInstanceOf(CircuitBreaker)
      expect(breaker1).not.toBe(breaker2)
    })

    it("should return existing circuit breaker", () => {
      const breaker1 = manager.getOrCreate("service1", { threshold: 5, timeout: 2000 })
      const breaker2 = manager.getOrCreate("service1", { threshold: 3, timeout: 1000 })

      expect(breaker1).toBe(breaker2) // Should be the same instance
    })

    it("should get circuit breaker by name", () => {
      const breaker = manager.getOrCreate("service1", { threshold: 5, timeout: 2000 })
      const retrieved = manager.get("service1")

      expect(retrieved).toBe(breaker)
    })

    it("should return undefined for non-existent circuit breaker", () => {
      const retrieved = manager.get("non-existent")
      expect(retrieved).toBeUndefined()
    })
  })

  describe("reset functionality", () => {
    it("should reset specific circuit breaker", async () => {
      const breaker = manager.getOrCreate("service1", { threshold: 3, timeout: 1000 })
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Fail to increase failure count
      try {
        await breaker.execute(operation)
      } catch {}

      expect(breaker.getFailureCount()).toBe(1)

      manager.reset("service1")

      expect(breaker.getFailureCount()).toBe(0)
    })

    it("should reset all circuit breakers", async () => {
      const breaker1 = manager.getOrCreate("service1", { threshold: 3, timeout: 1000 })
      const breaker2 = manager.getOrCreate("service2", { threshold: 3, timeout: 1000 })
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Fail both
      try {
        await breaker1.execute(operation)
      } catch {}
      try {
        await breaker2.execute(operation)
      } catch {}

      expect(breaker1.getFailureCount()).toBe(1)
      expect(breaker2.getFailureCount()).toBe(1)

      manager.resetAll()

      expect(breaker1.getFailureCount()).toBe(0)
      expect(breaker2.getFailureCount()).toBe(0)
    })
  })

  describe("statistics and health", () => {
    it("should provide statistics for all circuit breakers", () => {
      manager.getOrCreate("service1", { threshold: 3, timeout: 1000 })
      manager.getOrCreate("service2", { threshold: 5, timeout: 2000 })

      const stats = manager.getAllStats()

      expect(Object.keys(stats)).toHaveLength(2)
      expect(stats.service1).toBeDefined()
      expect(stats.service2).toBeDefined()
    })

    it("should identify healthy and unhealthy services", async () => {
      const breaker1 = manager.getOrCreate("service1", { threshold: 3, timeout: 1000 })
      const breaker2 = manager.getOrCreate("service2", { threshold: 3, timeout: 1000 })
      const operation = vi.fn().mockRejectedValue(new Error("fail"))

      // Open one circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await breaker1.execute(operation)
        } catch {}
      }

      const healthy = manager.getHealthyServices()
      const unhealthy = manager.getUnhealthyServices()

      expect(healthy).toContain("service2")
      expect(unhealthy).toContain("service1")
    })
  })
})
