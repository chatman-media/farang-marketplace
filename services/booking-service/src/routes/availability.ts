import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  hostOrAdmin,
} from '../middleware/auth.js';

const router = Router();
const availabilityController = new AvailabilityController();

// Validation rules
const listingIdValidation = [
  param('listingId').isUUID().withMessage('Listing ID must be a valid UUID'),
];

const providerIdValidation = [
  param('providerId').isUUID().withMessage('Provider ID must be a valid UUID'),
];

const checkAvailabilityValidation = [
  ...listingIdValidation,
  query('checkIn')
    .isISO8601()
    .withMessage('Check-in date must be a valid ISO 8601 date'),
  query('checkOut')
    .optional()
    .isISO8601()
    .withMessage('Check-out date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query?.checkIn) {
        const checkInDate = new Date(req.query.checkIn as string);
        const checkOutDate = new Date(value);
        if (checkOutDate <= checkInDate) {
          throw new Error('Check-out date must be after check-in date');
        }
      }
      return true;
    }),
];

const serviceAvailabilityValidation = [
  ...providerIdValidation,
  body('scheduledDate')
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('duration').isObject().withMessage('Duration must be an object'),
  body('duration.value')
    .isInt({ min: 1 })
    .withMessage('Duration value must be a positive integer'),
  body('duration.unit')
    .isIn(['minutes', 'hours', 'days', 'weeks', 'months'])
    .withMessage('Invalid duration unit'),
];

const calendarValidation = [
  ...listingIdValidation,
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query?.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

const providerAvailabilityValidation = [
  ...providerIdValidation,
  query('date').isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

const blockDatesValidation = [
  ...listingIdValidation,
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  body('reason')
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
];

const unblockDatesValidation = [
  ...listingIdValidation,
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
];

const upcomingBookingsValidation = [
  ...listingIdValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

// Routes

/**
 * @route   GET /api/availability/listings/:listingId/check
 * @desc    Check availability for a listing
 * @access  Public
 */
router.get(
  '/listings/:listingId/check',
  optionalAuthMiddleware,
  checkAvailabilityValidation,
  availabilityController.checkAvailability
);

/**
 * @route   POST /api/availability/providers/:providerId/check
 * @desc    Check service provider availability
 * @access  Public
 */
router.post(
  '/providers/:providerId/check',
  optionalAuthMiddleware,
  serviceAvailabilityValidation,
  availabilityController.checkServiceAvailability
);

/**
 * @route   GET /api/availability/listings/:listingId/calendar
 * @desc    Get availability calendar for a listing
 * @access  Public
 */
router.get(
  '/listings/:listingId/calendar',
  optionalAuthMiddleware,
  calendarValidation,
  availabilityController.getAvailabilityCalendar
);

/**
 * @route   GET /api/availability/providers/:providerId
 * @desc    Get service provider availability for a specific date
 * @access  Public
 */
router.get(
  '/providers/:providerId',
  optionalAuthMiddleware,
  providerAvailabilityValidation,
  availabilityController.getServiceProviderAvailability
);

/**
 * @route   POST /api/availability/listings/:listingId/block
 * @desc    Block dates for maintenance or other reasons
 * @access  Private (hosts and admins only)
 */
router.post(
  '/listings/:listingId/block',
  authMiddleware,
  hostOrAdmin,
  blockDatesValidation,
  availabilityController.blockDates
);

/**
 * @route   POST /api/availability/listings/:listingId/unblock
 * @desc    Unblock previously blocked dates
 * @access  Private (hosts and admins only)
 */
router.post(
  '/listings/:listingId/unblock',
  authMiddleware,
  hostOrAdmin,
  unblockDatesValidation,
  availabilityController.unblockDates
);

/**
 * @route   GET /api/availability/listings/:listingId/upcoming
 * @desc    Get upcoming bookings for a listing
 * @access  Private (hosts and admins only)
 */
router.get(
  '/listings/:listingId/upcoming',
  authMiddleware,
  hostOrAdmin,
  upcomingBookingsValidation,
  availabilityController.getUpcomingBookings
);

export default router;
