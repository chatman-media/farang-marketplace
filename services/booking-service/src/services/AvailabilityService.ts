import { and, between, eq, gte, lte, or } from "drizzle-orm"

import { db } from "../db/connection"
import { availabilityConflicts, bookings, serviceBookings } from "../db/schema"

export interface TimeSlot {
  start: string // HH:MM format
  end: string // HH:MM format
}

export interface AvailabilityWindow {
  date: string
  available: boolean
  conflicts: Array<{
    type: "booking" | "maintenance" | "blocked"
    startTime?: string
    endTime?: string
    reason?: string
  }>
}

export interface ServiceAvailability {
  providerId: string
  date: string
  timeSlots: Array<{
    start: string
    end: string
    available: boolean
    bookingId?: string
  }>
}

export class AvailabilityService {
  // Check if a listing is available for the given date range
  async checkAvailability(listingId: string, checkIn: Date, checkOut?: Date): Promise<boolean> {
    const endDate = checkOut || checkIn

    // Check for existing conflicts
    const conflicts = await db
      .select()
      .from(availabilityConflicts)
      .where(
        and(
          eq(availabilityConflicts.listingId, listingId),
          or(
            // Conflict starts within our range
            and(gte(availabilityConflicts.startDate, checkIn), lte(availabilityConflicts.startDate, endDate)),
            // Conflict ends within our range
            and(gte(availabilityConflicts.endDate, checkIn), lte(availabilityConflicts.endDate, endDate)),
            // Our range is within the conflict
            and(lte(availabilityConflicts.startDate, checkIn), gte(availabilityConflicts.endDate, endDate)),
          ),
        ),
      )

    return conflicts.length === 0
  }

  // Check service provider availability for a specific time
  async checkServiceAvailability(
    providerId: string,
    scheduledDate: Date,
    duration: { value: number; unit: string },
  ): Promise<boolean> {
    const endTime = this.calculateEndTime(scheduledDate, duration)

    // Check for existing service bookings that conflict
    const conflictingBookings = await db
      .select()
      .from(serviceBookings)
      .innerJoin(bookings, eq(serviceBookings.bookingId, bookings.id))
      .where(
        and(
          eq(serviceBookings.providerId, providerId),
          eq(bookings.status, "confirmed"),
          // Check if the scheduled date conflicts
          or(
            // Existing booking starts within our time
            and(gte(serviceBookings.scheduledDate, scheduledDate), lte(serviceBookings.scheduledDate, endTime)),
            // Our booking starts within existing booking time
            and(
              lte(serviceBookings.scheduledDate, scheduledDate),
              gte(serviceBookings.scheduledDate, scheduledDate), // Simplified for now
            ),
          ),
        ),
      )

    return conflictingBookings.length === 0
  }

  // Get availability calendar for a listing
  async getAvailabilityCalendar(listingId: string, startDate: Date, endDate: Date): Promise<AvailabilityWindow[]> {
    const conflicts = await db
      .select()
      .from(availabilityConflicts)
      .where(
        and(
          eq(availabilityConflicts.listingId, listingId),
          or(
            between(availabilityConflicts.startDate, startDate, endDate),
            between(availabilityConflicts.endDate, startDate, endDate),
            and(lte(availabilityConflicts.startDate, startDate), gte(availabilityConflicts.endDate, endDate)),
          ),
        ),
      )

    const calendar: AvailabilityWindow[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]
      const dayConflicts = conflicts.filter((conflict) => {
        const conflictStart = conflict.startDate.toISOString().split("T")[0]
        const conflictEnd = conflict.endDate.toISOString().split("T")[0]
        return dateStr >= conflictStart && dateStr <= conflictEnd
      })

      calendar.push({
        date: dateStr,
        available: dayConflicts.length === 0,
        conflicts: dayConflicts.map((conflict) => ({
          type: conflict.conflictType as "booking" | "maintenance" | "blocked",
          reason: conflict.reason || undefined,
        })),
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return calendar
  }

  // Get service provider availability for a specific date
  async getServiceProviderAvailability(providerId: string, date: Date): Promise<ServiceAvailability> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get existing bookings for the day
    const existingBookings = await db
      .select()
      .from(serviceBookings)
      .innerJoin(bookings, eq(serviceBookings.bookingId, bookings.id))
      .where(
        and(
          eq(serviceBookings.providerId, providerId),
          gte(serviceBookings.scheduledDate, startOfDay),
          lte(serviceBookings.scheduledDate, endOfDay),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "active")),
        ),
      )

