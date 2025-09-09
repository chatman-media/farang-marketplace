import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ServiceProviderController } from "../controllers/ServiceProviderController"
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth"

interface ServiceProviderRouteOptions {
  serviceProviderController: ServiceProviderController
}

const serviceProviderRoutes: FastifyPluginAsync<ServiceProviderRouteOptions> = async (
  fastify: FastifyInstance,
  options,
) => {
  const { serviceProviderController } = options

  // Register authentication decorators if not already registered
  if (!fastify.hasDecorator("authenticate")) {
    fastify.decorate("authenticate", authMiddleware)
  }
  if (!fastify.hasDecorator("optionalAuthenticate")) {
    fastify.decorate("optionalAuthenticate", optionalAuthMiddleware)
  }

  // Create service provider (with image upload)
  fastify.post(
    "/",
    {
      preHandler: [authMiddleware],
      schema: {
        consumes: ["multipart/form-data"],
        body: {
          type: "object",
          properties: {
            providerType: { type: "string", enum: ["individual", "company"] },
            businessName: { type: "string", minLength: 2, maxLength: 100 },
            description: { type: "string", maxLength: 2000 },
            serviceCapabilities: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
            },
            primaryLocation: {
              type: "object",
              properties: {
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                postalCode: { type: "string" },
                country: { type: "string", default: "Thailand" },
                coordinates: {
                  type: "object",
                  properties: {
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                },
              },
              required: ["address", "city", "province"],
            },
            contactInfo: {
              type: "object",
              properties: {
                phone: { type: "string" },
                email: { type: "string", format: "email" },
                website: { type: "string", format: "uri" },
                socialMedia: {
                  type: "object",
                  properties: {
                    facebook: { type: "string" },
                    instagram: { type: "string" },
                    line: { type: "string" },
                  },
                },
              },
              required: ["phone"],
            },
            operatingHours: {
              type: "object",
              properties: {
                monday: { type: "string" },
                tuesday: { type: "string" },
                wednesday: { type: "string" },
                thursday: { type: "string" },
                friday: { type: "string" },
                saturday: { type: "string" },
                sunday: { type: "string" },
              },
            },
            pricing: {
              type: "object",
              properties: {
                baseRate: { type: "number", minimum: 0 },
                currency: { type: "string", default: "THB" },
                rateType: { type: "string", enum: ["hourly", "daily", "project", "custom"] },
                minimumCharge: { type: "number", minimum: 0 },
              },
            },
          },
          required: [
            "providerType",
            "businessName",
            "description",
            "serviceCapabilities",
            "primaryLocation",
            "contactInfo",
          ],
        },
      },
    },
    serviceProviderController.createServiceProvider.bind(serviceProviderController),
  )

  // Get service provider by ID
  fastify.get(
    "/:id",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      return serviceProviderController.getServiceProvider(request as any, reply)
    },
  )

  // Search service providers
  fastify.get(
    "/search",
    {
      preHandler: [optionalAuthMiddleware],
      schema: {
        querystring: {
          type: "object",
          properties: {
            query: { type: "string" },
            providerType: { type: "string", enum: ["individual", "company"] },
            serviceCapabilities: {
              type: "array",
              items: { type: "string" },
            },
            location: {
              type: "object",
              properties: {
                city: { type: "string" },
                province: { type: "string" },
                radius: { type: "number", minimum: 1, maximum: 100 },
              },
            },
            verificationLevel: {
              type: "string",
              enum: ["unverified", "basic", "premium", "enterprise"],
            },
            rating: { type: "number", minimum: 1, maximum: 5 },
            priceRange: {
              type: "object",
              properties: {
                min: { type: "number", minimum: 0 },
                max: { type: "number", minimum: 0 },
              },
            },
            availability: {
              type: "object",
              properties: {
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
              },
            },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            sortBy: {
              type: "string",
              enum: ["rating", "price", "distance", "created_at"],
              default: "rating",
            },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        },
      },
    },
    async (request, reply) => {
      return serviceProviderController.searchServiceProviders(request as any, reply)
    },
  )

  // Update service provider (with optional image upload)
  fastify.patch(
    "/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            businessName: { type: "string", minLength: 2, maxLength: 100 },
            description: { type: "string", maxLength: 2000 },
            serviceCapabilities: {
              type: "array",
              items: { type: "string" },
            },
            primaryLocation: {
              type: "object",
              properties: {
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                postalCode: { type: "string" },
                country: { type: "string" },
                coordinates: {
                  type: "object",
                  properties: {
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                },
              },
            },
            contactInfo: {
              type: "object",
              properties: {
                phone: { type: "string" },
                email: { type: "string", format: "email" },
                website: { type: "string", format: "uri" },
                socialMedia: {
                  type: "object",
                  properties: {
                    facebook: { type: "string" },
                    instagram: { type: "string" },
                    line: { type: "string" },
                  },
                },
              },
            },
            operatingHours: {
              type: "object",
              properties: {
                monday: { type: "string" },
                tuesday: { type: "string" },
                wednesday: { type: "string" },
                thursday: { type: "string" },
                friday: { type: "string" },
                saturday: { type: "string" },
                sunday: { type: "string" },
              },
            },
            pricing: {
              type: "object",
              properties: {
                baseRate: { type: "number", minimum: 0 },
                currency: { type: "string" },
                rateType: { type: "string", enum: ["hourly", "daily", "project", "custom"] },
                minimumCharge: { type: "number", minimum: 0 },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return serviceProviderController.updateServiceProvider(request as any, reply)
    },
  )

  // Delete service provider
  fastify.delete(
    "/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      return serviceProviderController.deleteServiceProvider(request as any, reply)
    },
  )
}

export default serviceProviderRoutes
