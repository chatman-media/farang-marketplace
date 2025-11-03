import { relations } from "drizzle-orm"
import {
  boolean,
  decimal,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
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

// Additional listing enums from listing-service
export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "economy",
  "standard",
  "premium",
  "luxury",
  "sport",
  "electric",
  "classic",
  "rental",
])

export const buildingTypeEnum = pgEnum("building_type", [
  "low_rise",
  "mid_rise",
  "high_rise",
  "detached",
  "semi_detached",
  "terraced",
  "cluster",
])

export const furnishingEnum = pgEnum("furnishing", [
  "unfurnished",
  "partially_furnished",
  "fully_furnished",
  "luxury_furnished",
])

export const listingPurposeEnum = pgEnum("listing_purpose", [
  "rent",
  "sale",
  "short_term_rental",
  "long_term_rental",
  "both",
])

export const orientationEnum = pgEnum("orientation", [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
])

export const viewTypeEnum = pgEnum("view_type", [
  "city",
  "sea",
  "mountain",
  "garden",
  "pool",
  "river",
  "park",
  "golf",
  "no_view",
])

export const propertyTypeEnum = pgEnum("property_type", [
  "condo",
  "apartment",
  "house",
  "villa",
  "townhouse",
  "studio",
  "penthouse",
  "duplex",
  "loft",
  "commercial",
  "office",
  "retail",
  "warehouse",
  "land",
  "building",
])

export const propertyStatusEnum = pgEnum("property_status", [
  "available",
  "rented",
  "sold",
  "reserved",
  "under_contract",
  "off_market",
  "maintenance",
])

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
  gpsTrackerId: varchar("gps_tracker_id", { length: 50 }),
  gpsProvider: varchar("gps_provider", { length: 50 }),
  hasCharger: boolean("has_charger").default(false),
  hasHelmet: boolean("has_helmet").default(false),
  hasLock: boolean("has_lock").default(false),
  accessories: jsonb("accessories").$type<string[]>().default([]),
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
  lastMaintenanceUpdate: timestamp("last_maintenance_update"),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  notes: text("notes"),
})

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),

  // Product details
  productType: productTypeEnum("product_type").notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  condition: productConditionEnum("condition").notNull(),
  status: productStatusEnum("status").notNull().default("available"),
  listingType: productListingTypeEnum("listing_type").notNull().default("rental"),

  // Basic info
  brand: varchar("brand", { length: 50 }),
  model: varchar("model", { length: 100 }),
  sku: varchar("sku", { length: 100 }),
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

  // Technical specifications
  technicalSpecs: jsonb("technical_specs").$type<Record<string, string | number | boolean>>().default({}),

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

  // Rental pricing
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
  specifications: jsonb("specifications").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
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

  // CRM automation fields
  outcome: varchar("outcome", { length: 50 }), // Result of the communication
  nextAction: varchar("next_action", { length: 255 }), // Next recommended action

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

  // CRM fields
  contactCount: integer("contact_count").default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // 'email', 'telegram', 'whatsapp', 'line', 'universal'
  category: varchar("category", { length: 100 }), // 'welcome', 'follow_up', 'reminder', 'promotion', etc.

  // Template content
  subject: varchar("subject", { length: 500 }), // For email templates
  content: text("content").notNull(),
  variables: jsonb("variables").$type<string[]>().default([]), // Array of variable names used in template
  conditions: jsonb("conditions").$type<Record<string, any>>().default({}), // Conditions for when to use this template

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Audit fields
  createdBy: uuid("created_by"), // Reference to user who created template

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Customer segments table (from CRM migration)
export const customerSegments = pgTable("customer_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Segment criteria
  criteria: jsonb("criteria").$type<Record<string, any>>().notNull(), // Array of segment criteria
  operator: varchar("operator", { length: 3 }).default("AND"), // 'AND' or 'OR'

  // Status and stats
  isActive: boolean("is_active").notNull().default(true),
  customerCount: integer("customer_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),

  // Audit fields
  createdBy: uuid("created_by").default("00000000-0000-0000-0000-000000000000"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Customer segment memberships table (from CRM migration)
export const customerSegmentMemberships = pgTable(
  "customer_segment_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    segmentId: uuid("segment_id").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  table => ({
    // Unique constraint to prevent duplicate memberships
    uniqueCustomerSegment: unique().on(table.customerId, table.segmentId),
  })
)

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

// Payment-related enums (additional to existing paymentStatusEnum)
export const paymentMethodEnum = pgEnum("payment_method", [
  "ton_wallet",
  "ton_connect",
  "jetton_usdt",
  "jetton_usdc",
  "stripe_card",
  "promptpay",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "payment",
  "refund",
  "fee",
  "commission",
  "withdrawal",
  "deposit",
  "confirmation",
])

export const refundStatusEnum = pgEnum("refund_status", ["pending", "processing", "completed", "failed", "cancelled"])

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "investigating", "resolved", "closed", "escalated"])

