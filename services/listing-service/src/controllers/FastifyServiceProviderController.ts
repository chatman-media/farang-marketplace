import { FastifyRequest, FastifyReply } from "fastify"
import { ServiceProviderService } from "../services/ServiceProviderService"
import type { ServiceProviderFilters } from "@marketplace/shared-types"
import { z } from "zod"

// Zod validation schemas
const ServiceSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("THB"),
  priceType: z.enum(["fixed", "hourly", "daily", "project"]).default("fixed"),
  minimumCharge: z.number().min(0).optional(),
  availability: z
    .object({
      daysOfWeek: z.array(z.number().min(0).max(6)),
      timeSlots: z.array(
        z.object({
          start: z.string(),
          end: z.string(),
        }),
      ),
      timezone: z.string(),
    })
    .optional(),
  serviceArea: z
    .object({
      radius: z.number().min(0),
      locations: z.array(z.string()),
    })
    .optional(),
})

const ContactInfoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional(),
})

const LocationSchema = z.object({
  address: z.string().min(10).max(200),
  city: z.string().min(2).max(50),
  region: z.string().min(2).max(50),
  country: z.string().min(2).max(50),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  postalCode: z.string().optional(),
})

const CreateServiceProviderSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.enum(["individual", "company", "agency", "freelancer"]),
  description: z.string().min(20).max(1000),
  services: z.array(ServiceSchema).min(1),
  contactInfo: ContactInfoSchema,
  location: LocationSchema,
  languages: z.array(z.string()).optional(),
  settings: z
    .object({
      autoAcceptBookings: z.boolean().optional(),
      instantBooking: z.boolean().optional(),
      requireDeposit: z.boolean().optional(),
      cancellationPolicy: z.string().optional(),
      refundPolicy: z.string().optional(),
    })
    .optional(),
  images: z.array(z.string()).optional(),
})

const UpdateServiceProviderSchema = CreateServiceProviderSchema.partial()

