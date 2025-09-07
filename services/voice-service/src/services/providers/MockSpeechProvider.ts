import type { 
  SpeechToTextProvider, 
  VoiceRequest, 
  VoiceResponse, 
  ProviderConfig, 
  ProviderUsage 
} from "../../models/index.js"

export class MockSpeechProvider implements SpeechToTextProvider {
  name = "mock"
  enabled = true
  priority = 1
  config: ProviderConfig = {}
  private usage: ProviderUsage = {
    requestCount: 0,
    totalDuration: 0,
    errorCount: 0,
    costEstimate: 0,
  }

  async transcribe(request: VoiceRequest): Promise<VoiceResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100))

    this.usage.requestCount++
    this.usage.lastUsed = new Date()

    // Mock transcription based on context or return default
    const mockTranscriptions = this.getMockTranscriptions(request)
    const transcription = mockTranscriptions[0] || "Hello, this is a test transcription"

    return {
      success: true,
      transcription,
      confidence: 0.95,
      language: request.language || "en-US",
      duration: 2.5,
      alternatives: [
        {
          text: transcription,
          confidence: 0.95,
          words: this.generateMockWords(transcription),
        },
        {
          text: "Alternative transcription",
          confidence: 0.85,
        },
      ],
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  getUsage(): ProviderUsage {
    return { ...this.usage }
  }

  private getMockTranscriptions(request: VoiceRequest): string[] {
    const context = request.context?.type
    const language = request.language || "en-US"

    // Language-specific mock responses
    if (language === "th-TH") {
      switch (context) {
        case "search":
          return [
            "ค้นหาบ้านให้เช่าในกรุงเทพ",
            "หาคอนโดใกล้รถไฟฟ้า",
            "ต้องการห้องพักราคาไม่เกิน 15000 บาท",
          ]
        case "listing":
          return [
            "ต้องการลงประกาศขายบ้าน",
            "มีคอนโดให้เช่าในสุขุมวิท",
            "ห้องพักสำหรับนักศึกษา ราคา 8000 บาท",
          ]
        case "navigation":
          return [
            "ไปหน้าหลัก",
            "ดูประวัติการจอง",
            "เปิดโปรไฟล์ของฉัน",
          ]
        default:
          return ["สวัสดีครับ ต้องการความช่วยเหลืออะไรครับ"]
      }
    }

    // English mock responses
    switch (context) {
      case "search":
        return [
          "Find apartments for rent in Bangkok",
          "Search for condos near BTS",
          "Looking for rooms under 15000 baht",
          "Show me houses with 3 bedrooms",
          "Find properties in Sukhumvit area",
        ]
      case "listing":
        return [
          "I want to create a new listing",
          "Post my apartment for rent",
          "Add a new property listing",
          "Create listing for my condo",
          "List my house for sale",
        ]
      case "navigation":
        return [
          "Go to home page",
          "Show my bookings",
          "Open my profile",
          "Navigate to search",
          "Go back",
        ]
      case "booking":
        return [
          "Book this property",
          "Make a reservation",
          "Check availability",
          "Schedule a viewing",
          "Contact the owner",
        ]
      default:
        return [
          "Hello, how can I help you?",
          "What would you like to do?",
          "I'm listening",
        ]
    }
  }

  private generateMockWords(text: string): Array<{
    word: string
    startTime: number
    endTime: number
    confidence: number
  }> {
    const words = text.split(" ")
    let currentTime = 0
    
    return words.map(word => {
      const duration = word.length * 0.1 + 0.2 // Rough estimate
      const wordInfo = {
        word,
        startTime: currentTime,
        endTime: currentTime + duration,
        confidence: 0.9 + Math.random() * 0.1, // 0.9-1.0
      }
      currentTime += duration + 0.1 // Small pause between words
      return wordInfo
    })
  }

  /**
   * Simulate provider failure for testing
   */
  simulateFailure(): void {
    this.enabled = false
  }

  /**
   * Reset provider to working state
   */
  reset(): void {
    this.enabled = true
    this.usage = {
      requestCount: 0,
      totalDuration: 0,
      errorCount: 0,
      costEstimate: 0,
    }
  }

  /**
   * Set mock response for testing
   */
  setMockResponse(response: Partial<VoiceResponse>): void {
    this.mockResponse = response
  }

  private mockResponse?: Partial<VoiceResponse>

  /**
   * Override transcribe method for custom mock responses
   */
  async transcribeWithMockResponse(request: VoiceRequest): Promise<VoiceResponse> {
    if (this.mockResponse) {
      return {
        success: true,
        transcription: "Mock response",
        confidence: 0.95,
        language: request.language || "en-US",
        duration: 1.0,
        ...this.mockResponse,
      }
    }
    return this.transcribe(request)
  }
}
