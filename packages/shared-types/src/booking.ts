export enum BookingType {
  RENT = 'rent',
  PURCHASE = 'purchase',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export interface AgencyService {
  id: string
  name: string
  price: number
}

export interface Booking {
  id: string
  listingId: string
  renterId: string
  ownerId: string
  type: BookingType
  startDate: Date
  endDate?: Date
  totalAmount: number
  status: BookingStatus
  paymentId?: string
  agencyServices?: AgencyService[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateBookingRequest {
  listingId: string
  type: BookingType
  startDate: Date
  endDate?: Date
  agencyServices?: string[]
}

export interface UpdateStatusRequest {
  status: BookingStatus
  reason?: string
}

export interface BookingResponse extends Booking {
  listing: {
    id: string
    title: string
    images: string[]
    price: {
      amount: number
      currency: string
    }
  }
  renter: {
    id: string
    profile: {
      firstName: string
      lastName: string
    }
  }
  owner: {
    id: string
    profile: {
      firstName: string
      lastName: string
    }
  }
}
