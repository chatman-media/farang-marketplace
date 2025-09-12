import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { routeMapping } from "../config/services.js"
import { ServiceDiscovery } from "./ServiceDiscovery.js"
import { CircuitBreakerManager } from "./CircuitBreaker.js"
import { env, circuitBreakerConfig } from "../config/environment.js"

export interface ProxyOptions {
  timeout?: number
  retries?: number
  stripPrefix?: boolean
}

export class Router {
  private circuitBreakers: CircuitBreakerManager

  constructor(private serviceDiscovery: ServiceDiscovery) {
    this.circuitBreakers = new CircuitBreakerManager()
  }

  async setupRoutes(app: FastifyInstance): Promise<void> {
    // Setup dynamic routing
    app.addHook("preHandler", async (request, reply) => {
      await this.handleRequest(request, reply)
    })

    // Health check endpoint
    app.get("/health", async () => {
      const serviceStats = this.serviceDiscovery.getStats()
      const circuitBreakerStats = this.circuitBreakers.getAllStats()

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: serviceStats,
        circuitBreakers: circuitBreakerStats,
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid,
        },
      }
    })

    // Metrics endpoint
    app.get("/metrics", async () => {
      const serviceStats = this.serviceDiscovery.getStats()
      const circuitBreakerStats = this.circuitBreakers.getAllStats()

      return {
        timestamp: new Date().toISOString(),
        services: serviceStats,
        circuitBreakers: circuitBreakerStats,
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
      }
    })

    // Service discovery endpoint
    app.get("/services", async () => {
      return {
        services: this.serviceDiscovery.getAllServices().map((service) => ({
          name: service.name,
          url: service.url,
          healthy: service.health.healthy,
          lastCheck: service.health.lastCheck,
          responseTime: service.health.responseTime,
        })),
        stats: this.serviceDiscovery.getStats(),
      }
    })
  }

  private async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const path = request.url.split("?")[0]

    // Skip routing for gateway endpoints
    if (this.isGatewayEndpoint(path)) {
      return
    }

    const serviceName = this.findServiceForPath(path)

    if (!serviceName) {
      return reply.code(404).send({
        success: false,
        error: "SERVICE_NOT_FOUND",
        message: `No service found for path: ${path}`,
        timestamp: new Date().toISOString(),
      })
    }

    const service = this.serviceDiscovery.getHealthyService(serviceName)

    if (!service) {
      return reply.code(503).send({
        success: false,
        error: "SERVICE_UNAVAILABLE",
        message: `Service ${serviceName} is currently unavailable`,
        timestamp: new Date().toISOString(),
      })
    }

    // Get or create circuit breaker for this service
    const circuitBreaker = this.circuitBreakers.getOrCreate(serviceName, {
      threshold: circuitBreakerConfig.threshold,
      timeout: circuitBreakerConfig.timeout,
      name: serviceName,
    })

    try {
      await circuitBreaker.execute(async () => {
        await this.proxyRequest(request, reply, service.url, {
          timeout: service.config.timeout,
          retries: service.config.retries,
        })
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Circuit breaker is OPEN")) {
        return reply.code(503).send({
          success: false,
          error: "CIRCUIT_BREAKER_OPEN",
          message: `Service ${serviceName} is temporarily unavailable due to repeated failures`,
          timestamp: new Date().toISOString(),
        })
      }

      request.log.error(`Proxy error for ${serviceName}: %s`, String(error))
      return reply.code(502).send({
        success: false,
        error: "PROXY_ERROR",
        message: `Failed to proxy request to ${serviceName}`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  private isGatewayEndpoint(path: string): boolean {
    const gatewayEndpoints = ["/", "/health", "/metrics", "/services"]
    return gatewayEndpoints.includes(path)
  }

  private findServiceForPath(path: string): string | undefined {
    for (const [routePattern, serviceName] of Object.entries(routeMapping)) {
      if (this.matchesRoute(path, routePattern)) {
        return serviceName
      }
    }
    return undefined
  }

  private matchesRoute(path: string, pattern: string): boolean {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1)
      // Match exact prefix or prefix with additional path segments
      return path === prefix.slice(0, -1) || path.startsWith(prefix)
    }
    return path === pattern
  }

  private async proxyRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    targetUrl: string,
    options: ProxyOptions = {},
  ): Promise<void> {
    const { timeout = 30000, retries = 3 } = options

    // Prepare headers
    const headers: Record<string, string> = {}

    // Forward important headers
    const headersToForward = [
      "authorization",
      "content-type",
      "user-agent",
      "x-forwarded-for",
      "x-real-ip",
      "x-request-id",
    ]

    for (const header of headersToForward) {
      const value = request.headers[header]
      if (value) {
        headers[header] = Array.isArray(value) ? value[0] : value
      }
    }

    // Add gateway headers
    headers["x-forwarded-by"] = "api-gateway"
    headers["x-gateway-version"] = "1.0.0"

    // Generate request ID if not present
    if (!headers["x-request-id"]) {
      headers["x-request-id"] = `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const url = new URL(request.url, targetUrl)

    let lastError: Error | undefined

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url.toString(), {
          method: request.method,
          headers,
          body: request.method !== "GET" && request.method !== "HEAD" ? JSON.stringify(request.body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Forward response headers
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        // Add gateway response headers
        responseHeaders["x-proxied-by"] = "api-gateway"
        responseHeaders["x-response-time"] = Date.now().toString()

        reply.headers(responseHeaders)
        reply.code(response.status)

        const responseBody = await response.text()

        try {
          // Try to parse as JSON
          const jsonBody = JSON.parse(responseBody)
          return reply.send(jsonBody)
        } catch {
          // Send as text if not JSON
          return reply.send(responseBody)
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
      }
    }

    throw lastError || new Error("Unknown proxy error")
  }

  // Get router statistics
  getStats() {
    return {
      circuitBreakers: this.circuitBreakers.getAllStats(),
      services: this.serviceDiscovery.getStats(),
      routes: Object.keys(routeMapping).length,
    }
  }
}
