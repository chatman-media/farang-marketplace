export interface PricingCalculation {
  basePrice: number
  serviceFees: number
  taxes: number
  discounts: number
  totalPrice: number
  currency: string
  breakdown: {
    nightlyRate?: number
    numberOfNights?: number
    cleaningFee?: number
    securityDeposit?: number
    platformFee: number
    paymentProcessingFee: number
    vat: number
  }
}

export interface BookingPriceRequest {
  listingId: string
  checkIn: string
  checkOut?: string
  guests: number
}

export interface ServicePriceRequest {
  listingId: string
  serviceType: string
  duration: {
    value: number
    unit: "minutes" | "hours" | "days" | "weeks" | "months"
  }
  deliveryMethod: "online" | "in_person" | "hybrid"
}

export interface PricingRule {
  id: string
  name: string
  type: "discount" | "surcharge" | "fee"
  condition: {
    minNights?: number
    maxNights?: number
    advanceBookingDays?: number
    seasonalPeriod?: {
      start: string // MM-DD format
      end: string // MM-DD format
    }
    dayOfWeek?: number[] // 0-6, Sunday = 0
    guestCount?: {
      min?: number
      max?: number
    }
  }
  value: {
    type: "percentage" | "fixed"
    amount: number
  }
  priority: number
}

export class PricingService {
  private readonly PLATFORM_FEE_PERCENTAGE = 0.03 // 3%
  private readonly PAYMENT_PROCESSING_FEE_PERCENTAGE = 0.029 // 2.9%
  private readonly VAT_PERCENTAGE = 0.07 // 7% VAT in Thailand
  private readonly DEFAULT_CURRENCY = "THB"

  // Calculate pricing for accommodation bookings
  async calculateBookingPrice(request: BookingPriceRequest): Promise<PricingCalculation> {
    // 1. Get listing base price (mock for now - would fetch from listing service)
    const listingPrice = await this.getListingPrice(request.listingId)

    // 2. Calculate number of nights
    const numberOfNights = this.calculateNights(request.checkIn, request.checkOut)

    // 3. Calculate base price
    const basePrice = listingPrice.nightlyRate * numberOfNights

    // 4. Apply pricing rules (discounts, surcharges)
    const { adjustedPrice, discounts } = await this.applyPricingRules(basePrice, request, numberOfNights)

    // 5. Calculate fees
    const cleaningFee = listingPrice.cleaningFee || 0
    const platformFee = adjustedPrice * this.PLATFORM_FEE_PERCENTAGE
    const paymentProcessingFee = (adjustedPrice + platformFee) * this.PAYMENT_PROCESSING_FEE_PERCENTAGE

    // 6. Calculate subtotal before tax
    const subtotal = adjustedPrice + cleaningFee + platformFee + paymentProcessingFee

    // 7. Calculate VAT
    const vat = subtotal * this.VAT_PERCENTAGE

    // 8. Calculate total
    const totalPrice = subtotal + vat

    return {
      basePrice: adjustedPrice,
      serviceFees: platformFee + paymentProcessingFee,
      taxes: vat,
      discounts,
      totalPrice,
      currency: this.DEFAULT_CURRENCY,
      breakdown: {
        nightlyRate: listingPrice.nightlyRate,
        numberOfNights,
        cleaningFee,
        securityDeposit: listingPrice.securityDeposit || 0,
        platformFee,
        paymentProcessingFee,
        vat,
      },
    }
  }

  // Calculate pricing for service bookings
  async calculateServicePrice(request: ServicePriceRequest): Promise<PricingCalculation> {
    // 1. Get service base price
    const servicePrice = await this.getServicePrice(request.listingId, request.serviceType)

    // 2. Calculate duration in hours for pricing
    const durationInHours = this.convertDurationToHours(request.duration)

    // 3. Calculate base price based on pricing model
    let basePrice: number
    switch (servicePrice.priceType) {
      case "hourly":
        basePrice = servicePrice.hourlyRate * durationInHours
        break
      case "fixed":
        basePrice = servicePrice.fixedPrice || 0
        break
      case "daily":
        const days = Math.ceil(durationInHours / 8) // 8 hours per day
        basePrice = (servicePrice.dailyRate || 0) * days
        break
      default:
        basePrice = servicePrice.fixedPrice || servicePrice.hourlyRate * durationInHours
    }

    // 4. Apply delivery method surcharge
    const deliveryMultiplier = this.getDeliveryMethodMultiplier(request.deliveryMethod)
    const adjustedPrice = basePrice * deliveryMultiplier

    // 5. Calculate fees
    const platformFee = adjustedPrice * this.PLATFORM_FEE_PERCENTAGE
    const paymentProcessingFee = (adjustedPrice + platformFee) * this.PAYMENT_PROCESSING_FEE_PERCENTAGE

    // 6. Calculate subtotal before tax
    const subtotal = adjustedPrice + platformFee + paymentProcessingFee

    // 7. Calculate VAT
    const vat = subtotal * this.VAT_PERCENTAGE

    // 8. Calculate total
    const totalPrice = subtotal + vat

    return {
      basePrice: adjustedPrice,
      serviceFees: platformFee + paymentProcessingFee,
      taxes: vat,
      discounts: 0,
      totalPrice,
      currency: this.DEFAULT_CURRENCY,
      breakdown: {
        platformFee,
        paymentProcessingFee,
        vat,
      },
    }
  }

