import logger from "@marketplace/logger"
import {
  CreateProductRequest,
  CreateVehicleRequest,
  FuelType,
  ListingCategory,
  ListingStatus,
  ListingType,
  PriceType,
  ProductCondition,
  ProductListing,
  ProductListingType,
  ProductSearchFilters,
  ProductStatus,
  ProductType,
  TransmissionType,
  VehicleCategory,
  VehicleListing,
  VehicleSearchFilters,
  VehicleStatus,
  VehicleType,
} from "@marketplace/shared-types"
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"
import type { PgTransaction } from "drizzle-orm/pg-core"
import { v4 as uuidv4 } from "uuid"

import { db } from "../db/connection.js"
import { listings, products, vehicles } from "../db/schema.js"

type ListingSelect = typeof listings.$inferSelect
type ListingInsert = typeof listings.$inferInsert
type VehicleSelect = typeof vehicles.$inferSelect
type VehicleInsert = typeof vehicles.$inferInsert
type ProductSelect = typeof products.$inferSelect
type ProductInsert = typeof products.$inferInsert

export class ListingService {
  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value
  }

  async createVehicleListing(
    ownerId: string,
    vehicleData: CreateVehicleRequest,
    _tx?: PgTransaction<any>,
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
          category: ListingCategory.VEHICLES,
          type: ListingType.RENTAL,
          status: ListingStatus.DRAFT,
          basePrice: vehicleData.pricing.basePrice.toString(),
          currency: vehicleData.pricing.currency,
          locationAddress: vehicleData.location.address,
          locationCity: vehicleData.location.city,
          locationRegion: vehicleData.location.city, // Using city as fallback for region
          locationCountry: vehicleData.location.country,
          locationLatitude: vehicleData.location.coordinates?.latitude?.toString(),
          locationLongitude: vehicleData.location.coordinates?.longitude?.toString(),
          images: vehicleData.images,
          tags: [vehicleData.specifications.make.toLowerCase(), vehicleData.specifications.model.toLowerCase()],
        }

        const [listing] = await trx.insert(listings).values(listingInsert).returning()

        // Create vehicle-specific data
        const vehicleInsert: VehicleInsert = {
          listingId,
          vehicleType: vehicleData.specifications.vehicleType.toLowerCase() as VehicleType,
          category: vehicleData.specifications.category.toLowerCase() as any,
          condition: "good" as any,
          status: VehicleStatus.AVAILABLE,
          make: vehicleData.specifications.make,
          model: vehicleData.specifications.model,
          year: vehicleData.specifications.year,
          color: vehicleData.specifications.color,
          engineSize: vehicleData.specifications.engineSize || null,
          fuelType: vehicleData.specifications.fuelType,
          transmission: vehicleData.specifications.transmission,
          seatingCapacity: vehicleData.specifications.seatingCapacity || 1,
          licensePlate: vehicleData.documents?.licensePlate || "",
          securityDeposit: vehicleData.pricing.securityDeposit.toString(),
          currentLocation: vehicleData.location.address,
          dailyRate: vehicleData.pricing.dailyRate?.toString() || null,
          weeklyRate: vehicleData.pricing.weeklyRate?.toString() || null,
          monthlyRate: vehicleData.pricing.monthlyRate?.toString() || null,
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

  async createProductListing(
    ownerId: string,
    productData: CreateProductRequest,
    _tx?: PgTransaction<any>,
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
          category: ListingCategory.PRODUCTS,
          type: ListingType.RENTAL,
          status: ListingStatus.DRAFT,
          basePrice: (productData.pricing?.basePrice || 0).toString(),
          locationAddress: productData.location.address,
          locationCity: productData.location.city,
          locationRegion: productData.location.region,
          locationCountry: productData.location.country,
          locationLatitude: productData.location.coordinates?.latitude?.toString(),
          locationLongitude: productData.location.coordinates?.longitude?.toString(),
          images: productData.images,
          tags: [productData.productType.toLowerCase()],
        }

        const [listing] = await trx.insert(listings).values(listingInsert).returning()

        // Create product-specific data
        const productInsert: ProductInsert = {
          listingId,
          productType: productData.productType.toLowerCase() as any,
          condition: productData.condition,
          status: "active" as any,
          brand: productData.specifications.brand || null,
          model: productData.specifications.model || null,
          weight: productData.specifications.weight || null,
          listingType: "sale" as any,
          price: (productData.pricing?.basePrice || 0).toString(),
          priceType: "fixed" as any,
          sellerId: "temp-seller",
          sellerType: "individual",
          sellerName: "Temp Seller",
          // notes: productData.notes || null, // Property doesn't exist
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

  async getVehicleListingById(id: string): Promise<VehicleListing | null> {
    try {
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, id),
      })

      if (!listing) return null

      const vehicle = await db.query.vehicles.findFirst({
        where: eq(vehicles.listingId, id),
      })

      if (!vehicle) return null

      return this.mapToVehicleListing(listing, vehicle)
    } catch (error) {
      logger.error("Error fetching vehicle listing:", error)
      throw new Error("Failed to fetch vehicle listing")
    }
  }

  async getProductListingById(id: string): Promise<ProductListing | null> {
    try {
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, id),
      })

      if (!listing) return null

      const product = await db.query.products.findFirst({
        where: eq(products.listingId, id),
      })

      if (!product) return null

      return this.mapToProductListing(listing, product)
    } catch (error) {
      logger.error("Error fetching product listing:", error)
      throw new Error("Failed to fetch product listing")
    }
  }

  private parseDecimal(value: string | null): number | undefined {
    if (!value) return undefined
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? undefined : parsed
  }

  private mapToVehicleListing(listing: ListingSelect, vehicle: VehicleSelect): VehicleListing {
    return {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      category: ListingCategory.VEHICLES,
      type: listing.type as ListingType,
      vehicleType: vehicle.vehicleType as VehicleType,
      isVerified: false,
      reviewCount: 0,
      price: { amount: Number.parseFloat(listing.basePrice), currency: "THB" } as any,
      location: { city: listing.locationCity, address: listing.locationAddress } as any,
      availability: "available" as any,
      rating: 0,
      isActive: true,
      // status: listing.status, // Property doesn't exist on ProductListing type
      vehicle: {
        id: vehicle.listingId,
        ownerId: listing.ownerId,
        type: vehicle.vehicleType as VehicleType,
        category: "economy" as any,
        condition: "good" as any,
        status: vehicle.status as VehicleStatus,
        specifications: {
          vehicleType: vehicle.vehicleType as VehicleType,
          category: vehicle.category as VehicleCategory,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          engineSize: this.nullToUndefined(vehicle.engineSize),
          fuelType: vehicle.fuelType as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          seatingCapacity: vehicle.seatingCapacity,
          features: [],
          safetyFeatures: [],
          comfortFeatures: [],
          technologyFeatures: [],
        },
        documents: {
          licensePlate: vehicle.licensePlate || "",
          documentsComplete: false,
          documentsVerified: false,
        },
        maintenance: {
          additionalComponents: {},
        },
        pricing: {
          basePrice: Number.parseFloat(listing.basePrice),
          currency: listing.currency,
          dailyRate: this.parseDecimal(vehicle.dailyRate),
          weeklyRate: this.parseDecimal(vehicle.weeklyRate),
          monthlyRate: this.parseDecimal(vehicle.monthlyRate),
          securityDeposit: this.parseDecimal(vehicle.deposit) || 0,
          fuelPolicy: "full_to_full",
        },
        location: {
          currentLocation: listing.locationAddress || listing.locationCity,
          address: listing.locationAddress,
          city: listing.locationCity,
          province: listing.locationCity,
          country: listing.locationCountry,
          coordinates:
            listing.locationLatitude && listing.locationLongitude
              ? {
                  latitude: Number.parseFloat(listing.locationLatitude),
                  longitude: Number.parseFloat(listing.locationLongitude),
                }
              : undefined,
          pickupLocations: [],
          deliveryAvailable: false,
          serviceAreas: [],
        },
        images: listing.images || [],
        isAvailable: true,
        isVerified: false,
        totalRentals: 0,
        totalKilometers: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
      },
      images: listing.images || [],
      // tags: listing.tags || [], // Property doesn't exist on VehicleListing
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }
  }

  async searchVehicleListings(filters: VehicleSearchFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit

      const conditions = [eq(listings.category, ListingCategory.VEHICLES), eq(listings.status, ListingStatus.ACTIVE)]

      // Vehicle type filter
      if (filters.type?.length) {
        const vehicleTypes = filters.type.map((t) => t.toLowerCase() as VehicleSelect["vehicleType"])
        conditions.push(inArray(vehicles.vehicleType, vehicleTypes))
      }

      // Vehicle category filter
      if (filters.category?.length) {
        const categories = filters.category.map((c) => c.toLowerCase() as VehicleSelect["category"])
        conditions.push(inArray(vehicles.category, categories))
      }

      // Fuel type filter
      if (filters.fuelType?.length) {
        const fuelTypes = filters.fuelType.map((f) => f as VehicleSelect["fuelType"])
        conditions.push(inArray(vehicles.fuelType, fuelTypes))
      }

      // Transmission filter
      if (filters.transmission?.length) {
        const transmissions = filters.transmission.map((t) => t as VehicleSelect["transmission"])
        conditions.push(inArray(vehicles.transmission, transmissions))
      }

      // Seating capacity (minimum)
      if (typeof filters.seatingCapacity === "number") {
        conditions.push(sql`${vehicles.seatingCapacity} >= ${filters.seatingCapacity}`)
      }

      // Year range
      if (filters.yearRange) {
        if (typeof filters.yearRange.min === "number") {
          conditions.push(sql`${vehicles.year} >= ${filters.yearRange.min}`)
        }
        if (typeof filters.yearRange.max === "number") {
          conditions.push(sql`${vehicles.year} <= ${filters.yearRange.max}`)
        }
      }

      // Price range (from listing base price)
      if (filters.priceRange) {
        if (typeof filters.priceRange.min === "number") {
          conditions.push(sql`CAST(${listings.basePrice} AS DECIMAL) >= ${filters.priceRange.min}`)
        }
        if (typeof filters.priceRange.max === "number") {
          conditions.push(sql`CAST(${listings.basePrice} AS DECIMAL) <= ${filters.priceRange.max}`)
        }
      }

      // Location filter (city/region)
      if (filters.location) {
        conditions.push(
          sql`(
            ${ilike(listings.locationCity, `%${filters.location}%`)} OR
            ${ilike(listings.locationAddress, `%${filters.location}%`)}
          )`,
        )
      }

      // Verified listing filter
      if (typeof filters.verified === "boolean") {
        conditions.push(eq(listings.isVerified, filters.verified))
      }

      // Minimum rating filter
      if (typeof filters.rating === "number") {
        conditions.push(sql`CAST(${listings.averageRating} AS DECIMAL) >= ${filters.rating}`)
      }

      const query = db
        .select()
        .from(listings)
        .innerJoin(vehicles, eq(listings.id, vehicles.listingId))
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset)

      const results = await query

      const mappedResults = results.map((result) => this.mapToVehicleListing(result.listings, result.vehicles))

      return {
        items: mappedResults,
        page,
        limit,
        total: mappedResults.length,
      }
    } catch (error) {
      logger.error("Error searching vehicle listings:", error)
      throw new Error("Failed to search vehicle listings")
    }
  }

  async searchProductListings(filters: ProductSearchFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit
      const conditions = [eq(listings.category, ListingCategory.PRODUCTS), eq(listings.status, ListingStatus.ACTIVE)]

      // Type filter
      if (filters.type?.length) {
        const productTypes = filters.type.map((t: ProductType) => t.toLowerCase() as ProductSelect["productType"])
        conditions.push(inArray(products.productType, productTypes))
      }

      // Category filter (maps to subcategory column if provided)
      if (filters.category?.length) {
        conditions.push(inArray(products.subcategory, filters.category))
      }

      // Condition filter
      if (filters.condition?.length) {
        conditions.push(inArray(products.condition, filters.condition as unknown as ProductSelect["condition"][]))
      }

      // Listing type filter
      if (filters.listingType?.length) {
        conditions.push(inArray(products.listingType, filters.listingType as unknown as ProductSelect["listingType"][]))
      }

      // Price range
      if (filters.priceRange) {
        if (typeof filters.priceRange.min === "number") {
          conditions.push(sql`CAST(${listings.basePrice} AS DECIMAL) >= ${filters.priceRange.min}`)
        }
        if (typeof filters.priceRange.max === "number") {
          conditions.push(sql`CAST(${listings.basePrice} AS DECIMAL) <= ${filters.priceRange.max}`)
        }
      }

      // Location filter (city/region)
      if (filters.location) {
        if (filters.location.city) {
          conditions.push(ilike(listings.locationCity, `%${filters.location.city}%`))
        }
        if (filters.location.region) {
          conditions.push(ilike(listings.locationRegion, `%${filters.location.region!}%`))
        }
      }

      // Availability filters
      if (filters.availability) {
        if (typeof filters.availability.inStock === "boolean") {
          if (filters.availability.inStock) {
            conditions.push(sql`${products.stockLevel} != 'out_of_stock'`)
          }
        }
        if (typeof filters.availability.deliveryAvailable === "boolean") {
          conditions.push(eq(products.deliveryAvailable, filters.availability.deliveryAvailable))
        }
      }

      // Seller filters
      if (filters.seller) {
        if (typeof filters.seller.verified === "boolean") {
          conditions.push(eq(products.isSellerVerified, filters.seller.verified))
        }
        if (typeof filters.seller.rating === "number") {
          conditions.push(sql`CAST(${products.sellerRating} AS DECIMAL) >= ${filters.seller.rating}`)
        }
        if (filters.seller.type?.length) {
          conditions.push(inArray(products.sellerType, filters.seller.type as unknown as ProductSelect["sellerType"][]))
        }
      }

      const query = db
        .select()
        .from(listings)
        .innerJoin(products, eq(listings.id, products.listingId))
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset)

      const results = await query

      const mappedResults = results.map((result) => this.mapToProductListing(result.listings, result.products))

      return {
        items: mappedResults,
        page,
        limit,
        total: mappedResults.length,
      }
    } catch (error) {
      logger.error("Error searching product listings:", error)
      throw new Error("Failed to search product listings")
    }
  }

  private mapToProductListing(listing: ListingSelect, product: ProductSelect): ProductListing {
    return {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      category: listing.category as ListingCategory,
      type: listing.type as ListingType,
      isVerified: false,
      reviewCount: 0,
      price: { amount: Number.parseFloat(product.price), currency: "THB" } as any,
      location: { city: listing.locationCity, address: listing.locationAddress } as any,
      rating: 0,
      isActive: true,
      // status: listing.status, // Property doesn't exist on ProductListing type
      // ProductListing specific
      productType: product.productType as ProductType,
      product: {
        // Product core fields
        id: product.id,
        type: product.productType as ProductType,
        condition: product.condition as ProductCondition,
        status: product.status as ProductStatus,
        tags: [],
        listingType: product.listingType as ProductListingType,
        title: listing.title,
        description: listing.description,
        category: product.subcategory ?? product.productType,
        specifications: {
          brand: (product.brand ?? undefined) as string | undefined,
          model: (product.model ?? undefined) as string | undefined,
          weight: product.weight ?? undefined,
          size: (product.size ?? undefined) as string | undefined,
          material: (product.material ?? undefined) as string | undefined,
          technicalSpecs: (product.technicalSpecs ?? undefined) as
            | Record<string, string | number | boolean>
            | undefined,
          features: product.features ?? [],
          included: product.included ?? undefined,
          requirements: product.requirements ?? undefined,
          conditionNotes: product.conditionNotes ?? undefined,
          defects: product.defects ?? undefined,
          repairs: product.repairs ?? undefined,
          manufacturingYear: product.manufacturingYear ?? undefined,
          countryOfOrigin: (product.countryOfOrigin ?? undefined) as string | undefined,
          sku: (product.sku ?? undefined) as string | undefined,
          serialNumber: (product.serialNumber ?? undefined) as string | undefined,
          color: undefined,
          dimensions:
            product.length || product.width || product.height
              ? {
                  length: product.length ?? undefined,
                  width: product.width ?? undefined,
                  height: product.height ?? undefined,
                  weight: product.weight ?? undefined,
                  volume: product.volume ?? undefined,
                }
              : undefined,
          warrantyPeriod: product.warrantyPeriod ?? undefined,
          warrantyType: (product.warrantyType ?? undefined) as "manufacturer" | "seller" | "none" | undefined,
          supportAvailable: product.supportAvailable ?? undefined,
          manualIncluded: product.manualIncluded ?? undefined,
        },
        pricing: {
          price: Number.parseFloat((product.price as unknown as string) ?? listing.basePrice ?? "0"),
          basePrice: listing.basePrice ? Number.parseFloat(listing.basePrice) : undefined,
          currency: listing.currency,
          priceType: product.priceType as PriceType,
          originalPrice: product.originalPrice
            ? Number.parseFloat(product.originalPrice as unknown as string)
            : undefined,
          msrp: product.msrp ? Number.parseFloat(product.msrp as unknown as string) : undefined,
          rentalPricing: product.rentalPricing ?? undefined,
          shippingCost: product.shippingCost ? Number.parseFloat(product.shippingCost as unknown as string) : undefined,
          handlingFee: product.handlingFee ? Number.parseFloat(product.handlingFee as unknown as string) : undefined,
          installationFee: product.installationFee
            ? Number.parseFloat(product.installationFee as unknown as string)
            : undefined,
          acceptedPayments: product.acceptedPayments ?? [],
          installmentAvailable: product.installmentAvailable ?? undefined,
          installmentOptions: product.installmentOptions ?? undefined,
        },
        availability: {
          isAvailable: product.isAvailable,
          quantity: product.quantity ?? undefined,
          quantityType: (product.quantityType ?? undefined) as "exact" | "approximate" | "unlimited" | undefined,
          availableFrom: product.availableFrom ? product.availableFrom.toISOString() : undefined,
          availableUntil: product.availableUntil ? product.availableUntil.toISOString() : undefined,
          blackoutDates: product.blackoutDates ?? undefined,
          stockLevel: (product.stockLevel ?? undefined) as
            | "in_stock"
            | "low_stock"
            | "out_of_stock"
            | "pre_order"
            | undefined,
          restockDate: product.restockDate ? product.restockDate.toISOString() : undefined,
          availableLocations: product.availableLocations ?? undefined,
          pickupLocations: product.pickupLocations ?? undefined,
          deliveryAvailable: product.deliveryAvailable ?? undefined,
          deliveryAreas: product.deliveryAreas ?? undefined,
          deliveryTime: product.deliveryTime ?? undefined,
        },
        seller: {
          sellerId: product.sellerId,
          sellerType:
            (product.sellerType as unknown as "individual" | "business" | "dealer" | "agency") ?? "individual",
          sellerName: product.sellerName,
          sellerRating: product.sellerRating ? Number.parseFloat(product.sellerRating as unknown as string) : undefined,
          sellerReviews: product.sellerReviews ?? undefined,
          isVerified: product.isSellerVerified ?? false,
          businessLicense: product.businessLicense ?? undefined,
          taxId: product.taxId ?? undefined,
          contactInfo: {
            phone: product.contactPhone ?? undefined,
            email: product.contactEmail ?? undefined,
            website: product.contactWebsite ?? undefined,
            address: product.contactAddress ?? undefined,
            socialMedia: product.socialMedia ?? undefined,
          },
          businessHours: product.businessHours ?? undefined,
          languages: product.languages ?? undefined,
          responseTime: product.responseTime ?? undefined,
          returnPolicy: product.returnPolicy ?? undefined,
          warrantyPolicy: product.warrantyPolicy ?? undefined,
          shippingPolicy: product.shippingPolicy ?? undefined,
        },
        images: listing.images ?? [],
        mainImage: listing.mainImage ?? undefined,
        videos: listing.videos ?? undefined,
        documents: product.documents ?? undefined,
        location: {
          address: listing.locationAddress,
          city: listing.locationCity,
          region: listing.locationRegion,
          country: listing.locationCountry,
          coordinates:
            listing.locationLatitude && listing.locationLongitude
              ? {
                  latitude: Number.parseFloat(listing.locationLatitude),
                  longitude: Number.parseFloat(listing.locationLongitude),
                }
              : undefined,
          zipCode: listing.locationZipCode ?? undefined,
        },
        // tags: listing.tags ?? [], // Property doesn't exist
        keywords: listing.keywords ?? undefined,
        slug: listing.slug ?? undefined,
        isVerified: listing.isVerified,
        verificationDate: listing.verificationDate ? listing.verificationDate.toISOString() : undefined,
        qualityScore: listing.qualityScore ? Number.parseFloat(listing.qualityScore as unknown as string) : undefined,
        trustScore: listing.trustScore ? Number.parseFloat(listing.trustScore as unknown as string) : undefined,
        views: listing.views,
        favorites: listing.favorites,
        inquiries: listing.inquiries,
        averageRating: listing.averageRating ? Number.parseFloat(listing.averageRating as unknown as string) : 0,
        reviewCount: listing.reviewCount,
        moderationStatus:
          (listing.moderationStatus as unknown as "pending" | "approved" | "rejected" | "flagged") ?? undefined,
        moderationNotes: listing.moderationNotes ?? undefined,
        flagReasons: listing.flagReasons ?? undefined,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        publishedAt: listing.publishedAt ? listing.publishedAt.toISOString() : undefined,
        expiresAt: listing.expiresAt ? listing.expiresAt.toISOString() : undefined,
        metadata: listing.metadata ?? undefined,
        customFields: listing.customFields ?? undefined,
      },
      images: listing.images || [],
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }
  }
}
