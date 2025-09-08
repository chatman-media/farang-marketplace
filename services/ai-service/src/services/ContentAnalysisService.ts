import natural from "natural"
import sentiment from "sentiment"
import { removeStopwords, eng, tha } from "stopword"
import compromise from "compromise"
import type { ContentAnalysisRequest, ContentAnalysisResult } from "../models/index"
import { AIProviderService } from "./AIProviderService"

export class ContentAnalysisService {
  private aiProvider: AIProviderService
  private sentimentAnalyzer: any
  private stemmer: any
  private tokenizer: any

  constructor(aiProvider: AIProviderService) {
    this.aiProvider = aiProvider
    this.sentimentAnalyzer = new sentiment()
    this.stemmer = natural.PorterStemmer
    this.tokenizer = new natural.WordTokenizer()
  }

  /**
   * Analyze content using multiple NLP techniques
   */
  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now()
    const result: ContentAnalysisResult = {
      id: request.id,
      processingTime: 0,
      timestamp: new Date(),
    }

    try {
      // Combine all text content
      const fullText = this.combineTextContent(request.content)

      // Auto-detect language if needed
      let detectedLanguage = request.language
      if (request.language === "auto" || request.options.language) {
        const languageResult = this.detectLanguage(fullText)
        detectedLanguage = languageResult.detected
        if (request.options.language) {
          result.language = languageResult
        }
      }

      // Perform requested analyses
      if (request.options.sentiment) {
        result.sentiment = await this.analyzeSentiment(fullText, detectedLanguage)
      }

      if (request.options.keywords) {
        result.keywords = await this.extractKeywords(fullText, detectedLanguage)
      }

      if (request.options.categories) {
        result.categories = await this.categorizeContent(fullText, request.type)
      }

      if (request.options.moderation) {
        result.moderation = await this.moderateContent(fullText)
      }

      if (request.options.quality) {
        result.quality = await this.assessQuality(request.content, request.type)
      }

      result.processingTime = Date.now() - startTime
      return result
    } catch (error) {
      console.error("Content analysis failed:", error)
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Combine text content from different fields
   */
  private combineTextContent(content: ContentAnalysisRequest["content"]): string {
    const parts: string[] = []

    if (content.title) parts.push(content.title)
    if (content.description) parts.push(content.description)
    if (content.text) parts.push(content.text)

    return parts.join(" ").trim()
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(
    text: string,
    language?: string,
  ): Promise<{
    score: number
    label: "negative" | "neutral" | "positive"
    confidence: number
  }> {
    try {
      // Use natural sentiment analysis for basic scoring
      const basicSentiment = this.sentimentAnalyzer.analyze(text)
      let score = basicSentiment.score
      let confidence = 0.7

      // Enhance with AI for better accuracy
      if (text.length > 50) {
        try {
          const aiSentiment = await this.getAISentiment(text, language)
          if (aiSentiment) {
            score = (score + aiSentiment.score) / 2
            confidence = Math.max(confidence, aiSentiment.confidence)
          }
        } catch (error) {
          console.warn("AI sentiment analysis failed, using basic analysis")
        }
      }

      // Normalize score to -1 to 1 range
      const normalizedScore = Math.max(-1, Math.min(1, score / 10))

      // Determine label
      let label: "negative" | "neutral" | "positive"
      if (normalizedScore < -0.1) {
        label = "negative"
      } else if (normalizedScore > 0.1) {
        label = "positive"
      } else {
        label = "neutral"
      }

      return {
        score: normalizedScore,
        label,
        confidence,
      }
    } catch (error) {
      console.error("Sentiment analysis failed:", error)
      return {
        score: 0,
        label: "neutral",
        confidence: 0.1,
      }
    }
  }

  /**
   * Get AI-enhanced sentiment analysis
   */
  private async getAISentiment(
    text: string,
    language?: string,
  ): Promise<{
    score: number
    confidence: number
  } | null> {
    try {
      const prompt = `
Analyze the sentiment of the following text and provide a score from -1 (very negative) to 1 (very positive).
${language ? `Language: ${language}` : ""}

Text: "${text}"

Respond with only a JSON object: {"score": 0.X, "confidence": 0.X}
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 100,
        temperature: 0.1,
        metadata: { type: "sentiment_analysis" },
      })

      const jsonMatch = response.response.match(/\{[^}]+\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          score: parsed.score || 0,
          confidence: parsed.confidence || 0.5,
        }
      }

      return null
    } catch (error) {
      console.error("AI sentiment analysis failed:", error)
      return null
    }
  }

  /**
   * Extract keywords from text
   */
  private async extractKeywords(
    text: string,
    language?: string,
  ): Promise<
    Array<{
      word: string
      score: number
      category?: string
    }>
  > {
    try {
      // Use compromise for advanced NLP analysis
      const doc = compromise(text)

      // Extract different types of entities and keywords
      const nouns = doc.nouns().out("array")
      const adjectives = doc.adjectives().out("array")
      const verbs = doc.verbs().out("array")
      const places = doc.places().out("array")
      const organizations = doc.organizations().out("array")
      const people = doc.people().out("array")

      // Tokenize and clean text (fallback method)
      const tokens = this.tokenizer.tokenize(text.toLowerCase())
      if (!tokens) return []

      // Remove stopwords
      const stopwords = language === "th" ? tha : eng
      const filteredTokens = removeStopwords(tokens, stopwords)

      // Calculate TF-IDF scores (simplified)
      const wordFreq = this.calculateWordFrequency(filteredTokens)
      const keywords: Array<{
        word: string
        score: number
        category?: string
      }> = []

      // Add compromise-extracted entities with higher scores
      const compromiseKeywords = [
        ...nouns.map((word: string) => ({
          word: word.toLowerCase(),
          category: "noun",
          baseScore: 0.8,
        })),
        ...adjectives.map((word: string) => ({
          word: word.toLowerCase(),
          category: "adjective",
          baseScore: 0.6,
        })),
        ...verbs.map((word: string) => ({
          word: word.toLowerCase(),
          category: "verb",
          baseScore: 0.5,
        })),
        ...places.map((word: string) => ({
          word: word.toLowerCase(),
          category: "place",
          baseScore: 0.9,
        })),
        ...organizations.map((word: string) => ({
          word: word.toLowerCase(),
          category: "organization",
          baseScore: 0.9,
        })),
        ...people.map((word: string) => ({
          word: word.toLowerCase(),
          category: "person",
          baseScore: 0.7,
        })),
      ]

      // Process compromise keywords
      for (const { word, category, baseScore } of compromiseKeywords) {
        if (word.length >= 3) {
          const freq = wordFreq[word] || 1
          const score = Math.min(baseScore * freq, 1)
          keywords.push({ word, score, category })
        }
      }

      // Get top keywords by frequency (traditional method)
      const sortedWords = Object.entries(wordFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)

      for (const [word, freq] of sortedWords) {
        // Skip very short words
        if (word.length < 3) continue

        // Calculate score based on frequency and word length
        const score = freq * (word.length / 10)

        // Try to categorize keyword
        const category = this.categorizeKeyword(word)

        keywords.push({
          word,
          score: Math.min(score, 1),
          ...(category && { category }),
        })
      }

      // Enhance with AI for better keyword extraction
      if (text.length > 100) {
        try {
          const aiKeywords = await this.getAIKeywords(text, language)
          if (aiKeywords) {
            // Merge AI keywords with statistical keywords
            keywords.push(...aiKeywords)
          }
        } catch (error) {
          console.warn("AI keyword extraction failed, using statistical analysis")
        }
      }

      // Remove duplicates and sort by score
      const uniqueKeywords = this.deduplicateKeywords(keywords)
      return uniqueKeywords.sort((a, b) => b.score - a.score).slice(0, 15)
    } catch (error) {
      console.error("Keyword extraction failed:", error)
      return []
    }
  }

  /**
   * Calculate word frequency
   */
  private calculateWordFrequency(tokens: string[]): Record<string, number> {
    const freq: Record<string, number> = {}
    const total = tokens.length

    for (const token of tokens) {
      freq[token] = (freq[token] || 0) + 1
    }

    // Normalize frequencies
    for (const word in freq) {
      freq[word] = freq[word]! / total
    }

    return freq
  }

  /**
   * Categorize keyword based on common patterns
   */
  private categorizeKeyword(word: string): string | undefined {
    const categories = {
      technology: ["computer", "software", "digital", "tech", "app", "online", "internet"],
      business: ["business", "company", "service", "professional", "commercial", "enterprise"],
      location: ["bangkok", "phuket", "thailand", "city", "area", "location", "place"],
      price: ["price", "cost", "cheap", "expensive", "budget", "affordable", "premium"],
      quality: ["quality", "good", "excellent", "best", "top", "premium", "luxury"],
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => word.includes(keyword) || keyword.includes(word))) {
        return category
      }
    }

    return undefined
  }

  /**
   * Get AI-enhanced keyword extraction
   */
  private async getAIKeywords(
    text: string,
    language?: string,
  ): Promise<Array<{
    word: string
    score: number
    category?: string
  }> | null> {
    try {
      const prompt = `
Extract the most important keywords from the following text. Focus on nouns, adjectives, and key concepts.
${language ? `Language: ${language}` : ""}

Text: "${text}"

Respond with a JSON array of keywords with scores:
[{"word": "keyword", "score": 0.X, "category": "optional_category"}]
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 300,
        temperature: 0.2,
        metadata: { type: "keyword_extraction" },
      })

      const jsonMatch = response.response.match(/\[[^\]]+\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return Array.isArray(parsed) ? parsed : null
      }

      return null
    } catch (error) {
      console.error("AI keyword extraction failed:", error)
      return null
    }
  }

