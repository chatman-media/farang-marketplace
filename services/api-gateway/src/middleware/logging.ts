import { FastifyRequest, FastifyReply } from "fastify"
import { loggingService } from "../services/LoggingService.js"

export interface LoggingOptions {
  excludePaths?: string[]
  includeBody?: boolean
  includeHeaders?: boolean
  maxBodySize?: number
}

const defaultOptions: LoggingOptions = {
  excludePaths: ["/health", "/metrics"],
  includeBody: false,
  includeHeaders: false,
  maxBodySize: 1024 * 10, // 10KB
}

export function createLoggingMiddleware(options: LoggingOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return async function loggingMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now()
    const requestId = request.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add request ID to headers for downstream services
    request.headers["x-request-id"] = requestId

    // Skip logging for excluded paths
    if (opts.excludePaths?.some(path => request.url.startsWith(path))) {
      return
    }

    // Prepare request log
    const requestLog = {
      method: request.method,
      url: request.url,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      requestId,
      serviceName: "api-gateway",
      headers: opts.includeHeaders ? request.headers : undefined,
      query: request.query,
      body: opts.includeBody && request.body && JSON.stringify(request.body).length <= opts.maxBodySize 
        ? request.body 
        : undefined,
      timestamp: new Date(),
    }

    // Log the request
    await loggingService.logRequest(requestLog)

    // Store request ID in reply for response logging
    (reply as any).requestId = requestId
    (reply as any).startTime = startTime
  }
}

export async function logResponse(request: FastifyRequest, reply: FastifyReply) {
  const requestId = (reply as any).requestId
  const startTime = (reply as any).startTime

  if (!requestId || !startTime) return

  const responseTime = Date.now() - startTime

  const responseLog = {
    requestId,
    statusCode: reply.statusCode,
    responseTime,
    responseSize: reply.getHeader("content-length") as number,
    timestamp: new Date(),
  }

  await loggingService.logResponse(responseLog)
}

export const loggingMiddleware = createLoggingMiddleware()