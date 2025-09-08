import { Location } from "./common"
import { Vehicle, VehicleType } from "./vehicle"
import { Product, ProductType } from "./product"

export enum ListingCategory {
  ACCOMMODATION = "accommodation",
  REAL_ESTATE = "real_estate", // Added real estate category
  TRANSPORTATION = "transportation",
  TOURS = "tours",
  ACTIVITIES = "activities",
  DINING = "dining",
  SHOPPING = "shopping",
  SERVICES = "services",
  EVENTS = "events",
  VEHICLES = "vehicles",
  PRODUCTS = "products",
}

// Real Estate specific enums
export enum PropertyType {
  CONDO = "condo",
  APARTMENT = "apartment",
  HOUSE = "house",
  VILLA = "villa",
  TOWNHOUSE = "townhouse",
  STUDIO = "studio",
  PENTHOUSE = "penthouse",
  DUPLEX = "duplex",
  LOFT = "loft",
  COMMERCIAL = "commercial",
  OFFICE = "office",
  RETAIL = "retail",
  WAREHOUSE = "warehouse",
  LAND = "land",
  BUILDING = "building",
}

export enum PropertyStatus {
  AVAILABLE = "available",
  RENTED = "rented",
  SOLD = "sold",
  RESERVED = "reserved",
  UNDER_CONTRACT = "under_contract",
  OFF_MARKET = "off_market",
  MAINTENANCE = "maintenance",
}

export enum ListingPurpose {
  RENT = "rent",
  SALE = "sale",
  SHORT_TERM_RENTAL = "short_term_rental", // Airbnb style
  LONG_TERM_RENTAL = "long_term_rental", // Traditional rental
  BOTH = "both", // Can be rented or sold
}

export enum Furnishing {
  UNFURNISHED = "unfurnished",
  PARTIALLY_FURNISHED = "partially_furnished",
  FULLY_FURNISHED = "fully_furnished",
  LUXURY_FURNISHED = "luxury_furnished",
}

export enum BuildingType {
  LOW_RISE = "low_rise",
  MID_RISE = "mid_rise",
  HIGH_RISE = "high_rise",
  DETACHED = "detached",
  SEMI_DETACHED = "semi_detached",
  TERRACED = "terraced",
  CLUSTER = "cluster",
}

export enum ViewType {
  CITY = "city",
  SEA = "sea",
  MOUNTAIN = "mountain",
  GARDEN = "garden",
  POOL = "pool",
  RIVER = "river",
  PARK = "park",
  GOLF = "golf",
  NO_VIEW = "no_view",
}

export enum Orientation {
  NORTH = "north",
  SOUTH = "south",
  EAST = "east",
  WEST = "west",
  NORTHEAST = "northeast",
  NORTHWEST = "northwest",
  SOUTHEAST = "southeast",
  SOUTHWEST = "southwest",
}

// Real Estate interfaces
export interface RealEstate {
  id: string
  listingId: string

  // Property basics
  propertyType: PropertyType
  propertyStatus: PropertyStatus
  listingPurpose: ListingPurpose

  // Physical characteristics
  bedrooms: number
  bathrooms: number // Can be 2.5, etc.
  area: number // Total area in sqm
  livingArea?: number // Living space only
  landArea?: number // Land plot size
  floor?: number // Which floor (for apartments)
  totalFloors?: number // Total floors in building

  // Building details
  buildingType?: BuildingType
  buildingAge?: number // Years since construction
  yearBuilt?: number
  yearRenovated?: number

  // Furnishing and condition
  furnishing: Furnishing
  condition: string // excellent, good, fair, needs_renovation

  // Views and orientation
  views: ViewType[]
  orientation?: Orientation
  balconies: number
  terraces: number

  // Pricing details
  price: number
  pricePerSqm?: number
  currency: Currency
  priceType: "fixed" | "negotiable" | "auction" | "quote_on_request"

  // Rental specific pricing (Airbnb style)
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  yearlyRate?: number

  // Additional costs
  maintenanceFee?: number
  commonAreaFee?: number
  securityDeposit?: number
  cleaningFee?: number