  /**
   * Remove duplicate keywords
   */
  private deduplicateKeywords(
    keywords: Array<{ word: string; score: number; category?: string }>,
  ): Array<{ word: string; score: number; category?: string }> {
    const seen = new Set<string>()
    const unique: Array<{ word: string; score: number; category?: string }> = []

    for (const keyword of keywords) {
      const normalizedWord = keyword.word.toLowerCase().trim()
      if (!seen.has(normalizedWord)) {
        seen.add(normalizedWord)
        unique.push(keyword)
      }
    }

    return unique
  }

  /**
   * Categorize content into predefined categories
   */
  private async categorizeContent(
    text: string,
    type: string,
  ): Promise<
    Array<{
      category: string
      confidence: number
    }>
  > {
    try {
      // Define categories based on content type
      const categories = this.getCategories(type)

      // Use AI for categorization
      const aiCategories = await this.getAICategories(text, categories, type)
      if (aiCategories) {
        return aiCategories
      }

      // Fallback to keyword-based categorization
      return this.getKeywordBasedCategories(text, categories)
    } catch (error) {
      console.error("Content categorization failed:", error)
      return []
    }
  }

  /**
   * Get categories based on content type
   */
  private getCategories(type: string): string[] {
    const categoryMap = {
      listing: [
        "electronics",
        "home",
        "fashion",
        "automotive",
        "sports",
        "books",
        "toys",
        "health",
        "beauty",
        "food",
        "services",
      ],
      review: ["positive", "negative", "neutral", "complaint", "praise", "recommendation", "warning", "question"],
      message: ["inquiry", "booking", "complaint", "compliment", "question", "request", "offer", "negotiation"],
      profile: ["personal", "business", "professional", "casual", "verified", "new_user", "experienced"],
    }

    return categoryMap[type as keyof typeof categoryMap] || categoryMap.listing
  }

