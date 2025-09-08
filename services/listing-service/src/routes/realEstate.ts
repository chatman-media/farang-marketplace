import { FastifyInstance } from "fastify"
import { RealEstateController } from "../controllers/RealEstateController"

export default async function realEstateRoutes(fastify: FastifyInstance) {
  const realEstateController = new RealEstateController()

  // Real Estate CRUD operations
  fastify.post(
    "/real-estate",
    {
      schema: {
        description: "Create a new real estate listing",
        tags: ["Real Estate"],
        summary: "Create real estate listing",
        body: {
          type: "object",
          required: [
            "title",
            "description",
            "propertyType",
            "listingPurpose",
            "bedrooms",
            "bathrooms",
            "area",
            "furnishing",
            "condition",
            "price",
            "currency",
            "location",
            "images",
          ],
          properties: {
            title: { type: "string", minLength: 5, maxLength: 200 },
            description: { type: "string", minLength: 20, maxLength: 2000 },
            propertyType: {
              type: "string",
              enum: [
                "condo",
                "apartment",
                "house",
                "villa",
                "townhouse",
                "studio",
                "penthouse",
                "duplex",
                "loft",
                "commercial",
                "office",
                "retail",
                "warehouse",
                "land",
                "building",
              ],
            },
            listingPurpose: {
              type: "string",
              enum: ["rent", "sale", "short_term_rental", "long_term_rental", "both"],
            },
            bedrooms: { type: "number", minimum: 0, maximum: 20 },
            bathrooms: { type: "number", minimum: 0, maximum: 20 },
            area: { type: "number", minimum: 1, maximum: 10000 },
            livingArea: { type: "number", minimum: 1, maximum: 10000 },
            landArea: { type: "number", minimum: 1, maximum: 100000 },
            floor: { type: "number", minimum: -5, maximum: 200 },
            totalFloors: { type: "number", minimum: 1, maximum: 200 },
            buildingType: {
              type: "string",
              enum: ["low_rise", "mid_rise", "high_rise", "detached", "semi_detached", "terraced", "cluster"],
            },
            buildingAge: { type: "number", minimum: 0, maximum: 200 },
            yearBuilt: { type: "number", minimum: 1800, maximum: new Date().getFullYear() },
            yearRenovated: { type: "number", minimum: 1800, maximum: new Date().getFullYear() },
            furnishing: {
              type: "string",
              enum: ["unfurnished", "partially_furnished", "fully_furnished", "luxury_furnished"],
            },
            condition: { type: "string", minLength: 1, maxLength: 50 },
            views: {
              type: "array",
              items: {
                type: "string",
                enum: ["city", "sea", "mountain", "garden", "pool", "river", "park", "golf", "no_view"],
              },
            },
            orientation: {
              type: "string",
              enum: ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"],
            },
            balconies: { type: "number", minimum: 0, maximum: 10 },
            terraces: { type: "number", minimum: 0, maximum: 10 },
            price: { type: "number", minimum: 0 },
            pricePerSqm: { type: "number", minimum: 0 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            priceType: {
              type: "string",
              enum: ["fixed", "negotiable", "auction", "quote_on_request"],
            },
            dailyRate: { type: "number", minimum: 0 },
            weeklyRate: { type: "number", minimum: 0 },
            monthlyRate: { type: "number", minimum: 0 },
            yearlyRate: { type: "number", minimum: 0 },
            maintenanceFee: { type: "number", minimum: 0 },
            commonAreaFee: { type: "number", minimum: 0 },
            securityDeposit: { type: "number", minimum: 0 },
            cleaningFee: { type: "number", minimum: 0 },
            electricityIncluded: { type: "boolean" },
            waterIncluded: { type: "boolean" },
            internetIncluded: { type: "boolean" },
            cableIncluded: { type: "boolean" },
            gasIncluded: { type: "boolean" },
            parkingSpaces: { type: "number", minimum: 0, maximum: 20 },
            parkingType: { type: "string", maxLength: 50 },
            parkingFee: { type: "number", minimum: 0 },
            location: {
              type: "object",
              required: ["address", "city", "region", "country"],
              properties: {
                address: { type: "string", minLength: 1 },
                city: { type: "string", minLength: 1 },
                region: { type: "string", minLength: 1 },
                country: { type: "string", minLength: 1 },
                zipCode: { type: "string" },
                latitude: { type: "number", minimum: -90, maximum: 90 },
                longitude: { type: "number", minimum: -180, maximum: 180 },
              },
            },
            images: {
              type: "array",
              minItems: 1,
              maxItems: 50,
              items: { type: "string", format: "uri" },
            },
            videos: {
              type: "array",
              maxItems: 10,
              items: { type: "string", format: "uri" },
            },
            virtualTour: { type: "string", format: "uri" },
            amenities: {
              type: "object",
              properties: {
                hasSwimmingPool: { type: "boolean" },
                hasFitnessCenter: { type: "boolean" },
                hasElevator: { type: "boolean" },
                hasSecurity: { type: "boolean" },
                hasParking: { type: "boolean" },
                hasAirConditioning: { type: "boolean" },
                hasWifi: { type: "boolean" },
                petsAllowed: { type: "boolean" },
              },
            },
            rules: {
              type: "object",
              properties: {
                maxGuests: { type: "number", minimum: 1, maximum: 50 },
                checkInTime: { type: "string" },
                checkOutTime: { type: "string" },
                smokingAllowed: { type: "boolean" },
                partiesAllowed: { type: "boolean" },
                eventsAllowed: { type: "boolean" },
                cancellationPolicy: {
                  type: "string",
                  enum: ["flexible", "moderate", "strict"],
                },
              },
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              errors: { type: "array" },
            },
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    realEstateController.createRealEstate,
  )

  fastify.get(
    "/real-estate/:id",
    {
      schema: {
        description: "Get a real estate listing by ID",
        tags: ["Real Estate"],
        summary: "Get real estate listing",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    realEstateController.getRealEstate,
  )

  fastify.get(
    "/real-estate",
    {
      schema: {
        description: "Search real estate listings with filters",
        tags: ["Real Estate"],
        summary: "Search real estate listings",
        querystring: {
          type: "object",
          properties: {
            propertyType: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "condo",
                  "apartment",
                  "house",
                  "villa",
                  "townhouse",
                  "studio",
                  "penthouse",
                  "duplex",
                  "loft",
                  "commercial",
                  "office",
                  "retail",
                  "warehouse",
                  "land",
                  "building",
                ],
              },
            },
            listingPurpose: {
              type: "array",
              items: {
                type: "string",
                enum: ["rent", "sale", "short_term_rental", "long_term_rental", "both"],
              },
            },
            minPrice: { type: "number", minimum: 0 },
            maxPrice: { type: "number", minimum: 0 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            minBedrooms: { type: "number", minimum: 0 },
            maxBedrooms: { type: "number", minimum: 0 },
            minBathrooms: { type: "number", minimum: 0 },
            maxBathrooms: { type: "number", minimum: 0 },
            minArea: { type: "number", minimum: 0 },
            maxArea: { type: "number", minimum: 0 },
            furnishing: {
              type: "array",
              items: {
                type: "string",
                enum: ["unfurnished", "partially_furnished", "fully_furnished", "luxury_furnished"],
              },
            },
            city: { type: "string" },
            district: { type: "string" },
            region: { type: "string" },
            country: { type: "string" },
            hasSwimmingPool: { type: "boolean" },
            hasFitnessCenter: { type: "boolean" },
            hasParking: { type: "boolean" },
            hasElevator: { type: "boolean" },
            hasAirConditioning: { type: "boolean" },
            hasWifi: { type: "boolean" },
            petsAllowed: { type: "boolean" },
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            sortBy: {
              type: "string",
              enum: ["price", "area", "bedrooms", "created_at", "updated_at"],
              default: "created_at",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  hasMore: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    realEstateController.searchRealEstate,
  )

  fastify.put(
    "/real-estate/:id",
    {
      schema: {
        description: "Update a real estate listing",
        tags: ["Real Estate"],
        summary: "Update real estate listing",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        // Body schema similar to create but all fields optional
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    realEstateController.updateRealEstate,
  )

  fastify.delete(
    "/real-estate/:id",
    {
      schema: {
        description: "Delete a real estate listing",
        tags: ["Real Estate"],
        summary: "Delete real estate listing",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    realEstateController.deleteRealEstate,
  )
}
