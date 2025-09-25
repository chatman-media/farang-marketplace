import { logger } from "@marketplace/logger"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

// Since we're using centralized schema, we'll use the actual tables from there
// The types are defined in the centralized schema package
export class LoggingService {
  private db: any
  private pool: Pool | null = null

  constructor() {
    this.initializeDatabase()
  }

  private initializeDatabase() {
    try {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        logger.warn("DATABASE_URL not configured, logging to database disabled")
        return
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      })

      // Import schema from centralized package
      const schema = require("@marketplace/database-schema")
      this.db = drizzle(this.pool, { schema })
    } catch (error) {
      logger.error("Failed to initialize database connection:", error)
      this.pool = null
    }
  }

  async logVoiceRequest(request: any & { userId?: string; requestId: string }) {
    try {
      if (this.db) {
        await this.db.insert(this.db.apiRequestLogs).values({
          id: request.requestId,
          userId: request.userId,
          service: "voice-service",
          method: "POST",
          endpoint: "/voice/transcribe",
          requestBody: {
            language: request.language,
            context: request.context,
          },
          ipAddress: "0.0.0.0",
          userAgent: "voice-service",
          timestamp: new Date(),
        })
      } else {
        logger.info("Voice request logged (in-memory):", { requestId: request.requestId, userId: request.userId })
      }
    } catch (error) {
      logger.error("Failed to log voice request:", error)
    }
  }

  async logVoiceResponse(response: any & { requestId: string; userId?: string }) {
    try {
      if (this.db) {
        await this.db.insert(this.db.apiResponseLogs).values({
          id: crypto.randomUUID(),
          requestId: response.requestId,
          statusCode: response.success ? 200 : 400,
          responseBody: {
            success: response.success,
            transcription: response.transcription,
            error: response.error,
            processingTime: response.processingTime,
          },
          processingTime: response.processingTime || 0,
          timestamp: new Date(),
        })
      } else {
        logger.info("Voice response logged (in-memory):", { requestId: response.requestId, success: response.success })
      }
    } catch (error) {
      logger.error("Failed to log voice response:", error)
    }
  }

  async logVoiceCommand(request: any & { userId?: string; requestId: string }) {
    try {
      if (this.db) {
        await this.db.insert(this.db.apiRequestLogs).values({
          id: request.requestId,
          userId: request.userId,
          service: "voice-service",
          method: "POST",
          endpoint: "/voice/command",
          requestBody: {
            text: request.text,
            context: request.context,
            sessionId: request.sessionId,
          },
          ipAddress: "0.0.0.0",
          userAgent: "voice-service",
          timestamp: new Date(),
        })
      } else {
        logger.info("Voice command logged (in-memory):", { requestId: request.requestId, userId: request.userId })
      }
    } catch (error) {
      logger.error("Failed to log voice command:", error)
    }
  }

  async logCommandResponse(response: any & { requestId: string; userId?: string }) {
    try {
      if (this.db) {
        await this.db.insert(this.db.apiResponseLogs).values({
          id: crypto.randomUUID(),
          requestId: response.requestId,
          statusCode: response.success ? 200 : 400,
          responseBody: {
            success: response.success,
            command: response.command,
            parameters: response.parameters,
            response: response.response,
            confidence: response.confidence,
          },
          processingTime: response.processingTime || 0,
          timestamp: new Date(),
        })
      } else {
        logger.info("Command response logged (in-memory):", {
          requestId: response.requestId,
          success: response.success,
        })
      }
    } catch (error) {
      logger.error("Failed to log command response:", error)
    }
  }

  async logVoiceAnalytics(analytics: any & { userId?: string; sessionId?: string }) {
    try {
      if (this.db) {
        await this.db.insert(this.db.auditLogs).values({
          id: crypto.randomUUID(),
          userId: analytics.userId,
          action: "voice_analytics",
          entityType: "voice_session",
          entityId: analytics.sessionId,
          details: {
            provider: analytics.provider,
            language: analytics.language,
            duration: analytics.duration,
            confidence: analytics.confidence,
            error: analytics.error,
          },
          ipAddress: "0.0.0.0",
          userAgent: "voice-service",
          timestamp: new Date(),
        })
      } else {
        logger.info("Voice analytics logged (in-memory):", { sessionId: analytics.sessionId, userId: analytics.userId })
      }
    } catch (error) {
      logger.error("Failed to log voice analytics:", error)
    }
  }

  async getUserVoiceHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      if (!this.db) {
        logger.warn("Database not available, returning empty history")
        return []
      }

      const requests = await this.db
        .select()
        .from(this.db.apiRequestLogs)
        .where({ userId, endpoint: "/voice/transcribe" })
        .orderBy(this.db.apiRequestLogs.timestamp, "desc")
        .limit(limit)

      return requests || []
    } catch (error) {
      logger.error("Failed to get user voice history:", error)
      return []
    }
  }

  async cleanOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      if (!this.db) {
        logger.warn("Database not available, skipping cleanup")
        return
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      logger.info(`Would clean logs older than ${daysToKeep} days`)
    } catch (error) {
      logger.error("Failed to clean old logs:", error)
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }
}

export const loggingService = new LoggingService()