// Payments Table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Basic payment info
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),

    // Payment provider info
    provider: varchar("provider", { length: 50 }).notNull(), // 'ton', 'stripe', 'promptpay'
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    providerReference: varchar("provider_reference", { length: 255 }),

    // Related entities
    listingId: uuid("listing_id").references(() => listings.id),
    bookingId: uuid("booking_id").references(() => bookings.id),
    userId: uuid("user_id").references(() => users.id),

    // Blockchain info (for crypto payments)
    blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),
    blockchainAddress: varchar("blockchain_address", { length: 255 }),
    jettonAddress: varchar("jetton_address", { length: 255 }),

    // Fee breakdown
    platformFee: decimal("platform_fee", { precision: 20, scale: 8 }).default("0"),
    processingFee: decimal("processing_fee", { precision: 20, scale: 8 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        cardBrand?: string
        cardLast4?: string
        failureCode?: string
        failureMessage?: string
        refundReason?: string
        disputeReason?: string
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  table => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_listing_id_idx").on(table.listingId),
    index("payments_booking_id_idx").on(table.bookingId),
    index("payments_status_idx").on(table.status),
    index("payments_created_at_idx").on(table.createdAt),
    index("payments_provider_payment_id_idx").on(table.providerPaymentId),
  ]
)

// Transactions Table
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Transaction info
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),
    type: transactionTypeEnum("type").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Related payment
    paymentId: uuid("payment_id").references(() => payments.id),

    // Source/destination info
    fromUserId: uuid("from_user_id").references(() => users.id),
    toUserId: uuid("to_user_id").references(() => users.id),

    // Blockchain info
    blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),
    blockchainAddress: varchar("blockchain_address", { length: 255 }),

    // Additional info
    description: text("description"),
    reference: varchar("reference", { length: 255 }),

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        category?: string
        subcategory?: string
        tags?: string[]
        notes?: string
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  table => [
    index("transactions_payment_id_idx").on(table.paymentId),
    index("transactions_from_user_id_idx").on(table.fromUserId),
    index("transactions_to_user_id_idx").on(table.toUserId),
    index("transactions_type_idx").on(table.type),
    index("transactions_status_idx").on(table.status),
    index("transactions_created_at_idx").on(table.createdAt),
  ]
)

// Refunds Table
export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Refund info
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("THB"),
    status: refundStatusEnum("status").notNull().default("pending"),

    // Related entities
    paymentId: uuid("payment_id")
      .references(() => payments.id)
      .notNull(),
    transactionId: uuid("transaction_id").references(() => transactions.id),

    // Refund details
    reason: text("reason"),
    refundType: varchar("refund_type", { length: 50 }).notNull(), // 'full', 'partial', 'chargeback'

    // Provider info
    providerRefundId: varchar("provider_refund_id", { length: 255 }),
    providerReference: varchar("provider_reference", { length: 255 }),

    // Blockchain info
    blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        reasonCode?: string
        failureReason?: string
        notes?: string
        initiatedBy?: string
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  table => [
    index("refunds_payment_id_idx").on(table.paymentId),
    index("refunds_transaction_id_idx").on(table.transactionId),
    index("refunds_status_idx").on(table.status),
    index("refunds_created_at_idx").on(table.createdAt),
  ]
)

// Payment Methods Table
export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // User info
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),

    // Payment method details
    type: paymentMethodEnum("type").notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),

    // Provider-specific data
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    last4: varchar("last4", { length: 4 }),
    brand: varchar("brand", { length: 50 }),
    expMonth: integer("exp_month"),
    expYear: integer("exp_year"),

    // Crypto wallet info
    walletAddress: varchar("wallet_address", { length: 255 }),
    jettonAddress: varchar("jetton_address", { length: 255 }),

    // Status
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        nickname?: string
        fingerprint?: string
        network?: string
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("payment_methods_user_id_idx").on(table.userId),
    index("payment_methods_type_idx").on(table.type),
    index("payment_methods_is_default_idx").on(table.isDefault),
    index("payment_methods_provider_id_idx").on(table.providerId),
  ]
)

// Payment Relations
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [payments.listingId],
    references: [listings.id],
  }),
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  transactions: many(transactions),
  refunds: many(refunds),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id],
  }),
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
  }),
}))

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
  transaction: one(transactions, {
    fields: [refunds.transactionId],
    references: [transactions.id],
  }),
}))

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}))

// AI Service Tables
// ============================================================================