  // Utilities
  electricityIncluded: boolean
  waterIncluded: boolean
  internetIncluded: boolean
  cableIncluded: boolean
  gasIncluded: boolean

  // Parking
  parkingSpaces: number
  parkingType?: string // covered, open, garage, street
  parkingFee?: number

  // Relations
  amenities?: PropertyAmenities
  rules?: PropertyRules

  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface PropertyAmenities {
  id: string
  realEstateId: string

  // Building amenities
  hasElevator: boolean
  hasSwimmingPool: boolean
  hasFitnessCenter: boolean
  hasSauna: boolean
  hasGarden: boolean
  hasPlayground: boolean
  hasSecurity: boolean
  hasCCTV: boolean
  hasKeyCard: boolean
  hasReception: boolean
  hasConcierge: boolean
  hasMailbox: boolean

  // Unit amenities
  hasAirConditioning: boolean
  hasHeating: boolean
  hasWashingMachine: boolean
  hasDryer: boolean
  hasDishwasher: boolean
  hasMicrowave: boolean
  hasRefrigerator: boolean
  hasOven: boolean
  hasBalcony: boolean
  hasTerrace: boolean
  hasFireplace: boolean
  hasStorage: boolean

  // Technology
  hasWifi: boolean
  hasCableTV: boolean
  hasSmartTV: boolean
  hasIntercom: boolean
  hasSmartHome: boolean

  // Accessibility
  isWheelchairAccessible: boolean
  hasHandicapParking: boolean

  // Pet policy
  petsAllowed: boolean
  catsAllowed: boolean
  dogsAllowed: boolean
  petDeposit?: number

  // Additional amenities
  customAmenities: string[]

  createdAt: Date
  updatedAt: Date
}

export interface PropertyRules {
  id: string
  realEstateId: string

  // Check-in/out rules (for short-term rentals)
  checkInTime?: string // "15:00"
  checkOutTime?: string // "11:00"
  selfCheckIn: boolean
  keypadEntry: boolean

  // Guest rules
  maxGuests?: number
  infantsAllowed: boolean
  childrenAllowed: boolean
  eventsAllowed: boolean
  partiesAllowed: boolean
  smokingAllowed: boolean

  // Noise and behavior
  quietHoursStart?: string // "22:00"
  quietHoursEnd?: string // "08:00"

  // Cancellation policy
  cancellationPolicy: "flexible" | "moderate" | "strict"

  // House rules
  houseRules?: string
  additionalRules: string[]

  // Safety features
  hasSmokeDetektor: boolean
  hasCarbonMonoxideDetector: boolean
  hasFireExtinguisher: boolean
  hasFirstAidKit: boolean
  hasSecurityCamera: boolean

  createdAt: Date
  updatedAt: Date
}

export enum ServiceType {
  VISA_ASSISTANCE = "visa_assistance",
  TRANSLATION = "translation",
  LEGAL_CONSULTATION = "legal_consultation",
  REAL_ESTATE = "real_estate",
  BUSINESS_SETUP = "business_setup",
  INSURANCE = "insurance",
  BANKING = "banking",
  HEALTHCARE = "healthcare",
  EDUCATION = "education",
  RELOCATION = "relocation",
  TAX_CONSULTATION = "tax_consultation",
  PERSONAL_ASSISTANT = "personal_assistant",
}

export enum ServiceDeliveryMethod {
  ONLINE = "online",
  IN_PERSON = "in_person",
  HYBRID = "hybrid",
}

export enum ServiceDuration {
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  PROJECT_BASED = "project_based",
}

export enum ListingType {
  RENT = "rent",
  SALE = "sale",
  BOTH = "both",
}

export enum ListingStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  INACTIVE = "inactive",
}

