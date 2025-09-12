import { FastifyPluginAsync } from "fastify"

import { AgencyServiceController } from "../controllers/AgencyServiceController"
import { authenticateToken, requireAgencyStaff } from "../middleware/auth"

const agencyServiceController = new AgencyServiceController()

const agencyServicesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all services for an agency
  fastify.get("/agency/:agencyId", {
    preHandler: [authenticateToken],
    schema: {
      params: {
        type: "object",
        properties: {
          agencyId: { type: "string" },
        },
        required: ["agencyId"],
      },
    },
    handler: agencyServiceController.getServicesByAgency.bind(agencyServiceController),
  })

  // Get service by ID
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
    handler: agencyServiceController.getServiceById.bind(agencyServiceController),
  })

  // Create new service
  fastify.post("/", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          basePrice: { type: "number" },
          currency: { type: "string" },
          isActive: { type: "boolean" },
        },
        required: ["name", "description", "category", "basePrice"],
      },
    },
    handler: agencyServiceController.createService.bind(agencyServiceController),
  })

  // Update service
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
          basePrice: { type: "number" },
          currency: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
    },
    handler: agencyServiceController.updateService.bind(agencyServiceController),
  })

  // Delete service
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
    handler: agencyServiceController.deleteService.bind(agencyServiceController),
  })

  // Search services
  fastify.get("/search", {
    preHandler: [authenticateToken],
    schema: {
      querystring: {
        type: "object",
        properties: {
          category: { type: "string" },
          agencyId: { type: "string" },
          isActive: { type: "boolean" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          search: { type: "string" },
          page: { type: "number", default: 1 },
          limit: { type: "number", default: 10 },
        },
      },
    },
    handler: agencyServiceController.searchServices.bind(agencyServiceController),
  })

  // Toggle service status
  fastify.patch("/:id/status", {
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
          isActive: { type: "boolean" },
        },
        required: ["isActive"],
      },
    },
    handler: agencyServiceController.toggleServiceStatus.bind(agencyServiceController),
  })

  // Bulk update prices
  fastify.patch("/bulk/prices", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          serviceIds: {
            type: "array",
            items: { type: "string" },
          },
          priceMultiplier: { type: "number" },
          fixedAmount: { type: "number" },
        },
        required: ["serviceIds"],
      },
    },
    handler: agencyServiceController.bulkUpdatePrices.bind(agencyServiceController),
  })
}

export default agencyServicesRoutes