// User Behavior Tracking
export const userBehaviors = pgTable(
  "user_behaviors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Action details
    action: varchar("action", { length: 20 }).notNull(), // view, search, click, bookmark, share, contact, book, purchase
    entityType: varchar("entity_type", { length: 20 }).notNull(), // listing, service, agency, user
    entityId: uuid("entity_id").notNull(),

    // Session tracking
    sessionId: varchar("session_id", { length: 255 }).notNull(),

    // Location data
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),

    // Device info
    deviceType: varchar("device_type", { length: 20 }), // mobile, tablet, desktop
    deviceOs: varchar("device_os", { length: 50 }),
    deviceBrowser: varchar("device_browser", { length: 50 }),

    // Additional metadata
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

    // Timestamps
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("user_behaviors_user_id_idx").on(table.userId),
    index("user_behaviors_action_idx").on(table.action),
    index("user_behaviors_entity_type_idx").on(table.entityType),
    index("user_behaviors_entity_id_idx").on(table.entityId),
    index("user_behaviors_session_id_idx").on(table.sessionId),
    index("user_behaviors_timestamp_idx").on(table.timestamp),
  ]
)

// Content Analysis Results
export const contentAnalysis = pgTable(
  "content_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Content identification
    type: varchar("type", { length: 20 }).notNull(), // listing, review, message, profile
    entityId: uuid("entity_id").notNull(),

    // Content data
    title: text("title"),
    description: text("description"),
    contentText: text("content_text"),
    images: jsonb("images").$type<string[]>().default([]),
    language: varchar("language", { length: 10 }).default("en"),

    // Analysis results
    sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
    sentimentLabel: varchar("sentiment_label", { length: 20 }),
    sentimentConfidence: decimal("sentiment_confidence", { precision: 3, scale: 2 }),

    keywords: jsonb("keywords")
      .$type<
        Array<{
          word: string
          score: number
          category?: string
        }>
      >()
      .default([]),

    categories: jsonb("categories")
      .$type<
        Array<{
          category: string
          confidence: number
        }>
      >()
      .default([]),

    moderationFlagged: boolean("moderation_flagged").default(false),
    moderationCategories: jsonb("moderation_categories").$type<string[]>().default([]),
    moderationScores: jsonb("moderation_scores").$type<Record<string, number>>().default({}),

    qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
    qualityIssues: jsonb("quality_issues").$type<string[]>().default([]),
    qualitySuggestions: jsonb("quality_suggestions").$type<string[]>().default([]),

    // Processing info
    processingTime: integer("processing_time"), // milliseconds
    algorithm: varchar("algorithm", { length: 100 }),

    // Timestamps
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("content_analysis_type_idx").on(table.type),
    index("content_analysis_entity_id_idx").on(table.entityId),
    index("content_analysis_timestamp_idx").on(table.timestamp),
    index("content_analysis_sentiment_score_idx").on(table.sentimentScore),
  ]
)

// Machine Learning Models
export const mlModels = pgTable(
  "ml_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // recommendation, classification, regression, clustering
    version: varchar("version", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("training"), // training, ready, error, deprecated

    // Performance metrics
    accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
    precision: decimal("precision", { precision: 5, scale: 4 }),
    recall: decimal("recall", { precision: 5, scale: 4 }),
    f1Score: decimal("f1_score", { precision: 5, scale: 4 }),

    // Training data info
    trainingSamples: integer("training_samples"),
    trainingFeatures: integer("training_features"),
    lastTrained: timestamp("last_trained"),

    // Configuration
    hyperparameters: jsonb("hyperparameters").$type<Record<string, any>>().default({}),
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("ml_models_name_idx").on(table.name),
    index("ml_models_type_idx").on(table.type),
    index("ml_models_status_idx").on(table.status),
    index("ml_models_version_idx").on(table.version),
  ]
)

// Training Jobs
export const trainingJobs = pgTable(
  "training_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => mlModels.id, { onDelete: "cascade" }),

    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, running, completed, failed, cancelled
    progress: integer("progress").notNull().default(0), // 0-100

    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),

    // Training metrics
    metrics: jsonb("metrics")
      .$type<{
        loss?: number
        accuracy?: number
        validationLoss?: number
        validationAccuracy?: number
      }>()
      .default({}),

    logs: jsonb("logs").$type<string[]>().default([]),
    error: text("error"),

    // Training configuration
    config: jsonb("config")
      .$type<{
        epochs: number
        batchSize: number
        learningRate: number
        validationSplit: number
      }>()
      .default({
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
      }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("training_jobs_model_id_idx").on(table.modelId),
    index("training_jobs_status_idx").on(table.status),
    index("training_jobs_start_time_idx").on(table.startTime),
  ]
)

