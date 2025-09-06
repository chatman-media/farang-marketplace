import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ServiceProviderService } from '../services/ServiceProviderService.js';
import type {
  ServiceProviderFilters,
  ServiceProviderProfile,
} from '@marketplace/shared-types';

// Custom interfaces for our API
interface CreateServiceProviderRequestBody {
  businessName?: string;
  businessType: 'individual' | 'company' | 'agency' | 'freelancer';
  description: string;
  services: Array<{
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
    price: number;
    currency?: string;
    priceType?: 'fixed' | 'hourly' | 'daily' | 'project';
    minimumCharge?: number;
    availability?: {
      daysOfWeek: number[];
      timeSlots: Array<{ start: string; end: string }>;
      timezone: string;
    };
    serviceArea?: {
      radius: number;
      locations: string[];
    };
  }>;
  contactInfo: {
    name?: string;
    phone: string;
    email: string;
    website?: string;
  };
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude?: number;
    longitude?: number;
    postalCode?: string;
  };
  languages?: string[];
  settings?: {
    autoAcceptBookings?: boolean;
    instantBooking?: boolean;
    requireDeposit?: boolean;
    cancellationPolicy?: string;
    refundPolicy?: string;
  };
  images?: string[];
}

interface UpdateServiceProviderRequestBody
  extends Partial<CreateServiceProviderRequestBody> {
  images?: string[];
}

export class ServiceProviderController {
  private serviceProviderService: ServiceProviderService;

  constructor() {
    this.serviceProviderService = new ServiceProviderService();
  }

  // Validation rules for service provider creation
  static createValidationRules = [
    body('businessName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be 2-100 characters'),
    body('businessType')
      .isIn(['individual', 'company', 'partnership'])
      .withMessage('Invalid business type'),
    body('description')
      .isLength({ min: 20, max: 1000 })
      .withMessage('Description must be 20-1000 characters'),
    body('services')
      .isArray({ min: 1 })
      .withMessage('At least one service must be provided'),
    body('services.*.name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Service name must be 2-100 characters'),
    body('services.*.category')
      .notEmpty()
      .withMessage('Service category is required'),
    body('services.*.price')
      .isNumeric()
      .withMessage('Service price must be numeric'),
    body('contactInfo.phone')
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('contactInfo.email').isEmail().withMessage('Valid email is required'),
    body('location.address')
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be 10-200 characters'),
    body('location.city')
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be 2-50 characters'),
    body('location.region')
      .isLength({ min: 2, max: 50 })
      .withMessage('Region must be 2-50 characters'),
    body('location.country')
      .isLength({ min: 2, max: 50 })
      .withMessage('Country must be 2-50 characters'),
  ];

  // Validation rules for service provider update
  static updateValidationRules = [
    body('businessName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be 2-100 characters'),
    body('description')
      .optional()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Description must be 20-1000 characters'),
    body('services')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one service must be provided'),
    body('contactInfo.phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('contactInfo.email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
  ];

  // Create service provider
  async createServiceProvider(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const serviceProviderData = {
        ...req.body,
        ownerId: userId,
        images: req.body.processedImages || [],
      };

      const serviceProvider =
        await this.serviceProviderService.createServiceProvider(
          serviceProviderData
        );

      res.status(201).json({
        success: true,
        data: serviceProvider,
        message: 'Service provider created successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      console.error('Error creating service provider:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create service provider',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }

  // Get service provider by ID
  async getServiceProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const serviceProvider =
        await this.serviceProviderService.getServiceProviderById(id);

      if (!serviceProvider) {
        return res.status(404).json({
          error: {
            code: 'SERVICE_PROVIDER_NOT_FOUND',
            message: 'Service provider not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.json({
        success: true,
        data: serviceProvider,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      console.error('Error fetching service provider:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch service provider',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }

  // Search service providers
  async searchServiceProviders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: ServiceProviderFilters = {
        providerType: req.query.businessType as any,
        serviceTypes: req.query.services
          ? ((req.query.services as string).split(',') as any)
          : undefined,
        location: req.query.location
          ? { city: req.query.location as string }
          : undefined,
        verificationLevel:
          req.query.verified === 'true' ? ('verified' as any) : undefined,
        rating: req.query.rating
          ? {
              min: parseFloat(req.query.rating as string),
              max: 5,
            }
          : undefined,
        priceRange:
          req.query.minPrice || req.query.maxPrice
            ? {
                min: req.query.minPrice
                  ? parseFloat(req.query.minPrice as string)
                  : 0,
                max: req.query.maxPrice
                  ? parseFloat(req.query.maxPrice as string)
                  : 999999,
                currency: 'THB',
              }
            : undefined,
      };

      const result = await this.serviceProviderService.searchServiceProviders(
        filters,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      console.error('Error searching service providers:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search service providers',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }

  // Update service provider
  async updateServiceProvider(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const updateData: UpdateServiceProviderRequestBody = {
        ...req.body,
        images: req.body.processedImages || req.body.images,
      };

      const serviceProvider =
        await this.serviceProviderService.updateServiceProvider(
          id,
          updateData,
          userId
        );

      if (!serviceProvider) {
        return res.status(404).json({
          error: {
            code: 'SERVICE_PROVIDER_NOT_FOUND',
            message: 'Service provider not found or access denied',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.json({
        success: true,
        data: serviceProvider,
        message: 'Service provider updated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      console.error('Error updating service provider:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update service provider',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }

  // Delete service provider
  async deleteServiceProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const success = await this.serviceProviderService.deleteServiceProvider(
        id,
        userId
      );

      if (!success) {
        return res.status(404).json({
          error: {
            code: 'SERVICE_PROVIDER_NOT_FOUND',
            message: 'Service provider not found or access denied',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.json({
        success: true,
        message: 'Service provider deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      console.error('Error deleting service provider:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete service provider',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }
}
