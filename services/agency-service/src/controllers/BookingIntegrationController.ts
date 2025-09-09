import { FastifyRequest, FastifyReply } from "fastify"
import { BookingIntegrationService } from "../services/BookingIntegrationService"

export class BookingIntegrationController {
  private bookingIntegrationService: BookingIntegrationService

  constructor() {
    this.bookingIntegrationService = new BookingIntegrationService()
  }

  /**
   * Find matching agencies for a booking request
   */
  async findMatchingAgencies(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const bookingRequest = req.body as any
      const matches = await this.bookingIntegrationService.findMatchingAgencies(bookingRequest)

      return reply.send({
        success: true,
        message: `Found ${matches.length} matching agencies`,
        data: {
          matches,
          total: matches.length,
        },
      })
    } catch (error) {
      console.error("Error finding matching agencies:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to find matching agencies",
      })
    }
  }

  /**
   * Assign service to specific agency
   */
  async assignServiceToAgency(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { bookingRequest, agencyMatch } = req.body as any
      const result = await this.bookingIntegrationService.assignServiceToAgency(bookingRequest, agencyMatch)

      return reply.code(201).send({
        success: true,
        message: "Service assigned to agency successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error assigning service to agency:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign service to agency",
      })
    }
  }

  /**
   * Auto-assign best matching agency
   */
  async autoAssignBestMatch(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const bookingRequest = req.body as any
      const result = await this.bookingIntegrationService.autoAssignBestMatch(bookingRequest)

      if (!result) {
        return reply.code(404).send({
          success: false,
          message: "No matching agencies found for this request",
        })
      }

      return reply.code(201).send({
        success: true,
        message: "Service auto-assigned successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error auto-assigning service:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to auto-assign service",
      })
    }
  }

  /**
   * Calculate commission for assignment
   */
  async calculateCommission(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { assignmentId } = req.params as { assignmentId: string }
      const { finalPrice } = req.body as { finalPrice: number }

      if (!assignmentId) {
        return reply.code(400).send({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const commission = await this.bookingIntegrationService.calculateCommission(assignmentId, finalPrice)

      return reply.send({
        success: true,
        data: commission,
      })
    } catch (error) {
      console.error("Error calculating commission:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate commission",
      })
    }
  }

  /**
   * Get assignment status
   */
  async getAssignmentStatus(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { assignmentId } = req.params as { assignmentId: string }

      if (!assignmentId) {
        return reply.code(400).send({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const status = await this.bookingIntegrationService.getAssignmentStatus(assignmentId)

      if (!status) {
        return reply.code(404).send({
          success: false,
          message: "Assignment not found",
        })
      }

      return reply.send({
        success: true,
        data: status,
      })
    } catch (error) {
      console.error("Error getting assignment status:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignment status",
      })
    }
  }

  /**
   * Get available service categories
   */
  async getServiceCategories(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const categories = [
        { id: "delivery", name: "Delivery Services", description: "Package and food delivery" },
        { id: "emergency", name: "Emergency Services", description: "24/7 emergency assistance" },
        {
          id: "maintenance",
          name: "Maintenance Services",
          description: "Property maintenance and repairs",
        },
        {
          id: "insurance",
          name: "Insurance Services",
          description: "Insurance claims and assessments",
        },
        {
          id: "cleaning",
          name: "Cleaning Services",
          description: "Residential and commercial cleaning",
        },
        {
          id: "security",
          name: "Security Services",
          description: "Security guards and surveillance",
        },
        {
          id: "transportation",
          name: "Transportation",
          description: "Vehicle and logistics services",
        },
        {
          id: "legal",
          name: "Legal Services",
          description: "Legal consultation and documentation",
        },
        {
          id: "financial",
          name: "Financial Services",
          description: "Financial planning and advisory",
        },
        {
          id: "marketing",
          name: "Marketing Services",
          description: "Digital marketing and advertising",
        },
        { id: "consulting", name: "Consulting", description: "Business and technical consulting" },
        { id: "other", name: "Other Services", description: "Custom service categories" },
      ]

      return reply.send({
        success: true,
        data: categories,
      })
    } catch (error) {
      console.error("Error getting service categories:", error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get service categories",
      })
    }
  }
}
