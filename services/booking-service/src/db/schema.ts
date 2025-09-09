import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const bookingTypeEnum = pgEnum("booking_type", [
  "accommodation",
  "transportation",
  "tour",
  "activity",
  "dining",
  "event",
  "service",
])

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "active",
  "completed",
  "cancelled",
  "no_show",
  "expired",
  "disputed",
])

export const serviceBookingTypeEnum = pgEnum("service_booking_type", [
  "consultation",
  "project",
  "hourly",
  "package",
  "subscription",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
])

export const cancellationReasonEnum = pgEnum("cancellation_reason", [
  "user_request",
  "host_unavailable",
  "payment_failed",
  "policy_violation",
  "force_majeure",
  "system_error",
])

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "investigating", "resolved", "closed"])

// Type exports for TypeScript
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number]
export type BookingType = (typeof bookingTypeEnum.enumValues)[number]
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]
export type ServiceBookingType = (typeof serviceBookingTypeEnum.enumValues)[number]
export type DisputeStatus = (typeof disputeStatusEnum.enumValues)[number]

// Main Bookings Table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull(),
    guestId: uuid("guest_id").notNull(),
    hostId: uuid("host_id").notNull(),
    agencyId: uuid("agency_id"),
    type: bookingTypeEnum("type").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),

    // Booking Details
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }),
    nights: integer("nights").notNull(),

    // Guest Details
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    infants: integer("infants").notNull().default(0),
    guests: integer("guests").notNull().default(1), // total guests

    // Pricing
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    serviceFees: decimal("service_fees", { precision: 10, scale: 2 }).default("0"),
    taxes: decimal("taxes", { precision: 10, scale: 2 }).default("0"),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),

    // Payment
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paymentId: varchar("payment_id", { length: 255 }),
    paymentMethod: varchar("payment_method", { length: 50 }),

    // Additional Information
    specialRequests: text("special_requests"),
    hostNotes: text("host_notes"),
    guestNotes: text("guest_notes"),

    // Cancellation
    cancellationReason: cancellationReasonEnum("cancellation_reason"),
    cancellationDate: timestamp("cancellation_date", { withTimezone: true }),
    cancellationPolicy: jsonb("cancellation_policy").$type<{
      type: "flexible" | "moderate" | "strict"
      refundPercentage: number
      deadlineHours: number
    }>(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      source?: string
      userAgent?: string
      ipAddress?: string
      referrer?: string
    }>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    listingIdIdx: index("bookings_listing_id_idx").on(table.listingId),
    guestIdIdx: index("bookings_guest_id_idx").on(table.guestId),
    hostIdIdx: index("bookings_host_id_idx").on(table.hostId),
    statusIdx: index("bookings_status_idx").on(table.status),
    checkInIdx: index("bookings_check_in_idx").on(table.checkIn),
    paymentStatusIdx: index("bookings_payment_status_idx").on(table.paymentStatus),
  }),
)

// Service Bookings Table (extends bookings for service-specific fields)
export const serviceBookings = pgTable(
  "service_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    serviceType: serviceBookingTypeEnum("service_type").notNull(),
    providerId: uuid("provider_id").notNull(),

    // Scheduling
    scheduledDate: timestamp("scheduled_date", {
      withTimezone: true,
    }).notNull(),
    scheduledTime: varchar("scheduled_time", { length: 8 }), // HH:MM:SS format
    duration: jsonb("duration")
      .$type<{
        value: number
        unit: "minutes" | "hours" | "days" | "weeks" | "months"
      }>()
      .notNull(),
    timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Bangkok"),

    // Service Details
    deliveryMethod: varchar("delivery_method", { length: 20 }).notNull(), // 'online' | 'in_person' | 'hybrid'
    location: jsonb("location").$type<{
      address: string
      coordinates?: {
        latitude: number
        longitude: number
      }
    }>(),

    // Requirements and Deliverables
    requirements: jsonb("requirements").$type<string[]>().default([]),
    deliverables: jsonb("deliverables").$type<string[]>().default([]),

    // Communication
    communicationPreference: varchar("communication_preference", {
      length: 20,
    }).notNull(), // 'email' | 'phone' | 'chat' | 'video_call'

    // Milestones for project-based services
    milestones: jsonb("milestones")
      .$type<
        Array<{
          id: string
          title: string
          description: string
          dueDate: string
          status: "pending" | "in_progress" | "completed" | "overdue"
          payment?: {
            amount: number
            currency: string
            status: "pending" | "paid" | "failed"
          }
        }>
      >()
      .default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookingIdIdx: index("service_bookings_booking_id_idx").on(table.bookingId),
    providerIdIdx: index("service_bookings_provider_id_idx").on(table.providerId),
    scheduledDateIdx: index("service_bookings_scheduled_date_idx").on(table.scheduledDate),
    serviceTypeIdx: index("service_bookings_service_type_idx").on(table.serviceType),
  }),
)

// Booking Status History
export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    reason: text("reason"),
    changedBy: uuid("changed_by").notNull(), // user ID who made the change
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<{
      automaticChange?: boolean
      systemReason?: string
      userAgent?: string
    }>(),
  },
  (table) => ({
    bookingIdIdx: index("booking_status_history_booking_id_idx").on(table.bookingId),
    changedAtIdx: index("booking_status_history_changed_at_idx").on(table.changedAt),
  }),
)

// Availability Conflicts
export const availabilityConflicts = pgTable(
  "availability_conflicts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull(),
    conflictType: varchar("conflict_type", { length: 50 }).notNull(), // 'booking', 'maintenance', 'blocked'
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "cascade",
    }),
    reason: text("reason"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    listingIdIdx: index("availability_conflicts_listing_id_idx").on(table.listingId),
    dateRangeIdx: index("availability_conflicts_date_range_idx").on(table.startDate, table.endDate),
  }),
)

// Disputes
export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    initiatedBy: uuid("initiated_by").notNull(), // guest or host ID
    disputeType: varchar("dispute_type", { length: 50 }).notNull(), // 'refund', 'damage', 'service_quality', 'cancellation'
    status: disputeStatusEnum("status").notNull().default("open"),

    // Dispute Details
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence")
      .$type<
        Array<{
          type: "image" | "document" | "message"
          url: string
          description?: string
          uploadedAt: string
        }>
      >()
      .default([]),

    // Resolution
    resolution: text("resolution"),
    resolvedBy: uuid("resolved_by"), // admin/moderator ID
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bookingIdIdx: index("disputes_booking_id_idx").on(table.bookingId),
    statusIdx: index("disputes_status_idx").on(table.status),
    initiatedByIdx: index("disputes_initiated_by_idx").on(table.initiatedBy),
  }),
)

// Relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  serviceBooking: one(serviceBookings, {
    fields: [bookings.id],
    references: [serviceBookings.bookingId],
  }),
  statusHistory: many(bookingStatusHistory),
  disputes: many(disputes),
}))

export const serviceBookingsRelations = relations(serviceBookings, ({ one }) => ({
  booking: one(bookings, {
    fields: [serviceBookings.bookingId],
    references: [bookings.id],
  }),
}))

export const bookingStatusHistoryRelations = relations(bookingStatusHistory, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingStatusHistory.bookingId],
    references: [bookings.id],
  }),
}))

export const disputesRelations = relations(disputes, ({ one }) => ({
  booking: one(bookings, {
    fields: [disputes.bookingId],
    references: [bookings.id],
  }),
}))

export const availabilityConflictsRelations = relations(availabilityConflicts, ({ one }) => ({
  booking: one(bookings, {
    fields: [availabilityConflicts.bookingId],
    references: [bookings.id],
  }),
}))
