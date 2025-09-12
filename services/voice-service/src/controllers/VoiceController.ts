import logger from "@marketplace/logger"

import type { FastifyReply, FastifyRequest } from "fastify"

import type { VoiceCommandResponse, VoiceRequest } from "../models/index"
import { SpeechToTextService } from "../services/SpeechToTextService"
import { VoiceCommandService } from "../services/VoiceCommandService"

// Extend Fastify Request type to include user and file properties
interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

interface FastifyRequestWithAuth extends FastifyRequest {
  user?: AuthenticatedUser
  fileBuffer?: Buffer
  fileInfo?: {
    filename: string
    mimetype: string
    encoding: string
  }
}

export class VoiceController {
  private speechToTextService: SpeechToTextService
  public voiceCommandService: VoiceCommandService

  constructor() {
    this.speechToTextService = new SpeechToTextService()
    this.voiceCommandService = new VoiceCommandService(this.speechToTextService)
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      // For file uploads, use the fileBuffer from middleware
      let audioData: Buffer | string | undefined

      if (req.fileBuffer) {
        audioData = req.fileBuffer
      } else if (req.body && typeof req.body === "object") {
        const body = req.body as any
        audioData = body.audioData
      }

      const body = (req.body as any) || {}
      const { language, format, sampleRate, channels, encoding, context } = body
      const userId = req.user?.id
      const sessionId = req.headers["x-session-id"] as string

      if (!audioData) {
        reply.code(400)
        return {
          success: false,
          error: "Audio data is required",
        }
      }

      const request: VoiceRequest = {
        audioData: typeof audioData === "string" ? audioData : Buffer.from(audioData),
        ...(language && { language }),
        ...(format && { format }),
        ...(sampleRate && { sampleRate }),
        ...(channels && { channels }),
        ...(encoding && { encoding }),
        ...(userId && { userId }),
        ...(sessionId && { sessionId }),
        ...(context && { context }),
      }

      const result = await this.speechToTextService.transcribe(request)

      return result
    } catch (error) {
      logger.error("Transcription error:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Process voice command
   */
  async processCommand(req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const body = (req.body as any) || {}
      const { audioData, text, language, context } = body
      const userId = req.user?.id
      const sessionId = (req.headers["x-session-id"] as string) || this.generateSessionId()

      let result: VoiceCommandResponse

      if (audioData) {
        // Process audio command
        result = await this.voiceCommandService.processVoiceCommand(
          typeof audioData === "string" ? audioData : Buffer.from(audioData),
          userId,
          sessionId,
          context,
          language,
        )
      } else if (text) {
        // Process text command
        result = await this.voiceCommandService.processTextCommand(text, userId, sessionId, context, language)
      } else {
        reply.code(400)
        return {
          success: false,
          error: "Either audioData or text is required",
        }
      }

      return result
    } catch (error) {
      logger.error("Command processing error:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(_req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const languages = this.speechToTextService.getSupportedLanguages()
      return {
        success: true,
        languages,
      }
    } catch (error) {
      logger.error("Error getting supported languages:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(_req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const stats = this.speechToTextService.getProviderStats()
      const health = await this.speechToTextService.getProviderHealth()

      return {
        success: true,
        stats,
        health,
      }
    } catch (error) {
      logger.error("Error getting provider stats:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Get session information
   */
  async getSession(req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const sessionId = (req.params as any)?.sessionId || (req.headers["x-session-id"] as string)

      if (!sessionId) {
        reply.code(400)
        return {
          success: false,
          error: "Session ID is required",
        }
      }

      const session = this.voiceCommandService.getSession(sessionId)

      if (!session) {
        reply.code(404)
        return {
          success: false,
          error: "Session not found",
        }
      }

      return {
        success: true,
        session,
      }
    } catch (error) {
      logger.error("Error getting session:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Get voice service statistics
   */
  async getStats(_req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const sessionStats = this.voiceCommandService.getSessionStats()
      const providerStats = this.speechToTextService.getProviderStats()
      const providerHealth = await this.speechToTextService.getProviderHealth()

      return {
        success: true,
        stats: {
          sessions: sessionStats,
          providers: providerStats,
          health: providerHealth,
        },
      }
    } catch (error) {
      logger.error("Error getting stats:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(_req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const health = await this.speechToTextService.getProviderHealth()
      const hasHealthyProvider = Object.values(health).some((isHealthy) => isHealthy)

      reply.code(hasHealthyProvider ? 200 : 503)
      return {
        success: hasHealthyProvider,
        health,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      logger.error("Health check error:", error)
      reply.code(503)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Service unavailable",
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Upload audio file for processing
   */
  async uploadAudio(req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      const fileBuffer = req.fileBuffer
      const body = (req.body as any) || {}
      const { language, context } = body
      const userId = req.user?.id
      const sessionId = (req.headers["x-session-id"] as string) || this.generateSessionId()

      if (!fileBuffer) {
        reply.code(400)
        return {
          success: false,
          error: "Audio file is required",
        }
      }

      // Process uploaded audio file
      const result = await this.voiceCommandService.processVoiceCommand(
        fileBuffer,
        userId,
        sessionId,
        context ? JSON.parse(context) : undefined,
        language,
      )

      return result
    } catch (error) {
      logger.error("Audio upload error:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions(_req: FastifyRequestWithAuth, reply: FastifyReply): Promise<any> {
    try {
      this.voiceCommandService.cleanupSessions()

      return {
        success: true,
        message: "Sessions cleaned up successfully",
      }
    } catch (error) {
      logger.error("Session cleanup error:", error)
      reply.code(500)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
