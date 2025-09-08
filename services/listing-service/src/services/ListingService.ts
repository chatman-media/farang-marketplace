import { eq, and, or, desc, asc, sql, like, ilike, inArray } from "drizzle-orm"
import { db, listings, vehicles, products, listingAvailability, listingBookings } from "../db/connection"
import type {
  Vehicle,
  Product,
  VehicleListing,
  ProductListing,
  ListingCategory,
  VehicleSearchFilters,
  ProductSearchFilters,
  CreateVehicleRequest,
  CreateProductRequest,
  UpdateVehicleRequest,
  UpdateProductRequest,
} from "@marketplace/shared-types"
import { v4 as uuidv4 } from "uuid"

export class ListingService {
  // Create vehicle listing
  async createVehicleListing(ownerId: string, vehicleData: CreateVehicleRequest): Promise<VehicleListing> {
    const listingId = uuidv4()
    const vehicleId = uuidv4()

    try {
      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create main listing
        const [listing] = await tx
          .insert(listings)
          .values({
            id: listingId,
            ownerId,
            title: `${vehicleData.specifications.make} ${vehicleData.specifications.model} ${vehicleData.specifications.year}`,
            description:
              vehicleData.notes || `${vehicleData.specifications.make} ${vehicleData.specifications.model} for rent`,
            category: "vehicles",
            type: "vehicle",
            status: "draft",
            basePrice: vehicleData.pricing.basePrice.toString(),
            currency: vehicleData.pricing.currency,
            locationAddress: vehicleData.location.currentLocation,
            locationCity: vehicleData.location.currentLocation.split(",")[0] || "Bangkok",
            locationRegion: vehicleData.location.currentLocation.split(",")[1] || "Bangkok",
            locationCountry: "Thailand",
            locationLatitude: vehicleData.location.coordinates?.latitude?.toString(),
            locationLongitude: vehicleData.location.coordinates?.longitude?.toString(),
            images: vehicleData.images,
            mainImage: vehicleData.images[0],
            tags: [vehicleData.type, vehicleData.category, vehicleData.specifications.make.toLowerCase()],
          })
          .returning()

        // Create vehicle-specific data
        const [vehicle] = await tx
          .insert(vehicles)
          .values({
            id: vehicleId,
            listingId,
            vehicleType: vehicleData.type,
            category: vehicleData.category,
            condition: vehicleData.condition,
            status: "available",

            // Specifications
            make: vehicleData.specifications.make,
            model: vehicleData.specifications.model,
            year: vehicleData.specifications.year,
            color: vehicleData.specifications.color,
            engineSize: vehicleData.specifications.engineSize,
            power: vehicleData.specifications.power,
            maxSpeed: vehicleData.specifications.maxSpeed,
            fuelConsumption: vehicleData.specifications.fuelConsumption?.toString(),
            fuelType: vehicleData.specifications.fuelType,
            transmission: vehicleData.specifications.transmission,
            seatingCapacity: vehicleData.specifications.seatingCapacity,
            doors: vehicleData.specifications.doors,

            // Dimensions
            length: vehicleData.specifications.length,
            width: vehicleData.specifications.width,
            height: vehicleData.specifications.height,
            weight: vehicleData.specifications.weight,

            // Features
            features: vehicleData.specifications.features,
            safetyFeatures: vehicleData.specifications.safetyFeatures || [],
            comfortFeatures: vehicleData.specifications.comfortFeatures || [],
            technologyFeatures: vehicleData.specifications.technologyFeatures || [],

            // Documents
            licensePlate: vehicleData.documents.licensePlate || `TEMP-${vehicleId.substring(0, 8)}`,
            registrationNumber: vehicleData.documents.registrationNumber || null,
            engineNumber: vehicleData.documents.engineNumber || null,
            chassisNumber: vehicleData.documents.chassisNumber || null,
            insuranceNumber: vehicleData.documents.insuranceNumber || null,
            documentsComplete: vehicleData.documents.documentsComplete || false,
            documentsVerified: vehicleData.documents.documentsVerified || false,
            documentsNotes: vehicleData.documents.documentsNotes || null,

            // Pricing
            hourlyRate: vehicleData.pricing.hourlyRate?.toString(),
            dailyRate: vehicleData.pricing.dailyRate?.toString(),
            weeklyRate: vehicleData.pricing.weeklyRate?.toString(),
            monthlyRate: vehicleData.pricing.monthlyRate?.toString(),
            yearlyRate: vehicleData.pricing.yearlyRate?.toString(),
            securityDeposit: vehicleData.pricing.securityDeposit.toString(),
            insurancePerDay: vehicleData.pricing.insurancePerDay?.toString(),
            deliveryFee: vehicleData.pricing.deliveryFee?.toString(),
            pickupFee: vehicleData.pricing.pickupFee?.toString(),
            lateFee: vehicleData.pricing.lateFee?.toString(),
            damageFee: vehicleData.pricing.damageFee?.toString(),
            fuelPolicy: vehicleData.pricing.fuelPolicy,
            fuelCostPerLiter: vehicleData.pricing.fuelCostPerLiter?.toString(),
            durationDiscounts: vehicleData.pricing.durationDiscounts || {},

            // Location
            currentLocation: vehicleData.location.currentLocation,
            pickupLocations: vehicleData.location.pickupLocations,
            deliveryAvailable: vehicleData.location.deliveryAvailable,
            deliveryRadius: vehicleData.location.deliveryRadius,
            serviceAreas: vehicleData.location.serviceAreas,
            restrictedAreas: vehicleData.location.restrictedAreas || [],

            // Maintenance
            hasCharger: vehicleData.maintenance?.hasCharger || false,
            hasHelmet: vehicleData.maintenance?.hasHelmet || false,
            hasLock: vehicleData.maintenance?.hasLock || false,
            accessories: vehicleData.maintenance?.accessories || [],

            notes: vehicleData.notes,
          })
          .returning()

        return { listing, vehicle }
      })

