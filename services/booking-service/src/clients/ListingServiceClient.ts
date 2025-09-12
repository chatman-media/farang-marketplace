import { logger } from "@marketplace/logger"

export interface ListingPriceResponse {
  nightlyRate: number
  cleaningFee?: number
  securityDeposit?: number
  hourlyRate?: number
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  currency: string
}

export interface ServicePriceResponse {
  serviceType: string
  priceType: "hourly" | "fixed" | "daily" | "project"
  basePrice: number
  hourlyRate?: number
  fixedPrice?: number
  dailyRate?: number
  minimumCharge?: number
  currency: string
}

export class ListingServiceClient {
  private readonly baseUrl: string
  private readonly timeout: number = 5000

  constructor() {
    this.baseUrl = process.env.LISTING_SERVICE_URL || "http://localhost:3001"
  }

  async getListingPrice(listingId: string): Promise<ListingPriceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/listings/${listingId}/pricing`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "booking-service/1.0.0",
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch listing price: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        nightlyRate: data.pricing?.dailyRate || data.basePrice || 0,
        cleaningFee: data.pricing?.cleaningFee,
        securityDeposit: data.pricing?.securityDeposit || data.pricing?.deposit,
        hourlyRate: data.pricing?.hourlyRate,
        dailyRate: data.pricing?.dailyRate,
        weeklyRate: data.pricing?.weeklyRate,
        monthlyRate: data.pricing?.monthlyRate,
        currency: data.currency || "THB",
      }
    } catch (error) {
      logger.error("Failed to fetch listing price", {
        listingId,
        error: error instanceof Error ? error.message : String(error),
      })

      // Fallback to default pricing if service is unavailable
      return {
        nightlyRate: 1500, // Default THB per night
        cleaningFee: 300,
        securityDeposit: 2000,
        currency: "THB",
      }
    }
  }

  async getServicePrice(listingId: string, serviceType: string): Promise<ServicePriceResponse> {
    try {
      // First try to get service provider by listing ID
      const response = await fetch(`${this.baseUrl}/api/service-providers/by-listing/${listingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "booking-service/1.0.0",
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch service price: ${response.status} ${response.statusText}`)
      }

      const serviceProvider = await response.json()

      // Find matching service capability
      const serviceCapability = serviceProvider.serviceCapabilities?.find((cap: any) => cap.serviceType === serviceType)

      if (serviceCapability?.pricing) {
        const pricing = serviceCapability.pricing
        return {
          serviceType,
          priceType: pricing.priceType || "hourly",
          basePrice: pricing.basePrice || 0,
          hourlyRate: pricing.priceType === "hourly" ? pricing.basePrice : undefined,
          fixedPrice: pricing.priceType === "fixed" ? pricing.basePrice : undefined,
          dailyRate: pricing.priceType === "daily" ? pricing.basePrice : undefined,
          minimumCharge: pricing.minimumCharge,
          currency: pricing.currency || "THB",
        }
      }

      throw new Error("Service pricing not found")
    } catch (error) {
      logger.error("Failed to fetch service price", {
        listingId,
        serviceType,
        error: error instanceof Error ? error.message : String(error),
      })

      // Fallback to default pricing if service is unavailable
      return {
        serviceType,
        priceType: "hourly",
        basePrice: 800,
        hourlyRate: 800,
        currency: "THB",
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}
