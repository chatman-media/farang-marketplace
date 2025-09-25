import type { LanguageSupport, ProviderUsage, SpeechToTextProvider, VoiceRequest, VoiceResponse } from "../models/index"
import { loggingService } from "./LoggingService"
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
    const requestId = crypto.randomUUID()

    try {
      // Log voice request
      await loggingService.logVoiceRequest({
        userId: request.userId,
        sessionId: request.sessionId || "",
        audioLength: request.audioData ? (request.audioData as Buffer).length : undefined,
        language: request.language,
        provider: "", // Will be set after provider selection
        requestId,
        metadata: {
          format: request.format,
          sampleRate: request.sampleRate,
          channels: request.channels,
          encoding: request.encoding,
        },
      })

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

      const finalResponse = {
        ...response,
        processingTime: Date.now() - startTime,
        provider: provider.name,
      }

      // Log voice response
      await loggingService.logVoiceResponse({
        requestId,
        success: response.success,
        transcription: response.transcription,
        confidence: response.confidence,
        processingTime: Date.now() - startTime,
        error: response.error,
        provider: provider.name,
      })

      // Log voice analytics
      await loggingService.logVoiceAnalytics({
        userId: request.userId,
        sessionId: request.sessionId || "",
        commandType: "transcription",
        intent: "speech_to_text",
        language: request.language || "unknown",
        confidence: response.confidence || 0,
        processingTime: Date.now() - startTime,
        success: response.success,
        provider: provider.name,
        audioLength: request.audioData ? (request.audioData as Buffer).length : undefined,
        errorType: response.error ? "TRANSCRIPTION_FAILED" : undefined,
      })

      return finalResponse
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Update error statistics
      const provider = await this.getBestProvider(request.language)
      if (provider) {
        this.updateUsage(provider.name, Date.now() - startTime, false)
      }

      // Log failed response
      await loggingService.logVoiceResponse({
        requestId,
        success: false,
        processingTime: Date.now() - startTime,
        error: errorMessage,
        provider: provider?.name || "unknown",
      })

      // Log failed analytics
      await loggingService.logVoiceAnalytics({
        userId: request.userId,
        sessionId: request.sessionId || "",
        commandType: "transcription",
        intent: "speech_to_text",
        language: request.language || "unknown",
        confidence: 0,
        processingTime: Date.now() - startTime,
        success: false,
        provider: provider?.name || "unknown",
        audioLength: request.audioData ? (request.audioData as Buffer).length : undefined,
        errorType: "TRANSCRIPTION_FAILED",
      })

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

    return availableProviders.length > 0 ? availableProviders[0].provider : null
  }

  /**
   * Validate voice request
   */
  private validateRequest(request: VoiceRequest): void {
    if (!request.audioData) {
      throw new Error("Audio data is required")
    }

    if (request.audioData && (request.audioData as Buffer).length === 0) {
      throw new Error("Audio data cannot be empty")
    }

    if (request.audioData && (request.audioData as Buffer).length > 10 * 1024 * 1024) {
      throw new Error("Audio data too large (max 10MB)")
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
    }
  }

  /**
   * Get provider usage statistics
   */
  getProviderUsage(): Map<string, ProviderUsage> {
    return new Map(this.usage)
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageSupport[] {
    return [...this.supportedLanguages]
  }

  public getProviderStats(): Record<string, any> {
    return this.providerStats
  }

  public async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        health[providerName] = await provider.isHealthy()
      } catch {
        health[providerName] = false
      }
    }

    return health
  }

  public setProviderEnabled(providerName: string, enabled: boolean): boolean {
    if (!this.providers[providerName]) {
      return false
    }

    this.providerEnabled[providerName] = enabled
    return true
  }

  private async updateUsage(providerName: string, duration: number, success: boolean) {
    if (!this.providerStats[providerName]) {
      this.providerStats[providerName] = {
        requestCount: 0,
        totalDuration: 0,
        errorCount: 0,
        costEstimate: 0,
      }
    }

    this.providerStats[providerName].requestCount++
    this.providerStats[providerName].totalDuration += duration

    if (!success) {
      this.providerStats[providerName].errorCount++
    }

    // Simple cost estimation (can be refined based on actual provider pricing)
    this.providerStats[providerName].costEstimate += this.calculateCost(providerName, duration)
  }

  private calculateCost(providerName: string, duration: number): number {
    // Basic cost calculation - can be enhanced
    const costPerSecond = {
      azure: 0.001,
      google: 0.0008,
      openai: 0.0006,
      mock: 0,
    }

    return costPerSecond[providerName as keyof typeof costPerSecond] || 0 * (duration / 1000)
  }

  private getBestProvider(): string | null {
    const availableProviders = Object.keys(this.providers).filter((name) => this.providerEnabled[name])

    if (availableProviders.length === 0) {
      return null
    }

    // Simple round-robin for now
    const provider = availableProviders[this.currentProviderIndex]
    this.currentProviderIndex = (this.currentProviderIndex + 1) % availableProviders.length

    return provider
  }

  private validateRequest(request: VoiceTranscriptionRequest): { valid: boolean; error?: string } {
    if (!request.audioData || request.audioData.length === 0) {
      return { valid: false, error: "Audio data is required" }
    }

    const audioSize = Buffer.byteLength(request.audioData, "base64")
    const maxSize = parseInt(process.env.MAX_AUDIO_FILE_SIZE || "10485760") // 10MB default

    if (audioSize > maxSize) {
      return { valid: false, error: "Audio file too large" }
    }

    if (audioSize < 100) {
      return { valid: false, error: "Audio file too small" }
    }

    if (!this.supportedLanguages.includes(request.language)) {
      return { valid: false, error: `Language ${request.language} not supported` }
    }

    return { valid: true }
  }
}

// Add missing interface to providers
interface SpeechProvider {
  transcribe(audioData: string, language: string): Promise<TranscriptionResult>
  isHealthy(): Promise<boolean>
}
