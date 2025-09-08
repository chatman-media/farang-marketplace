import { query } from "../db/connection"
import {
  Segment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  SegmentCriteria,
  SegmentOperator,
} from "../models/Segment"
import { Customer } from "../models/Customer"

export class SegmentationService {
  // CRUD operations for segments
  async createSegment(data: CreateSegmentRequest, createdBy: string): Promise<Segment> {
    const errors = Segment.validateCreateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    // Check if segment name already exists
    const existingSegment = await this.getSegmentByName(data.name)
    if (existingSegment) {
      throw new Error(`Segment with name "${data.name}" already exists`)
    }

    const result = await query(
      `INSERT INTO customer_segments (name, description, criteria, operator, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.name,
        data.description || null,
        JSON.stringify(data.criteria),
        data.operator || "AND",
        data.isActive !== false,
        createdBy,
      ],
    )

    const segment = new Segment(result.rows[0])

    // Calculate initial customer count
    await this.recalculateSegmentMembership(segment.id)

    return segment
  }

  async getSegmentById(id: string): Promise<Segment | null> {
    const result = await query("SELECT * FROM customer_segments WHERE id = $1", [id])
    return result.rows.length > 0 ? new Segment(result.rows[0]) : null
  }

  async getSegmentByName(name: string): Promise<Segment | null> {
    const result = await query("SELECT * FROM customer_segments WHERE name = $1", [name])
    return result.rows.length > 0 ? new Segment(result.rows[0]) : null
  }

  async getSegments(
    filters: { isActive?: boolean; createdBy?: string; search?: string; limit?: number; offset?: number } = {},
  ): Promise<{ segments: Segment[]; total: number }> {
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (filters.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`)
      queryParams.push(filters.isActive)
      paramIndex++
    }

    if (filters.createdBy) {
      whereConditions.push(`created_by = $${paramIndex}`)
      queryParams.push(filters.createdBy)
      paramIndex++
    }

