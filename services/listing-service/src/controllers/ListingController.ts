import { Request, Response } from 'express';
import { ListingService } from '../services/ListingService.js';
import { body, query, param, validationResult } from 'express-validator';
import type {
  CreateVehicleRequest,
  CreateProductRequest,
  VehicleSearchFilters,
  ProductSearchFilters,
} from '@marketplace/shared-types';

export class ListingController {
  private listingService: ListingService;

  constructor() {
    this.listingService = new ListingService();
  }

  // Validation rules for creating vehicle listing
  static createVehicleValidation = [
    body('type').isIn(['scooter', 'motorcycle', 'car', 'bicycle', 'truck', 'van', 'bus', 'boat', 'jet_ski', 'atv', 'other']),
    body('category').isIn(['economy', 'standard', 'premium', 'luxury', 'sport', 'electric', 'classic']),
    body('condition').isIn(['new', 'excellent', 'good', 'fair', 'poor']),
    body('specifications.make').isLength({ min: 2, max: 50 }),
    body('specifications.model').isLength({ min: 1, max: 100 }),
    body('specifications.year').isInt({ min: 1900, max: new Date().getFullYear() + 2 }),
    body('specifications.color').isLength({ min: 2, max: 30 }),
    body('specifications.fuelType').isIn(['gasoline', 'diesel', 'electric', 'hybrid', 'lpg', 'cng']),
    body('specifications.transmission').isIn(['manual', 'automatic', 'cvt', 'semi_automatic']),
    body('specifications.seatingCapacity').isInt({ min: 1, max: 50 }),
    body('documents.licensePlate').notEmpty(),
    body('pricing.basePrice').isFloat({ min: 0.01 }),
    body('pricing.securityDeposit').isFloat({ min: 0 }),
    body('pricing.currency').isLength({ min: 3, max: 3 }),
    body('location.currentLocation').notEmpty(),
    body('images').isArray({ min: 1, max: 20 }),
  ];

  // Validation rules for creating product listing
  static createProductValidation = [
    body('title').isLength({ min: 5, max: 200 }),
    body('description').isLength({ min: 20, max: 5000 }),
    body('type').isIn(['vehicle', 'electronics', 'furniture', 'clothing', 'sports', 'tools', 'books', 'home_garden', 'jewelry', 'toys', 'health_beauty', 'food_beverage', 'real_estate', 'services', 'other']),
    body('category').isLength({ min: 1, max: 100 }),
    body('condition').isIn(['new', 'like_new', 'excellent', 'good', 'fair', 'poor', 'for_parts']),
    body('listingType').isIn(['sale', 'rent', 'both', 'service']),
    body('pricing.price').isFloat({ min: 0.01 }),
    body('pricing.priceType').isIn(['fixed', 'negotiable', 'auction', 'quote_on_request']),
    body('pricing.currency').isLength({ min: 3, max: 3 }),
    body('location.address').notEmpty(),
    body('location.city').notEmpty(),
    body('location.region').notEmpty(),
    body('location.country').notEmpty(),
    body('images').isArray({ min: 1, max: 30 }),
    body('tags').isArray({ min: 1, max: 20 }),
  ];

  // Create vehicle listing
  createVehicleListing = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const vehicleData: CreateVehicleRequest = req.body;
      const listing = await this.listingService.createVehicleListing(ownerId, vehicleData);

