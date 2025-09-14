import { relations } from "drizzle-orm"
import {
  boolean,
  decimal,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

// ============================================================================
// SHARED ENUMS
// ============================================================================

// User & Auth related enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator", "service_provider"])
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "verified", "rejected"])
export const languageEnum = pgEnum("language", ["en", "th", "ru", "zh", "ja"])

// Communication related enums (from your models)
export const communicationPlatformEnum = pgEnum("communication_platform", [
  "telegram",
  "whatsapp",
  "phone",
  "email",
  "website",
  "other",
])

export const messageTypeEnum = pgEnum("message_type", ["incoming", "outgoing", "system", "ai_generated"])

// Rental related enums (from your models)
export const rentalStatusEnum = pgEnum("rental_status", ["active", "completed", "cancelled", "overdue", "pending"])

// Pricing system enums
export const pricingSystemEnum = pgEnum("pricing_system", [
  "calendar", // календарная система с конкретными датами
  "seasonal", // система по месяцам/сезонам
])

// Listing related enums
export const listingCategoryEnum = pgEnum("listing_category", [
  "transportation",
  "tours",
  "services",
  "vehicles",
  "products",
])

export const listingTypeEnum = pgEnum("listing_type", ["rental", "service"])

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

// Vehicle related enums
export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "scooter",
  "motorcycle",
  "car",
  "bicycle",
  "boat",
  "jet_ski",
  "atv",
  "truck",
  "van",
  "bus",
])

export const vehicleCategoryEnum = pgEnum("vehicle_category", ["rental", "lease", "ride_sharing", "delivery"])

export const vehicleConditionEnum = pgEnum("vehicle_condition", ["new", "excellent", "good", "fair", "poor", "damaged"])

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "rented",
  "maintenance",
  "reserved",
  "inactive",
])

export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"])

export const transmissionTypeEnum = pgEnum("transmission_type", ["manual", "automatic", "cvt", "semi_automatic"])

// Product related enums
export const productTypeEnum = pgEnum("product_type", [
  // Home & Kitchen Appliances
  "home_appliances", // холодильники, стиральные машины, микроволновки
  "kitchen_appliances", // блендеры, кофемашины, мультиварки
  "cleaning_equipment", // пылесосы, пароочистители, моющие аппараты

  // Audio & Video Equipment
  "audio_equipment", // колонки, наушники, микрофоны, усилители
  "video_equipment", // проекторы, камеры, телевизоры
  "gaming_consoles", // PlayStation, Xbox, Nintendo

  // Computing & Electronics
  "computers_laptops", // ноутбуки, ПК, планшеты
  "mobile_devices", // телефоны, смарт-часы
  "networking_equipment", // роутеры, модемы, точки доступа

  // Tools & Equipment
  "power_tools", // дрели, пилы, шлифмашины
  "hand_tools", // инструменты, измерительные приборы
  "garden_tools", // газонокосилки, триммеры, садовый инвентарь

  // Sports & Recreation
  "sports_equipment", // велосипеды, скейтборды, спортинвентарь
  "outdoor_gear", // палатки, рюкзаки, туристическое снаряжение
  "water_sports", // доски для серфинга, каяки, снаряжение для дайвинга

  // Photography & Creative
  "photography_equipment", // фотоаппараты, объективы, штативы
  "musical_instruments", // гитары, клавишные, барабаны
  "art_supplies", // мольберты, краски, профессиональные материалы

  // Event & Party
  "event_equipment", // звуковое оборудование, освещение
  "party_supplies", // декорации, мебель для мероприятий

  // Other
  "other",
])

export const productConditionEnum = pgEnum("product_condition", ["new", "like_new", "good", "fair", "poor"])

export const productStatusEnum = pgEnum("product_status", ["available", "rented", "reserved", "inactive"])

export const productListingTypeEnum = pgEnum("product_listing_type", ["rental", "service"])

// Property enums removed - focusing on products and vehicles only

export const priceTypeEnum = pgEnum("price_type", [
  "fixed",
  "negotiable",
  "auction",
  "per_hour",
  "per_day",
  "per_week",
  "per_month",
  "per_year",
])

