export interface Location {
  latitude: number
  longitude: number
  address: string
  city: string
  region: string
  country: string
  postalCode?: string
  countryCode?: string
  timezone?: string
  formattedAddress?: string
  placeId?: string
  bounds?: {
    northeast: { lat: number; lng: number }
    southwest: { lat: number; lng: number }
  }
}

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface AddressComponent {
  longName: string
  shortName: string
  types: string[]
}

export interface DetailedLocation extends Location {
  addressComponents: AddressComponent[]
  types: string[]
  vicinity?: string
  plusCode?: string
}

export interface LocationSearchResult {
  id: string
  name: string
  type: "country" | "state" | "city" | "district" | "address"
  location: DetailedLocation
  relevanceScore: number
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}

export interface SuccessResponse {
  success: boolean
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utility Types
export type ID = string
export type Timestamp = string
export type Email = string
export type PhoneNumber = string
export type URL = string
export type Base64String = string

// Generic API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
  timestamp: Timestamp
  requestId?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
  stack?: string
}

// File and Media Types
export interface FileUpload {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedAt: Timestamp
  uploadedBy: ID
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
  orientation?: number
}

export interface MediaFile extends FileUpload {
  metadata?: ImageMetadata
  alt?: string
  caption?: string
}

// Search and Filter Types
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: "asc" | "desc"
  }[]
  pagination?: PaginationParams
}

export interface CommonSearchResult<T> {
  items: T[]
  total: number
  facets?: Record<string, SearchFacet[]>
  suggestions?: string[]
  searchTime: number
}

export interface SearchFacet {
  value: string
  count: number
  selected?: boolean
}

// Date and Time Utilities
export interface DateRange {
  startDate: Timestamp
  endDate: Timestamp
}

export interface TimeSlot {
  start: string // HH:mm format
  end: string // HH:mm format
  available: boolean
  price?: number
}

export interface Schedule {
  [dayOfWeek: string]: TimeSlot[]
}

// Contact Information
export interface ContactInfo {
  email?: Email
  phone?: PhoneNumber
  website?: URL
  address?: Location
  socialMedia?: {
    facebook?: URL
    instagram?: URL
    twitter?: URL
    linkedin?: URL
    youtube?: URL
  }
}

// Rating and Review Types
export interface Rating {
  overall: number
  breakdown?: {
    quality: number
    communication: number
    timeliness: number
    value: number
  }
  count: number
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    [rating: number]: number
  }
  recentReviews: {
    id: string
    rating: number
    comment: string
    reviewerName: string
    createdAt: Timestamp
  }[]
}

// Notification Types
export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Timestamp
  expiresAt?: Timestamp
  actionUrl?: URL
  metadata?: Record<string, any>
}

// Validation Constants
export const COMMON_VALIDATION = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
  },
  PHONE: {
    PATTERN: /^\+?[1-9]\d{1,14}$/,
    MAX_LENGTH: 20,
  },
  URL: {
    PATTERN: /^https?:\/\/.+/,
    MAX_LENGTH: 2048,
  },
  COORDINATES: {
    LATITUDE: { MIN: -90, MAX: 90 },
    LONGITUDE: { MIN: -180, MAX: 180 },
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },
} as const