      res.status(201).json({
        success: true,
        message: 'Vehicle listing created successfully',
        data: listing,
      });
    } catch (error) {
      console.error('Error creating vehicle listing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vehicle listing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Create product listing
  createProductListing = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const productData: CreateProductRequest = req.body;
      const listing = await this.listingService.createProductListing(ownerId, productData);

      res.status(201).json({
        success: true,
        message: 'Product listing created successfully',
        data: listing,
      });
    } catch (error) {
      console.error('Error creating product listing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product listing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Get vehicle listing by ID
  getVehicleListing = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const listing = await this.listingService.getVehicleListingById(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle listing not found',
        });
      }

      res.json({
        success: true,
        data: listing,
      });
    } catch (error) {
      console.error('Error getting vehicle listing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vehicle listing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Get product listing by ID
  getProductListing = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const listing = await this.listingService.getProductListingById(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Product listing not found',
        });
      }

      res.json({
        success: true,
        data: listing,
      });
    } catch (error) {
      console.error('Error getting product listing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product listing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Search vehicle listings
  searchVehicleListings = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters: VehicleSearchFilters = {
        type: req.query.type ? (Array.isArray(req.query.type) ? req.query.type : [req.query.type]) as any : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) as any : undefined,
        priceRange: req.query.minPrice || req.query.maxPrice ? {
          min: req.query.minPrice ? parseFloat(req.query.minPrice as string) : 0,
          max: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : 999999,
          period: (req.query.pricePeriod as any) || 'day',
        } : undefined,
        location: req.query.location as string,
        radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
        availableFrom: req.query.availableFrom as string,
        availableUntil: req.query.availableUntil as string,
        features: req.query.features ? (Array.isArray(req.query.features) ? req.query.features : [req.query.features]) as string[] : undefined,
        fuelType: req.query.fuelType ? (Array.isArray(req.query.fuelType) ? req.query.fuelType : [req.query.fuelType]) as any : undefined,
        transmission: req.query.transmission ? (Array.isArray(req.query.transmission) ? req.query.transmission : [req.query.transmission]) as any : undefined,
        seatingCapacity: req.query.minSeats || req.query.maxSeats ? {
          min: req.query.minSeats ? parseInt(req.query.minSeats as string) : 1,
          max: req.query.maxSeats ? parseInt(req.query.maxSeats as string) : 50,
        } : undefined,
        yearRange: req.query.minYear || req.query.maxYear ? {
          min: req.query.minYear ? parseInt(req.query.minYear as string) : 1900,
          max: req.query.maxYear ? parseInt(req.query.maxYear as string) : new Date().getFullYear(),
        } : undefined,
        verified: req.query.verified ? req.query.verified === 'true' : undefined,
        rating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      };

      const result = await this.listingService.searchVehicleListings(filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching vehicle listings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search vehicle listings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Search product listings
  searchProductListings = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters: ProductSearchFilters = {
        type: req.query.type ? (Array.isArray(req.query.type) ? req.query.type : [req.query.type]) as any : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) as string[] : undefined,
        condition: req.query.condition ? (Array.isArray(req.query.condition) ? req.query.condition : [req.query.condition]) as any : undefined,
        listingType: req.query.listingType ? (Array.isArray(req.query.listingType) ? req.query.listingType : [req.query.listingType]) as any : undefined,
        priceRange: req.query.minPrice || req.query.maxPrice ? {
          min: req.query.minPrice ? parseFloat(req.query.minPrice as string) : 0,
          max: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : 999999,
        } : undefined,
        location: req.query.city || req.query.region ? {
          city: req.query.city as string,
          region: req.query.region as string,
          radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
        } : undefined,
        availability: {
          inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
          deliveryAvailable: req.query.deliveryAvailable ? req.query.deliveryAvailable === 'true' : undefined,
        },
        seller: {
          verified: req.query.sellerVerified ? req.query.sellerVerified === 'true' : undefined,
          rating: req.query.minSellerRating ? parseFloat(req.query.minSellerRating as string) : undefined,
        },
        features: req.query.features ? (Array.isArray(req.query.features) ? req.query.features : [req.query.features]) as string[] : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) as string[] : undefined,
        sortBy: (req.query.sortBy as any) || 'date',
        sortOrder: (req.query.sortOrder as any) || 'desc',
      };

      const result = await this.listingService.searchProductListings(filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching product listings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search product listings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Update listing status
  updateListingStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ownerId = req.user?.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const validStatuses = ['draft', 'active', 'inactive', 'sold', 'rented', 'reserved', 'maintenance'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }

      const updated = await this.listingService.updateListingStatus(id, status, ownerId);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found or access denied',
        });
      }

      res.json({
        success: true,
        message: 'Listing status updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating listing status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update listing status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Delete listing
  deleteListing = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?.id;

      const deleted = await this.listingService.deleteListing(id, ownerId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found or access denied',
        });
      }

      res.json({
        success: true,
        message: 'Listing deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete listing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// Add user type to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
