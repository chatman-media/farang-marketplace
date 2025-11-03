import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "../api"

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds after data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Time in milliseconds that unused/inactive cache data remains in memory
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

      // Retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === "object" && "status" in error) {
          const apiError = error as ApiError
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3
      },

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === "object" && "status" in error) {
          const apiError = error as ApiError
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false
          }
        }

        // Retry up to 2 times for other errors
        return failureCount < 2
      },
    },
  },
})

// Query keys factory
export const queryKeys = {
  // Auth
  auth: {
    user: ["auth", "user"] as const,
    profile: ["auth", "profile"] as const,
    socialAccounts: ["auth", "social-accounts"] as const,
  },

  // Listings
  listings: {
    all: ["listings"] as const,
    list: (filters?: any) => ["listings", "list", filters] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
    featured: (limit?: number) => ["listings", "featured", limit] as const,
    search: (query: string, filters?: any) => ["listings", "search", query, filters] as const,
    userListings: (userId: string) => ["listings", "user", userId] as const,
  },

  // Real Estate
  realEstate: {
    all: ["real-estate"] as const,
    list: (filters?: any) => ["real-estate", "list", filters] as const,
    detail: (id: string) => ["real-estate", "detail", id] as const,
    featured: (limit?: number) => ["real-estate", "featured", limit] as const,
    search: (query: string, filters?: any) => ["real-estate", "search", query, filters] as const,
  },

  // Service Listings
  serviceListings: {
    all: ["service-listings"] as const,
    list: (filters?: any) => ["service-listings", "list", filters] as const,
    detail: (id: string) => ["service-listings", "detail", id] as const,
    search: (query: string, filters?: any) => ["service-listings", "search", query, filters] as const,
  },

  // Bookings
  bookings: {
    all: ["bookings"] as const,
    list: (filters?: any) => ["bookings", "list", filters] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
    userBookings: (userId: string, filters?: any) => ["bookings", "user", userId, filters] as const,
    availability: (listingId: string, startDate: string, endDate: string) =>
      ["bookings", "availability", listingId, startDate, endDate] as const,
    calendar: (listingId: string, year: number, month: number) =>
      ["bookings", "calendar", listingId, year, month] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    methods: ["payments", "methods"] as const,
    status: (id: string) => ["payments", "status", id] as const,
  },

  // AI
  ai: {
    recommendations: (userId?: string, filters?: any) => ["ai", "recommendations", userId, filters] as const,
    suggestions: (query: string) => ["ai", "suggestions", query] as const,
  },
} as const
