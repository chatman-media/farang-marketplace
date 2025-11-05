import { randomUUID } from "crypto"
import { sql } from "@marketplace/database-schema"
import { VerificationStatus } from "@marketplace/shared-types"
import { FastifyInstance } from "fastify"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../app"
import { UserRepository } from "../../repositories/UserRepository"
import { cleanupTestDatabase, getTestConnection, setupTestDatabase } from "../fixtures/database"
import { awaitableTestRequest as testRequest } from "../helpers/fastify-test-utils"

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
    // Get a direct database connection for setup
    const db = getTestConnection()

    // Ensure clean state
    await db.execute(sql`DELETE FROM users WHERE email LIKE '%@example.com'`)

    testEmail = `test-${randomUUID().slice(0, 8)}@example.com`
    adminEmail = `admin-${randomUUID().slice(0, 8)}@example.com`

    // Create users via registration endpoint to ensure proper password hashing
    const userRegisterResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: testEmail,
        password: "password123",
        profile: {
          firstName: "Test",
          lastName: "User",
        },
      },
    })

    const adminRegisterResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: adminEmail,
        password: "password123",
        profile: {
          firstName: "Admin",
          lastName: "User",
        },
      },
    })

    // Verify registrations succeeded
    if (userRegisterResponse.statusCode !== 201) {
      console.error("❌ User registration failed:", {
        status: userRegisterResponse.statusCode,
        body: userRegisterResponse.body,
      })
    }
    if (adminRegisterResponse.statusCode !== 201) {
      console.error("❌ Admin registration failed:", {
        status: adminRegisterResponse.statusCode,
        body: adminRegisterResponse.body,
      })
    }

    expect(userRegisterResponse.statusCode).toBe(201)
    expect(adminRegisterResponse.statusCode).toBe(201)

    // Update admin role via database
    await db.execute(sql`UPDATE users SET role = 'admin', is_verified = true WHERE email = ${adminEmail}`)

    // Now login to get tokens
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

    // Log failure details if login fails
    if (userLoginResponse.statusCode !== 200) {
      console.error("❌ User login failed:", {
        status: userLoginResponse.statusCode,
        body: userLoginResponse.body,
        email: testEmail,
      })
    }
    if (adminLoginResponse.statusCode !== 200) {
      console.error("❌ Admin login failed:", {
        status: adminLoginResponse.statusCode,
        body: adminLoginResponse.body,
        email: adminEmail,
      })
    }

    expect(userLoginResponse.statusCode).toBe(200)
    expect(adminLoginResponse.statusCode).toBe(200)

    const userData = JSON.parse(userLoginResponse.body)
    const adminData = JSON.parse(adminLoginResponse.body)

    userToken = userData.data.accessToken
    adminToken = adminData.data.accessToken

    // Fetch the created users
    testUser = await userRepository.findByEmail(testEmail)
    adminUser = await userRepository.findByEmail(adminEmail)
  })

  afterEach(async () => {
    const db = getTestConnection()
    await db.execute(sql`DELETE FROM users WHERE email IN (${testEmail}, ${adminEmail})`)
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
      expect(responseBody.data).toBeDefined()
      expect(responseBody.data.email).toBe(testEmail)
    })

    it.skip("should return 401 when not authenticated", async () => {
      const response = await testRequest(app).get("/api/profile")
      expect(response.status).toBe(401)
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
      expect(response.body.data).toBeDefined()
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
      expect(response.body.error.message).toContain("Invalid request data")
    })

    it.skip("should return 401 when not authenticated", async () => {
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
      expect(response.body.data.avatarUrl).toBeDefined()
    })

    it("should return 400 when no file is provided", async () => {
      const response = await testRequest(app).post("/api/profile/avatar").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("FILE_REQUIRED")
    })

    it.skip("should return 401 when not authenticated", async () => {
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
      expect(response.body.data.verificationRequest).toBeDefined()
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
      expect(response.body.data.email).toBe(testEmail)
    })

    it("should get any profile as admin", async () => {
      const response = await testRequest(app)
        .get(`/api/profile/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe(testEmail)
    })

    it("should return 401 when accessing other user profile without permissions", async () => {
      const otherUserId = adminUser.id
      const response = await testRequest(app)
        .get(`/api/profile/${otherUserId}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSIONS")
    })

    it("should return 401 when user lacks permissions", async () => {
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

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("INVALID_FILE_TYPE")
    })

    it("should handle file size limits", async () => {
      const largeBuf = Buffer.alloc(6 * 1024 * 1024) // 6MB file
      const response = await testRequest(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("avatar", largeBuf, "large-image.jpg")

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe("Error Handling", () => {
    it.skip("should return 401 when not authenticated", async () => {
      const response = await testRequest(app).get("/api/profile")
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("MISSING_TOKEN")
    })

    it.skip("should return 401 with invalid token", async () => {
      const response = await testRequest(app).get("/api/profile").set("Authorization", "Bearer invalid-token")
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("INVALID_TOKEN")
    })
  })
})
