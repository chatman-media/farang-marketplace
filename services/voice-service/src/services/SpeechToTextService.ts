import type { LanguageSupport, ProviderUsage, SpeechToTextProvider, VoiceRequest, VoiceResponse } from "../models/index"
import { AzureSpeechProvider } from "./providers/AzureSpeechProvider"
import { GoogleSpeechProvider } from "./providers/GoogleSpeechProvider"
import { MockSpeechProvider } from "./providers/MockSpeechProvider"
import { OpenAISpeechProvider } from "./providers/OpenAISpeechProvider"

export class SpeechToTextService {
  private providers: Map<string, SpeechToTextProvider> = new Map()
  private usage: Map<string, ProviderUsage> = new Map()
  private supportedLanguages: LanguageSupport[] = []

  constructor() {
    this.initializeProviders()
    this.initializeSupportedLanguages()
  }

  /**
   * Initialize speech-to-text providers
   */
  private initializeProviders(): void {
    // Initialize providers based on environment
    if (process.env.NODE_ENV === "test") {
      this.providers.set("mock", new MockSpeechProvider())
    } else {
      // Production providers
      if (process.env.GOOGLE_SPEECH_API_KEY && process.env.GOOGLE_CLOUD_PROJECT_ID) {
        this.providers.set(
          "google",
          new GoogleSpeechProvider({
            apiKey: process.env.GOOGLE_SPEECH_API_KEY,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          }),
        )
      }

      if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
        this.providers.set(
          "azure",
          new AzureSpeechProvider({
            apiKey: process.env.AZURE_SPEECH_KEY,
            region: process.env.AZURE_SPEECH_REGION,
          }),
        )
      }

      if (process.env.OPENAI_API_KEY) {
        this.providers.set(
          "openai",
          new OpenAISpeechProvider({
            apiKey: process.env.OPENAI_API_KEY,
            organization: process.env.OPENAI_ORGANIZATION,
          }),
        )
      }

      // Always add mock provider for testing
      this.providers.set("mock", new MockSpeechProvider())
    }

    // Initialize usage tracking
    for (const [name] of this.providers) {
      this.usage.set(name, {
        requestCount: 0,
        totalDuration: 0,
        errorCount: 0,
        costEstimate: 0,
      })
    }
  }

  /**
   * Initialize supported languages
   */
  private initializeSupportedLanguages(): void {
    this.supportedLanguages = [
      {
        code: "th-TH",
        name: "Thai",
        nativeName: "ไทย",
        enabled: true,
        confidence: 0.9,
        providers: ["google", "azure", "openai", "mock"],
      },
      {
        code: "en-US",
        name: "English (US)",
        nativeName: "English (US)",
        enabled: true,
        confidence: 0.95,
        providers: ["google", "azure", "openai", "mock"],
      },
      {
        code: "en-GB",
        name: "English (UK)",
        nativeName: "English (UK)",
        enabled: true,
        confidence: 0.9,
        providers: ["google", "azure", "mock"],
      },
      {
        code: "zh-CN",
        name: "Chinese (Simplified)",
        nativeName: "中文 (简体)",
        enabled: true,
        confidence: 0.85,
        providers: ["google", "azure", "mock"],
      },
      {
        code: "ja-JP",
        name: "Japanese",
        nativeName: "日本語",
        enabled: true,
        confidence: 0.85,
        providers: ["google", "azure", "mock"],
      },
      {
        code: "ko-KR",
        name: "Korean",
        nativeName: "한국어",
        enabled: true,
        confidence: 0.8,
        providers: ["google", "azure", "mock"],
      },
    ]
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(request: VoiceRequest): Promise<VoiceResponse> {
    const startTime = Date.now()

    try {
      // Validate request
      this.validateRequest(request)

      // Get best provider for language
      const provider = await this.getBestProvider(request.language)
      if (!provider) {
        throw new Error("No available speech-to-text provider")
      }

      // Perform transcription
      const response = await provider.transcribe(request)

      // Update usage statistics
      this.updateUsage(provider.name, Date.now() - startTime, true)

      return {
        ...response,
        processingTime: Date.now() - startTime,
        provider: provider.name,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Update error statistics
      const provider = await this.getBestProvider(request.language)
      if (provider) {
        this.updateUsage(provider.name, Date.now() - startTime, false)
      }

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Get best available provider for language
   */
  private async getBestProvider(language?: string): Promise<SpeechToTextProvider | null> {
    const lang = language || process.env.DEFAULT_LANGUAGE || "en-US"

    // In test environment, prefer mock provider
    if (process.env.NODE_ENV === "test" && this.providers.has("mock")) {
      const mockProvider = this.providers.get("mock")!
      if (mockProvider.enabled && (await mockProvider.isAvailable())) {
        return mockProvider
      }
    }

    // Get providers that support the language
    const supportedProviders = this.supportedLanguages.find((l) => l.code === lang)?.providers || []

    // Sort providers by priority and availability
    const availableProviders: Array<{ provider: SpeechToTextProvider; priority: number }> = []

    for (const [name, provider] of this.providers) {
      if (supportedProviders.includes(name) && provider.enabled) {
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          availableProviders.push({ provider, priority: provider.priority })
        }
      }
    }

    // Sort by priority (higher is better)
    availableProviders.sort((a, b) => b.priority - a.priority)

    return availableProviders[0]?.provider || null
  }

  /**
   * Validate transcription request
   */
  private validateRequest(request: VoiceRequest): void {
    if (!request.audioData) {
      throw new Error("Audio data is required")
    }

    // Check audio size
    const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760", 10)
    const audioSize = Buffer.isBuffer(request.audioData)
      ? request.audioData.length
      : Buffer.from(request.audioData, "base64").length

    if (audioSize > maxSize) {
      throw new Error(`Audio file too large. Maximum size: ${maxSize} bytes`)
    }

    if (audioSize < 100) {
      throw new Error("Audio file too small")
    }

    // Check language support
    if (request.language) {
      const isSupported = this.supportedLanguages.some((l) => l.code === request.language && l.enabled)
      if (!isSupported) {
        throw new Error(`Language ${request.language} is not supported`)
      }
    }
  }

  /**
   * Update provider usage statistics
   */
  private updateUsage(providerName: string, duration: number, success: boolean): void {
    const usage = this.usage.get(providerName)
    if (usage) {
      usage.requestCount++
      usage.totalDuration += duration
      if (!success) {
        usage.errorCount++
      }
      usage.lastUsed = new Date()

      // Estimate cost (mock calculation)
      usage.costEstimate = (usage.costEstimate || 0) + (duration / 1000) * 0.006 // $0.006 per second
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageSupport[] {
    return this.supportedLanguages.filter((lang) => lang.enabled)
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<string, ProviderUsage> {
    const stats: Record<string, ProviderUsage> = {}
    for (const [name, usage] of this.usage) {
      stats[name] = { ...usage }
    }
    return stats
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some((lang) => lang.code === languageCode && lang.enabled)
  }

  /**
   * Get available providers for language
   */
  getProvidersForLanguage(languageCode: string): string[] {
    const language = this.supportedLanguages.find((l) => l.code === languageCode)
    return language?.providers || []
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(providerName: string, enabled: boolean): boolean {
    const provider = this.providers.get(providerName)
    if (provider) {
      provider.enabled = enabled
      return true
    }
    return false
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.isAvailable()
      } catch {
        health[name] = false
      }
    }

    return health
  }
}