export enum PricePeriod {
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export interface Price {
  amount: number
  currency: string
  period?: "night" | "day" | "hour" | "week" | "month" | "project"
  discounts?: {
    weekly?: number
    monthly?: number
    seasonal?: {
      startDate: string
      endDate: string
      discount: number
    }[]
  }
}

export interface ServicePrice extends Price {
  consultationFee?: number
  setupFee?: number
  minimumCharge?: number
  packageDeals?: {
    name: string
    description: string
    originalPrice: number
    discountedPrice: number
    services: string[]
  }[]
}

export interface Availability {
  startDate: Date
  endDate: Date
  excludedDates?: Date[]
}

export interface Feature {
  name: string
  value: string
}

export interface Listing {
  id: string
  title: string
  description: string
  category: ListingCategory
  type: ListingType
  price: Price
  location: Location
  images: string[]
  amenities: string[]
  availability: Availability
  ownerId: string
  rating: number
  reviewCount: number
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

// Vehicle-specific listing interface
export interface VehicleListing extends Omit<Listing, "amenities"> {
  category: ListingCategory.VEHICLES
  vehicleType: VehicleType
  vehicle: Vehicle
  rentalTerms?: {
    minimumAge: number
    licenseRequired: boolean
    depositRequired: boolean
    insuranceIncluded: boolean
    fuelPolicy: string
    mileageLimit?: number
    restrictions?: string[]
  }
}

// Product-specific listing interface
export interface ProductListing extends Omit<Listing, "amenities" | "availability"> {
  category: ListingCategory.PRODUCTS
  productType: ProductType
  product: Product
  shippingOptions?: {
    localDelivery: boolean
    nationalShipping: boolean
    internationalShipping: boolean
    pickupAvailable: boolean
    shippingCost?: number
    freeShippingThreshold?: number
  }
}

export interface ServiceListing extends Omit<Listing, "price" | "amenities" | "availability"> {
  serviceType: ServiceType
  price: ServicePrice
  deliveryMethod: ServiceDeliveryMethod
  duration: ServiceDuration
  languages: string[]
  certifications: string[]
  experience: string
  portfolio?: {
    title: string
    description: string
    images: string[]
    completedDate: string
  }[]
  qualifications: string[]
  responseTime: string
  availability: ServiceAvailability
  requirements?: string[]
  deliverables?: string[]
}

export interface ServiceAvailability {
  schedule: {
    [key: string]: {
      start: string
      end: string
      available: boolean
    }[]
  }
  timezone: string
  advanceBooking: {
    minimum: number
    maximum: number
    unit: "hours" | "days" | "weeks"
  }
  blackoutDates?: string[]
}

export interface CreateListingRequest {
  title: string
  description: string
  category: ListingCategory
  type: ListingType
  price: Price
  location: Location
  images: string[]
  availability: Availability
  features: Feature[]
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {}

export interface ListingFilters {
  category?: ListingCategory
  type?: ListingType
  location?: {
    city?: string
    region?: string
    country?: string
    radius?: number
  }
  priceRange?: {
    min: number
    max: number
  }
  dateRange?: {
    startDate: string
    endDate: string
  }
  amenities?: string[]
  rating?: number
  isVerified?: boolean
}

export interface ServiceListingFilters extends Omit<ListingFilters, "amenities"> {
  serviceType?: ServiceType
  deliveryMethod?: ServiceDeliveryMethod
  duration?: ServiceDuration
  languages?: string[]
  certifications?: string[]
  responseTime?: string
  experience?: string
}

export interface CreateServiceListingRequest {
  title: string
  description: string
  category: ListingCategory
  serviceType: ServiceType
  price: Omit<ServicePrice, "currency"> & { currency?: string }
  location: Location
  images: string[]
  deliveryMethod: ServiceDeliveryMethod
  duration: ServiceDuration
  languages: string[]
  certifications?: string[]
  experience: string
  portfolio?: {
    title: string
    description: string
    images: string[]
    completedDate: string
  }[]
  qualifications: string[]
  responseTime: string
  availability: ServiceAvailability
  requirements?: string[]
  deliverables?: string[]
}

export interface UpdateServiceListingRequest extends Partial<CreateServiceListingRequest> {
  id: string
}

// Validation schemas and constants
export const LISTING_VALIDATION = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000,
  },
  IMAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
  },
  PRICE: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 1000000,
  },
} as const

