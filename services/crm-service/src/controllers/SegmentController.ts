import { FastifyReply, FastifyRequest } from "fastify"
import { CreateSegmentRequest, Segment, UpdateSegmentRequest } from "../models/Segment"
import { SegmentationService } from "../services/SegmentationService"

export class SegmentController {
  private segmentationService: SegmentationService

  constructor() {
    this.segmentationService = new SegmentationService()
  }

  // GET /api/crm/segments - Get all segments with pagination and filtering
  async getSegments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        page?: string
        limit?: string
        isActive?: string
        createdBy?: string
        search?: string
      }

      const page = parseInt(query.page || "1")
      const limit = parseInt(query.limit || "20")
      const offset = (page - 1) * limit

      const filters = {
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
        createdBy: query.createdBy,
        search: query.search,
        limit,
        offset,
      }

      const result = await this.segmentationService.getSegments(filters)

      return reply.code(200).send({
        success: true,
        data: result.segments.map((segment) => segment.toJSON()),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get segments")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve segments",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/segments/:id - Get segment by ID
  async getSegment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const segment = await this.segmentationService.getSegmentById(params.id)

      if (!segment) {
        return reply.code(404).send({
          success: false,
          error: "Segment not found",
          message: `Segment with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        data: segment.toJSON(),
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get segment")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve segment",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/segments - Create new segment
  async createSegment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const segmentData = request.body as CreateSegmentRequest
      const user = (request as any).user // From auth middleware

      // Validate the request
      const validationErrors = Segment.validateCreateRequest(segmentData)
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          message: "Segment data is invalid",
          details: validationErrors,
          timestamp: new Date().toISOString(),
        })
      }

      const segment = await this.segmentationService.createSegment(segmentData, user?.id || "system")

      return reply.code(201).send({
        success: true,
        data: segment.toJSON(),
        message: "Segment created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to create segment")

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Segment already exists",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create segment",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // PUT /api/crm/segments/:id - Update segment
  async updateSegment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const updateData = request.body as UpdateSegmentRequest

      // Validate the request
      const validationErrors = Segment.validateUpdateRequest(updateData)
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          message: "Update data is invalid",
          details: validationErrors,
          timestamp: new Date().toISOString(),
        })
      }

      const segment = await this.segmentationService.updateSegment(params.id, updateData)

      if (!segment) {
        return reply.code(404).send({
          success: false,
          error: "Segment not found",
          message: `Segment with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        data: segment.toJSON(),
        message: "Segment updated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to update segment")
      return reply.code(500).send({
        success: false,
        error: "Failed to update segment",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // DELETE /api/crm/segments/:id - Delete segment
  async deleteSegment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const deleted = await this.segmentationService.deleteSegment(params.id)

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: "Segment not found",
          message: `Segment with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        message: "Segment deleted successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to delete segment")
      return reply.code(500).send({
        success: false,
        error: "Failed to delete segment",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/segments/:id/recalculate - Recalculate segment membership
  async recalculateSegment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const customerCount = await this.segmentationService.recalculateSegmentMembership(params.id)

      return reply.code(200).send({
        success: true,
        data: { customerCount },
        message: "Segment membership recalculated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to recalculate segment")

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Segment not found",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to recalculate segment",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/segments/:id/customers - Get customers in segment
  async getSegmentCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const query = request.query as {
        page?: string
        limit?: string
      }

      const page = parseInt(query.page || "1")
      const limit = parseInt(query.limit || "20")
      const offset = (page - 1) * limit

      const result = await this.segmentationService.getCustomersInSegment(params.id, {
        limit,
        offset,
      })

      return reply.code(200).send({
        success: true,
        data: result.customers.map((customer) => customer.toJSON()),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get segment customers")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve segment customers",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/segments/fields - Get available fields for segmentation
  async getSegmentFields(request: FastifyRequest, reply: FastifyReply) {
    try {
      const fields = Segment.getAvailableFields()

      return reply.code(200).send({
        success: true,
        data: fields,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get segment fields")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve segment fields",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/segments/stats - Get segment statistics
  async getSegmentStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.segmentationService.getSegmentStats()

      return reply.code(200).send({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get segment stats")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve segment statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/segments/recalculate-all - Recalculate all segment memberships
  async recalculateAllSegments(request: FastifyRequest, reply: FastifyReply) {
    try {
      await this.segmentationService.recalculateAllSegmentMemberships()

      return reply.code(200).send({
        success: true,
        message: "All segment memberships recalculated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to recalculate all segments")
      return reply.code(500).send({
        success: false,
        error: "Failed to recalculate all segments",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
