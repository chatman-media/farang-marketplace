import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentService } from '../services/PaymentService.js';
import type {
  CreatePaymentRequest,
  PaymentSearchFilters,
} from '../services/PaymentService.js';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Initialize payment service
   */
  async initialize(): Promise<void> {
    await this.paymentService.initialize();
  }

  /**
   * Create a new payment
   */
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid payment data',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const paymentRequest: CreatePaymentRequest = {
        bookingId: req.body.bookingId,
        payerId: userId,
        payeeId: req.body.payeeId,
        amount: req.body.amount,
        currency: req.body.currency || 'TON',
        fiatAmount: req.body.fiatAmount,
        fiatCurrency: req.body.fiatCurrency || 'USD',
        paymentMethod: req.body.paymentMethod,
        description: req.body.description,
        metadata: req.body.metadata,
        tonWalletAddress: req.body.tonWalletAddress,
      };

      // Validate payment method
      if (
        !this.paymentService.validatePaymentMethod(
          paymentRequest.paymentMethod,
          req.body
        )
      ) {
        res.status(400).json({
          error: 'Invalid Payment Method',
          message: 'Payment method validation failed',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const payment = await this.paymentService.createPayment(paymentRequest);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create payment',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Process TON payment
   */
  processTonPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid payment processing data',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { paymentId } = req.params;
      const { fromAddress } = req.body;

      const payment = await this.paymentService.processTonPayment(
        paymentId,
        fromAddress
      );

      res.json({
        success: true,
        data: payment,
        message: 'TON payment processed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Process TON payment error:', error);
      res.status(500).json({
        error: 'Payment Processing Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to process TON payment',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Process Stripe payment
   */
  processStripePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid Stripe payment data',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { paymentId } = req.params;
      const { paymentMethodId, customerId } = req.body;

      const payment = await this.paymentService.processStripePayment(
        paymentId,
        paymentMethodId,
        customerId
      );

      res.json({
        success: true,
        data: payment,
        message: 'Stripe payment processed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Process Stripe payment error:', error);
      res.status(500).json({
        error: 'Payment Processing Error',
        message: error instanceof Error ? error.message : 'Failed to process Stripe payment',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Confirm Stripe payment
   */
  confirmStripePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      const payment = await this.paymentService.confirmStripePayment(paymentId);

      res.json({
        success: true,
        data: payment,
        message: 'Stripe payment confirmed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Confirm Stripe payment error:', error);
      res.status(500).json({
        error: 'Payment Confirmation Error',
        message: error instanceof Error ? error.message : 'Failed to confirm Stripe payment',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get payment by ID
   */
  getPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      const payment = await this.paymentService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if user has access to this payment
      if (
        payment.payerId !== userId &&
        payment.payeeId !== userId &&
        req.user?.role !== 'admin'
      ) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied to this payment',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve payment',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Search payments
   */
  searchPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Build search filters
      const filters: PaymentSearchFilters = {};

      // Non-admin users can only see their own payments
      if (userRole !== 'admin') {
        if (req.query.payerId && req.query.payerId !== userId) {
          filters.payerId = userId;
        } else if (req.query.payeeId && req.query.payeeId !== userId) {
          filters.payeeId = userId;
        } else {
          // Show payments where user is either payer or payee
          filters.payerId = userId;
        }
      } else {
        // Admin can filter by any user
        if (req.query.payerId) filters.payerId = req.query.payerId as string;
        if (req.query.payeeId) filters.payeeId = req.query.payeeId as string;
      }

      if (req.query.status) filters.status = req.query.status as any;
      if (req.query.bookingId)
        filters.bookingId = req.query.bookingId as string;
      if (req.query.paymentMethod)
        filters.paymentMethod = req.query.paymentMethod as any;
      if (req.query.startDate)
        filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate)
        filters.endDate = new Date(req.query.endDate as string);
      if (req.query.minAmount)
        filters.minAmount = parseFloat(req.query.minAmount as string);
      if (req.query.maxAmount)
        filters.maxAmount = parseFloat(req.query.maxAmount as string);

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      const result = await this.paymentService.searchPayments(
        filters,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Search payments error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search payments',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Update payment status
   */
  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid status update data',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { paymentId } = req.params;
      const { status, reason } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Check if user has permission to update payment status
      const payment = await this.paymentService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Only admin or payee can update payment status
      if (userRole !== 'admin' && payment.payeeId !== userId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions to update payment status',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updatedPayment = await this.paymentService.updatePaymentStatus(
        paymentId,
        status,
        reason
      );

      res.json({
        success: true,
        data: updatedPayment,
        message: 'Payment status updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update payment status',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get payment transactions
   */
  getPaymentTransactions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      // Check if user has access to this payment
      const payment = await this.paymentService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (
        payment.payerId !== userId &&
        payment.payeeId !== userId &&
        req.user?.role !== 'admin'
      ) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied to payment transactions',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const transactions =
        await this.paymentService.getPaymentTransactions(paymentId);

      res.json({
        success: true,
        data: transactions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get payment transactions error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve payment transactions',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
