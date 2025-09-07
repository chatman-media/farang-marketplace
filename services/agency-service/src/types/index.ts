// Local types for agency service (temporary until shared-types is properly configured)

export interface Location {
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export enum ServiceCategory {
  DELIVERY = 'delivery',
  EMERGENCY = 'emergency',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  TRANSPORTATION = 'transportation',
  LEGAL = 'legal',
  FINANCIAL = 'financial',
  MARKETING = 'marketing',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

export interface AgencyServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: ServiceCategory;
}

export interface Agency {
  id: string;
  userId: string;
  name: string;
  description: string;
  services: AgencyServiceType[];
  coverage: Location[];
  rating: number;
  commissionRate: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  stack?: string;
}
