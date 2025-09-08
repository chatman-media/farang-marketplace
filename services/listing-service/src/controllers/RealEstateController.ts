import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { RealEstateService } from "../services/RealEstateService"
import {
  PropertyType,
  ListingPurpose,
  Furnishing,
  BuildingType,
  ViewType,
  Orientation,
  ListingCategory,
  Currency,
} from "@marketplace/shared-types"

// Validation schemas
const PropertyTypeSchema = z.nativeEnum(PropertyType)

const ListingPurposeSchema = z.nativeEnum(ListingPurpose)

const FurnishingSchema = z.nativeEnum(Furnishing)

const CreateRealEstateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  category: z.literal(ListingCategory.REAL_ESTATE),

  // Property details
  propertyType: PropertyTypeSchema,
  listingPurpose: ListingPurposeSchema,
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  area: z.number().min(1).max(10000),
  livingArea: z.number().min(1).max(10000).optional(),
  landArea: z.number().min(1).max(100000).optional(),
  floor: z.number().min(-5).max(200).optional(),
  totalFloors: z.number().min(1).max(200).optional(),

  // Building details
  buildingType: z.nativeEnum(BuildingType).optional(),
  buildingAge: z.number().min(0).max(200).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  yearRenovated: z.number().min(1800).max(new Date().getFullYear()).optional(),

  // Condition and furnishing
  furnishing: FurnishingSchema,
  condition: z.string().min(1).max(50),
  views: z.array(z.nativeEnum(ViewType)).default([]),
  orientation: z.nativeEnum(Orientation).optional(),
  balconies: z.number().min(0).max(10).default(0),
  terraces: z.number().min(0).max(10).default(0),

  // Pricing
  price: z.number().min(0),
  pricePerSqm: z.number().min(0).optional(),
  currency: z.enum(["USD", "EUR", "THB", "GBP", "JPY", "AUD", "CAD"]).default("THB"),
  priceType: z.enum(["fixed", "negotiable", "auction", "quote_on_request"]).default("fixed"),

  // Rental pricing
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
  yearlyRate: z.number().min(0).optional(),

  // Additional costs
  maintenanceFee: z.number().min(0).optional(),
  commonAreaFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),

  // Utilities
  electricityIncluded: z.boolean().default(false),
  waterIncluded: z.boolean().default(false),
  internetIncluded: z.boolean().default(false),
  cableIncluded: z.boolean().default(false),
  gasIncluded: z.boolean().default(false),

  // Parking
  parkingSpaces: z.number().min(0).max(20).default(0),
  parkingType: z.string().max(50).optional(),
  parkingFee: z.number().min(0).optional(),

  // Location
  location: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    region: z.string().min(1),
    country: z.string().min(1).default("Thailand"),
    postalCode: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),

  // Media
  images: z.array(z.string().url()).min(1).max(50),
  videos: z.array(z.string().url()).max(10).optional(),
  virtualTour: z.string().url().optional(),

  // Amenities (simplified for validation)
  amenities: z
    .object({
      hasSwimmingPool: z.boolean().default(false),
      hasFitnessCenter: z.boolean().default(false),
      hasElevator: z.boolean().default(false),
      hasSecurity: z.boolean().default(false),
      hasParking: z.boolean().default(false),
      hasAirConditioning: z.boolean().default(false),
      hasWifi: z.boolean().default(false),
      petsAllowed: z.boolean().default(false),
    })
    .optional(),

  // Rules (for short-term rentals)
  rules: z
    .object({
      maxGuests: z.number().min(1).max(50).optional(),
      checkInTime: z.string().optional(),
      checkOutTime: z.string().optional(),
      smokingAllowed: z.boolean().default(false),
      partiesAllowed: z.boolean().default(false),
      eventsAllowed: z.boolean().default(false),
      cancellationPolicy: z.enum(["flexible", "moderate", "strict"]).default("moderate"),
    })
    .optional(),
})

const UpdateRealEstateSchema = CreateRealEstateSchema.partial().extend({
  id: z.string().uuid(),
})

