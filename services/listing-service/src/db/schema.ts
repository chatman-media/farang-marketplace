import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  json,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const listingCategoryEnum = pgEnum("listing_category", [
  "accommodation",
  "transportation",
  "tours",
  "activities",
  "dining",
  "shopping",
  "services",
  "events",
  "vehicles",
  "products",
])

export const listingTypeEnum = pgEnum("listing_type", [
  "accommodation",
  "service",
  "vehicle",
  "product",
])

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "active",
  "inactive",
  "sold",
  "rented",
  "reserved",
  "maintenance",
  "pending_approval",
  "rejected",
  "expired",
])

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "scooter",
  "motorcycle",
  "car",
  "bicycle",
  "truck",
  "van",
  "bus",
  "boat",
  "jet_ski",
  "atv",
  "other",
])

export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "economy",
  "standard",
  "premium",
  "luxury",
  "sport",
  "electric",
  "classic",
])

export const fuelTypeEnum = pgEnum("fuel_type", [
  "gasoline",
  "diesel",
  "electric",
  "hybrid",
  "lpg",
  "cng",
])

export const transmissionTypeEnum = pgEnum("transmission_type", [
  "manual",
  "automatic",
  "cvt",
  "semi_automatic",
])

export const vehicleConditionEnum = pgEnum("vehicle_condition", [
  "new",
  "excellent",
  "good",
  "fair",
  "poor",
])

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "rented",
  "maintenance",
  "reserved",
  "inactive",
])

export const productTypeEnum = pgEnum("product_type", [
  "vehicle",
  "electronics",
  "furniture",
  "clothing",
  "sports",
  "tools",
  "books",
  "home_garden",
  "jewelry",
  "toys",
  "health_beauty",
  "food_beverage",
  "real_estate",
  "services",
  "other",
])

export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "like_new",
  "excellent",
  "good",
  "fair",
  "poor",
  "for_parts",
])

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "sold",
  "rented",
  "reserved",
  "maintenance",
  "draft",
  "pending_approval",
  "rejected",
])

export const productListingTypeEnum = pgEnum("product_listing_type", [
  "sale",
  "rent",
  "both",
  "service",
])

export const priceTypeEnum = pgEnum("price_type", [
  "fixed",
  "negotiable",
  "auction",
  "quote_on_request",
])

// Main listings table
export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: listingCategoryEnum("category").notNull(),
  type: listingTypeEnum("type").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),

  // Basic pricing
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("THB"),

  // Location
  locationAddress: text("location_address").notNull(),
  locationCity: varchar("location_city", { length: 100 }).notNull(),
  locationRegion: varchar("location_region", { length: 100 }).notNull(),
  locationCountry: varchar("location_country", { length: 100 }).notNull().default("Thailand"),
  locationZipCode: varchar("location_zip_code", { length: 20 }),
  locationLatitude: decimal("location_latitude", { precision: 10, scale: 8 }),
  locationLongitude: decimal("location_longitude", { precision: 11, scale: 8 }),

  // Media
  images: jsonb("images").$type<string[]>().notNull().default([]),
  mainImage: varchar("main_image", { length: 500 }),
  videos: jsonb("videos").$type<string[]>().default([]),

  // SEO and discovery
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  slug: varchar("slug", { length: 250 }),

  // Quality and trust
  isVerified: boolean("is_verified").notNull().default(false),
  verificationDate: timestamp("verification_date"),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  trustScore: decimal("trust_score", { precision: 3, scale: 2 }),

  // Performance metrics
  views: integer("views").notNull().default(0),
  favorites: integer("favorites").notNull().default(0),
  inquiries: integer("inquiries").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),

  // Moderation
  moderationStatus: varchar("moderation_status", { length: 20 }).notNull().default("pending"),
  moderationNotes: text("moderation_notes"),
  flagReasons: jsonb("flag_reasons").$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
})

