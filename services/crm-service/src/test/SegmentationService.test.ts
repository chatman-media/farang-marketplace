import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest"
import { closePool, query } from "../db/connection"
import { Segment, SegmentDataType, SegmentOperator } from "../models/Segment"
import { SegmentationService } from "../services/SegmentationService"

describe("SegmentationService", () => {
  let segmentationService: SegmentationService
  let testSegmentId: string
  let testUserId: string
  const TEST_PREFIX = "TestService"

  beforeEach(async () => {
    segmentationService = new SegmentationService()
    testUserId = "123e4567-e89b-12d3-a456-426614174000" // Valid UUID

    // Clean up any existing test data
    await query(
      `DELETE FROM customer_segment_memberships WHERE segment_id IN (SELECT id FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%')`,
    )
    await query(`DELETE FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%'`)
  })

  afterEach(async () => {
    // Clean up test data
    if (testSegmentId) {
      await query("DELETE FROM customer_segment_memberships WHERE segment_id = $1", [testSegmentId])
      await query("DELETE FROM customer_segments WHERE id = $1", [testSegmentId])
    }
    await query(
      `DELETE FROM customer_segment_memberships WHERE segment_id IN (SELECT id FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%')`,
    )
    await query(`DELETE FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%'`)
  })

  afterAll(async () => {
    // Final cleanup and close database connection
    await query(
      `DELETE FROM customer_segment_memberships WHERE segment_id IN (SELECT id FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%')`,
    )
    await query(`DELETE FROM customer_segments WHERE name LIKE '${TEST_PREFIX}%'`)
    await closePool()
  })

  describe("createSegment", () => {
    it("should create a new segment successfully", async () => {
      const segmentData = {
        name: "TestServiceHigh Value Customers",
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
        name: "TestServiceDuplicate Segment",
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
        'Segment with name "TestServiceDuplicate Segment" already exists',
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
        name: "TestServiceSegment By ID",
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
        name: "TestServiceSegment By Name",
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
      const segmentNames = ["TestService Segment 1", "TestService Segment 2", "TestService Segment 3"]
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
          name: "TestServiceActive Segment",
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
          name: "TestServiceInactive Segment",
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
          name: "TestServiceSearchable Segment",
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
          name: "TestServiceUpdate Segment",
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
          name: "TestServiceDelete Segment",
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
        name: "TestServiceSegment",
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

    it("should handle NOT_CONTAINS operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceNOT_CONTAINS",
        criteria: [
          {
            field: "email",
            operator: SegmentOperator.NOT_CONTAINS,
            value: "test",
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle STARTS_WITH operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceSTARTS_WITH",
        criteria: [
          {
            field: "email",
            operator: SegmentOperator.STARTS_WITH,
            value: "admin",
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle ENDS_WITH operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceENDS_WITH",
        criteria: [
          {
            field: "email",
            operator: SegmentOperator.ENDS_WITH,
            value: ".com",
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle GREATER_THAN_OR_EQUAL operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceGREATER_THAN_OR_EQUAL",
        criteria: [
          {
            field: "lifetimeValue",
            operator: SegmentOperator.GREATER_THAN_OR_EQUAL,
            value: 100,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle LESS_THAN_OR_EQUAL operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceLESS_THAN_OR_EQUAL",
        criteria: [
          {
            field: "lifetimeValue",
            operator: SegmentOperator.LESS_THAN_OR_EQUAL,
            value: 1000,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle IN operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceIN",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.IN,
            value: ["lead", "customer", "partner"],
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle NOT_IN operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceNOT_IN",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.NOT_IN,
            value: ["archived", "deleted"],
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle IS_NULL operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceIS_NULL",
        criteria: [
          {
            field: "company",
            operator: SegmentOperator.IS_NULL,
            value: null,
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle IS_NOT_NULL operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceIS_NOT_NULL",
        criteria: [
          {
            field: "company",
            operator: SegmentOperator.IS_NOT_NULL,
            value: null,
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle BETWEEN operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceBETWEEN",
        criteria: [
          {
            field: "lifetimeValue",
            operator: SegmentOperator.BETWEEN,
            value: [100, 1000],
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle DATE_BEFORE operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceDATE_BEFORE",
        criteria: [
          {
            field: "createdAt",
            operator: SegmentOperator.DATE_BEFORE,
            value: "2024-01-01",
            dataType: SegmentDataType.DATE,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle DATE_AFTER operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceDATE_AFTER",
        criteria: [
          {
            field: "createdAt",
            operator: SegmentOperator.DATE_AFTER,
            value: "2023-01-01",
            dataType: SegmentDataType.DATE,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle DATE_BETWEEN operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceDATE_BETWEEN",
        criteria: [
          {
            field: "createdAt",
            operator: SegmentOperator.DATE_BETWEEN,
            value: ["2023-01-01", "2024-12-31"],
            dataType: SegmentDataType.DATE,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle DAYS_AGO operator", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceDAYS_AGO",
        criteria: [
          {
            field: "createdAt",
            operator: SegmentOperator.DAYS_AGO,
            value: 30,
            dataType: SegmentDataType.NUMBER,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })

    it("should handle OR operator for multiple criteria", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceOR",
        criteria: [
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "lead",
            dataType: SegmentDataType.ENUM,
          },
          {
            field: "status",
            operator: SegmentOperator.EQUALS,
            value: "customer",
            dataType: SegmentDataType.ENUM,
          },
        ],
        operator: "OR",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const customerIds = await segmentationService.getCustomersMatchingSegment(segment)
      expect(Array.isArray(customerIds)).toBe(true)
    })
  })

  describe("recalculateSegmentMembership", () => {
    it("should recalculate membership for existing segment", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "TestServiceRecalculate Membership",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )
      testSegmentId = segment.id

      const customerCount = await segmentationService.recalculateSegmentMembership(segment.id)
      expect(typeof customerCount).toBe("number")
      expect(customerCount).toBeGreaterThanOrEqual(0)
    })

    it("should throw error for non-existent segment", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      await expect(segmentationService.recalculateSegmentMembership(nonExistentId)).rejects.toThrow("Segment not found")
    })
  })

  describe("recalculateAllSegmentMemberships", () => {
    it("should recalculate all active segments", async () => {
      // Create a few test segments
      const segment1 = await segmentationService.createSegment(
        {
          name: "TestServiceRecalcAll 1",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
          isActive: true,
        },
        testUserId,
      )

      const segment2 = await segmentationService.createSegment(
        {
          name: "TestServiceRecalcAll 2",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
          isActive: true,
        },
        testUserId,
      )

      await expect(segmentationService.recalculateAllSegmentMemberships()).resolves.toBeUndefined()

      // Clean up
      await query("DELETE FROM customer_segments WHERE id IN ($1, $2)", [segment1.id, segment2.id])
    })
  })

  describe("getCustomersInSegment", () => {
    it("should get customers in segment with pagination", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "TestServiceGet Customers",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )
      testSegmentId = segment.id

      const result = await segmentationService.getCustomersInSegment(segment.id, {
        limit: 10,
        offset: 0,
      })

      expect(result).toHaveProperty("customers")
      expect(result).toHaveProperty("total")
      expect(Array.isArray(result.customers)).toBe(true)
      expect(typeof result.total).toBe("number")
    })

    it("should support custom pagination", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "TestServicePagination Customers",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )
      testSegmentId = segment.id

      const result = await segmentationService.getCustomersInSegment(segment.id, {
        limit: 5,
        offset: 10,
      })

      expect(result.customers.length).toBeLessThanOrEqual(5)
    })
  })

  describe("edge cases", () => {
    it("should handle update with no changes", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "TestServiceNo Changes",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )
      testSegmentId = segment.id

      // Update with empty data
      const result = await segmentationService.updateSegment(segment.id, {})
      expect(result).toBeInstanceOf(Segment)
      expect(result?.id).toBe(segment.id)
    })

    it("should handle update with criteria changes", async () => {
      const segment = await segmentationService.createSegment(
        {
          name: "TestServiceCriteria Change",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )
      testSegmentId = segment.id

      const newCriteria = [
        {
          field: "status",
          operator: SegmentOperator.EQUALS,
          value: "customer",
          dataType: SegmentDataType.ENUM,
        },
      ]

      const result = await segmentationService.updateSegment(segment.id, {
        criteria: newCriteria,
      })

      expect(result?.criteria).toEqual(newCriteria)
    })

    it("should reject update with conflicting name", async () => {
      const segment1 = await segmentationService.createSegment(
        {
          name: "TestServiceConflict 1",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "customer",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )

      const segment2 = await segmentationService.createSegment(
        {
          name: "TestServiceConflict 2",
          criteria: [
            {
              field: "status",
              operator: SegmentOperator.EQUALS,
              value: "lead",
              dataType: SegmentDataType.ENUM,
            },
          ],
          operator: "AND",
        },
        testUserId,
      )

      // Try to update segment2 with segment1's name
      await expect(segmentationService.updateSegment(segment2.id, { name: segment1.name })).rejects.toThrow(
        "already exists",
      )

      // Clean up
      await query("DELETE FROM customer_segments WHERE id IN ($1, $2)", [segment1.id, segment2.id])
    })

    it("should handle query errors gracefully", async () => {
      const segment = new Segment({
        id: "test-id",
        name: "TestServiceInvalid Field",
        criteria: [
          {
            field: "invalid_field_that_does_not_exist",
            operator: SegmentOperator.EQUALS,
            value: "test",
            dataType: SegmentDataType.STRING,
          },
        ],
        operator: "AND",
        is_active: true,
        created_by: "test-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Should handle invalid field gracefully
      await expect(segmentationService.getCustomersMatchingSegment(segment)).rejects.toThrow()
    })
  })
})
