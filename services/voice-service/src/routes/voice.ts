import { Router } from "express"
import multer from "multer"
import { VoiceController } from "../controllers/VoiceController"
import {
  authenticateToken,
  optionalAuth,
  validateAudioFile,
  validateVoiceRequest,
  voiceRateLimit,
} from "../middleware/auth"
import type { VoiceCommandResponse } from "../models/index"

const router = Router()
const voiceController = new VoiceController()

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/flac",
      "audio/ogg",
      "audio/webm",
      "audio/m4a",
      "audio/x-m4a",
    ]

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported audio format"))
    }
  },
})

// Apply rate limiting to all voice routes
router.use(voiceRateLimit(100, 60000)) // 100 requests per minute

/**
 * @route POST /api/voice/transcribe
 * @desc Transcribe audio to text
 * @access Public (with optional auth)
 */
router.post("/transcribe", optionalAuth, validateVoiceRequest, voiceController.transcribe.bind(voiceController))

/**
 * @route POST /api/voice/command
 * @desc Process voice command (audio or text)
 * @access Public (with optional auth)
 */
router.post("/command", optionalAuth, validateVoiceRequest, voiceController.processCommand.bind(voiceController))

/**
 * @route POST /api/voice/upload
 * @desc Upload audio file for processing
 * @access Public (with optional auth)
 */
router.post(
  "/upload",
  optionalAuth,
  upload.single("audio"),
  validateAudioFile,
  voiceController.uploadAudio.bind(voiceController),
)

/**
 * @route GET /api/voice/languages
 * @desc Get supported languages
 * @access Public
 */
router.get("/languages", voiceController.getSupportedLanguages.bind(voiceController))

/**
 * @route GET /api/voice/session/:sessionId?
 * @desc Get session information
 * @access Public (with optional auth)
 */
router.get("/session/:sessionId?", optionalAuth, voiceController.getSession.bind(voiceController))

/**
 * @route GET /api/voice/stats
 * @desc Get voice service statistics
 * @access Private (admin only)
 */
router.get("/stats", authenticateToken, voiceController.getStats.bind(voiceController))

/**
 * @route GET /api/voice/providers/stats
 * @desc Get provider statistics
 * @access Private (admin only)
 */
router.get("/providers/stats", authenticateToken, voiceController.getProviderStats.bind(voiceController))

/**
 * @route POST /api/voice/sessions/cleanup
 * @desc Clean up expired sessions
 * @access Private (admin only)
 */
router.post("/sessions/cleanup", authenticateToken, voiceController.cleanupSessions.bind(voiceController))

/**
 * @route GET /api/voice/health
 * @desc Health check endpoint
 * @access Public
 */
router.get("/health", voiceController.healthCheck.bind(voiceController))

// Voice search specific routes
/**
 * @route POST /api/voice/search
 * @desc Voice-powered search
 * @access Public (with optional auth)
 */
router.post("/search", optionalAuth, validateVoiceRequest, async (req, res) => {
  try {
    const { audioData, text, language } = req.body
    const userId = req.user?.id
    const sessionId = req.headers["x-session-id"] as string

    const context = {
      type: "search" as const,
      currentPage: req.headers.referer || "/search",
    }

    let result: VoiceCommandResponse
    if (audioData) {
      result = await voiceController.voiceCommandService.processVoiceCommand(
        typeof audioData === "string" ? audioData : Buffer.from(audioData),
        userId,
        sessionId,
        context,
        language,
      )
    } else if (text) {
      result = await voiceController.voiceCommandService.processTextCommand(text, userId, sessionId, context, language)
    } else {
      res.status(400).json({
        success: false,
        error: "Either audioData or text is required",
      })
      return
    }

    res.json(result)
  } catch (error) {
    console.error("Voice search error:", error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
})

// Voice listing creation routes
/**
 * @route POST /api/voice/listing/create
 * @desc Voice-assisted listing creation
 * @access Private (authenticated users only)
 */
router.post("/listing/create", authenticateToken, validateVoiceRequest, async (req, res) => {
  try {
    const { audioData, text, language } = req.body
    const userId = req.user?.id
    const sessionId = req.headers["x-session-id"] as string

    const context = {
      type: "listing" as const,
      currentPage: "/listings/create",
    }

    let result: VoiceCommandResponse
    if (audioData) {
      result = await voiceController.voiceCommandService.processVoiceCommand(
        typeof audioData === "string" ? audioData : Buffer.from(audioData),
        userId,
        sessionId,
        context,
        language,
      )
    } else if (text) {
      result = await voiceController.voiceCommandService.processTextCommand(text, userId, sessionId, context, language)
    } else {
      res.status(400).json({
        success: false,
        error: "Either audioData or text is required",
      })
      return
    }

    res.json(result)
  } catch (error) {
    console.error("Voice listing creation error:", error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
})

// Voice navigation routes
/**
 * @route POST /api/voice/navigate
 * @desc Voice navigation commands
 * @access Public (with optional auth)
 */
router.post("/navigate", optionalAuth, validateVoiceRequest, async (req, res) => {
  try {
    const { audioData, text, language } = req.body
    const userId = req.user?.id
    const sessionId = req.headers["x-session-id"] as string

    const context = {
      type: "navigation" as const,
      currentPage: req.headers.referer || "/",
    }

    let result: VoiceCommandResponse
    if (audioData) {
      result = await voiceController.voiceCommandService.processVoiceCommand(
        typeof audioData === "string" ? audioData : Buffer.from(audioData),
        userId,
        sessionId,
        context,
        language,
      )
    } else if (text) {
      result = await voiceController.voiceCommandService.processTextCommand(text, userId, sessionId, context, language)
    } else {
      res.status(400).json({
        success: false,
        error: "Either audioData or text is required",
      })
      return
    }

    res.json(result)
  } catch (error) {
    console.error("Voice navigation error:", error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
})

export default router
