import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { VoiceCommandService } from "../services/VoiceCommandService.js"
import { SpeechToTextService } from "../services/SpeechToTextService.js"
import { 
  createMockAudioBuffer, 
  mockVoiceRequest,
  mockSession,
  delay
} from "./setup.js"

describe("Voice Command Service Tests", () => {
  let voiceCommandService: VoiceCommandService
  let speechToTextService: SpeechToTextService

  beforeEach(() => {
    speechToTextService = new SpeechToTextService()
    voiceCommandService = new VoiceCommandService(speechToTextService)
  })

  afterEach(() => {
    // Clean up sessions
    voiceCommandService.cleanupSessions()
  })

  describe("Service Initialization", () => {
    it("should initialize with speech-to-text service", () => {
      expect(voiceCommandService).toBeDefined()
    })

    it("should generate unique session IDs", () => {
      const sessionId1 = voiceCommandService["generateSessionId"]()
      const sessionId2 = voiceCommandService["generateSessionId"]()
      
      expect(sessionId1).toBeDefined()
      expect(sessionId2).toBeDefined()
      expect(sessionId1).not.toBe(sessionId2)
    })

    it("should generate unique command IDs", () => {
      const commandId1 = voiceCommandService["generateCommandId"]()
      const commandId2 = voiceCommandService["generateCommandId"]()
      
      expect(commandId1).toBeDefined()
      expect(commandId2).toBeDefined()
      expect(commandId1).not.toBe(commandId2)
    })
  })

  describe("Voice Command Processing", () => {
    it("should process voice command from audio", async () => {
      const audioBuffer = createMockAudioBuffer(2048)
      
      const result = await voiceCommandService.processVoiceCommand(
        audioBuffer,
        "test-user",
        "test-session",
        { type: "search", currentPage: "/search" },
        "en-US"
      )

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.action).toBeDefined()
    })

    it("should handle audio transcription failure", async () => {
      const emptyAudio = Buffer.alloc(0)
      
      const result = await voiceCommandService.processVoiceCommand(
        emptyAudio,
        "test-user",
        "test-session",
        { type: "search" },
        "en-US"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe("Text Command Processing", () => {
    it("should process search commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Find apartments for rent in Bangkok",
        "test-user",
        "test-session",
        { type: "search" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("search")
      expect(result.data).toBeDefined()
      expect(result.data.query).toContain("apartments")
      expect(result.redirectUrl).toContain("/search")
    })

    it("should process navigation commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Go to home page",
        "test-user",
        "test-session",
        { type: "navigation" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("navigate")
      expect(result.redirectUrl).toBeDefined()
    })

    it("should process listing creation commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Create a new listing",
        "test-user",
        "test-session",
        { type: "listing" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("start_listing_creation")
      expect(result.redirectUrl).toContain("/listings/create")
    })

    it("should process booking commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Book this property",
        "test-user",
        "test-session",
        { type: "booking" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("book_service")
      expect(result.redirectUrl).toContain("/bookings")
    })

    it("should process help commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Help me",
        "test-user",
        "test-session",
        { type: "general" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("help")
      expect(result.data.availableCommands).toBeDefined()
    })

    it("should process confirmation commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Yes, confirm",
        "test-user",
        "test-session",
        { type: "general" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("confirm")
    })

    it("should process cancellation commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Cancel",
        "test-user",
        "test-session",
        { type: "general" },
        "en-US"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("cancel")
    })

    it("should handle unknown commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "xyzabc123 random gibberish text",
        "test-user",
        "test-session",
        { type: "general" },
        "en-US"
      )

      expect(result.success).toBe(false)
      expect(result.action).toBe("unknown")
      expect(result.error).toContain("not recognized")
    })
  })

  describe("Multi-language Support", () => {
    it("should process Thai search commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "ค้นหาคอนโดให้เช่าในกรุงเทพ",
        "test-user",
        "test-session",
        { type: "search" },
        "th-TH"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("search")
      expect(result.speechText).toContain("กำลังค้นหา")
    })

    it("should process Thai navigation commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "ไปหน้าหลัก",
        "test-user",
        "test-session",
        { type: "navigation" },
        "th-TH"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("navigate")
      expect(result.speechText).toContain("กำลัง")
    })

    it("should process Thai listing commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "สร้างประกาศใหม่",
        "test-user",
        "test-session",
        { type: "listing" },
        "th-TH"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("start_listing_creation")
      expect(result.speechText).toContain("เริ่มสร้างประกาศ")
    })

    it("should process Thai help commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "ช่วยเหลือ",
        "test-user",
        "test-session",
        { type: "general" },
        "th-TH"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("help")
      expect(result.speechText).toContain("ฉันสามารถช่วย")
    })
  })

  describe("Intent Recognition", () => {
    it("should recognize search intent with high confidence", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Find houses for sale",
        "test-user",
        "test-session"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("search")
    })

    it("should recognize navigation intent", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Navigate to my profile",
        "test-user",
        "test-session"
      )

      expect(result.success).toBe(true)
      expect(result.action).toBe("navigate")
    })

    it("should extract entities from commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Find apartments under 20000 baht in Sukhumvit",
        "test-user",
        "test-session",
        { type: "search" }
      )

      expect(result.success).toBe(true)
      expect(result.data.filters).toBeDefined()
      expect(result.data.filters.location.toLowerCase()).toContain("sukhumvit")
      expect(result.data.filters.priceRange).toBeDefined()
    })
  })

  describe("Session Management", () => {
    it("should create and manage sessions", async () => {
      const sessionId = "test-session-123"
      
      await voiceCommandService.processTextCommand(
        "Hello",
        "test-user",
        sessionId,
        { type: "general" },
        "en-US"
      )

      const session = voiceCommandService.getSession(sessionId)
      
      expect(session).toBeDefined()
      expect(session!.id).toBe(sessionId)
      expect(session!.userId).toBe("test-user")
      expect(session!.commands.length).toBe(1)
    })

    it("should track command history in sessions", async () => {
      const sessionId = "test-session-history"
      
      await voiceCommandService.processTextCommand(
        "Find apartments",
        "test-user",
        sessionId
      )
      
      await voiceCommandService.processTextCommand(
        "Go to home",
        "test-user",
        sessionId
      )

      const session = voiceCommandService.getSession(sessionId)
      
      expect(session).toBeDefined()
      expect(session!.commands.length).toBe(2)
      expect(session?.commands[0]?.command).toContain("apartments")
      expect(session?.commands[1]?.command).toContain("home")
    })

    it("should update session activity time", async () => {
      const sessionId = "test-session-activity"
      const startTime = new Date()
      
      await delay(100) // Small delay
      
      await voiceCommandService.processTextCommand(
        "Test command",
        "test-user",
        sessionId
      )

      const session = voiceCommandService.getSession(sessionId)
      
      expect(session).toBeDefined()
      expect(session!.lastActivity.getTime()).toBeGreaterThan(startTime.getTime())
    })

    it("should get session statistics", () => {
      const stats = voiceCommandService.getSessionStats()
      
      expect(stats).toBeDefined()
      expect(stats.totalSessions).toBeGreaterThanOrEqual(0)
      expect(stats.activeSessions).toBeGreaterThanOrEqual(0)
      expect(stats.totalCommands).toBeGreaterThanOrEqual(0)
    })

    it("should clean up expired sessions", async () => {
      // Create a session
      await voiceCommandService.processTextCommand(
        "Test",
        "test-user",
        "test-session-cleanup"
      )

      let session = voiceCommandService.getSession("test-session-cleanup")
      expect(session).toBeDefined()

      // Manually set old activity time
      if (session) {
        session.lastActivity = new Date(Date.now() - 35 * 60 * 1000) // 35 minutes ago
      }

      // Clean up sessions
      voiceCommandService.cleanupSessions()

      // Session should be removed
      session = voiceCommandService.getSession("test-session-cleanup")
      expect(session).toBeUndefined()
    })
  })

  describe("Listing Creation Flow", () => {
    it("should handle listing creation flow", async () => {
      const sessionId = "test-listing-flow"
      
      // Start listing creation
      const startResult = await voiceCommandService.processTextCommand(
        "Create a new listing",
        "test-user",
        sessionId,
        { type: "listing" }
      )

      expect(startResult.success).toBe(true)
      expect(startResult.action).toBe("start_listing_creation")

      const session = voiceCommandService.getSession(sessionId)
      expect(session?.state?.currentFlow).toBe("listing_creation")
      expect(session?.state?.step).toBe("start")

      // Confirm to proceed
      const confirmResult = await voiceCommandService.processTextCommand(
        "Yes",
        "test-user",
        sessionId,
        { type: "listing" }
      )

      expect(confirmResult.success).toBe(true)
      expect(confirmResult.action).toBe("listing_creation_next")
    })

    it("should handle listing creation cancellation", async () => {
      const sessionId = "test-listing-cancel"
      
      // Start listing creation
      await voiceCommandService.processTextCommand(
        "Create a new listing",
        "test-user",
        sessionId,
        { type: "listing" }
      )

      // Cancel
      const cancelResult = await voiceCommandService.processTextCommand(
        "Cancel",
        "test-user",
        sessionId,
        { type: "listing" }
      )

      expect(cancelResult.success).toBe(true)
      expect(cancelResult.action).toBe("cancel")

      const session = voiceCommandService.getSession(sessionId)
      expect(session?.state?.awaitingInput).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("should handle empty text commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "",
        "test-user",
        "test-session"
      )

      expect(result.success).toBe(false)
      expect(result.action).toBe("unknown")
    })

    it("should handle very long commands", async () => {
      const longCommand = "a".repeat(10000)
      
      const result = await voiceCommandService.processTextCommand(
        longCommand,
        "test-user",
        "test-session"
      )

      expect(result).toBeDefined()
      expect(typeof result.success).toBe("boolean")
    })

    it("should handle special characters in commands", async () => {
      const result = await voiceCommandService.processTextCommand(
        "Find @#$%^&*() properties",
        "test-user",
        "test-session"
      )

      expect(result).toBeDefined()
      expect(typeof result.success).toBe("boolean")
    })
  })

  describe("Performance", () => {
    it("should process commands quickly", async () => {
      const startTime = Date.now()
      
      const result = await voiceCommandService.processTextCommand(
        "Find apartments",
        "test-user",
        "test-session"
      )
      
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(processingTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it("should handle concurrent command processing", async () => {
      const commands = [
        "Find apartments",
        "Go to home",
        "Create listing",
        "Help me",
        "Search for houses",
      ]

      const promises = commands.map((command, index) =>
        voiceCommandService.processTextCommand(
          command,
          "test-user",
          `test-session-${index}`
        )
      )

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result.success).toBe("boolean")
      })
    })
  })
})
