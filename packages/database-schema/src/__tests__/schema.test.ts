import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import {
  users,
  vehicles,
  vehicleMaintenance,
  vehicleRentals,
  chatHistory,
  aiPromptTemplates,
  vehicleCalendarPricing,
  listings,
} from "../schema"
import { eq } from "drizzle-orm"

// Test database connection
const testDbUrl =
  process.env.TEST_DATABASE_URL || "postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace_test"
const sql = postgres(testDbUrl)
const db = drizzle(sql)

describe("Database Schema Tests", () => {
  beforeAll(async () => {
    // Database should already be set up by drizzle push
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

  describe("Users Table", () => {
    it("should create a user with extended fields from your models", async () => {
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
        managerCommunicationInfo: "Prefers morning calls, speaks English and Thai",
      }

      const userResult = await db.insert(users).values(userData).returning()
      const user = userResult[0]

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.phone).toBe(userData.phone)
      expect(user.telegramId).toBe(userData.telegramId)
      expect(user.isClient).toBe(true)
      expect(user.preferredPlatform).toBe("telegram")
      expect(user.notes).toBe(userData.notes)
    })

    it("should enforce unique constraints on phone and telegram_id", async () => {
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

      // Try to insert duplicate telegram_id
      await expect(
        db.insert(users).values({
          email: "test3@example.com",
          phone: "+66987654321",
          telegramId: "123456789", // duplicate
        }),
      ).rejects.toThrow()
    })
  })

  describe("Vehicles Table with Extended Pricing", () => {
    let testUser: any
    let testListing: any

    beforeEach(async () => {
      const users_result = await db
        .insert(users)
        .values({
          email: "owner@example.com",
          firstName: "Vehicle",
          lastName: "Owner",
        })
        .returning()
      testUser = users_result[0]

      const listings_result = await db
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
      testListing = listings_result[0]
    })

    it("should create a vehicle with extended fields from your Scooter model", async () => {
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
        rentalSticker: "Company logo sticker",
        gpsTrackerId: "ST123456",
        gpsProvider: "sinotrack",
        pricingSystem: "seasonal" as const,
        dailyRate: "300.00",
        oneYearRent: "72000.00",
        sixMonthHighSeason: "45000.00",
        sixMonthLowSeason: "36000.00",
        days1To3: "350.00",
        days4To7: "320.00",
        days7To14: "300.00",
        days15To25: "280.00",
        decemberPrice: "400.00",
        januaryPrice: "400.00",
        februaryPrice: "380.00",
      }

      const [vehicle] = await db.insert(vehicles).values(vehicleData).returning()

      expect(vehicle).toBeDefined()
      expect(vehicle.model).toBe("PCX 150")
      expect(vehicle.power).toBe("150cc")
      expect(vehicle.oldVehicleNumber).toBe("SCT001")
      expect(vehicle.gpsTrackerId).toBe("ST123456")
      expect(vehicle.pricingSystem).toBe("seasonal")
      expect(vehicle.oneYearRent).toBe("72000.00")
      expect(vehicle.decemberPrice).toBe("400.00")
    })

    it("should enforce unique constraint on oldVehicleNumber", async () => {
      const vehicleData = {
        listingId: testListing.id,
        vehicleType: "scooter" as const,
        category: "rental" as const,
        condition: "good" as const,
        make: "Honda",
        model: "PCX 150",
        year: 2023,
        oldVehicleNumber: "SCT001",
      }

      await db.insert(vehicles).values(vehicleData)

      // Create another listing for second vehicle
      const [testListing2] = await db
        .insert(listings)
        .values({
          ownerId: testUser.id,
          title: "Test Scooter 2",
          description: "Another Honda PCX",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "456 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
          locationCountry: "Thailand",
        })
        .returning()

      // Try to insert duplicate oldVehicleNumber
      await expect(
        db.insert(vehicles).values({
          ...vehicleData,
          listingId: testListing2.id,
          oldVehicleNumber: "SCT001", // duplicate
        }),
      ).rejects.toThrow()
    })
  })

  describe("Vehicle Maintenance Table", () => {
    let testVehicle: any

    beforeEach(async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()

      const [testListing] = await db
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

      ;[testVehicle] = await db
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
    })

    it("should create maintenance record with fields from your ScooterMaintenance model", async () => {
      const maintenanceData = {
        vehicleId: testVehicle.id,
        engineOilKm: 5000,
        gearOilKm: 8000,
        frontBrakesKm: 12000,
        rearBrakesKm: 15000,
        airFilterKm: 6000,
        sparkPlugsKm: 10000,
        cigaretteLighter: true,
        frontBearing: "Good condition",
        rearBearing: "Needs attention",
        frontTire: "New Michelin",
        rearTire: "Good condition",
        battery: "Yuasa 12V",
        belt: "Recently replaced",
        rearDiscNeedsReplacement: "Rear disc needs replacement to prevent squeaking",
        maintenanceNotes: "Regular maintenance completed",
      }

      const [maintenance] = await db.insert(vehicleMaintenance).values(maintenanceData).returning()

      expect(maintenance).toBeDefined()
      expect(maintenance.vehicleId).toBe(testVehicle.id)
      expect(maintenance.engineOilKm).toBe(5000)
      expect(maintenance.cigaretteLighter).toBe(true)
      expect(maintenance.rearDiscNeedsReplacement).toBe("Rear disc needs replacement to prevent squeaking")
    })

    it("should enforce one-to-one relationship with vehicle", async () => {
      const maintenanceData = {
        vehicleId: testVehicle.id,
        engineOilKm: 5000,
      }

      await db.insert(vehicleMaintenance).values(maintenanceData)

      // Try to insert another maintenance record for same vehicle
      await expect(db.insert(vehicleMaintenance).values(maintenanceData)).rejects.toThrow()
    })
  })

  describe("Vehicle Rentals Table", () => {
    let testUser: any
    let testVehicle: any

    beforeEach(async () => {
      ;[testUser] = await db
        .insert(users)
        .values({
          email: "customer@example.com",
          firstName: "John",
          lastName: "Customer",
          phone: "+66123456789",
        })
        .returning()

      const [owner] = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()

      const [testListing] = await db
        .insert(listings)
        .values({
          ownerId: owner.id,
          title: "Test Scooter",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "123 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
        })
        .returning()

      ;[testVehicle] = await db
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
    })

    it("should create rental record with fields from your Rental model", async () => {
      const rentalData = {
        customerId: testUser.id,
        vehicleId: testVehicle.id,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        status: "active" as const,
        dailyRate: "300.00",
        totalAmount: "1500.00",
        deposit: "3000.00",
        deliveryFee: "100.00",
        notes: "Customer requested hotel delivery",
      }

      const [rental] = await db.insert(vehicleRentals).values(rentalData).returning()

      expect(rental).toBeDefined()
      expect(rental.customerId).toBe(testUser.id)
      expect(rental.vehicleId).toBe(testVehicle.id)
      expect(rental.status).toBe("active")
      expect(rental.dailyRate).toBe("300.00")
      expect(rental.deliveryFee).toBe("100.00")
      expect(rental.notes).toBe("Customer requested hotel delivery")
    })

    it("should handle rental status transitions", async () => {
      const [rental] = await db
        .insert(vehicleRentals)
        .values({
          customerId: testUser.id,
          vehicleId: testVehicle.id,
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-01-20"),
          status: "pending",
          dailyRate: "300.00",
        })
        .returning()

      // Update to active
      await db.update(vehicleRentals).set({ status: "active" }).where(eq(vehicleRentals.id, rental.id))

      const [updatedRental] = await db.select().from(vehicleRentals).where(eq(vehicleRentals.id, rental.id))

      expect(updatedRental.status).toBe("active")
    })
  })

  describe("Chat History Table", () => {
    let testUser: any

    beforeEach(async () => {
      ;[testUser] = await db
        .insert(users)
        .values({
          email: "customer@example.com",
          telegramId: "123456789",
          telegramUsername: "johndoe",
        })
        .returning()
    })

    it("should create chat history record from your ChatHistory model", async () => {
      const chatData = {
        customerId: testUser.id,
        platform: "telegram" as const,
        messageType: "incoming" as const,
        messageText: "Hello, I want to rent a scooter",
        externalMessageId: "tg_msg_123",
        senderName: "John Doe",
        contextSummary: "Customer inquiry about scooter rental",
        isProcessedByAi: true,
        aiResponse: "Hello! I can help you find the perfect scooter. What dates do you need it for?",
        messageTimestamp: new Date(),
      }

      const [chat] = await db.insert(chatHistory).values(chatData).returning()

      expect(chat).toBeDefined()
      expect(chat.customerId).toBe(testUser.id)
      expect(chat.platform).toBe("telegram")
      expect(chat.messageType).toBe("incoming")
      expect(chat.isProcessedByAi).toBe(true)
      expect(chat.aiResponse).toContain("perfect scooter")
    })
  })

  describe("AI Prompt Templates Table", () => {
    it("should create prompt template from your DeepSeekPromptTemplate model", async () => {
      const promptData = {
        name: "Scooter Rental Consultant",
        description: "AI assistant for scooter rental inquiries",
        systemPrompt: `You are a professional scooter rental consultant in Thailand.
        Help customers choose the right scooter and provide accurate pricing information.
        Be friendly and use emojis appropriately.`,
        isActive: true,
      }

      const [prompt] = await db.insert(aiPromptTemplates).values(promptData).returning()

      expect(prompt).toBeDefined()
      expect(prompt.name).toBe("Scooter Rental Consultant")
      expect(prompt.isActive).toBe(true)
      expect(prompt.systemPrompt).toContain("Thailand")
    })

    it("should handle active prompt switching", async () => {
      // Create first prompt
      const [prompt1] = await db
        .insert(aiPromptTemplates)
        .values({
          name: "Prompt 1",
          systemPrompt: "System prompt 1",
          isActive: true,
        })
        .returning()

      // Create second prompt
      const [prompt2] = await db
        .insert(aiPromptTemplates)
        .values({
          name: "Prompt 2",
          systemPrompt: "System prompt 2",
          isActive: false,
        })
        .returning()

      expect(prompt1.isActive).toBe(true)
      expect(prompt2.isActive).toBe(false)

      // Switch active prompt
      await db.update(aiPromptTemplates).set({ isActive: false }).where(eq(aiPromptTemplates.id, prompt1.id))

      await db.update(aiPromptTemplates).set({ isActive: true }).where(eq(aiPromptTemplates.id, prompt2.id))

      const prompts = await db.select().from(aiPromptTemplates)
      const activePrompts = prompts.filter((p) => p.isActive)

      expect(activePrompts).toHaveLength(1)
      expect(activePrompts[0].id).toBe(prompt2.id)
    })
  })

  describe("Calendar Pricing Table", () => {
    let testVehicle: any

    beforeEach(async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()

      const [testListing] = await db
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

      ;[testVehicle] = await db
        .insert(vehicles)
        .values({
          listingId: testListing.id,
          vehicleType: "scooter",
          category: "rental",
          condition: "good",
          make: "Honda",
          model: "PCX 150",
          year: 2023,
          pricingSystem: "calendar",
        })
        .returning()
    })

    it("should create calendar pricing for high season", async () => {
      const pricingData = {
        vehicleId: testVehicle.id,
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-31"),
        dailyRate: "400.00",
        weeklyRate: "2500.00",
        monthlyRate: "10000.00",
        isAvailable: true,
        notes: "High season pricing - December",
      }

      const [pricing] = await db.insert(vehicleCalendarPricing).values(pricingData).returning()

      expect(pricing).toBeDefined()
      expect(pricing.vehicleId).toBe(testVehicle.id)
      expect(pricing.dailyRate).toBe("400.00")
      expect(pricing.notes).toBe("High season pricing - December")
    })

    it("should handle overlapping date ranges", async () => {
      // Create first pricing period
      await db.insert(vehicleCalendarPricing).values({
        vehicleId: testVehicle.id,
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-15"),
        dailyRate: "400.00",
      })

      // Create overlapping period (this should be allowed for flexibility)
      const [overlapping] = await db
        .insert(vehicleCalendarPricing)
        .values({
          vehicleId: testVehicle.id,
          startDate: new Date("2024-12-10"),
          endDate: new Date("2024-12-25"),
          dailyRate: "450.00",
        })
        .returning()

      expect(overlapping).toBeDefined()
      expect(overlapping.dailyRate).toBe("450.00")
    })
  })

  describe("Pricing System Integration", () => {
    it("should support both seasonal and calendar pricing systems", async () => {
      const [testUser] = await db
        .insert(users)
        .values({
          email: "owner@example.com",
        })
        .returning()

      const [testListing] = await db
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

      // Vehicle with seasonal pricing
      const [seasonalVehicle] = await db
        .insert(vehicles)
        .values({
          listingId: testListing.id,
          vehicleType: "scooter",
          category: "rental",
          condition: "good",
          make: "Honda",
          model: "PCX 150",
          year: 2023,
          pricingSystem: "seasonal",
          decemberPrice: "400.00",
          januaryPrice: "400.00",
        })
        .returning()

      // Create another listing for calendar vehicle
      const [testListing2] = await db
        .insert(listings)
        .values({
          ownerId: testUser.id,
          title: "Test Scooter 2",
          category: "vehicles",
          type: "rental",
          basePrice: "300.00",
          locationAddress: "456 Test Street",
          locationCity: "Bangkok",
          locationRegion: "Bangkok",
        })
        .returning()

      // Vehicle with calendar pricing
      const [calendarVehicle] = await db
        .insert(vehicles)
        .values({
          listingId: testListing2.id,
          vehicleType: "scooter",
          category: "rental",
          condition: "good",
          make: "Yamaha",
          model: "NMAX 155",
          year: 2023,
          pricingSystem: "calendar",
        })
        .returning()

      // Add calendar pricing
      await db.insert(vehicleCalendarPricing).values({
        vehicleId: calendarVehicle.id,
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-31"),
        dailyRate: "450.00",
      })

      expect(seasonalVehicle.pricingSystem).toBe("seasonal")
      expect(seasonalVehicle.decemberPrice).toBe("400.00")
      expect(calendarVehicle.pricingSystem).toBe("calendar")

      const calendarPricing = await db
        .select()
        .from(vehicleCalendarPricing)
        .where(eq(vehicleCalendarPricing.vehicleId, calendarVehicle.id))

      expect(calendarPricing).toHaveLength(1)
      expect(calendarPricing[0].dailyRate).toBe("450.00")
    })
  })
})
