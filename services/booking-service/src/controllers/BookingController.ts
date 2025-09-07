import { Request, Response } from "express"
import { validationResult } from "express-validator"
import { BookingService } from "../services/BookingService.js"
import type {
  CreateBookingRequest,
  CreateServiceBookingRequest,
  UpdateStatusRequest,
  BookingFilters,
} from "@marketplace/shared-types"

export class BookingController {
  private bookingService: BookingService

  constructor() {
    this.bookingService = new BookingService()
  }

  // Create a new accommodation booking
  createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const bookingRequest: CreateBookingRequest = req.body
      const guestId = req.user?.id // From auth middleware

      if (!guestId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Get host ID from listing (would typically fetch from listing service)
      const hostId = await this.getHostIdFromListing(bookingRequest.listingId)

      if (!hostId) {
        res.status(404).json({
          error: "Not Found",
          message: "Listing not found or host not available",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const booking = await this.bookingService.createBooking(bookingRequest, guestId, hostId)

      res.status(201).json({
        success: true,
        data: booking,
        message: "Booking created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error creating booking:", error)

      res.status(error.message.includes("not available") ? 409 : 500).json({
        error: error.message.includes("not available") ? "Conflict" : "Internal Server Error",
        message: error.message || "Failed to create booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Create a new service booking
  createServiceBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const serviceBookingRequest: CreateServiceBookingRequest = req.body
      const guestId = req.user?.id

      if (!guestId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Get provider ID from listing
      const providerId = await this.getProviderIdFromListing(serviceBookingRequest.listingId)

      if (!providerId) {
        res.status(404).json({
          error: "Not Found",
          message: "Service provider not found",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const serviceBooking = await this.bookingService.createServiceBooking(
        serviceBookingRequest,
        guestId,
        providerId
      )

      res.status(201).json({
        success: true,
        data: serviceBooking,
        message: "Service booking created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error creating service booking:", error)

      res.status(error.message.includes("not available") ? 409 : 500).json({
        error: error.message.includes("not available") ? "Conflict" : "Internal Server Error",
        message: error.message || "Failed to create service booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get booking by ID
  getBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const booking = await this.bookingService.getBookingById(bookingId)

      if (!booking) {
        res.status(404).json({
          error: "Not Found",
          message: "Booking not found",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check if user has access to this booking
      if (booking.guestId !== userId && booking.hostId !== userId) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to this booking",
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting booking:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get service booking by ID
  getServiceBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const serviceBooking = await this.bookingService.getServiceBookingById(bookingId)

      if (!serviceBooking) {
        res.status(404).json({
          error: "Not Found",
          message: "Service booking not found",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check if user has access to this booking
      if (serviceBooking.guestId !== userId && serviceBooking.hostId !== userId) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to this service booking",
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.json({
        success: true,
        data: serviceBooking,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting service booking:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve service booking",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Update booking status
  updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { bookingId } = req.params
      const updateRequest: UpdateStatusRequest = req.body
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check if user has permission to update this booking
      const existingBooking = await this.bookingService.getBookingById(bookingId)
      if (!existingBooking) {
        res.status(404).json({
          error: "Not Found",
          message: "Booking not found",
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (existingBooking.guestId !== userId && existingBooking.hostId !== userId) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to update this booking",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const updatedBooking = await this.bookingService.updateBookingStatus(
        bookingId,
        updateRequest,
        userId
      )

      res.json({
        success: true,
        data: updatedBooking,
        message: "Booking status updated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error updating booking status:", error)

      const statusCode = error.message.includes("Invalid status transition") ? 400 : 500

      res.status(statusCode).json({
        error: statusCode === 400 ? "Bad Request" : "Internal Server Error",
        message: error.message || "Failed to update booking status",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Search bookings with filters
  searchBookings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

      // Build filters from query parameters
      const filters: BookingFilters = {
        ...(req.query.status && { status: req.query.status as any }),
        ...(req.query.type && { type: req.query.type as any }),
        ...(req.query.paymentStatus && {
          paymentStatus: req.query.paymentStatus as any,
        }),
        ...(req.query.guestId && { guestId: req.query.guestId as string }),
        ...(req.query.hostId && { hostId: req.query.hostId as string }),
        ...(req.query.startDate &&
          req.query.endDate && {
            dateRange: {
              startDate: req.query.startDate as string,
              endDate: req.query.endDate as string,
            },
          }),
        ...(req.query.minPrice &&
          req.query.maxPrice && {
            priceRange: {
              min: parseFloat(req.query.minPrice as string),
              max: parseFloat(req.query.maxPrice as string),
              currency: "THB",
            },
          }),
      }

      // Ensure user can only see their own bookings unless they're an admin
      const userRole = req.user?.role
      if (userRole !== "admin") {
        // User can see bookings where they are either guest or host
        if (!filters.guestId && !filters.hostId) {
          // If no specific filter, show user's bookings
          filters.guestId = userId
        } else {
          // Validate user has access to the filtered bookings
          if (filters.guestId && filters.guestId !== userId) {
            res.status(403).json({
              error: "Forbidden",
              message: "Access denied to other users bookings",
              timestamp: new Date().toISOString(),
            })
            return
          }
          if (filters.hostId && filters.hostId !== userId) {
            res.status(403).json({
              error: "Forbidden",
              message: "Access denied to other hosts bookings",
              timestamp: new Date().toISOString(),
            })
            return
          }
        }
      }

      const result = await this.bookingService.searchBookings(filters, page, limit)

      res.json({
        success: true,
        data: result.bookings,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / result.limit),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error searching bookings:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to search bookings",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get booking status history
  getBookingStatusHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User authentication required",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check if user has access to this booking
      const booking = await this.bookingService.getBookingById(bookingId)
      if (!booking) {
        res.status(404).json({
          error: "Not Found",
          message: "Booking not found",
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (booking.guestId !== userId && booking.hostId !== userId) {
        res.status(403).json({
          error: "Forbidden",
          message: "Access denied to this booking history",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const history = await this.bookingService.getBookingStatusHistory(bookingId)

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting booking status history:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve booking status history",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Private helper methods
  private async getHostIdFromListing(listingId: string): Promise<string | null> {
    // Mock implementation - would fetch from listing service
    // In real implementation, this would make an HTTP request to listing service
    return "host-123"
  }

  private async getProviderIdFromListing(listingId: string): Promise<string | null> {
    // Mock implementation - would fetch from listing service
    // In real implementation, this would make an HTTP request to listing service
    return "provider-123"
  }
}
