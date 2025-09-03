import { Location } from './common'

export enum ListingCategory {
  BIKES = 'bikes',
  CARS = 'cars',
  EQUIPMENT = 'equipment',
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
  amount: number
  currency: string
  period?: PricePeriod
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
  ownerId: string
  title: string
  description: string
  category: ListingCategory
  type: ListingType
  price: Price
  location: Location
  images: string[]
  availability: Availability
  features: Feature[]
  status: ListingStatus
  createdAt: Date
  updatedAt: Date
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
  minPrice?: number
  maxPrice?: number
  location?: {
    latitude: number
    longitude: number
    radius: number
  }
  startDate?: Date
  endDate?: Date
  search?: string
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
