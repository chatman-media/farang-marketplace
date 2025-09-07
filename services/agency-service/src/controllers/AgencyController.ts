import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AgencyService } from '../services/AgencyService.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class AgencyController {
  private agencyService: AgencyService;

  constructor() {
    this.agencyService = new AgencyService();
  }

  /**
   * Create a new agency
   */
  async createAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const agencyData = {
        ...req.body,
        userId: req.user!.id,
      };

      const agency = await this.agencyService.createAgency(agencyData);

      res.status(201).json({
        success: true,
        message: 'Agency created successfully',
        data: agency,
      });
    } catch (error) {
      console.error('Error creating agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create agency',
      });
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const agency = await this.agencyService.getAgencyById(id);

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
      }

      res.json({
        success: true,
        data: agency,
      });
    } catch (error) {
      console.error('Error getting agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agency',
      });
    }
  }

  /**
   * Get current user's agency
   */
  async getMyAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const agency = await this.agencyService.getAgencyByUserId(req.user!.id);

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: 'No agency found for current user',
        });
      }

      res.json({
        success: true,
        data: agency,
      });
    } catch (error) {
      console.error('Error getting user agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agency',
      });
    }
  }

  /**
   * Update agency
   */
  async updateAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const updates = req.body;

      const agency = await this.agencyService.updateAgency(id, updates);

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
      }

      res.json({
        success: true,
        message: 'Agency updated successfully',
        data: agency,
      });
    } catch (error) {
      console.error('Error updating agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update agency',
      });
    }
  }

  /**
   * Delete agency
   */
  async deleteAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const deleted = await this.agencyService.deleteAgency(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
      }

      res.json({
        success: true,
        message: 'Agency deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agency',
      });
    }
  }

  /**
   * Search agencies
   */
  async searchAgencies(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const filters = {
        status: req.query.status as any,
        verificationStatus: req.query.verificationStatus as any,
        category: req.query.category as any,
        search: req.query.search as string,
        rating: req.query.minRating ? {
          min: parseFloat(req.query.minRating as string),
          max: req.query.maxRating ? parseFloat(req.query.maxRating as string) : 5,
        } : undefined,
        commissionRate: req.query.minCommission ? {
          min: parseFloat(req.query.minCommission as string),
          max: req.query.maxCommission ? parseFloat(req.query.maxCommission as string) : 1,
        } : undefined,
      };

      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc',
      };

      const result = await this.agencyService.searchAgencies(filters, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching agencies:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search agencies',
      });
    }
  }

  /**
   * Verify agency (admin only)
   */
  async verifyAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const { verificationNotes } = req.body;

      const agency = await this.agencyService.verifyAgency(id, verificationNotes);

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
      }

      res.json({
        success: true,
        message: 'Agency verified successfully',
        data: agency,
      });
    } catch (error) {
      console.error('Error verifying agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify agency',
      });
    }
  }

  /**
   * Reject agency verification (admin only)
   */
  async rejectAgencyVerification(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const { reason } = req.body;

      const agency = await this.agencyService.rejectAgencyVerification(id, reason);

      if (!agency) {
        return res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
      }

      res.json({
        success: true,
        message: 'Agency verification rejected',
        data: agency,
      });
    } catch (error) {
      console.error('Error rejecting agency verification:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject agency verification',
      });
    }
  }

  /**
   * Get agency statistics
   */
  async getAgencyStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }
      const stats = await this.agencyService.getAgencyStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting agency stats:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agency statistics',
      });
    }
  }
}

// Validation rules
export const createAgencyValidation = [
  body('name').isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('primaryLocation').isObject().withMessage('Primary location is required'),
  body('commissionRate').optional().isFloat({ min: 0.01, max: 0.5 }).withMessage('Commission rate must be between 1% and 50%'),
];

export const updateAgencyValidation = [
  param('id').isUUID().withMessage('Valid agency ID is required'),
  body('name').optional().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  body('commissionRate').optional().isFloat({ min: 0.01, max: 0.5 }).withMessage('Commission rate must be between 1% and 50%'),
];

export const agencyIdValidation = [
  param('id').isUUID().withMessage('Valid agency ID is required'),
];

export const verifyAgencyValidation = [
  param('id').isUUID().withMessage('Valid agency ID is required'),
  body('verificationNotes').optional().isLength({ max: 1000 }).withMessage('Verification notes must be less than 1000 characters'),
];

export const rejectAgencyValidation = [
  param('id').isUUID().withMessage('Valid agency ID is required'),
  body('reason').isLength({ min: 10, max: 1000 }).withMessage('Rejection reason must be between 10 and 1000 characters'),
];
