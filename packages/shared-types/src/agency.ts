import { Location } from './common';

export enum ServiceCategory {
  DELIVERY = 'delivery',
  EMERGENCY = 'emergency',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
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