export const SERVICE_VALIDATION = {
  EXPERIENCE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
  QUALIFICATIONS: {
    MAX_COUNT: 10,
  },
  LANGUAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 10,
  },
  CERTIFICATIONS: {
    MAX_COUNT: 15,
  },
  PORTFOLIO: {
    MAX_COUNT: 20,
  },
} as const

// Additional enums for better categorization
export enum ServiceListingStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

export enum ServiceVerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Utility types
export type ListingId = string
export type ServiceListingId = string
export type Currency = "USD" | "EUR" | "THB" | "GBP" | "JPY" | "AUD" | "CAD"
export type LanguageCode = "en" | "th" | "ru" | "zh" | "ja" | "ko" | "de" | "fr" | "es"
export type CountryCode = "TH" | "US" | "GB" | "DE" | "FR" | "JP" | "KR" | "CN" | "RU"

// Response types
export interface ServiceListingResponse {
  listing: ServiceListing
  success: boolean
  message?: string
}

export interface ListingsPageResponse {
  listings: Listing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ServiceListingsPageResponse {
  listings: ServiceListing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ListingResponse extends Listing {
  owner: {
    id: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
      rating: number
    }
  }
}

// Real Estate specific request/response types
export interface CreateRealEstateRequest {
  title: string
  description: string
  category: ListingCategory.REAL_ESTATE

  // Property details
  propertyType: PropertyType
  listingPurpose: ListingPurpose
  bedrooms: number
  bathrooms: number
  area: number
  livingArea?: number
  landArea?: number
  floor?: number
  totalFloors?: number

  // Building details
  buildingType?: BuildingType
  buildingAge?: number
  yearBuilt?: number
  yearRenovated?: number

  // Condition and furnishing
  furnishing: Furnishing
  condition: string
  views: ViewType[]
  orientation?: Orientation
  balconies?: number
  terraces?: number

  // Pricing
  price: number
  pricePerSqm?: number
  currency: Currency
  priceType: "fixed" | "negotiable" | "auction" | "quote_on_request"

  // Rental pricing (if applicable)
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  yearlyRate?: number

  // Additional costs
  maintenanceFee?: number
  commonAreaFee?: number
  securityDeposit?: number
  cleaningFee?: number

  // Utilities
  electricityIncluded?: boolean
  waterIncluded?: boolean
  internetIncluded?: boolean
  cableIncluded?: boolean
  gasIncluded?: boolean

  // Parking
  parkingSpaces?: number
  parkingType?: string
  parkingFee?: number

  // Location
  location: Location

  // Media
  images: string[]
  videos?: string[]
  virtualTour?: string

  // Amenities
  amenities?: Partial<Omit<PropertyAmenities, "id" | "realEstateId" | "createdAt" | "updatedAt">>

  // Rules (for short-term rentals)
  rules?: Partial<Omit<PropertyRules, "id" | "realEstateId" | "createdAt" | "updatedAt">>
}

export interface UpdateRealEstateRequest extends Partial<CreateRealEstateRequest> {
  id: string
}

export interface RealEstateSearchFilters {
  propertyType?: PropertyType[]
  listingPurpose?: ListingPurpose[]
  minPrice?: number
  maxPrice?: number
  currency?: Currency
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  minArea?: number
  maxArea?: number
  furnishing?: Furnishing[]
  buildingType?: BuildingType[]
  views?: ViewType[]

  // Location filters
  city?: string
  district?: string
  region?: string
  country?: string

  // Amenities filters
  hasSwimmingPool?: boolean
  hasFitnessCenter?: boolean
  hasParking?: boolean
  hasElevator?: boolean
  hasAirConditioning?: boolean
  hasWifi?: boolean
  petsAllowed?: boolean

  // Rental specific filters
  availableFrom?: string
  availableTo?: string
  maxGuests?: number

  // General filters
  page?: number
  limit?: number
  sortBy?: "price" | "area" | "bedrooms" | "created_at" | "updated_at"
  sortOrder?: "asc" | "desc"
}

export interface RealEstateListing extends Listing {
  realEstate: RealEstate
}

export interface RealEstateResponse {
  listing: RealEstateListing
  success: boolean
  message?: string
}
