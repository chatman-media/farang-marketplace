import { FastifyPluginAsync } from "fastify"
import { BookingIntegrationController } from "../controllers/BookingIntegrationController"
import { authenticateToken, requireAgencyStaff } from "../middleware/auth"

const bookingIntegrationController = new BookingIntegrationController()

const bookingIntegrationRoutes: FastifyPluginAsync = async (fastify) => {
  // Find matching agencies
  fastify.post("/find-agencies", {
    preHandler: [authenticateToken],
    schema: {
      body: {
        type: "object",
        properties: {
          location: { type: "string" },
          serviceType: { type: "string" },
          budget: { type: "number" },
        },
        required: ["location", "serviceType"],
      },
    },
    handler: bookingIntegrationController.findMatchingAgencies.bind(bookingIntegrationController),
  })

  // Assign service to agency
  fastify.post("/assign", {
    preHandler: [authenticateToken, requireAgencyStaff],
    schema: {
      body: {
        type: "object",
        properties: {
          agencyId: { type: "string" },
          serviceId: { type: "string" },
          listingId: { type: "string" },
          commissionRate: { type: "number" },
        },
        required: ["agencyId", "serviceId", "listingId", "commissionRate"],
      },
    },
    handler: bookingIntegrationController.assignServiceToAgency.bind(bookingIntegrationController),
  })

  // Auto assign best match
  fastify.post("/auto-assign", {
    preHandler: [authenticateToken],
    schema: {
      body: {
        type: "object",
        properties: {
          location: { type: "string" },
          serviceType: { type: "string" },
          budget: { type: "number" },
          listingId: { type: "string" },
        },
        required: ["location", "serviceType", "listingId"],
      },
    },
    handler: bookingIntegrationController.autoAssignBestMatch.bind(bookingIntegrationController),
  })

  // Calculate commission
  fastify.post("/calculate-commission", {
    preHandler: [authenticateToken],
    schema: {
      body: {
        type: "object",
        properties: {
          basePrice: { type: "number" },
          commissionRate: { type: "number" },
        },
        required: ["basePrice", "commissionRate"],
      },
    },
    handler: bookingIntegrationController.calculateCommission.bind(bookingIntegrationController),
  })

  // Get service categories
  fastify.get("/service-categories", {
    preHandler: [authenticateToken],
    handler: bookingIntegrationController.getServiceCategories.bind(bookingIntegrationController),
  })

  // Process booking webhook
  fastify.post("/webhook", {
    schema: {
      body: {
        type: "object",
        properties: {
          bookingId: { type: "string" },
          status: { type: "string" },
          agencyId: { type: "string" },
        },
        required: ["bookingId", "status", "agencyId"],
      },
    },
    handler: async (request, reply) => {
      return reply.status(200).send({
        success: true,
        message: "Webhook processed successfully",
      })
    },
  })
}

export default bookingIntegrationRoutes
