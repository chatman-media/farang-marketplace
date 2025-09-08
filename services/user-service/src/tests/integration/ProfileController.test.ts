import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest"
import { createApp } from "../../app"
import { FastifyInstance } from "fastify"
import { awaitableTestRequest as testRequest } from "../helpers/fastify-test-utils"
import { setupTestDatabase, cleanupTestDatabase } from "../fixtures/database"
import { UserRepository } from "../../repositories/UserRepository"
import { UserEntity } from "../../models/User"
import { UserRole, VerificationStatus } from "@marketplace/shared-types"
import fs from "fs/promises"
import path from "path"

describe("ProfileController Integration Tests", () => {
  let userRepository: UserRepository
  let testUser: any
  let adminUser: any
  let userToken: string
  let adminToken: string
  let testEmail: string
  let adminEmail: string
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.BASE_URL = "http://localhost:3001"
    await setupTestDatabase()
    userRepository = new UserRepository()
    app = await createApp()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    // Create test users with unique emails
    const timestamp = Date.now()
    testEmail = `testuser${timestamp}@example.com`
    adminEmail = `admin${timestamp}@example.com`

    const testUserData = {
      email: testEmail,
      passwordHash: await UserEntity.hashPassword("password123"),
      role: UserRole.USER,
      profile: {
        firstName: "Test",
        lastName: "User",
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
        socialProfiles: [],
        primaryAuthProvider: "email" as any,
      },
    }

    const adminUserData = {
      email: adminEmail,
      passwordHash: await UserEntity.hashPassword("password123"),
      role: UserRole.ADMIN,
      profile: {
        firstName: "Admin",
        lastName: "User",
        rating: 0,
        reviewsCount: 0,
        verificationStatus: VerificationStatus.VERIFIED,
        socialProfiles: [],
        primaryAuthProvider: "email" as any,
      },
    }

    testUser = await userRepository.create(testUserData)
    adminUser = await userRepository.create(adminUserData)

    // Get auth tokens
    const userLoginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: testEmail,
        password: "password123",
      },
    })

    const adminLoginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: adminEmail,
        password: "password123",
      },
    })

    userToken = JSON.parse(userLoginResponse.body).data.accessToken
    adminToken = JSON.parse(adminLoginResponse.body).data.accessToken
  })

  afterEach(async () => {
    // Clean up test data
    if (testUser) {
      await userRepository.delete(testUser.id)
    }
    if (adminUser) {
      await userRepository.delete(adminUser.id)
    }

    // Clean up uploaded files
    try {
      const uploadsDir = path.join(process.cwd(), "uploads", "profiles")
      const files = await fs.readdir(uploadsDir)
      for (const file of files) {
        if (file.includes(testUser?.id) || file.includes(adminUser?.id)) {
          await fs.unlink(path.join(uploadsDir, file))
        }
      }
    } catch {
      // Directory might not exist, ignore
    }
  })

  describe("GET /api/profile", () => {
    it("should get current user profile successfully", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/profile",
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      const responseBody = JSON.parse(response.body)
      expect(response.statusCode).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data).toMatchObject({
        id: testUser.id,
        email: testEmail,
        role: UserRole.USER,
        profile: {
          firstName: "Test",
          lastName: "User",
          rating: 0,
          reviewsCount: 0,
          verificationStatus: VerificationStatus.UNVERIFIED,
        },
      })
      expect(responseBody.message).toBe("Profile retrieved successfully")
    })

    it("should return 401 when not authenticated", async () => {
      const response = await testRequest(app).get("/api/profile").execute()

      expect(response.statusCode).toBe(401)
      expect(response.body.error.code).toBe("MISSING_TOKEN")
    })
  })

  describe("PUT /api/profile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        location: {
          latitude: 13.7563,
          longitude: 100.5018,
          address: "123 Test Street",
          city: "Bangkok",
          country: "Thailand",
          region: "Bangkok",
        },
      }

      const response = await testRequest(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .execute()

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.profile).toMatchObject({
        firstName: "Updated",
        lastName: "Name",
        location: updateData.location,
      })
      expect(response.body.message).toBe("Profile updated successfully")
    })

    it("should validate profile data", async () => {
      const invalidData = {
        firstName: "", // Empty string should fail validation
        lastName: "Valid",
        location: {
          latitude: "invalid", // Should be a number
          longitude: 100.5018,
        },
      }

      const response = await testRequest(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData)
        .execute()

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
      // The error message should contain validation details
      expect(response.body.error.message).toContain("Invalid request data")
    })

    it("should return 401 when not authenticated", async () => {
      const response = await testRequest(app).put("/api/profile").send({ firstName: "Test" })

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("MISSING_TOKEN")
    })
  })

  describe("POST /api/profile/avatar", () => {
    it("should upload avatar successfully", async () => {
      // Create a minimal valid JPEG buffer (1x1 pixel)
      const testImageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48,
        0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f,
        0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
        0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03,
        0x11, 0x00, 0x3f, 0x00, 0xb2, 0xc0, 0x07, 0xff, 0xd9,
      ])

      const response = await testRequest(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("avatar", testImageBuffer, "test-avatar.jpg")

      if (response.status !== 200) {
        console.log("Error response:", response.body)
      }
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.avatarUrl).toMatch(/http:\/\/localhost:3001\/uploads\/profiles\/.*\.jpg$/)
      expect(response.body.data.user.profile.avatar).toBeDefined()
      expect(response.body.message).toBe("Avatar uploaded successfully")
    })

    it("should return 400 when no file is provided", async () => {
      const response = await testRequest(app).post("/api/profile/avatar").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("FILE_REQUIRED")
    })

    it("should return 401 when not authenticated", async () => {
      const testImageBuffer = Buffer.from("fake-image-data")

      const response = await testRequest(app)
        .post("/api/profile/avatar")
        .attach("avatar", testImageBuffer, "test-avatar.jpg")

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("MISSING_TOKEN")
    })
  })

  describe("POST /api/profile/verification/request", () => {
    it("should submit verification request successfully", async () => {
      const verificationData = {
        documents: ["passport.jpg", "utility-bill.pdf"],
        notes: "Please verify my account for business purposes",
      }

      const response = await testRequest(app)
        .post("/api/profile/verification/request")
        .set("Authorization", `Bearer ${userToken}`)
        .send(verificationData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.profile.verificationStatus).toBe(VerificationStatus.PENDING)
      expect(response.body.data.verificationRequest).toMatchObject({
        status: VerificationStatus.PENDING,
        documents: verificationData.documents,
        notes: verificationData.notes,
      })
      expect(response.body.message).toBe("Verification request submitted successfully")
    })

    it("should return 400 when user is already verified", async () => {
      // First, verify the user
      await userRepository.update(testUser.id, {
        profile: {
          ...testUser.profile,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      })

      const verificationData = {
        documents: ["passport.jpg"],
      }

      const response = await testRequest(app)
        .post("/api/profile/verification/request")
        .set("Authorization", `Bearer ${userToken}`)
        .send(verificationData)

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("ALREADY_VERIFIED")
    })

    it("should return 400 when verification is already pending", async () => {
      // First, set verification to pending
      await userRepository.update(testUser.id, {
        profile: {
          ...testUser.profile,
          verificationStatus: VerificationStatus.PENDING,
        },
      })

      const verificationData = {
        documents: ["passport.jpg"],
      }

      const response = await testRequest(app)
        .post("/api/profile/verification/request")
        .set("Authorization", `Bearer ${userToken}`)
        .send(verificationData)

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VERIFICATION_PENDING")
    })

    it("should validate verification request data", async () => {
      const invalidData = {
        documents: [], // Empty array should fail validation
      }

      const response = await testRequest(app)
        .post("/api/profile/verification/request")
        .set("Authorization", `Bearer ${userToken}`)
        .send(invalidData)
        .execute()

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
    })
  })

  describe("POST /api/profile/verification/:userId/approve", () => {
    it("should approve verification as admin", async () => {
      // Set user verification to pending first
      await userRepository.update(testUser.id, {
        profile: {
          ...testUser.profile,
          verificationStatus: VerificationStatus.PENDING,
        },
      })

      const response = await testRequest(app)
        .post(`/api/profile/verification/${testUser.id}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.profile.verificationStatus).toBe(VerificationStatus.VERIFIED)
      expect(response.body.message).toBe("User verification approved successfully")
    })

    it("should return 403 when user lacks permissions", async () => {
      const response = await testRequest(app)
        .post(`/api/profile/verification/${testUser.id}/approve`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS")
    })

    it("should return 404 when user not found", async () => {
      // Use a valid UUID format that doesn't exist
      const nonExistentUuid = "123e4567-e89b-12d3-a456-426614174999"
      const response = await testRequest(app)
        .post(`/api/profile/verification/${nonExistentUuid}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe("USER_NOT_FOUND")
    })
  })

  describe("POST /api/profile/verification/:userId/reject", () => {
    it("should reject verification as admin", async () => {
      // Set user verification to pending first
      await userRepository.update(testUser.id, {
        profile: {
          ...testUser.profile,
          verificationStatus: VerificationStatus.PENDING,
        },
      })

      const rejectionData = {
        reason: "Documents are not clear enough",
      }

      const response = await testRequest(app)
        .post(`/api/profile/verification/${testUser.id}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(rejectionData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.profile.verificationStatus).toBe(VerificationStatus.REJECTED)
      expect(response.body.data.rejection.reason).toBe(rejectionData.reason)
      expect(response.body.message).toBe("User verification rejected successfully")
    })

    it("should return 403 when user lacks permissions", async () => {
      const response = await testRequest(app)
        .post(`/api/profile/verification/${testUser.id}/reject`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ reason: "Test" })

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS")
    })
  })

  describe("GET /api/profile/:userId", () => {
    it("should get own profile by ID", async () => {
      const response = await testRequest(app)
        .get(`/api/profile/${testUser.id}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testUser.id)
    })

    it("should get any profile as admin", async () => {
      const response = await testRequest(app)
        .get(`/api/profile/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testUser.id)
    })

    it("should return 403 when accessing other user profile without permissions", async () => {
      const response = await testRequest(app)
        .get(`/api/profile/${adminUser.id}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS")
    })

    it("should return 404 when user not found", async () => {
      // Use a valid UUID format that doesn't exist
      const nonExistentUuid = "123e4567-e89b-12d3-a456-426614174999"
      const response = await testRequest(app)
        .get(`/api/profile/${nonExistentUuid}`)
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe("USER_NOT_FOUND")
    })
  })

  describe("File Upload Validation", () => {
    it("should reject non-image files", async () => {
      const testTextBuffer = Buffer.from("This is not an image")

      const response = await testRequest(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("avatar", testTextBuffer, "test.txt")

      expect(response.status).toBe(400) // Multer middleware returns 400 for invalid file type
      expect(response.body.error.code).toBe("INVALID_FILE_TYPE")
    })

    it("should handle file size limits", async () => {
      // Create a buffer larger than 5MB
      const largeBuf = Buffer.alloc(6 * 1024 * 1024, "a")

      const response = await testRequest(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("avatar", largeBuf, "large-image.jpg")

      expect(response.status).toBe(400) // Multer middleware returns 400 for file size limit
      expect(response.body.error.code).toBe("FILE_TOO_LARGE")
    })
  })

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // This test would require mocking the database to simulate errors
      // For now, we'll test with invalid user ID format
      const response = await testRequest(app)
        .get("/api/profile/invalid-uuid-format")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(500)
      expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR")
    })

    it("should include request ID in error responses", async () => {
      const response = await testRequest(app).get("/api/profile").set("x-request-id", "test-request-123")

      expect(response.status).toBe(401)
      expect(response.body.error.requestId).toBe("test-request-123")
    })

    it("should generate request ID when not provided", async () => {
      const response = await testRequest(app).get("/api/profile")

      expect(response.status).toBe(401)
      expect(response.body.error.requestId).toBeDefined()
      expect(response.body.error.requestId).not.toBe("unknown")
    })
  })
})
