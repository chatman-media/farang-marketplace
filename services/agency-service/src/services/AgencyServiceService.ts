import {
  agencies,
  agencyServices,
  and,
  asc,
  createDatabaseConnection,
  desc,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  ilike,
  productTypeEnum,
  sql,
} from "@marketplace/database-schema"
import logger from "@marketplace/logger"

const db = createDatabaseConnection(process.env.DATABASE_URL!)

// Type definitions
type AgencyService = InferSelectModel<typeof agencyServices>
type NewAgencyService = InferInsertModel<typeof agencyServices>
type ServiceCategoryType = (typeof productTypeEnum.enumValues)[number]

export interface ServiceFilters {
  agencyId?: string
  category?: ServiceCategoryType
  isActive?: boolean
  priceRange?: {
    min: number
    max: number
  }
  search?: string
}

export interface ServiceSearchOptions {
  page?: number
  limit?: number
  sortBy?: "name" | "createdAt" | "category"
  sortOrder?: "asc" | "desc"
}

export class AgencyServiceService {
  /**
   * Create a new agency service
   */
  async createService(serviceData: Omit<NewAgencyService, "id" | "createdAt" | "updatedAt">): Promise<AgencyService> {
    try {
      // Verify agency exists
      const [agency] = await db.select().from(agencies).where(eq(agencies.id, serviceData.agencyId))

      if (!agency) {
        throw new Error("Agency not found")
      }

      const [service] = await db
        .insert(agencyServices)
        .values({
          ...serviceData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      if (!service) {
        throw new Error("Failed to create service")
      }

      return service
    } catch (error) {
      logger.error("Error creating agency service:", error)
      throw new Error("Failed to create agency service")
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<AgencyService | null> {
    try {
      const [service] = await db.select().from(agencyServices).where(eq(agencyServices.id, id))

      return service || null
    } catch (error) {
      logger.error("Error getting service by ID:", error)
      throw new Error("Failed to get service")
    }
  }

  /**
   * Get services by agency ID
   */
  async getServicesByAgencyId(agencyId: string): Promise<AgencyService[]> {
    try {
      const services = await db
        .select()
        .from(agencyServices)
        .where(eq(agencyServices.agencyId, agencyId))
        .orderBy(desc(agencyServices.createdAt))

      return services
    } catch (error) {
      logger.error("Error getting services by agency ID:", error)
      throw new Error("Failed to get services")
    }
  }

  /**
   * Update service
   */
  async updateService(
    id: string,
    updates: Partial<Omit<AgencyService, "id" | "agencyId" | "createdAt">>,
  ): Promise<AgencyService | null> {
    try {
      const [service] = await db
        .update(agencyServices)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(agencyServices.id, id))
        .returning()

      return service || null
    } catch (error) {
      logger.error("Error updating service:", error)
      throw new Error("Failed to update service")
    }
  }

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<boolean> {
    try {
      const result = await db.delete(agencyServices).where(eq(agencyServices.id, id))

      return result.length > 0
    } catch (error) {
      logger.error("Error deleting service:", error)
      throw new Error("Failed to delete service")
    }
  }

  /**
   * Search services with filters
   */
  async searchServices(
    filters: ServiceFilters = {},
    options: ServiceSearchOptions = {},
  ): Promise<{
    services: (AgencyService & { agencyName: string | null })[]
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

      if (filters.agencyId) {
        conditions.push(eq(agencyServices.agencyId, filters.agencyId))
      }

      if (filters.category) {
        conditions.push(eq(agencyServices.category, filters.category))
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(agencyServices.isActive, filters.isActive))
      }

      if (filters.search) {
        conditions.push(
          sql`(${ilike(agencyServices.name, `%${filters.search}%`)} OR ${ilike(agencyServices.description, `%${filters.search}%`)})`,
        )
      }

      // Price range filtering removed - basePrice field not available in schema

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Build sort clause
      let orderClause: any
      switch (sortBy) {
        case "name":
          orderClause = sortOrder === "asc" ? asc(agencyServices.name) : desc(agencyServices.name)
          break
        case "category":
          orderClause = sortOrder === "asc" ? asc(agencyServices.category) : desc(agencyServices.category)
          break
        default:
          orderClause = sortOrder === "asc" ? asc(agencyServices.createdAt) : desc(agencyServices.createdAt)
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(agencyServices)
        .leftJoin(agencies, eq(agencyServices.agencyId, agencies.id))
        .where(whereClause)

      // Get services with agency names
      const services = await db
        .select({
          id: agencyServices.id,
          agencyId: agencyServices.agencyId,
          name: agencyServices.name,
          description: agencyServices.description,
          category: agencyServices.category,
          isActive: agencyServices.isActive,
          createdAt: agencyServices.createdAt,
          updatedAt: agencyServices.updatedAt,
          agencyName: agencies.name,
        })
        .from(agencyServices)
        .leftJoin(agencies, eq(agencyServices.agencyId, agencies.id))
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset)

      const total = Number(countResult[0]?.count || 0)
      const hasMore = offset + services.length < total

      return {
        services,
        total,
        page,
        limit,
        hasMore,
      }
    } catch (error) {
      logger.error("Error searching services:", error)
      throw new Error("Failed to search services")
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: ServiceCategoryType): Promise<AgencyService[]> {
    try {
      const services = await db
        .select()
        .from(agencyServices)
        .where(and(eq(agencyServices.category, category), eq(agencyServices.isActive, true)))
        .orderBy(asc(agencyServices.name))

      return services
    } catch (error) {
      logger.error("Error getting services by category:", error)
      throw new Error("Failed to get services by category")
    }
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(id: string): Promise<AgencyService | null> {
    try {
      // Get current status
      const service = await this.getServiceById(id)
      if (!service) {
        throw new Error("Service not found")
      }

      // Toggle status
      const [updatedService] = await db
        .update(agencyServices)
        .set({
          isActive: !service.isActive,
          updatedAt: new Date(),
        })
        .where(eq(agencyServices.id, id))
        .returning()

      return updatedService || null
    } catch (error) {
      logger.error("Error toggling service status:", error)
      throw new Error("Failed to toggle service status")
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(_serviceId: string): Promise<{
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
    averageRating: number
    totalRevenue: number
  }> {
    // This would require joining with service assignments table
    // For now, return default values
    return {
      totalAssignments: 0,
      activeAssignments: 0,
      completedAssignments: 0,
      averageRating: 0,
      totalRevenue: 0,
    }
  }

  /**
   * Bulk update service prices
   */
  async bulkUpdatePrices(agencyId: string, _priceMultiplier: number): Promise<{ updated: number }> {
    try {
      const result = await db
        .update(agencyServices)
        .set({
          // Price update removed - basePrice field not available in schema
          updatedAt: new Date(),
        })
        .where(eq(agencyServices.agencyId, agencyId))

      return { updated: result.length }
    } catch (error) {
      logger.error("Error bulk updating prices:", error)
      throw new Error("Failed to bulk update prices")
    }
  }
}
