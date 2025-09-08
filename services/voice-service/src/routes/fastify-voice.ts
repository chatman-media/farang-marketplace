import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { VoiceController } from "../controllers/VoiceController"
import authPlugin from "../middleware/auth"

const voiceController = new VoiceController()

export default async function voiceRoutes(fastify: FastifyInstance) {
  // Register auth middleware
  await fastify.register(authPlugin)

  // Register multipart support for file uploads
  await fastify.register(import("@fastify/multipart"), {
    limits: {
      fileSize: Number.parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10), // 10MB default
    },
  })

  /**
   * POST /speech-to-text
   * Convert speech to text
   */
  fastify.post("/speech-to-text", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await voiceController.transcribe(request as any, reply)
      return result
    } catch (error) {
      fastify.log.error(error as Error, "Speech to text error")
      reply.code(500)
      return {
        success: false,
        error: "Internal server error",
      }
    }
  })

  /**
   * POST /text-to-speech
   * Convert text to speech
   */
  fastify.post("/text-to-speech", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await voiceController.processCommand(request as any, reply)
      return result
    } catch (error) {
      fastify.log.error(error as Error, "Text to speech error")
      reply.code(500)
      return {
        success: false,
        error: "Internal server error",
      }
    }
  })

  /**
   * POST /voice-command
   * Process voice commands
   */
  fastify.post("/voice-command", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await voiceController.processCommand(request as any, reply)
      return result
    } catch (error) {
      fastify.log.error(error as Error, "Voice command error")
      reply.code(500)
      return {
        success: false,
        error: "Internal server error",
      }
    }
  })

  /**
   * GET /health
   * Health check endpoint
   */
  fastify.get("/health", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "voice-service",
    }
  })

  /**
   * GET /providers
   * Get available speech providers
   */
  fastify.get("/providers", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      success: true,
      providers: [
        {
          name: "openai",
          displayName: "OpenAI Whisper",
          capabilities: ["speech-to-text", "text-to-speech"],
          supported: true,
        },
        {
          name: "google",
          displayName: "Google Speech",
          capabilities: ["speech-to-text", "text-to-speech"],
          supported: true,
        },
        {
          name: "azure",
          displayName: "Azure Speech",
          capabilities: ["speech-to-text", "text-to-speech"],
          supported: true,
        },
        {
          name: "mock",
          displayName: "Mock Provider",
          capabilities: ["speech-to-text", "text-to-speech"],
          supported: true,
        },
      ],
    }
  })

  /**
   * GET /languages
   * Get supported languages
   */
  fastify.get("/languages", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.getSupportedLanguages(request as any, reply)
  })

  /**
   * GET /stats
   * Get service statistics
   */
  fastify.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.getStats(request as any, reply)
  })

  /**
   * GET /provider-stats
   * Get provider statistics
   */
  fastify.get("/provider-stats", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.getProviderStats(request as any, reply)
  })

  /**
   * GET /session/:sessionId
   * Get session information
   */
  fastify.get("/session/:sessionId", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.getSession(request as any, reply)
  })

  /**
   * POST /upload
   * Upload audio file for processing
   */
  fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.uploadAudio(request as any, reply)
  })

  /**
   * POST /cleanup
   * Cleanup expired sessions
   */
  fastify.post("/cleanup", async (request: FastifyRequest, reply: FastifyReply) => {
    return await voiceController.cleanupSessions(request as any, reply)
  })
}
