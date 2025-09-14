import {
  ListingCategory,
  ListingType,
  ServiceDeliveryMethod,
  ServiceDuration,
  ServiceType,
} from "@marketplace/shared-types"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { serviceListingsService } from "../../../api"
import { useServiceListings } from "../useListings"

// Mock the API service
vi.mock("../../../api", () => ({
  serviceListingsService: {
    getServiceListings: vi.fn(),
  },
}))

const mockServiceListingsService = vi.mocked(serviceListingsService)

// Mock data that matches our API response
const mockServiceProvidersResponse = {
  listings: [
    {
      id: "sp1",
      title: "Bangkok Visa Services",
      description: "Professional visa assistance for tourists and expats.",
      category: ListingCategory.SERVICES,
      type: ListingType.SERVICE,
      serviceType: ServiceType.VISA_ASSISTANCE,
      price: {
        amount: 2500,
        currency: "THB",
        period: "project" as const,
      },
      location: {
        address: "123 Sukhumvit Road",
        city: "Bangkok",
        province: "Bangkok",
        region: "Bangkok",
        country: "Thailand",
        latitude: 13.7563,
        longitude: 100.5018,
        coordinates: { lat: 13.7563, lng: 100.5018 },
      },
      images: ["https://example.com/image1.jpg"],
      ownerId: "owner1",
      rating: 4.9,
      reviewCount: 156,
      isActive: true,
      isVerified: true,
      deliveryMethod: ServiceDeliveryMethod.IN_PERSON,
      duration: ServiceDuration.PROJECT_BASED,
      languages: ["en", "th"],
      certifications: ["ISO9001"],
      experience: "5+ years of professional visa assistance",
      qualifications: ["Licensed Immigration Consultant"],
      responseTime: "24 hours",
      availability: {
        schedule: {
          monday: [{ start: "09:00", end: "17:00", available: true }],
          tuesday: [{ start: "09:00", end: "17:00", available: true }],
          wednesday: [{ start: "09:00", end: "17:00", available: true }],
          thursday: [{ start: "09:00", end: "17:00", available: true }],
          friday: [{ start: "09:00", end: "17:00", available: true }],
          saturday: [{ start: "09:00", end: "17:00", available: false }],
          sunday: [{ start: "09:00", end: "17:00", available: false }],
        },
        timezone: "Asia/Bangkok",
        advanceBooking: { minimum: 1, maximum: 30, unit: "days" as const },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sp2",
      title: "Thai Language Tutoring",
      description: "Native Thai speaker offering personalized language lessons.",
      category: ListingCategory.SERVICES,
      type: ListingType.SERVICE,
      serviceType: ServiceType.EDUCATION,
      price: {
        amount: 800,
        currency: "THB",
        period: "hour" as const,
      },
      location: {
        address: "456 Silom Road",
        city: "Bangkok",
        province: "Bangkok",
        region: "Bangkok",
        country: "Thailand",
        latitude: 13.7244,
        longitude: 100.5343,
        coordinates: { lat: 13.7244, lng: 100.5343 },
      },
      images: ["https://example.com/image2.jpg"],
      ownerId: "owner2",
      rating: 4.7,
      reviewCount: 89,
      isActive: true,
      isVerified: true,
      deliveryMethod: ServiceDeliveryMethod.ONLINE,
      duration: ServiceDuration.HOURLY,
      languages: ["th", "en"],
      certifications: ["TEFL"],
      experience: "3+ years of Thai language teaching",
      qualifications: ["Native Thai Speaker", "Teaching Certificate"],
      responseTime: "12 hours",
      availability: {
        schedule: {
          monday: [{ start: "10:00", end: "18:00", available: true }],
          tuesday: [{ start: "10:00", end: "18:00", available: true }],
          wednesday: [{ start: "10:00", end: "18:00", available: true }],
          thursday: [{ start: "10:00", end: "18:00", available: true }],
          friday: [{ start: "10:00", end: "18:00", available: true }],
          saturday: [{ start: "10:00", end: "18:00", available: false }],
          sunday: [{ start: "10:00", end: "18:00", available: false }],
        },
        timezone: "Asia/Bangkok",
        advanceBooking: { minimum: 2, maximum: 14, unit: "days" as const },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  hasMore: false,
}

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useServiceListings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch service listings successfully", async () => {
    // Arrange
    mockServiceListingsService.getServiceListings.mockResolvedValue(mockServiceProvidersResponse)

    // Act
    const { result } = renderHook(() => useServiceListings(), {
      wrapper: createWrapper(),
    })

    // Assert
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockServiceProvidersResponse)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockServiceListingsService.getServiceListings).toHaveBeenCalledWith(undefined)
  })

  it("should fetch service listings with filters", async () => {
    // Arrange
    const filters = { page: 1, limit: 10 }
    mockServiceListingsService.getServiceListings.mockResolvedValue(mockServiceProvidersResponse)

    // Act
    const { result } = renderHook(() => useServiceListings(filters), {
      wrapper: createWrapper(),
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockServiceListingsService.getServiceListings).toHaveBeenCalledWith(filters)
  })

  it("should handle API errors", async () => {
    // Arrange
    const errorMessage = "Failed to fetch service listings"
    mockServiceListingsService.getServiceListings.mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useServiceListings(), {
      wrapper: createWrapper(),
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(errorMessage)
    expect(result.current.data).toBeUndefined()
  })

  it("should return correct data structure", async () => {
    // Arrange
    mockServiceListingsService.getServiceListings.mockResolvedValue(mockServiceProvidersResponse)

    // Act
    const { result } = renderHook(() => useServiceListings(), {
      wrapper: createWrapper(),
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const data = result.current.data
    // Check response structure
    expect(data).toHaveProperty("listings")
    expect(data).toHaveProperty("total")
    expect(data).toHaveProperty("page")
    expect(data).toHaveProperty("limit")
    expect(data).toHaveProperty("hasMore")
    expect(Array.isArray(data?.listings)).toBe(true)
    expect(data?.listings).toHaveLength(2)

    // Check first service provider structure
    const firstProvider = data?.listings[0]
    expect(firstProvider).toHaveProperty("id")
    expect(firstProvider).toHaveProperty("title")
    expect(firstProvider).toHaveProperty("description")
    expect(firstProvider).toHaveProperty("providerType")
    expect(firstProvider).toHaveProperty("serviceCapabilities")
    expect(firstProvider).toHaveProperty("primaryLocation")
    expect(firstProvider).toHaveProperty("contactInfo")
    expect(firstProvider).toHaveProperty("rating")
    expect(firstProvider).toHaveProperty("reviewCount")
  })
})
