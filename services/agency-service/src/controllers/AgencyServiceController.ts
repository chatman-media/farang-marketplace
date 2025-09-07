import { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import { AgencyServiceService } from "../services/AgencyServiceService.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

export class AgencyServiceController {
  private agencyServiceService: AgencyServiceService

  constructor() {
    this.agencyServiceService = new AgencyServiceService()
  }

  /**
   * Create a new agency service
   */
  async createService(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const serviceData = {
        ...req.body,
        agencyId: req.body.agencyId || req.user?.agencyId,
      }

      if (!serviceData.agencyId) {
        return res.status(400).json({
          success: false,
          message: "Agency ID is required",
        })
      }

      const service = await this.agencyServiceService.createService(serviceData)

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      })
    } catch (error) {
      console.error("Error creating service:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create service",
      })
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        })
      }

      const service = await this.agencyServiceService.getServiceById(id)

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        })
      }

      res.json({
        success: true,
        data: service,
      })
    } catch (error) {
      console.error("Error getting service:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get service",
      })
    }
  }

  /**
   * Get services by agency ID
   */
  async getServicesByAgency(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { agencyId } = req.params
      if (!agencyId) {
        return res.status(400).json({
          success: false,
          message: "Agency ID is required",
        })
      }

      const services = await this.agencyServiceService.getServicesByAgencyId(agencyId)

      res.json({
        success: true,
        data: services,
      })
    } catch (error) {
      console.error("Error getting services by agency:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get services",
      })
    }
  }

  /**
   * Update service
   */
  async updateService(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        })
      }

      const updates = req.body
      const service = await this.agencyServiceService.updateService(id, updates)

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        })
      }

      res.json({
        success: true,
        message: "Service updated successfully",
        data: service,
      })
    } catch (error) {
      console.error("Error updating service:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update service",
      })
    }
  }

  /**
   * Delete service
   */
  async deleteService(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        })
      }

      const deleted = await this.agencyServiceService.deleteService(id)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        })
      }

      res.json({
        success: true,
        message: "Service deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete service",
      })
    }
  }

  /**
   * Search services
   */
  async searchServices(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const filters = {
        agencyId: req.query.agencyId as string,
        category: req.query.category as any,
        isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
        search: req.query.search as string,
        priceRange:
          req.query.minPrice && req.query.maxPrice
            ? {
                min: parseFloat(req.query.minPrice as string),
                max: parseFloat(req.query.maxPrice as string),
              }
            : undefined,
      }

      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
      }

      const result = await this.agencyServiceService.searchServices(filters, options)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error("Error searching services:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to search services",
      })
    }
  }

  /**
   * Toggle service status
   */
  async toggleServiceStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        })
      }

      const service = await this.agencyServiceService.toggleServiceStatus(id)

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        })
      }

      res.json({
        success: true,
        message: `Service ${service.isActive ? "activated" : "deactivated"} successfully`,
        data: service,
      })
    } catch (error) {
      console.error("Error toggling service status:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to toggle service status",
      })
    }
  }

  /**
   * Bulk update service prices
   */
  async bulkUpdatePrices(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { agencyId } = req.params
      const { priceMultiplier } = req.body

      if (!agencyId) {
        return res.status(400).json({
          success: false,
          message: "Agency ID is required",
        })
      }

      const result = await this.agencyServiceService.bulkUpdatePrices(agencyId, priceMultiplier)

      res.json({
        success: true,
        message: `Updated ${result.updated} services`,
        data: result,
      })
    } catch (error) {
      console.error("Error bulk updating prices:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to bulk update prices",
      })
    }
  }
}

// Validation rules
export const createServiceValidation = [
  body("name")
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),
  body("description")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("category")
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
    .withMessage("Valid category is required"),
  body("basePrice").isFloat({ min: 0 }).withMessage("Base price must be a positive number"),
  body("pricingModel")
    .isIn(["fixed", "hourly", "per_item", "percentage"])
    .withMessage("Valid pricing model is required"),
]

export const updateServiceValidation = [
  param("id").isUUID().withMessage("Valid service ID is required"),
  body("name")
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),
  body("description")
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a positive number"),
]

export const serviceIdValidation = [
  param("id").isUUID().withMessage("Valid service ID is required"),
]

export const agencyIdValidation = [
  param("agencyId").isUUID().withMessage("Valid agency ID is required"),
]

export const bulkUpdatePricesValidation = [
  param("agencyId").isUUID().withMessage("Valid agency ID is required"),
  body("priceMultiplier")
    .isFloat({ min: 0.1, max: 10 })
    .withMessage("Price multiplier must be between 0.1 and 10"),
]