// Vehicle-specific data
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),

  // Basic vehicle info
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  category: vehicleCategoryEnum("category").notNull(),
  condition: vehicleConditionEnum("condition").notNull(),
  status: vehicleStatusEnum("status").notNull().default("available"),

  // Specifications
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  color: varchar("color", { length: 30 }).notNull(),
  engineSize: varchar("engine_size", { length: 20 }),
  power: varchar("power", { length: 20 }),
  maxSpeed: integer("max_speed"),
  fuelConsumption: decimal("fuel_consumption", { precision: 5, scale: 2 }),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  transmission: transmissionTypeEnum("transmission").notNull(),
  seatingCapacity: integer("seating_capacity").notNull(),
  doors: integer("doors"),

  // Dimensions
  length: integer("length"),
  width: integer("width"),
  height: integer("height"),
  weight: integer("weight"),

  // Features
  features: jsonb("features").$type<string[]>().notNull().default([]),
  safetyFeatures: jsonb("safety_features").$type<string[]>().default([]),
  comfortFeatures: jsonb("comfort_features").$type<string[]>().default([]),
  technologyFeatures: jsonb("technology_features").$type<string[]>().default([]),

  // Documents
  licensePlate: varchar("license_plate", { length: 20 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 50 }),
  engineNumber: varchar("engine_number", { length: 50 }),
  chassisNumber: varchar("chassis_number", { length: 50 }),
  insuranceNumber: varchar("insurance_number", { length: 50 }),
  insuranceExpiry: timestamp("insurance_expiry"),
  techInspectionExpiry: timestamp("tech_inspection_expiry"),
  documentsComplete: boolean("documents_complete").notNull().default(false),
  documentsVerified: boolean("documents_verified").notNull().default(false),
  documentsNotes: text("documents_notes"),

  // Pricing
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  dailyRate: decimal("daily_rate", { precision: 8, scale: 2 }),
  weeklyRate: decimal("weekly_rate", { precision: 8, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 8, scale: 2 }),
  yearlyRate: decimal("yearly_rate", { precision: 8, scale: 2 }),
  securityDeposit: decimal("security_deposit", {
    precision: 10,
    scale: 2,
  }).notNull(),
  insurancePerDay: decimal("insurance_per_day", { precision: 8, scale: 2 }),
  deliveryFee: decimal("delivery_fee", { precision: 8, scale: 2 }),
  pickupFee: decimal("pickup_fee", { precision: 8, scale: 2 }),
  lateFee: decimal("late_fee", { precision: 8, scale: 2 }),
  damageFee: decimal("damage_fee", { precision: 8, scale: 2 }),
  fuelPolicy: varchar("fuel_policy", { length: 20 }).notNull().default("full_to_full"),
  fuelCostPerLiter: decimal("fuel_cost_per_liter", { precision: 5, scale: 2 }),

  // Duration discounts
  durationDiscounts: jsonb("duration_discounts").$type<Record<string, number>>().default({}),

  // Location and delivery
  currentLocation: text("current_location").notNull(),
  pickupLocations: jsonb("pickup_locations").$type<string[]>().notNull().default([]),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  deliveryRadius: integer("delivery_radius"),
  serviceAreas: jsonb("service_areas").$type<string[]>().default([]),
  restrictedAreas: jsonb("restricted_areas").$type<string[]>().default([]),

  // Availability
  isAvailable: boolean("is_available").notNull().default(true),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  blackoutDates: jsonb("blackout_dates").$type<string[]>().default([]),

  // Rental history
  totalRentals: integer("total_rentals").notNull().default(0),
  totalKilometers: integer("total_kilometers").notNull().default(0),

  // Maintenance
  lastServiceDate: timestamp("last_service_date"),
  lastServiceKm: integer("last_service_km"),
  nextServiceDue: timestamp("next_service_due"),
  nextServiceKm: integer("next_service_km"),
  maintenanceNotes: text("maintenance_notes"),

  // GPS and accessories
  gpsTrackerId: varchar("gps_tracker_id", { length: 50 }),
  gpsProvider: varchar("gps_provider", { length: 50 }),
  hasCharger: boolean("has_charger").default(false),
  hasHelmet: boolean("has_helmet").default(false),
  hasLock: boolean("has_lock").default(false),
  accessories: jsonb("accessories").$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastMaintenanceUpdate: timestamp("last_maintenance_update"),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  notes: text("notes"),
})

