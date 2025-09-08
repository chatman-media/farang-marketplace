import { FastifyPluginAsync } from "fastify"

import { authenticateToken, requireAgencyStaff } from "../middleware/auth"

const servicesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all services
  fastify.get("/", {
    handler: async (_request, reply) => {
      return reply.status(200).send({
        success: true,
        data: [],
        message: "Services retrieved successfully (placeholder)",
      })
    },
  })

  // Get service by ID
  fastify.get("/:id", {
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
      return reply.status(200).send({
        success: true,
        data: { id, name: "Sample Service" },
        message: "Service retrieved successfully (placeholder)",
      })
    },
  })

  // Create service (protected)
  fastify.post("/", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          agencyId: { type: "string" },
        },
        required: ["name", "category", "price", "agencyId"],
      },
    },
    handler: async (request, reply) => {
      return reply.status(201).send({
        success: true,
        data: { id: "new-service-id", ...(request.body as any) },
        message: "Service created successfully (placeholder)",
      })
    },
  })

  // Update service (protected)
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
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      return reply.status(200).send({
        success: true,
        data: { id, ...(request.body as any) },
        message: "Service updated successfully (placeholder)",
      })
    },
  })

  // Delete service (protected)
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
      return reply.status(200).send({
        success: true,
        message: "Service deleted successfully (placeholder)",
      })
    },
  })
}

export default servicesRoutes
