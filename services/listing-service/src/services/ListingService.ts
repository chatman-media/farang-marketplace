import logger from "@marketplace/logger"
import type {
  CreateProductRequest,
  CreateVehicleRequest,
  ListingCategory,
  ListingType,
  ProductListing,
  ProductSearchFilters,
  VehicleListing,
  VehicleSearchFilters,
} from "@marketplace/shared-types"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import type { PgTransaction } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"
import { db } from "../db/connection.js"
import { listings, products, vehicles } from "../db/schema.js"

// Типы для инференции из схемы
type ListingSelect = typeof listings.$inferSelect
type ListingInsert = typeof listings.$inferInsert
type VehicleSelect = typeof vehicles.$inferSelect
type VehicleInsert = typeof vehicles.$inferInsert
type ProductSelect = typeof products.$inferSelect
type ProductInsert = typeof products.$inferInsert

export class ListingService {
  // Create vehicle listing
  async createVehicleListing(
    ownerId: string,
    vehicleData: CreateVehicleRequest,
    _tx?: PgTransaction<any, any, any>,
  ): Promise<VehicleListing> {
    const listingId = uuidv4()

    try {
      const result = await db.transaction(async (trx) => {
        // Create main listing
        const listingInsert: ListingInsert = {
          id: listingId,
          ownerId,
          title: `${vehicleData.specifications.make} ${vehicleData.specifications.model} ${vehicleData.specifications.year}`,
          description:
            vehicleData.notes || `${vehicleData.specifications.make} ${vehicleData.specifications.model} for rent`,
          category: "vehicles" as const,
          type: "rental" as const,
          status: "draft" as const,
          basePrice: vehicleData.pricing.basePrice.toString(),
          currency: vehicleData.pricing.currency,
          locationAddress: vehicleData.location.currentLocation,
          locationCity: vehicleData.location.currentLocation.split(",")[0] || "Bangkok",
          locationRegion: vehicleData.location.currentLocation.split(",")[1] || "Bangkok",
          locationCountry: "Thailand",
          locationLatitude: vehicleData.location.coordinates?.latitude?.toString(),
          locationLongitude: vehicleData.location.coordinates?.longitude?.toString(),
          images: vehicleData.images,
          tags: [vehicleData.type, vehicleData.category, vehicleData.specifications.make.toLowerCase()],
        }

        const [listing] = await trx.insert(listings).values(listingInsert).returning()

        // Create vehicle-specific data
        const vehicleInsert: VehicleInsert = {
          listingId,
          vehicleType: vehicleData.type,
          category: vehicleData.category,
          condition: vehicleData.condition,
          status: "available" as const,
          make: vehicleData.specifications.make,
          model: vehicleData.specifications.model,
          year: vehicleData.specifications.year,
          color: vehicleData.specifications.color,
          engineSize: vehicleData.specifications.engineSize || null,
          fuelType: vehicleData.specifications.fuelType,
          transmission: vehicleData.specifications.transmission,
          registrationNumber: vehicleData.documents.registrationNumber || null,
          seatingCapacity: vehicleData.specifications.seatingCapacity || 1,
          licensePlate: vehicleData.documents.licensePlate || "",
          securityDeposit: vehicleData.pricing.securityDeposit.toString(),
          currentLocation: vehicleData.location?.currentLocation || "Unknown",
          dailyRate: vehicleData.pricing.dailyRate?.toString(),
          weeklyRate: vehicleData.pricing.weeklyRate?.toString(),
          monthlyRate: vehicleData.pricing.monthlyRate?.toString(),
          deposit: vehicleData.pricing.securityDeposit.toString(),
        }

        const vehicleResult = await trx.insert(vehicles).values(vehicleInsert).returning()

        const vehicle = vehicleResult[0]
        return { listing, vehicle }
      })

      return this.mapToVehicleListing(result.listing, result.vehicle)
    } catch (error) {
      logger.error("Error creating vehicle listing:", error)
      throw new Error("Failed to create vehicle listing")
    }
  }

