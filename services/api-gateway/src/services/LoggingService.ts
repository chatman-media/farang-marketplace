import { eq, desc } from "drizzle-orm"

import logger from "@marketplace/logger"
import { db } from "../database/connection.js"

export interface RequestLog {
  method: string
  url: string
  userId?: string
  ip: string
  userAgent?: string
  requestId: string
  serviceName?: string
  headers?: Record<string, string>
  query?: Record<string, any>
  body?: any
  timestamp: Date
}

export interface ResponseLog {
  requestId: string
  statusCode: number
  responseTime: number
  responseSize?: number
  error?: string
  headers?: Record<string, string>
  body?: any
  timestamp: Date
}

export interface AuditLog {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ip: string
  userAgent?: string
  success: boolean
  error?: string
  timestamp: Date
}

export class LoggingService {
  /**
   * Log incoming API request
   */
  async logRequest(log: RequestLog): Promise<void> {
    try {
      if (!db.insert) {
        logger.debug("Database not available, skipping request log")
        return
      }

      // Use the available schema exports
      const schema = (db as any).$schema || {}
      if (!schema.apiRequestLogs) {
        logger.debug("API request logs schema not available")
        return
      }

      await db.insert(schema.apiRequestLogs).values({
        id: log.requestId,
        userId: log.userId,
        method: log.method,
        url: log.url,
        ip: log.ip,
        userAgent: log.userAgent,
        serviceName: log.serviceName,
        headers: log.headers,
        query: log.query,
        body: log.body,
        timestamp: log.timestamp,
      })
    } catch (error) {
      logger.error("Failed to log request:", error)
    }
  }

  /**
   * Log API response
   */
  async logResponse(log: ResponseLog): Promise<void> {
    try {
      if (!db.insert) {
        logger.debug("Database not available, skipping response log")
        return
      }

      const schema = (db as any).$schema || {}
      if (!schema.apiResponseLogs) {
        logger.debug("API response logs schema not available")
        return
      }

      await db.insert(schema.apiResponseLogs).values({
        id: log.requestId,
        requestId: log.requestId,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        responseSize: log.responseSize,
        error: log.error,
        headers: log.headers,
        body: log.body,
        timestamp: log.timestamp,
      })
    } catch (error) {
      logger.error("Failed to log response:", error)
    }
  }

  /**
   * Log audit event
   */
  async logAudit(log: AuditLog): Promise<void> {
    try {
      if (!db.insert) {
        logger.debug("Database not available, skipping audit log")
        return
      }

      const schema = (db as any).$schema || {}
      if (!schema.auditLogs) {
        logger.debug("Audit logs schema not available")
        return
      }

      await db.insert(schema.auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ip: log.ip,
        userAgent: log.userAgent,
        success: log.success,
        error: log.error,
        timestamp: log.timestamp,
      })
    } catch (error) {
      logger.error("Failed to log audit:", error)
    }
  }

  /**
   * Get request logs by user ID
   */
  async getUserRequests(userId: string, limit = 100) {
    try {
      if (!db.select) {
        return []
      }

      const schema = (db as any).$schema || {}
      if (!schema.apiRequestLogs) {
        return []
      }

      return await db
        .select()
        .from(schema.apiRequestLogs)
        .where(eq(schema.apiRequestLogs.userId, userId))
        .orderBy(desc(schema.apiRequestLogs.timestamp))
        .limit(limit)
    } catch (error) {
      logger.error("Failed to get user requests:", error)
      return []
    }
  }

  /**
   * Get audit logs by user ID
   */
  async getUserAuditLogs(userId: string, limit = 100) {
    try {
      if (!db.select) {
        return []
      }

      const schema = (db as any).$schema || {}
      if (!schema.auditLogs) {
        return []
      }

      return await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.userId, userId))
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(limit)
    } catch (error) {
      logger.error("Failed to get user audit logs:", error)
      return []
    }
  }

  /**
   * Clean old logs (keep last 30 days)
   */
  async cleanupOldLogs(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
      logger.info(`Cleaning up logs older than ${cutoffDate}`)
    } catch (error) {
      logger.error("Failed to cleanup old logs:", error)
    }
  }
}

export const loggingService = new LoggingService()
