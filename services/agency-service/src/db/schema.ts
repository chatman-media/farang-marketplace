import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core"

// Enums
export const serviceCategory = pgEnum("service_category", [
  "delivery",
  "emergency",
  "maintenance",
  "insurance",
  "cleaning",
  "security",
  "transportation",
  "legal",
  "financial",
  "marketing",
  "consulting",
  "other",
])

export const agencyStatus = pgEnum("agency_status", ["pending", "active", "suspended", "inactive", "rejected"])

export const verificationStatus = pgEnum("verification_status", ["pending", "verified", "rejected", "expired"])

export const serviceAssignmentStatus = pgEnum("service_assignment_status", [
  "active",
  "paused",
  "completed",
  "cancelled",
])

// Main Tables
export const agencies = pgTable(
  "agencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    // Basic Information
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    businessRegistrationNumber: varchar("business_registration_number", {
      length: 100,
    }),
    taxId: varchar("tax_id", { length: 50 }),

    // Contact Information
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    website: varchar("website", { length: 255 }),

    // Location and Coverage
    primaryLocation: jsonb("primary_location").notNull(), // Location interface
    coverageAreas: jsonb("coverage_areas").notNull().default("[]"), // Location[]

    // Business Details
    commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.15"),
    minimumOrderValue: decimal("minimum_order_value", {
      precision: 12,
      scale: 2,
    }).default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),

    // Status and Verification
    status: agencyStatus("status").notNull().default("pending"),
    verificationStatus: verificationStatus("verification_status").notNull().default("pending"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Performance Metrics
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    totalReviews: decimal("total_reviews", { precision: 10, scale: 0 }).default("0"),
    totalOrders: decimal("total_orders", { precision: 10, scale: 0 }).default("0"),
    completedOrders: decimal("completed_orders", {
      precision: 10,
      scale: 0,
    }).default("0"),

    // Documents and Verification
    documents: jsonb("documents").default("{}"), // Store document URLs and metadata
    verificationNotes: text("verification_notes"),

    // Settings
    settings: jsonb("settings").default("{}"),
    metadata: jsonb("metadata").default("{}"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
    lastActiveAt: timestamp("last_active_at"),
  },
  (table) => ({
    userIdIdx: index("agencies_user_id_idx").on(table.userId),
    statusIdx: index("agencies_status_idx").on(table.status),
    verificationStatusIdx: index("agencies_verification_status_idx").on(table.verificationStatus),
    ratingIdx: index("agencies_rating_idx").on(table.rating),
    emailIdx: index("agencies_email_idx").on(table.email),
  }),
)

export const agencyServices = pgTable(
  "agency_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),

    // Service Details
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: serviceCategory("category").notNull(),

    // Pricing
    basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),
    pricingModel: varchar("pricing_model", { length: 50 }).notNull().default("fixed"), // fixed, hourly, per_item

    // Service Configuration
    isActive: boolean("is_active").notNull().default(true),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    estimatedDuration: varchar("estimated_duration", { length: 100 }), // e.g., "2-4 hours"

    // Requirements and Capabilities
    requirements: jsonb("requirements").default("[]"), // string[]
    capabilities: jsonb("capabilities").default("[]"), // string[]

    // Metadata
    metadata: jsonb("metadata").default("{}"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    agencyIdIdx: index("agency_services_agency_id_idx").on(table.agencyId),
    categoryIdx: index("agency_services_category_idx").on(table.category),
    isActiveIdx: index("agency_services_is_active_idx").on(table.isActive),
  }),
)

export const serviceAssignments = pgTable(
  "service_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    agencyServiceId: uuid("agency_service_id")
      .notNull()
      .references(() => agencyServices.id, { onDelete: "cascade" }),

    // Assignment Details
    listingId: uuid("listing_id").notNull(), // Reference to listing in listing-service
    bookingId: uuid("booking_id"), // Reference to booking in booking-service (optional)

    // Pricing and Commission
    servicePrice: decimal("service_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    commissionAmount: decimal("commission_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    commissionRate: decimal("commission_rate", {
      precision: 5,
      scale: 4,
    }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),

    // Status and Tracking
    status: serviceAssignmentStatus("status").notNull().default("active"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    // Performance Tracking
    customerRating: decimal("customer_rating", { precision: 3, scale: 2 }),
    customerFeedback: text("customer_feedback"),
    agencyNotes: text("agency_notes"),

    // Metadata
    metadata: jsonb("metadata").default("{}"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    agencyIdIdx: index("service_assignments_agency_id_idx").on(table.agencyId),
    listingIdIdx: index("service_assignments_listing_id_idx").on(table.listingId),
    bookingIdIdx: index("service_assignments_booking_id_idx").on(table.bookingId),
    statusIdx: index("service_assignments_status_idx").on(table.status),
    assignedAtIdx: index("service_assignments_assigned_at_idx").on(table.assignedAt),
  }),
)

export const commissionPayments = pgTable(
  "commission_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    serviceAssignmentId: uuid("service_assignment_id")
      .notNull()
      .references(() => serviceAssignments.id, { onDelete: "cascade" }),

    // Payment Details
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),

    // External References
    paymentId: uuid("payment_id"), // Reference to payment in payment-service
    transactionId: varchar("transaction_id", { length: 255 }),

    // Status
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    paidAt: timestamp("paid_at"),

    // Metadata
    metadata: jsonb("metadata").default("{}"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    agencyIdIdx: index("commission_payments_agency_id_idx").on(table.agencyId),
    serviceAssignmentIdIdx: index("commission_payments_service_assignment_id_idx").on(table.serviceAssignmentId),
    statusIdx: index("commission_payments_status_idx").on(table.status),
    paidAtIdx: index("commission_payments_paid_at_idx").on(table.paidAt),
  }),
)

// Type exports
export type Agency = typeof agencies.$inferSelect
export type NewAgency = typeof agencies.$inferInsert
export type AgencyService = typeof agencyServices.$inferSelect
export type NewAgencyService = typeof agencyServices.$inferInsert
export type ServiceAssignment = typeof serviceAssignments.$inferSelect
export type NewServiceAssignment = typeof serviceAssignments.$inferInsert
export type CommissionPayment = typeof commissionPayments.$inferSelect
export type NewCommissionPayment = typeof commissionPayments.$inferInsert

// Export enum types
export type ServiceCategoryType = (typeof serviceCategory.enumValues)[number]
export type AgencyStatusType = (typeof agencyStatus.enumValues)[number]
export type VerificationStatusType = (typeof verificationStatus.enumValues)[number]
export type ServiceAssignmentStatusType = (typeof serviceAssignmentStatus.enumValues)[number]

// Relations for better querying
export const agencyRelations = {
  services: agencyServices,
  assignments: serviceAssignments,
  commissionPayments,
}

export const agencyServiceRelations = {
  agency: agencies,
  assignments: serviceAssignments,
}

export const serviceAssignmentRelations = {
  agency: agencies,
  agencyService: agencyServices,
  commissionPayments,
}