// Product-specific data
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),

  // Basic product info
  productType: productTypeEnum("product_type").notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  condition: productConditionEnum("condition").notNull(),
  status: productStatusEnum("status").notNull().default("active"),
  listingType: productListingTypeEnum("listing_type").notNull(),

  // Specifications
  brand: varchar("brand", { length: 50 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  manufacturingYear: integer("manufacturing_year"),
  countryOfOrigin: varchar("country_of_origin", { length: 50 }),

  // Physical properties
  length: integer("length"),
  width: integer("width"),
  height: integer("height"),
  weight: integer("weight"),
  volume: integer("volume"),
  material: varchar("material", { length: 100 }),
  size: varchar("size", { length: 50 }),

  // Technical specifications (flexible JSON)
  technicalSpecs: jsonb("technical_specs")
    .$type<Record<string, string | number | boolean>>()
    .default({}),

  // Features and capabilities
  features: jsonb("features").$type<string[]>().notNull().default([]),
  included: jsonb("included").$type<string[]>().default([]),
  requirements: jsonb("requirements").$type<string[]>().default([]),

  // Condition details
  conditionNotes: text("condition_notes"),
  defects: jsonb("defects").$type<string[]>().default([]),
  repairs: jsonb("repairs").$type<string[]>().default([]),

  // Warranty and support
  warrantyPeriod: varchar("warranty_period", { length: 50 }),
  warrantyType: varchar("warranty_type", { length: 20 }),
  supportAvailable: boolean("support_available").default(false),
  manualIncluded: boolean("manual_included").default(false),

  // Pricing
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  priceType: priceTypeEnum("price_type").notNull(),
  originalPrice: decimal("original_price", { precision: 12, scale: 2 }),
  msrp: decimal("msrp", { precision: 12, scale: 2 }),

  // Rental pricing (if applicable)
  rentalPricing: jsonb("rental_pricing").$type<{
    hourly?: number
    daily?: number
    weekly?: number
    monthly?: number
    deposit?: number
    minimumRentalPeriod?: string
  }>(),

  // Additional costs
  shippingCost: decimal("shipping_cost", { precision: 8, scale: 2 }),
  handlingFee: decimal("handling_fee", { precision: 8, scale: 2 }),
  installationFee: decimal("installation_fee", { precision: 8, scale: 2 }),

  // Payment options
  acceptedPayments: jsonb("accepted_payments").$type<string[]>().notNull().default([]),
  installmentAvailable: boolean("installment_available").default(false),
  installmentOptions: jsonb("installment_options")
    .$type<
      {
        months: number
        monthlyPayment: number
        interestRate?: number
      }[]
    >()
    .default([]),

  // Availability
  isAvailable: boolean("is_available").notNull().default(true),
  quantity: integer("quantity"),
  quantityType: varchar("quantity_type", { length: 20 }).default("exact"),
  stockLevel: varchar("stock_level", { length: 20 }).default("in_stock"),
  restockDate: timestamp("restock_date"),

  // Rental availability
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  blackoutDates: jsonb("blackout_dates").$type<string[]>().default([]),

  // Location availability
  availableLocations: jsonb("available_locations").$type<string[]>().default([]),
  pickupLocations: jsonb("pickup_locations").$type<string[]>().default([]),
  deliveryAvailable: boolean("delivery_available").default(false),
  deliveryAreas: jsonb("delivery_areas").$type<string[]>().default([]),
  deliveryTime: varchar("delivery_time", { length: 50 }),

  // Seller information
  sellerId: uuid("seller_id").notNull(),
  sellerType: varchar("seller_type", { length: 20 }).notNull(),
  sellerName: varchar("seller_name", { length: 100 }).notNull(),
  sellerRating: decimal("seller_rating", { precision: 3, scale: 2 }),
  sellerReviews: integer("seller_reviews").default(0),
  isSellerVerified: boolean("is_seller_verified").default(false),
  businessLicense: varchar("business_license", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),

  // Contact information
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactEmail: varchar("contact_email", { length: 100 }),
  contactWebsite: varchar("contact_website", { length: 200 }),
  contactAddress: text("contact_address"),
  socialMedia: jsonb("social_media").$type<Record<string, string>>().default({}),

  // Business details
  businessHours: varchar("business_hours", { length: 100 }),
  languages: jsonb("languages").$type<string[]>().default([]),
  responseTime: varchar("response_time", { length: 50 }),

  // Policies
  returnPolicy: text("return_policy"),
  warrantyPolicy: text("warranty_policy"),
  shippingPolicy: text("shipping_policy"),

  // Documents
  documents: jsonb("documents").$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
})

