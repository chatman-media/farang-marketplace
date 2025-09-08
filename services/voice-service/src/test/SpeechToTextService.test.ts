import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { SpeechToTextService } from "../services/SpeechToTextService"
import { createMockAudioBase64, createMockAudioBuffer, expectToBeWithinRange, mockVoiceRequest } from "./setup"

describe("Speech-to-Text Service Tests", () => {
  let speechToTextService: SpeechToTextService

  beforeEach(() => {
    speechToTextService = new SpeechToTextService()
  })

  afterEach(() => {
    // Clean up any resources
  })

  describe("Service Initialization", () => {
    it("should initialize with mock provider in test environment", () => {
      expect(speechToTextService).toBeDefined()

      const languages = speechToTextService.getSupportedLanguages()
      expect(languages).toBeDefined()
      expect(languages.length).toBeGreaterThan(0)
    })

    it("should support multiple languages", () => {
      const languages = speechToTextService.getSupportedLanguages()

      const languageCodes = languages.map((lang) => lang.code)
      expect(languageCodes).toContain("th-TH")
      expect(languageCodes).toContain("en-US")
      expect(languageCodes).toContain("en-GB")
    })

    it("should have enabled languages", () => {
      const languages = speechToTextService.getSupportedLanguages()

      languages.forEach((lang) => {
        expect(lang.enabled).toBe(true)
        expect(lang.confidence).toBeGreaterThan(0)
        expect(lang.providers).toBeDefined()
        expect(lang.providers.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Audio Transcription", () => {
    it("should transcribe audio buffer successfully", async () => {
      const audioBuffer = createMockAudioBuffer(2048)

      const request = {
        audioData: audioBuffer,
        language: "en-US",
        userId: "test-user",
        sessionId: "test-session",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
      expect(result.transcription?.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.language).toBe("en-US")
      expect(result.provider).toBeDefined()
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it("should transcribe base64 audio successfully", async () => {
      const audioBase64 = createMockAudioBase64(2048)

      const request = {
        audioData: audioBase64,
        language: "th-TH",
        userId: "test-user",
        sessionId: "test-session",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
      expect(result.language).toBe("th-TH")
      expect(result.alternatives).toBeDefined()
      expect(result.alternatives?.length).toBeGreaterThan(0)
    })

    it("should handle different audio formats", async () => {
      const request = {
        ...mockVoiceRequest,
        format: {
          container: "wav" as const,
          codec: "pcm",
          bitrate: 128,
          quality: "medium" as const,
        },
        sampleRate: 44100,
        channels: 1,
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
    })

    it("should provide word-level timing information", async () => {
      const result = await speechToTextService.transcribe(mockVoiceRequest)

      expect(result.success).toBe(true)
      expect(result.alternatives).toBeDefined()

      const firstAlternative = result.alternatives?.[0]
      if (firstAlternative?.words) {
        expect(firstAlternative.words.length).toBeGreaterThan(0)

        firstAlternative.words.forEach((word) => {
          expect(word.word).toBeDefined()
          expect(word.startTime).toBeGreaterThanOrEqual(0)
          expect(word.endTime).toBeGreaterThan(word.startTime)
          expect(word.confidence).toBeGreaterThan(0)
          expect(word.confidence).toBeLessThanOrEqual(1)
        })
      }
    })
  })

  describe("Language Support", () => {
    it("should check if language is supported", () => {
      expect(speechToTextService.isLanguageSupported("th-TH")).toBe(true)
      expect(speechToTextService.isLanguageSupported("en-US")).toBe(true)
      expect(speechToTextService.isLanguageSupported("xx-XX")).toBe(false)
    })

    it("should get providers for supported language", () => {
      const providers = speechToTextService.getProvidersForLanguage("en-US")
      expect(providers).toBeDefined()
      expect(providers.length).toBeGreaterThan(0)
      expect(providers).toContain("mock")
    })

    it("should return empty array for unsupported language", () => {
      const providers = speechToTextService.getProvidersForLanguage("xx-XX")
      expect(providers).toEqual([])
    })

    it("should use default language when none specified", async () => {
      const request = {
        audioData: createMockAudioBuffer(),
        userId: "test-user",
      }

      const result = await speechToTextService.transcribe(request)
      expect(result.success).toBe(true)
      expect(result.language).toBeDefined()
    })
  })

  describe("Error Handling", () => {
    it("should handle missing audio data", async () => {
      const request = {
        audioData: "",
        language: "en-US",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Audio data is required")
    })

    it("should handle audio file too large", async () => {
      const largeAudio = createMockAudioBuffer(20 * 1024 * 1024) // 20MB

      const request = {
        audioData: largeAudio,
        language: "en-US",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain("too large")
    })

    it("should handle audio file too small", async () => {
      const tinyAudio = createMockAudioBuffer(50) // 50 bytes

      const request = {
        audioData: tinyAudio,
        language: "en-US",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain("too small")
    })

    it("should handle unsupported language", async () => {
      const request = {
        audioData: createMockAudioBuffer(),
        language: "xx-XX",
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain("not supported")
    })

    it("should handle provider failures gracefully", async () => {
      // This test would require mocking provider failures
      // For now, we'll test that the service handles errors
      const request = {
        audioData: createMockAudioBuffer(),
        language: "en-US",
      }

      const result = await speechToTextService.transcribe(request)

      // Should either succeed or fail gracefully
      expect(result).toBeDefined()
      expect(typeof result.success).toBe("boolean")

      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe("Provider Management", () => {
    it("should get provider statistics", () => {
      const stats = speechToTextService.getProviderStats()

      expect(stats).toBeDefined()
      expect(typeof stats).toBe("object")

      // Should have at least the mock provider
      expect(Object.keys(stats).length).toBeGreaterThan(0)

      Object.values(stats).forEach((providerStats) => {
        expect(providerStats.requestCount).toBeGreaterThanOrEqual(0)
        expect(providerStats.totalDuration).toBeGreaterThanOrEqual(0)
        expect(providerStats.errorCount).toBeGreaterThanOrEqual(0)
        expect(providerStats.costEstimate).toBeGreaterThanOrEqual(0)
      })
    })

    it("should check provider health", async () => {
      const health = await speechToTextService.getProviderHealth()

      expect(health).toBeDefined()
      expect(typeof health).toBe("object")
      expect(Object.keys(health).length).toBeGreaterThan(0)

      // Mock provider should be healthy
      expect(health.mock).toBe(true)
    })

    it("should enable/disable providers", () => {
      const result = speechToTextService.setProviderEnabled("mock", false)
      expect(result).toBe(true)

      const invalidResult = speechToTextService.setProviderEnabled("nonexistent", false)
      expect(invalidResult).toBe(false)
    })
  })

  describe("Performance", () => {
    it("should process audio within reasonable time", async () => {
      const startTime = Date.now()

      const result = await speechToTextService.transcribe(mockVoiceRequest)

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(result.success).toBe(true)
      expect(processingTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.processingTime).toBeDefined()
      expectToBeWithinRange(result.processingTime!, processingTime, 0.5)
    })

    it("should handle concurrent requests", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          speechToTextService.transcribe({
            ...mockVoiceRequest,
            audioData: createMockAudioBuffer(),
          }),
        )

      const results = await Promise.all(requests)

      results.forEach((result) => {
        expect(result.success).toBe(true)
        expect(result.transcription).toBeDefined()
      })
    })
  })

  describe("Context-Aware Transcription", () => {
    it("should handle search context", async () => {
      const request = {
        ...mockVoiceRequest,
        context: {
          type: "search" as const,
          currentPage: "/search",
        },
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
    })

    it("should handle listing context", async () => {
      const request = {
        ...mockVoiceRequest,
        context: {
          type: "listing" as const,
          currentPage: "/listings/create",
        },
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
    })

    it("should handle navigation context", async () => {
      const request = {
        ...mockVoiceRequest,
        context: {
          type: "navigation" as const,
          currentPage: "/",
        },
      }

      const result = await speechToTextService.transcribe(request)

      expect(result.success).toBe(true)
      expect(result.transcription).toBeDefined()
    })
  })
})
