import type {
  VoiceCommand,
  VoiceCommandResponse,
  VoiceContext,
  VoiceEntity,
  VoiceIntent,
  VoiceIntentType,
  VoiceSession,
} from "../models/index.js"
import type { SpeechToTextService } from "./SpeechToTextService.js"

export class VoiceCommandService {
  private speechToTextService: SpeechToTextService
  private sessions: Map<string, VoiceSession> = new Map()
  private intentPatterns: Map<VoiceIntentType, RegExp[]> = new Map()

  constructor(speechToTextService: SpeechToTextService) {
    this.speechToTextService = speechToTextService
    this.initializeIntentPatterns()
  }

  /**
   * Process voice command from audio
   */
  async processVoiceCommand(
    audioData: Buffer | string,
    userId?: string,
    sessionId?: string,
    context?: VoiceContext,
    language?: string
  ): Promise<VoiceCommandResponse> {
    try {
      // Transcribe audio to text
      const transcriptionResult = await this.speechToTextService.transcribe({
        audioData,
        ...(language && { language }),
        ...(userId && { userId }),
        ...(sessionId && { sessionId }),
        ...(context && { context }),
      })

      if (!transcriptionResult.success || !transcriptionResult.transcription) {
        return {
          action: "error",
          success: false,
          error: transcriptionResult.error || "Failed to transcribe audio",
        }
      }

      // Process the transcribed text as a command
      return this.processTextCommand(
        transcriptionResult.transcription,
        userId,
        sessionId,
        context,
        language
      )
    } catch (error) {
      return {
        action: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Process text command directly
   */
  async processTextCommand(
    text: string,
    userId?: string,
    sessionId?: string,
    context?: VoiceContext,
    language?: string
  ): Promise<VoiceCommandResponse> {
    const session = this.getOrCreateSession(sessionId || this.generateSessionId(), userId, language)

    // Analyze intent and entities
    const intent = this.analyzeIntent(text, language)
    const entities = this.extractEntities(text, language)

    // Create voice command record
    const command: VoiceCommand = {
      id: this.generateCommandId(),
      command: text,
      intent,
      entities,
      confidence: intent.confidence,
      language: language || "en-US",
      userId: userId || "anonymous",
      sessionId: session.id,
      timestamp: new Date(),
      ...(context && { context }),
    }

    // Update session
    session.commands.push(command)
    session.lastActivity = new Date()
    if (context) {
      session.context = context
    }

    // Execute command based on intent
    const response = await this.executeCommand(command, session)
    command.response = response

    return response
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): void {
    // Search patterns
    this.intentPatterns.set("search", [
      /(?:find|search|look for|show me)\s+(.+)/i,
      /(?:ค้นหา|หา|แสดง)\s*(.+)/i, // Thai
      /(?:找|搜索|寻找)\s*(.+)/i, // Chinese
      /(?:探す|検索)\s*(.+)/i, // Japanese
      /(?:찾기|검색)\s*(.+)/i, // Korean
    ])

    // Navigation patterns
    this.intentPatterns.set("navigate", [
      /(?:go to|navigate to|open|show)\s+(.+)/i,
      /(?:ไป|เปิด|แสดง)\s*(.+)/i, // Thai
      /(?:去|打开|显示)\s*(.+)/i, // Chinese
      /(?:行く|開く|表示)\s*(.+)/i, // Japanese
      /(?:가기|열기|보기)\s*(.+)/i, // Korean
    ])

    // Listing creation patterns
    this.intentPatterns.set("create_listing", [
      /(?:create|add|post|list)\s+(?:a\s+)?(?:new\s+)?(?:listing|property|ad)/i,
      /(?:สร้าง|เพิ่ม|ลง).*(?:ประกาศ|รายการ)/i, // Thai
      /(?:创建|添加|发布).*(?:列表|房产|广告)/i, // Chinese
      /(?:作成|追加|投稿).*(?:リスト|物件|広告)/i, // Japanese
      /(?:만들기|추가|게시).*(?:목록|부동산|광고)/i, // Korean
    ])

    // Booking patterns
    this.intentPatterns.set("book_service", [
      /(?:book|reserve|schedule)\s+(.+)/i,
      /(?:จอง|ขอจอง)\s*(.+)/i, // Thai
      /(?:预订|预约)\s*(.+)/i, // Chinese
      /(?:予約|予約する)\s*(.+)/i, // Japanese
      /(?:예약|예약하기)\s*(.+)/i, // Korean
    ])

    // Help patterns
    this.intentPatterns.set("help", [
      /(?:help|what can you do|how to|guide)/i,
      /(?:ช่วย|ช่วยเหลือ|ทำอย่างไร)/i, // Thai
      /(?:帮助|怎么|如何)/i, // Chinese
      /(?:ヘルプ|助けて|どうやって)/i, // Japanese
      /(?:도움|도움말|어떻게)/i, // Korean
    ])

    // Confirmation patterns
    this.intentPatterns.set("confirm", [
      /(?:yes|ok|okay|confirm|sure|proceed)/i,
      /(?:ใช่|ตกลง|ยืนยัน|ได้)/i, // Thai
      /(?:是|好|确认|可以)/i, // Chinese
      /(?:はい|いいえ|確認|大丈夫)/i, // Japanese
      /(?:네|좋아|확인|괜찮아)/i, // Korean
    ])

    // Cancel patterns
    this.intentPatterns.set("cancel", [
      /(?:no|cancel|stop|abort|nevermind)/i,
      /(?:ไม่|ยกเลิก|หยุด|ไม่เป็นไร)/i, // Thai
      /(?:不|取消|停止|算了)/i, // Chinese
      /(?:いいえ|キャンセル|停止|やめる)/i, // Japanese
      /(?:아니|취소|중지|그만)/i, // Korean
    ])
  }

  /**
   * Analyze intent from text
   */
  private analyzeIntent(text: string, _language?: string): VoiceIntent {
    const normalizedText = text.toLowerCase().trim()

    for (const [intentType, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern)
        if (match) {
          return {
            name: intentType,
            confidence: 0.8 + Math.random() * 0.15, // 0.8-0.95
            parameters: match.length > 1 ? { query: match[1]?.trim() } : {},
          }
        }
      }
    }

    // Default to unknown intent
    return {
      name: "unknown",
      confidence: 0.1,
      parameters: { originalText: text },
    }
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string, _language?: string): VoiceEntity[] {
    const entities: VoiceEntity[] = []
    const normalizedText = text.toLowerCase()

    // Extract common entities
    const entityPatterns = [
      // Locations
      {
        type: "location",
        patterns: [/(?:in|at|near)\s+([a-zA-Z\s]+)/gi, /(?:ใน|ที่|ใกล้)\s*([ก-๙\s]+)/gi],
      },
      // Prices
      { type: "price", patterns: [/(\d+(?:,\d{3})*)\s*(?:baht|บาท|dollars?|\$)/gi] },
      // Numbers
      { type: "number", patterns: [/(\d+)/g] },
      // Property types
      { type: "property_type", patterns: [/(condo|apartment|house|room|studio|บ้าน|คอนโด|ห้อง)/gi] },
    ]

    for (const { type, patterns } of entityPatterns) {
      for (const pattern of patterns) {
        const matches = normalizedText.matchAll(pattern)
        for (const match of matches) {
          if (match[1]) {
            entities.push({
              type,
              value: match[1].trim(),
              confidence: 0.7 + Math.random() * 0.2,
              startIndex: match.index || 0,
              endIndex: match.index ? match.index + match[0].length : 0,
            })
          }
        }
      }
    }

    return entities
  }

  /**
   * Execute command based on intent
   */
  private async executeCommand(
    command: VoiceCommand,
    session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    switch (command.intent.name) {
      case "search":
        return this.executeSearchCommand(command, session)
      case "navigate":
        return this.executeNavigationCommand(command, session)
      case "create_listing":
        return this.executeListingCreationCommand(command, session)
      case "book_service":
        return this.executeBookingCommand(command, session)
      case "help":
        return this.executeHelpCommand(command, session)
      case "confirm":
        return this.executeConfirmCommand(command, session)
      case "cancel":
        return this.executeCancelCommand(command, session)
      default:
        return this.executeUnknownCommand(command, session)
    }
  }

  /**
   * Execute search command
   */
  private async executeSearchCommand(
    command: VoiceCommand,
    _session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    const query = command.intent.parameters?.query || command.command
    const location = command.entities.find((e) => e.type === "location")?.value
    const priceEntity = command.entities.find((e) => e.type === "price")?.value
    const propertyType = command.entities.find((e) => e.type === "property_type")?.value

    // Build search filters
    const filters: any = {}
    if (location) filters.location = location
    if (priceEntity) {
      const price = parseInt(priceEntity.replace(/[^\d]/g, ""), 10)
      filters.priceRange = { min: 0, max: price }
    }
    if (propertyType) filters.category = propertyType

    return {
      action: "search",
      data: {
        query,
        filters,
      },
      speechText: this.generateSpeechResponse("search", command.language, {
        query,
        location,
        propertyType,
      }),
      redirectUrl: `/search?q=${encodeURIComponent(query)}${location ? `&location=${encodeURIComponent(location)}` : ""}`,
      success: true,
    }
  }

  /**
   * Execute navigation command
   */
  private async executeNavigationCommand(
    command: VoiceCommand,
    _session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    const target = command.intent.parameters?.query?.toLowerCase() || ""

    const navigationMap: Record<string, string> = {
      home: "/",
      หน้าหลัก: "/",
      หน้าแรก: "/",
      search: "/search",
      ค้นหา: "/search",
      profile: "/profile",
      โปรไฟล์: "/profile",
      bookings: "/bookings",
      การจอง: "/bookings",
      listings: "/listings",
      ประกาศ: "/listings",
      back: "back",
      กลับ: "back",
    }

    const url = navigationMap[target] || "/"

    return {
      action: "navigate",
      data: { target, url },
      speechText: this.generateSpeechResponse("navigate", command.language, { target }),
      redirectUrl: url,
      success: true,
    }
  }

  /**
   * Execute listing creation command
   */
  private async executeListingCreationCommand(
    command: VoiceCommand,
    session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    // Update session state for listing creation flow
    session.state = {
      currentFlow: "listing_creation",
      step: "start",
      data: {},
      awaitingInput: true,
      lastIntent: "create_listing",
    }

    return {
      action: "start_listing_creation",
      data: { step: "start" },
      speechText: this.generateSpeechResponse("create_listing", command.language),
      redirectUrl: "/listings/create",
      success: true,
    }
  }

  /**
   * Execute booking command
   */
  private async executeBookingCommand(
    command: VoiceCommand,
    _session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    const query = command.intent.parameters?.query || ""

    return {
      action: "book_service",
      data: { query },
      speechText: this.generateSpeechResponse("book_service", command.language, { query }),
      redirectUrl: "/bookings/create",
      success: true,
    }
  }

  /**
   * Execute help command
   */
  private async executeHelpCommand(
    command: VoiceCommand,
    _session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    return {
      action: "help",
      data: {
        availableCommands: [
          "Search for properties",
          "Navigate to different pages",
          "Create new listings",
          "Book services",
          "Get help",
        ],
      },
      speechText: this.generateSpeechResponse("help", command.language),
      success: true,
    }
  }

  /**
   * Execute confirm command
   */
  private async executeConfirmCommand(
    command: VoiceCommand,
    session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    if (session.state?.awaitingInput) {
      // Handle confirmation based on current flow
      switch (session.state.currentFlow) {
        case "listing_creation":
          return this.handleListingCreationConfirm(session)
        case "booking":
          return this.handleBookingConfirm(session)
        default:
          return {
            action: "confirm",
            speechText: this.generateSpeechResponse("confirm", command.language),
            success: true,
          }
      }
    }

    return {
      action: "confirm",
      speechText: this.generateSpeechResponse("confirm", command.language),
      success: true,
    }
  }

  /**
   * Execute cancel command
   */
  private async executeCancelCommand(
    command: VoiceCommand,
    session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    // Reset session state
    session.state = {
      awaitingInput: false,
    }

    return {
      action: "cancel",
      speechText: this.generateSpeechResponse("cancel", command.language),
      success: true,
    }
  }

  /**
   * Execute unknown command
   */
  private async executeUnknownCommand(
    command: VoiceCommand,
    _session: VoiceSession
  ): Promise<VoiceCommandResponse> {
    return {
      action: "unknown",
      data: { originalCommand: command.command },
      speechText: this.generateSpeechResponse("unknown", command.language),
      success: false,
      error: "Command not recognized",
    }
  }

  /**
   * Generate speech response text
   */
  private generateSpeechResponse(action: string, language?: string, params?: any): string {
    const lang = language?.startsWith("th") ? "th" : "en"

    const responses: Record<string, Record<string, string>> = {
      search: {
        en: params?.query
          ? `Searching for ${params.query}${params.location ? ` in ${params.location}` : ""}`
          : "Starting search",
        th: params?.query
          ? `กำลังค้นหา ${params.query}${params.location ? ` ใน ${params.location}` : ""}`
          : "เริ่มการค้นหา",
      },
      navigate: {
        en: params?.target ? `Navigating to ${params.target}` : "Navigating",
        th: params?.target ? `กำลังไปที่ ${params.target}` : "กำลังนำทาง",
      },
      create_listing: {
        en: "Starting listing creation. What type of property would you like to list?",
        th: "เริ่มสร้างประกาศ คุณต้องการลงประกาศอสังหาริมทรัพย์ประเภทใด?",
      },
      book_service: {
        en: params?.query ? `Booking ${params.query}` : "Starting booking process",
        th: params?.query ? `กำลังจอง ${params.query}` : "เริ่มกระบวนการจอง",
      },
      help: {
        en: "I can help you search for properties, navigate the site, create listings, and book services. What would you like to do?",
        th: "ฉันสามารถช่วยคุณค้นหาอสังหาริมทรัพย์ นำทางเว็บไซต์ สร้างประกาศ และจองบริการได้ คุณต้องการทำอะไร?",
      },
      confirm: {
        en: "Confirmed",
        th: "ยืนยันแล้ว",
      },
      cancel: {
        en: "Cancelled",
        th: "ยกเลิกแล้ว",
      },
      unknown: {
        en: "I didn't understand that. Please try again or say 'help' for available commands.",
        th: "ฉันไม่เข้าใจ กรุณาลองใหม่หรือพูดว่า 'ช่วย' เพื่อดูคำสั่งที่ใช้ได้",
      },
    }

    return responses[action]?.[lang] || responses[action]?.en || "Command processed"
  }

  /**
   * Handle listing creation confirmation
   */
  private async handleListingCreationConfirm(session: VoiceSession): Promise<VoiceCommandResponse> {
    const currentStep = session.state?.step || "start"

    // Progress to next step in listing creation
    const nextSteps: Record<string, string> = {
      start: "title",
      title: "description",
      description: "category",
      category: "price",
      price: "location",
      location: "confirm",
    }

    const nextStep = nextSteps[currentStep]
    if (nextStep) {
      session.state!.step = nextStep
      return {
        action: "listing_creation_next",
        data: { step: nextStep },
        speechText: this.getListingCreationPrompt(nextStep, session.language),
        success: true,
      }
    }

    return {
      action: "listing_creation_complete",
      speechText: this.generateSpeechResponse("confirm", session.language),
      redirectUrl: "/listings",
      success: true,
    }
  }

  /**
   * Handle booking confirmation
   */
  private async handleBookingConfirm(session: VoiceSession): Promise<VoiceCommandResponse> {
    return {
      action: "booking_confirmed",
      speechText: this.generateSpeechResponse("confirm", session.language),
      redirectUrl: "/bookings",
      success: true,
    }
  }

  /**
   * Get listing creation prompt for step
   */
  private getListingCreationPrompt(step: string, language?: string): string {
    const lang = language?.startsWith("th") ? "th" : "en"

    const prompts: Record<string, Record<string, string>> = {
      title: {
        en: "What's the title for your listing?",
        th: "หัวข้อของประกาศคืออะไร?",
      },
      description: {
        en: "Please describe your property",
        th: "กรุณาอธิบายอสังหาริมทรัพย์ของคุณ",
      },
      category: {
        en: "What type of property is this? House, condo, apartment, or room?",
        th: "อสังหาริมทรัพย์ประเภทใด? บ้าน คอนโด อพาร์ตเมนต์ หรือห้อง?",
      },
      price: {
        en: "What's the price?",
        th: "ราคาเท่าไหร่?",
      },
      location: {
        en: "Where is the property located?",
        th: "อสังหาริมทรัพย์อยู่ที่ไหน?",
      },
      confirm: {
        en: "Please confirm your listing details",
        th: "กรุณายืนยันรายละเอียดประกาศของคุณ",
      },
    }

    return prompts[step]?.[lang] || prompts[step]?.en || "Please continue"
  }

  /**
   * Get or create session
   */
  private getOrCreateSession(sessionId: string, userId?: string, language?: string): VoiceSession {
    let session = this.sessions.get(sessionId)

    if (!session) {
      session = {
        id: sessionId,
        userId: userId || "anonymous",
        startTime: new Date(),
        lastActivity: new Date(),
        language: language || "en-US",
        context: { type: "general" },
        commands: [],
        state: {},
      }
      this.sessions.set(sessionId, session)
    }

    return session
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const now = new Date()
    const maxAge = 30 * 60 * 1000 // 30 minutes

    for (const [sessionId, session] of this.sessions) {
      if (now.getTime() - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(sessionId)
      }
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { totalSessions: number; activeSessions: number; totalCommands: number } {
    const now = new Date()
    const activeThreshold = 5 * 60 * 1000 // 5 minutes

    let activeSessions = 0
    let totalCommands = 0

    for (const session of this.sessions.values()) {
      if (now.getTime() - session.lastActivity.getTime() < activeThreshold) {
        activeSessions++
      }
      totalCommands += session.commands.length
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      totalCommands,
    }
  }
}
