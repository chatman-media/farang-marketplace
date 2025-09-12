import { EventEmitter } from "events"
import { ServiceConfig, servicesConfig } from "../config/services.js"

export interface ServiceHealth {
  name: string
  url: string
  healthy: boolean
  lastCheck: Date
  responseTime?: number
  error?: string
}

export interface ServiceInstance {
  id: string
  name: string
  url: string
  health: ServiceHealth
  config: ServiceConfig
}

export class ServiceDiscovery extends EventEmitter {
  private services: Map<string, ServiceInstance> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private isRunning = false
  private healthCheckConfig = {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
  }

  constructor() {
    super()
    this.initializeServices()
  }

  private initializeServices() {
    for (const [serviceName, config] of Object.entries(servicesConfig)) {
      const instance: ServiceInstance = {
        id: `${serviceName}-${Date.now()}`,
        name: serviceName,
        url: config.url,
        config,
        health: {
          name: serviceName,
          url: config.url,
          healthy: false,
          lastCheck: new Date(),
        },
      }
      this.services.set(serviceName, instance)
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    // Initial health check
    await this.checkAllServices()

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => this.checkAllServices(), this.healthCheckConfig.interval)

    this.emit("started")
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }

    this.emit("stopped")
  }

  private async checkAllServices(): Promise<void> {
    const promises = Array.from(this.services.values()).map((service) => this.checkServiceHealth(service))

    await Promise.allSettled(promises)
  }

  private async checkServiceHealth(service: ServiceInstance): Promise<void> {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckConfig.timeout)

      const response = await fetch(`${service.url}${service.config.healthCheck}`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "API-Gateway-Health-Check/1.0",
        },
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime
      const wasHealthy = service.health.healthy
      const isHealthy = response.ok

      service.health = {
        name: service.name,
        url: service.url,
        healthy: isHealthy,
        lastCheck: new Date(),
        responseTime,
        error: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      }

      // Emit events on health status changes
      if (wasHealthy !== isHealthy) {
        this.emit("healthChanged", service.name, isHealthy, service.health)

        if (isHealthy) {
          this.emit("serviceUp", service.name, service.health)
        } else {
          this.emit("serviceDown", service.name, service.health)
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const wasHealthy = service.health.healthy

      service.health = {
        name: service.name,
        url: service.url,
        healthy: false,
        lastCheck: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }

      if (wasHealthy) {
        this.emit("healthChanged", service.name, false, service.health)
        this.emit("serviceDown", service.name, service.health)
      }
    }
  }

  getService(name: string): ServiceInstance | undefined {
    return this.services.get(name)
  }

  getHealthyService(name: string): ServiceInstance | undefined {
    const service = this.services.get(name)
    return service?.health.healthy ? service : undefined
  }

  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values())
  }

  getHealthyServices(): ServiceInstance[] {
    return Array.from(this.services.values()).filter((service) => service.health.healthy)
  }

  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.services.values()).map((service) => service.health)
  }

  isServiceHealthy(name: string): boolean {
    const service = this.services.get(name)
    return service?.health.healthy ?? false
  }

  getServiceUrl(name: string): string | undefined {
    const service = this.getHealthyService(name)
    return service?.url
  }

  // Get service statistics
  getStats() {
    const services = this.getAllServices()
    const healthy = services.filter((s) => s.health.healthy)
    const unhealthy = services.filter((s) => !s.health.healthy)

    return {
      total: services.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      healthyPercentage: services.length > 0 ? (healthy.length / services.length) * 100 : 0,
      services: services.map((s) => ({
        name: s.name,
        healthy: s.health.healthy,
        responseTime: s.health.responseTime,
        lastCheck: s.health.lastCheck,
        error: s.health.error,
      })),
    }
  }
}