  // Create product listing
  async createProductListing(
    ownerId: string,
    productData: CreateProductRequest,
    tx?: PgTransaction<any, any, unknown>,
  ): Promise<ProductListing> {
    const listingId = uuidv4()

    try {
      const result = await db.transaction(async (trx) => {
        // Create main listing
        const listingInsert: ListingInsert = {
          id: listingId,
          ownerId,
          title: productData.title,
          description: productData.description,
          category: "products" as const,
          type: "rental" as const,
          status: "draft" as const,
          basePrice: productData.pricing.price.toString(),
          currency: productData.pricing.currency,
          locationAddress: productData.location.address,
          locationCity: productData.location.city,
          locationRegion: productData.location.region,
          locationCountry: productData.location.country,
          locationZipCode: productData.location.zipCode,
          locationLatitude: productData.location.coordinates?.latitude?.toString(),
          locationLongitude: productData.location.coordinates?.longitude?.toString(),
          images: productData.images,
          tags: productData.tags,
        }

        const [listing] = await trx.insert(listings).values(listingInsert).returning()

        // Create product-specific data
        const productInsert: ProductInsert = {
          listingId,
          productType: productData.type,
          condition: productData.condition,
          status: "active" as const,
          listingType: productData.listingType,
          brand: productData.specifications.brand,
          model: productData.specifications.model,
          sku: productData.specifications.sku,
          weight: productData.specifications.dimensions?.weight,
          material: productData.specifications.material,
          quantity: productData.availability.quantity,
          price: productData.pricing.price,
          priceType: productData.pricing.priceType || ("fixed" as const),
          sellerId: ownerId,
          sellerType: "individual" as const,
          sellerName: "Unknown",
        }

        const productResult = await trx.insert(products).values(productInsert).returning()

        const product = productResult[0]
        return { listing, product }
      })

      return this.mapToProductListing(result.listing, result.product)
    } catch (error) {
      logger.error("Error creating product listing:", error)
      throw new Error("Failed to create product listing")
    }
  }

  // Get vehicle listing by ID
  async getVehicleListingById(id: string): Promise<VehicleListing | null> {
    try {
      const result = await db
        .select()
        .from(listings)
        .leftJoin(vehicles, eq(listings.id, vehicles.listingId))
        .where(and(eq(listings.id, id), eq(listings.category, "vehicles")))
        .limit(1)

      if (!result[0] || !result[0].vehicles) {
        return null
      }

      return this.mapToVehicleListing(result[0].listings, result[0].vehicles)
    } catch (error) {
      logger.error("Error getting vehicle listing:", error)
      throw new Error("Failed to get vehicle listing")
    }
  }

  // Get product listing by ID
  async getProductListingById(id: string): Promise<ProductListing | null> {
    try {
      const result = await db
        .select()
        .from(listings)
        .leftJoin(products, eq(listings.id, products.listingId))
        .where(and(eq(listings.id, id), eq(listings.category, "products")))
        .limit(1)

      if (!result[0] || !result[0].products) {
        return null
      }

      return this.mapToProductListing(result[0].listings, result[0].products)
    } catch (error) {
      logger.error("Error getting product listing:", error)
      throw new Error("Failed to get product listing")
    }
  }

  // Helper method to safely parse decimal
  private parseDecimal(value: string | null | undefined): number {
    if (!value) return 0
    return Number.parseFloat(value)
  }

