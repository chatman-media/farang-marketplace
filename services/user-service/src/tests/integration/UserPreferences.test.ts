import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { UserRepository } from "../../repositories/UserRepository"
import { UserService } from "../../services/UserService"

describe("User Preferences Integration Tests", () => {
  let userService: UserService
  let userRepository: UserRepository

  beforeEach(async () => {
    userRepository = new UserRepository()
    userService = new UserService(userRepository)
  })

  afterEach(async () => {
    // Clean up test data
    // In a real test environment, you would clean up the test database
  })

  describe("User Preferences Management", () => {
    it("should create user with default preferences", async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: "password123",
        phone: "+1234567890",
        profile: {
          firstName: "John",
          lastName: "Doe",
        },
      }

      const user = await userService.createUser(userData)

      expect(user).toBeDefined()
      expect(user.profile.preferences).toBeDefined()
      expect(user.profile.preferences?.language).toBe("en")
      expect(user.profile.preferences?.currency).toBe("USD")
      expect(user.profile.preferences?.notifications.email).toBe(true)
      expect(user.profile.preferences?.notifications.push).toBe(true)
      expect(user.profile.preferences?.notifications.sms).toBe(false)
      expect(user.profile.preferences?.notifications.telegram).toBe(false)
      expect(user.profile.preferences?.notifications.whatsapp).toBe(false)
      expect(user.profile.preferences?.notifications.line).toBe(false)
    })

    it("should update user preferences", async () => {
      // Create user first
      const userData = {
        email: `test2-${Date.now()}@example.com`,
        password: "password123",
        profile: {
          firstName: "Jane",
          lastName: "Smith",
        },
      }

      const user = await userService.createUser(userData)

      // Update preferences
      const updateData = {
        profile: {
          preferences: {
            language: "th",
            currency: "THB",
            timezone: "Asia/Bangkok",
            notifications: {
              email: true,
              push: true,
              sms: false,
              telegram: true,
              whatsapp: false,
              line: true,
            },
          },
        },
      }

      const updatedUser = await userService.updateUser(user.id, updateData)

      expect(updatedUser).toBeDefined()
      expect(updatedUser?.profile.preferences?.language).toBe("th")
      expect(updatedUser?.profile.preferences?.currency).toBe("THB")
      expect(updatedUser?.profile.preferences?.timezone).toBe("Asia/Bangkok")
      expect(updatedUser?.profile.preferences?.notifications.telegram).toBe(true)
      expect(updatedUser?.profile.preferences?.notifications.line).toBe(true)
    })

    it("should validate language preferences", async () => {
      const userData = {
        email: `test3-${Date.now()}@example.com`,
        password: "password123",
        profile: {
          firstName: "Test",
          lastName: "User",
          preferences: {
            language: "invalid",
            currency: "USD",
            notifications: {
              email: true,
              push: true,
              sms: false,
              telegram: false,
              whatsapp: false,
              line: false,
            },
          },
        },
      }

      // This should throw an error due to invalid language
      await expect(userService.createUser(userData)).rejects.toThrow()
    })

    it("should validate currency preferences", async () => {
      const userData = {
        email: `test4-${Date.now()}@example.com`,
        password: "password123",
        profile: {
          firstName: "Test",
          lastName: "User",
          preferences: {
            language: "en",
            currency: "INVALID", // Invalid currency format
            notifications: {
              email: true,
              push: true,
              sms: false,
              telegram: false,
              whatsapp: false,
              line: false,
            },
          },
        },
      }

      // This should throw an error due to invalid currency
      await expect(userService.createUser(userData)).rejects.toThrow()
    })

    it("should support all notification channels", async () => {
      const userData = {
        email: `test5-${Date.now()}@example.com`,
        password: "password123",
        profile: {
          firstName: "Multi",
          lastName: "Channel",
          preferences: {
            language: "en",
            currency: "USD",
            notifications: {
              email: true,
              push: true,
              sms: true,
              telegram: true,
              whatsapp: true,
              line: true,
            },
          },
        },
      }

      const user = await userService.createUser(userData)

      expect(user.profile.preferences?.notifications.email).toBe(true)
      expect(user.profile.preferences?.notifications.push).toBe(true)
      expect(user.profile.preferences?.notifications.sms).toBe(true)
      expect(user.profile.preferences?.notifications.telegram).toBe(true)
      expect(user.profile.preferences?.notifications.whatsapp).toBe(true)
      expect(user.profile.preferences?.notifications.line).toBe(true)
    })

    it("should support international phone numbers", async () => {
      const timestamp = Date.now()
      const testCases = [
        "+1234567890", // US
        "+66123456789", // Thailand
        "+7123456789", // Russia
        "+86123456789", // China
        "+966123456789", // Saudi Arabia
      ]

      for (let i = 0; i < testCases.length; i++) {
        const basePhone = testCases[i]
        // Make phone unique by replacing last 3 digits with unique number
        // Ensure it stays within 6-14 digits after country code
        const uniqueDigits = (timestamp + i).toString().slice(-3)
        const phone = basePhone.slice(0, -3) + uniqueDigits
        const userData = {
          email: `test-${phone.replace(/\+/g, "")}-${timestamp}-${i}@example.com`,
          password: "password123",
          phone,
          profile: {
            firstName: "International",
            lastName: "User",
          },
        }

        const user = await userService.createUser(userData)
        expect(user.phone).toBe(phone)
      }
    })

    it("should reject invalid phone numbers", async () => {
      const invalidPhones = [
        "123", // Too short
        "+0123456789", // Starts with 0
        "invalid-phone", // Non-numeric
        "+123456789012345678", // Too long
      ]

      for (const phone of invalidPhones) {
        const userData = {
          email: `invalid-${Date.now()}@example.com`,
          password: "password123",
          phone,
          profile: {
            firstName: "Invalid",
            lastName: "Phone",
          },
        }

        await expect(userService.createUser(userData)).rejects.toThrow()
      }
    })
  })

  describe("Multi-language Support", () => {
    it("should support all 5 languages", async () => {
      const languages = ["en", "ru", "th", "cn", "ar"]

      for (const language of languages) {
        const userData = {
          email: `${language}-${Date.now()}@example.com`,
          password: "password123",
          profile: {
            firstName: "Multi",
            lastName: "Lang",
            preferences: {
              language,
              currency: "USD",
              notifications: {
                email: true,
                push: true,
                sms: false,
                telegram: false,
                whatsapp: false,
                line: false,
              },
            },
          },
        }

        const user = await userService.createUser(userData)
        expect(user.profile.preferences?.language).toBe(language)
      }
    })
  })
})
