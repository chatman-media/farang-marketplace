import type { 
  SpeechToTextProvider, 
  VoiceRequest, 
  VoiceResponse, 
  ProviderConfig, 
  ProviderUsage 
} from "../../models/index.js"

export class AzureSpeechProvider implements SpeechToTextProvider {
  name = "azure"
  enabled = true
  priority = 2
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

      // In a real implementation, this would use Azure Cognitive Services Speech SDK
      const response = await this.callAzureSpeechAPI(request)
      
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
      // Check if API key and region are configured
      if (!this.config.apiKey || !this.config.region) {
        return false
      }

      // In production, this would test the connection
      return true
    } catch {
      return false
    }
  }

  getUsage(): ProviderUsage {
    return { ...this.usage }
  }

  private async callAzureSpeechAPI(request: VoiceRequest): Promise<VoiceResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 250))

    // Mock Azure Speech API response
    const mockResponse = {
      RecognitionStatus: "Success",
      DisplayText: this.generateMockTranscription(request),
      Offset: 0,
      Duration: 30000000, // 3 seconds in ticks
      NBest: [
        {
          Confidence: 0.91,
          Lexical: this.generateMockTranscription(request).toLowerCase(),
          ITN: this.generateMockTranscription(request),
          MaskedITN: this.generateMockTranscription(request),
          Display: this.generateMockTranscription(request),
          Words: [
            {
              Word: "hello",
              Offset: 0,
              Duration: 5000000,
              Confidence: 0.95,
            },
          ],
        },
        {
          Confidence: 0.83,
          Display: "Alternative transcription",
        },
      ],
    }

    return this.parseAzureResponse(mockResponse, request)
  }

  private generateMockTranscription(request: VoiceRequest): string {
    const context = request.context?.type
    const language = request.language || "en-US"

    if (language.startsWith("th")) {
      switch (context) {
        case "search":
          return "หาบ้านให้เช่าในกรุงเทพ"
        case "listing":
          return "สร้างประกาศใหม่"
        case "navigation":
          return "ไปหน้าแรก"
        default:
          return "สวัสดีค่ะ"
      }
    }

    switch (context) {
      case "search":
        return "Search for rental properties in Bangkok"
      case "listing":
        return "Create a new property listing"
      case "navigation":
        return "Navigate to home page"
      default:
        return "Hello, what can I do for you?"
    }
  }

  private parseAzureResponse(apiResponse: any, request: VoiceRequest): VoiceResponse {
    if (apiResponse.RecognitionStatus !== "Success") {
      return {
        success: false,
        error: `Recognition failed: ${apiResponse.RecognitionStatus}`,
      }
    }

    const bestResult = apiResponse.NBest?.[0]
    if (!bestResult) {
      return {
        success: false,
        error: "No recognition results",
      }
    }

    return {
      success: true,
      transcription: bestResult.Display || apiResponse.DisplayText,
      confidence: bestResult.Confidence,
      language: request.language || "en-US",
      duration: this.ticksToSeconds(apiResponse.Duration),
      alternatives: apiResponse.NBest.map((result: any) => ({
        text: result.Display,
        confidence: result.Confidence,
        words: result.Words?.map((word: any) => ({
          word: word.Word,
          startTime: this.ticksToSeconds(word.Offset),
          endTime: this.ticksToSeconds(word.Offset + word.Duration),
          confidence: word.Confidence,
        })),
      })),
    }
  }

  private ticksToSeconds(ticks: number): number {
    // Azure uses 100-nanosecond ticks
    return ticks / 10000000
  }

  private calculateCost(request: VoiceRequest): number {
    // Azure Speech Services pricing (approximate)
    // Standard: $1 per hour of audio processed
    const audioSize = Buffer.isBuffer(request.audioData) 
      ? request.audioData.length 
      : Buffer.from(request.audioData, 'base64').length
    
    // Rough estimate: 1KB ≈ 1 second of audio
    const estimatedDuration = audioSize / 1024
    const hours = estimatedDuration / 3600
    
    return hours * 1.0
  }

  /**
   * Configure Azure Speech settings
   */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get supported languages for Azure Speech
   */
  getSupportedLanguages(): string[] {
    return [
      "th-TH", // Thai
      "en-US", // English (US)
      "en-GB", // English (UK)
      "zh-CN", // Chinese (Simplified)
      "ja-JP", // Japanese
      "ko-KR", // Korean
      "vi-VN", // Vietnamese
      "id-ID", // Indonesian
      "ms-MY", // Malay
      "tl-PH", // Filipino
      "km-KH", // Khmer
      "lo-LA", // Lao
      "my-MM", // Myanmar
    ]
  }

  /**
   * Check if specific language is supported
   */
  supportsLanguage(languageCode: string): boolean {
    return this.getSupportedLanguages().includes(languageCode)
  }

  /**
   * Get available Azure regions
   */
  getAvailableRegions(): string[] {
    return [
      "eastus",
      "eastus2", 
      "westus",
      "westus2",
      "centralus",
      "southcentralus",
      "westcentralus",
      "eastasia",
      "southeastasia",
      "japaneast",
      "japanwest",
      "koreacentral",
      "australiaeast",
      "canadacentral",
      "northeurope",
      "westeurope",
      "uksouth",
      "francecentral",
      "southafricanorth",
      "uaenorth",
    ]
  }
}