const SearchQuerySchema = z.object({
  query: z.string().optional(),
  businessType: z.enum(["individual", "company", "agency", "freelancer"]).optional(),
  category: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      radius: z.number().min(1).max(100).optional(),
    })
    .optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  rating: z.number().min(1).max(5).optional(),
  availability: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(["rating", "price", "distance", "created_at"]).default("rating"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// Authenticated request interface
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

export class FastifyServiceProviderController {
  private serviceProviderService: ServiceProviderService

  constructor() {
    this.serviceProviderService = new ServiceProviderService()
  }

  // Create service provider
  createServiceProvider = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validatedData = CreateServiceProviderSchema.parse(request.body)

      if (!request.user) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const serviceProviderData = {
        ...validatedData,
        ownerId: request.user.id,
        userId: request.user.id,
        providerType: validatedData.businessType === "individual" ? ("individual" as const) : ("company" as const),
        businessName: validatedData.businessName || `${request.user.email} Service Provider`,
        serviceCapabilities: validatedData.services.map((service) => service.category),
        primaryLocation: {
          address: validatedData.location.address,
          city: validatedData.location.city,
          province: validatedData.location.region,
          country: validatedData.location.country,
          postalCode: validatedData.location.postalCode,
          coordinates:
            validatedData.location.latitude && validatedData.location.longitude
              ? {
                  lat: validatedData.location.latitude,
                  lng: validatedData.location.longitude,
                }
              : undefined,
        },
        contactInfo: validatedData.contactInfo,
        pricing: validatedData.services[0]
          ? {
              baseRate: validatedData.services[0].price,
              currency: validatedData.services[0].currency || "THB",
              rateType: validatedData.services[0].priceType || "project",
              minimumCharge: validatedData.services[0].minimumCharge,
            }
          : undefined,
      }

      const serviceProvider = await this.serviceProviderService.createServiceProvider(serviceProviderData)

      return reply.status(201).send({
        success: true,
        data: serviceProvider,
        message: "Service provider created successfully",
      })
    } catch (error) {
      console.error("Create service provider error:", error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        })
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to create service provider",
      })
    }
  }

  // Get service provider by ID
  getServiceProvider = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params

      const serviceProvider = await this.serviceProviderService.getServiceProviderById(id)

      if (!serviceProvider) {
        return reply.status(404).send({
          success: false,
          message: "Service provider not found",
        })
      }

      return reply.send({
        success: true,
        data: serviceProvider,
        message: "Service provider retrieved successfully",
      })
    } catch (error) {
      console.error("Get service provider error:", error)
      return reply.status(500).send({
        success: false,
        message: "Failed to retrieve service provider",
      })
    }
  }

  // Search service providers
  searchServiceProviders = async (
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const validatedQuery = SearchQuerySchema.parse(request.query)

      const filters: ServiceProviderFilters = {
        query: validatedQuery.query,
        serviceCapabilities: validatedQuery.category ? [validatedQuery.category] : undefined,
        location: validatedQuery.location,
        priceRange: validatedQuery.priceRange
          ? {
              min: validatedQuery.priceRange.min || 0,
              max: validatedQuery.priceRange.max || 999999,
              currency: "THB",
            }
          : undefined,
        verificationLevel: "basic",
        availability: validatedQuery.availability,
      }

      const result = await this.serviceProviderService.searchServiceProviders(
        filters,
        validatedQuery.page,
        validatedQuery.limit,
      )

      return reply.send({
        success: true,
        data: result.providers,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validatedQuery.limit),
        },
        message: "Service providers retrieved successfully",
      })
    } catch (error) {
      console.error("Search service providers error:", error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        })
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to search service providers",
      })
    }
  }

  // Update service provider
  updateServiceProvider = async (
    request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params
      const validatedData = UpdateServiceProviderSchema.parse(request.body)

      if (!request.user) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const updateData: any = {}

      if (validatedData.businessName) updateData.businessName = validatedData.businessName
      if (validatedData.description) updateData.description = validatedData.description
      if (validatedData.services) {
        updateData.serviceCapabilities = validatedData.services.map((service) => service.category)
      }
      if (validatedData.location) {
        updateData.primaryLocation = {
          address: validatedData.location.address,
          city: validatedData.location.city,
          province: validatedData.location.region,
          country: validatedData.location.country,
          postalCode: validatedData.location.postalCode,
          coordinates:
            validatedData.location.latitude && validatedData.location.longitude
              ? {
                  lat: validatedData.location.latitude,
                  lng: validatedData.location.longitude,
                }
              : undefined,
        }
      }
      if (validatedData.contactInfo) updateData.contactInfo = validatedData.contactInfo
      if (validatedData.services && validatedData.services[0]) {
        updateData.pricing = {
          baseRate: validatedData.services[0].price,
          currency: validatedData.services[0].currency || "THB",
          rateType: validatedData.services[0].priceType || "project",
          minimumCharge: validatedData.services[0].minimumCharge,
        }
      }

      const serviceProvider = await this.serviceProviderService.updateServiceProvider(id, updateData, request.user.id)

      if (!serviceProvider) {
        return reply.status(404).send({
          success: false,
          message: "Service provider not found or access denied",
        })
      }

      return reply.send({
        success: true,
        data: serviceProvider,
        message: "Service provider updated successfully",
      })
    } catch (error) {
      console.error("Update service provider error:", error)

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        })
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to update service provider",
      })
    }
  }

  // Delete service provider
  deleteServiceProvider = async (
    request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params

      if (!request.user) {
        return reply.status(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const success = await this.serviceProviderService.deleteServiceProvider(id, request.user.id)

      if (!success) {
        return reply.status(404).send({
          success: false,
          message: "Service provider not found or access denied",
        })
      }

      return reply.send({
        success: true,
        message: "Service provider deleted successfully",
      })
    } catch (error) {
      console.error("Delete service provider error:", error)
      return reply.status(500).send({
        success: false,
        message: "Failed to delete service provider",
      })
    }
  }
}