    // Generate time slots (assuming 1-hour slots from 9 AM to 6 PM)
    const timeSlots = this.generateTimeSlots()

    const availableSlots = timeSlots.map((slot) => {
      const slotStart = this.parseTimeSlot(date, slot.start)
      const slotEnd = this.parseTimeSlot(date, slot.end)

      const conflictingBooking = existingBookings.find((booking) => {
        const bookingStart = booking.service_bookings.scheduledDate
        const bookingEnd = this.calculateServiceEndTime(booking.service_bookings)

        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        )
      })

      return {
        start: slot.start,
        end: slot.end,
        available: !conflictingBooking,
        bookingId: conflictingBooking?.bookings.id,
      }
    })

    return {
      providerId,
      date: date.toISOString().split("T")[0],
      timeSlots: availableSlots,
    }
  }

  // Create an availability conflict
  async createConflict(
    listingId: string,
    startDate: Date,
    endDate: Date,
    conflictType: "booking" | "maintenance" | "blocked",
    bookingId?: string,
    createdBy?: string,
    reason?: string,
  ): Promise<void> {
    await db.insert(availabilityConflicts).values({
      listingId,
      conflictType,
      startDate,
      endDate,
      bookingId,
      reason,
      createdBy: createdBy || "system",
    })
  }

  // Remove an availability conflict
  async removeConflict(bookingId: string): Promise<void> {
    await db.delete(availabilityConflicts).where(eq(availabilityConflicts.bookingId, bookingId))
  }

  // Block dates for maintenance or other reasons
  async blockDates(
    listingId: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    createdBy: string,
  ): Promise<void> {
    // Check if dates are already blocked or booked
    const isAvailable = await this.checkAvailability(listingId, startDate, endDate)

    if (!isAvailable) {
      throw new Error("Cannot block dates that are already unavailable")
    }

    await this.createConflict(listingId, startDate, endDate, "blocked", undefined, createdBy, reason)
  }

  // Unblock dates
  async unblockDates(listingId: string, startDate: Date, endDate: Date): Promise<void> {
    await db
      .delete(availabilityConflicts)
      .where(
        and(
          eq(availabilityConflicts.listingId, listingId),
          eq(availabilityConflicts.conflictType, "blocked"),
          gte(availabilityConflicts.startDate, startDate),
          lte(availabilityConflicts.endDate, endDate),
        ),
      )
  }

  // Get upcoming bookings for a listing
  async getUpcomingBookings(
    listingId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      bookingId: string
      checkIn: Date
      checkOut?: Date
      guestId: string
      status: string
    }>
  > {
    const now = new Date()

    const upcomingBookings = await db
      .select({
        id: bookings.id,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        guestId: bookings.guestId,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.listingId, listingId),
          gte(bookings.checkIn, now),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "active")),
        ),
      )
      .orderBy(bookings.checkIn)
      .limit(limit)

    return upcomingBookings.map((booking) => ({
      bookingId: booking.id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut || undefined,
      guestId: booking.guestId,
      status: booking.status,
    }))
  }

  // Private helper methods
  private calculateEndTime(startTime: Date, duration: { value: number; unit: string }): Date {
    const endTime = new Date(startTime)

    switch (duration.unit) {
      case "minutes":
        endTime.setMinutes(endTime.getMinutes() + duration.value)
        break
      case "hours":
        endTime.setHours(endTime.getHours() + duration.value)
        break
      case "days":
        endTime.setDate(endTime.getDate() + duration.value)
        break
      case "weeks":
        endTime.setDate(endTime.getDate() + duration.value * 7)
        break
      case "months":
        endTime.setMonth(endTime.getMonth() + duration.value)
        break
    }

    return endTime
  }

  private calculateServiceEndTime(serviceBooking: any): Date {
    const startTime = serviceBooking.scheduledDate
    return this.calculateEndTime(startTime, serviceBooking.duration)
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = []

    for (let hour = 9; hour < 18; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, "0")}:00`,
        end: `${(hour + 1).toString().padStart(2, "0")}:00`,
      })
    }

    return slots
  }

  private parseTimeSlot(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const result = new Date(date)
    result.setHours(hours, minutes, 0, 0)
    return result
  }
}
