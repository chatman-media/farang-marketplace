import { eq, and, sql, desc } from "drizzle-orm"
import { db } from "../db/connection.js"
import { serviceProviders } from "../db/schema.js"
import type { ServiceProviderFilters, ServiceProviderProfile } from "@marketplace/shared-types"

// Custom interfaces for our API
interface CreateServiceProviderRequest {
  ownerId: string
  businessName?: string
  businessType: "individual" | "company" | "agency" | "freelancer"
  description: string
  services: Array<{
    name: string
    category: string
    subcategory?: string
    description?: string
    price: number
    currency?: string
    priceType?: "fixed" | "hourly" | "daily" | "project"
    minimumCharge?: number
    availability?: {
      daysOfWeek: number[]
      timeSlots: Array<{ start: string; end: string }>
      timezone: string
    }
    serviceArea?: {
      radius: number
      locations: string[]
    }
  }>
  contactInfo: {
    name?: string
    phone: string
    email: string
    website?: string
  }
  location: {
    address: string
    city: string
    region: string
    country: string
    latitude?: number
    longitude?: number
    postalCode?: string
  }
  languages?: string[]
  settings?: {
    autoAcceptBookings?: boolean
    instantBooking?: boolean
    requireDeposit?: boolean
    cancellationPolicy?: string
    refundPolicy?: string
  }
  images?: string[]
}

interface UpdateServiceProviderRequest extends Partial<CreateServiceProviderRequest> {
  images?: string[]
}

export class ServiceProviderService {
  // Create service provider
  async createServiceProvider(data: CreateServiceProviderRequest): Promise<ServiceProviderProfile> {
    try {
      const serviceProviderId = crypto.randomUUID()

      const [serviceProvider] = await db
        .insert(serviceProviders)
        .values({
          id: serviceProviderId,
          userId: data.ownerId,
          providerType: data.businessType,
          businessName: data.businessName,
          displayName: data.businessName || data.contactInfo.name || "Service Provider",
          bio: data.description,
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          website: data.contactInfo.website,
          primaryLocation: {
            latitude: data.location.latitude || 0,
            longitude: data.location.longitude || 0,
            address: data.location.address,
            city: data.location.city,
            region: data.location.region,
            country: data.location.country,
            postalCode: data.location.postalCode,
          },
          serviceCapabilities: data.services.map((service) => ({
            serviceType: service.category,
            category: service.category,
            subcategory: service.subcategory,
            description: service.description || service.name,
            pricing: {
              basePrice: service.price,
              currency: service.currency || "THB",
              priceType: service.priceType || "fixed",
              minimumCharge: service.minimumCharge,
            },
            availability: {
              daysOfWeek: service.availability?.daysOfWeek || [1, 2, 3, 4, 5],
              timeSlots: service.availability?.timeSlots || [{ start: "09:00", end: "17:00" }],
              timezone: service.availability?.timezone || "Asia/Bangkok",
            },
            serviceArea: {
              radius: service.serviceArea?.radius || 10,
              locations: service.serviceArea?.locations || [data.location.city],
            },
          })),
          languages: data.languages || ["th"],
          settings: {
            autoAcceptBookings: data.settings?.autoAcceptBookings || false,
            instantBooking: data.settings?.instantBooking || false,
            requireDeposit: data.settings?.requireDeposit || false,
            cancellationPolicy: data.settings?.cancellationPolicy,
            refundPolicy: data.settings?.refundPolicy,
          },
        })
        .returning()

      return this.mapToServiceProviderProfile(serviceProvider)
    } catch (error) {
      console.error("Error creating service provider:", error)
      throw new Error("Failed to create service provider")
    }
  }

  // Get service provider by ID
  async getServiceProviderById(id: string): Promise<ServiceProviderProfile | null> {
    try {
      const [serviceProvider] = await db
        .select()
        .from(serviceProviders)
        .where(eq(serviceProviders.id, id))

      if (!serviceProvider) {
        return null
      }

      return this.mapToServiceProviderProfile(serviceProvider)
    } catch (error) {
      console.error("Error fetching service provider:", error)
      throw new Error("Failed to fetch service provider")
    }
  }

