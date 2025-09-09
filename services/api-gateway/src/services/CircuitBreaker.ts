// Circuit Breaker implementation
export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  threshold: number
  timeout: number
  name?: string
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime?: Date
  private nextAttemptTime?: Date
  private successCount = 0

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.options.name || "unknown service"}`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      // Require a few successful calls before fully closing
      if (this.successCount >= 3) {
        this.reset()
      }
    } else {
      this.failureCount = 0
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in half-open state, go back to open
      this.state = CircuitState.OPEN
      this.nextAttemptTime = new Date(Date.now() + this.options.timeout)
    } else if (this.failureCount >= this.options.threshold) {
      this.state = CircuitState.OPEN
      this.nextAttemptTime = new Date(Date.now() + this.options.timeout)
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false
  }

  getState(): CircuitState {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }

  getSuccessCount(): number {
    return this.successCount
  }

  getLastFailureTime(): Date | undefined {
    return this.lastFailureTime
  }

  getNextAttemptTime(): Date | undefined {
    return this.nextAttemptTime
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED
  }

  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN
  }

  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = undefined
    this.nextAttemptTime = undefined
  }

  // Get circuit breaker statistics
  getStats() {
    return {
      name: this.options.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      threshold: this.options.threshold,
      timeout: this.options.timeout,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isHealthy: this.state === CircuitState.CLOSED,
    }
  }
}

// Circuit Breaker Manager for managing multiple circuit breakers
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map()

  getOrCreate(serviceName: string, options: CircuitBreakerOptions): CircuitBreaker {
    let breaker = this.breakers.get(serviceName)

    if (!breaker) {
      breaker = new CircuitBreaker({
        ...options,
        name: serviceName,
      })
      this.breakers.set(serviceName, breaker)
    }

    return breaker
  }

  get(serviceName: string): CircuitBreaker | undefined {
    return this.breakers.get(serviceName)
  }

  reset(serviceName: string): void {
    const breaker = this.breakers.get(serviceName)
    if (breaker) {
      breaker.reset()
    }
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
  }

  getAllStats() {
    const stats: Record<string, any> = {}

    for (const [serviceName, breaker] of this.breakers.entries()) {
      stats[serviceName] = breaker.getStats()
    }

    return stats
  }

  getHealthyServices(): string[] {
    const healthy: string[] = []

    for (const [serviceName, breaker] of this.breakers.entries()) {
      if (breaker.isClosed()) {
        healthy.push(serviceName)
      }
    }

    return healthy
  }

  getUnhealthyServices(): string[] {
    const unhealthy: string[] = []

    for (const [serviceName, breaker] of this.breakers.entries()) {
      if (!breaker.isClosed()) {
        unhealthy.push(serviceName)
      }
    }

    return unhealthy
  }
}
