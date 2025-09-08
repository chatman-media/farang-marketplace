import { FastifyRequest, FastifyReply } from "fastify"
import { AgencyServiceService } from "../services/AgencyServiceService"

export class AgencyServiceController {
  private agencyServiceService: AgencyServiceService

  constructor() {
    this.agencyServiceService = new AgencyServiceService()
  }

  /**
   * Create new service
   */
  async createService(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const serviceData = req.body as any
      const service = await this.agencyServiceService.createService({
        ...serviceData,
        agencyId: req.user?.agencyId,
      })

      return reply.status(201).send({
        success: true,
        message: "Service created successfully",
        data: service,
      })
    } catch (error) {
      console.error("Error creating service:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create service",
      })
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      if (!id) {
        return reply.status(400).send({
          success: false,
          message: "Service ID is required",
        })
      }

      const service = await this.agencyServiceService.getServiceById(id)

      if (!service) {
        return reply.status(404).send({
          success: false,
          message: "Service not found",
        })
      }

      return reply.send({
        success: true,
        data: service,
      })
    } catch (error) {
      console.error("Error getting service:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get service",
      })
    }
  }

  /**
   * Get services by agency
   */
  async getServicesByAgency(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { agencyId } = req.params as { agencyId: string }
      if (!agencyId) {
        return reply.status(400).send({
          success: false,
          message: "Agency ID is required",
        })
      }

      const services = await this.agencyServiceService.getServicesByAgencyId(agencyId)

      return reply.send({
        success: true,
        data: services,
      })
    } catch (error) {
      console.error("Error getting services by agency:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get services",
      })
    }
  }

  /**
   * Update service
   */
  async updateService(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      if (!id) {
        return reply.status(400).send({
          success: false,
          message: "Service ID is required",
        })
      }

      const updates = req.body as any
      const service = await this.agencyServiceService.updateService(id, updates)

      if (!service) {
        return reply.status(404).send({
          success: false,
          message: "Service not found",
        })
      }

      return reply.send({
        success: true,
        message: "Service updated successfully",
        data: service,
      })
    } catch (error) {
      console.error("Error updating service:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update service",
      })
    }
  }

  /**
   * Delete service
   */
  async deleteService(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      if (!id) {
        return reply.status(400).send({
          success: false,
          message: "Service ID is required",
        })
      }

      const deleted = await this.agencyServiceService.deleteService(id)

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          message: "Service not found",
        })
      }

      return reply.send({
        success: true,
        message: "Service deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete service",
      })
    }
  }

  /**
   * Search services
   */
  async searchServices(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { query, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query as any

      const searchParams = {
        query,
        category,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
      }
      const services = await this.agencyServiceService.searchServices(searchParams)

      return reply.send({
        success: true,
        data: services,
      })
    } catch (error) {
      console.error("Error searching services:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to search services",
      })
    }
  }

  /**
   * Toggle service status
   */
  async toggleServiceStatus(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      if (!id) {
        return reply.status(400).send({
          success: false,
          message: "Service ID is required",
        })
      }

      const service = await this.agencyServiceService.toggleServiceStatus(id)

      if (!service) {
        return reply.status(404).send({
          success: false,
          message: "Service not found",
        })
      }

      return reply.send({
        success: true,
        message: "Service status updated successfully",
        data: service,
      })
    } catch (error) {
      console.error("Error toggling service status:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to toggle service status",
      })
    }
  }

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { agencyId } = req.params as { agencyId: string }
      const { priceMultiplier } = req.body as { priceMultiplier: number }

      if (!agencyId) {
        return reply.status(400).send({
          success: false,
          message: "Agency ID is required",
        })
      }

      const updatedServices = await this.agencyServiceService.bulkUpdatePrices(agencyId, priceMultiplier)

      return reply.send({
        success: true,
        message: "Prices updated successfully",
        data: updatedServices,
      })
    } catch (error) {
      console.error("Error bulk updating prices:", error)
      return reply.status(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update prices",
      })
    }
  }
}
