import { FastifyPluginAsync } from "fastify"
import { authenticateToken, requireAgencyStaff } from "../middleware/auth"

const assignmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all assignments
  fastify.get("/", {
    preHandler: [authenticateToken],
    handler: async (request, reply) => {
      return reply.code(200).send({
        success: true,
        data: [],
        message: "Assignments retrieved successfully (placeholder)",
      })
    },
  })

  // Get assignment by ID
  fastify.get("/:id", {
    preHandler: [authenticateToken],
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      return reply.code(200).send({
        success: true,
        data: { id, status: "active" },
        message: "Assignment retrieved successfully (placeholder)",
      })
    },
  })

  // Create assignment (protected)
  fastify.post("/", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          serviceId: { type: "string" },
          agencyId: { type: "string" },
          userId: { type: "string" },
          commissionRate: { type: "number" },
        },
        required: ["serviceId", "agencyId", "userId"],
      },
    },
    handler: async (request, reply) => {
      return reply.code(201).send({
        success: true,
        data: { id: "new-assignment-id", ...(request.body as any) },
        message: "Assignment created successfully (placeholder)",
      })
    },
  })

  // Update assignment (protected)
  fastify.put("/:id", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          status: { type: "string" },
          commissionRate: { type: "number" },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      return reply.code(200).send({
        success: true,
        data: { id, ...(request.body as any) },
        message: "Assignment updated successfully (placeholder)",
      })
    },
  })

  // Delete assignment (protected)
  fastify.delete("/:id", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: async (request, reply) => {
      return reply.code(200).send({
        success: true,
        message: "Assignment deleted successfully (placeholder)",
      })
    },
  })
}

export default assignmentsRoutes
