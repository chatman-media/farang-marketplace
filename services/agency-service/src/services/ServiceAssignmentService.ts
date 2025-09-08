import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm"
import { db } from "../db/connection"
import {
  serviceAssignments,
  agencyServices,
  agencies,
  type ServiceAssignment,
  type ServiceAssignmentStatusType,
} from "../db/schema"

export interface AssignmentFilters {
  agencyId?: string
  listingId?: string
  bookingId?: string
  status?: ServiceAssignmentStatusType
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface AssignmentSearchOptions {
  page?: number
  limit?: number
  sortBy?: "assignedAt" | "completedAt" | "servicePrice" | "customerRating"
  sortOrder?: "asc" | "desc"
}

export interface CreateAssignmentRequest {
  agencyId: string
  agencyServiceId: string
  listingId: string
  bookingId?: string
  servicePrice: number
  commissionRate: number
  currency?: string
}

export class ServiceAssignmentService {
  /**
   * Create a new service assignment
   */
  async createAssignment(assignmentData: CreateAssignmentRequest): Promise<ServiceAssignment> {
    try {
      // Verify agency and service exist
      const [agency] = await db.select().from(agencies).where(eq(agencies.id, assignmentData.agencyId))

      if (!agency) {
        throw new Error("Agency not found")
      }

      const [service] = await db
        .select()
        .from(agencyServices)
        .where(eq(agencyServices.id, assignmentData.agencyServiceId))

      if (!service) {
        throw new Error("Agency service not found")
      }

      // Calculate commission amount
      const commissionAmount = assignmentData.servicePrice * assignmentData.commissionRate

      const [assignment] = await db
        .insert(serviceAssignments)
        .values({
          agencyId: assignmentData.agencyId,
          agencyServiceId: assignmentData.agencyServiceId,
          listingId: assignmentData.listingId,
          bookingId: assignmentData.bookingId,
          servicePrice: assignmentData.servicePrice.toString(),
          commissionAmount: commissionAmount.toString(),
          commissionRate: assignmentData.commissionRate.toString(),
          currency: assignmentData.currency || "THB",
          status: "active",
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      if (!assignment) {
        throw new Error("Failed to create assignment")
      }

      return assignment
    } catch (error) {
      console.error("Error creating assignment:", error)
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
      console.error("Error getting assignment by ID:", error)
      throw new Error("Failed to get assignment")
    }
  }

  /**
   * Get assignments by agency ID
   */
  async getAssignmentsByAgencyId(agencyId: string): Promise<ServiceAssignment[]> {
    try {
      const assignments = await db
        .select()
        .from(serviceAssignments)
        .where(eq(serviceAssignments.agencyId, agencyId))
        .orderBy(desc(serviceAssignments.assignedAt))

      return assignments
    } catch (error) {
      console.error("Error getting assignments by agency ID:", error)
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
      console.error("Error getting assignments by listing ID:", error)
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
      console.error("Error updating assignment status:", error)
      throw new Error("Failed to update assignment status")
    }
  }

  /**
   * Add customer feedback
   */
  async addCustomerFeedback(id: string, rating: number, feedback?: string): Promise<ServiceAssignment | null> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5")
      }

      const [assignment] = await db
        .update(serviceAssignments)
        .set({
          customerRating: rating.toString(),
          customerFeedback: feedback,
          updatedAt: new Date(),
        })
        .where(eq(serviceAssignments.id, id))
        .returning()

      return assignment || null
    } catch (error) {
      console.error("Error adding customer feedback:", error)
      throw new Error("Failed to add customer feedback")
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

      if (filters.agencyId) {
        conditions.push(eq(serviceAssignments.agencyId, filters.agencyId))
      }

      if (filters.listingId) {
        conditions.push(eq(serviceAssignments.listingId, filters.listingId))
      }

      if (filters.bookingId) {
        conditions.push(eq(serviceAssignments.bookingId, filters.bookingId))
      }

      if (filters.status) {
        conditions.push(eq(serviceAssignments.status, filters.status))
      }

      if (filters.dateRange) {
        conditions.push(gte(serviceAssignments.assignedAt, filters.dateRange.start))
        conditions.push(lte(serviceAssignments.assignedAt, filters.dateRange.end))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Build sort clause
      let orderClause
      switch (sortBy) {
        case "assignedAt":
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.assignedAt) : desc(serviceAssignments.assignedAt)
          break
        case "completedAt":
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.completedAt) : desc(serviceAssignments.completedAt)
          break
        case "servicePrice":
          orderClause =
            sortOrder === "asc" ? asc(serviceAssignments.servicePrice) : desc(serviceAssignments.servicePrice)
          break
        case "customerRating":
          orderClause =
            sortOrder === "asc" ? asc(serviceAssignments.customerRating) : desc(serviceAssignments.customerRating)
          break
        default:
          orderClause = sortOrder === "asc" ? asc(serviceAssignments.assignedAt) : desc(serviceAssignments.assignedAt)
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceAssignments)
        .leftJoin(agencies, eq(serviceAssignments.agencyId, agencies.id))
        .leftJoin(agencyServices, eq(serviceAssignments.agencyServiceId, agencyServices.id))
        .where(whereClause)

