import { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import { BookingIntegrationService } from "../services/BookingIntegrationService.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

export class BookingIntegrationController {
  private bookingIntegrationService: BookingIntegrationService

  constructor() {
    this.bookingIntegrationService = new BookingIntegrationService()
  }

  /**
   * Find matching agencies for a booking request
   */
  async findMatchingAgencies(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const bookingRequest = req.body
      const matches = await this.bookingIntegrationService.findMatchingAgencies(bookingRequest)

      res.json({
        success: true,
        message: `Found ${matches.length} matching agencies`,
        data: {
          matches,
          total: matches.length,
        },
      })
    } catch (error) {
      console.error("Error finding matching agencies:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to find matching agencies",
      })
    }
  }

  /**
   * Assign service to specific agency
   */
  async assignServiceToAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { bookingRequest, agencyMatch } = req.body
      const result = await this.bookingIntegrationService.assignServiceToAgency(
        bookingRequest,
        agencyMatch
      )

      res.status(201).json({
        success: true,
        message: "Service assigned to agency successfully",
        data: result,
      })
    } catch (error) {
      console.error("Error assigning service to agency:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to assign service to agency",
      })
    }
  }

  /**
   * Auto-assign best matching agency
   */
  async autoAssignBestMatch(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const bookingRequest = req.body
      const result = await this.bookingIntegrationService.autoAssignBestMatch(bookingRequest)

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "No matching agencies found for this request",
        })
      }

      res.status(201).json({
        success: true,
        message: "Service auto-assigned to best matching agency",
        data: result,
      })
    } catch (error) {
      console.error("Error auto-assigning service:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to auto-assign service",
      })
    }
  }

  /**
   * Calculate commission for completed service
   */
  async calculateCommission(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { assignmentId } = req.params
      const { finalPrice } = req.body

      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const commission = await this.bookingIntegrationService.calculateCommission(
        assignmentId,
        finalPrice
      )

      res.json({
        success: true,
        message: "Commission calculated successfully",
        data: commission,
      })
    } catch (error) {
      console.error("Error calculating commission:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate commission",
      })
    }
  }

  /**
   * Get service assignment status
   */
  async getAssignmentStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { assignmentId } = req.params

      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: "Assignment ID is required",
        })
      }

      const status = await this.bookingIntegrationService.getAssignmentStatus(assignmentId)

      res.json({
        success: true,
        data: status,
      })
    } catch (error) {
      console.error("Error getting assignment status:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get assignment status",
      })
    }
  }

  /**
   * Get available service categories
   */
  async getServiceCategories(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const categories = [
        {
          id: "delivery",
          name: "Delivery Services",
          description: "Package and food delivery",
        },
        {
          id: "emergency",
          name: "Emergency Services",
          description: "24/7 emergency assistance",
        },
        {
          id: "maintenance",
          name: "Maintenance Services",
          description: "Property maintenance and repairs",
        },
        {
          id: "insurance",
          name: "Insurance Services",
          description: "Insurance claims and assessments",
        },
        {
          id: "cleaning",
          name: "Cleaning Services",
          description: "Residential and commercial cleaning",
        },
        {
          id: "security",
          name: "Security Services",
          description: "Security guards and surveillance",
        },
        {
          id: "transportation",
          name: "Transportation",
          description: "Vehicle and logistics services",
        },
        {
          id: "legal",
          name: "Legal Services",
          description: "Legal consultation and documentation",
        },
        {
          id: "financial",
          name: "Financial Services",
          description: "Financial planning and advisory",
        },
        {
          id: "marketing",
          name: "Marketing Services",
          description: "Digital marketing and advertising",
        },
        {
          id: "consulting",
          name: "Consulting",
          description: "Business and technical consulting",
        },
        {
          id: "other",
          name: "Other Services",
          description: "Custom service categories",
        },
      ]

      res.json({
        success: true,
        data: categories,
      })
    } catch (error) {
      console.error("Error getting service categories:", error)
      res.status(500).json({
        success: false,
        message: "Failed to get service categories",
      })
    }
  }
}

// Validation rules
export const findMatchingAgenciesValidation = [
  body("bookingId").isUUID().withMessage("Valid booking ID is required"),
  body("listingId").isUUID().withMessage("Valid listing ID is required"),
  body("userId").isUUID().withMessage("Valid user ID is required"),
  body("serviceType")
    .isIn([
      "delivery",
      "emergency",
      "maintenance",
      "insurance",
      "cleaning",
      "security",
      "transportation",
      "legal",
      "financial",
      "marketing",
      "consulting",
      "other",
    ])
    .withMessage("Valid service type is required"),
  body("requestedDate").isISO8601().withMessage("Valid requested date is required"),
  body("location.address").isLength({ min: 5, max: 255 }).withMessage("Valid address is required"),
  body("location.city").isLength({ min: 2, max: 100 }).withMessage("Valid city is required"),
]

export const assignServiceValidation = [
  body("bookingRequest").isObject().withMessage("Valid booking request is required"),
  body("agencyMatch").isObject().withMessage("Valid agency match is required"),
  body("agencyMatch.agencyId").isUUID().withMessage("Valid agency ID is required"),
  body("agencyMatch.serviceId").isUUID().withMessage("Valid service ID is required"),
]

export const calculateCommissionValidation = [
  param("assignmentId").isUUID().withMessage("Valid assignment ID is required"),
  body("finalPrice").isFloat({ min: 0 }).withMessage("Final price must be a positive number"),
]

export const assignmentIdValidation = [
  param("assignmentId").isUUID().withMessage("Valid assignment ID is required"),
]