// Listing availability table for complex scheduling
export const listingAvailability = pgTable("listing_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  price: decimal("price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Listing bookings table
export const listingBookings = pgTable("listing_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  customerId: uuid("customer_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Relations
export const listingsRelations = relations(listings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [listings.id],
    references: [vehicles.listingId],
  }),
  product: one(products, {
    fields: [listings.id],
    references: [products.listingId],
  }),
  availability: many(listingAvailability),
  bookings: many(listingBookings),
}))

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  listing: one(listings, {
    fields: [vehicles.listingId],
    references: [listings.id],
  }),
}))

export const productsRelations = relations(products, ({ one }) => ({
  listing: one(listings, {
    fields: [products.listingId],
    references: [listings.id],
  }),
}))

export const listingAvailabilityRelations = relations(listingAvailability, ({ one }) => ({
  listing: one(listings, {
    fields: [listingAvailability.listingId],
    references: [listings.id],
  }),
}))

export const listingBookingsRelations = relations(listingBookings, ({ one }) => ({
  listing: one(listings, {
    fields: [listingBookings.listingId],
    references: [listings.id],
  }),
}))

// Add new enums for service providers
export const providerTypeEnum = pgEnum("provider_type", [
  "individual",
  "company",
  "agency",
  "freelancer",
])
export const verificationLevelEnum = pgEnum("verification_level", [
  "basic",
  "verified",
  "premium",
  "enterprise",
])
export const availabilityStatusEnum = pgEnum("availability_status", [
  "available",
  "busy",
  "away",
  "offline",
])

// Service Providers table
export const serviceProviders = pgTable("service_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  providerType: providerTypeEnum("provider_type").notNull(),
  businessName: varchar("business_name", { length: 100 }),
  displayName: varchar("display_name", { length: 50 }).notNull(),
  bio: text("bio").notNull(),
  avatar: varchar("avatar", { length: 500 }),
  coverImage: varchar("cover_image", { length: 500 }),

  // Contact Information
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  website: varchar("website", { length: 500 }),
  socialMedia: jsonb("social_media").$type<{
    linkedin?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }>(),

  // Location and Service Areas
  primaryLocation: jsonb("primary_location")
    .$type<{
      latitude: number
      longitude: number
      address: string
      city: string
      region: string
      country: string
      postalCode?: string
    }>()
    .notNull(),
  serviceAreas:
    jsonb("service_areas").$type<
      Array<{
        latitude: number
        longitude: number
        address: string
        city: string
        region: string
        country: string
        radius?: number
      }>
    >(),

  // Verification and Status
  verificationLevel: verificationLevelEnum("verification_level").default("basic"),
  isVerified: boolean("is_verified").default(false),
  availabilityStatus: availabilityStatusEnum("availability_status").default("available"),

  // Business Information
  businessLicenses:
    jsonb("business_licenses").$type<
      Array<{
        id: string
        type: string
        number: string
        issuedBy: string
        issuedDate: string
        expiryDate: string
        isValid: boolean
        documentUrl?: string
      }>
    >(),
  certifications:
    jsonb("certifications").$type<
      Array<{
        id: string
        name: string
        issuingOrganization: string
        issuedDate: string
        expiryDate?: string
        credentialId?: string
        verificationUrl?: string
      }>
    >(),

  // Service Capabilities
  serviceCapabilities:
    jsonb("service_capabilities").$type<
      Array<{
        serviceType: string
        category: string
        subcategory?: string
        description: string
        pricing: {
          basePrice: number
          currency: string
          priceType: "fixed" | "hourly" | "daily" | "project"
          minimumCharge?: number
        }
        availability: {
          daysOfWeek: number[]
          timeSlots: Array<{
            start: string
            end: string
          }>
          timezone: string
        }
        serviceArea: {
          radius: number
          locations: string[]
        }
      }>
    >(),

  // Languages and Settings
  languages: jsonb("languages").$type<string[]>().default([]),
  settings: jsonb("settings").$type<{
    autoAcceptBookings?: boolean
    instantBooking?: boolean
    requireDeposit?: boolean
    cancellationPolicy?: string
    refundPolicy?: string
  }>(),

  // Statistics
  totalBookings: integer("total_bookings").default(0),
  completedBookings: integer("completed_bookings").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  responseTime: integer("response_time_minutes"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
})

// Service Provider Relations
export const serviceProvidersRelations = relations(serviceProviders, ({ many }) => ({
  listings: many(listings),
  bookings: many(listingBookings),
}))
