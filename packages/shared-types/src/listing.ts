import { Location } from './common';

export enum ListingCategory {
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  TOURS = 'tours',
  ACTIVITIES = 'activities',
  DINING = 'dining',
  SHOPPING = 'shopping',
  SERVICES = 'services',
  EVENTS = 'events',
}

export enum ServiceType {
  VISA_ASSISTANCE = 'visa_assistance',
  TRANSLATION = 'translation',
  LEGAL_CONSULTATION = 'legal_consultation',
  REAL_ESTATE = 'real_estate',
  BUSINESS_SETUP = 'business_setup',
  INSURANCE = 'insurance',
  BANKING = 'banking',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  RELOCATION = 'relocation',
  TAX_CONSULTATION = 'tax_consultation',
  PERSONAL_ASSISTANT = 'personal_assistant',
}

export enum ServiceDeliveryMethod {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
  HYBRID = 'hybrid',
}

export enum ServiceDuration {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  PROJECT_BASED = 'project_based',
}

export enum ListingType {
  RENT = 'rent',
  SALE = 'sale',
  BOTH = 'both',
}

export enum ListingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
}

export enum PricePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export interface Price {
  amount: number;
  currency: string;
  period?: 'night' | 'day' | 'hour' | 'week' | 'month' | 'project';
  discounts?: {
    weekly?: number;
    monthly?: number;
    seasonal?: {
      startDate: string;
      endDate: string;
      discount: number;
    }[];
  };
}

export interface ServicePrice extends Price {
  consultationFee?: number;
  setupFee?: number;
  minimumCharge?: number;
  packageDeals?: {
    name: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    services: string[];
  }[];
}

export interface Availability {
  startDate: Date;
  endDate: Date;
  excludedDates?: Date[];
}

export interface Feature {
  name: string;
  value: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  price: Price;
  location: Location;
  images: string[];
  amenities: string[];
  availability: Availability;
  ownerId: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ServiceListing
  extends Omit<Listing, 'price' | 'amenities' | 'availability'> {
  serviceType: ServiceType;
  price: ServicePrice;
  deliveryMethod: ServiceDeliveryMethod;
  duration: ServiceDuration;
  languages: string[];
  certifications: string[];
  experience: string;
  portfolio?: {
    title: string;
    description: string;
    images: string[];
    completedDate: string;
  }[];
  qualifications: string[];
  responseTime: string;
  availability: ServiceAvailability;
  requirements?: string[];
  deliverables?: string[];
}

export interface ServiceAvailability {
  schedule: {
    [key: string]: {
      start: string;
      end: string;
      available: boolean;
    }[];
  };
  timezone: string;
  advanceBooking: {
    minimum: number;
    maximum: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  blackoutDates?: string[];
}

export interface CreateListingRequest {
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  price: Price;
  location: Location;
  images: string[];
  availability: Availability;
  features: Feature[];
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {}

export interface ListingFilters {
  category?: ListingCategory;
  type?: ListingType;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    radius?: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  amenities?: string[];
  rating?: number;
  isVerified?: boolean;
}

export interface ServiceListingFilters
  extends Omit<ListingFilters, 'amenities'> {
  serviceType?: ServiceType;
  deliveryMethod?: ServiceDeliveryMethod;
  duration?: ServiceDuration;
  languages?: string[];
  certifications?: string[];
  responseTime?: string;
  experience?: string;
}

export interface CreateServiceListingRequest {
  title: string;
  description: string;
  category: ListingCategory;
  serviceType: ServiceType;
  price: Omit<ServicePrice, 'currency'> & { currency?: string };
  location: Location;
  images: string[];
  deliveryMethod: ServiceDeliveryMethod;
  duration: ServiceDuration;
  languages: string[];
  certifications?: string[];
  experience: string;
  portfolio?: {
    title: string;
    description: string;
    images: string[];
    completedDate: string;
  }[];
  qualifications: string[];
  responseTime: string;
  availability: ServiceAvailability;
  requirements?: string[];
  deliverables?: string[];
}

export interface UpdateServiceListingRequest
  extends Partial<CreateServiceListingRequest> {
  id: string;
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
} as const;

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
} as const;

// Additional enums for better categorization
export enum ServiceListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export enum ServiceVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Utility types
export type ListingId = string;
export type ServiceListingId = string;
export type Currency = 'USD' | 'EUR' | 'THB' | 'GBP' | 'JPY' | 'AUD' | 'CAD';
export type LanguageCode =
  | 'en'
  | 'th'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'de'
  | 'fr'
  | 'es';
export type CountryCode =
  | 'TH'
  | 'US'
  | 'GB'
  | 'DE'
  | 'FR'
  | 'JP'
  | 'KR'
  | 'CN'
  | 'RU';

// Response types
export interface ServiceListingResponse {
  listing: ServiceListing;
  success: boolean;
  message?: string;
}

export interface ListingsPageResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ServiceListingsPageResponse {
  listings: ServiceListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ListingResponse extends Listing {
  owner: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
      rating: number;
    };
  };
}
