import type { Request, Response } from "express"
import type { VoiceCommandResponse, VoiceContext, VoiceRequest } from "../models/index.js"
import { SpeechToTextService } from "../services/SpeechToTextService.js"
import { VoiceCommandService } from "../services/VoiceCommandService.js"

export class VoiceController {
  private speechToTextService: SpeechToTextService
  private voiceCommandService: VoiceCommandService

  constructor() {
    this.speechToTextService = new SpeechToTextService()
    this.voiceCommandService = new VoiceCommandService(this.speechToTextService)
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(req: Request, res: Response): Promise<void> {
    try {
      const { audioData, language, format, sampleRate, channels, encoding, context } =
        req.body as VoiceRequest & { context?: VoiceContext }
      const userId = req.user?.id
      const sessionId = req.headers["x-session-id"] as string

      if (!audioData) {
        res.status(400).json({
          success: false,
          error: "Audio data is required",
        })
        return
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

      res.json(result)
    } catch (error) {
      console.error("Transcription error:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Process voice command
   */
  async processCommand(req: Request, res: Response): Promise<void> {
    try {
      const { audioData, text, language, context } = req.body
      const userId = req.user?.id
      const sessionId = (req.headers["x-session-id"] as string) || this.generateSessionId()

      let result: VoiceCommandResponse | undefined

      if (audioData) {
        // Process audio command
        result = await this.voiceCommandService.processVoiceCommand(
          typeof audioData === "string" ? audioData : Buffer.from(audioData),
          userId,
          sessionId,
          context,
          language
        )
      } else if (text) {
        // Process text command
        result = await this.voiceCommandService.processTextCommand(
          text,
          userId,
          sessionId,
          context,
          language
        )
      } else {
        res.status(400).json({
          success: false,
          error: "Either audioData or text is required",
        })
        return
      }

      res.json(result)
    } catch (error) {
      console.error("Command processing error:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(_req: Request, res: Response): Promise<void> {
    try {
      const languages = this.speechToTextService.getSupportedLanguages()
      res.json({
        success: true,
        languages,
      })
    } catch (error) {
      console.error("Error getting supported languages:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = this.speechToTextService.getProviderStats()
      const health = await this.speechToTextService.getProviderHealth()

      res.json({
        success: true,
        stats,
        health,
      })
    } catch (error) {
      console.error("Error getting provider stats:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Get session information
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId || (req.headers["x-session-id"] as string)

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: "Session ID is required",
        })
        return
      }

      const session = this.voiceCommandService.getSession(sessionId)

      if (!session) {
        res.status(404).json({
          success: false,
          error: "Session not found",
        })
        return
      }

      res.json({
        success: true,
        session,
      })
    } catch (error) {
      console.error("Error getting session:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Get voice service statistics
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const sessionStats = this.voiceCommandService.getSessionStats()
      const providerStats = this.speechToTextService.getProviderStats()
      const providerHealth = await this.speechToTextService.getProviderHealth()

      res.json({
        success: true,
        stats: {
          sessions: sessionStats,
          providers: providerStats,
          health: providerHealth,
        },
      })
    } catch (error) {
      console.error("Error getting stats:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const health = await this.speechToTextService.getProviderHealth()
      const hasHealthyProvider = Object.values(health).some((isHealthy) => isHealthy)

      res.status(hasHealthyProvider ? 200 : 503).json({
        success: hasHealthyProvider,
        health,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Health check error:", error)
      res.status(503).json({
        success: false,
        error: error instanceof Error ? error.message : "Service unavailable",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Upload audio file for processing
   */
  async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file
      const { language, context } = req.body
      const userId = req.user?.id
      const sessionId = (req.headers["x-session-id"] as string) || this.generateSessionId()

      if (!file) {
        res.status(400).json({
          success: false,
          error: "Audio file is required",
        })
        return
      }

      // Process uploaded audio file
      const result = await this.voiceCommandService.processVoiceCommand(
        file.buffer,
        userId,
        sessionId,
        context ? JSON.parse(context) : undefined,
        language
      )

      res.json(result)
    } catch (error) {
      console.error("Audio upload error:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions(_req: Request, res: Response): Promise<void> {
    try {
      this.voiceCommandService.cleanupSessions()

      res.json({
        success: true,
        message: "Sessions cleaned up successfully",
      })
    } catch (error) {
      console.error("Session cleanup error:", error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      })
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
