import { FastifyPluginAsync } from "fastify"

import { ServiceAssignmentController } from "../controllers/ServiceAssignmentController"
import { authenticateToken, requireAgencyStaff } from "../middleware/auth"

const serviceAssignmentController = new ServiceAssignmentController()

const serviceAssignmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create new assignment
  fastify.post("/", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          agencyId: { type: "string" },
          serviceId: { type: "string" },
          listingId: { type: "string" },
          commissionRate: { type: "number" },
          status: {
            type: "string",
            enum: ["active", "paused", "completed", "cancelled"],
          },
        },
        required: ["agencyId", "serviceId", "listingId", "commissionRate"],
      },
    },
    handler: serviceAssignmentController.createAssignment.bind(serviceAssignmentController),
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
    handler: serviceAssignmentController.getAssignmentById.bind(serviceAssignmentController),
  })

  // Get assignments by agency
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
    handler: serviceAssignmentController.getAssignmentsByAgency.bind(serviceAssignmentController),
  })

  // Get assignments by listing
  fastify.get("/listing/:listingId", {
    preHandler: [authenticateToken],
    schema: {
      params: {
        type: "object",
        properties: {
          listingId: { type: "string" },
        },
        required: ["listingId"],
      },
    },
    handler: serviceAssignmentController.getAssignmentsByListing.bind(serviceAssignmentController),
  })

  // Update assignment
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
          commissionRate: { type: "number" },
          status: {
            type: "string",
            enum: ["active", "paused", "completed", "cancelled"],
          },
        },
      },
    },
    handler: serviceAssignmentController.createAssignment.bind(serviceAssignmentController),
  })

  // Delete assignment
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
    handler: serviceAssignmentController.createAssignment.bind(serviceAssignmentController),
  })

  // Get assignment statistics
  fastify.get("/stats/:agencyId", {
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
    handler: serviceAssignmentController.getAssignmentStats.bind(serviceAssignmentController),
  })
}

export default serviceAssignmentsRoutes
