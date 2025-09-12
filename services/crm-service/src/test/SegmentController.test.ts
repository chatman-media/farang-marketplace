import { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { query } from "../db/connection"
import { createApp } from "../index"
import { SegmentDataType, SegmentOperator } from "../models/Segment"

describe("SegmentController", () => {
  let app: FastifyInstance
  let testSegmentId: string
  let authToken: string

  beforeEach(async () => {
    app = await createApp()

    // Mock authentication middleware to bypass auth in tests
    app.addHook("preHandler", async (request: any, reply) => {
      if (request.url.startsWith("/api/crm/segments")) {
        request.user = { id: "123e4567-e89b-12d3-a456-426614174000", role: "admin" }
      }
    })

    await app.ready()

    // Mock authentication for tests
    authToken = "test-auth-token"

    // Clean up any existing test data
    await query(
      "DELETE FROM customer_segment_memberships WHERE segment_id IN (SELECT id FROM customer_segments WHERE name LIKE 'Test%')",
    )
    await query("DELETE FROM customer_segments WHERE name LIKE 'Test%'")
  })

  afterEach(async () => {
    // Clean up test data
    if (testSegmentId) {
      await query("DELETE FROM customer_segment_memberships WHERE segment_id = $1", [testSegmentId])
      await query("DELETE FROM customer_segments WHERE id = $1", [testSegmentId])
    }
    await query(
      "DELETE FROM customer_segment_memberships WHERE segment_id IN (SELECT id FROM customer_segments WHERE name LIKE 'Test%')",
    )
    await query("DELETE FROM customer_segments WHERE name LIKE 'Test%'")

    await app.close()
  })

  describe("GET /api/crm/segments", () => {
    it("should return segments list", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(20)
    })

    it("should support pagination parameters", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments?page=2&limit=5",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.pagination.page).toBe(2)
      expect(body.pagination.limit).toBe(5)
    })

    it("should support filtering by active status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments?isActive=true",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      // All returned segments should be active
      body.data.forEach((segment: any) => {
        expect(segment.isActive).toBe(true)
      })
    })

    it("should support search functionality", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments?search=High%20Value",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })
  })

  describe("POST /api/crm/segments", () => {
    it("should create a new segment", async () => {
      const segmentData = {
        name: "Test API Segment",
        description: "Test segment created via API",
        criteria: [
          {
            field: "lifetimeValue",
            operator: SegmentOperator.GREATER_THAN,
            value: 500,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
        isActive: true,
      }

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.name).toBe(segmentData.name)
      expect(body.data.description).toBe(segmentData.description)
      expect(body.data.criteria).toEqual(segmentData.criteria)
      expect(body.data.operator).toBe(segmentData.operator)
      expect(body.data.isActive).toBe(segmentData.isActive)
      expect(body.data.id).toBeDefined()

      testSegmentId = body.data.id
    })

    it("should fail with validation errors for invalid data", async () => {
      const invalidData = {
        name: "", // Invalid: empty name
        criteria: [], // Invalid: empty criteria
        operator: "AND",
      }

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: invalidData,
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("Validation failed")
      expect(body.details).toBeInstanceOf(Array)
      expect(body.details.length).toBeGreaterThan(0)
    })

    it("should fail with conflict error for duplicate name", async () => {
      const segmentData = {
        name: "Test Duplicate API Segment",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "lead",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
      }

      // Create first segment
      const firstResponse = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      expect(firstResponse.statusCode).toBe(201)
      const firstBody = JSON.parse(firstResponse.body)
      testSegmentId = firstBody.data.id

      // Try to create second segment with same name
      const secondResponse = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      expect(secondResponse.statusCode).toBe(409)
      const secondBody = JSON.parse(secondResponse.body)
      expect(secondBody.success).toBe(false)
      expect(secondBody.error).toBe("Segment already exists")
    })
  })

  describe("GET /api/crm/segments/:id", () => {
    it("should return segment by ID", async () => {
      // First create a segment
      const segmentData = {
        name: "Test Get Segment",
        criteria: [
          {
            field: "leadScore",
            operator: SegmentOperator.GREATER_THAN,
            value: 75,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
      }

      const createResponse = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      const createBody = JSON.parse(createResponse.body)
      testSegmentId = createBody.data.id

      // Now get the segment
      const getResponse = await app.inject({
        method: "GET",
        url: `/api/crm/segments/${testSegmentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(getResponse.statusCode).toBe(200)
      const getBody = JSON.parse(getResponse.body)
      expect(getBody.success).toBe(true)
      expect(getBody.data.id).toBe(testSegmentId)
      expect(getBody.data.name).toBe(segmentData.name)
    })

    it("should return 404 for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const response = await app.inject({
        method: "GET",
        url: `/api/crm/segments/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("Segment not found")
    })
  })

  describe("PUT /api/crm/segments/:id", () => {
    it("should update segment successfully", async () => {
      // First create a segment
      const segmentData = {
        name: "Test Update Segment",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "customer",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
      }

      const createResponse = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      const createBody = JSON.parse(createResponse.body)
      testSegmentId = createBody.data.id

      // Update the segment
      const updateData = {
        name: "Updated Test Segment",
        description: "Updated description",
        isActive: false,
      }

      const updateResponse = await app.inject({
        method: "PUT",
        url: `/api/crm/segments/${testSegmentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: updateData,
      })

      expect(updateResponse.statusCode).toBe(200)
      const updateBody = JSON.parse(updateResponse.body)
      expect(updateBody.success).toBe(true)
      expect(updateBody.data.name).toBe(updateData.name)
      expect(updateBody.data.description).toBe(updateData.description)
      expect(updateBody.data.isActive).toBe(updateData.isActive)
    })

    it("should return 404 for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const updateData = { name: "New Name" }

      const response = await app.inject({
        method: "PUT",
        url: `/api/crm/segments/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: updateData,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("Segment not found")
    })
  })

  describe("DELETE /api/crm/segments/:id", () => {
    it("should delete segment successfully", async () => {
      // First create a segment
      const segmentData = {
        name: "Test Delete Segment",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "lead",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
      }

      const createResponse = await app.inject({
        method: "POST",
        url: "/api/crm/segments",
        headers: {
          authorization: `Bearer ${authToken}`,
          "content-type": "application/json",
        },
        payload: segmentData,
      })

      const createBody = JSON.parse(createResponse.body)
      const segmentId = createBody.data.id

      // Delete the segment
      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/api/crm/segments/${segmentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(deleteResponse.statusCode).toBe(200)
      const deleteBody = JSON.parse(deleteResponse.body)
      expect(deleteBody.success).toBe(true)

      // Verify segment is deleted
      const getResponse = await app.inject({
        method: "GET",
        url: `/api/crm/segments/${segmentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(getResponse.statusCode).toBe(404)
    })

    it("should return 404 for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const response = await app.inject({
        method: "DELETE",
        url: `/api/crm/segments/${nonExistentId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("Segment not found")
    })
  })

  describe("GET /api/crm/segments/fields", () => {
    it("should return available segment fields", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments/fields",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeInstanceOf(Array)
      expect(body.data.length).toBeGreaterThan(0)

      // Check field structure
      const firstField = body.data[0]
      expect(firstField).toHaveProperty("key")
      expect(firstField).toHaveProperty("label")
      expect(firstField).toHaveProperty("dataType")
      expect(firstField).toHaveProperty("operators")
    })
  })

  describe("GET /api/crm/segments/stats", () => {
    it("should return segment statistics", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/segments/stats",
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty("totalSegments")
      expect(body.data).toHaveProperty("activeSegments")
      expect(body.data).toHaveProperty("totalMemberships")
      expect(body.data).toHaveProperty("averageSegmentSize")
      expect(body.data).toHaveProperty("largestSegment")
    })
  })
})
