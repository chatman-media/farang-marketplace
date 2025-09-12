import type {
  CreateListingRequest,
  CreateServiceListingRequest,
  Listing,
  ListingFilters,
  ListingResponse,
  ListingsPageResponse,
  ServiceListingFilters,
  ServiceListingResponse,
  ServiceListingsPageResponse,
  UpdateListingRequest,
  UpdateServiceListingRequest,
} from "@marketplace/shared-types"
import { api } from "../client"
import { getApiConfig } from "../config"

const config = getApiConfig()

export const listingsService = {
  // Get all listings with pagination and filters
  getListings: async (filters?: ListingFilters & { page?: number; limit?: number }): Promise<ListingsPageResponse> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const url = `${config.ENDPOINTS.LISTINGS.BASE}?${params.toString()}`
    const response = await api.get<{ success: boolean; data: { listings: any[]; pagination: any } }>(url)

    // Transform API response to expected format
    return {
      listings: response.data.listings,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      hasMore: response.data.pagination.page < response.data.pagination.totalPages,
    }
  },

  // Get listing by ID
  getListing: async (id: string): Promise<ListingResponse> => {
    return await api.get<ListingResponse>(config.ENDPOINTS.LISTINGS.BY_ID(id))
  },

  // Create new listing
  createListing: async (listingData: CreateListingRequest): Promise<ListingResponse> => {
    return await api.post<ListingResponse>(config.ENDPOINTS.LISTINGS.BASE, listingData)
  },

  // Update listing
  updateListing: async (id: string, listingData: UpdateListingRequest): Promise<ListingResponse> => {
    return await api.put<ListingResponse>(config.ENDPOINTS.LISTINGS.BY_ID(id), listingData)
  },

  // Delete listing
  deleteListing: async (id: string): Promise<{ success: boolean; message: string }> => {
    return await api.delete(config.ENDPOINTS.LISTINGS.BY_ID(id))
  },

  // Search listings
  searchListings: async (query: string, filters?: ListingFilters): Promise<ListingsPageResponse> => {
    const params = new URLSearchParams({ q: query })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const url = `${config.ENDPOINTS.LISTINGS.SEARCH}?${params.toString()}`
    return await api.get<ListingsPageResponse>(url)
  },

  // Get featured listings
  getFeaturedListings: async (limit?: number): Promise<Listing[]> => {
    const params = limit ? `?limit=${limit}` : ""
    return await api.get<Listing[]>(`${config.ENDPOINTS.LISTINGS.FEATURED}${params}`)
  },

  // Get user's listings
  getUserListings: async (userId: string): Promise<Listing[]> => {
    return await api.get<Listing[]>(config.ENDPOINTS.LISTINGS.USER_LISTINGS(userId))
  },

  // Upload listing images
  uploadListingImages: async (listingId: string, files: File[]): Promise<{ images: string[] }> => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`image_${index}`, file)
    })

    return await api.post<{ images: string[] }>(`${config.ENDPOINTS.LISTINGS.BY_ID(listingId)}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },
}

// Real estate service removed - will be added later when system stabilizes

export const serviceListingsService = {
  // Get service listings
  getServiceListings: async (
    filters?: ServiceListingFilters & { page?: number; limit?: number },
  ): Promise<ServiceListingsPageResponse> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)))
          } else if (typeof value === "object") {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const url = `${config.ENDPOINTS.SERVICE_PROVIDERS.BASE}?${params.toString()}`
    const response = await api.get<{ success: boolean; data: { serviceProviders: any[]; pagination: any } }>(url)

    // Transform API response to expected format
    return {
      listings: response.data.serviceProviders,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      hasMore: response.data.pagination.page < response.data.pagination.totalPages,
    }
  },

  // Get service listing by ID
  getServiceListing: async (id: string): Promise<ServiceListingResponse> => {
    return await api.get<ServiceListingResponse>(config.ENDPOINTS.SERVICE_PROVIDERS.BY_ID(id))
  },

  // Create service listing
  createServiceListing: async (listingData: CreateServiceListingRequest): Promise<ServiceListingResponse> => {
    return await api.post<ServiceListingResponse>(config.ENDPOINTS.SERVICE_PROVIDERS.BASE, listingData)
  },

  // Update service listing
  updateServiceListing: async (listingData: UpdateServiceListingRequest): Promise<ServiceListingResponse> => {
    return await api.put<ServiceListingResponse>(config.ENDPOINTS.SERVICE_PROVIDERS.BY_ID(listingData.id), listingData)
  },

  // Search service listings
  searchServiceListings: async (
    query: string,
    filters?: ServiceListingFilters,
  ): Promise<ServiceListingsPageResponse> => {
    const params = new URLSearchParams({ q: query })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)))
          } else if (typeof value === "object") {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const url = `${config.ENDPOINTS.SERVICE_PROVIDERS.SEARCH}?${params.toString()}`
    return await api.get<ServiceListingsPageResponse>(url)
  },
}
