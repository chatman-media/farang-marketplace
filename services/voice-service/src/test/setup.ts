import dotenv from "dotenv"
import { afterAll, beforeAll, beforeEach } from "vitest"

// Load test environment variables
dotenv.config({ path: ".env.test" })

// Global test setup
beforeAll(async () => {
  console.log("🧪 Setting up Voice Service tests...")

  // Set test environment
  process.env.NODE_ENV = "test"

  // Mock environment variables if not set
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-jwt-secret"
  }

  if (!process.env.MAX_AUDIO_FILE_SIZE) {
    process.env.MAX_AUDIO_FILE_SIZE = "1048576" // 1MB for tests
  }

  if (!process.env.DEFAULT_LANGUAGE) {
    process.env.DEFAULT_LANGUAGE = "en-US"
  }

  if (!process.env.SUPPORTED_LANGUAGES) {
    process.env.SUPPORTED_LANGUAGES = "th-TH,en-US,en-GB"
  }

  console.log("✅ Voice Service test environment ready")
})

beforeEach(() => {
  // Clear any cached modules or state before each test
  // Note: vitest doesn't need explicit mock clearing like jest
})

afterAll(async () => {
  console.log("🧹 Cleaning up Voice Service tests...")

  // Cleanup any resources
  // Close database connections, clear caches, etc.

  console.log("✅ Voice Service test cleanup complete")
})

// Global test utilities
export const createMockAudioBuffer = (size: number = 1024): Buffer => {
  return Buffer.alloc(size, 0)
}

export const createMockAudioBase64 = (size: number = 1024): string => {
  return createMockAudioBuffer(size).toString("base64")
}

export const createMockJWT = (payload: any = {}): string => {
  const defaultPayload = {
    id: "test-user-id",
    email: "test@example.com",
    role: "user",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    ...payload,
  }

  // Simple mock JWT (not cryptographically secure, just for testing)
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
  const payloadStr = Buffer.from(JSON.stringify(defaultPayload)).toString("base64")
  const signature = "mock-signature"

  return `${header}.${payloadStr}.${signature}`
}

export const mockVoiceRequest = {
  audioData: createMockAudioBase64(),
  language: "en-US",
  userId: "test-user-id",
  sessionId: "test-session-id",
  context: {
    type: "search" as const,
    currentPage: "/search",
  },
}

export const mockVoiceResponse = {
  success: true,
  transcription: "Hello, this is a test transcription",
  confidence: 0.95,
  language: "en-US",
  duration: 2.5,
  alternatives: [
    {
      text: "Hello, this is a test transcription",
      confidence: 0.95,
    },
  ],
  processingTime: 150,
  provider: "mock",
}

export const mockVoiceCommand = {
  id: "cmd_test_123",
  command: "Find apartments for rent in Bangkok",
  intent: {
    name: "search",
    confidence: 0.9,
    parameters: { query: "apartments for rent in Bangkok" },
  },
  entities: [
    {
      type: "location",
      value: "Bangkok",
      confidence: 0.85,
    },
    {
      type: "property_type",
      value: "apartments",
      confidence: 0.9,
    },
  ],
  confidence: 0.9,
  language: "en-US",
  userId: "test-user-id",
  sessionId: "test-session-id",
  timestamp: new Date(),
  context: {
    type: "search" as const,
    currentPage: "/search",
  },
}

export const mockVoiceCommandResponse = {
  action: "search",
  data: {
    query: "apartments for rent in Bangkok",
    filters: {
      location: "Bangkok",
    },
  },
  speechText: "Searching for apartments for rent in Bangkok",
  redirectUrl: "/search?q=apartments%20for%20rent%20in%20Bangkok&location=Bangkok",
  success: true,
}

export const mockSession = {
  id: "test-session-id",
  userId: "test-user-id",
  startTime: new Date(),
  lastActivity: new Date(),
  language: "en-US",
  context: {
    type: "search" as const,
    currentPage: "/search",
  },
  commands: [],
  state: {},
}

// Test helper functions
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const expectToBeWithinRange = (actual: number, expected: number, tolerance: number = 0.1): void => {
  const diff = Math.abs(actual - expected)
  const maxDiff = expected * tolerance

  if (diff > maxDiff) {
    throw new Error(`Expected ${actual} to be within ${tolerance * 100}% of ${expected}, but difference was ${diff}`)
  }
}

export const expectArrayToContain = <T>(array: T[], predicate: (item: T) => boolean): void => {
  const found = array.some(predicate)
  if (!found) {
    throw new Error("Expected array to contain an item matching the predicate")
  }
}

// Mock console methods for cleaner test output
const originalConsole = { ...console }

export const mockConsole = () => {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
}

export const restoreConsole = () => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
}

// Audio format helpers
export const createWAVHeader = (dataSize: number, sampleRate: number = 44100, channels: number = 1): Buffer => {
  const header = Buffer.alloc(44)

  // RIFF header
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write("WAVE", 8)

  // fmt chunk
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16) // chunk size
  header.writeUInt16LE(1, 20) // audio format (PCM)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * 2, 28) // byte rate
  header.writeUInt16LE(channels * 2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample

  // data chunk
  header.write("data", 36)
  header.writeUInt32LE(dataSize, 40)

  return header
}

export const createMockWAVFile = (durationSeconds: number = 1, sampleRate: number = 44100): Buffer => {
  const channels = 1
  const bytesPerSample = 2
  const dataSize = Math.floor(durationSeconds * sampleRate * channels * bytesPerSample)

  const header = createWAVHeader(dataSize, sampleRate, channels)
  const data = Buffer.alloc(dataSize)

  // Fill with simple sine wave data
  for (let i = 0; i < dataSize; i += 2) {
    const sample = Math.sin((2 * Math.PI * 440 * (i / 2)) / sampleRate) * 32767
    data.writeInt16LE(Math.floor(sample), i)
  }

  return Buffer.concat([header, data])
}
