import { eq, and, gte, lte, or, desc, asc, count, sql } from "drizzle-orm"
import { db } from "../db/connection.js"
import {
  bookings,
  serviceBookings,
  bookingStatusHistory,
  availabilityConflicts,
  disputes,
  type BookingStatus,
  type BookingType,
  type PaymentStatus,
} from "../db/schema.js"
import type {
  Booking,
  ServiceBooking,
  CreateBookingRequest,
  CreateServiceBookingRequest,
  BookingFilters,
  ServiceBookingFilters,
  UpdateStatusRequest,
} from "@marketplace/shared-types"
import { AvailabilityService } from "./AvailabilityService"
import { PricingService } from "./PricingService"

export class BookingService {
  private availabilityService: AvailabilityService
  private pricingService: PricingService

  constructor() {
    this.availabilityService = new AvailabilityService()
    this.pricingService = new PricingService()
  }

  // Create a new booking
  async createBooking(
    request: CreateBookingRequest,
    guestId: string,
    hostId: string
  ): Promise<Booking> {
    return db.transaction(async (tx) => {
      // 1. Check availability
      const isAvailable = await this.availabilityService.checkAvailability(
        request.listingId,
        new Date(request.checkIn),
        request.checkOut ? new Date(request.checkOut) : undefined
      )

      if (!isAvailable) {
        throw new Error("Selected dates are not available")
      }

      // 2. Calculate pricing
      const pricing = await this.pricingService.calculateBookingPrice({
        listingId: request.listingId,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        guests: request.guests,
      })

      // 3. Create booking record
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          listingId: request.listingId,
          guestId,
          hostId,
          type: "accommodation" as const,
          checkIn: new Date(request.checkIn),
          checkOut: request.checkOut ? new Date(request.checkOut) : null,
          guests: request.guests,
          basePrice: pricing.basePrice.toString(),
          serviceFees: pricing.serviceFees.toString(),
          taxes: pricing.taxes.toString(),
          totalPrice: pricing.totalPrice.toString(),
          currency: pricing.currency,
          specialRequests: request.specialRequests,
        })
        .returning()

      // 4. Create availability conflict
      await this.availabilityService.createConflict(
        request.listingId,
        new Date(request.checkIn),
        request.checkOut ? new Date(request.checkOut) : new Date(request.checkIn),
        "booking",
        newBooking.id,
        guestId
      )

      // 5. Record status history
      await this.recordStatusChange(newBooking.id, null, "pending", "Booking created", guestId, {
        automaticChange: true,
        systemReason: "booking_creation",
      })

      return this.mapBookingFromDb(newBooking)
    })
  }

  // Create a service booking
  async createServiceBooking(
    request: CreateServiceBookingRequest,
    guestId: string,
    providerId: string
  ): Promise<ServiceBooking> {
    return db.transaction(async (tx) => {
      // 1. Check service provider availability
      const isAvailable = await this.availabilityService.checkServiceAvailability(
        providerId,
        new Date(request.scheduledDate),
        request.duration
      )

      if (!isAvailable) {
        throw new Error("Service provider is not available at the requested time")
      }

      // 2. Calculate pricing for service
      const pricing = await this.pricingService.calculateServicePrice({
        listingId: request.listingId,
        serviceType: request.serviceType,
        duration: request.duration,
        deliveryMethod: request.deliveryMethod,
      })

      // 3. Create main booking record
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          listingId: request.listingId,
          guestId,
          hostId: providerId,
          type: "service" as const,
          checkIn: new Date(request.scheduledDate),
          checkOut: null,
          guests: 1,
          basePrice: pricing.basePrice.toString(),
          serviceFees: pricing.serviceFees.toString(),
          taxes: pricing.taxes.toString(),
          totalPrice: pricing.totalPrice.toString(),
          currency: pricing.currency,
          specialRequests: request.specialRequests,
        })
        .returning()

      // 4. Create service booking record
      const [newServiceBooking] = await tx
        .insert(serviceBookings)
        .values({
          bookingId: newBooking.id,
          serviceType: request.serviceType,
          providerId,
          scheduledDate: new Date(request.scheduledDate),
          scheduledTime: request.scheduledTime,
          duration: request.duration,
          deliveryMethod: request.deliveryMethod,
          location: request.location,
          requirements: request.requirements,
          deliverables: request.deliverables,
          communicationPreference: request.communicationPreference,
          timezone: request.timezone,
        })
        .returning()

      // 5. Record status history
      await this.recordStatusChange(
        newBooking.id,
        null,
        "pending",
        "Service booking created",
        guestId,
        {
          automaticChange: true,
          systemReason: "service_booking_creation",
        }
      )

      return this.mapServiceBookingFromDb(newBooking, newServiceBooking)
    })
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string,
    request: UpdateStatusRequest,
    userId: string
  ): Promise<Booking> {
    return db.transaction(async (tx) => {
      // 1. Get current booking
      const [currentBooking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (!currentBooking) {
        throw new Error("Booking not found")
      }

      // 2. Validate status transition
      this.validateStatusTransition(currentBooking.status, request.status)

      // 3. Update booking
      const [updatedBooking] = await tx
        .update(bookings)
        .set({
          status: request.status,
          updatedAt: new Date(),
          ...(request.status === "confirmed" && { confirmedAt: new Date() }),
          ...(request.status === "completed" && { completedAt: new Date() }),
          ...(request.status === "cancelled" && {
            cancellationDate: new Date(),
            cancellationReason: "user_request",
          }),
        })
        .where(eq(bookings.id, bookingId))
        .returning()

      // 4. Record status history
      await this.recordStatusChange(
        bookingId,
        currentBooking.status,
        request.status,
        request.reason || "Status updated",
        userId
      )

      // 5. Handle status-specific logic
      await this.handleStatusChange(updatedBooking, currentBooking.status, request.status)

      return this.mapBookingFromDb(updatedBooking)
    })
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<Booking | null> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)

    return booking ? this.mapBookingFromDb(booking) : null
  }

  // Get service booking by ID
  async getServiceBookingById(bookingId: string): Promise<ServiceBooking | null> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(serviceBookings, eq(bookings.id, serviceBookings.bookingId))
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!result[0] || !result[0].service_bookings) {
      return null
    }

    return this.mapServiceBookingFromDb(result[0].bookings, result[0].service_bookings)
  }

  // Search bookings with filters
  async searchBookings(
    filters: BookingFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    bookings: Booking[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    const offset = (page - 1) * limit
    const conditions = this.buildBookingFilters(filters)

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(bookings)
      .where(conditions)

    // Get bookings
    const bookingResults = await db
      .select()
      .from(bookings)
      .where(conditions)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      bookings: bookingResults.map(this.mapBookingFromDb),
      total: totalCount,
      page,
      limit,
      hasMore: offset + bookingResults.length < totalCount,
    }
  }

  // Get booking status history
  async getBookingStatusHistory(bookingId: string) {
    return db
      .select()
      .from(bookingStatusHistory)
      .where(eq(bookingStatusHistory.bookingId, bookingId))
      .orderBy(asc(bookingStatusHistory.changedAt))
  }

  // Private helper methods
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    // Validate that statuses are valid enum values
    const validStatuses: BookingStatus[] = [
      "pending",
      "confirmed",
      "active",
      "completed",
      "cancelled",
      "disputed",
    ]
    if (
      !validStatuses.includes(currentStatus as BookingStatus) ||
      !validStatuses.includes(newStatus as BookingStatus)
    ) {
      throw new Error("Invalid booking status")
    }

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["active", "cancelled"],
      active: ["completed", "cancelled", "disputed"],
      completed: ["disputed"],
      cancelled: [],
      disputed: ["cancelled"], // Disputed bookings can only be cancelled
    }

    const allowedStatuses = validTransitions[currentStatus as BookingStatus] || []
    if (!allowedStatuses.includes(newStatus as BookingStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }
  }

  private async recordStatusChange(
    bookingId: string,
    fromStatus: string | null,
    toStatus: string,
    reason: string,
    changedBy: string,
    metadata?: any
  ): Promise<void> {
    await db.insert(bookingStatusHistory).values({
      bookingId,
      fromStatus: fromStatus as any,
      toStatus: toStatus as any,
      reason,
      changedBy,
      metadata,
    })
  }

  private async handleStatusChange(
    booking: any,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    // Handle status-specific business logic
    switch (toStatus) {
      case "cancelled":
        // Remove availability conflict when booking is cancelled
        await this.removeAvailabilityConflict(booking.id)
        break
      case "confirmed":
        // Create availability conflict when booking is confirmed
        await this.createAvailabilityConflict(booking)
        break
      case "disputed":
        // Create dispute record when booking is disputed
        await this.createDispute(booking.id, fromStatus, toStatus)
        break
      case "completed":
        // Handle completion logic, reviews, etc.
        break
    }
  }

  private async createAvailabilityConflict(booking: any): Promise<void> {
    await db.insert(availabilityConflicts).values({
      listingId: booking.listingId,
      bookingId: booking.id,
      conflictType: "booking",
      startDate: booking.checkIn,
      endDate: booking.checkOut || booking.checkIn,
      reason: "Confirmed booking",
      createdBy: booking.hostId, // Host creates the conflict
    })
  }

  private async removeAvailabilityConflict(bookingId: string): Promise<void> {
    await db.delete(availabilityConflicts).where(eq(availabilityConflicts.bookingId, bookingId))
  }

  private async createDispute(
    bookingId: string,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    // Get booking details to find who initiated the dispute
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)

    if (booking) {
      await db.insert(disputes).values({
        bookingId,
        initiatedBy: booking.guestId, // Guest initiates the dispute
        disputeType: "cancellation",
        title: "Booking Status Dispute",
        description: `Status changed from ${fromStatus} to ${toStatus}`,
      })
    }
  }

  private buildBookingFilters(filters: BookingFilters) {
    const conditions = []

    if (filters.status) {
      conditions.push(eq(bookings.status, filters.status))
    }

    if (filters.type) {
      conditions.push(eq(bookings.type, filters.type))
    }

    if (filters.guestId) {
      conditions.push(eq(bookings.guestId, filters.guestId))
    }

    if (filters.hostId) {
      conditions.push(eq(bookings.hostId, filters.hostId))
    }

    if (filters.paymentStatus) {
      conditions.push(eq(bookings.paymentStatus, filters.paymentStatus as any))
    }

    if (filters.dateRange) {
      conditions.push(
        and(
          gte(bookings.checkIn, new Date(filters.dateRange.startDate)),
          lte(bookings.checkIn, new Date(filters.dateRange.endDate))
        )
      )
    }

    if (filters.priceRange) {
      conditions.push(
        and(
          gte(bookings.totalPrice, filters.priceRange.min.toString()),
          lte(bookings.totalPrice, filters.priceRange.max.toString())
        )
      )
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  private mapBookingFromDb(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      listingId: dbBooking.listingId,
      guestId: dbBooking.guestId,
      hostId: dbBooking.hostId,
      type: dbBooking.type,
      status: dbBooking.status,
      checkIn: dbBooking.checkIn.toISOString(),
      checkOut: dbBooking.checkOut?.toISOString(),
      guests: dbBooking.guests,
      totalPrice: parseFloat(dbBooking.totalPrice),
      currency: dbBooking.currency,
      paymentStatus: dbBooking.paymentStatus,
      specialRequests: dbBooking.specialRequests,
      createdAt: dbBooking.createdAt.toISOString(),
      updatedAt: dbBooking.updatedAt.toISOString(),
    }
  }

  private mapServiceBookingFromDb(dbBooking: any, dbServiceBooking: any): ServiceBooking {
    const baseBooking = this.mapBookingFromDb(dbBooking)

    return {
      ...baseBooking,
      serviceType: dbServiceBooking.serviceType,
      providerId: dbServiceBooking.providerId,
      scheduledDate: dbServiceBooking.scheduledDate.toISOString(),
      scheduledTime: dbServiceBooking.scheduledTime,
      duration: dbServiceBooking.duration,
      deliveryMethod: dbServiceBooking.deliveryMethod,
      location: dbServiceBooking.location,
      requirements: dbServiceBooking.requirements,
      deliverables: dbServiceBooking.deliverables,
      milestones: dbServiceBooking.milestones,
      communicationPreference: dbServiceBooking.communicationPreference,
      timezone: dbServiceBooking.timezone,
    }
  }
}
