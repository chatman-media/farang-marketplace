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
  "real_estate",
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

export const listingTypeEnum = pgEnum("listing_type", ["accommodation", "service", "vehicle", "product"])

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

export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline", "diesel", "electric", "hybrid", "lpg", "cng"])

export const transmissionTypeEnum = pgEnum("transmission_type", ["manual", "automatic", "cvt", "semi_automatic"])

export const vehicleConditionEnum = pgEnum("vehicle_condition", ["new", "excellent", "good", "fair", "poor"])

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

export const productListingTypeEnum = pgEnum("product_listing_type", ["sale", "rent", "both", "service"])

export const priceTypeEnum = pgEnum("price_type", ["fixed", "negotiable", "auction", "quote_on_request"])

// Real Estate specific enums
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

export const listingPurposeEnum = pgEnum("listing_purpose", [
  "rent",
  "sale",
  "short_term_rental", // Airbnb style
  "long_term_rental", // Traditional rental
  "both", // Can be rented or sold
])

export const furnishingEnum = pgEnum("furnishing", [
  "unfurnished",
  "partially_furnished",
  "fully_furnished",
  "luxury_furnished",
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

// Real Estate specific data (Airbnb + Avito style)
export const realEstate = pgTable("real_estate", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),

  // Property basics
  propertyType: propertyTypeEnum("property_type").notNull(),
  propertyStatus: propertyStatusEnum("property_status").notNull().default("available"),
  listingPurpose: listingPurposeEnum("listing_purpose").notNull(),

  // Physical characteristics
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(), // 2.5 bathrooms
  area: decimal("area", { precision: 8, scale: 2 }).notNull(), // Total area in sqm
  livingArea: decimal("living_area", { precision: 8, scale: 2 }), // Living space only
  landArea: decimal("land_area", { precision: 10, scale: 2 }), // Land plot size
  floor: integer("floor"), // Which floor (for apartments)
  totalFloors: integer("total_floors"), // Total floors in building

  // Building details
  buildingType: buildingTypeEnum("building_type"),
  buildingAge: integer("building_age"), // Years since construction
  yearBuilt: integer("year_built"),
  yearRenovated: integer("year_renovated"),

  // Furnishing and condition
  furnishing: furnishingEnum("furnishing").notNull().default("unfurnished"),
  condition: varchar("condition", { length: 20 }).notNull().default("good"), // excellent, good, fair, needs_renovation

  // Views and orientation
  views: jsonb("views").$type<string[]>().default([]), // Array of view types
  orientation: orientationEnum("orientation"),
  balconies: integer("balconies").default(0),
  terraces: integer("terraces").default(0),

  // Pricing details
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  pricePerSqm: decimal("price_per_sqm", { precision: 8, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("THB"),
  priceType: priceTypeEnum("price_type").notNull().default("fixed"),

  // Rental specific pricing (Airbnb style)
  dailyRate: decimal("daily_rate", { precision: 8, scale: 2 }),
  weeklyRate: decimal("weekly_rate", { precision: 8, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 8, scale: 2 }),
  yearlyRate: decimal("yearly_rate", { precision: 10, scale: 2 }),

  // Additional costs
  maintenanceFee: decimal("maintenance_fee", { precision: 8, scale: 2 }),
  commonAreaFee: decimal("common_area_fee", { precision: 8, scale: 2 }),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  cleaningFee: decimal("cleaning_fee", { precision: 6, scale: 2 }),

  // Utilities
  electricityIncluded: boolean("electricity_included").default(false),
  waterIncluded: boolean("water_included").default(false),
  internetIncluded: boolean("internet_included").default(false),
  cableIncluded: boolean("cable_included").default(false),
  gasIncluded: boolean("gas_included").default(false),

  // Parking
  parkingSpaces: integer("parking_spaces").default(0),
  parkingType: varchar("parking_type", { length: 20 }), // covered, open, garage, street
  parkingFee: decimal("parking_fee", { precision: 6, scale: 2 }),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
})

// Property amenities and features
export const propertyAmenities = pgTable("property_amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  realEstateId: uuid("real_estate_id")
    .notNull()
    .references(() => realEstate.id, { onDelete: "cascade" }),

  // Building amenities
  hasElevator: boolean("has_elevator").default(false),
  hasSwimmingPool: boolean("has_swimming_pool").default(false),
  hasFitnessCenter: boolean("has_fitness_center").default(false),
  hasSauna: boolean("has_sauna").default(false),
  hasGarden: boolean("has_garden").default(false),
  hasPlayground: boolean("has_playground").default(false),
  hasSecurity: boolean("has_security").default(false),
  hasCCTV: boolean("has_cctv").default(false),
  hasKeyCard: boolean("has_key_card").default(false),
  hasReception: boolean("has_reception").default(false),
  hasConcierge: boolean("has_concierge").default(false),
  hasMailbox: boolean("has_mailbox").default(false),

  // Unit amenities
  hasAirConditioning: boolean("has_air_conditioning").default(false),
  hasHeating: boolean("has_heating").default(false),
  hasWashingMachine: boolean("has_washing_machine").default(false),
  hasDryer: boolean("has_dryer").default(false),
  hasDishwasher: boolean("has_dishwasher").default(false),
  hasMicrowave: boolean("has_microwave").default(false),
  hasRefrigerator: boolean("has_refrigerator").default(false),
  hasOven: boolean("has_oven").default(false),
  hasBalcony: boolean("has_balcony").default(false),
  hasTerrace: boolean("has_terrace").default(false),
  hasFireplace: boolean("has_fireplace").default(false),
  hasStorage: boolean("has_storage").default(false),

  // Technology
  hasWifi: boolean("has_wifi").default(false),
  hasCableTV: boolean("has_cable_tv").default(false),
  hasSmartTV: boolean("has_smart_tv").default(false),
  hasIntercom: boolean("has_intercom").default(false),
  hasSmartHome: boolean("has_smart_home").default(false),

  // Accessibility
  isWheelchairAccessible: boolean("is_wheelchair_accessible").default(false),
  hasHandicapParking: boolean("has_handicap_parking").default(false),

  // Pet policy
  petsAllowed: boolean("pets_allowed").default(false),
  catsAllowed: boolean("cats_allowed").default(false),
  dogsAllowed: boolean("dogs_allowed").default(false),
  petDeposit: decimal("pet_deposit", { precision: 8, scale: 2 }),

  // Additional amenities (flexible)
  customAmenities: jsonb("custom_amenities").$type<string[]>().default([]),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Property rules and policies (Airbnb style)
export const propertyRules = pgTable("property_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  realEstateId: uuid("real_estate_id")
    .notNull()
    .references(() => realEstate.id, { onDelete: "cascade" }),

  // Check-in/out rules (for short-term rentals)
  checkInTime: varchar("check_in_time", { length: 10 }), // "15:00"
  checkOutTime: varchar("check_out_time", { length: 10 }), // "11:00"
  selfCheckIn: boolean("self_check_in").default(false),
  keypadEntry: boolean("keypad_entry").default(false),

  // Guest rules
  maxGuests: integer("max_guests"),
  infantsAllowed: boolean("infants_allowed").default(true),
  childrenAllowed: boolean("children_allowed").default(true),
  eventsAllowed: boolean("events_allowed").default(false),
  partiesAllowed: boolean("parties_allowed").default(false),
  smokingAllowed: boolean("smoking_allowed").default(false),

  // Noise and behavior
  quietHoursStart: varchar("quiet_hours_start", { length: 10 }), // "22:00"
  quietHoursEnd: varchar("quiet_hours_end", { length: 10 }), // "08:00"

  // Cancellation policy
  cancellationPolicy: varchar("cancellation_policy", { length: 20 }).default("moderate"), // flexible, moderate, strict

  // House rules (free text)
  houseRules: text("house_rules"),
  additionalRules: jsonb("additional_rules").$type<string[]>().default([]),

  // Safety features
  hasSmokeDetektor: boolean("has_smoke_detector").default(false),
  hasCarbonMonoxideDetector: boolean("has_carbon_monoxide_detector").default(false),
  hasFireExtinguisher: boolean("has_fire_extinguisher").default(false),
  hasFirstAidKit: boolean("has_first_aid_kit").default(false),
  hasSecurityCamera: boolean("has_security_camera").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
export const providerTypeEnum = pgEnum("provider_type", ["individual", "company", "agency", "freelancer"])
export const verificationLevelEnum = pgEnum("verification_level", ["basic", "verified", "premium", "enterprise"])
export const availabilityStatusEnum = pgEnum("availability_status", ["available", "busy", "away", "offline"])

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

// Real Estate Relations
export const realEstateRelations = relations(realEstate, ({ one, many }) => ({
  listing: one(listings, {
    fields: [realEstate.listingId],
    references: [listings.id],
  }),
  amenities: one(propertyAmenities, {
    fields: [realEstate.id],
    references: [propertyAmenities.realEstateId],
  }),
  rules: one(propertyRules, {
    fields: [realEstate.id],
    references: [propertyRules.realEstateId],
  }),
}))

export const propertyAmenitiesRelations = relations(propertyAmenities, ({ one }) => ({
  realEstate: one(realEstate, {
    fields: [propertyAmenities.realEstateId],
    references: [realEstate.id],
  }),
}))

export const propertyRulesRelations = relations(propertyRules, ({ one }) => ({
  realEstate: one(realEstate, {
    fields: [propertyRules.realEstateId],
    references: [realEstate.id],
  }),
}))

// Service Provider Relations
export const serviceProvidersRelations = relations(serviceProviders, ({ many }) => ({
  listings: many(listings),
  bookings: many(listingBookings),
}))