// Service Provider related enums
export const providerTypeEnum = pgEnum("provider_type", ["individual", "company", "agency", "freelancer"])
export const verificationLevelEnum = pgEnum("verification_level", ["basic", "verified", "premium", "enterprise"])
export const availabilityStatusEnum = pgEnum("availability_status", ["available", "busy", "away", "offline"])

// Payment & Booking related enums
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "refunded",
])

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "expired",
  "disputed",
])

// CRM related enums
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
])

export const customerTypeEnum = pgEnum("customer_type", ["individual", "business", "enterprise"])

export const communicationTypeEnum = pgEnum("communication_type", [
  "email",
  "sms",
  "call",
  "whatsapp",
  "line",
  "telegram",
  "in_person",
])

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
])

export const messageStatusEnum = pgEnum("message_status", ["pending", "sent", "delivered", "read", "failed"])

// Agency related enums
export const agencyStatusEnum = pgEnum("agency_status", ["pending", "active", "suspended", "inactive", "rejected"])

export const serviceAssignmentStatusEnum = pgEnum("service_assignment_status", [
  "active",
  "paused",
  "completed",
  "cancelled",
])

// ============================================================================
// CORE TABLES
// ============================================================================

// Users table (shared across all services)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),

  // Phone with validation (from your Customer model)
  phone: varchar("phone", { length: 17 }).unique(), // increased length for international format

  // Telegram integration (from your models)
  telegramId: varchar("telegram_id", { length: 50 }).unique(),
  telegramUsername: varchar("telegram_username", { length: 100 }),

  avatar: varchar("avatar", { length: 500 }),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationStatus: verificationStatusEnum("verification_status").default("pending"),

  // Customer status fields (from your models)
  isClient: boolean("is_client").default(false),
  hasRentedBefore: boolean("has_rented_before").default(false),

  // Communication preferences
  preferredPlatform: communicationPlatformEnum("preferred_platform").default("telegram"),

  language: languageEnum("language").default("en"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  lastLoginAt: timestamp("last_login_at"),

  // Contact tracking (from your models)
  firstContactDate: timestamp("first_contact_date"),
  lastContactDate: timestamp("last_contact_date"),

  // Notes and communication info (from your models)
  notes: text("notes"),
  managerCommunicationInfo: text("manager_communication_info"),

  // Profile data (for user-service compatibility)
  profile: jsonb("profile").$type<Record<string, any>>().default({}),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional metadata
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// User preferences table (for user-service compatibility)
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  language: languageEnum("language").default("en"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  notifications: jsonb("notifications").$type<Record<string, boolean>>().default({
    email: true,
    push: true,
    sms: false,
    telegram: false,
    whatsapp: false,
    line: false,
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Listings table (core table for all listing types)
export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: listingCategoryEnum("category").notNull(),
  type: listingTypeEnum("type").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),

  // Pricing
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("THB"),
  priceType: priceTypeEnum("price_type").default("fixed"),

  // Location
  locationAddress: text("location_address").notNull(),
  locationCity: varchar("location_city", { length: 100 }).notNull(),
  locationRegion: varchar("location_region", { length: 100 }).notNull(),
  locationCountry: varchar("location_country", { length: 100 }).notNull().default("Thailand"),
  locationZipCode: varchar("location_zip_code", { length: 20 }),
  locationLatitude: varchar("location_latitude", { length: 50 }),
  locationLongitude: varchar("location_longitude", { length: 50 }),

  // Media
  images: json("images").$type<string[]>().default([]),
  videos: json("videos").$type<string[]>().default([]),
  documents: json("documents").$type<string[]>().default([]),

  // Availability
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),

  // SEO & Search
  slug: varchar("slug", { length: 255 }).unique(),
  tags: json("tags").$type<string[]>().default([]),
  searchKeywords: text("search_keywords"),

  // Stats
  viewCount: integer("view_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  inquiryCount: integer("inquiry_count").notNull().default(0),

  // Timestamps
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Real Estate will be added later when system stabilizes

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().unique(),

  // Vehicle details
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  category: vehicleCategoryEnum("category").notNull(),
  condition: vehicleConditionEnum("condition").notNull(),
  status: vehicleStatusEnum("status").notNull().default("available"),

  // Basic info
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  color: varchar("color", { length: 50 }),

  // Power specification (from your Scooter model)
  power: varchar("power", { length: 50 }), // 125cc, 150cc, etc.

  // Technical specs
  engineSize: decimal("engine_size", { precision: 5, scale: 2 }),
  fuelType: fuelTypeEnum("fuel_type"),
  transmission: transmissionTypeEnum("transmission"),
  mileage: integer("mileage"),

  // Identification (from your models)
  oldVehicleNumber: varchar("old_vehicle_number", { length: 50 }).unique(),

  // Stickers and markings (from your models)
  sticker: varchar("sticker", { length: 100 }),
  rentalSticker: varchar("rental_sticker", { length: 100 }),

  // GPS tracking (from your models)
  gpsTrackerId: varchar("gps_tracker_id", { length: 100 }),
  gpsProvider: varchar("gps_provider", { length: 50 }), // sinotrack, etc.

  // Features
  airConditioning: boolean("air_conditioning").default(false),
  gps: boolean("gps").default(false),
  bluetooth: boolean("bluetooth").default(false),
  usbCharging: boolean("usb_charging").default(false),

  // Documents
  registrationNumber: varchar("registration_number", { length: 50 }),
  insuranceValid: boolean("insurance_valid").default(false),
  insuranceExpiry: timestamp("insurance_expiry"),

  // Rental specific - basic rates
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }),

  // Pricing system selection (calendar vs seasonal)
  pricingSystem: pricingSystemEnum("pricing_system").default("seasonal"),

  // Long-term rental pricing (from your PricingTier model)
  oneYearRent: decimal("one_year_rent", { precision: 10, scale: 2 }),
  sixMonthHighSeason: decimal("six_month_high_season", { precision: 10, scale: 2 }),
  sixMonthLowSeason: decimal("six_month_low_season", { precision: 10, scale: 2 }),

  // Short-term rental pricing (from your PricingTier model)
  days1To3: decimal("days_1_3", { precision: 10, scale: 2 }),
  days4To7: decimal("days_4_7", { precision: 10, scale: 2 }),
  days7To14: decimal("days_7_14", { precision: 10, scale: 2 }),
  days15To25: decimal("days_15_25", { precision: 10, scale: 2 }),

  // Seasonal pricing (from your PricingTier model)
  decemberPrice: decimal("december_price", { precision: 10, scale: 2 }),
  januaryPrice: decimal("january_price", { precision: 10, scale: 2 }),
  februaryPrice: decimal("february_price", { precision: 10, scale: 2 }),
  marchPrice: decimal("march_price", { precision: 10, scale: 2 }),
  aprilPrice: decimal("april_price", { precision: 10, scale: 2 }),
  mayPrice: decimal("may_price", { precision: 10, scale: 2 }),
  summerPrice: decimal("summer_price", { precision: 10, scale: 2 }),
  septemberPrice: decimal("september_price", { precision: 10, scale: 2 }),
  octoberPrice: decimal("october_price", { precision: 10, scale: 2 }),
  novemberPrice: decimal("november_price", { precision: 10, scale: 2 }),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  features: jsonb("features").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().unique(),

  // Product details
  productType: productTypeEnum("product_type").notNull(),
  condition: productConditionEnum("condition").notNull(),
  status: productStatusEnum("status").notNull().default("available"),
  listingType: productListingTypeEnum("listing_type").notNull().default("rental"),

  // Basic info
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  sku: varchar("sku", { length: 100 }),

  // Physical properties
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensions: jsonb("dimensions").$type<{ length?: number; width?: number; height?: number }>(),
  color: varchar("color", { length: 50 }),
  material: varchar("material", { length: 100 }),

  // Inventory
  quantity: integer("quantity").notNull().default(1),
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),

  // Pricing
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),

  // Shipping
  shippingWeight: decimal("shipping_weight", { precision: 8, scale: 3 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  freeShipping: boolean("free_shipping").default(false),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  specifications: jsonb("specifications").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Service Providers table
export const serviceProviders = pgTable("service_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),

  // Business details
  businessName: varchar("business_name", { length: 255 }),
  businessType: providerTypeEnum("business_type").notNull(),
  businessRegistration: varchar("business_registration", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),

  // Contact info
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  website: varchar("website", { length: 255 }),

  // Location
  address: text("address"),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Thailand"),
  zipCode: varchar("zip_code", { length: 20 }),

  // Verification
  verificationLevel: verificationLevelEnum("verification_level").default("basic"),
  verificationStatus: verificationStatusEnum("verification_status").default("pending"),
  verifiedAt: timestamp("verified_at"),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  availabilityStatus: availabilityStatusEnum("availability_status").default("available"),

  // Stats
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  services: jsonb("services").$type<string[]>().default([]),
  workingHours: jsonb("working_hours").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Bookings table
export const listingBookings = pgTable("listing_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull(),
  userId: uuid("user_id").notNull(),

  // Booking details
  status: bookingStatusEnum("status").notNull().default("pending"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // Pricing
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("THB"),

  // Payment
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  guestDetails: jsonb("guest_details").$type<Record<string, any>>().default({}),
  specialRequests: text("special_requests"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Availability table
export const listingAvailability = pgTable("listing_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull(),

  // Availability details
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  price: decimal("price", { precision: 10, scale: 2 }),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// CRM Tables
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique(),

  // Customer details
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),

  // Business info
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("job_title", { length: 100 }),
  customerType: customerTypeEnum("customer_type").default("individual"),

  // Location
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  status: varchar("status", { length: 20 }).default("lead"),

  // CRM fields
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }),
  leadScore: integer("lead_score").default(0),
  lastInteractionAt: timestamp("last_interaction_at"),
  preferredChannel: varchar("preferred_channel", { length: 20 }).default("email"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  tags: json("tags").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id"),
  assignedTo: uuid("assigned_to"),

  // Lead details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: leadStatusEnum("status").notNull().default("new"),
  source: varchar("source", { length: 100 }),

  // Value
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("THB"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const communicationHistory = pgTable("communication_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id"),
  leadId: uuid("lead_id"),
  userId: uuid("user_id").notNull(),

  // Communication details
  type: communicationTypeEnum("type").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  direction: varchar("direction", { length: 10 }).notNull(), // 'inbound' or 'outbound'

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Marketing & Campaigns
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").notNull().default("draft"),

  // Campaign details
  type: varchar("type", { length: 50 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: communicationTypeEnum("type").notNull(),

  // Template content
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  variables: json("variables").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const campaignMessages = pgTable("campaign_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull(),
  customerId: uuid("customer_id").notNull(),
  templateId: uuid("template_id"),

  // Message details
  type: communicationTypeEnum("type").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("pending"),

  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const customerSegments = pgTable("customer_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Segment criteria
  criteria: jsonb("criteria").$type<Record<string, any>>().notNull(),
  operator: varchar("operator", { length: 3 }).default("AND"),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // CRM fields
  customerCount: integer("customer_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdBy: uuid("created_by").default("00000000-0000-0000-0000-000000000000"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const customerSegmentMemberships = pgTable("customer_segment_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull(),
  segmentId: uuid("segment_id").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Automation details
  trigger: jsonb("trigger").$type<Record<string, any>>().notNull(),
  actions: jsonb("actions").$type<Record<string, any>[]>().notNull(),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Migrations table for tracking schema changes
export const migrations = pgTable("migrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
})

// Vehicle Maintenance table (from your ScooterMaintenance model)
export const vehicleMaintenance = pgTable("vehicle_maintenance", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").notNull().unique(), // one-to-one with vehicle

  // Fluid and consumables replacement (in kilometers)
  engineOilKm: integer("engine_oil_km").default(0),
  gearOilKm: integer("gear_oil_km").default(0),
  radiatorWaterKm: integer("radiator_water_km").default(0),

  // Brake system
  frontBrakesKm: integer("front_brakes_km").default(0),
  rearBrakesKm: integer("rear_brakes_km").default(0),

  // Filters and spark plugs
  airFilterKm: integer("air_filter_km").default(0),
  sparkPlugsKm: integer("spark_plugs_km").default(0),

  // Documents (dates)
  techInspectionDate: timestamp("tech_inspection_date"),
  insuranceDate: timestamp("insurance_date"),

  // Components and accessories
  cigaretteLighter: boolean("cigarette_lighter").default(false),
  frontBearing: varchar("front_bearing", { length: 100 }),
  rearBearing: varchar("rear_bearing", { length: 100 }),
  frontTire: varchar("front_tire", { length: 100 }),
  rearTire: varchar("rear_tire", { length: 100 }),
  battery: varchar("battery", { length: 100 }),
  belt: varchar("belt", { length: 100 }),
  starter: varchar("starter", { length: 100 }),
  gasket: varchar("gasket", { length: 100 }),
  water: varchar("water", { length: 100 }),

  // Special notes
  rearDiscNeedsReplacement: varchar("rear_disc_needs_replacement", { length: 200 }),

  // Service dates
  lastServiceDate: timestamp("last_service_date"),
  replacementDate: timestamp("replacement_date"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  maintenanceNotes: text("maintenance_notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Extended Rentals table (from your Rental model)
export const vehicleRentals = pgTable("vehicle_rentals", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Relations
  customerId: uuid("customer_id").notNull(),
  vehicleId: uuid("vehicle_id").notNull(),

  // Rental dates
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  actualEndDate: timestamp("actual_end_date"),

  // Status and conditions
  status: rentalStatusEnum("status").default("pending"),

  // Pricing
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).default("0"),

  // Additional fees
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  pickupFee: decimal("pickup_fee", { precision: 10, scale: 2 }),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }),
  damageFee: decimal("damage_fee", { precision: 10, scale: 2 }),

  // Additional information
  notes: text("notes"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Chat History table (from your ChatHistory model)
export const chatHistory = pgTable("chat_history", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Customer relation
  customerId: uuid("customer_id").notNull(),

  // Message information
  platform: communicationPlatformEnum("platform").notNull(),
  messageType: messageTypeEnum("message_type").notNull(),
  messageText: text("message_text").notNull(),

  // Message metadata
  externalMessageId: varchar("external_message_id", { length: 100 }),
  senderName: varchar("sender_name", { length: 200 }),

  // AI context
  contextSummary: text("context_summary"),
  isProcessedByAi: boolean("is_processed_by_ai").default(false),
  aiResponse: text("ai_response"),

  // Timestamps
  messageTimestamp: timestamp("message_timestamp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Agency tables
export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  status: agencyStatusEnum("status").notNull().default("pending"),
  ownerId: uuid("owner_id").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const agencyServices = pgTable("agency_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull(),
  category: productTypeEnum("category").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const serviceAssignments = pgTable("service_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyServiceId: uuid("agency_service_id").notNull(),
  listingId: uuid("listing_id").notNull(),
  status: serviceAssignmentStatusEnum("status").notNull().default("active"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const commissionPayments = pgTable("commission_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull(),
  bookingId: uuid("booking_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// DeepSeek Prompt Templates table (from your DeepSeekPromptTemplate model)
export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Calendar-based pricing table (alternative to seasonal pricing)
export const vehicleCalendarPricing = pgTable("vehicle_calendar_pricing", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").notNull(),

  // Date range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // Pricing
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }),

  // Availability
  isAvailable: boolean("is_available").default(true),
  maxBookings: integer("max_bookings").default(1),

  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  serviceProvider: many(serviceProviders),
  bookings: many(listingBookings),
  leads: many(leads),
  communications: many(communicationHistory),
  vehicleRentals: many(vehicleRentals),
  chatHistory: many(chatHistory),
}))

export const listingsRelations = relations(listings, ({ one, many }) => ({
  owner: one(users, {
    fields: [listings.ownerId],
    references: [users.id],
  }),
  vehicle: one(vehicles),
  product: one(products),
  bookings: many(listingBookings),
  availability: many(listingAvailability),
}))

// Real estate relations will be added later

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  listing: one(listings, {
    fields: [vehicles.listingId],
    references: [listings.id],
  }),
  maintenance: one(vehicleMaintenance, {
    fields: [vehicles.id],
    references: [vehicleMaintenance.vehicleId],
  }),
  rentals: many(vehicleRentals),
  calendarPricing: many(vehicleCalendarPricing),
}))

export const productsRelations = relations(products, ({ one }) => ({
  listing: one(listings, {
    fields: [products.listingId],
    references: [listings.id],
  }),
}))

export const serviceProvidersRelations = relations(serviceProviders, ({ one }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
}))

export const listingBookingsRelations = relations(listingBookings, ({ one }) => ({
  listing: one(listings, {
    fields: [listingBookings.listingId],
    references: [listings.id],
  }),
  user: one(users, {
    fields: [listingBookings.userId],
    references: [users.id],
  }),
}))

export const listingAvailabilityRelations = relations(listingAvailability, ({ one }) => ({
  listing: one(listings, {
    fields: [listingAvailability.listingId],
    references: [listings.id],
  }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  leads: many(leads),
  communications: many(communicationHistory),
  campaignMessages: many(campaignMessages),
  segmentMemberships: many(customerSegmentMemberships),
}))

export const leadsRelations = relations(leads, ({ one, many }) => ({
  customer: one(customers, {
    fields: [leads.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  communications: many(communicationHistory),
}))

export const communicationHistoryRelations = relations(communicationHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [communicationHistory.customerId],
    references: [customers.id],
  }),
  lead: one(leads, {
    fields: [communicationHistory.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [communicationHistory.userId],
    references: [users.id],
  }),
}))

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  messages: many(campaignMessages),
}))

export const campaignMessagesRelations = relations(campaignMessages, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignMessages.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [campaignMessages.customerId],
    references: [customers.id],
  }),
  template: one(messageTemplates, {
    fields: [campaignMessages.templateId],
    references: [messageTemplates.id],
  }),
}))

export const customerSegmentsRelations = relations(customerSegments, ({ many }) => ({
  memberships: many(customerSegmentMemberships),
}))

export const customerSegmentMembershipsRelations = relations(customerSegmentMemberships, ({ one }) => ({
  customer: one(customers, {
    fields: [customerSegmentMemberships.customerId],
    references: [customers.id],
  }),
  segment: one(customerSegments, {
    fields: [customerSegmentMemberships.segmentId],
    references: [customerSegments.id],
  }),
}))

// New table relations
export const vehicleMaintenanceRelations = relations(vehicleMaintenance, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleMaintenance.vehicleId],
    references: [vehicles.id],
  }),
}))

