import { eq, and, or, desc, asc, sql, like, ilike, inArray, gte, lte } from "drizzle-orm"
import { db, listings, realEstate, propertyAmenities, propertyRules } from "../db/connection"
import type {
  CreateRealEstateRequest,
  UpdateRealEstateRequest,
  RealEstateSearchFilters,
  RealEstateListing,
} from "@marketplace/shared-types"
import { v4 as uuidv4 } from "uuid"

export class RealEstateService {
  // Create real estate listing
  async createRealEstate(ownerId: string, data: CreateRealEstateRequest): Promise<RealEstateListing> {
    const listingId = uuidv4()
    const realEstateId = uuidv4()

    try {
      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create main listing
        const [listing] = await tx
          .insert(listings)
          .values({
            id: listingId,
            ownerId,
            title: data.title,
            description: data.description,
            category: "real_estate",
            type: "accommodation", // Map to existing enum
            status: "draft",
            basePrice: data.price.toString(),
            currency: data.currency,
            locationAddress: data.location.address,
            locationCity: data.location.city,
            locationRegion: data.location.region,
            locationCountry: data.location.country,
            locationZipCode: data.location.postalCode,
            locationLatitude: data.location.latitude?.toString(),
            locationLongitude: data.location.longitude?.toString(),
            images: data.images,
            videos: data.videos || [],
            mainImage: data.images[0],
          })
          .returning()

        // Create real estate specific data
        const [realEstateData] = await tx
          .insert(realEstate)
          .values({
            id: realEstateId,
            listingId,
            propertyType: data.propertyType,
            propertyStatus: "available",
            listingPurpose: data.listingPurpose,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms.toString(),
            area: data.area.toString(),
            livingArea: data.livingArea?.toString(),
            landArea: data.landArea?.toString(),
            floor: data.floor,
            totalFloors: data.totalFloors,
            buildingType: data.buildingType,
            buildingAge: data.buildingAge,
            yearBuilt: data.yearBuilt,
            yearRenovated: data.yearRenovated,
            furnishing: data.furnishing,
            condition: data.condition,
            views: data.views,
            orientation: data.orientation,
            balconies: data.balconies || 0,
            terraces: data.terraces || 0,
            price: data.price.toString(),
            pricePerSqm: data.pricePerSqm?.toString(),
            currency: data.currency,
            priceType: data.priceType,
            dailyRate: data.dailyRate?.toString(),
            weeklyRate: data.weeklyRate?.toString(),
            monthlyRate: data.monthlyRate?.toString(),
            yearlyRate: data.yearlyRate?.toString(),
            maintenanceFee: data.maintenanceFee?.toString(),
            commonAreaFee: data.commonAreaFee?.toString(),
            securityDeposit: data.securityDeposit?.toString(),
            cleaningFee: data.cleaningFee?.toString(),
            electricityIncluded: data.electricityIncluded || false,
            waterIncluded: data.waterIncluded || false,
            internetIncluded: data.internetIncluded || false,
            cableIncluded: data.cableIncluded || false,
            gasIncluded: data.gasIncluded || false,
            parkingSpaces: data.parkingSpaces || 0,
            parkingType: data.parkingType,
            parkingFee: data.parkingFee?.toString(),
          })
          .returning()

        // Create amenities if provided
        let amenitiesData = null
        if (data.amenities) {
          ;[amenitiesData] = await tx
            .insert(propertyAmenities)
            .values({
              id: uuidv4(),
              realEstateId,
              hasSwimmingPool: data.amenities.hasSwimmingPool || false,
              hasFitnessCenter: data.amenities.hasFitnessCenter || false,
              hasElevator: data.amenities.hasElevator || false,
              hasSecurity: data.amenities.hasSecurity || false,
              hasAirConditioning: data.amenities.hasAirConditioning || false,
              hasWifi: data.amenities.hasWifi || false,
              petsAllowed: data.amenities.petsAllowed || false,
              // Set other amenities to default false
              hasSauna: false,
              hasGarden: false,
              hasPlayground: false,
              hasCCTV: false,
              hasKeyCard: false,
              hasReception: false,
              hasConcierge: false,
              hasMailbox: false,
              hasHeating: false,
              hasWashingMachine: false,
              hasDryer: false,
              hasDishwasher: false,
              hasMicrowave: false,
              hasRefrigerator: false,
              hasOven: false,
              hasBalcony: false,
              hasTerrace: false,
              hasFireplace: false,
              hasStorage: false,
              hasCableTV: false,
              hasSmartTV: false,
              hasIntercom: false,
              hasSmartHome: false,
              isWheelchairAccessible: false,
              hasHandicapParking: false,
              catsAllowed: false,
              dogsAllowed: false,
              customAmenities: [],
            })
            .returning()
        }

        // Create rules if provided (for short-term rentals)
        let rulesData = null
        if (data.rules) {
          ;[rulesData] = await tx
            .insert(propertyRules)
            .values({
              id: uuidv4(),
              realEstateId,
              maxGuests: data.rules.maxGuests,
              checkInTime: data.rules.checkInTime,
              checkOutTime: data.rules.checkOutTime,
              smokingAllowed: data.rules.smokingAllowed || false,
              partiesAllowed: data.rules.partiesAllowed || false,
              eventsAllowed: data.rules.eventsAllowed || false,
              cancellationPolicy: data.rules.cancellationPolicy || "moderate",
              // Set other rules to defaults
              selfCheckIn: false,
              keypadEntry: false,
              infantsAllowed: true,
              childrenAllowed: true,
              houseRules: "",
              additionalRules: [],
              hasSmokeDetektor: false,
              hasCarbonMonoxideDetector: false,
              hasFireExtinguisher: false,
              hasFirstAidKit: false,
              hasSecurityCamera: false,
            })
            .returning()
        }

        return { listing, realEstateData, amenitiesData, rulesData }
      })

