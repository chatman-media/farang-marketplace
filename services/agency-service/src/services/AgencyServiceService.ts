import { eq, and, desc, asc, sql, ilike, inArray } from "drizzle-orm"
import { db } from "../db/connection.js"
import {
  agencyServices,
  agencies,
  type AgencyService,
  type NewAgencyService,
  type ServiceCategoryType,
} from "../db/schema.js"

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
  sortBy?: "name" | "basePrice" | "createdAt" | "category"
  sortOrder?: "asc" | "desc"
}

export class AgencyServiceService {
  /**
   * Create a new agency service
   */
  async createService(
    serviceData: Omit<NewAgencyService, "id" | "createdAt" | "updatedAt">
  ): Promise<AgencyService> {
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
      console.error("Error creating agency service:", error)
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
      console.error("Error getting service by ID:", error)
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
      console.error("Error getting services by agency ID:", error)
      throw new Error("Failed to get services")
    }
  }

  /**
   * Update service
   */
  async updateService(
    id: string,
    updates: Partial<Omit<AgencyService, "id" | "agencyId" | "createdAt">>
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
      console.error("Error updating service:", error)
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
      console.error("Error deleting service:", error)
      throw new Error("Failed to delete service")
    }
  }

  /**
   * Search services with filters
   */
  async searchServices(
    filters: ServiceFilters = {},
    options: ServiceSearchOptions = {}
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
          sql`(${ilike(agencyServices.name, `%${filters.search}%`)} OR ${ilike(agencyServices.description, `%${filters.search}%`)})`
        )
      }

      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          conditions.push(sql`${agencyServices.basePrice} >= ${filters.priceRange.min}`)
        }
        if (filters.priceRange.max !== undefined) {
          conditions.push(sql`${agencyServices.basePrice} <= ${filters.priceRange.max}`)
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Build sort clause
      let orderClause
      switch (sortBy) {
        case "name":
          orderClause = sortOrder === "asc" ? asc(agencyServices.name) : desc(agencyServices.name)
          break
        case "basePrice":
          orderClause =
            sortOrder === "asc" ? asc(agencyServices.basePrice) : desc(agencyServices.basePrice)
          break
        case "category":
          orderClause =
            sortOrder === "asc" ? asc(agencyServices.category) : desc(agencyServices.category)
          break
        default:
          orderClause =
            sortOrder === "asc" ? asc(agencyServices.createdAt) : desc(agencyServices.createdAt)
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(agencyServices)
        .leftJoin(agencies, eq(agencyServices.agencyId, agencies.id))
        .where(whereClause)

      // Get services with agency names
      const serviceList = await db
        .select({
          id: agencyServices.id,
          agencyId: agencyServices.agencyId,
          name: agencyServices.name,
          description: agencyServices.description,
          category: agencyServices.category,
          basePrice: agencyServices.basePrice,
          currency: agencyServices.currency,
          pricingModel: agencyServices.pricingModel,
          isActive: agencyServices.isActive,
          requiresApproval: agencyServices.requiresApproval,
          estimatedDuration: agencyServices.estimatedDuration,
          requirements: agencyServices.requirements,
          capabilities: agencyServices.capabilities,
          metadata: agencyServices.metadata,
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
      const hasMore = offset + serviceList.length < total

      return {
        services: serviceList,
        total,
        page,
        limit,
        hasMore,
      }
    } catch (error) {
      console.error("Error searching services:", error)
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
        .orderBy(asc(agencyServices.basePrice))

      return services
    } catch (error) {
      console.error("Error getting services by category:", error)
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
      console.error("Error toggling service status:", error)
      throw new Error("Failed to toggle service status")
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: string): Promise<{
    totalAssignments: number
    activeAssignments: number
    completedAssignments: number
    averageRating: number
    totalRevenue: number
  }> {
    try {
      // This would require joining with service assignments table
      // For now, return default values
      return {
        totalAssignments: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        averageRating: 0,
        totalRevenue: 0,
      }
    } catch (error) {
      console.error("Error getting service stats:", error)
      throw new Error("Failed to get service statistics")
    }
  }

  /**
   * Bulk update service prices
   */
  async bulkUpdatePrices(agencyId: string, priceMultiplier: number): Promise<{ updated: number }> {
    try {
      const result = await db
        .update(agencyServices)
        .set({
          basePrice: sql`${agencyServices.basePrice} * ${priceMultiplier}`,
          updatedAt: new Date(),
        })
        .where(eq(agencyServices.agencyId, agencyId))

      return { updated: result.length }
    } catch (error) {
      console.error("Error bulk updating prices:", error)
      throw new Error("Failed to bulk update prices")
    }
  }
}
