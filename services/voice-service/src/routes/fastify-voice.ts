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
  fastify.post(
    "/speech-to-text",
    {
      preHandler: [fastify.authenticateToken, fastify.voiceRateLimit, fastify.validateAudioFile],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await voiceController.transcribe(request as any, reply as any)
        return result
      } catch (error) {
        fastify.log.error(error as Error, "Speech to text error")
        reply.status(500)
        return {
          success: false,
          error: "Internal server error",
        }
      }
    },
  )

  /**
   * POST /text-to-speech
   * Convert text to speech
   */
  fastify.post(
    "/text-to-speech",
    {
      preHandler: [fastify.optionalAuth, fastify.voiceRateLimit, fastify.validateVoiceRequest],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await voiceController.processCommand(request as any, reply as any)
        return result
      } catch (error) {
        fastify.log.error(error as Error, "Text to speech error")
        reply.status(500)
        return {
          success: false,
          error: "Internal server error",
        }
      }
    },
  )

  /**
   * POST /voice-command
   * Process voice commands
   */
  fastify.post(
    "/voice-command",
    {
      preHandler: [fastify.authenticateToken, fastify.voiceRateLimit, fastify.validateVoiceRequest],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await voiceController.processCommand(request as any, reply as any)
        return result
      } catch (error) {
        fastify.log.error(error as Error, "Voice command error")
        reply.status(500)
        return {
          success: false,
          error: "Internal server error",
        }
      }
    },
  )

  /**
   * GET /health
   * Health check endpoint
   */
  fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
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
  fastify.get(
    "/providers",
    {
      preHandler: [fastify.optionalAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    },
  )
}
