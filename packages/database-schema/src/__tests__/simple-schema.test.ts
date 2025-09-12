import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  aiPromptTemplates,
  chatHistory,
  listings,
  users,
  vehicleCalendarPricing,
  vehicleMaintenance,
  vehicleRentals,
  vehicles,
} from "../schema"

// Test database connection
const testDbUrl =
  process.env.TEST_DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"
const sql = postgres(testDbUrl)
const db = drizzle(sql)

describe("Simple Database Schema Tests", () => {
  beforeAll(async () => {
    console.log("Using test database:", testDbUrl.replace(/:[^:]*@/, ":***@"))
  })

  afterAll(async () => {
    await sql.end()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await db.delete(vehicleCalendarPricing)
    await db.delete(chatHistory)
    await db.delete(vehicleRentals)
    await db.delete(vehicleMaintenance)
    await db.delete(vehicles)
    await db.delete(listings)
    await db.delete(users)
    await db.delete(aiPromptTemplates)
  })

  describe("Users Table Extended Fields", () => {
    it("should create a user with telegram and customer fields", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+66123456789",
        telegramId: "123456789",
        telegramUsername: "johndoe",
        isClient: true,
        hasRentedBefore: false,
        preferredPlatform: "telegram" as const,
        notes: "Test customer from Telegram",
      }

      const result = await db.insert(users).values(userData).returning()
      const user = result[0]

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.phone).toBe(userData.phone)
      expect(user.telegramId).toBe(userData.telegramId)
      expect(user.isClient).toBe(true)
      expect(user.preferredPlatform).toBe("telegram")
    })

    it("should enforce unique constraints", async () => {
      const userData = {
        email: "test1@example.com",
        phone: "+66123456789",
        telegramId: "123456789",
      }

      await db.insert(users).values(userData)

      // Try to insert duplicate phone
      await expect(
        db.insert(users).values({
          email: "test2@example.com",
          phone: "+66123456789", // duplicate
          telegramId: "987654321",
        }),
      ).rejects.toThrow()
    })
  })

  describe("Vehicles Table with Pricing System", () => {
    it("should create vehicle with seasonal pricing from your models", async () => {
      // Create user first
      const userResult = await db
        .insert(users)
        .values({
          email: "owner@example.com",
          firstName: "Vehicle",
          lastName: "Owner",
        })
        .returning()
      const testUser = userResult[0]

      // Create listing
      const listingResult = await db
        .insert(listings)
        .values({
          ownerId: testUser.id,
          title: "Test Scooter",
          description: "Honda PCX 150cc",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "123 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
          locationCountry: "Thailand",
        })
        .returning()
      const testListing = listingResult[0]

      // Create vehicle with extended pricing
      const vehicleData = {
        listingId: testListing.id,
        vehicleType: "scooter" as const,
        category: "rental" as const,
        condition: "good" as const,
        make: "Honda",
        model: "PCX 150",
        year: 2023,
        color: "White",
        power: "150cc",
        oldVehicleNumber: "SCT001",
        sticker: "Blue rental sticker",
        gpsTrackerId: "ST123456",
        gpsProvider: "sinotrack",
        pricingSystem: "seasonal" as const,
        dailyRate: "300.00",
        oneYearRent: "72000.00",
        sixMonthHighSeason: "45000.00",
        days1To3: "350.00",
        decemberPrice: "400.00",
        januaryPrice: "400.00",
      }

      const vehicleResult = await db.insert(vehicles).values(vehicleData).returning()
      const vehicle = vehicleResult[0]

      expect(vehicle).toBeDefined()
      expect(vehicle.model).toBe("PCX 150")
      expect(vehicle.power).toBe("150cc")
      expect(vehicle.oldVehicleNumber).toBe("SCT001")
      expect(vehicle.pricingSystem).toBe("seasonal")
      expect(vehicle.oneYearRent).toBe("72000.00")
      expect(vehicle.decemberPrice).toBe("400.00")
    })
  })

  describe("Vehicle Maintenance from your ScooterMaintenance model", () => {
    it("should create maintenance record with detailed fields", async () => {
      // Setup vehicle first
      const userResult = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()
      const testUser = userResult[0]

      const listingResult = await db
        .insert(listings)
        .values({
          ownerId: testUser.id,
          title: "Test Scooter",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "123 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
        })
        .returning()
      const testListing = listingResult[0]

      const vehicleResult = await db
        .insert(vehicles)
        .values({
          listingId: testListing.id,
          vehicleType: "scooter",
          category: "rental",
          condition: "good",
          make: "Honda",
          model: "PCX 150",
          year: 2023,
        })
        .returning()
      const testVehicle = vehicleResult[0]

      // Create maintenance record
      const maintenanceData = {
        vehicleId: testVehicle.id,
        engineOilKm: 5000,
        frontBrakesKm: 12000,
        cigaretteLighter: true,
        frontBearing: "Good condition",
        battery: "Yuasa 12V",
        rearDiscNeedsReplacement: "Rear disc needs replacement to prevent squeaking",
        maintenanceNotes: "Regular maintenance completed",
      }

      const maintenanceResult = await db.insert(vehicleMaintenance).values(maintenanceData).returning()
      const maintenance = maintenanceResult[0]

      expect(maintenance).toBeDefined()
      expect(maintenance.vehicleId).toBe(testVehicle.id)
      expect(maintenance.engineOilKm).toBe(5000)
      expect(maintenance.cigaretteLighter).toBe(true)
      expect(maintenance.rearDiscNeedsReplacement).toBe("Rear disc needs replacement to prevent squeaking")
    })
  })

  describe("Chat History from your ChatHistory model", () => {
    it("should create chat record with AI processing", async () => {
      const userResult = await db
        .insert(users)
        .values({
          email: "customer@example.com",
          telegramId: "123456789",
          telegramUsername: "johndoe",
        })
        .returning()
      const testUser = userResult[0]

      const chatData = {
        customerId: testUser.id,
        platform: "telegram" as const,
        messageType: "incoming" as const,
        messageText: "Hello, I want to rent a scooter",
        externalMessageId: "tg_msg_123",
        senderName: "John Doe",
        contextSummary: "Customer inquiry about scooter rental",
        isProcessedByAi: true,
        aiResponse: "Hello! I can help you find the perfect scooter.",
        messageTimestamp: new Date(),
      }

      const chatResult = await db.insert(chatHistory).values(chatData).returning()
      const chat = chatResult[0]

      expect(chat).toBeDefined()
      expect(chat.customerId).toBe(testUser.id)
      expect(chat.platform).toBe("telegram")
      expect(chat.isProcessedByAi).toBe(true)
      expect(chat.aiResponse).toContain("perfect scooter")
    })
  })

  describe("AI Prompt Templates from your DeepSeekPromptTemplate model", () => {
    it("should create and manage prompt templates", async () => {
      const promptData = {
        name: "Scooter Rental Consultant",
        description: "AI assistant for scooter rental inquiries",
        systemPrompt: "You are a professional scooter rental consultant in Thailand.",
        isActive: true,
      }

      const promptResult = await db.insert(aiPromptTemplates).values(promptData).returning()
      const prompt = promptResult[0]

      expect(prompt).toBeDefined()
      expect(prompt.name).toBe("Scooter Rental Consultant")
      expect(prompt.isActive).toBe(true)
      expect(prompt.systemPrompt).toContain("Thailand")
    })
  })

  describe("Calendar vs Seasonal Pricing Systems", () => {
    it("should support both pricing systems", async () => {
      const userResult = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()
      const testUser = userResult[0]

      const listingResult = await db
        .insert(listings)
        .values({
          ownerId: testUser.id,
          title: "Test Scooter",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "123 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
        })
        .returning()
      const testListing = listingResult[0]

      // Vehicle with calendar pricing
      const vehicleResult = await db
        .insert(vehicles)
        .values({
          listingId: testListing.id,
          vehicleType: "scooter",
          category: "rental",
          condition: "good",
          make: "Yamaha",
          model: "NMAX 155",
          year: 2023,
          pricingSystem: "calendar",
        })
        .returning()
      const calendarVehicle = vehicleResult[0]

      // Add calendar pricing
      const pricingResult = await db
        .insert(vehicleCalendarPricing)
        .values({
          vehicleId: calendarVehicle.id,
          startDate: new Date("2024-12-01"),
          endDate: new Date("2024-12-31"),
          dailyRate: "450.00",
          notes: "High season pricing",
        })
        .returning()
      const pricing = pricingResult[0]

      expect(calendarVehicle.pricingSystem).toBe("calendar")
      expect(pricing.dailyRate).toBe("450.00")
      expect(pricing.notes).toBe("High season pricing")
    })
  })
})