  // Get pricing estimate without full calculation
  async getQuickEstimate(
    listingId: string,
    type: "accommodation" | "service",
    duration?: number,
  ): Promise<{ minPrice: number; maxPrice: number; currency: string }> {
    if (type === "accommodation") {
      const listingPrice = await this.getListingPrice(listingId)
      const nights = duration || 1
      const basePrice = listingPrice.nightlyRate * nights

      return {
        minPrice: Math.round(basePrice * 1.1), // +10% for fees
        maxPrice: Math.round(basePrice * 1.15), // +15% for fees and taxes
        currency: this.DEFAULT_CURRENCY,
      }
    } else {
      const servicePrice = await this.getServicePrice(listingId, "consultation")
      const hours = duration || 1
      const basePrice = servicePrice.hourlyRate * hours

      return {
        minPrice: Math.round(basePrice * 1.1),
        maxPrice: Math.round(basePrice * 1.15),
        currency: this.DEFAULT_CURRENCY,
      }
    }
  }

  // Apply dynamic pricing based on demand, seasonality, etc.
  async applyDynamicPricing(basePrice: number, listingId: string, checkIn: Date, checkOut?: Date): Promise<number> {
    let adjustedPrice = basePrice

    // 1. Seasonal pricing
    const seasonalMultiplier = this.getSeasonalMultiplier(checkIn)
    adjustedPrice *= seasonalMultiplier

    // 2. Day of week pricing
    const dayOfWeekMultiplier = this.getDayOfWeekMultiplier(checkIn, checkOut)
    adjustedPrice *= dayOfWeekMultiplier

    // 3. Demand-based pricing (mock implementation)
    const demandMultiplier = await this.getDemandMultiplier(listingId, checkIn)
    adjustedPrice *= demandMultiplier

    return Math.round(adjustedPrice)
  }

  // Private helper methods
  private async getListingPrice(listingId: string): Promise<{
    nightlyRate: number
    cleaningFee?: number
    securityDeposit?: number
  }> {
    // Mock implementation - would fetch from listing service
    return {
      nightlyRate: 1500, // THB per night
      cleaningFee: 300,
      securityDeposit: 2000,
    }
  }

  private async getServicePrice(
    listingId: string,
    serviceType: string,
  ): Promise<{
    priceType: "hourly" | "fixed" | "daily"
    hourlyRate: number
    fixedPrice?: number
    dailyRate?: number
  }> {
    // Mock implementation - would fetch from service provider data
    return {
      priceType: "hourly",
      hourlyRate: 800, // THB per hour
      fixedPrice: 2000,
      dailyRate: 5000,
    }
  }

  private calculateNights(checkIn: string, checkOut?: string): number {
    if (!checkOut) return 1

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(1, diffDays)
  }

  private convertDurationToHours(duration: { value: number; unit: string }): number {
    switch (duration.unit) {
      case "minutes":
        return duration.value / 60
      case "hours":
        return duration.value
      case "days":
        return duration.value * 8 // 8 working hours per day
      case "weeks":
        return duration.value * 40 // 40 working hours per week
      case "months":
        return duration.value * 160 // ~160 working hours per month
      default:
        return duration.value
    }
  }

  private getDeliveryMethodMultiplier(deliveryMethod: string): number {
    switch (deliveryMethod) {
      case "online":
        return 1.0
      case "in_person":
        return 1.2 // 20% surcharge for in-person
      case "hybrid":
        return 1.1 // 10% surcharge for hybrid
      default:
        return 1.0
    }
  }

  private async applyPricingRules(
    basePrice: number,
    request: BookingPriceRequest,
    numberOfNights: number,
  ): Promise<{ adjustedPrice: number; discounts: number }> {
    let adjustedPrice = basePrice
    let totalDiscounts = 0

    // Weekly discount (7+ nights)
    if (numberOfNights >= 7) {
      const weeklyDiscount = basePrice * 0.1 // 10% discount
      adjustedPrice -= weeklyDiscount
      totalDiscounts += weeklyDiscount
    }

    // Monthly discount (28+ nights)
    if (numberOfNights >= 28) {
      const monthlyDiscount = basePrice * 0.05 // Additional 5% discount
      adjustedPrice -= monthlyDiscount
      totalDiscounts += monthlyDiscount
    }

    // Early bird discount (30+ days advance booking)
    const advanceDays = this.calculateAdvanceBookingDays(request.checkIn)
    if (advanceDays >= 30) {
      const earlyBirdDiscount = basePrice * 0.05 // 5% discount
      adjustedPrice -= earlyBirdDiscount
      totalDiscounts += earlyBirdDiscount
    }

    return {
      adjustedPrice: Math.max(0, adjustedPrice),
      discounts: totalDiscounts,
    }
  }

  private calculateAdvanceBookingDays(checkIn: string): number {
    const now = new Date()
    const checkInDate = new Date(checkIn)
    const diffTime = checkInDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth() + 1 // 1-12

    // High season in Thailand (Nov-Mar)
    if (month >= 11 || month <= 3) {
      return 1.3 // 30% increase
    }

    // Low season (Apr-Oct)
    return 0.9 // 10% decrease
  }

  private getDayOfWeekMultiplier(checkIn: Date, checkOut?: Date): number {
    const dayOfWeek = checkIn.getDay() // 0 = Sunday

    // Weekend premium (Friday, Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 1.2 // 20% increase
    }

    return 1.0
  }

  private async getDemandMultiplier(listingId: string, checkIn: Date): Promise<number> {
    // Mock implementation - would analyze booking patterns, search volume, etc.
    // For now, return a random multiplier between 0.9 and 1.3
    return 0.9 + Math.random() * 0.4
  }
}
