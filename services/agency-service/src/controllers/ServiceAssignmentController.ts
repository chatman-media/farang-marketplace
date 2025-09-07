import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ServiceAssignmentService } from '../services/ServiceAssignmentService.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class ServiceAssignmentController {
  private serviceAssignmentService: ServiceAssignmentService;

  constructor() {
    this.serviceAssignmentService = new ServiceAssignmentService();
  }

  /**
   * Create a new service assignment
   */
  async createAssignment(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const assignmentData = req.body;
      const assignment = await this.serviceAssignmentService.createAssignment(assignmentData);

      res.status(201).json({
        success: true,
        message: 'Service assignment created successfully',
        data: assignment,
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create assignment',
      });
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(req: AuthenticatedRequest, res: Response): Promise<any> {
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
          message: 'Assignment ID is required',
        });
      }

      const assignment = await this.serviceAssignmentService.getAssignmentById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      console.error('Error getting assignment:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get assignment',
      });
    }
  }

  /**
   * Get assignments by agency ID
   */
  async getAssignmentsByAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { agencyId } = req.params;
      if (!agencyId) {
        return res.status(400).json({
          success: false,
          message: 'Agency ID is required',
        });
      }

      const assignments = await this.serviceAssignmentService.getAssignmentsByAgencyId(agencyId);

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      console.error('Error getting assignments by agency:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get assignments',
      });
    }
  }

  /**
   * Get assignments by listing ID
   */
  async getAssignmentsByListing(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { listingId } = req.params;
      if (!listingId) {
        return res.status(400).json({
          success: false,
          message: 'Listing ID is required',
        });
      }

      const assignments = await this.serviceAssignmentService.getAssignmentsByListingId(listingId);

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      console.error('Error getting assignments by listing:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get assignments',
      });
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
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
      const { status, notes } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID is required',
        });
      }

      const assignment = await this.serviceAssignmentService.updateAssignmentStatus(id, status, notes);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      res.json({
        success: true,
        message: 'Assignment status updated successfully',
        data: assignment,
      });
    } catch (error) {
      console.error('Error updating assignment status:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update assignment status',
      });
    }
  }

  /**
   * Add customer feedback
   */
  async addCustomerFeedback(req: AuthenticatedRequest, res: Response): Promise<any> {
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
      const { rating, feedback } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID is required',
        });
      }

      const assignment = await this.serviceAssignmentService.addCustomerFeedback(id, rating, feedback);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      res.json({
        success: true,
        message: 'Customer feedback added successfully',
        data: assignment,
      });
    } catch (error) {
      console.error('Error adding customer feedback:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add customer feedback',
      });
    }
  }

  /**
   * Search assignments
   */
  async searchAssignments(req: AuthenticatedRequest, res: Response): Promise<any> {
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
        agencyId: req.query.agencyId as string,
        listingId: req.query.listingId as string,
        bookingId: req.query.bookingId as string,
        status: req.query.status as any,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string),
        } : undefined,
      };

      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as any || 'assignedAt',
        sortOrder: req.query.sortOrder as any || 'desc',
      };

      const result = await this.serviceAssignmentService.searchAssignments(filters, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error searching assignments:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search assignments',
      });
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const agencyId = req.query.agencyId as string;
      const stats = await this.serviceAssignmentService.getAssignmentStats(agencyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get assignment statistics',
      });
    }
  }
}

// Validation rules
export const createAssignmentValidation = [
  body('agencyId').isUUID().withMessage('Valid agency ID is required'),
  body('agencyServiceId').isUUID().withMessage('Valid agency service ID is required'),
  body('listingId').isUUID().withMessage('Valid listing ID is required'),
  body('servicePrice').isFloat({ min: 0 }).withMessage('Service price must be a positive number'),
  body('commissionRate').isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 1'),
  body('bookingId').optional().isUUID().withMessage('Booking ID must be a valid UUID'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
];

export const updateAssignmentStatusValidation = [
  param('id').isUUID().withMessage('Valid assignment ID is required'),
  body('status').isIn(['active', 'paused', 'completed', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
];

export const addFeedbackValidation = [
  param('id').isUUID().withMessage('Valid assignment ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 2000 }).withMessage('Feedback must be less than 2000 characters'),
];

export const assignmentIdValidation = [
  param('id').isUUID().withMessage('Valid assignment ID is required'),
];

export const agencyIdValidation = [
  param('agencyId').isUUID().withMessage('Valid agency ID is required'),
];

export const listingIdValidation = [
  param('listingId').isUUID().withMessage('Valid listing ID is required'),
];