  /**
   * Get AI-based categorization
   */
  private async getAICategories(
    text: string,
    categories: string[],
    type: string,
  ): Promise<Array<{
    category: string
    confidence: number
  }> | null> {
    try {
      const prompt = `
Categorize the following ${type} text into the most relevant categories from this list:
${categories.join(", ")}

Text: "${text}"

Respond with a JSON array of categories with confidence scores:
[{"category": "category_name", "confidence": 0.X}]

Only include categories with confidence > 0.3.
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 200,
        temperature: 0.1,
        metadata: { type: "content_categorization" },
      })

      const jsonMatch = response.response.match(/\[[^\]]+\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return Array.isArray(parsed) ? parsed.filter((cat) => cat.confidence > 0.3) : null
      }

      return null
    } catch (error) {
      console.error("AI categorization failed:", error)
      return null
    }
  }

  /**
   * Get keyword-based categorization as fallback
   */
  private getKeywordBasedCategories(
    text: string,
    categories: string[],
  ): Array<{
    category: string
    confidence: number
  }> {
    const results: Array<{ category: string; confidence: number }> = []
    const lowerText = text.toLowerCase()

    // Use compromise for enhanced text analysis
    const doc = compromise(text)
    const nouns = doc
      .nouns()
      .out("array")
      .map((word: string) => word.toLowerCase())
    const adjectives = doc
      .adjectives()
      .out("array")
      .map((word: string) => word.toLowerCase())
    const extractedTerms = [...nouns, ...adjectives]

    for (const category of categories) {
      const keywords = this.getCategoryKeywords(category)
      let matches = 0
      let compromiseMatches = 0

      // Traditional keyword matching
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches++
        }
      }

      // Enhanced matching using compromise-extracted terms
      for (const term of extractedTerms) {
        for (const keyword of keywords) {
          if (term.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(term)) {
            compromiseMatches++
            break // Avoid double counting
          }
        }
      }

      const totalMatches = matches + compromiseMatches * 0.8 // Weight compromise matches slightly lower
      if (totalMatches > 0) {
        const confidence = Math.min(totalMatches / keywords.length, 1)
        if (confidence > 0.15) {
          // Lower threshold due to enhanced matching
          results.push({ category, confidence })
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get keywords for category matching
   */
  private getCategoryKeywords(category: string): string[] {
    const keywordMap: Record<string, string[]> = {
      electronics: ["phone", "computer", "laptop", "tablet", "camera", "tv", "electronic"],
      home: ["furniture", "kitchen", "bedroom", "living", "home", "house", "apartment"],
      fashion: ["clothes", "shirt", "dress", "shoes", "fashion", "style", "wear"],
      automotive: ["car", "motorcycle", "vehicle", "auto", "engine", "wheel"],
      services: ["service", "help", "assistance", "support", "professional"],
      positive: ["good", "great", "excellent", "amazing", "wonderful", "perfect"],
      negative: ["bad", "terrible", "awful", "horrible", "worst", "disappointing"],
      inquiry: ["question", "ask", "wondering", "curious", "information"],
      booking: ["book", "reserve", "appointment", "schedule", "availability"],
    }

    return keywordMap[category] || [category]
  }

  /**
   * Detect language of text
   */
  private detectLanguage(text: string): {
    detected: string
    confidence: number
  } {
    try {
      // Simple language detection based on character patterns
      const thaiPattern = /[\u0E00-\u0E7F]/
      const englishPattern = /[a-zA-Z]/

      const thaiChars = (text.match(thaiPattern) || []).length
      const englishChars = (text.match(englishPattern) || []).length
      const totalChars = thaiChars + englishChars

      if (totalChars === 0) {
        return { detected: "unknown", confidence: 0 }
      }

      const thaiRatio = thaiChars / totalChars
      const englishRatio = englishChars / totalChars

      if (thaiRatio > 0.3) {
        return { detected: "th", confidence: thaiRatio }
      } else if (englishRatio > 0.5) {
        return { detected: "en", confidence: englishRatio }
      } else {
        return { detected: "mixed", confidence: 0.5 }
      }
    } catch (error) {
      console.error("Language detection failed:", error)
      return { detected: "unknown", confidence: 0 }
    }
  }

  /**
   * Moderate content for inappropriate material
   */
  private async moderateContent(text: string): Promise<{
    flagged: boolean
    categories: string[]
    scores: Record<string, number>
  }> {
    try {
      // Basic keyword-based moderation
      const flaggedKeywords = this.checkFlaggedKeywords(text)

      // AI-enhanced moderation for better accuracy
      let aiModeration = null
      try {
        aiModeration = await this.getAIModeration(text)
      } catch (error) {
        console.warn("AI moderation failed, using keyword-based moderation")
      }

      const categories: string[] = []
      const scores: Record<string, number> = {}
      let flagged = false

      // Combine results
      if (flaggedKeywords.length > 0) {
        categories.push("inappropriate_language")
        scores["inappropriate_language"] = flaggedKeywords.length / 10
        flagged = true
      }

      if (aiModeration) {
        Object.assign(scores, aiModeration.scores)
        categories.push(...aiModeration.categories)
        flagged = flagged || aiModeration.flagged
      }

      return {
        flagged,
        categories: [...new Set(categories)],
        scores,
      }
    } catch (error) {
      console.error("Content moderation failed:", error)
      return {
        flagged: false,
        categories: [],
        scores: {},
      }
    }
  }

  /**
   * Check for flagged keywords
   */
  private checkFlaggedKeywords(text: string): string[] {
    const flaggedWords = [
      "spam",
      "scam",
      "fraud",
      "fake",
      "illegal",
      // Add more flagged words as needed
    ]

    const lowerText = text.toLowerCase()
    return flaggedWords.filter((word) => lowerText.includes(word))
  }

  /**
   * Get AI-based content moderation
   */
  private async getAIModeration(text: string): Promise<{
    flagged: boolean
    categories: string[]
    scores: Record<string, number>
  } | null> {
    try {
      const prompt = `
Analyze the following text for inappropriate content. Check for:
- Spam or promotional content
- Offensive language
- Misleading information
- Inappropriate content

Text: "${text}"

Respond with JSON: {"flagged": boolean, "categories": ["category"], "scores": {"category": 0.X}}
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 200,
        temperature: 0.1,
        metadata: { type: "content_moderation" },
      })