  // Helper method to map database result to VehicleListing
  private mapToVehicleListing(listing: ListingSelect, vehicle: VehicleSelect): VehicleListing {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: "vehicles" as ListingCategory.VEHICLES,
      type: "rental" as ListingType.RENTAL,
      price: {
        amount: this.parseDecimal(listing.basePrice),
        currency: listing.currency,
        period: "day",
      },
      location: {
        address: listing.locationAddress,
        city: listing.locationCity,
        region: listing.locationRegion,
        country: listing.locationCountry,
        latitude: this.parseDecimal(listing.locationLatitude),
        longitude: this.parseDecimal(listing.locationLongitude),
      },
      images: listing.images || [],
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      ownerId: listing.ownerId,
      rating: this.parseDecimal(listing.averageRating),
      reviewCount: listing.reviewCount || 0,
      isActive: listing.status === "active",
      isVerified: listing.isVerified,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      metadata: listing.metadata || {},
      vehicleType: vehicle.vehicleType,
      vehicle: {
        id: vehicle.id,
        ownerId: listing.ownerId,
        type: vehicle.vehicleType,
        category: vehicle.category,
        condition: vehicle.condition,
        status: vehicle.status,
        specifications: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          engineSize: vehicle.engineSize,
          power: vehicle.power,
          maxSpeed: vehicle.maxSpeed,
          fuelConsumption: vehicle.fuelConsumption ? this.parseDecimal(vehicle.fuelConsumption) : undefined,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          seatingCapacity: vehicle.seatingCapacity,
          doors: vehicle.doors,
          length: vehicle.length,
          width: vehicle.width,
          height: vehicle.height,
          weight: vehicle.weight,
          features: vehicle.features || [],
          safetyFeatures: vehicle.safetyFeatures || [],
          comfortFeatures: vehicle.comfortFeatures || [],
          technologyFeatures: vehicle.technologyFeatures || [],
        },
        documents: {
          licensePlate: vehicle.licensePlate,
          registrationNumber: vehicle.registrationNumber,
          engineNumber: vehicle.engineNumber,
          chassisNumber: vehicle.chassisNumber,
          insuranceNumber: vehicle.insuranceNumber,
          insuranceExpiry: vehicle.insuranceExpiry?.toISOString(),
          techInspectionExpiry: vehicle.techInspectionExpiry?.toISOString(),
          documentsComplete: vehicle.documentsComplete,
          documentsVerified: vehicle.documentsVerified,
          documentsNotes: vehicle.documentsNotes,
        },
        maintenance: {
          lastServiceDate: vehicle.lastServiceDate?.toISOString(),
          lastServiceKm: vehicle.lastServiceKm,
          nextServiceDue: vehicle.nextServiceDue?.toISOString(),
          nextServiceKm: vehicle.nextServiceKm,
          maintenanceNotes: vehicle.maintenanceNotes,
          gpsTrackerId: vehicle.gpsTrackerId,
          gpsProvider: vehicle.gpsProvider,
          hasCharger: vehicle.hasCharger,
          hasHelmet: vehicle.hasHelmet,
          hasLock: vehicle.hasLock,
          accessories: vehicle.accessories || [],
        },
        pricing: {
          basePrice: this.parseDecimal(listing.basePrice),
          currency: listing.currency,
          hourlyRate: vehicle.hourlyRate ? this.parseDecimal(vehicle.hourlyRate) : undefined,
          dailyRate: vehicle.dailyRate ? this.parseDecimal(vehicle.dailyRate) : undefined,
          weeklyRate: vehicle.weeklyRate ? this.parseDecimal(vehicle.weeklyRate) : undefined,
          monthlyRate: vehicle.monthlyRate ? this.parseDecimal(vehicle.monthlyRate) : undefined,
          yearlyRate: vehicle.yearlyRate ? this.parseDecimal(vehicle.yearlyRate) : undefined,
          securityDeposit: this.parseDecimal(vehicle.securityDeposit),
          insurancePerDay: vehicle.insurancePerDay ? this.parseDecimal(vehicle.insurancePerDay) : undefined,
          deliveryFee: vehicle.deliveryFee ? this.parseDecimal(vehicle.deliveryFee) : undefined,
          pickupFee: vehicle.pickupFee ? this.parseDecimal(vehicle.pickupFee) : undefined,
          lateFee: vehicle.lateFee ? this.parseDecimal(vehicle.lateFee) : undefined,
          damageFee: vehicle.damageFee ? this.parseDecimal(vehicle.damageFee) : undefined,
          fuelPolicy: vehicle.fuelPolicy,
          fuelCostPerLiter: vehicle.fuelCostPerLiter ? this.parseDecimal(vehicle.fuelCostPerLiter) : undefined,
          durationDiscounts: vehicle.durationDiscounts || {},
        },
        location: {
          currentLocation: vehicle.currentLocation,
          coordinates:
            listing.locationLatitude && listing.locationLongitude
              ? {
                  latitude: this.parseDecimal(listing.locationLatitude),
                  longitude: this.parseDecimal(listing.locationLongitude),
                }
              : undefined,
          pickupLocations: vehicle.pickupLocations || [],
          deliveryAvailable: vehicle.deliveryAvailable,
          deliveryRadius: vehicle.deliveryRadius,
          serviceAreas: vehicle.serviceAreas || [],
          restrictedAreas: vehicle.restrictedAreas || [],
        },
        images: listing.images || [],
        mainImage: listing.mainImage,
        isAvailable: vehicle.isAvailable,
        availableFrom: vehicle.availableFrom?.toISOString(),
        availableUntil: vehicle.availableUntil?.toISOString(),
        blackoutDates: vehicle.blackoutDates || [],
        isVerified: listing.isVerified,
        verificationDate: listing.verificationDate?.toISOString(),
        qualityScore: listing.qualityScore ? this.parseDecimal(listing.qualityScore) : undefined,
        totalRentals: vehicle.totalRentals,
        totalKilometers: vehicle.totalKilometers,
        averageRating: this.parseDecimal(listing.averageRating),
        reviewCount: listing.reviewCount || 0,
        createdAt: vehicle.createdAt.toISOString(),
        updatedAt: vehicle.updatedAt.toISOString(),
        lastMaintenanceUpdate: vehicle.lastMaintenanceUpdate?.toISOString(),
        metadata: vehicle.metadata || {},
        tags: listing.tags || [],
        notes: vehicle.notes,
      },
      rentalTerms: {
        minimumAge: 18, // Default value
        licenseRequired: true,
        depositRequired: true,
        insuranceIncluded: !!vehicle.insurancePerDay,
        fuelPolicy: vehicle.fuelPolicy,
        restrictions: [],
      },
    }
  }

  // Search vehicle listings
  async searchVehicleListings(filters: VehicleSearchFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit

      // Apply filters
      const conditions = [eq(listings.category, "vehicles"), eq(listings.status, "active")]

      if (filters.type?.length) {
        conditions.push(inArray(vehicles.vehicleType, filters.type))
      }

      if (filters.category?.length) {
        conditions.push(inArray(vehicles.category, filters.category))
      }

      if (filters.priceRange) {
        const priceField =
          filters.priceRange.period === "day"
            ? vehicles.dailyRate
            : filters.priceRange.period === "week"
              ? vehicles.weeklyRate
              : filters.priceRange.period === "month"
                ? vehicles.monthlyRate
                : vehicles.dailyRate

        if (filters.priceRange.min && priceField) {
          conditions.push(sql`${priceField}::numeric >= ${filters.priceRange.min}`)
        }
        if (filters.priceRange.max && priceField) {
          conditions.push(sql`${priceField}::numeric <= ${filters.priceRange.max}`)
        }
      }

      if (filters.location) {
        conditions.push(ilike(listings.locationCity, `%${filters.location}%`))
      }

      if (filters.verified !== undefined) {
        conditions.push(eq(listings.isVerified, filters.verified))
      }

      if (filters.rating && listings.averageRating) {
        conditions.push(sql`${listings.averageRating}::numeric >= ${filters.rating}`)
      }

      const results = await db
        .select()
        .from(listings)
        .leftJoin(vehicles, eq(listings.id, vehicles.listingId))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(listings.createdAt))

      const vehicleListings = results
        .filter((r): r is typeof r & { vehicles: NonNullable<typeof r.vehicles> } => !!r.vehicles)
        .map((r) => this.mapToVehicleListing(r.listings, r.vehicles))

      // Get total count
      const totalQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .leftJoin(vehicles, eq(listings.id, vehicles.listingId))
        .where(and(...conditions))

      const total = totalQuery[0]?.count || 0

      return {
        listings: vehicleListings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    } catch (error) {
      logger.error("Error searching vehicle listings:", error)
      throw new Error("Failed to search vehicle listings")
    }
  }

  // Search product listings
  async searchProductListings(filters: ProductSearchFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit
      const conditions = [eq(listings.category, "products"), eq(listings.status, "active")]

      if (filters.type?.length) {
        conditions.push(inArray(products.productType, filters.type))
      }

      if (filters.category?.length && products.subcategory) {
        conditions.push(inArray(products.subcategory, filters.category))
      }

      if (filters.condition?.length) {
        conditions.push(inArray(products.condition, filters.condition))
      }

      if (filters.listingType?.length) {
        conditions.push(inArray(products.listingType, filters.listingType))
      }

      if (filters.priceRange) {
        if (filters.priceRange.min) {
          conditions.push(sql`${products.price}::numeric >= ${filters.priceRange.min}`)
        }
        if (filters.priceRange.max) {
          conditions.push(sql`${products.price}::numeric <= ${filters.priceRange.max}`)
        }
      }

      if (filters.location?.city) {
        conditions.push(ilike(listings.locationCity, `%${filters.location.city}%`))
      }

      if (filters.availability?.inStock) {
        conditions.push(eq(products.isAvailable, true))
      }

      if (filters.seller?.verified !== undefined && products.isSellerVerified) {
        conditions.push(eq(products.isSellerVerified, filters.seller.verified))
      }

      const results = await db
        .select()
        .from(listings)
        .leftJoin(products, eq(listings.id, products.listingId))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(listings.createdAt))

      const productListings = results
        .filter((r): r is typeof r & { products: NonNullable<typeof r.products> } => !!r.products)
        .map((r) => this.mapToProductListing(r.listings, r.products))

      // Get total count
      const totalQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .leftJoin(products, eq(listings.id, products.listingId))
        .where(and(...conditions))

      const total = totalQuery[0]?.count || 0

      return {
        listings: productListings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    } catch (error) {
      logger.error("Error searching product listings:", error)
      throw new Error("Failed to search product listings")
    }
  }

  // Update listing status
  async updateListingStatus(id: string, status: string, ownerId?: string) {
    try {
      const conditions = [eq(listings.id, id)]
      if (ownerId) {
        conditions.push(eq(listings.ownerId, ownerId))
      }

      const [updated] = await db
        .update(listings)
        .set({
          status: status as ListingSelect["status"],
          updatedAt: new Date(),
          publishedAt: status === "active" ? new Date() : undefined,
        })
        .where(and(...conditions))
        .returning()

      return updated
    } catch (error) {
      logger.error("Error updating listing status:", error)
      throw new Error("Failed to update listing status")
    }
  }

  // Delete listing
  async deleteListing(id: string, ownerId?: string) {
    try {
      const conditions = [eq(listings.id, id)]
      if (ownerId) {
        conditions.push(eq(listings.ownerId, ownerId))
      }

      const [deleted] = await db
        .delete(listings)
        .where(and(...conditions))
        .returning()

      return deleted
    } catch (error) {
      logger.error("Error deleting listing:", error)
      throw new Error("Failed to delete listing")
    }
  }

  // Helper method to map database result to ProductListing
  private mapToProductListing(listing: ListingSelect, product: ProductSelect): ProductListing {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: "products" as ListingCategory.PRODUCTS,
      type: "rental" as ListingType.RENTAL,
      price: {
        amount: this.parseDecimal(listing.basePrice),
        currency: listing.currency,
      },
      location: {
        address: listing.locationAddress,
        city: listing.locationCity,
        region: listing.locationRegion,
        country: listing.locationCountry,
        latitude: this.parseDecimal(listing.locationLatitude),
        longitude: this.parseDecimal(listing.locationLongitude),
      },
      images: listing.images || [],
      ownerId: listing.ownerId,
      rating: this.parseDecimal(listing.averageRating),
      reviewCount: listing.reviewCount || 0,
      isActive: listing.status === "active",
      isVerified: listing.isVerified,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      metadata: listing.metadata || {},
      productType: product.productType,
      product: {
        id: product.id,
        title: listing.title,
        description: listing.description,
        type: product.productType,
        category: product.productType, // Using productType as category
        subcategory: product.subcategory,
        condition: product.condition,
        status: product.status,
        listingType: product.listingType,
        specifications: {
          brand: product.brand,
          model: product.model,
          serialNumber: product.serialNumber,
          manufacturingYear: product.manufacturingYear,
          countryOfOrigin: product.countryOfOrigin,
          dimensions: {
            length: product.length,
            width: product.width,
            height: product.height,
            weight: product.weight,
            volume: product.volume,
          },
          material: product.material,
          size: product.size,
          technicalSpecs: product.technicalSpecs || {},
          features: product.features || [],
          included: product.included || [],
          requirements: product.requirements || [],
          conditionNotes: product.conditionNotes,
          defects: product.defects || [],
          repairs: product.repairs || [],
          warrantyPeriod: product.warrantyPeriod,
          warrantyType: product.warrantyType,
          supportAvailable: product.supportAvailable,
          manualIncluded: product.manualIncluded,
        },
        pricing: {
          price: this.parseDecimal(product.price.toString()),
          currency: listing.currency,
          priceType: product.priceType,
          originalPrice: product.originalPrice ? this.parseDecimal(product.originalPrice) : undefined,
          msrp: product.msrp ? this.parseDecimal(product.msrp) : undefined,
          rentalPricing: product.rentalPricing,
          shippingCost: product.shippingCost ? this.parseDecimal(product.shippingCost) : undefined,
          handlingFee: product.handlingFee ? this.parseDecimal(product.handlingFee) : undefined,
          installationFee: product.installationFee ? this.parseDecimal(product.installationFee) : undefined,
          acceptedPayments: product.acceptedPayments || [],
          installmentAvailable: product.installmentAvailable,
          installmentOptions: product.installmentOptions || [],
        },
        availability: {
          isAvailable: product.isAvailable,
          quantity: product.quantity,
          quantityType: product.quantityType,
          stockLevel: product.stockLevel,
          restockDate: product.restockDate?.toISOString(),
          availableFrom: product.availableFrom?.toISOString(),
          availableUntil: product.availableUntil?.toISOString(),
          blackoutDates: product.blackoutDates || [],
          availableLocations: product.availableLocations || [],
          pickupLocations: product.pickupLocations || [],
          deliveryAvailable: product.deliveryAvailable,
          deliveryAreas: product.deliveryAreas || [],
          deliveryTime: product.deliveryTime,
        },
        seller: {
          sellerId: product.sellerId,
          sellerType: product.sellerType,
          sellerName: product.sellerName,
          sellerRating: product.sellerRating ? this.parseDecimal(product.sellerRating) : undefined,
          sellerReviews: product.sellerReviews,
          isVerified: product.isSellerVerified,
          businessLicense: product.businessLicense,
          taxId: product.taxId,
          contactInfo: {
            phone: product.contactPhone,
            email: product.contactEmail,
            website: product.contactWebsite,
            address: product.contactAddress,
            socialMedia: product.socialMedia || {},
          },
          businessHours: product.businessHours,
          languages: product.languages || [],
          responseTime: product.responseTime,
          returnPolicy: product.returnPolicy,
          warrantyPolicy: product.warrantyPolicy,
          shippingPolicy: product.shippingPolicy,
        },
        location: {
          address: listing.locationAddress,
          city: listing.locationCity,
          region: listing.locationRegion,
          country: listing.locationCountry,
          coordinates:
            listing.locationLatitude && listing.locationLongitude
              ? {
                  latitude: this.parseDecimal(listing.locationLatitude),
                  longitude: this.parseDecimal(listing.locationLongitude),
                }
              : undefined,
          zipCode: listing.locationZipCode,
        },
        tags: listing.tags || [],
        isVerified: listing.isVerified,
        verificationDate: listing.verificationDate?.toISOString(),
        qualityScore: listing.qualityScore ? this.parseDecimal(listing.qualityScore) : undefined,
        trustScore: listing.trustScore ? this.parseDecimal(listing.trustScore) : undefined,
        views: listing.views,
        favorites: listing.favorites,
        inquiries: listing.inquiries,
        averageRating: this.parseDecimal(listing.averageRating),
        reviewCount: listing.reviewCount || 0,
        moderationStatus: listing.moderationStatus,
        moderationNotes: listing.moderationNotes,
        flagReasons: listing.flagReasons || [],
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        publishedAt: listing.publishedAt?.toISOString(),
        expiresAt: listing.expiresAt?.toISOString(),
        metadata: product.metadata || {},
        customFields: product.customFields || {},
        images: listing.images || [],
        mainImage: listing.mainImage,
        documents: product.documents || [],
        analytics: {
          impressions: listing.views,
          clicks: listing.inquiries,
          conversions: 0, // TODO: Calculate from bookings
        },
      },
      shippingOptions: {
        localDelivery: product.deliveryAvailable,
        nationalShipping: (product.deliveryAreas || []).length > 1,
        pickupAvailable: (product.pickupLocations || []).length > 0,
        shippingCost: product.shippingCost ? this.parseDecimal(product.shippingCost) : undefined,
      },
    }
  }
}
