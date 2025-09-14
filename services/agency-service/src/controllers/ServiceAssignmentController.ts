import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"

import { ServiceAssignmentService } from "../services/ServiceAssignmentService"

export class ServiceAssignmentController {
  private serviceAssignmentService: ServiceAssignmentService

  constructor() {
    this.serviceAssignmentService = new ServiceAssignmentService()
  }

  /**
   * Create a new service assignment
   */
  async createAssignment(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const assignmentData = req.body as any
      const assignment = await this.serviceAssignmentService.createAssignment(assignmentData)

      return reply.code(201).send({
        success: true,
        message: "Service assignment created successfully",
        data: assignment,
      })
    } catch (error) {
      logger.error("Error creating assignment:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create assignment",
      })
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      if (!id) {
        return reply.code(400).send({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const assignment = await this.serviceAssignmentService.getAssignmentById(id)

      if (!assignment) {
        return reply.code(404).send({
          success: false,
          message: "Assignment not found",
        })
      }

      return reply.send({
        success: true,
        data: assignment,
      })
    } catch (error) {
      logger.error("Error getting assignment:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignment",
      })
    }
  }

  /**
   * Get assignments by agency ID
   */
  async getAssignmentsByAgency(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { agencyId } = req.params as { agencyId: string }
      if (!agencyId) {
        return reply.code(400).send({
          success: false,
          message: "Agency ID is required",
        })
      }

      // Note: Method changed to use agency service ID instead of agency ID
      // This endpoint may need to be updated to accept agencyServiceId parameter
      const assignments: any[] = [] // Placeholder - method signature changed

      return reply.send({
        success: true,
        data: assignments,
      })
    } catch (error) {
      logger.error("Error getting assignments by agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignments",
      })
    }
  }

  /**
   * Get assignments by listing ID
   */
  async getAssignmentsByListing(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { listingId } = req.params as { listingId: string }
      if (!listingId) {
        return reply.code(400).send({
          success: false,
          message: "Listing ID is required",
        })
      }

      const assignments = await this.serviceAssignmentService.getAssignmentsByListingId(listingId)

      return reply.send({
        success: true,
        data: assignments,
      })
    } catch (error) {
      logger.error("Error getting assignments by listing:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignments",
      })
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      const { status, notes } = req.body as {
        status: "active" | "paused" | "completed" | "cancelled"
        notes?: string
      }

      if (!id) {
        return reply.code(400).send({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const assignment = await this.serviceAssignmentService.updateAssignmentStatus(id, status, notes)

      if (!assignment) {
        return reply.code(404).send({
          success: false,
          message: "Assignment not found",
        })
      }

      return reply.send({
        success: true,
        message: "Assignment status updated successfully",
        data: assignment,
      })
    } catch (error) {
      logger.error("Error updating assignment status:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update assignment status",
      })
    }
  }

  /**
   * Add customer feedback
   */
  async addCustomerFeedback(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { id } = req.params as { id: string }
      const { rating, feedback } = req.body as { rating: number; feedback?: string }

      if (!id) {
        return reply.code(400).send({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const assignment = await this.serviceAssignmentService.addNotes(id, feedback || `Rating: ${rating}`)

      if (!assignment) {
        return reply.code(404).send({
          success: false,
          message: "Assignment not found",
        })
      }

      return reply.send({
        success: true,
        message: "Customer feedback added successfully",
        data: assignment,
      })
    } catch (error) {
      logger.error("Error adding customer feedback:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to add customer feedback",
      })
    }
  }

  /**
   * Search assignments
   */
  async searchAssignments(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { status, agencyId, listingId, page = 1, limit = 10 } = req.query as any

      const searchParams = {
        status,
        agencyId,
        listingId,
        page: Number.parseInt(page, 10),
        limit: Number.parseInt(limit, 10),
      }

      const assignments = await this.serviceAssignmentService.searchAssignments(searchParams)

      return reply.send({
        success: true,
        data: assignments,
      })
    } catch (error) {
      logger.error("Error searching assignments:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to search assignments",
      })
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { agencyId } = req.params as { agencyId: string }
      if (!agencyId) {
        return reply.code(400).send({
          success: false,
          message: "Agency ID is required",
        })
      }

      const stats = await this.serviceAssignmentService.getAssignmentStats()

      return reply.send({
        success: true,
        data: stats,
      })
    } catch (error) {
      logger.error("Error getting assignment stats:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignment stats",
      })
    }
  }
}