    if (filters.search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM customer_segments ${whereClause}`, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Get segments with pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await query(
      `SELECT * FROM customer_segments ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset],
    )

    const segments = result.rows.map((row: any) => new Segment(row))
    return { segments, total }
  }

  async updateSegment(id: string, data: UpdateSegmentRequest): Promise<Segment | null> {
    const errors = Segment.validateUpdateRequest(data)
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`)
    }

    // Check if new name conflicts with existing segment
    if (data.name) {
      const existingSegment = await this.getSegmentByName(data.name)
      if (existingSegment && existingSegment.id !== id) {
        throw new Error(`Segment with name "${data.name}" already exists`)
      }
    }

    const updates: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      queryParams.push(data.name)
      paramIndex++
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      queryParams.push(data.description)
      paramIndex++
    }

    if (data.criteria !== undefined) {
      updates.push(`criteria = $${paramIndex}`)
      queryParams.push(JSON.stringify(data.criteria))
      paramIndex++
    }

    if (data.operator !== undefined) {
      updates.push(`operator = $${paramIndex}`)
      queryParams.push(data.operator)
      paramIndex++
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      queryParams.push(data.isActive)
      paramIndex++
    }

    if (updates.length === 0) {
      const segment = await this.getSegmentById(id)
      return segment
    }

    updates.push(`updated_at = NOW()`)
    queryParams.push(id)

    const result = await query(
      `UPDATE customer_segments SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      queryParams,
    )

    if (result.rows.length === 0) {
      return null
    }

    const segment = new Segment(result.rows[0])

    // Recalculate membership if criteria changed
    if (data.criteria !== undefined || data.operator !== undefined) {
      await this.recalculateSegmentMembership(segment.id)
    }

    return segment
  }

  async deleteSegment(id: string): Promise<boolean> {
    const result = await query("DELETE FROM customer_segments WHERE id = $1", [id])
    return result.rowCount > 0
  }

  // Segment membership calculation
  async recalculateSegmentMembership(segmentId: string): Promise<number> {
    const segment = await this.getSegmentById(segmentId)
    if (!segment) {
      throw new Error("Segment not found")
    }

    // Clear existing memberships
    await query("DELETE FROM customer_segment_memberships WHERE segment_id = $1", [segmentId])

    // Get customers that match the segment criteria
    const matchingCustomerIds = await this.getCustomersMatchingSegment(segment)

    // Insert new memberships
    if (matchingCustomerIds.length > 0) {
      const values = matchingCustomerIds
        .map((customerId, index) => {
          const baseIndex = index * 2
          return `($${baseIndex + 1}, $${baseIndex + 2})`
        })
        .join(", ")

      const params = matchingCustomerIds.flatMap((customerId) => [customerId, segmentId])

      await query(`INSERT INTO customer_segment_memberships (customer_id, segment_id) VALUES ${values}`, params)
    }

    // Update segment customer count and last calculated time
    await query(
      `UPDATE customer_segments 
       SET customer_count = $1, last_calculated_at = NOW() 
       WHERE id = $2`,
      [matchingCustomerIds.length, segmentId],
    )

    return matchingCustomerIds.length
  }

  async recalculateAllSegmentMemberships(): Promise<void> {
    const { segments } = await this.getSegments({ isActive: true })

    for (const segment of segments) {
      try {
        await this.recalculateSegmentMembership(segment.id)
      } catch (error) {
        console.error(`Failed to recalculate segment ${segment.name}:`, error)
      }
    }
  }

  // Get customers matching a segment
  async getCustomersMatchingSegment(segment: Segment): Promise<string[]> {
    const sqlQuery = this.buildSegmentQuery(segment.criteria, segment.operator)

    try {
      const result = await query(sqlQuery.sql, sqlQuery.params)
      return result.rows.map((row: any) => row.id)
    } catch (error) {
      console.error("Error executing segment query:", error)
      throw new Error(`Failed to execute segment query: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getCustomersInSegment(
    segmentId: string,
    pagination: { limit?: number; offset?: number } = {},
  ): Promise<{ customers: Customer[]; total: number }> {
    const limit = pagination.limit || 50
    const offset = pagination.offset || 0

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM customer_segment_memberships csm 
       WHERE csm.segment_id = $1`,
      [segmentId],
    )
    const total = parseInt(countResult.rows[0].total)

    // Get customers
    const result = await query(
      `SELECT c.* 
       FROM customers c
       INNER JOIN customer_segment_memberships csm ON c.id = csm.customer_id
       WHERE csm.segment_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [segmentId, limit, offset],
    )

    const customers = result.rows.map((row: any) => new Customer(row))
    return { customers, total }
  }

  // Build SQL query for segment criteria
  private buildSegmentQuery(criteria: SegmentCriteria[], operator: "AND" | "OR"): { sql: string; params: any[] } {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    for (const criterion of criteria) {
      const condition = this.buildCriterionCondition(criterion, paramIndex)
      conditions.push(condition.sql)
      params.push(...condition.params)
      paramIndex += condition.params.length
    }

    const whereClause = conditions.length > 0 ? conditions.join(` ${operator} `) : "1=1"

    return {
      sql: `SELECT id FROM customers WHERE ${whereClause}`,
      params,
    }
  }

  private buildCriterionCondition(criterion: SegmentCriteria, startParamIndex: number): { sql: string; params: any[] } {
    const { field, operator, value, dataType } = criterion
    const params: any[] = []
    let paramIndex = startParamIndex

    // Map field names to database column names
    const fieldMap: Record<string, string> = {
      firstName: "first_name",
      lastName: "last_name",
      jobTitle: "job_title",
      preferredChannel: "preferred_channel",
      preferredLanguage: "preferred_language",
      leadScore: "lead_score",
      totalInteractions: "total_interactions",
      lastInteractionAt: "last_interaction_at",
      lifetimeValue: "lifetime_value",
      createdAt: "created_at",
      updatedAt: "updated_at",
      socialContacts: "social_profiles",
      customFields: "custom_fields",
      communicationPreferences: "communication_preferences",
    }

    const dbField = fieldMap[field] || field

    switch (operator) {
      case SegmentOperator.EQUALS:
        params.push(value)
        return { sql: `${dbField} = $${paramIndex}`, params }

      case SegmentOperator.NOT_EQUALS:
        params.push(value)
        return { sql: `${dbField} != $${paramIndex}`, params }

      case SegmentOperator.CONTAINS:
        params.push(`%${value}%`)
        return { sql: `${dbField} ILIKE $${paramIndex}`, params }

      case SegmentOperator.NOT_CONTAINS:
        params.push(`%${value}%`)
        return { sql: `${dbField} NOT ILIKE $${paramIndex}`, params }

      case SegmentOperator.STARTS_WITH:
        params.push(`${value}%`)
        return { sql: `${dbField} ILIKE $${paramIndex}`, params }

      case SegmentOperator.ENDS_WITH:
        params.push(`%${value}`)
        return { sql: `${dbField} ILIKE $${paramIndex}`, params }

      case SegmentOperator.GREATER_THAN:
        params.push(value)
        return { sql: `${dbField} > $${paramIndex}`, params }

      case SegmentOperator.GREATER_THAN_OR_EQUAL:
        params.push(value)
        return { sql: `${dbField} >= $${paramIndex}`, params }

      case SegmentOperator.LESS_THAN:
        params.push(value)
        return { sql: `${dbField} < $${paramIndex}`, params }

      case SegmentOperator.LESS_THAN_OR_EQUAL:
        params.push(value)
        return { sql: `${dbField} <= $${paramIndex}`, params }

      case SegmentOperator.IN:
        params.push(value)
        return { sql: `${dbField} = ANY($${paramIndex})`, params }

      case SegmentOperator.NOT_IN:
        params.push(value)
        return { sql: `${dbField} != ALL($${paramIndex})`, params }

      case SegmentOperator.IS_NULL:
        return { sql: `${dbField} IS NULL`, params }

      case SegmentOperator.IS_NOT_NULL:
        return { sql: `${dbField} IS NOT NULL`, params }

      case SegmentOperator.BETWEEN:
        params.push(value[0], value[1])
        return { sql: `${dbField} BETWEEN $${paramIndex} AND $${paramIndex + 1}`, params }

      case SegmentOperator.REGEX:
        params.push(value)
        return { sql: `${dbField} ~ $${paramIndex}`, params }

      case SegmentOperator.DATE_BEFORE:
        params.push(value)
        return { sql: `${dbField} < $${paramIndex}::timestamp`, params }

      case SegmentOperator.DATE_AFTER:
        params.push(value)
        return { sql: `${dbField} > $${paramIndex}::timestamp`, params }

      case SegmentOperator.DATE_BETWEEN:
        params.push(value[0], value[1])
        return { sql: `${dbField} BETWEEN $${paramIndex}::timestamp AND $${paramIndex + 1}::timestamp`, params }

      case SegmentOperator.DAYS_AGO:
        return { sql: `${dbField} >= NOW() - INTERVAL '${value} days'`, params }

      case SegmentOperator.HAS_TAG:
        params.push(value)
        return { sql: `tags @> ARRAY[$${paramIndex}]`, params }

      case SegmentOperator.NOT_HAS_TAG:
        params.push(value)
        return { sql: `NOT (tags @> ARRAY[$${paramIndex}])`, params }

      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
  }

  // Get segment statistics
  async getSegmentStats(): Promise<{
    totalSegments: number
    activeSegments: number
    totalMemberships: number
    averageSegmentSize: number
    largestSegment: { name: string; customerCount: number } | null
  }> {
    const totalResult = await query("SELECT COUNT(*) as total FROM customer_segments")
    const activeResult = await query("SELECT COUNT(*) as total FROM customer_segments WHERE is_active = true")
    const membershipsResult = await query("SELECT COUNT(*) as total FROM customer_segment_memberships")
    const avgSizeResult = await query(
      "SELECT AVG(customer_count) as avg_size FROM customer_segments WHERE is_active = true",
    )
    const largestResult = await query(
      "SELECT name, customer_count FROM customer_segments WHERE is_active = true ORDER BY customer_count DESC LIMIT 1",
    )

    return {
      totalSegments: parseInt(totalResult.rows[0].total),
      activeSegments: parseInt(activeResult.rows[0].total),
      totalMemberships: parseInt(membershipsResult.rows[0].total),
      averageSegmentSize: Math.round(parseFloat(avgSizeResult.rows[0].avg_size) || 0),
      largestSegment:
        largestResult.rows.length > 0
          ? { name: largestResult.rows[0].name, customerCount: largestResult.rows[0].customer_count }
          : null,
    }
  }
}
