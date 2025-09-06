import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AvailabilityService } from '../services/AvailabilityService.js';

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  // Check availability for a listing
  checkAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { listingId } = req.params;
      const { checkIn, checkOut } = req.query;

      const checkInDate = new Date(checkIn as string);
      const checkOutDate = checkOut ? new Date(checkOut as string) : undefined;

      const isAvailable = await this.availabilityService.checkAvailability(
        listingId,
        checkInDate,
        checkOutDate
      );

      res.json({
        success: true,
        data: {
          listingId,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate?.toISOString(),
          available: isAvailable,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error checking availability:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check availability',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Check service provider availability
  checkServiceAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { providerId } = req.params;
      const { scheduledDate, duration } = req.body;

      const scheduledDateTime = new Date(scheduledDate);

      const isAvailable =
        await this.availabilityService.checkServiceAvailability(
          providerId,
          scheduledDateTime,
          duration
        );

      res.json({
        success: true,
        data: {
          providerId,
          scheduledDate: scheduledDateTime.toISOString(),
          duration,
          available: isAvailable,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error checking service availability:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check service availability',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Get availability calendar for a listing
  getAvailabilityCalendar = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { listingId } = req.params;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Validate date range
      if (end <= start) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'End date must be after start date',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Limit the range to prevent excessive queries
      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 365) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Date range cannot exceed 365 days',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const calendar = await this.availabilityService.getAvailabilityCalendar(
        listingId,
        start,
        end
      );

      res.json({
        success: true,
        data: {
          listingId,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          calendar,
          summary: {
            totalDays: calendar.length,
            availableDays: calendar.filter((day) => day.available).length,
            unavailableDays: calendar.filter((day) => !day.available).length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting availability calendar:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get availability calendar',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Get service provider availability for a specific date
  getServiceProviderAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { providerId } = req.params;
      const { date } = req.query;

      const targetDate = new Date(date as string);

      const availability =
        await this.availabilityService.getServiceProviderAvailability(
          providerId,
          targetDate
        );

      res.json({
        success: true,
        data: {
          ...availability,
          summary: {
            totalSlots: availability.timeSlots.length,
            availableSlots: availability.timeSlots.filter(
              (slot) => slot.available
            ).length,
            bookedSlots: availability.timeSlots.filter(
              (slot) => !slot.available
            ).length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting service provider availability:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get service provider availability',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Block dates for maintenance or other reasons
  blockDates = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { listingId } = req.params;
      const { startDate, endDate, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      await this.availabilityService.blockDates(
        listingId,
        start,
        end,
        reason,
        userId
      );

      res.json({
        success: true,
        message: 'Dates blocked successfully',
        data: {
          listingId,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          reason,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error blocking dates:', error);

      const statusCode = error.message.includes('already unavailable')
        ? 409
        : 500;

      res.status(statusCode).json({
        error: statusCode === 409 ? 'Conflict' : 'Internal Server Error',
        message: error.message || 'Failed to block dates',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Unblock dates
  unblockDates = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { listingId } = req.params;
      const { startDate, endDate } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      await this.availabilityService.unblockDates(listingId, start, end);

      res.json({
        success: true,
        message: 'Dates unblocked successfully',
        data: {
          listingId,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error unblocking dates:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to unblock dates',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Get upcoming bookings for a listing
  getUpcomingBookings = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation Error',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { listingId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Verify user has access to this listing
      // This would typically involve checking if the user is the host of the listing

      const upcomingBookings =
        await this.availabilityService.getUpcomingBookings(
          listingId,
          Math.min(limit, 50) // Cap at 50
        );

      res.json({
        success: true,
        data: upcomingBookings,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting upcoming bookings:', error);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get upcoming bookings',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