// Search Queries
export const searchQueries = pgTable(
  "search_queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    query: text("query").notNull(),
    type: varchar("type", { length: 20 }).notNull().default("text"), // text, voice, image, semantic

    // Search context
    context: jsonb("context")
      .$type<{
        currentListingId?: string
        searchQuery?: string
        category?: string
        location?: string
        budget?: number
      }>()
      .default({}),

    // Search filters
    filters: jsonb("filters")
      .$type<{
        categories?: string[]
        priceRange?: { min: number; max: number }
        location?: string
        rating?: number
        availability?: boolean
      }>()
      .default({}),

    // Search results
    resultsCount: integer("results_count"),
    clickedResults: jsonb("clicked_results").$type<string[]>().default([]),

    // Performance metrics
    processingTime: integer("processing_time"), // milliseconds

    // Timestamps
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("search_queries_user_id_idx").on(table.userId),
    index("search_queries_type_idx").on(table.type),
    index("search_queries_timestamp_idx").on(table.timestamp),
    index("search_queries_query_idx").on(table.query),
  ]
)

// AI Service Relations
export const userBehaviorsRelations = relations(userBehaviors, ({ one }) => ({
  user: one(users, {
    fields: [userBehaviors.userId],
    references: [users.id],
  }),
}))

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}))

export const contentAnalysisRelations = relations(contentAnalysis, ({ one }) => ({
  listing: one(listings, {
    fields: [contentAnalysis.entityId],
    references: [listings.id],
  }),
}))

export const mlModelsRelations = relations(mlModels, ({ many }) => ({
  trainingJobs: many(trainingJobs),
}))

export const trainingJobsRelations = relations(trainingJobs, ({ one }) => ({
  model: one(mlModels, {
    fields: [trainingJobs.modelId],
    references: [mlModels.id],
  }),
}))

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  user: one(users, {
    fields: [searchQueries.userId],
    references: [users.id],
  }),
}))

// Booking related enums
export const bookingTypeEnum = pgEnum("booking_type", [
  "accommodation",
  "transportation",
  "tour",
  "activity",
  "dining",
  "event",
  "service",
])

export const serviceBookingTypeEnum = pgEnum("service_booking_type", [
  "consultation",
  "project",
  "hourly",
  "package",
  "subscription",
])

export const cancellationReasonEnum = pgEnum("cancellation_reason", [
  "user_request",
  "host_unavailable",
  "payment_failed",
  "policy_violation",
  "force_majeure",
  "system_error",
])

// ============================================================================
// BOOKING SYSTEM TABLES (from booking-service)
// ============================================================================

// Main Bookings Table (extends listingBookings with more comprehensive fields)
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull(),
    guestId: uuid("guest_id").notNull(),
    hostId: uuid("host_id").notNull(),
    agencyId: uuid("agency_id"),

    // Booking Details
    type: bookingTypeEnum("type").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
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
    paymentStatus: paymentStatusEnum("payment_status").default("pending"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentId: varchar("payment_id", { length: 255 }),

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
    metadata: jsonb("metadata")
      .$type<{
        source?: string
        userAgent?: string
        ipAddress?: string
        referrer?: string
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  table => [
    index("bookings_listing_id_idx").on(table.listingId),
    index("bookings_guest_id_idx").on(table.guestId),
    index("bookings_host_id_idx").on(table.hostId),
    index("bookings_status_idx").on(table.status),
    index("bookings_check_in_idx").on(table.checkIn),
    index("bookings_payment_status_idx").on(table.paymentStatus),
  ]
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
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
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
    communicationPreference: varchar("communication_preference", { length: 20 }).notNull(), // 'email' | 'phone' | 'chat' | 'video_call'

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
  table => [
    index("service_bookings_booking_id_idx").on(table.bookingId),
    index("service_bookings_provider_id_idx").on(table.providerId),
    index("service_bookings_scheduled_date_idx").on(table.scheduledDate),
    index("service_bookings_service_type_idx").on(table.serviceType),
  ]
)

// Booking Status History
export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .references(() => bookings.id, { onDelete: "cascade" })
      .notNull(),
    fromStatus: varchar("from_status", { length: 20 }),
    toStatus: varchar("to_status", { length: 20 }).notNull(),
    reason: text("reason"),
    changedBy: uuid("changed_by").notNull(), // user ID who made the change
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata")
      .$type<{
        automaticChange?: boolean
        systemReason?: string
        userAgent?: string
      }>()
      .default({}),
  },
  table => [
    index("booking_status_history_booking_id_idx").on(table.bookingId),
    index("booking_status_history_changed_at_idx").on(table.changedAt),
  ]
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
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index("availability_conflicts_listing_id_idx").on(table.listingId),
    index("availability_conflicts_date_range_idx").on(table.startDate, table.endDate),
  ]
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
    status: varchar("status", { length: 20 }).notNull().default("open"),

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
  table => [
    index("disputes_booking_id_idx").on(table.bookingId),
    index("disputes_status_idx").on(table.status),
    index("disputes_initiated_by_idx").on(table.initiatedBy),
  ]
)
