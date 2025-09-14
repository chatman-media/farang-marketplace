import type { BookingStatus, CreateBookingRequest, UpdateBookingRequest } from "@marketplace/shared-types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { bookingsService } from "../../api"
import type { BookingFilters } from "../../api/services/bookings"
import { queryKeys } from "../client"

// Get bookings with filters
export const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () => bookingsService.getBookings(filters),
  })
}

// Get single booking
export const useBooking = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingsService.getBooking(id),
    enabled: !!id,
  })
}

// Get user's bookings
export const useUserBookings = (userId: string, filters?: Omit<BookingFilters, "userId">) => {
  return useQuery({
    queryKey: queryKeys.bookings.userBookings(userId, filters),
    queryFn: () => bookingsService.getUserBookings(userId, filters),
    enabled: !!userId,
  })
}

// Check availability
export const useCheckAvailability = (listingId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.availability(listingId, startDate, endDate),
    queryFn: () => bookingsService.checkAvailability(listingId, startDate, endDate),
    enabled: !!(listingId && startDate && endDate),
  })
}

// Get booking calendar
export const useBookingCalendar = (listingId: string, year: number, month: number) => {
  return useQuery({
    queryKey: queryKeys.bookings.calendar(listingId, year, month),
    queryFn: () => bookingsService.getBookingCalendar(listingId, year, month),
    enabled: !!(listingId && year && month),
  })
}

// Create booking mutation
export const useCreateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingData: CreateBookingRequest) => bookingsService.createBooking(bookingData),
    onSuccess: (_, variables) => {
      // Invalidate bookings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })

      // Invalidate availability for the listing
      queryClient.invalidateQueries({
        queryKey: ["bookings", "availability", variables.listingId],
      })

      // Invalidate calendar for the listing
      queryClient.invalidateQueries({
        queryKey: ["bookings", "calendar", variables.listingId],
      })
    },
  })
}

// Update booking mutation
export const useUpdateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingRequest }) => bookingsService.updateBooking(id, data),
    onSuccess: (response, { id }) => {
      // Update the specific booking in cache
      queryClient.setQueryData(queryKeys.bookings.detail(id), response)

      // Invalidate bookings lists
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })

      // Invalidate availability and calendar if dates changed
      if (response.booking.listingId) {
        queryClient.invalidateQueries({
          queryKey: ["bookings", "availability", response.booking.listingId],
        })
        queryClient.invalidateQueries({
          queryKey: ["bookings", "calendar", response.booking.listingId],
        })
      }
    },
  })
}

// Update booking status mutation
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsService.updateBookingStatus(id, status),
    onSuccess: (response, { id }) => {
      // Update the specific booking in cache
      queryClient.setQueryData(queryKeys.bookings.detail(id), response)

      // Invalidate bookings lists
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })

      // Invalidate availability and calendar
      if (response.booking.listingId) {
        queryClient.invalidateQueries({
          queryKey: ["bookings", "availability", response.booking.listingId],
        })
        queryClient.invalidateQueries({
          queryKey: ["bookings", "calendar", response.booking.listingId],
        })
      }
    },
  })
}

// Cancel booking mutation
export const useCancelBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => bookingsService.cancelBooking(id, reason),
    onSuccess: (response, { id }) => {
      // Update the specific booking in cache
      queryClient.setQueryData(queryKeys.bookings.detail(id), response)

      // Invalidate bookings lists
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })

      // Invalidate availability and calendar
      if (response.booking.listingId) {
        queryClient.invalidateQueries({
          queryKey: ["bookings", "availability", response.booking.listingId],
        })
        queryClient.invalidateQueries({
          queryKey: ["bookings", "calendar", response.booking.listingId],
        })
      }
    },
  })
}