      // Get assignments with related data
      const assignmentList = await db
        .select({
          id: serviceAssignments.id,
          agencyId: serviceAssignments.agencyId,
          agencyServiceId: serviceAssignments.agencyServiceId,
          listingId: serviceAssignments.listingId,
          bookingId: serviceAssignments.bookingId,
          servicePrice: serviceAssignments.servicePrice,
          commissionAmount: serviceAssignments.commissionAmount,
          commissionRate: serviceAssignments.commissionRate,
          currency: serviceAssignments.currency,
          status: serviceAssignments.status,
          assignedAt: serviceAssignments.assignedAt,
          startedAt: serviceAssignments.startedAt,
          completedAt: serviceAssignments.completedAt,
          customerRating: serviceAssignments.customerRating,
          customerFeedback: serviceAssignments.customerFeedback,
          agencyNotes: serviceAssignments.agencyNotes,
          metadata: serviceAssignments.metadata,
          createdAt: serviceAssignments.createdAt,
          updatedAt: serviceAssignments.updatedAt,
          agencyName: agencies.name,
          serviceName: agencyServices.name,
        })
        .from(serviceAssignments)
        .leftJoin(agencies, eq(serviceAssignments.agencyId, agencies.id))
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
      console.error("Error searching assignments:", error)
      throw new Error("Failed to search assignments")
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(agencyId?: string): Promise<{
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
    cancelledAssignments: number
    totalRevenue: number
    totalCommission: number
    averageRating: number
  }> {
    try {
      const conditions = agencyId ? [eq(serviceAssignments.agencyId, agencyId)] : []
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [stats] = await db
        .select({
          totalAssignments: sql<number>`count(*)`,
          activeAssignments: sql<number>`count(*) filter (where status = 'active')`,
          completedAssignments: sql<number>`count(*) filter (where status = 'completed')`,
          cancelledAssignments: sql<number>`count(*) filter (where status = 'cancelled')`,
          totalRevenue: sql<number>`coalesce(sum(cast(service_price as decimal)), 0)`,
          totalCommission: sql<number>`coalesce(sum(cast(commission_amount as decimal)), 0)`,
          averageRating: sql<number>`coalesce(avg(cast(customer_rating as decimal)), 0)`,
        })
        .from(serviceAssignments)
        .where(whereClause)

      return {
        totalAssignments: Number(stats?.totalAssignments || 0),
        activeAssignments: Number(stats?.activeAssignments || 0),
        completedAssignments: Number(stats?.completedAssignments || 0),
        cancelledAssignments: Number(stats?.cancelledAssignments || 0),
        totalRevenue: Number(stats?.totalRevenue || 0),
        totalCommission: Number(stats?.totalCommission || 0),
        averageRating: Number(stats?.averageRating || 0),
      }
    } catch (error) {
      console.error("Error getting assignment stats:", error)
      throw new Error("Failed to get assignment statistics")
    }
  }
}
