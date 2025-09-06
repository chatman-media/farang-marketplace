export enum BookingType {
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  TOUR = 'tour',
  ACTIVITY = 'activity',
  DINING = 'dining',
  EVENT = 'event',
  SERVICE = 'service',
}

export enum ServiceBookingType {
  CONSULTATION = 'consultation',
  PROJECT = 'project',
  HOURLY = 'hourly',
  PACKAGE = 'package',
  SUBSCRIPTION = 'subscription',
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
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  type: BookingType;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  paymentStatus: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceBooking
  extends Omit<Booking, 'checkIn' | 'checkOut' | 'guests'> {
  serviceType: ServiceBookingType;
  providerId: string;
  scheduledDate: string;
  scheduledTime?: string;
  duration: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
  deliveryMethod: 'online' | 'in_person' | 'hybrid';
  location?: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  requirements: string[];
  deliverables: string[];
  milestones?: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    payment?: {
      amount: number;
      currency: string;
      status: 'pending' | 'paid' | 'failed';
    };
  }[];
  communicationPreference: 'email' | 'phone' | 'chat' | 'video_call';
  timezone: string;
}

export interface CreateBookingRequest {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
}

export interface CreateServiceBookingRequest {
  listingId: string;
  serviceType: ServiceBookingType;
  scheduledDate: string;
  scheduledTime?: string;
  duration: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
  deliveryMethod: 'online' | 'in_person' | 'hybrid';
  location?: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  requirements: string[];
  deliverables: string[];
  communicationPreference: 'email' | 'phone' | 'chat' | 'video_call';
  timezone: string;
  specialRequests?: string;
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  id: string;
}

export interface UpdateServiceBookingRequest
  extends Partial<CreateServiceBookingRequest> {
  id: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  type?: BookingType;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  guestId?: string;
  hostId?: string;
  paymentStatus?: string;
}

export interface ServiceBookingFilters extends Omit<BookingFilters, 'type'> {
  serviceType?: ServiceBookingType;
  providerId?: string;
  deliveryMethod?: 'online' | 'in_person' | 'hybrid';
  communicationPreference?: 'email' | 'phone' | 'chat' | 'video_call';
}

// Booking Analytics and Reporting
export interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookingsByStatus: Record<BookingStatus, number>;
  bookingsByType: Record<BookingType, number>;
  monthlyTrends: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
  topServices?: {
    serviceType: string;
    bookings: number;
    revenue: number;
  }[];
}

// Response Types
export interface BookingApiResponse {
  booking: Booking;
  success: boolean;
  message?: string;
}

export interface ServiceBookingApiResponse {
  booking: ServiceBooking;
  success: boolean;
  message?: string;
}

export interface BookingsListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ServiceBookingsListResponse {
  bookings: ServiceBooking[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Validation Constants
export const BOOKING_VALIDATION = {
  DURATION: {
    MIN_MINUTES: 15,
    MAX_HOURS: 24 * 30, // 30 days
  },
  ADVANCE_BOOKING: {
    MIN_HOURS: 1,
    MAX_DAYS: 365,
  },
  REQUIREMENTS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 200,
  },
  DELIVERABLES: {
    MAX_COUNT: 15,
    MAX_LENGTH: 200,
  },
  SPECIAL_REQUESTS: {
    MAX_LENGTH: 500,
  },
  MILESTONES: {
    MAX_COUNT: 20,
  },
} as const;

export interface UpdateStatusRequest {
  status: BookingStatus;
  reason?: string;
}

export interface BookingResponse extends Booking {
  listing: {
    id: string;
    title: string;
    images: string[];
    price: {
      amount: number;
      currency: string;
    };
  };
  renter: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  owner: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}
