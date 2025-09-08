import { Request, Response } from "express"
import { validationResult } from "express-validator"
import { PricingService } from "../services/PricingService"
import type { BookingPriceRequest, ServicePriceRequest } from "../services/PricingService"

export class PricingController {
  private pricingService: PricingService

  constructor() {
    this.pricingService = new PricingService()
  }

  // Calculate pricing for accommodation booking
  calculateBookingPrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const priceRequest: BookingPriceRequest = {
        listingId: req.body.listingId,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut,
        guests: req.body.guests,
      }

      const pricing = await this.pricingService.calculateBookingPrice(priceRequest)

      res.json({
        success: true,
        data: pricing,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error calculating booking price:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to calculate booking price",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Calculate pricing for service booking
  calculateServicePrice = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const priceRequest: ServicePriceRequest = {
        listingId: req.body.listingId,
        serviceType: req.body.serviceType,
        duration: req.body.duration,
        deliveryMethod: req.body.deliveryMethod,
      }

      const pricing = await this.pricingService.calculateServicePrice(priceRequest)

      res.json({
        success: true,
        data: pricing,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error calculating service price:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to calculate service price",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get quick price estimate
  getQuickEstimate = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { listingId } = req.params
      const { type, duration } = req.query

      const bookingType = type as "accommodation" | "service"
      const durationValue = duration ? parseInt(duration as string) : undefined

      const estimate = await this.pricingService.getQuickEstimate(listingId, bookingType, durationValue)

      res.json({
        success: true,
        data: {
          listingId,
          type: bookingType,
          duration: durationValue,
          estimate,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting quick estimate:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get price estimate",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Apply dynamic pricing
  applyDynamicPricing = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { listingId } = req.params
      const { basePrice, checkIn, checkOut } = req.body

      const checkInDate = new Date(checkIn)
      const checkOutDate = checkOut ? new Date(checkOut) : undefined

      const adjustedPrice = await this.pricingService.applyDynamicPricing(
        basePrice,
        listingId,
        checkInDate,
        checkOutDate,
      )

      const priceChange = adjustedPrice - basePrice
      const priceChangePercentage = ((priceChange / basePrice) * 100).toFixed(2)

      res.json({
        success: true,
        data: {
          listingId,
          originalPrice: basePrice,
          adjustedPrice,
          priceChange,
          priceChangePercentage: `${priceChangePercentage}%`,
          factors: {
            seasonal: "Applied seasonal pricing adjustments",
            dayOfWeek: "Applied day-of-week pricing adjustments",
            demand: "Applied demand-based pricing adjustments",
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error applying dynamic pricing:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to apply dynamic pricing",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Get pricing breakdown for transparency
  getPricingBreakdown = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { type } = req.query
      const bookingType = type as "accommodation" | "service"

      let pricing

      if (bookingType === "accommodation") {
        const priceRequest: BookingPriceRequest = {
          listingId: req.body.listingId,
          checkIn: req.body.checkIn,
          checkOut: req.body.checkOut,
          guests: req.body.guests,
        }
        pricing = await this.pricingService.calculateBookingPrice(priceRequest)
      } else {
        const priceRequest: ServicePriceRequest = {
          listingId: req.body.listingId,
          serviceType: req.body.serviceType,
          duration: req.body.duration,
          deliveryMethod: req.body.deliveryMethod,
        }
        pricing = await this.pricingService.calculateServicePrice(priceRequest)
      }

      // Create detailed breakdown for transparency
      const breakdown = {
        basePrice: pricing.basePrice,
        fees: {
          serviceFees: pricing.serviceFees,
          breakdown: pricing.breakdown,
        },
        taxes: pricing.taxes,
        discounts: pricing.discounts,
        total: pricing.totalPrice,
        currency: pricing.currency,
        explanation: {
          basePrice: "Base price for the listing/service",
          serviceFees: "Platform and payment processing fees",
          taxes: "VAT and other applicable taxes",
          discounts: "Applied discounts (weekly, monthly, early bird)",
          total: "Final amount to be paid",
        },
      }

      res.json({
        success: true,
        data: breakdown,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error getting pricing breakdown:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get pricing breakdown",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Compare pricing across different options
  comparePricing = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { options } = req.body

      if (!Array.isArray(options) || options.length === 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "Options array is required and must not be empty",
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (options.length > 10) {
        res.status(400).json({
          error: "Bad Request",
          message: "Maximum 10 options can be compared at once",
          timestamp: new Date().toISOString(),
        })
        return
      }

      const comparisons = await Promise.all(
        options.map(async (option: any, index: number) => {
          try {
            let pricing

            if (option.type === "accommodation") {
              pricing = await this.pricingService.calculateBookingPrice({
                listingId: option.listingId,
                checkIn: option.checkIn,
                checkOut: option.checkOut,
                guests: option.guests,
              })
            } else {
              pricing = await this.pricingService.calculateServicePrice({
                listingId: option.listingId,
                serviceType: option.serviceType,
                duration: option.duration,
                deliveryMethod: option.deliveryMethod,
              })
            }

            return {
              optionIndex: index,
              listingId: option.listingId,
              type: option.type,
              pricing,
            }
          } catch (error) {
            return {
              optionIndex: index,
              listingId: option.listingId,
              type: option.type,
              error: "Failed to calculate pricing for this option",
            }
          }
        }),
      )

      // Find best value option
      const validComparisons = comparisons.filter((comp) => !comp.error)
      const bestValue = validComparisons.reduce((best, current) => {
        return (current.pricing?.totalPrice || Infinity) < (best.pricing?.totalPrice || Infinity) ? current : best
      }, validComparisons[0])

      res.json({
        success: true,
        data: {
          comparisons,
          bestValue: bestValue
            ? {
                optionIndex: bestValue.optionIndex,
                listingId: bestValue.listingId,
                totalPrice: bestValue.pricing?.totalPrice,
                savings:
                  validComparisons.length > 1
                    ? Math.max(...validComparisons.map((c) => c.pricing?.totalPrice || 0)) -
                      (bestValue.pricing?.totalPrice || 0)
                    : 0,
              }
            : null,
          summary: {
            totalOptions: options.length,
            validOptions: validComparisons.length,
            failedOptions: comparisons.length - validComparisons.length,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Error comparing pricing:", error)

      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to compare pricing options",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
