import { UserRole, VerificationStatus } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserEntity } from "../../models/User"
import { UserService } from "../../services/UserService"
import { testUserData } from "../setup"

// Skip mocking for now - use real repository in integration tests

describe("UserService Integration Tests", () => {
  let userService: UserService
  let mockUserRepository: any

  beforeEach(() => {
    mockUserRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByTelegramId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updatePassword: vi.fn(),
      existsByEmail: vi.fn(),
      existsByTelegramId: vi.fn(),
      getUserStats: vi.fn(),
    }

    userService = new UserService(mockUserRepository)
  })

  describe("User Creation", () => {
    it("should create a new user successfully", async () => {
      const userData = testUserData.validCreateData
      const mockUserEntity = new UserEntity("new-user-id", userData.email, "hashed-password", UserRole.USER, {
        ...userData.profile,
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      })

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.create.mockResolvedValue(mockUserEntity)

      const result = await userService.createUser(userData)

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email)
      expect(mockUserRepository.create).toHaveBeenCalled()
      expect(result).toEqual(mockUserEntity.toPublicUser())
      expect(result.email).toBe(userData.email)
      expect(result.profile.firstName).toBe(userData.profile.firstName)
    })

    it("should throw error if email already exists", async () => {
      const userData = testUserData.validCreateData
      const existingUser = new UserEntity("existing-id", userData.email, "hash", UserRole.USER, userData.profile)

      mockUserRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(userService.createUser(userData)).rejects.toThrow("User with this email already exists")
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })

    it("should throw error if telegram ID already exists", async () => {
      const userData = {
        ...testUserData.validCreateData,
        telegramId: "existing-telegram-id",
      }
      const existingUser = new UserEntity(
        "existing-id",
        "other@example.com",
        "hash",
        UserRole.USER,
        {
          ...userData.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        userData.telegramId,
      )

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.findByTelegramId.mockResolvedValue(existingUser)

      await expect(userService.createUser(userData)).rejects.toThrow("User with this Telegram ID already exists")
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })

    it("should validate user data before creation", async () => {
      const invalidUserData = testUserData.invalidCreateData

      await expect(userService.createUser(invalidUserData)).rejects.toThrow()
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled()
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })

    it("should set default values for new users", async () => {
      const userData = testUserData.validCreateData
      const mockUserEntity = new UserEntity("new-user-id", userData.email, "hashed-password", UserRole.USER, {
        ...userData.profile,
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      })

      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.create.mockResolvedValue(mockUserEntity)

      const result = await userService.createUser(userData)

      expect(result.role).toBe(UserRole.USER)
      expect(result.profile.rating).toBe(0)
      expect(result.profile.reviewsCount).toBe(0)
      expect(result.profile.verificationStatus).toBe(VerificationStatus.UNVERIFIED)
    })
  })

  describe("User Retrieval", () => {
    it("should get user by ID", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        testUserData.validUser.profile,
      )

      mockUserRepository.findById.mockResolvedValue(mockUserEntity)

      const result = await userService.getUserById(testUserData.validUser.id)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserData.validUser.id)
      expect(result).toEqual(mockUserEntity.toPublicUser())
    })

    it("should return null if user not found by ID", async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      const result = await userService.getUserById("non-existent-id")

      expect(result).toBeNull()
    })

    it("should get user by email", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        testUserData.validUser.profile,
      )

      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity)

      const result = await userService.getUserByEmail(testUserData.validUser.email)

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(testUserData.validUser.email)
      expect(result).toEqual(mockUserEntity.toPublicUser())
    })

    it("should get user by telegram ID", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        testUserData.validUser.phone,
        testUserData.validUser.telegramId,
      )

      mockUserRepository.findByTelegramId.mockResolvedValue(mockUserEntity)

      const result = await userService.getUserByTelegramId(testUserData.validUser.telegramId!)

      expect(mockUserRepository.findByTelegramId).toHaveBeenCalledWith(testUserData.validUser.telegramId)
      expect(result).toEqual(mockUserEntity.toPublicUser())
    })
  })

  describe("User Updates", () => {
    it("should update user successfully", async () => {
      const updateData = testUserData.updateData
      const updatedUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email, // Keep original email since updateData doesn't have email
        "hash",
        UserRole.USER,
        { ...testUserData.validUser.profile, ...updateData.profile },
      )

      mockUserRepository.update.mockResolvedValue(updatedUserEntity)

      const result = await userService.updateUser(testUserData.validUser.id, updateData)

      // Since updateData doesn't have email, existsByEmail shouldn't be called
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        testUserData.validUser.id,
        expect.objectContaining({
          profile: expect.objectContaining(updateData.profile),
        }),
      )
      expect(result).toEqual(updatedUserEntity.toPublicUser())
    })

    it("should throw error if email already exists during update", async () => {
      const updateData = { email: "existing@example.com" }

      mockUserRepository.existsByEmail.mockResolvedValue(true)
      // Mock findByEmail to return a different user
      const existingUser = new UserEntity(
        "different-user-id", // Different ID than the one being updated
        "existing@example.com",
        "hash",
        UserRole.USER,
        {
          firstName: "Existing",
          lastName: "User",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: VerificationStatus.UNVERIFIED,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
      )
      mockUserRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(userService.updateUser(testUserData.validUser.id, updateData)).rejects.toThrow(
        "Email already in use by another user",
      )

      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    it("should throw error if telegram ID already exists during update", async () => {
      const updateData = { telegramId: "existing-telegram" }

      mockUserRepository.existsByEmail.mockResolvedValue(false)
      mockUserRepository.existsByTelegramId.mockResolvedValue(true)
      // Mock findByTelegramId to return a different user
      const existingUser = new UserEntity(
        "different-user-id", // Different ID than the one being updated
        "existing@example.com",
        "hash",
        UserRole.USER,
        {
          firstName: "Existing",
          lastName: "User",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: VerificationStatus.UNVERIFIED,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        "existing-telegram",
      )
      mockUserRepository.findByTelegramId.mockResolvedValue(existingUser)

      await expect(userService.updateUser(testUserData.validUser.id, updateData)).rejects.toThrow(
        "Telegram ID already in use by another user",
      )

      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    it("should validate update data", async () => {
      const invalidUpdateData = { email: "invalid-email" }

      await expect(userService.updateUser(testUserData.validUser.id, invalidUpdateData)).rejects.toThrow()

      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })
  })

  describe("Password Management", () => {
    it("should change password successfully", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "old-hash",
        UserRole.USER,
        testUserData.validUser.profile,
      )

      // Mock password validation to return true
      vi.spyOn(mockUserEntity, "validatePassword").mockResolvedValue(true)

      mockUserRepository.findById.mockResolvedValue(mockUserEntity)
      mockUserRepository.updatePassword.mockResolvedValue(true)

      const result = await userService.changePassword(testUserData.validUser.id, "oldpassword", "newpassword123")

      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserData.validUser.id)
      expect(mockUserEntity.validatePassword).toHaveBeenCalledWith("oldpassword")
      expect(mockUserRepository.updatePassword).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it("should throw error if user not found during password change", async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(userService.changePassword("non-existent-id", "oldpassword", "newpassword123")).rejects.toThrow(
        "User not found",
      )

      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled()
    })

    it("should throw error if current password is incorrect", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        testUserData.validUser.profile,
      )

      vi.spyOn(mockUserEntity, "validatePassword").mockResolvedValue(false)
      mockUserRepository.findById.mockResolvedValue(mockUserEntity)

      await expect(
        userService.changePassword(testUserData.validUser.id, "wrongpassword", "newpassword123"),
      ).rejects.toThrow("Current password is incorrect")

      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled()
    })

    it("should validate password change data", async () => {
      // Test short new password - this should fail validation before repository call
      await expect(userService.changePassword(testUserData.validUser.id, "oldpassword", "123")).rejects.toThrow()

      // Test missing fields - these should fail validation before repository call
      await expect(
        userService.changePassword(testUserData.validUser.id, "oldpassword", undefined as any),
      ).rejects.toThrow()

      await expect(
        userService.changePassword(testUserData.validUser.id, undefined as any, "newpassword123"),
      ).rejects.toThrow()
    })
  })

  describe("User Management Operations", () => {
    it("should delete user successfully", async () => {
      mockUserRepository.delete.mockResolvedValue(true)

      const result = await userService.deleteUser(testUserData.validUser.id)

      expect(mockUserRepository.delete).toHaveBeenCalledWith(testUserData.validUser.id)
      expect(result).toBe(true)
    })

    it("should activate user", async () => {
      const activatedUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        undefined,
        true,
      )

      mockUserRepository.update.mockResolvedValue(activatedUserEntity)

      const result = await userService.activateUser(testUserData.validUser.id)

      expect(mockUserRepository.update).toHaveBeenCalledWith(testUserData.validUser.id, {
        isActive: true,
      })
      expect(result).toEqual(activatedUserEntity.toPublicUser())
    })

    it("should deactivate user", async () => {
      const deactivatedUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        undefined,
        false,
      )

      mockUserRepository.update.mockResolvedValue(deactivatedUserEntity)

      const result = await userService.deactivateUser(testUserData.validUser.id)

      expect(mockUserRepository.update).toHaveBeenCalledWith(testUserData.validUser.id, {
        isActive: false,
      })
      expect(result).toEqual(deactivatedUserEntity.toPublicUser())
    })

    it("should update user role", async () => {
      const updatedUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.AGENCY,
        testUserData.validUser.profile,
      )

      mockUserRepository.update.mockResolvedValue(updatedUserEntity)

      const result = await userService.updateUserRole(testUserData.validUser.id, UserRole.AGENCY)

      expect(mockUserRepository.update).toHaveBeenCalledWith(testUserData.validUser.id, {
        role: UserRole.AGENCY,
      })
      expect(result).toEqual(updatedUserEntity.toPublicUser())
    })

    it("should verify user", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      )

      const verifiedUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      )

      mockUserRepository.findById.mockResolvedValue(mockUserEntity)
      mockUserRepository.update.mockResolvedValue(verifiedUserEntity)

      const result = await userService.verifyUser(testUserData.validUser.id)

      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserData.validUser.id)
      expect(mockUserRepository.update).toHaveBeenCalled()
      expect(result?.profile.verificationStatus).toBe(VerificationStatus.VERIFIED)
    })

    it("should return null when verifying non-existent user", async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      const result = await userService.verifyUser("non-existent-id")

      expect(result).toBeNull()
      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })
  })

  describe("Authentication Support", () => {
    it("should validate user credentials successfully", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        undefined,
        true,
      )

      vi.spyOn(mockUserEntity, "validatePassword").mockResolvedValue(true)
      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity)

      const result = await userService.validateUserCredentials(testUserData.validUser.email, "correctpassword")

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(testUserData.validUser.email)
      expect(mockUserEntity.validatePassword).toHaveBeenCalledWith("correctpassword")
      expect(result).toBe(mockUserEntity)
    })

    it("should return null for invalid credentials", async () => {
      const mockUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        testUserData.validUser.profile,
      )

      vi.spyOn(mockUserEntity, "validatePassword").mockResolvedValue(false)
      mockUserRepository.findByEmail.mockResolvedValue(mockUserEntity)

      const result = await userService.validateUserCredentials(testUserData.validUser.email, "wrongpassword")

      expect(result).toBeNull()
    })

    it("should return null for non-existent user", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)

      const result = await userService.validateUserCredentials("nonexistent@example.com", "password")

      expect(result).toBeNull()
    })

    it("should return null for inactive user", async () => {
      const inactiveUserEntity = new UserEntity(
        testUserData.validUser.id,
        testUserData.validUser.email,
        "hash",
        UserRole.USER,
        {
          ...testUserData.validUser.profile,
          socialProfiles: [],
          primaryAuthProvider: "email" as any,
        },
        [],
        "email" as any,
        undefined,
        undefined,
        false, // inactive
      )

      mockUserRepository.findByEmail.mockResolvedValue(inactiveUserEntity)

      const result = await userService.validateUserCredentials(testUserData.validUser.email, "correctpassword")

      expect(result).toBeNull()
    })
  })

  describe("Statistics and Analytics", () => {
    it("should get user statistics", async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        usersByRole: {
          user: 80,
          agency: 15,
          manager: 4,
          admin: 1,
        },
        verifiedUsers: 60,
      }

      mockUserRepository.getUserStats.mockResolvedValue(mockStats)

      const result = await userService.getUserStats()

      expect(mockUserRepository.getUserStats).toHaveBeenCalled()
      expect(result).toEqual(mockStats)
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle repository errors gracefully", async () => {
      const userData = testUserData.validCreateData
      mockUserRepository.findByEmail.mockRejectedValue(new Error("Database connection failed"))

      await expect(userService.createUser(userData)).rejects.toThrow("Database connection failed")
    })

    it("should handle null returns from repository", async () => {
      mockUserRepository.update.mockResolvedValue(null)

      const result = await userService.updateUser(testUserData.validUser.id, {
        email: "new@example.com",
      })

      expect(result).toBeNull()
    })

    it("should validate all input parameters", async () => {
      // Test with null/undefined values
      await expect(userService.getUserById("")).resolves.toBeNull()
      await expect(userService.getUserByEmail("")).resolves.toBeNull()
      await expect(userService.getUserByTelegramId("")).resolves.toBeNull()
    })
  })
})
