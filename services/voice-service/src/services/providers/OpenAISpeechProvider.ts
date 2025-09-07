import type {
  ProviderConfig,
  ProviderUsage,
  SpeechToTextProvider,
  VoiceRequest,
  VoiceResponse,
} from "../../models/index.js"

export class OpenAISpeechProvider implements SpeechToTextProvider {
  name = "openai"
  enabled = true
  priority = 1
  config: ProviderConfig
  private usage: ProviderUsage = {
    requestCount: 0,
    totalDuration: 0,
    errorCount: 0,
    costEstimate: 0,
  }

  constructor(config: ProviderConfig) {
    this.config = config
  }

  async transcribe(request: VoiceRequest): Promise<VoiceResponse> {
    const startTime = Date.now()

    try {
      this.usage.requestCount++

      // In a real implementation, this would use OpenAI Whisper API
      const response = await this.callOpenAIWhisperAPI(request)

      this.usage.lastUsed = new Date()
      this.usage.totalDuration += Date.now() - startTime
      this.usage.costEstimate = (this.usage.costEstimate || 0) + this.calculateCost(request)

      return response
    } catch (error) {
      this.usage.errorCount++
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if API key is configured
      if (!this.config.apiKey) {
        return false
      }

      // In production, this would test the API connection
      return true
    } catch {
      return false
    }
  }

  getUsage(): ProviderUsage {
    return { ...this.usage }
  }

  private async callOpenAIWhisperAPI(request: VoiceRequest): Promise<VoiceResponse> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock OpenAI Whisper API response
    const mockResponse = {
      text: this.generateMockTranscription(request),
      language: this.detectLanguage(request.language),
      duration: 2.8,
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0.0,
          end: 2.8,
          text: this.generateMockTranscription(request),
          tokens: [50364, 2425, 11, 577, 393, 286, 1037, 291, 30, 50464],
          temperature: 0.0,
          avg_logprob: -0.3,
          compression_ratio: 1.2,
          no_speech_prob: 0.1,
        },
      ],
      words: [
        {
          word: "hello",
          start: 0.0,
          end: 0.5,
          probability: 0.95,
        },
      ],
    }

    return this.parseOpenAIResponse(mockResponse, request)
  }

  private generateMockTranscription(request: VoiceRequest): string {
    const context = request.context?.type
    const language = request.language || "en-US"

    if (language.startsWith("th")) {
      switch (context) {
        case "search":
          return "ค้นหาที่พักให้เช่าในกรุงเทพ"
        case "listing":
          return "ต้องการสร้างประกาศใหม่"
        case "navigation":
          return "ไปที่หน้าหลัก"
        default:
          return "สวัสดีครับ ต้องการความช่วยเหลืออะไรครับ"
      }
    }

    switch (context) {
      case "search":
        return "Find rental properties in Bangkok"
      case "listing":
        return "I want to create a new property listing"
      case "navigation":
        return "Go to the main page"
      default:
        return "Hello, how can I assist you today?"
    }
  }

  private detectLanguage(requestedLanguage?: string): string {
    // OpenAI Whisper can auto-detect language
    if (requestedLanguage) {
      return requestedLanguage.split("-")[0] || requestedLanguage // Convert "en-US" to "en"
    }
    return "en" // Default to English
  }

  private parseOpenAIResponse(apiResponse: any, request: VoiceRequest): VoiceResponse {
    if (!apiResponse.text) {
      return {
        success: false,
        error: "No transcription text received",
      }
    }

    // Calculate confidence from segments
    const avgLogProb = apiResponse.segments?.[0]?.avg_logprob || -0.5
    const confidence = Math.max(0, Math.min(1, Math.exp(avgLogProb)))

    return {
      success: true,
      transcription: apiResponse.text.trim(),
      confidence,
      language: request.language || `${apiResponse.language}-${apiResponse.language.toUpperCase()}`,
      duration: apiResponse.duration,
      alternatives: [
        {
          text: apiResponse.text.trim(),
          confidence,
          words: apiResponse.words?.map((word: any) => ({
            word: word.word,
            startTime: word.start,
            endTime: word.end,
            confidence: word.probability,
          })),
        },
      ],
    }
  }

  private calculateCost(request: VoiceRequest): number {
    // OpenAI Whisper pricing: $0.006 per minute
    const audioSize = Buffer.isBuffer(request.audioData)
      ? request.audioData.length
      : Buffer.from(request.audioData, "base64").length

    // Rough estimate: 1KB ≈ 1 second of audio
    const estimatedDuration = audioSize / 1024
    const minutes = estimatedDuration / 60

    return minutes * 0.006
  }

  /**
   * Configure OpenAI settings
   */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get supported languages for OpenAI Whisper
   */
  getSupportedLanguages(): string[] {
    return [
      "th", // Thai
      "en", // English
      "zh", // Chinese
      "ja", // Japanese
      "ko", // Korean
      "vi", // Vietnamese
      "id", // Indonesian
      "ms", // Malay
      "tl", // Filipino
      "km", // Khmer
      "lo", // Lao
      "my", // Myanmar
      "es", // Spanish
      "fr", // French
      "de", // German
      "it", // Italian
      "pt", // Portuguese
      "ru", // Russian
      "ar", // Arabic
      "hi", // Hindi
      "tr", // Turkish
      "pl", // Polish
      "nl", // Dutch
      "sv", // Swedish
      "da", // Danish
      "no", // Norwegian
      "fi", // Finnish
      "cs", // Czech
      "sk", // Slovak
      "hu", // Hungarian
      "ro", // Romanian
      "bg", // Bulgarian
      "hr", // Croatian
      "sr", // Serbian
      "sl", // Slovenian
      "et", // Estonian
      "lv", // Latvian
      "lt", // Lithuanian
      "uk", // Ukrainian
      "be", // Belarusian
      "ka", // Georgian
      "am", // Amharic
      "az", // Azerbaijani
      "bn", // Bengali
      "bs", // Bosnian
      "ca", // Catalan
      "cy", // Welsh
      "eu", // Basque
      "fa", // Persian
      "gl", // Galician
      "gu", // Gujarati
      "ha", // Hausa
      "he", // Hebrew
      "is", // Icelandic
      "jw", // Javanese
      "kn", // Kannada
      "kk", // Kazakh
      "la", // Latin
      "ln", // Lingala
      "ml", // Malayalam
      "mr", // Marathi
      "mk", // Macedonian
      "mt", // Maltese
      "ne", // Nepali
      "nn", // Norwegian Nynorsk
      "ps", // Pashto
      "sa", // Sanskrit
      "sd", // Sindhi
      "si", // Sinhala
      "so", // Somali
      "sq", // Albanian
      "su", // Sundanese
      "sw", // Swahili
      "ta", // Tamil
      "te", // Telugu
      "tg", // Tajik
      "tk", // Turkmen
      "tl", // Tagalog
      "tt", // Tatar
      "ur", // Urdu
      "uz", // Uzbek
      "yo", // Yoruba
    ]
  }

  /**
   * Check if specific language is supported
   */
  supportsLanguage(languageCode?: string): boolean {
    if (!languageCode) return false
    const lang = languageCode.split("-")[0] || languageCode // Convert "en-US" to "en"
    return this.getSupportedLanguages().includes(lang)
  }

  /**
   * Get available Whisper models
   */
  getAvailableModels(): string[] {
    return [
      "whisper-1", // Current production model
    ]
  }
}