      // Return formatted response
      return this.formatRealEstateListing(result.listing, result.realEstateData, result.amenitiesData, result.rulesData)
    } catch (error) {
      console.error("Error creating real estate:", error)
      throw new Error("Failed to create real estate listing")
    }
  }

  // Get real estate by ID
  async getRealEstateById(id: string): Promise<RealEstateListing | null> {
    try {
      const result = await db
        .select()
        .from(listings)
        .leftJoin(realEstate, eq(listings.id, realEstate.listingId))
        .leftJoin(propertyAmenities, eq(realEstate.id, propertyAmenities.realEstateId))
        .leftJoin(propertyRules, eq(realEstate.id, propertyRules.realEstateId))
        .where(eq(listings.id, id))
        .limit(1)

      if (result.length === 0) {
        return null
      }

      const row = result[0]
      return this.formatRealEstateListing(row.listings, row.real_estate, row.property_amenities, row.property_rules)
    } catch (error) {
      console.error("Error getting real estate:", error)
      throw new Error("Failed to retrieve real estate listing")
    }
  }

  // Search real estate listings
  async searchRealEstate(filters: RealEstateSearchFilters): Promise<{
    listings: RealEstateListing[]
    total: number
    hasMore: boolean
  }> {
    try {
      // Set default values for pagination
      const page = filters.page || 1
      const limit = filters.limit || 20

      const conditions = []

      // Category filter
      conditions.push(eq(listings.category, "real_estate"))

      // Property type filter
      if (filters.propertyType && filters.propertyType.length > 0) {
        conditions.push(inArray(realEstate.propertyType, filters.propertyType))
      }

      // Listing purpose filter
      if (filters.listingPurpose && filters.listingPurpose.length > 0) {
        conditions.push(inArray(realEstate.listingPurpose, filters.listingPurpose))
      }

      // Price filters
      if (filters.minPrice) {
        conditions.push(gte(realEstate.price, filters.minPrice.toString()))
      }
      if (filters.maxPrice) {
        conditions.push(lte(realEstate.price, filters.maxPrice.toString()))
      }

      // Bedroom filters
      if (filters.minBedrooms) {
        conditions.push(gte(realEstate.bedrooms, filters.minBedrooms))
      }
      if (filters.maxBedrooms) {
        conditions.push(lte(realEstate.bedrooms, filters.maxBedrooms))
      }

      // Bathroom filters
      if (filters.minBathrooms) {
        conditions.push(gte(realEstate.bathrooms, filters.minBathrooms.toString()))
      }
      if (filters.maxBathrooms) {
        conditions.push(lte(realEstate.bathrooms, filters.maxBathrooms.toString()))
      }

      // Area filters
      if (filters.minArea) {
        conditions.push(gte(realEstate.area, filters.minArea.toString()))
      }
      if (filters.maxArea) {
        conditions.push(lte(realEstate.area, filters.maxArea.toString()))
      }

      // Furnishing filter
      if (filters.furnishing && filters.furnishing.length > 0) {
        conditions.push(inArray(realEstate.furnishing, filters.furnishing))
      }

      // Location filters
      if (filters.city) {
        conditions.push(ilike(listings.locationCity, `%${filters.city}%`))
      }
      if (filters.region) {
        conditions.push(ilike(listings.locationRegion, `%${filters.region}%`))
      }
      if (filters.country) {
        conditions.push(ilike(listings.locationCountry, `%${filters.country}%`))
      }

      // Amenities filters
      if (filters.hasSwimmingPool) {
        conditions.push(eq(propertyAmenities.hasSwimmingPool, true))
      }
      if (filters.hasFitnessCenter) {
        conditions.push(eq(propertyAmenities.hasFitnessCenter, true))
      }
      if (filters.hasParking) {
        conditions.push(gte(realEstate.parkingSpaces, 1))
      }
      if (filters.hasElevator) {
        conditions.push(eq(propertyAmenities.hasElevator, true))
      }
      if (filters.hasAirConditioning) {
        conditions.push(eq(propertyAmenities.hasAirConditioning, true))
      }
      if (filters.hasWifi) {
        conditions.push(eq(propertyAmenities.hasWifi, true))
      }
      if (filters.petsAllowed) {
        conditions.push(eq(propertyAmenities.petsAllowed, true))
      }

      // Build sorting
      const sortColumn =
        filters.sortBy === "price"
          ? realEstate.price
          : filters.sortBy === "area"
            ? realEstate.area
            : filters.sortBy === "bedrooms"
              ? realEstate.bedrooms
              : filters.sortBy === "updated_at"
                ? listings.updatedAt
                : listings.createdAt

      const sortOrder = filters.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn)

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .leftJoin(realEstate, eq(listings.id, realEstate.listingId))
        .leftJoin(propertyAmenities, eq(realEstate.id, propertyAmenities.realEstateId))
        .where(and(...conditions))

      const total = totalResult[0]?.count || 0

      // Get paginated results
      const offset = (page - 1) * limit
      const results = await db
        .select()
        .from(listings)
        .leftJoin(realEstate, eq(listings.id, realEstate.listingId))
        .leftJoin(propertyAmenities, eq(realEstate.id, propertyAmenities.realEstateId))
        .leftJoin(propertyRules, eq(realEstate.id, propertyRules.realEstateId))
        .where(and(...conditions))
        .orderBy(sortOrder)
        .limit(limit)
        .offset(offset)

      const formattedListings = results.map((row) =>
        this.formatRealEstateListing(row.listings, row.real_estate, row.property_amenities, row.property_rules),
      )

      return {
        listings: formattedListings,
        total,
        hasMore: offset + limit < total,
      }
    } catch (error) {
      console.error("Error searching real estate:", error)
      throw new Error("Failed to search real estate listings")
    }
  }

  // Update real estate listing
  async updateRealEstate(
    id: string,
    ownerId: string,
    data: UpdateRealEstateRequest,
  ): Promise<RealEstateListing | null> {
    try {
      // Check ownership
      const existing = await db
        .select()
        .from(listings)
        .leftJoin(realEstate, eq(listings.id, realEstate.listingId))
        .where(and(eq(listings.id, id), eq(listings.ownerId, ownerId)))
        .limit(1)

      if (existing.length === 0) {
        return null
      }

      // Update in transaction
      const result = await db.transaction(async (tx) => {
        // Update main listing if needed
        if (data.title || data.description || data.location || data.images) {
          await tx
            .update(listings)
            .set({
              ...(data.title && { title: data.title }),
              ...(data.description && { description: data.description }),
              ...(data.location && {
                locationAddress: data.location.address,
                locationCity: data.location.city,
                locationRegion: data.location.region,
                locationCountry: data.location.country,
                locationZipCode: data.location.postalCode,
                locationLatitude: data.location.latitude?.toString(),
                locationLongitude: data.location.longitude?.toString(),
              }),
              ...(data.images && { images: data.images, mainImage: data.images[0] }),
              ...(data.videos && { videos: data.videos }),
              updatedAt: new Date(),
            })
            .where(eq(listings.id, id))
        }

        // Update real estate data
        const updateData: any = {}
        if (data.propertyType) updateData.propertyType = data.propertyType
        if (data.listingPurpose) updateData.listingPurpose = data.listingPurpose
        if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms
        if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms.toString()
        if (data.area !== undefined) updateData.area = data.area.toString()
        if (data.price !== undefined) updateData.price = data.price.toString()
        if (data.furnishing) updateData.furnishing = data.furnishing
        if (data.condition) updateData.condition = data.condition

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date()
          await tx.update(realEstate).set(updateData).where(eq(realEstate.listingId, id))
        }

        return true
      })

      // Return updated listing
      return this.getRealEstateById(id)
    } catch (error) {
      console.error("Error updating real estate:", error)
      throw new Error("Failed to update real estate listing")
    }
  }

  // Delete real estate listing
  async deleteRealEstate(id: string, ownerId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(listings)
        .where(and(eq(listings.id, id), eq(listings.ownerId, ownerId)))
        .returning()

      return result.length > 0
    } catch (error) {
      console.error("Error deleting real estate:", error)
      throw new Error("Failed to delete real estate listing")
    }
  }

  // Helper method to format listing data
  private formatRealEstateListing(
    listing: any,
    realEstateData: any,
    amenitiesData: any,
    rulesData: any,
  ): RealEstateListing {
    return {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      type: listing.type,
      status: listing.status,
      price: {
        amount: parseFloat(listing.basePrice),
        currency: listing.currency,
      },
      location: {
        address: listing.locationAddress,
        city: listing.locationCity,
        region: listing.locationRegion,
        country: listing.locationCountry,
        postalCode: listing.locationZipCode,
        latitude: listing.locationLatitude ? parseFloat(listing.locationLatitude) : undefined,
        longitude: listing.locationLongitude ? parseFloat(listing.locationLongitude) : undefined,
      },
      images: listing.images || [],
      amenities: [], // Real estate amenities are in the realEstate.amenities object
      availability: {
        startDate: listing.availableFrom || new Date(),
        endDate: listing.availableUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        excludedDates: listing.blackoutDates || [],
      },
      rating: listing.averageRating ? parseFloat(listing.averageRating) : 0,
      reviewCount: listing.reviewCount || 0,
      isActive: listing.status === "published",
      isVerified: listing.isVerified || false,
      createdAt: listing.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: listing.updatedAt?.toISOString() || new Date().toISOString(),
      metadata: listing.metadata || {},
      realEstate: realEstateData
        ? {
            id: realEstateData.id,
            listingId: realEstateData.listingId,
            propertyType: realEstateData.propertyType,
            propertyStatus: realEstateData.propertyStatus,
            listingPurpose: realEstateData.listingPurpose,
            bedrooms: realEstateData.bedrooms,
            bathrooms: parseFloat(realEstateData.bathrooms),
            area: parseFloat(realEstateData.area),
            livingArea: realEstateData.livingArea ? parseFloat(realEstateData.livingArea) : undefined,
            landArea: realEstateData.landArea ? parseFloat(realEstateData.landArea) : undefined,
            floor: realEstateData.floor,
            totalFloors: realEstateData.totalFloors,
            buildingType: realEstateData.buildingType,
            buildingAge: realEstateData.buildingAge,
            yearBuilt: realEstateData.yearBuilt,
            yearRenovated: realEstateData.yearRenovated,
            furnishing: realEstateData.furnishing,
            condition: realEstateData.condition,
            views: realEstateData.views,
            orientation: realEstateData.orientation,
            balconies: realEstateData.balconies,
            terraces: realEstateData.terraces,
            price: parseFloat(realEstateData.price),
            pricePerSqm: realEstateData.pricePerSqm ? parseFloat(realEstateData.pricePerSqm) : undefined,
            currency: realEstateData.currency,
            priceType: realEstateData.priceType,
            dailyRate: realEstateData.dailyRate ? parseFloat(realEstateData.dailyRate) : undefined,
            weeklyRate: realEstateData.weeklyRate ? parseFloat(realEstateData.weeklyRate) : undefined,
            monthlyRate: realEstateData.monthlyRate ? parseFloat(realEstateData.monthlyRate) : undefined,
            yearlyRate: realEstateData.yearlyRate ? parseFloat(realEstateData.yearlyRate) : undefined,
            maintenanceFee: realEstateData.maintenanceFee ? parseFloat(realEstateData.maintenanceFee) : undefined,
            commonAreaFee: realEstateData.commonAreaFee ? parseFloat(realEstateData.commonAreaFee) : undefined,
            securityDeposit: realEstateData.securityDeposit ? parseFloat(realEstateData.securityDeposit) : undefined,
            cleaningFee: realEstateData.cleaningFee ? parseFloat(realEstateData.cleaningFee) : undefined,
            electricityIncluded: realEstateData.electricityIncluded,
            waterIncluded: realEstateData.waterIncluded,
            internetIncluded: realEstateData.internetIncluded,
            cableIncluded: realEstateData.cableIncluded,
            gasIncluded: realEstateData.gasIncluded,
            parkingSpaces: realEstateData.parkingSpaces,
            parkingType: realEstateData.parkingType,
            parkingFee: realEstateData.parkingFee ? parseFloat(realEstateData.parkingFee) : undefined,
            amenities: amenitiesData,
            rules: rulesData,
            createdAt: realEstateData.createdAt,
            updatedAt: realEstateData.updatedAt,
            metadata: realEstateData.metadata,
          }
        : undefined,
    } as RealEstateListing
  }
}
