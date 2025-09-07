import Stripe from "stripe"
import { PaymentMethodType, PaymentStatus } from "../db/schema"

export interface StripePaymentRequest {
  amount: number // in cents
  currency: string
  paymentMethod: string // Stripe payment method ID
  customerId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface StripePaymentResponse {
  paymentIntentId: string
  clientSecret: string
  status: PaymentStatus
  chargeId?: string
  receiptUrl?: string
}

export interface StripeRefundRequest {
  paymentIntentId: string
  amount?: number // partial refund amount in cents
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
  metadata?: Record<string, string>
}

export interface StripeCustomerData {
  email: string
  name?: string
  phone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state?: string
    postal_code: string
    country: string
  }
}

export class StripeService {
  private stripe: Stripe
  private webhookSecret: string

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required")
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    })
  }

  /**
   * Create a payment intent for processing payment
   */
  async createPaymentIntent(request: StripePaymentRequest): Promise<StripePaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        payment_method: request.paymentMethod,
        customer: request.customerId,
        description: request.description,
        metadata: request.metadata || {},
        confirmation_method: "manual",
        confirm: true,
        return_url: process.env.STRIPE_RETURN_URL || "https://marketplace.com/payment/return",
      })

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
        chargeId: paymentIntent.latest_charge as string,
      }
    } catch (error) {
      console.error("Stripe payment intent creation failed:", error)
      throw new Error(
        `Payment processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<StripePaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId)

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
        chargeId: paymentIntent.latest_charge as string,
      }
    } catch (error) {
      console.error("Stripe payment confirmation failed:", error)
      throw new Error(
        `Payment confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Retrieve payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      console.error("Failed to retrieve payment intent:", error)
      throw new Error(
        `Failed to retrieve payment: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(request: StripeRefundRequest): Promise<Stripe.Refund> {
    try {
      const paymentIntent = await this.getPaymentIntent(request.paymentIntentId)

      if (!paymentIntent.latest_charge) {
        throw new Error("No charge found for this payment intent")
      }

      return await this.stripe.refunds.create({
        charge: paymentIntent.latest_charge as string,
        amount: request.amount,
        reason: request.reason,
        metadata: request.metadata || {},
      })
    } catch (error) {
      console.error("Stripe refund creation failed:", error)
      throw new Error(
        `Refund processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(customerData: StripeCustomerData): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists by email
      const existingCustomers = await this.stripe.customers.list({
        email: customerData.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
      }

      // Create new customer
      return await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
      })
    } catch (error) {
      console.error("Stripe customer creation failed:", error)
      throw new Error(
        `Customer creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Create a payment method for a customer
   */
  async createPaymentMethod(
    customerId: string,
    paymentMethodData: any
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create(paymentMethodData)

      // Attach to customer
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      })

      return paymentMethod
    } catch (error) {
      console.error("Stripe payment method creation failed:", error)
      throw new Error(
        `Payment method creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret)
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error)
      throw new Error("Invalid webhook signature")
    }
  }

  /**
   * Calculate Stripe fees
   */
  calculateStripeFees(amount: number, currency: string): { stripeFee: number; netAmount: number } {
    // Stripe fees: 2.9% + $0.30 for most cards
    const percentageFee = Math.round(amount * 0.029)
    const fixedFee = currency.toLowerCase() === "usd" ? 30 : 0 // 30 cents in USD
    const stripeFee = percentageFee + fixedFee

    return {
      stripeFee,
      netAmount: amount - stripeFee,
    }
  }

  /**
   * Convert currency amounts
   */
  convertToStripeAmount(amount: number, currency: string): number {
    // Stripe expects amounts in the smallest currency unit
    const zeroDecimalCurrencies = ["jpy", "krw", "vnd", "clp"]

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return Math.round(amount)
    }

    return Math.round(amount * 100) // Convert to cents
  }

  /**
   * Convert from Stripe amount to decimal
   */
  convertFromStripeAmount(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ["jpy", "krw", "vnd", "clp"]

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return amount
    }

    return amount / 100 // Convert from cents
  }

  /**
   * Map Stripe payment status to our payment status
   */
  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        return "pending"
      case "processing":
        return "processing"
      case "succeeded":
        return "completed"
      case "canceled":
        return "cancelled"
      case "requires_capture":
        return "confirmed"
      default:
        return "failed"
    }
  }

  /**
   * Get supported payment methods for a country
   */
  getSupportedPaymentMethods(country: string): PaymentMethodType[] {
    const countryMethods: Record<string, PaymentMethodType[]> = {
      US: ["stripe_card" as PaymentMethodType],
      GB: ["stripe_card" as PaymentMethodType],
      DE: [
        "stripe_card" as PaymentMethodType,
        "stripe_sepa" as PaymentMethodType,
        "stripe_sofort" as PaymentMethodType,
      ],
      NL: [
        "stripe_card" as PaymentMethodType,
        "stripe_sepa" as PaymentMethodType,
        "stripe_ideal" as PaymentMethodType,
      ],
      FR: ["stripe_card" as PaymentMethodType, "stripe_sepa" as PaymentMethodType],
      TH: ["stripe_card" as PaymentMethodType],
      // Add more countries as needed
    }

    return countryMethods[country.toUpperCase()] || ["stripe_card" as PaymentMethodType]
  }

  /**
   * Validate payment method for country
   */
  validatePaymentMethodForCountry(paymentMethod: PaymentMethodType, country: string): boolean {
    const supportedMethods = this.getSupportedPaymentMethods(country)
    return supportedMethods.includes(paymentMethod)
  }
}
