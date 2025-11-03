import type { PgTransaction } from "@marketplace/database-schema"
import { and, desc, eq, ilike, inArray, sql } from "@marketplace/database-schema"
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
import { v4 as uuidv4 } from "uuid"
import { db, schema } from "../db/connection.js"

// Обновим типы
type ListingSelect = typeof schema.listings.$inferSelect
type ListingInsert = typeof schema.listings.$inferInsert
type VehicleSelect = typeof schema.vehicles.$inferSelect
type VehicleInsert = typeof schema.vehicles.$inferInsert
type ProductSelect = typeof schema.products.$inferSelect
type ProductInsert = typeof schema.products.$inferInsert

export class ListingService {
  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value
  }

  async createVehicleListing(
    ownerId: string,
    vehicleData: CreateVehicleRequest,
    _tx?: PgTransaction<any>
  ): Promise<VehicleListing> {
    const listingId = uuidv4()

    try {
      const result = await db.transaction(async trx => {
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
          locationRegion: vehicleData.location.city,
          locationCountry: vehicleData.location.country,
          locationLatitude: vehicleData.location.coordinates?.latitude?.toString(),
          locationLongitude: vehicleData.location.coordinates?.longitude?.toString(),
          images: vehicleData.images,
          tags: [vehicleData.specifications.make.toLowerCase(), vehicleData.specifications.model.toLowerCase()],
        }

        const [listing] = await trx.insert(schema.listings).values(listingInsert).returning()

        // Create vehicle-specific data
        const vehicleInsert: VehicleInsert = {
          listingId,
          vehicleType: vehicleData.specifications.vehicleType.toLowerCase() as any,
          category: vehicleData.specifications.category.toLowerCase() as any,
          condition: "good" as any,
          status: "available" as any,
          make: vehicleData.specifications.make,
          model: vehicleData.specifications.model,
          year: vehicleData.specifications.year,
          color: vehicleData.specifications.color,
          engineSize: vehicleData.specifications.engineSize || null,
          fuelType: vehicleData.specifications.fuelType,
          transmission: vehicleData.specifications.transmission,
          registrationNumber: vehicleData.documents?.licensePlate || "",
          metadata: {
            seatingCapacity: vehicleData.specifications.seatingCapacity || 1,
          } as any,
          dailyRate: vehicleData.pricing.dailyRate ? vehicleData.pricing.dailyRate.toString() : null,
          weeklyRate: vehicleData.pricing.weeklyRate ? vehicleData.pricing.weeklyRate.toString() : null,
          monthlyRate: vehicleData.pricing.monthlyRate ? vehicleData.pricing.monthlyRate.toString() : null,
          deposit: vehicleData.pricing.securityDeposit ? vehicleData.pricing.securityDeposit.toString() : null,
        }

        const vehicleResult = await trx.insert(schema.vehicles).values(vehicleInsert).returning()

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
    _tx?: PgTransaction<any>
  ): Promise<ProductListing> {
    const listingId = uuidv4()

    try {
      const result = await db.transaction(async trx => {
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

        const [listing] = await trx.insert(schema.listings).values(listingInsert).returning()

        // Create product-specific data
        const productInsert: ProductInsert = {
          listingId,
          productType: productData.productType.toLowerCase() as any,
          condition: productData.condition as any,
          status: "available" as any,
          brand: productData.specifications.brand || null,
          model: productData.specifications.model || null,
          weight: productData.specifications.weight || null,
          listingType: "rental" as any,
          priceType: "per_day" as any,
          price: (productData.pricing?.basePrice || 0).toString(),
          sellerId: ownerId,
          sellerType: "user" as any,
          sellerName: "User",
        }

        const productResult = await trx.insert(schema.products).values(productInsert).returning()

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
        where: eq(schema.listings.id, id),
      })

      if (!listing) return null

      const vehicle = await db.query.vehicles.findFirst({
        where: eq(schema.vehicles.listingId, id),
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
        where: eq(schema.listings.id, id),
      })

      if (!listing) return null

      const product = await db.query.products.findFirst({
        where: eq(schema.products.listingId, id),
      })

      if (!product) return null

      return this.mapToProductListing(listing, product)
    } catch (error) {
      logger.error("Error fetching product listing:", error)
      throw new Error("Failed to fetch product listing")
    }
  }

  private parseDecimal(value: string | number | null): number | undefined {
    if (value === null || value === undefined) return undefined
    const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  private mapToVehicleListing(listing: ListingSelect, vehicle: VehicleSelect): VehicleListing {
    return {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description || "",
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
          color: vehicle.color || "",
          engineSize: this.nullToUndefined(vehicle.engineSize),
          fuelType: vehicle.fuelType as FuelType,
          transmission: vehicle.transmission as TransmissionType,
          seatingCapacity: (vehicle.metadata as any)?.seatingCapacity || 1,
          features: [],
          safetyFeatures: [],
          comfortFeatures: [],
          technologyFeatures: [],
        },
        documents: {
          licensePlate: vehicle.registrationNumber || "",
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

      const conditions = [
        eq(schema.listings.category, ListingCategory.VEHICLES),
        eq(schema.listings.status, ListingStatus.ACTIVE),
      ]

      // Vehicle type filter
      if (filters.type?.length) {
        const vehicleTypes = filters.type.map(t => t.toLowerCase() as VehicleSelect["vehicleType"])
        conditions.push(inArray(schema.vehicles.vehicleType, vehicleTypes))
      }

      // Vehicle category filter
      if (filters.category?.length) {
        const categories = filters.category.map(c => c.toLowerCase() as VehicleSelect["category"])
        conditions.push(inArray(schema.vehicles.category, categories))
      }

      // Fuel type filter
      if (filters.fuelType?.length) {
        const fuelTypes = filters.fuelType.filter(f => f !== null) as Array<Exclude<VehicleSelect["fuelType"], null>>
        if (fuelTypes.length > 0) {
          conditions.push(inArray(schema.vehicles.fuelType, fuelTypes as any))
        }
      }

      // Transmission filter
      if (filters.transmission?.length) {
        const transmissions = filters.transmission.filter(t => t !== null) as Array<
          Exclude<VehicleSelect["transmission"], null>
        >
        if (transmissions.length > 0) {
          conditions.push(inArray(schema.vehicles.transmission, transmissions as any))
        }
      }

      // Seating capacity (minimum) - stored in metadata, can't filter efficiently
      // TODO: Consider adding seatingCapacity column to vehicles table
      // if (typeof filters.seatingCapacity === "number") {
      //   conditions.push(sql`(metadata->>'seatingCapacity')::int >= ${filters.seatingCapacity}`)
      // }

      // Year range
      if (filters.yearRange) {
        if (typeof filters.yearRange.min === "number") {
          conditions.push(sql`${schema.vehicles.year} >= ${filters.yearRange.min}`)
        }
        if (typeof filters.yearRange.max === "number") {
          conditions.push(sql`${schema.vehicles.year} <= ${filters.yearRange.max}`)
        }
      }

      // Price range (from listing base price)
      if (filters.priceRange) {
        if (typeof filters.priceRange.min === "number") {
          conditions.push(sql`CAST(${schema.listings.basePrice} AS DECIMAL) >= ${filters.priceRange.min}`)
        }
        if (typeof filters.priceRange.max === "number") {
          conditions.push(sql`CAST(${schema.listings.basePrice} AS DECIMAL) <= ${filters.priceRange.max}`)
        }
      }

      // Location filter (city/region)
      if (filters.location) {
        conditions.push(
          sql`(
            ${ilike(schema.listings.locationCity, `%${filters.location}%`)} OR
            ${ilike(schema.listings.locationAddress, `%${filters.location}%`)}
          )`
        )
      }

      // Verified listing filter
      if (typeof filters.verified === "boolean") {
        conditions.push(eq(schema.listings.isVerified, filters.verified))
      }

      // Minimum rating filter - stored in metadata, can't filter efficiently
      // TODO: Consider adding averageRating column to listings table for better filtering
      // if (typeof filters.rating === "number") {
      //   conditions.push(sql`CAST((metadata->>'averageRating')::DECIMAL AS DECIMAL) >= ${filters.rating}`)
      // }

      const query = db
        .select()
        .from(schema.listings)
        .innerJoin(schema.vehicles, eq(schema.listings.id, schema.vehicles.listingId))
        .where(and(...conditions))
        .orderBy(desc(schema.listings.createdAt))
        .limit(limit)
        .offset(offset)

      const results = await query

      const mappedResults = results.map(result => this.mapToVehicleListing(result.listings, result.vehicles))

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
      const conditions = [
        eq(schema.listings.category, ListingCategory.PRODUCTS),
        eq(schema.listings.status, ListingStatus.ACTIVE),
      ]

      // Type filter
      if (filters.type?.length) {
        const productTypes = filters.type.map((t: ProductType) => t.toLowerCase() as ProductSelect["productType"])
        conditions.push(inArray(schema.products.productType, productTypes))
      }

      // Category filter (maps to subcategory column if provided)
      if (filters.category?.length) {
        conditions.push(inArray(schema.products.subcategory, filters.category))
      }

      // Condition filter
      if (filters.condition?.length) {
        conditions.push(
          inArray(schema.products.condition, filters.condition as unknown as ProductSelect["condition"][])
        )
      }

      // Listing type filter
      if (filters.listingType?.length) {
        conditions.push(
          inArray(schema.products.listingType, filters.listingType as unknown as ProductSelect["listingType"][])
        )
      }

      // Price range
      if (filters.priceRange) {
        if (typeof filters.priceRange.min === "number") {
          conditions.push(sql`CAST(${schema.listings.basePrice} AS DECIMAL) >= ${filters.priceRange.min}`)
        }
        if (typeof filters.priceRange.max === "number") {
          conditions.push(sql`CAST(${schema.listings.basePrice} AS DECIMAL) <= ${filters.priceRange.max}`)
        }
      }

      // Location filter (city/region)
      if (filters.location) {
        if (filters.location.city) {
          conditions.push(ilike(schema.listings.locationCity, `%${filters.location.city}%`))
        }
        if (filters.location.region) {
          conditions.push(ilike(schema.listings.locationRegion, `%${filters.location.region!}%`))
        }
      }

      // Availability filters
      if (filters.availability) {
        if (typeof filters.availability.inStock === "boolean") {
          if (filters.availability.inStock) {
            conditions.push(sql`${schema.products.stockLevel} != 'out_of_stock'`)
          }
        }
        if (typeof filters.availability.deliveryAvailable === "boolean") {
          conditions.push(eq(schema.products.deliveryAvailable, filters.availability.deliveryAvailable))
        }
      }

      // Seller filters
      if (filters.seller) {
        if (typeof filters.seller.verified === "boolean") {
          conditions.push(eq(schema.products.isSellerVerified, filters.seller.verified))
        }
        if (typeof filters.seller.rating === "number") {
          conditions.push(sql`CAST(${schema.products.sellerRating} AS DECIMAL) >= ${filters.seller.rating}`)
        }
        if (filters.seller.type?.length) {
          conditions.push(
            inArray(schema.products.sellerType, filters.seller.type as unknown as ProductSelect["sellerType"][])
          )
        }
      }

      const query = db
        .select()
        .from(schema.listings)
        .innerJoin(schema.products, eq(schema.listings.id, schema.products.listingId))
        .where(and(...conditions))
        .orderBy(desc(schema.listings.createdAt))
        .limit(limit)
        .offset(offset)

      const results = await query

      const mappedResults = results.map(result => this.mapToProductListing(result.listings, result.products))

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
      description: listing.description || "",
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
        description: listing.description || "",
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
        mainImage: listing.images?.[0] ?? undefined,
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
        keywords: (listing.metadata as any)?.keywords || [],
        slug: listing.slug ?? undefined,
        isVerified: listing.isVerified,
        verificationDate: (listing.metadata as any)?.verificationDate || undefined,
        qualityScore: (listing.metadata as any)?.qualityScore || undefined,
        trustScore: (listing.metadata as any)?.trustScore || 0,
        views: listing.viewCount || 0,
        favorites: (listing.metadata as any)?.favorites || 0,
        inquiries: (listing.metadata as any)?.inquiries || 0,
        averageRating: (listing.metadata as any)?.averageRating || 0,
        reviewCount: (listing.metadata as any)?.reviewCount || 0,
        moderationStatus: (listing.metadata as any)?.moderationStatus || undefined,
        moderationNotes: (listing.metadata as any)?.moderationNotes || undefined,
        flagReasons: (listing.metadata as any)?.flagReasons || undefined,
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

  async updateListingStatus(id: string, status: ListingStatus): Promise<boolean> {
    try {
      const result = await db
        .update(schema.listings)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.listings.id, id))
        .returning()

      return result.length > 0
    } catch (error) {
      logger.error("Error updating listing status:", error)
      throw new Error("Failed to update listing status")
    }
  }

  async updateVehicleListing(id: string, updates: Partial<CreateVehicleRequest>): Promise<VehicleListing | null> {
    try {
      const result = await db.transaction(async trx => {
        // Update listing
        const listingUpdate: Partial<ListingInsert> = {}
        if (updates.pricing?.basePrice) {
          listingUpdate.basePrice = updates.pricing.basePrice.toString()
        }
        if (updates.location) {
          listingUpdate.locationAddress = updates.location.address
          listingUpdate.locationCity = updates.location.city
          listingUpdate.locationCountry = updates.location.country
          listingUpdate.locationLatitude = updates.location.coordinates?.latitude?.toString()
          listingUpdate.locationLongitude = updates.location.coordinates?.longitude?.toString()
        }
        if (updates.images) {
          listingUpdate.images = updates.images
        }

        let listing: ListingSelect | undefined
        if (Object.keys(listingUpdate).length > 0) {
          listingUpdate.updatedAt = new Date()
          const [updatedListing] = await trx
            .update(schema.listings)
            .set(listingUpdate)
            .where(eq(schema.listings.id, id))
            .returning()
          listing = updatedListing
        } else {
          listing = await trx.query.listings.findFirst({
            where: eq(schema.listings.id, id),
          })
        }

        if (!listing) return null

        // Update vehicle
        const vehicleUpdate: Partial<VehicleInsert> = {}
        if (updates.specifications) {
          if (updates.specifications.vehicleType)
            vehicleUpdate.vehicleType = updates.specifications.vehicleType.toLowerCase() as any
          if (updates.specifications.category)
            vehicleUpdate.category = updates.specifications.category.toLowerCase() as any
          if (updates.specifications.make) vehicleUpdate.make = updates.specifications.make
          if (updates.specifications.model) vehicleUpdate.model = updates.specifications.model
          if (updates.specifications.year) vehicleUpdate.year = updates.specifications.year
          if (updates.specifications.color) vehicleUpdate.color = updates.specifications.color
          if (updates.specifications.engineSize) vehicleUpdate.engineSize = updates.specifications.engineSize
          if (updates.specifications.fuelType) vehicleUpdate.fuelType = updates.specifications.fuelType
          if (updates.specifications.transmission) vehicleUpdate.transmission = updates.specifications.transmission
          // seatingCapacity stored in metadata
        }
        if (updates.documents?.licensePlate) vehicleUpdate.registrationNumber = updates.documents.licensePlate
        if (updates.pricing?.dailyRate !== undefined)
          vehicleUpdate.dailyRate = updates.pricing.dailyRate ? updates.pricing.dailyRate.toString() : null
        if (updates.pricing?.weeklyRate !== undefined)
          vehicleUpdate.weeklyRate = updates.pricing.weeklyRate ? updates.pricing.weeklyRate.toString() : null
        if (updates.pricing?.monthlyRate !== undefined)
          vehicleUpdate.monthlyRate = updates.pricing.monthlyRate ? updates.pricing.monthlyRate.toString() : null
        if (updates.pricing?.securityDeposit !== undefined)
          vehicleUpdate.deposit = updates.pricing.securityDeposit ? updates.pricing.securityDeposit.toString() : null

        let vehicle: VehicleSelect | undefined
        if (Object.keys(vehicleUpdate).length > 0) {
          const [updatedVehicle] = await trx
            .update(schema.vehicles)
            .set(vehicleUpdate)
            .where(eq(schema.vehicles.listingId, id))
            .returning()
          vehicle = updatedVehicle
        } else {
          vehicle = await trx.query.vehicles.findFirst({
            where: eq(schema.vehicles.listingId, id),
          })
        }

        if (!vehicle) return null

        return this.mapToVehicleListing(listing, vehicle)
      })

      return result
    } catch (error) {
      logger.error("Error updating vehicle listing:", error)
      throw new Error("Failed to update vehicle listing")
    }
  }

  async deleteListing(id: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.listings).where(eq(schema.listings.id, id)).returning()

      return result.length > 0
    } catch (error) {
      logger.error("Error deleting listing:", error)
      throw new Error("Failed to delete listing")
    }
  }

  async getListingsByOwner(ownerId: string): Promise<(VehicleListing | ProductListing)[]> {
    try {
      const listings = await db.query.listings.findMany({
        where: eq(schema.listings.ownerId, ownerId),
        orderBy: [desc(schema.listings.createdAt)],
      })

      const results: (VehicleListing | ProductListing)[] = []

      for (const listing of listings) {
        if (listing.category === ListingCategory.VEHICLES) {
          const vehicle = await db.query.vehicles.findFirst({
            where: eq(schema.vehicles.listingId, listing.id),
          })
          if (vehicle) {
            results.push(this.mapToVehicleListing(listing, vehicle))
          }
        } else if (listing.category === ListingCategory.PRODUCTS) {
          const product = await db.query.products.findFirst({
            where: eq(schema.products.listingId, listing.id),
          })
          if (product) {
            results.push(this.mapToProductListing(listing, product))
          }
        }
      }

      return results
    } catch (error) {
      logger.error("Error fetching listings by owner:", error)
      throw new Error("Failed to fetch listings by owner")
    }
  }
}
