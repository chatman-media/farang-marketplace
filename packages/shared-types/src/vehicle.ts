// Vehicle and Transportation Types for Thailand Marketplace

export enum VehicleType {
  SCOOTER = "scooter",
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  BICYCLE = "bicycle",
  TRUCK = "truck",
  VAN = "van",
  BUS = "bus",
  BOAT = "boat",
  JET_SKI = "jet_ski",
  ATV = "atv",
  OTHER = "other",
}

export enum VehicleCategory {
  ECONOMY = "economy",
  STANDARD = "standard",
  PREMIUM = "premium",
  LUXURY = "luxury",
  SPORT = "sport",
  ELECTRIC = "electric",
  CLASSIC = "classic",
}

export enum FuelType {
  GASOLINE = "gasoline",
  DIESEL = "diesel",
  ELECTRIC = "electric",
  HYBRID = "hybrid",
  LPG = "lpg",
  CNG = "cng",
}

export enum TransmissionType {
  MANUAL = "manual",
  AUTOMATIC = "automatic",
  CVT = "cvt",
  SEMI_AUTOMATIC = "semi_automatic",
}

export enum VehicleCondition {
  NEW = "new",
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
}

export enum VehicleStatus {
  AVAILABLE = "available",
  RENTED = "rented",
  MAINTENANCE = "maintenance",
  RESERVED = "reserved",
  INACTIVE = "inactive",
}

export interface VehicleSpecifications {
  // Basic Info
  make: string
  model: string
  year: number
  color: string

  // Engine & Performance
  engineSize?: string // e.g., "125cc", "1.6L"
  power?: string // e.g., "150hp", "10kW"
  maxSpeed?: number // km/h
  fuelConsumption?: number // L/100km or km/charge

  // Technical Details
  fuelType: FuelType
  transmission: TransmissionType
  seatingCapacity: number
  doors?: number

  // Dimensions
  length?: number // cm
  width?: number // cm
  height?: number // cm
  weight?: number // kg

  // Features
  features: string[]
  safetyFeatures: string[]
  comfortFeatures: string[]
  technologyFeatures: string[]
}

export interface VehicleDocuments {
  // Registration & Legal
  licensePlate: string
  registrationNumber?: string
  engineNumber?: string
  chassisNumber?: string

  // Insurance & Inspection
  insuranceNumber?: string
  insuranceExpiry?: string
  techInspectionExpiry?: string

  // Documentation Status
  documentsComplete: boolean
  documentsVerified: boolean
  documentsNotes?: string
}

export interface VehicleMaintenance {
  // Service History
  lastServiceDate?: string
  lastServiceKm?: number
  nextServiceDue?: string
  nextServiceKm?: number

  // Component Status (in km when last replaced/checked)
  engineOilKm?: number
  gearOilKm?: number
  coolantKm?: number
  brakeFluidKm?: number

  // Brake System
  frontBrakesKm?: number
  rearBrakesKm?: number
  brakeDiscsKm?: number

  // Filters & Consumables
  airFilterKm?: number
  fuelFilterKm?: number
  sparkPlugsKm?: number

  // Tires & Suspension
  frontTireCondition?: string
  rearTireCondition?: string
  frontBearingCondition?: string
  rearBearingCondition?: string

  // Electrical & Other
  batteryCondition?: string
  starterCondition?: string
  beltCondition?: string
  gasketCondition?: string

  // Additional Components
  additionalComponents?: Record<string, string>
  maintenanceNotes?: string

  // GPS & Tracking
  gpsTrackerId?: string
  gpsProvider?: string

  // Accessories
  hasCharger?: boolean
  hasHelmet?: boolean
  hasLock?: boolean
  accessories?: string[]
}

export interface VehiclePricing {
  // Base Pricing
  basePrice: number
  currency: string

  // Duration-based Pricing
  hourlyRate?: number
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  yearlyRate?: number

  // Seasonal Pricing
  highSeasonMultiplier?: number
  lowSeasonMultiplier?: number
  seasonalPrices?: {
    [month: string]: number
  }

  // Duration Discounts
  durationDiscounts?: {
    days1_3?: number
    days4_7?: number
    days8_14?: number
    days15_30?: number
    monthly?: number
    longTerm?: number
  }

  // Additional Costs
  securityDeposit: number
  insurancePerDay?: number
  deliveryFee?: number
  pickupFee?: number
  lateFee?: number
  damageFee?: number

  // Fuel Policy
  fuelPolicy: "full_to_full" | "same_to_same" | "included" | "pay_per_use"
  fuelCostPerLiter?: number
}

export interface VehicleLocation {
  // Current Location
  currentLocation: string
  coordinates?: {
    latitude: number
    longitude: number
  }

  // Pickup/Delivery
  pickupLocations: string[]
  deliveryAvailable: boolean
  deliveryRadius?: number // km
  deliveryFee?: number

  // Service Area
  serviceAreas: string[]
  restrictedAreas?: string[]
}

export interface Vehicle {
  id: string
  ownerId: string

  // Basic Information
  type: VehicleType
  category: VehicleCategory
  condition: VehicleCondition
  status: VehicleStatus

  // Detailed Specifications
  specifications: VehicleSpecifications
  documents: VehicleDocuments
  maintenance: VehicleMaintenance
  pricing: VehiclePricing
  location: VehicleLocation

  // Media
  images: string[]
  mainImage?: string
  videoUrl?: string

  // Availability
  isAvailable: boolean
  availableFrom?: string
  availableUntil?: string
  blackoutDates?: string[]

  // Verification & Quality
  isVerified: boolean
  verificationDate?: string
  qualityScore?: number

  // Rental History
  totalRentals: number
  totalKilometers: number
  averageRating: number
  reviewCount: number

  // Metadata
  createdAt: string
  updatedAt: string
  lastMaintenanceUpdate?: string

  // Additional Data
  metadata?: Record<string, any>
  tags?: string[]
  notes?: string
}

// Request/Response Types
export interface CreateVehicleRequest {
  type: VehicleType
  category: VehicleCategory
  condition: VehicleCondition
  specifications: VehicleSpecifications
  documents: Partial<VehicleDocuments>
  maintenance?: Partial<VehicleMaintenance>
  pricing: VehiclePricing
  location: VehicleLocation
  images: string[]
  notes?: string
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  id: string
}

export interface VehicleSearchFilters {
  type?: VehicleType[]
  category?: VehicleCategory[]
  priceRange?: {
    min: number
    max: number
    period: "hour" | "day" | "week" | "month"
  }
  location?: string
  radius?: number
  availableFrom?: string
  availableUntil?: string
  features?: string[]
  fuelType?: FuelType[]
  transmission?: TransmissionType[]
  seatingCapacity?: {
    min: number
    max: number
  }
  yearRange?: {
    min: number
    max: number
  }
  verified?: boolean
  rating?: number
}

// Validation Constants
export const VEHICLE_VALIDATION = {
  SPECIFICATIONS: {
    MAKE: { MIN_LENGTH: 2, MAX_LENGTH: 50 },
    MODEL: { MIN_LENGTH: 1, MAX_LENGTH: 100 },
    YEAR: { MIN: 1900, MAX: new Date().getFullYear() + 2 },
    COLOR: { MIN_LENGTH: 2, MAX_LENGTH: 30 },
  },
  PRICING: {
    MIN_PRICE: 0.01,
    MAX_PRICE: 1000000,
    MIN_DEPOSIT: 0,
    MAX_DEPOSIT: 100000,
  },
  IMAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
  },
  FEATURES: {
    MAX_COUNT: 50,
  },
} as const