export const vehicleRentalsRelations = relations(vehicleRentals, ({ one }) => ({
  customer: one(users, {
    fields: [vehicleRentals.customerId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [vehicleRentals.vehicleId],
    references: [vehicles.id],
  }),
}))

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
  customer: one(users, {
    fields: [chatHistory.customerId],
    references: [users.id],
  }),
}))

export const vehicleCalendarPricingRelations = relations(vehicleCalendarPricing, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleCalendarPricing.vehicleId],
    references: [vehicles.id],
  }),
}))

// Agency relations
export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  owner: one(users, {
    fields: [agencies.ownerId],
    references: [users.id],
  }),
  services: many(agencyServices),
  commissionPayments: many(commissionPayments),
}))

export const agencyServicesRelations = relations(agencyServices, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [agencyServices.agencyId],
    references: [agencies.id],
  }),
  assignments: many(serviceAssignments),
}))

export const serviceAssignmentsRelations = relations(serviceAssignments, ({ one }) => ({
  agencyService: one(agencyServices, {
    fields: [serviceAssignments.agencyServiceId],
    references: [agencyServices.id],
  }),
  listing: one(listings, {
    fields: [serviceAssignments.listingId],
    references: [listings.id],
  }),
}))

export const commissionPaymentsRelations = relations(commissionPayments, ({ one }) => ({
  agency: one(agencies, {
    fields: [commissionPayments.agencyId],
    references: [agencies.id],
  }),
  booking: one(listingBookings, {
    fields: [commissionPayments.bookingId],
    references: [listingBookings.id],
  }),
}))
