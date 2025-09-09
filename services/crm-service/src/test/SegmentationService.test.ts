import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { SegmentationService } from "../services/SegmentationService"
import { Segment, SegmentOperator, SegmentDataType } from "../models/Segment"
import { query } from "../db/connection"

describe("SegmentationService", () => {
  let segmentationService: SegmentationService
  let testSegmentId: string
  let testUserId: string

  beforeEach(async () => {
    segmentationService = new SegmentationService()
    testUserId = "123e4567-e89b-12d3-a456-426614174000" // Valid UUID

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
  })

  describe("createSegment", () => {
    it("should create a new segment successfully", async () => {
      const segmentData = {
        name: "Test High Value Customers",
        description: "Test segment for high value customers",
        criteria: [
          {
            field: "lifetimeValue",
            operator: SegmentOperator.GREATER_THAN,
            value: 1000,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND" as const,
        isActive: true,
      }

      const segment = await segmentationService.createSegment(segmentData, testUserId)
      testSegmentId = segment.id

      expect(segment).toBeInstanceOf(Segment)
      expect(segment.name).toBe(segmentData.name)
      expect(segment.description).toBe(segmentData.description)
      expect(segment.criteria).toEqual(segmentData.criteria)
      expect(segment.operator).toBe(segmentData.operator)
      expect(segment.isActive).toBe(segmentData.isActive)
      expect(segment.createdBy).toBe(testUserId)
      expect(segment.id).toBeDefined()
      expect(segment.createdAt).toBeInstanceOf(Date)
      expect(segment.updatedAt).toBeInstanceOf(Date)
    })

    it("should fail to create segment with duplicate name", async () => {
      const segmentData = {
        name: "Test Duplicate Segment",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "lead",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND" as const,
      }

      // Create first segment
      const firstSegment = await segmentationService.createSegment(segmentData, testUserId)
      testSegmentId = firstSegment.id

      // Try to create second segment with same name
      await expect(segmentationService.createSegment(segmentData, testUserId)).rejects.toThrow(
        'Segment with name "Test Duplicate Segment" already exists',
      )
    })

    it("should fail to create segment with invalid data", async () => {
      const invalidData = {
        name: "", // Invalid: empty name
        criteria: [],
        operator: "AND" as const,
      }

      await expect(segmentationService.createSegment(invalidData, testUserId)).rejects.toThrow("Validation failed")
    })
  })

  describe("getSegmentById", () => {
    it("should retrieve segment by ID", async () => {
      // Create a test segment
      const segmentData = {
        name: "Test Segment By ID",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "customer",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND" as const,
      }

      const createdSegment = await segmentationService.createSegment(segmentData, testUserId)
      testSegmentId = createdSegment.id

      // Retrieve the segment
      const retrievedSegment = await segmentationService.getSegmentById(testSegmentId)

      expect(retrievedSegment).toBeInstanceOf(Segment)
      expect(retrievedSegment?.id).toBe(testSegmentId)
      expect(retrievedSegment?.name).toBe(segmentData.name)
    })

    it("should return null for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const segment = await segmentationService.getSegmentById(nonExistentId)

      expect(segment).toBeNull()
    })
  })

  describe("getSegmentByName", () => {
    it("should retrieve segment by name", async () => {
      const segmentData = {
        name: "Test Segment By Name",
        criteria: [
          {
            field: "leadScore",
            operator: SegmentOperator.GREATER_THAN,
            value: 80,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND" as const,
      }

      const createdSegment = await segmentationService.createSegment(segmentData, testUserId)
      testSegmentId = createdSegment.id

      const retrievedSegment = await segmentationService.getSegmentByName(segmentData.name)

      expect(retrievedSegment).toBeInstanceOf(Segment)
      expect(retrievedSegment?.name).toBe(segmentData.name)
    })

    it("should return null for non-existent segment name", async () => {
      const segment = await segmentationService.getSegmentByName("Non-existent Segment")
      expect(segment).toBeNull()
    })
  })

  describe("getSegments", () => {
    it("should retrieve segments with pagination", async () => {
      // Create multiple test segments
      const segmentNames = ["Test Segment 1", "Test Segment 2", "Test Segment 3"]
      const createdSegments = []

      for (const name of segmentNames) {
        const segment = await segmentationService.createSegment(
          {
            name,
            criteria: [
              {
                field: "status",
                operator: SegmentOperator.EQUALS,
                value: "lead",
                dataType: SegmentDataType.ENUM,
              },
            ],
            operator: "AND" as const,
          },
          testUserId,
        )
        createdSegments.push(segment)
      }

      const result = await segmentationService.getSegments({ limit: 2, offset: 0 })

      expect(result.segments).toBeInstanceOf(Array)
      expect(result.segments.length).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(3)

      // Clean up
      for (const segment of createdSegments) {
        await query("DELETE FROM customer_segments WHERE id = $1", [segment.id])
      }
    })

    it("should filter segments by active status", async () => {
      // Create active and inactive segments
      const activeSegment = await segmentationService.createSegment(
        {
          name: "Test Active Segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
          isActive: true,
        },
        testUserId,
      )

      const inactiveSegment = await segmentationService.createSegment(
        {
          name: "Test Inactive Segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
          isActive: false,
        },
        testUserId,
      )

      const activeResult = await segmentationService.getSegments({ isActive: true })
      const inactiveResult = await segmentationService.getSegments({ isActive: false })

      expect(activeResult.segments.every((s) => s.isActive)).toBe(true)
      expect(inactiveResult.segments.every((s) => !s.isActive)).toBe(true)

      // Clean up
      await query("DELETE FROM customer_segments WHERE id IN ($1, $2)", [activeSegment.id, inactiveSegment.id])
    })

    it("should search segments by name and description", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "Test Searchable Segment",
          description: "This is a searchable test segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
        },
        testUserId,
      )

      const searchResult = await segmentationService.getSegments({ search: "Searchable" })

      expect(searchResult.segments.length).toBeGreaterThan(0)
      expect(searchResult.segments.some((s) => s.name.includes("Searchable"))).toBe(true)

      // Clean up
      await query("DELETE FROM customer_segments WHERE id = $1", [segment.id])
    })
  })

  describe("updateSegment", () => {
    it("should update segment successfully", async () => {
      // Create a test segment
      const segment = await segmentationService.createSegment(
        {
          name: "Test Update Segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
        },
        testUserId,
      )
      const segmentId = segment.id

      try {
        // Update the segment
        const updateData = {
          name: `Updated Test Segment ${Date.now()}`,
          description: "Updated description",
          isActive: false,
        }

        const updatedSegment = await segmentationService.updateSegment(segmentId, updateData)

        expect(updatedSegment).toBeInstanceOf(Segment)
        expect(updatedSegment?.name).toBe(updateData.name)
        expect(updatedSegment?.description).toBe(updateData.description)
        expect(updatedSegment?.isActive).toBe(updateData.isActive)
      } finally {
        // Clean up the test segment
        await query("DELETE FROM customer_segment_memberships WHERE segment_id = $1", [segmentId])
        await query("DELETE FROM customer_segments WHERE id = $1", [segmentId])
      }
    })

    it("should return null for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const result = await segmentationService.updateSegment(nonExistentId, { name: "New Name" })

      expect(result).toBeNull()
    })
  })

  describe("deleteSegment", () => {
    it("should delete segment successfully", async () => {
      // Create a test segment
      const segment = await segmentationService.createSegment(
        {
          name: "Test Delete Segment",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND" as const,
        },
        testUserId,
      )

      // Don't set testSegmentId since we're deleting it in this test
      const deleted = await segmentationService.deleteSegment(segment.id)
      expect(deleted).toBe(true)

      // Verify segment is deleted
      const retrievedSegment = await segmentationService.getSegmentById(segment.id)
      expect(retrievedSegment).toBeNull()
    })

    it("should return false for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const deleted = await segmentationService.deleteSegment(nonExistentId)

      expect(deleted).toBe(false)
    })
  })

  describe("getSegmentStats", () => {
    it("should return segment statistics", async () => {
      const stats = await segmentationService.getSegmentStats()

      expect(stats).toHaveProperty("totalSegments")
      expect(stats).toHaveProperty("activeSegments")
      expect(stats).toHaveProperty("totalMemberships")
      expect(stats).toHaveProperty("averageSegmentSize")
      expect(stats).toHaveProperty("largestSegment")

      expect(typeof stats.totalSegments).toBe("number")
      expect(typeof stats.activeSegments).toBe("number")
      expect(typeof stats.totalMemberships).toBe("number")
      expect(typeof stats.averageSegmentSize).toBe("number")
    })
  })

  describe("buildSegmentQuery", () => {
    it("should build simple query for single criteria", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "Test Segment",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "lead",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Test that the method doesn't throw errors
      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })
  })
})
