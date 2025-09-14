import {
  agencies,
  agencyServices,
  agencyStatusEnum,
  and,
  asc,
  commissionPayments,
  createDatabaseConnection,
  desc,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  ilike,
  productTypeEnum,
  serviceAssignments,
  sql,
} from "@marketplace/database-schema"
import logger from "@marketplace/logger"

const db = createDatabaseConnection(process.env.DATABASE_URL!)

// Type definitions
type Agency = InferSelectModel<typeof agencies>
type NewAgency = InferInsertModel<typeof agencies>
type AgencyStatusType = (typeof agencyStatusEnum.enumValues)[number]
type ServiceCategoryType = (typeof productTypeEnum.enumValues)[number]

export interface AgencyFilters {
  status?: AgencyStatusType
  commissionRate?: {
    min: number
    max: number
  }
  search?: string
}

export interface AgencySearchOptions {
  page?: number
  limit?: number
  sortBy?: "name" | "rating" | "createdAt" | "commissionRate"
  sortOrder?: "asc" | "desc"
}

export class AgencyService {
  /**
   * Create a new agency
   */
  async createAgency(agencyData: Omit<NewAgency, "id" | "createdAt" | "updatedAt">): Promise<Agency> {
    try {
      const [agency] = await db
        .insert(agencies)
        .values({
          ...agencyData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      if (!agency) {
        throw new Error("Failed to create agency")
      }

      return agency
    } catch (error) {
      logger.error("Error creating agency:", error)
      throw new Error("Failed to create agency")
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(id: string): Promise<Agency | null> {
    try {
      const [agency] = await db.select().from(agencies).where(eq(agencies.id, id))

      return agency || null
    } catch (error) {
      logger.error("Error getting agency by ID:", error)
      throw new Error("Failed to get agency")
    }
  }

  /**
   * Get agency by user ID
   */
  async getAgencyByUserId(userId: string): Promise<Agency | null> {
    try {
      const [agency] = await db.select().from(agencies).where(eq(agencies.ownerId, userId))

      return agency || null
    } catch (error) {
      logger.error("Error getting agency by user ID:", error)
      throw new Error("Failed to get agency")
    }
  }

  /**
   * Update agency
   */
  async updateAgency(id: string, updates: Partial<Omit<Agency, "id" | "createdAt">>): Promise<Agency | null> {
    try {
      const [agency] = await db
        .update(agencies)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, id))
        .returning()

      return agency || null
    } catch (error) {
      logger.error("Error updating agency:", error)
      throw new Error("Failed to update agency")
    }
  }

  /**
   * Delete agency
   */
  async deleteAgency(id: string): Promise<boolean> {
    try {
      const result = await db.delete(agencies).where(eq(agencies.id, id))

      return result.length > 0
    } catch (error) {
      logger.error("Error deleting agency:", error)
      throw new Error("Failed to delete agency")
    }
  }

  /**
   * Search agencies with filters
   */
  async searchAgencies(
    filters: AgencyFilters = {},
    options: AgencySearchOptions = {},
  ): Promise<{
    agencies: Agency[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    try {
      const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options

      const offset = (page - 1) * limit

      // Build where conditions
      const conditions = []

      if (filters.status) {
        conditions.push(eq(agencies.status, filters.status))
      }

      if (filters.search) {
        conditions.push(
          sql`(${ilike(agencies.name, `%${filters.search}%`)} OR ${ilike(agencies.description, `%${filters.search}%`)})`,
        )
      }

      if (filters.commissionRate) {
        if (filters.commissionRate.min !== undefined) {
          conditions.push(sql`${agencies.commissionRate} >= ${filters.commissionRate.min}`)
        }
        if (filters.commissionRate.max !== undefined) {
          conditions.push(sql`${agencies.commissionRate} <= ${filters.commissionRate.max}`)
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Build sort clause
      let orderClause: any
      switch (sortBy) {
        case "name":
          orderClause = sortOrder === "asc" ? asc(agencies.name) : desc(agencies.name)
          break

        case "commissionRate":
          orderClause = sortOrder === "asc" ? asc(agencies.commissionRate) : desc(agencies.commissionRate)
          break
        default:
          orderClause = sortOrder === "asc" ? asc(agencies.createdAt) : desc(agencies.createdAt)
      }

      // Get total count
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(agencies).where(whereClause)

      // Get agencies
      const agencyList = await db
        .select()
        .from(agencies)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset)

      const total = Number(countResult[0]?.count || 0)
      const hasMore = offset + agencyList.length < total

      return {
        agencies: agencyList,
        total,
        page,
        limit,
        hasMore,
      }
    } catch (error) {
      logger.error("Error searching agencies:", error)
      throw new Error("Failed to search agencies")
    }
  }

  /**
   * Verify agency
   */
  async verifyAgency(id: string, verificationNotes?: string): Promise<Agency | null> {
    try {
      const [agency] = await db
        .update(agencies)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, id))
        .returning()

      return agency || null
    } catch (error) {
      logger.error("Error verifying agency:", error)
      throw new Error("Failed to verify agency")
    }
  }

  /**
   * Reject agency verification
   */
  async rejectAgencyVerification(id: string, reason: string): Promise<Agency | null> {
    try {
      const [agency] = await db
        .update(agencies)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, id))
        .returning()

      return agency || null
    } catch (error) {
      logger.error("Error rejecting agency verification:", error)
      throw new Error("Failed to reject agency verification")
    }
  }

  /**
   * Update agency status
   */
  async updateAgencyStatus(id: string, status: AgencyStatusType): Promise<Agency | null> {
    try {
      const [agency] = await db
        .update(agencies)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, id))
        .returning()

      return agency || null
    } catch (error) {
      logger.error("Error updating agency status:", error)
      throw new Error("Failed to update agency status")
    }
  }

  /**
   * Get agency statistics
   */
  async getAgencyStats(id: string): Promise<{
    totalServices: number
    activeAssignments: number
    completedAssignments: number
    totalCommissionEarned: number
    averageRating: number
  }> {
    try {
      // Get total services
      const servicesResult = await db
        .select({ totalServices: sql<number>`count(*)` })
        .from(agencyServices)
        .where(eq(agencyServices.agencyId, id))

      // Get assignment stats
      const [assignmentStats] = await db
        .select({
          activeAssignments: sql<number>`count(*) filter (where status = 'active')`,
          completedAssignments: sql<number>`count(*) filter (where status = 'completed')`,
        })
        .from(serviceAssignments)
        .innerJoin(agencyServices, eq(serviceAssignments.agencyServiceId, agencyServices.id))
        .where(eq(agencyServices.agencyId, id))

      // Get commission stats
      const [commissionStats] = await db
        .select({
          totalCommissionEarned: sql<number>`coalesce(sum(amount), 0)`,
        })
        .from(commissionPayments)
        .where(and(eq(commissionPayments.agencyId, id), eq(commissionPayments.status, "paid")))

      return {
        totalServices: Number(servicesResult[0]?.totalServices || 0),
        activeAssignments: Number(assignmentStats?.activeAssignments || 0),
        completedAssignments: Number(assignmentStats?.completedAssignments || 0),
        totalCommissionEarned: Number(commissionStats?.totalCommissionEarned || 0),
        averageRating: 0,
      }
    } catch (error) {
      logger.error("Error getting agency stats:", error)
      throw new Error("Failed to get agency statistics")
    }
  }
}
