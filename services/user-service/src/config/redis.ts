import { createClient } from "redis"

const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379/4",
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379", 10),
  },
  password: process.env.REDIS_PASSWORD,
  database: Number.parseInt(process.env.REDIS_DB || "4", 10),
}

export const redisClient = createClient(redisConfig)

// Handle Redis connection events
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err)
})

redisClient.on("connect", () => {
  console.log("Redis Client Connected")
})

redisClient.on("ready", () => {
  console.log("Redis Client Ready")
})

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect()
  } catch (error) {
    console.error("Failed to connect to Redis:", error)
    throw error
  }
}

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.disconnect()
  } catch (error) {
    console.error("Failed to disconnect from Redis:", error)
  }
}

// OAuth state management
export class OAuthStateManager {
  private static readonly STATE_PREFIX = "oauth:state:"
  private static readonly STATE_TTL = 600 // 10 minutes

  static async saveState(state: string, provider: string): Promise<void> {
    const key = `${OAuthStateManager.STATE_PREFIX}${state}`
    const data = {
      provider,
      createdAt: new Date().toISOString(),
    }

    await redisClient.setEx(key, OAuthStateManager.STATE_TTL, JSON.stringify(data))
  }

  static async validateState(state: string): Promise<{ provider: string; createdAt: string } | null> {
    const key = `${OAuthStateManager.STATE_PREFIX}${state}`
    const data = await redisClient.get(key)

    if (!data) {
      return null
    }

    // Delete the state after validation (one-time use)
    await redisClient.del(key)

    try {
      return JSON.parse(data)
    } catch (error) {
      console.error("Failed to parse OAuth state data:", error)
      return null
    }
  }

  static async cleanupExpiredStates(): Promise<void> {
    // This is handled automatically by Redis TTL, but we can implement
    // additional cleanup logic if needed
  }
}
