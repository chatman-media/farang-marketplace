import { FastifyReply, FastifyRequest } from "fastify"

import { AgencyService } from "../services/AgencyService"

export class FastifyAgencyController {
  private agencyService: AgencyService

  constructor() {
    this.agencyService = new AgencyService()
  }

  /**
   * Create a new agency
   */
  async createAgency(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const agencyData = {
        ...(request.body as any),
        userId: request.user!.id,
      }

      const agency = await this.agencyService.createAgency(agencyData)

      return reply.code(201).send({
        success: true,
        message: "Agency created successfully",
        data: agency,
      })
    } catch (error) {
      console.error("Error creating agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create agency",
      })
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string }
      const agency = await this.agencyService.getAgencyById(id)

      if (!agency) {
        return reply.code(404).send({
          success: false,
          message: "Agency not found",
        })
      }

      return reply.code(200).send({
        success: true,
        data: agency,
      })
    } catch (error) {
      console.error("Error getting agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get agency",
      })
    }
  }

  /**
   * Get all agencies with pagination
   */
  async getAllAgencies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status } = request.query as any

      const result = await this.agencyService.searchAgencies(
        { search, status },
        {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
        },
      )

      return reply.code(200).send({
        success: true,
        data: result.agencies,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          hasMore: result.hasMore,
        },
      })
    } catch (error) {
      console.error("Error getting agencies:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get agencies",
      })
    }
  }

  /**
   * Update agency
   */
  async updateAgency(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string }
      const updateData = request.body as any

      const agency = await this.agencyService.updateAgency(id, updateData)

      if (!agency) {
        return reply.code(404).send({
          success: false,
          message: "Agency not found",
        })
      }

      return reply.code(200).send({
        success: true,
        message: "Agency updated successfully",
        data: agency,
      })
    } catch (error) {
      console.error("Error updating agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update agency",
      })
    }
  }

  /**
   * Delete agency
   */
  async deleteAgency(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string }

      const success = await this.agencyService.deleteAgency(id)

      if (!success) {
        return reply.code(404).send({
          success: false,
          message: "Agency not found",
        })
      }

      return reply.code(200).send({
        success: true,
        message: "Agency deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete agency",
      })
    }
  }

  /**
   * Get agency statistics
   */
  async getAgencyStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string }
      const stats = await this.agencyService.getAgencyStats(id)

      return reply.code(200).send({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting agency stats:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get agency statistics",
      })
    }
  }

  /**
   * Get agencies by user
   */
  async getAgenciesByUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.id
      const agency = await this.agencyService.getAgencyByUserId(userId)

      return reply.code(200).send({
        success: true,
        data: agency ? [agency] : [],
      })
    } catch (error) {
      console.error("Error getting user agencies:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get user agencies",
      })
    }
  }

  /**
   * Update agency status
   */
  async updateAgencyStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: string }

      // Validate status
      const validStatuses = ["pending", "active", "suspended", "inactive", "rejected"] as const
      if (!validStatuses.includes(status as any)) {
        return reply.code(400).send({
          success: false,
          error: "Invalid status",
          validStatuses,
        })
      }

      const agency = await this.agencyService.updateAgencyStatus(id, status as any)

      if (!agency) {
        return reply.code(404).send({
          success: false,
          message: "Agency not found",
        })
      }

      return reply.code(200).send({
        success: true,
        message: "Agency status updated successfully",
        data: agency,
      })
    } catch (error) {
      console.error("Error updating agency status:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update agency status",
      })
    }
  }
}

export const agencyController = new FastifyAgencyController()