      const jsonMatch = response.response.match(/\{[^}]+\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return null
    } catch (error) {
      console.error("AI moderation failed:", error)
      return null
    }
  }

  /**
   * Assess content quality
   */
  private async assessQuality(
    content: ContentAnalysisRequest["content"],
    type: string,
  ): Promise<{
    score: number
    issues: string[]
    suggestions: string[]
  }> {
    try {
      const issues: string[] = []
      const suggestions: string[] = []
      let score = 1.0

      // Check content length
      const fullText = this.combineTextContent(content)
      if (fullText.length < 20) {
        issues.push("Content too short")
        suggestions.push("Add more detailed description")
        score -= 0.3
      }

      // Check for title
      if (!content.title || content.title.length < 5) {
        issues.push("Missing or too short title")
        suggestions.push("Add a descriptive title")
        score -= 0.2
      }

      // Check for description
      if (!content.description || content.description.length < 50) {
        issues.push("Missing or insufficient description")
        suggestions.push("Add more detailed description")
        score -= 0.2
      }

      // Check grammar and spelling (simplified)
      const grammarIssues = this.checkGrammar(fullText)
      if (grammarIssues > 0) {
        issues.push("Grammar or spelling issues detected")
        suggestions.push("Review and correct grammar/spelling")
        score -= Math.min(grammarIssues * 0.1, 0.3)
      }

      // AI-enhanced quality assessment
      try {
        const aiQuality = await this.getAIQualityAssessment(content, type)
        if (aiQuality) {
          score = (score + aiQuality.score) / 2
          issues.push(...aiQuality.issues)
          suggestions.push(...aiQuality.suggestions)
        }
      } catch (error) {
        console.warn("AI quality assessment failed")
      }

      return {
        score: Math.max(0, Math.min(score, 1)),
        issues: [...new Set(issues)],
        suggestions: [...new Set(suggestions)],
      }
    } catch (error) {
      console.error("Quality assessment failed:", error)
      return {
        score: 0.5,
        issues: ["Quality assessment failed"],
        suggestions: ["Manual review recommended"],
      }
    }
  }

  /**
   * Simple grammar checking
   */
  private checkGrammar(text: string): number {
    let issues = 0

    // Use compromise for advanced grammar analysis
    const doc = compromise(text)

    // Check for repeated words
    const words = text.toLowerCase().split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1]) {
        issues++
      }
    }

    // Check for very long sentences
    const sentences = doc.sentences().out("array")
    for (const sentence of sentences) {
      const wordCount = sentence.split(/\s+/).length
      if (wordCount > 30) {
        issues++
      }
      // Check for very short sentences (might indicate incomplete thoughts)
      if (wordCount < 3 && sentence.trim().length > 0) {
        issues++
      }
    }

    // Check for proper sentence structure using compromise
    const verbs = doc.verbs().out("array")
    const sentenceCount = sentences.length

    // If there are sentences but very few verbs, it might indicate poor structure
    if (sentenceCount > 2 && verbs.length < sentenceCount * 0.3) {
      issues++
    }

    // Check for excessive capitalization
    const allCapsWords = text.match(/\b[A-Z]{3,}\b/g)
    if (allCapsWords && allCapsWords.length > 3) {
      issues++
    }

    return issues
  }

  /**
   * Get AI-based quality assessment
   */
  private async getAIQualityAssessment(
    content: ContentAnalysisRequest["content"],
    type: string,
  ): Promise<{
    score: number
    issues: string[]
    suggestions: string[]
  } | null> {
    try {
      const prompt = `
Assess the quality of this ${type} content. Consider:
- Clarity and readability
- Completeness of information
- Grammar and spelling
- Appropriateness for the content type

Title: "${content.title || "N/A"}"
Description: "${content.description || "N/A"}"
Text: "${content.text || "N/A"}"

Respond with JSON: {"score": 0.X, "issues": ["issue"], "suggestions": ["suggestion"]}
      `.trim()

      const response = await this.aiProvider.generateResponse({
        provider: "openai",
        model: "gpt-4-turbo-preview",
        prompt,
        maxTokens: 300,
        temperature: 0.2,
        metadata: { type: "quality_assessment" },
      })

      const jsonMatch = response.response.match(/\{[^}]+\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return null
    } catch (error) {
      console.error("AI quality assessment failed:", error)
      return null
    }
  }

  /**
   * Batch analyze multiple content items
   */
  async batchAnalyze(requests: ContentAnalysisRequest[]): Promise<ContentAnalysisResult[]> {
    const results: ContentAnalysisResult[] = []
    const batchSize = parseInt(process.env["AI_BATCH_SIZE"] || "10")

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchPromises = batch.map((request) => this.analyzeContent(request))

      try {
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      } catch (error) {
        console.error("Batch analysis failed:", error)
        // Add error results for failed batch
        batch.forEach((request) => {
          results.push({
            id: request.id,
            processingTime: 0,
            timestamp: new Date(),
          })
        })
      }
    }

    return results
  }

  /**
   * Get service statistics
   */
  getStats(): Record<string, any> {
    return {
      service: "ContentAnalysisService",
      version: "1.0.0",
      supportedLanguages: ["en", "th", "mixed"],
      supportedTypes: ["listing", "review", "message", "profile"],
      features: [
        "sentiment_analysis",
        "keyword_extraction",
        "content_categorization",
        "language_detection",
        "content_moderation",
        "quality_assessment",
      ],
      lastUpdated: new Date(),
    }
  }
}