  // Search service providers
  async searchServiceProviders(filters: ServiceProviderFilters, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit

      // Build conditions
      const conditions = []

      if (filters.providerType) {
        conditions.push(eq(serviceProviders.providerType, filters.providerType))
      }

      if (filters.serviceTypes?.length) {
        // Search in service capabilities JSON
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${serviceProviders.serviceCapabilities}) AS capability
            WHERE capability->>'serviceType' = ANY(${filters.serviceTypes})
          )`
        )
      }

      if (filters.location?.city) {
        conditions.push(
          sql`${serviceProviders.primaryLocation}->>'city' ILIKE ${`%${  filters.location.city  }%`}`
        )
      }

      if (filters.verificationLevel) {
        conditions.push(eq(serviceProviders.verificationLevel, filters.verificationLevel))
      }

      if (filters.rating) {
        conditions.push(sql`${serviceProviders.averageRating}::numeric >= ${filters.rating}`)
      }

      if (filters.priceRange) {
        // Search in pricing within service capabilities
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${serviceProviders.serviceCapabilities}) AS capability
            WHERE (capability->'pricing'->>'basePrice')::numeric BETWEEN ${filters.priceRange.min} AND ${filters.priceRange.max}
          )`
        )
      }

      const results = await db
        .select()
        .from(serviceProviders)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(serviceProviders.averageRating), desc(serviceProviders.createdAt))

      const serviceProviderProfiles = results.map((sp) => this.mapToServiceProviderProfile(sp))

      // Get total count
      const totalQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceProviders)
        .where(and(...conditions))

      const total = totalQuery[0]?.count || 0

      return {
        providers: serviceProviderProfiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      }
    } catch (error) {
      console.error("Error searching service providers:", error)
      throw new Error("Failed to search service providers")
    }
  }

  // Update service provider
  async updateServiceProvider(
    id: string,
    data: UpdateServiceProviderRequest,
    userId: string
  ): Promise<ServiceProviderProfile | null> {
    try {
      // Check ownership
      const [existing] = await db
        .select()
        .from(serviceProviders)
        .where(and(eq(serviceProviders.id, id), eq(serviceProviders.userId, userId)))

      if (!existing) {
        return null
      }

      const updateData: any = {
        updatedAt: new Date(),
      }

      if (data.businessName !== undefined) updateData.businessName = data.businessName
      if (data.description !== undefined) updateData.bio = data.description
      if (data.contactInfo?.email !== undefined) updateData.email = data.contactInfo.email
      if (data.contactInfo?.phone !== undefined) updateData.phone = data.contactInfo.phone
      if (data.contactInfo?.website !== undefined) updateData.website = data.contactInfo.website
      if (data.images?.length) updateData.avatar = data.images[0]

      if (data.services) {
        updateData.serviceCapabilities = data.services.map((service) => ({
          serviceType: service.category,
          category: service.category,
          subcategory: service.subcategory,
          description: service.description || service.name,
          pricing: {
            basePrice: service.price,
            currency: service.currency || "THB",
            priceType: service.priceType || "fixed",
            minimumCharge: service.minimumCharge,
          },
          availability: {
            daysOfWeek: service.availability?.daysOfWeek || [1, 2, 3, 4, 5],
            timeSlots: service.availability?.timeSlots || [{ start: "09:00", end: "17:00" }],
            timezone: service.availability?.timezone || "Asia/Bangkok",
          },
          serviceArea: {
            radius: service.serviceArea?.radius || 10,
            locations: service.serviceArea?.locations || [],
          },
        }))
      }

      const [updated] = await db
        .update(serviceProviders)
        .set(updateData)
        .where(eq(serviceProviders.id, id))
        .returning()

      return this.mapToServiceProviderProfile(updated)
    } catch (error) {
      console.error("Error updating service provider:", error)
      throw new Error("Failed to update service provider")
    }
  }

  // Delete service provider
  async deleteServiceProvider(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(serviceProviders)
        .where(and(eq(serviceProviders.id, id), eq(serviceProviders.userId, userId)))
        .returning({ id: serviceProviders.id })

      return result.length > 0
    } catch (error) {
      console.error("Error deleting service provider:", error)
      throw new Error("Failed to delete service provider")
    }
  }

  // Map database record to ServiceProviderProfile
  private mapToServiceProviderProfile(record: any): ServiceProviderProfile {
    return {
      id: record.id,
      userId: record.userId,
      providerType: record.providerType,
      businessName: record.businessName,
      displayName: record.displayName,
      bio: record.bio,
      avatar: record.avatar,
      coverImage: record.coverImage,
      email: record.email,
      phone: record.phone,
      website: record.website,
      socialMedia: record.socialMedia || {},
      primaryLocation: record.primaryLocation,
      serviceAreas: record.serviceAreas || [],
      businessRegistration: {
        status: "pending" as any,
        licenses: record.businessLicenses || [],
      },
      languages: record.languages || [],
      certifications: record.certifications || [],
      education: [],
      workExperience: [],
      serviceCapabilities: record.serviceCapabilities || [],
      verificationLevel: record.verificationLevel,
      verificationDocuments: {
        identityVerified: false,
        addressVerified: false,
        phoneVerified: false,
        emailVerified: false,
        businessVerified: false,
      },
      metrics: {
        totalJobs: record.totalBookings || 0,
        completedJobs: record.completedBookings || 0,
        cancelledJobs: 0,
        averageRating: parseFloat(record.averageRating) || 0,
        totalReviews: record.totalReviews || 0,
        responseRate: 100,
        onTimeDelivery: 100,
        repeatCustomers: 0,
      },
      availabilityStatus: record.availabilityStatus,
      lastActiveAt: new Date().toISOString(),
      settings: record.settings || {
        autoAcceptBookings: false,
        instantBooking: false,
        requireDeposit: false,
        cancellationPolicy: "",
        refundPolicy: "",
      },
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      verifiedAt: record.verifiedAt?.toISOString(),
    }
  }
}