      // Convert to VehicleListing format
      return this.mapToVehicleListing(result.listing, result.vehicle)
    } catch (error) {
      console.error("Error creating vehicle listing:", error)
      throw new Error("Failed to create vehicle listing")
    }
  }

  // Create product listing
  async createProductListing(ownerId: string, productData: CreateProductRequest): Promise<ProductListing> {
    const listingId = uuidv4()
    const productId = uuidv4()

    try {
      const result = await db.transaction(async (tx) => {
        // Create main listing
        const [listing] = await tx
          .insert(listings)
          .values({
            id: listingId,
            ownerId,
            title: productData.title,
            description: productData.description,
            category: "products",
            type: "product",
            status: "draft",
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
            mainImage: productData.images[0],
            tags: productData.tags,
          })
          .returning()

        // Create product-specific data
        const [product] = await tx
          .insert(products)
          .values({
            id: productId,
            listingId,
            productType: productData.type,
            subcategory: productData.subcategory,
            condition: productData.condition,
            status: "active",
            listingType: productData.listingType,

            // Specifications
            brand: productData.specifications.brand,
            model: productData.specifications.model,
            serialNumber: productData.specifications.serialNumber,
            manufacturingYear: productData.specifications.manufacturingYear,
            countryOfOrigin: productData.specifications.countryOfOrigin,

            // Physical properties
            length: productData.specifications.dimensions?.length,
            width: productData.specifications.dimensions?.width,
            height: productData.specifications.dimensions?.height,
            weight: productData.specifications.dimensions?.weight,
            volume: productData.specifications.dimensions?.volume,
            material: productData.specifications.material,
            size: productData.specifications.size,

            // Technical specs
            technicalSpecs: productData.specifications.technicalSpecs || {},
            features: productData.specifications.features,
            included: productData.specifications.included || [],
            requirements: productData.specifications.requirements || [],

            // Condition
            conditionNotes: productData.specifications.conditionNotes,
            defects: productData.specifications.defects || [],
            repairs: productData.specifications.repairs || [],

            // Warranty
            warrantyPeriod: productData.specifications.warrantyPeriod,
            warrantyType: productData.specifications.warrantyType,
            supportAvailable: productData.specifications.supportAvailable || false,
            manualIncluded: productData.specifications.manualIncluded || false,

            // Pricing
            price: productData.pricing.price.toString(),
            priceType: productData.pricing.priceType,
            originalPrice: productData.pricing.originalPrice?.toString(),
            msrp: productData.pricing.msrp?.toString(),
            rentalPricing: productData.pricing.rentalPricing,
            shippingCost: productData.pricing.shippingCost?.toString(),
            handlingFee: productData.pricing.handlingFee?.toString(),
            installationFee: productData.pricing.installationFee?.toString(),
            acceptedPayments: productData.pricing.acceptedPayments,
            installmentAvailable: productData.pricing.installmentAvailable || false,
            installmentOptions: productData.pricing.installmentOptions || [],

            // Availability
            isAvailable: productData.availability.isAvailable,
            quantity: productData.availability.quantity,
            quantityType: productData.availability.quantityType,
            stockLevel: productData.availability.stockLevel,
            restockDate: productData.availability.restockDate
              ? new Date(productData.availability.restockDate)
              : undefined,
            availableFrom: productData.availability.availableFrom
              ? new Date(productData.availability.availableFrom)
              : undefined,
            availableUntil: productData.availability.availableUntil
              ? new Date(productData.availability.availableUntil)
              : undefined,
            blackoutDates: productData.availability.blackoutDates || [],
            availableLocations: productData.availability.availableLocations || [],
            pickupLocations: productData.availability.pickupLocations || [],
            deliveryAvailable: productData.availability.deliveryAvailable || false,
            deliveryAreas: productData.availability.deliveryAreas || [],
            deliveryTime: productData.availability.deliveryTime,

            // Seller (placeholder - should come from user service)
            sellerId: ownerId,
            sellerType: "individual",
            sellerName: "Seller Name", // TODO: Get from user service
            isSellerVerified: false,
          })
          .returning()

        return { listing, product }
      })

      return this.mapToProductListing(result.listing, result.product)
    } catch (error) {
      console.error("Error creating product listing:", error)
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
        .where(and(eq(listings.id, id), eq(listings.type, "vehicle")))
        .limit(1)

      if (!result[0] || !result[0].vehicles) {
        return null
      }

      return this.mapToVehicleListing(result[0].listings, result[0].vehicles)
    } catch (error) {
      console.error("Error getting vehicle listing:", error)
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
        .where(and(eq(listings.id, id), eq(listings.type, "product")))
        .limit(1)

      if (!result[0] || !result[0].products) {
        return null
      }

      return this.mapToProductListing(result[0].listings, result[0].products)
    } catch (error) {
      console.error("Error getting product listing:", error)
      throw new Error("Failed to get product listing")
    }
  }

  // Helper method to map database result to VehicleListing
  private mapToVehicleListing(listing: any, vehicle: any): VehicleListing {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: "vehicles" as ListingCategory.VEHICLES,
      type: "vehicle" as any,
      price: {
        amount: parseFloat(listing.basePrice),
        currency: listing.currency,
        period: "day",
      },
      location: {
        address: listing.locationAddress,
        city: listing.locationCity,
        region: listing.locationRegion,
        country: listing.locationCountry,
        latitude: listing.locationLatitude ? parseFloat(listing.locationLatitude) : 0,
        longitude: listing.locationLongitude ? parseFloat(listing.locationLongitude) : 0,
      },
      images: listing.images || [],
      availability: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      ownerId: listing.ownerId,
      rating: parseFloat(listing.averageRating) || 0,
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
          fuelConsumption: vehicle.fuelConsumption ? parseFloat(vehicle.fuelConsumption) : undefined,
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
          basePrice: parseFloat(listing.basePrice),
          currency: listing.currency,
          hourlyRate: vehicle.hourlyRate ? parseFloat(vehicle.hourlyRate) : undefined,
          dailyRate: vehicle.dailyRate ? parseFloat(vehicle.dailyRate) : undefined,
          weeklyRate: vehicle.weeklyRate ? parseFloat(vehicle.weeklyRate) : undefined,
          monthlyRate: vehicle.monthlyRate ? parseFloat(vehicle.monthlyRate) : undefined,
          yearlyRate: vehicle.yearlyRate ? parseFloat(vehicle.yearlyRate) : undefined,
          securityDeposit: parseFloat(vehicle.securityDeposit),
          insurancePerDay: vehicle.insurancePerDay ? parseFloat(vehicle.insurancePerDay) : undefined,
          deliveryFee: vehicle.deliveryFee ? parseFloat(vehicle.deliveryFee) : undefined,
          pickupFee: vehicle.pickupFee ? parseFloat(vehicle.pickupFee) : undefined,
          lateFee: vehicle.lateFee ? parseFloat(vehicle.lateFee) : undefined,
          damageFee: vehicle.damageFee ? parseFloat(vehicle.damageFee) : undefined,
          fuelPolicy: vehicle.fuelPolicy,
          fuelCostPerLiter: vehicle.fuelCostPerLiter ? parseFloat(vehicle.fuelCostPerLiter) : undefined,
          durationDiscounts: vehicle.durationDiscounts || {},
        },
        location: {
          currentLocation: vehicle.currentLocation,
          coordinates:
            listing.locationLatitude && listing.locationLongitude
              ? {
                  latitude: parseFloat(listing.locationLatitude),
                  longitude: parseFloat(listing.locationLongitude),
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
        qualityScore: listing.qualityScore ? parseFloat(listing.qualityScore) : undefined,
        totalRentals: vehicle.totalRentals,
        totalKilometers: vehicle.totalKilometers,
        averageRating: parseFloat(listing.averageRating) || 0,
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
      const conditions = [eq(listings.type, "vehicle"), eq(listings.status, "active")]

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

        if (filters.priceRange.min) {
          conditions.push(sql`${priceField}::numeric >= ${filters.priceRange.min}`)
        }
        if (filters.priceRange.max) {
          conditions.push(sql`${priceField}::numeric <= ${filters.priceRange.max}`)
        }
      }

      if (filters.location) {
        conditions.push(ilike(listings.locationCity, `%${filters.location}%`))
      }

      if (filters.verified !== undefined) {
        conditions.push(eq(listings.isVerified, filters.verified))
      }

      if (filters.rating) {
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
        .filter((r: any) => r.vehicles)
        .map((r: any) => this.mapToVehicleListing(r.listings, r.vehicles))

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
      console.error("Error searching vehicle listings:", error)
      throw new Error("Failed to search vehicle listings")
    }
  }

  // Search product listings
  async searchProductListings(filters: ProductSearchFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit
      const conditions = [eq(listings.type, "product"), eq(listings.status, "active")]

      if (filters.type?.length) {
        conditions.push(inArray(products.productType, filters.type))
      }

      if (filters.category?.length) {
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

      if (filters.seller?.verified !== undefined) {
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
        .filter((r) => r.products)
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
      console.error("Error searching product listings:", error)
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
          status: status as any,
          updatedAt: new Date(),
          publishedAt: status === "active" ? new Date() : undefined,
        })
        .where(and(...conditions))
        .returning()

      return updated
    } catch (error) {
      console.error("Error updating listing status:", error)
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
      console.error("Error deleting listing:", error)
      throw new Error("Failed to delete listing")
    }
  }

  // Helper method to map database result to ProductListing
  private mapToProductListing(listing: any, product: any): ProductListing {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: "products" as ListingCategory.PRODUCTS,
      type: "product" as any,
      price: {
        amount: parseFloat(listing.basePrice),
        currency: listing.currency,
      },
      location: {
        address: listing.locationAddress,
        city: listing.locationCity,
        region: listing.locationRegion,
        country: listing.locationCountry,
        latitude: listing.locationLatitude ? parseFloat(listing.locationLatitude) : 0,
        longitude: listing.locationLongitude ? parseFloat(listing.locationLongitude) : 0,
      },
      images: listing.images || [],
      ownerId: listing.ownerId,
      rating: parseFloat(listing.averageRating) || 0,
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
          price: parseFloat(product.price),
          currency: listing.currency,
          priceType: product.priceType,
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
          msrp: product.msrp ? parseFloat(product.msrp) : undefined,
          rentalPricing: product.rentalPricing,
          shippingCost: product.shippingCost ? parseFloat(product.shippingCost) : undefined,
          handlingFee: product.handlingFee ? parseFloat(product.handlingFee) : undefined,
          installationFee: product.installationFee ? parseFloat(product.installationFee) : undefined,
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
          sellerType: product.sellerType as any,
          sellerName: product.sellerName,
          sellerRating: product.sellerRating ? parseFloat(product.sellerRating) : undefined,
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
                  latitude: parseFloat(listing.locationLatitude),
                  longitude: parseFloat(listing.locationLongitude),
                }
              : undefined,
          zipCode: listing.locationZipCode,
        },
        tags: listing.tags || [],
        isVerified: listing.isVerified,
        verificationDate: listing.verificationDate?.toISOString(),
        qualityScore: listing.qualityScore ? parseFloat(listing.qualityScore) : undefined,
        trustScore: listing.trustScore ? parseFloat(listing.trustScore) : undefined,
        views: listing.views,
        favorites: listing.favorites,
        inquiries: listing.inquiries,
        averageRating: parseFloat(listing.averageRating) || 0,
        reviewCount: listing.reviewCount || 0,
        moderationStatus: listing.moderationStatus as any,
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
        internationalShipping: false, // TODO: Implement
        pickupAvailable: (product.pickupLocations || []).length > 0,
        shippingCost: product.shippingCost ? parseFloat(product.shippingCost) : undefined,
      },
    }
  }
}
