import { api } from "../client"
import { getApiConfig } from "../config"
import type { Booking, CreateBookingRequest, UpdateBookingRequest, BookingStatus } from "@marketplace/shared-types"

const config = getApiConfig()

export interface BookingResponse {
  booking: Booking
  success: boolean
  message?: string
}

export interface BookingsPageResponse {
  bookings: Booking[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface BookingFilters {
  status?: BookingStatus
  listingId?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export const bookingsService = {
  // Get all bookings with filters
  getBookings: async (filters?: BookingFilters): Promise<BookingsPageResponse> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const url = `${config.ENDPOINTS.BOOKINGS.BASE}?${params.toString()}`
    return await api.get<BookingsPageResponse>(url)
  },

  // Get booking by ID
  getBooking: async (id: string): Promise<BookingResponse> => {
    return await api.get<BookingResponse>(config.ENDPOINTS.BOOKINGS.BY_ID(id))
  },

  // Create new booking
  createBooking: async (bookingData: CreateBookingRequest): Promise<BookingResponse> => {
    return await api.post<BookingResponse>(config.ENDPOINTS.BOOKINGS.CREATE, bookingData)
  },

  // Update booking
  updateBooking: async (id: string, bookingData: UpdateBookingRequest): Promise<BookingResponse> => {
    return await api.put<BookingResponse>(config.ENDPOINTS.BOOKINGS.BY_ID(id), bookingData)
  },

  // Update booking status
  updateBookingStatus: async (id: string, status: BookingStatus): Promise<BookingResponse> => {
    return await api.patch<BookingResponse>(config.ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), { status })
  },

  // Cancel booking
  cancelBooking: async (id: string, reason?: string): Promise<BookingResponse> => {
    return await api.patch<BookingResponse>(config.ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), {
      status: "cancelled",
      cancellationReason: reason,
    })
  },

  // Get user's bookings
  getUserBookings: async (userId: string, filters?: Omit<BookingFilters, "userId">): Promise<Booking[]> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const url = `${config.ENDPOINTS.BOOKINGS.USER_BOOKINGS(userId)}?${params.toString()}`
    return await api.get<Booking[]>(url)
  },

  // Check availability for a listing
  checkAvailability: async (
    listingId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ available: boolean; conflicts?: any[] }> => {
    return await api.get<{ available: boolean; conflicts?: any[] }>(
      `${config.ENDPOINTS.LISTINGS.BY_ID(listingId)}/availability?startDate=${startDate}&endDate=${endDate}`,
    )
  },

  // Get booking calendar for a listing
  getBookingCalendar: async (listingId: string, year: number, month: number): Promise<{ calendar: any[] }> => {
    return await api.get<{ calendar: any[] }>(
      `${config.ENDPOINTS.LISTINGS.BY_ID(listingId)}/calendar?year=${year}&month=${month}`,
    )
  },
}
