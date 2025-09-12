import { Location } from "./common"
import { CountryCode, LanguageCode, ServiceType } from "./listing"

// Service Provider Profile Types
export enum ProviderType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  AGENCY = "agency",
  FREELANCER = "freelancer",
}

export enum BusinessRegistrationStatus {
  REGISTERED = "registered",
  PENDING = "pending",
  NOT_REGISTERED = "not_registered",
}

export enum ProviderVerificationLevel {
  BASIC = "basic",
  VERIFIED = "verified",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}

export enum AvailabilityStatus {
  AVAILABLE = "available",
  BUSY = "busy",
  AWAY = "away",
  OFFLINE = "offline",
}

export interface BusinessLicense {
  id: string
  type: string
  number: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  isValid: boolean
  documentUrl?: string
}

export interface Certification {
  id: string
  name: string
  issuingOrganization: string
  issuedDate: string
  expiryDate?: string
  credentialId?: string
  verificationUrl?: string
  documentUrl?: string
  isVerified: boolean
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  location: Location
  isCurrentPosition: boolean
  achievements?: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate?: string
  gpa?: number
  honors?: string[]
  location: Location
}

export interface ServiceCapability {
  serviceType: ServiceType
  experienceYears: number
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
  specializations: string[]
  certifications: string[]
  portfolioItems: string[]
  pricing: {
    hourlyRate?: number
    projectRate?: number
    consultationRate?: number
    currency: string
  }
  availability: {
    hoursPerWeek: number
    responseTime: string
    workingHours: {
      [key: string]: {
        start: string
        end: string
        available: boolean
      }
    }
  }
}

export interface ServiceProviderProfile {
  id: string
  userId: string
  providerType: ProviderType
  businessName?: string
  displayName: string
  bio: string
  avatar?: string
  coverImage?: string

  // Contact Information
  email: string
  phone: string
  website?: string
  socialMedia?: {
    linkedin?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }

  // Location and Service Areas
  primaryLocation: Location
  serviceAreas: Location[]

  // Business Information
  businessRegistration?: {
    status: BusinessRegistrationStatus
    registrationNumber?: string
    taxId?: string
    licenses: BusinessLicense[]
  }

  // Professional Information
  languages: LanguageCode[]
  certifications: Certification[]
  education: Education[]
  workExperience: WorkExperience[]

  // Service Capabilities
  serviceCapabilities: ServiceCapability[]

  // Verification and Trust
  verificationLevel: ProviderVerificationLevel
  verificationDocuments: {
    identityVerified: boolean
    addressVerified: boolean
    phoneVerified: boolean
    emailVerified: boolean
    businessVerified: boolean
  }

  // Performance Metrics
  metrics: {
    totalJobs: number
    completedJobs: number
    cancelledJobs: number
    averageRating: number
    totalReviews: number
    responseRate: number
    onTimeDelivery: number
    repeatCustomers: number
  }

  // Availability
  availabilityStatus: AvailabilityStatus
  lastActiveAt: string

  // Settings
  settings: {
    autoAcceptBookings: boolean
    instantBooking: boolean
    requireDeposit: boolean
    cancellationPolicy: string
    refundPolicy: string
  }

  // Timestamps
  createdAt: string
  updatedAt: string
  verifiedAt?: string
}

// Request/Response Types
export interface CreateServiceProviderRequest {
  providerType: ProviderType
  businessName?: string
  displayName: string
  bio: string
  email: string
  phone: string
  primaryLocation: Location
  languages: LanguageCode[]
  serviceCapabilities: Omit<ServiceCapability, "portfolioItems">[]
}

export interface UpdateServiceProviderRequest extends Partial<CreateServiceProviderRequest> {
  id: string
  avatar?: string
  coverImage?: string
  website?: string
  socialMedia?: {
    linkedin?: string
    facebook?: string
    instagram?: string
    twitter?: string
  }
  serviceAreas?: Location[]
  certifications?: Certification[]
  education?: Education[]
  workExperience?: WorkExperience[]
  settings?: {
    autoAcceptBookings?: boolean
    instantBooking?: boolean
    requireDeposit?: boolean
    cancellationPolicy?: string
    refundPolicy?: string
  }
}

export interface ServiceProviderFilters {
  providerType?: ProviderType
  serviceTypes?: ServiceType[]
  location?: {
    city?: string
    region?: string
    country?: CountryCode
    radius?: number
  }
  verificationLevel?: ProviderVerificationLevel
  languages?: LanguageCode[]
  availabilityStatus?: AvailabilityStatus
  rating?: {
    min: number
    max: number
  }
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  experienceYears?: {
    min: number
    max: number
  }
  hasPortfolio?: boolean
  instantBooking?: boolean
}

export interface ServiceProviderResponse {
  provider: ServiceProviderProfile
  success: boolean
  message?: string
}

export interface ServiceProvidersResponse {
  providers: ServiceProviderProfile[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Alias for backward compatibility
export type ServiceProviderSearchFilters = ServiceProviderFilters

// Validation Constants
export const SERVICE_PROVIDER_VALIDATION = {
  DISPLAY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  BIO: {
    MIN_LENGTH: 50,
    MAX_LENGTH: 1000,
  },
  BUSINESS_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EXPERIENCE_YEARS: {
    MIN: 0,
    MAX: 50,
  },
  SERVICE_CAPABILITIES: {
    MIN_COUNT: 1,
    MAX_COUNT: 10,
  },
  LANGUAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 10,
  },
  CERTIFICATIONS: {
    MAX_COUNT: 20,
  },
  EDUCATION: {
    MAX_COUNT: 10,
  },
  WORK_EXPERIENCE: {
    MAX_COUNT: 15,
  },
} as const
