import {
  agencyServices,
  and,
  asc,
  createDatabaseConnection,
  desc,
  eq,
  gte,
  type InferSelectModel,
  serviceAssignmentStatusEnum,
  serviceAssignments,
  sql,
} from "@marketplace/database-schema"
import logger from "@marketplace/logger"

const db = createDatabaseConnection(process.env.DATABASE_URL!)

// Type definitions
type ServiceAssignment = InferSelectModel<typeof serviceAssignments>
type ServiceAssignmentStatusType = (typeof serviceAssignmentStatusEnum.enumValues)[number]

export interface AssignmentFilters {
  agencyServiceId?: string
  listingId?: string
  status?: ServiceAssignmentStatusType
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface AssignmentSearchOptions {
  page?: number
  limit?: number
  sortBy?: "assignedAt" | "completedAt"
  sortOrder?: "asc" | "desc"
}

export interface CreateAssignmentRequest {
  agencyServiceId: string
  listingId: string
  notes?: string
}

export class ServiceAssignmentService {
  /**
   * Create a new service assignment
   */
  async createAssignment(assignmentData: CreateAssignmentRequest): Promise<ServiceAssignment> {
    try {
      // Verify service exists
      const [service] = await db
        .select()
        .from(agencyServices)
        .where(eq(agencyServices.id, assignmentData.agencyServiceId))

      if (!service) {
        throw new Error("Agency service not found")
      }

      const [assignment] = await db
        .insert(serviceAssignments)
        .values({
          agencyServiceId: assignmentData.agencyServiceId,
          listingId: assignmentData.listingId,
          notes: assignmentData.notes,
          status: "active",
        })
        .returning()

      if (!assignment) {
        throw new Error("Failed to create assignment")
      }

      return assignment
    } catch (error) {
      logger.error("Error creating assignment:", error)
      throw new Error("Failed to create assignment")
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id: string): Promise<ServiceAssignment | null> {
    try {
      const [assignment] = await db.select().from(serviceAssignments).where(eq(serviceAssignments.id, id))

      return assignment || null
    } catch (error) {
      logger.error("Error getting assignment by ID:", error)
      throw new Error("Failed to get assignment")
    }
  }

  /**
   * Get assignments by agency service ID
   */
  async getAssignmentsByAgencyServiceId(agencyServiceId: string): Promise<ServiceAssignment[]> {
    try {
      const assignments = await db
        .select()
        .from(serviceAssignments)
        .where(eq(serviceAssignments.agencyServiceId, agencyServiceId))
        .orderBy(desc(serviceAssignments.assignedAt))

      return assignments
    } catch (error) {
      logger.error("Error getting assignments by agency service ID:", error)
      throw new Error("Failed to get assignments")
    }
  }

  /**
   * Get assignments by listing ID
   */
  async getAssignmentsByListingId(listingId: string): Promise<ServiceAssignment[]> {
    try {
      const assignments = await db
        .select()
        .from(serviceAssignments)
        .where(eq(serviceAssignments.listingId, listingId))
        .orderBy(desc(serviceAssignments.assignedAt))

      return assignments
    } catch (error) {
      logger.error("Error getting assignments by listing ID:", error)
      throw new Error("Failed to get assignments")
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(
    id: string,
    status: ServiceAssignmentStatusType,
    notes?: string,
  ): Promise<ServiceAssignment | null> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      if (notes) {
        updateData.agencyNotes = notes
      }

      if (status === "completed") {
        updateData.completedAt = new Date()
      }

      const [assignment] = await db
        .update(serviceAssignments)
        .set(updateData)
        .where(eq(serviceAssignments.id, id))
        .returning()

      return assignment || null
    } catch (error) {
      logger.error("Error updating assignment status:", error)
      throw new Error("Failed to update assignment status")
    }
  }

  /**
   * Add notes to assignment
   */
  async addNotes(id: string, notes: string): Promise<ServiceAssignment | null> {
    try {
      const [assignment] = await db
        .update(serviceAssignments)
        .set({
          notes,
        })
        .where(eq(serviceAssignments.id, id))
        .returning()

      return assignment || null
    } catch (error) {
      logger.error("Error adding notes:", error)
      throw new Error("Failed to add notes")
    }
  }

  /**
   * Search assignments with filters
   */
  async searchAssignments(
    filters: AssignmentFilters = {},
    options: AssignmentSearchOptions = {},
  ): Promise<{
    assignments: (ServiceAssignment & {
      agencyName: string | null
      serviceName: string | null
    })[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    try {
      const { page = 1, limit = 20, sortBy = "assignedAt", sortOrder = "desc" } = options

      const offset = (page - 1) * limit

      // Build where conditions
      const conditions = []

      if (filters.agencyServiceId) {
        conditions.push(eq(serviceAssignments.agencyServiceId, filters.agencyServiceId))
      }

      if (filters.listingId) {
        conditions.push(eq(serviceAssignments.listingId, filters.listingId))
      }

      if (filters.status) {
        conditions.push(eq(serviceAssignments.status, filters.status))
      }

      if (filters.dateRange) {
        conditions.push(gte(serviceAssignments.assignedAt, filters.dateRange.start))
        // End date filtering removed due to type compatibility
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Build sort clause
      let orderClause: any | null = null
      switch (sortBy) {
        case "assignedAt":
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.assignedAt) : desc(serviceAssignments.assignedAt)
          break
        case "completedAt":
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.completedAt) : desc(serviceAssignments.completedAt)
          break

        default:
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.assignedAt) : desc(serviceAssignments.assignedAt)
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceAssignments)
        .leftJoin(agencyServices, eq(serviceAssignments.agencyServiceId, agencyServices.id))
        .where(whereClause)

      // Get assignments with related data
      const assignmentList = await db
        .select({
          id: serviceAssignments.id,
          agencyServiceId: serviceAssignments.agencyServiceId,
          listingId: serviceAssignments.listingId,
          status: serviceAssignments.status,
          assignedAt: serviceAssignments.assignedAt,
          completedAt: serviceAssignments.completedAt,
          notes: serviceAssignments.notes,
          createdAt: serviceAssignments.createdAt,
          updatedAt: serviceAssignments.updatedAt,
          agencyName: sql<string | null>`null`,
          serviceName: agencyServices.name,
        })
        .from(serviceAssignments)
        .leftJoin(agencyServices, eq(serviceAssignments.agencyServiceId, agencyServices.id))
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset)

      const total = Number(countResult[0]?.count || 0)
      const hasMore = offset + assignmentList.length < total

      return {
        assignments: assignmentList,
        total,
        page,
        limit,
        hasMore,
      }
    } catch (error) {
      logger.error("Error searching assignments:", error)
      throw new Error("Failed to search assignments")
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(): Promise<{
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
  }> {
    try {
      const [stats] = await db
        .select({
          totalAssignments: sql<number>`count(*)`,
          activeAssignments: sql<number>`count(*) filter (where status = 'active')`,
          completedAssignments: sql<number>`count(*) filter (where status = 'completed')`,
        })
        .from(serviceAssignments)

      return {
        totalAssignments: Number(stats?.totalAssignments || 0),
        activeAssignments: Number(stats?.activeAssignments || 0),
        completedAssignments: Number(stats?.completedAssignments || 0),
      }
    } catch (error) {
      logger.error("Error getting assignment stats:", error)
      throw new Error("Failed to get assignment statistics")
    }
  }
}