const SearchFiltersSchema = z.object({
  propertyType: z.array(PropertyTypeSchema).optional(),
  listingPurpose: z.array(ListingPurposeSchema).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  currency: z.enum(["USD", "EUR", "THB", "GBP", "JPY", "AUD", "CAD"]).optional(),
  minBedrooms: z.number().min(0).optional(),
  maxBedrooms: z.number().min(0).optional(),
  minBathrooms: z.number().min(0).optional(),
  maxBathrooms: z.number().min(0).optional(),
  minArea: z.number().min(0).optional(),
  maxArea: z.number().min(0).optional(),
  furnishing: z.array(FurnishingSchema).optional(),

  // Location
  city: z.string().optional(),
  district: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),

  // Amenities
  hasSwimmingPool: z.boolean().optional(),
  hasFitnessCenter: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),

  // Pagination and sorting
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(["price", "area", "bedrooms", "created_at", "updated_at"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export class RealEstateController {
  private realEstateService: RealEstateService

  constructor() {
    this.realEstateService = new RealEstateService()
  }

  // Create real estate listing
  createRealEstate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validatedData = CreateRealEstateSchema.parse(request.body)
      const ownerId = (request as any).user?.id

      if (!ownerId) {
        return reply.code(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const realEstate = await this.realEstateService.createRealEstate(ownerId, validatedData)

      return reply.code(201).send({
        success: true,
        data: realEstate,
        message: "Real estate listing created successfully",
      })
    } catch (error) {
      console.error("Create real estate error:", error)

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        })
      }

      return reply.code(500).send({
        success: false,
        message: "Failed to create real estate listing",
      })
    }
  }

  // Get real estate listing by ID
  getRealEstate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      const realEstate = await this.realEstateService.getRealEstateById(id)

      if (!realEstate) {
        return reply.code(404).send({
          success: false,
          message: "Real estate listing not found",
        })
      }

      return reply.send({
        success: true,
        data: realEstate,
      })
    } catch (error) {
      console.error("Get real estate error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve real estate listing",
      })
    }
  }

  // Search real estate listings
  searchRealEstate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const filters = SearchFiltersSchema.parse(request.query)

      const results = await this.realEstateService.searchRealEstate(filters)

      return reply.send({
        success: true,
        data: results.listings,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: results.total,
          hasMore: results.hasMore,
        },
      })
    } catch (error) {
      console.error("Search real estate error:", error)

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Invalid search parameters",
          errors: error.issues,
        })
      }

      return reply.code(500).send({
        success: false,
        message: "Failed to search real estate listings",
      })
    }
  }

  // Update real estate listing
  updateRealEstate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const validatedData = UpdateRealEstateSchema.parse({
        ...(request.body as object),
        id: (request.params as any).id,
      })
      const ownerId = (request as any).user?.id

      if (!ownerId) {
        return reply.code(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const realEstate = await this.realEstateService.updateRealEstate(validatedData.id, ownerId, validatedData)

      if (!realEstate) {
        return reply.code(404).send({
          success: false,
          message: "Real estate listing not found or access denied",
        })
      }

      return reply.send({
        success: true,
        data: realEstate,
        message: "Real estate listing updated successfully",
      })
    } catch (error) {
      console.error("Update real estate error:", error)

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        })
      }

      return reply.code(500).send({
        success: false,
        message: "Failed to update real estate listing",
      })
    }
  }

  // Delete real estate listing
  deleteRealEstate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }
      const ownerId = (request as any).user?.id

      if (!ownerId) {
        return reply.code(401).send({
          success: false,
          message: "Authentication required",
        })
      }

      const success = await this.realEstateService.deleteRealEstate(id, ownerId)

      if (!success) {
        return reply.code(404).send({
          success: false,
          message: "Real estate listing not found or access denied",
        })
      }

      return reply.send({
        success: true,
        message: "Real estate listing deleted successfully",
      })
    } catch (error) {
      console.error("Delete real estate error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to delete real estate listing",
      })
    }
  }
}
