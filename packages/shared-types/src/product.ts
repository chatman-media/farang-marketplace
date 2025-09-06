// Universal Product Types for Thailand Marketplace

export enum ProductType {
  VEHICLE = 'vehicle',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  SPORTS = 'sports',
  TOOLS = 'tools',
  BOOKS = 'books',
  HOME_GARDEN = 'home_garden',
  JEWELRY = 'jewelry',
  TOYS = 'toys',
  HEALTH_BEAUTY = 'health_beauty',
  FOOD_BEVERAGE = 'food_beverage',
  REAL_ESTATE = 'real_estate',
  SERVICES = 'services',
  OTHER = 'other',
}

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  FOR_PARTS = 'for_parts',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD = 'sold',
  RENTED = 'rented',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected',
}

export enum ProductListingType {
  SALE = 'sale',
  RENT = 'rent',
  BOTH = 'both',
  SERVICE = 'service',
}

export enum PriceType {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  AUCTION = 'auction',
  QUOTE_ON_REQUEST = 'quote_on_request',
}

export interface ProductDimensions {
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  weight?: number; // kg
  volume?: number; // liters
}

export interface ProductSpecifications {
  // Basic Info
  brand?: string;
  model?: string;
  serialNumber?: string;
  manufacturingYear?: number;
  countryOfOrigin?: string;

  // Physical Properties
  dimensions?: ProductDimensions;
  material?: string;
  color?: string;
  size?: string; // for clothing, shoes, etc.

  // Technical Specifications (flexible for different product types)
  technicalSpecs?: Record<string, string | number | boolean>;

  // Features and Capabilities
  features: string[];
  included?: string[]; // what's included in the package
  requirements?: string[]; // system requirements, compatibility, etc.

  // Condition Details
  conditionNotes?: string;
  defects?: string[];
  repairs?: string[];

  // Warranty & Support
  warrantyPeriod?: string;
  warrantyType?: 'manufacturer' | 'seller' | 'none';
  supportAvailable?: boolean;
  manualIncluded?: boolean;
}

export interface ProductPricing {
  // Basic Pricing
  price: number;
  currency: string;
  priceType: PriceType;

  // Original/Comparison Pricing
  originalPrice?: number;
  msrp?: number; // Manufacturer's Suggested Retail Price

  // Rental Pricing (if applicable)
  rentalPricing?: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    deposit?: number;
    minimumRentalPeriod?: string;
  };

  // Auction Pricing (if applicable)
  auctionPricing?: {
    startingBid: number;
    reservePrice?: number;
    buyNowPrice?: number;
    bidIncrement: number;
    auctionEndDate: string;
  };

  // Additional Costs
  shippingCost?: number;
  handlingFee?: number;
  installationFee?: number;

  // Discounts and Offers
  discounts?: {
    percentage?: number;
    amount?: number;
    validUntil?: string;
    conditions?: string;
  }[];

  // Bulk Pricing
  bulkPricing?: {
    quantity: number;
    pricePerUnit: number;
  }[];

  // Payment Options
  acceptedPayments: string[];
  installmentAvailable?: boolean;
  installmentOptions?: {
    months: number;
    monthlyPayment: number;
    interestRate?: number;
  }[];
}

export interface ProductAvailability {
  isAvailable: boolean;
  quantity?: number;
  quantityType?: 'exact' | 'approximate' | 'unlimited';

  // Rental Availability
  availableFrom?: string;
  availableUntil?: string;
  blackoutDates?: string[];

  // Stock Management
  stockLevel?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  restockDate?: string;

  // Location Availability
  availableLocations?: string[];
  pickupLocations?: string[];
  deliveryAvailable?: boolean;
  deliveryAreas?: string[];
  deliveryTime?: string;
}

export interface ProductSeller {
  sellerId: string;
  sellerType: 'individual' | 'business' | 'dealer' | 'agency';
  sellerName: string;
  sellerRating?: number;
  sellerReviews?: number;
  isVerified: boolean;
  businessLicense?: string;
  taxId?: string;

  // Contact Information
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    socialMedia?: Record<string, string>;
  };

  // Business Details
  businessHours?: string;
  languages?: string[];
  responseTime?: string;

  // Policies
  returnPolicy?: string;
  warrantyPolicy?: string;
  shippingPolicy?: string;
}

export interface Product {
  id: string;

  // Basic Information
  title: string;
  description: string;
  type: ProductType;
  category: string; // specific category within type
  subcategory?: string;
  condition: ProductCondition;
  status: ProductStatus;
  listingType: ProductListingType;

  // Detailed Information
  specifications: ProductSpecifications;
  pricing: ProductPricing;
  availability: ProductAvailability;
  seller: ProductSeller;

  // Media
  images: string[];
  mainImage?: string;
  videos?: string[];
  documents?: string[]; // manuals, certificates, etc.

  // Location
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    zipCode?: string;
  };

  // SEO and Discovery
  tags: string[];
  keywords?: string[];
  slug?: string;

  // Quality and Trust
  isVerified: boolean;
  verificationDate?: string;
  qualityScore?: number;
  trustScore?: number;

  // Performance Metrics
  views: number;
  favorites: number;
  inquiries: number;
  averageRating: number;
  reviewCount: number;

  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  flagReasons?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;

  // Additional Data
  metadata?: Record<string, any>;
  customFields?: Record<string, any>;

  // Related Products
  relatedProducts?: string[];
  crossSellProducts?: string[];

  // Analytics
  analytics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue?: number;
  };
}

// Request/Response Types
export interface CreateProductRequest {
  title: string;
  description: string;
  type: ProductType;
  category: string;
  subcategory?: string;
  condition: ProductCondition;
  listingType: ProductListingType;
  specifications: ProductSpecifications;
  pricing: ProductPricing;
  availability: ProductAvailability;
  images: string[];
  location: Product['location'];
  tags: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductSearchFilters {
  type?: ProductType[];
  category?: string[];
  condition?: ProductCondition[];
  listingType?: ProductListingType[];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    city?: string;
    region?: string;
    radius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  availability?: {
    inStock?: boolean;
    deliveryAvailable?: boolean;
  };
  seller?: {
    type?: string[];
    verified?: boolean;
    rating?: number;
  };
  features?: string[];
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  sortBy?: 'price' | 'date' | 'rating' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  filters: ProductSearchFilters;
  suggestions?: string[];
  facets?: {
    categories: { name: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    locations: { name: string; count: number }[];
    conditions: { name: string; count: number }[];
  };
}

// Validation Constants
export const PRODUCT_VALIDATION = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 5000,
  },
  IMAGES: {
    MIN_COUNT: 1,
    MAX_COUNT: 30,
  },
  TAGS: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
    TAG_MAX_LENGTH: 30,
  },
  PRICE: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 10000000,
  },
  FEATURES: {
    MAX_COUNT: 100,
  },
} as const;
