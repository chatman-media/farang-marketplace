import { FastifyPluginAsync } from "fastify"

import { agencyController } from "../controllers/AgencyController"
import {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireAgencyOwnership,
  requireAgencyStaff,
} from "../middleware/auth"

const agenciesRoutes: FastifyPluginAsync = async (fastify) => {
  // Public routes
  fastify.get("/search", {
    preHandler: [optionalAuth],
    handler: async (_request, reply) => {
      return reply.code(200).send({
        success: true,
        data: [],
        message: "Agency search (placeholder)",
      })
    },
  })

  fastify.get("/:id", {
    preHandler: [optionalAuth],
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: agencyController.getAgencyById.bind(agencyController),
  })

  // Protected routes - require authentication
  fastify.get("/", {
    preHandler: [authenticateToken],
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "number", default: 1 },
          limit: { type: "number", default: 10 },
          search: { type: "string" },
          status: { type: "string" },
        },
      },
    },
    handler: agencyController.getAllAgencies.bind(agencyController),
  })

  fastify.post("/", {
    preHandler: [authenticateToken],
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          address: { type: "string" },
          website: { type: "string" },
          businessLicense: { type: "string" },
          taxId: { type: "string" },
        },
        required: ["name", "email", "phone"],
      },
    },
    handler: agencyController.createAgency.bind(agencyController),
  })

  fastify.put("/:id", {
    preHandler: [authenticateToken, requireAgencyOwnership],
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
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          address: { type: "string" },
          website: { type: "string" },
        },
      },
    },
    handler: agencyController.updateAgency.bind(agencyController),
  })

  fastify.delete("/:id", {
    preHandler: [authenticateToken, requireAgencyOwnership],
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    handler: agencyController.deleteAgency.bind(agencyController),
  })

  // Admin routes
  fastify.patch("/:id/status", {
    preHandler: [authenticateToken, requireAdmin],
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
          status: { type: "string", enum: ["pending", "approved", "rejected", "suspended"] },
        },
        required: ["status"],
      },
    },
    handler: agencyController.updateAgencyStatus.bind(agencyController),
  })

  // Agency staff routes
  fastify.get("/my/agencies", {
    preHandler: [authenticateToken],
    handler: agencyController.getAgenciesByUser.bind(agencyController),
  })

  fastify.get("/:id/stats", {
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
    handler: agencyController.getAgencyStats.bind(agencyController),
  })
}

export default agenciesRoutes
