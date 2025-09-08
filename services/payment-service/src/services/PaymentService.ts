import { db } from "../db/connection.js"
import { payments, transactions, refunds, disputes } from "../db/schema.js"
import { eq, and, desc, gte, lte, sql } from "drizzle-orm"
import { ModernTonService } from "./ModernTonService.js"
import { StripeService } from "./StripeService.js"
import type {
  Payment,
  NewPayment,
  Transaction,
  NewTransaction,
  Refund,
  NewRefund,
  Dispute,
  NewDispute,
  PaymentStatus,
  PaymentMethodType,
} from "../db/schema.js"

export interface CreatePaymentRequest {
  bookingId: string
  payerId: string
  payeeId: string
  amount: string
  currency?: string
  fiatAmount?: number
  fiatCurrency?: string
  paymentMethod: PaymentMethodType
  description?: string
  metadata?: any
  tonWalletAddress?: string
}

export interface PaymentSearchFilters {
  status?: PaymentStatus
  payerId?: string
  payeeId?: string
  bookingId?: string
  paymentMethod?: PaymentMethodType
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
}

export interface PaymentSearchResult {
  payments: Payment[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export class PaymentService {
  private tonService: ModernTonService
  private stripeService: StripeService

  constructor() {
    this.tonService = new ModernTonService()
    this.stripeService = new StripeService()
  }

  /**
   * Initialize the payment service
   */
  async initialize(): Promise<void> {
    try {
      // ModernTonService initializes automatically in constructor
      console.log("Payment service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize payment service:", error)
      throw error
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(request: CreatePaymentRequest): Promise<Payment> {
    try {
      // Calculate expiration time (30 minutes by default)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 30)

      // Calculate fees
      const platformFeeRate = 0.03 // 3%
      const processingFeeRate = 0.005 // 0.5%

      const amount = parseFloat(request.amount)
      const platformFee = amount * platformFeeRate
      const processingFee = amount * processingFeeRate
      const totalFees = platformFee + processingFee

      // For TON payments, convert fiat to TON if needed
      let tonAmount = request.amount
      if (request.paymentMethod.includes("ton") && request.fiatAmount) {
        tonAmount = await this.tonService.calculateTonAmount(
          request.fiatAmount,
          request.fiatCurrency ?? "USD"
        )
      }

      const newPayment: NewPayment = {
        bookingId: request.bookingId,
        payerId: request.payerId,
        payeeId: request.payeeId,
        amount: request.amount,
        currency: request.currency || "TON",
        fiatAmount: request.fiatAmount?.toString(),
        fiatCurrency: request.fiatCurrency || "USD",
        paymentMethod: request.paymentMethod,
        status: "pending",
        tonAmount,
        tonWalletAddress: request.tonWalletAddress,
        platformFee: platformFee.toString(),
        processingFee: processingFee.toString(),
        totalFees: totalFees.toString(),
        description: request.description,
        metadata: request.metadata,
        expiresAt,
        requiredConfirmations: 3,
      }

      const [payment] = await db.insert(payments).values(newPayment).returning()

      // Create initial transaction record
      await this.createTransaction({
        paymentId: payment.id,
        type: "payment",
        amount: request.amount,
        currency: request.currency || "TON",
        description: "Payment initiated",
        metadata: { paymentMethod: request.paymentMethod },
      })

      console.log(`Payment created: ${payment.id}`)
      return payment
    } catch (error) {
      console.error("Failed to create payment:", error)
      throw error
    }
  }

  /**
   * Process TON payment
   */
  async processTonPayment(paymentId: string, fromAddress: string): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId)
      if (!payment) {
        throw new Error("Payment not found")
      }

      if (payment.status !== "pending") {
        throw new Error("Payment is not in pending status")
      }

      // Update payment status to processing
      await this.updatePaymentStatus(paymentId, "processing", "TON payment initiated")

      // Send TON payment
      const txResult = await this.tonService.createPayment({
        toAddress: payment.tonWalletAddress || process.env.TON_WALLET_ADDRESS!,
        amount: payment.tonAmount || payment.amount,
        comment: `Payment for booking ${payment.bookingId}`,
        timeout: 600,
      })
      const txHash = txResult.hash

      // Update payment with transaction hash
      const [updatedPayment] = await db
        .update(payments)
        .set({
          tonTransactionHash: txHash,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning()

      // Create transaction record
      await this.createTransaction({
        paymentId,
        type: "payment",
        amount: payment.tonAmount || payment.amount,
        currency: "TON",
        tonTransactionHash: txHash,
        description: "TON payment transaction",
        metadata: { fromAddress },
      })

      // Start monitoring for confirmations
      this.monitorPaymentConfirmation(paymentId, txHash)

      return updatedPayment
    } catch (error) {
      console.error("Failed to process TON payment:", error)
      await this.updatePaymentStatus(
        paymentId,
        "failed",
        `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      throw error
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    paymentId: string,
    paymentMethodId: string,
    customerId?: string
  ): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId)
      if (!payment) {
        throw new Error("Payment not found")
      }

      if (payment.status !== "pending") {
        throw new Error("Payment is not in pending status")
      }

      // Convert amount to Stripe format (cents)
      const stripeAmount = this.stripeService.convertToStripeAmount(
        parseFloat(payment.amount),
        payment.currency
      )

      // Update payment status to processing
      await this.updatePaymentStatus(paymentId, "processing", "Stripe payment initiated")

      // Create Stripe payment intent
      const stripeResponse = await this.stripeService.createPaymentIntent({
        amount: stripeAmount,
        currency: payment.currency,
        paymentMethod: paymentMethodId,
        customerId,
        description: `Payment for booking ${payment.bookingId}`,
        metadata: {
          paymentId,
          bookingId: payment.bookingId,
          payerId: payment.payerId,
        },
      })

      // Update payment with Stripe data
      const [updatedPayment] = await db
        .update(payments)
        .set({
          stripePaymentIntentId: stripeResponse.paymentIntentId,
          stripeChargeId: stripeResponse.chargeId,
          status: stripeResponse.status,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning()

      // Create transaction record
      await this.createTransaction({
        paymentId,
        type: "payment",
        amount: payment.amount,
        currency: payment.currency,
        stripePaymentIntentId: stripeResponse.paymentIntentId,
        stripeChargeId: stripeResponse.chargeId,
        description: "Stripe payment transaction",
        metadata: {
          paymentMethodId,
          customerId,
          clientSecret: stripeResponse.clientSecret,
        },
      })

      return updatedPayment
    } catch (error) {
      console.error("Failed to process Stripe payment:", error)
      await this.updatePaymentStatus(
        paymentId,
        "failed",
        `Stripe payment failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      throw error
    }
  }

  /**
   * Confirm Stripe payment intent
   */
  async confirmStripePayment(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId)
      if (!payment) {
        throw new Error("Payment not found")
      }

      if (!payment.stripePaymentIntentId) {
        throw new Error("No Stripe payment intent found")
      }

      // Confirm payment intent
      const stripeResponse = await this.stripeService.confirmPaymentIntent(
        payment.stripePaymentIntentId
      )

      // Update payment status
      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: stripeResponse.status,
          stripeChargeId: stripeResponse.chargeId,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning()

      // Create confirmation transaction record
      await this.createTransaction({
        paymentId,
        type: "confirmation",
        amount: payment.amount,
        currency: payment.currency,
        stripePaymentIntentId: stripeResponse.paymentIntentId,
        stripeChargeId: stripeResponse.chargeId,
        description: "Stripe payment confirmation",
      })

      return updatedPayment
    } catch (error) {
      console.error("Failed to confirm Stripe payment:", error)
      await this.updatePaymentStatus(
        paymentId,
        "failed",
        `Stripe confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      throw error
    }
  }

  /**
   * Monitor payment confirmation
   */
  private async monitorPaymentConfirmation(paymentId: string, txHash: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId)
      if (!payment) return

      // Use verifyTransaction instead of waitForConfirmation
      const confirmed = await this.tonService.verifyTransaction(txHash)

      if (confirmed) {
        await this.updatePaymentStatus(paymentId, "confirmed", "Payment confirmed on blockchain")

        // Auto-complete payment after confirmation
        setTimeout(async () => {
          await this.updatePaymentStatus(paymentId, "completed", "Payment completed")
        }, 5000)
      } else {
        await this.updatePaymentStatus(paymentId, "failed", "Payment confirmation timeout")
      }
    } catch (error) {
      console.error("Failed to monitor payment confirmation:", error)
      await this.updatePaymentStatus(
        paymentId,
        "failed",
        `Confirmation monitoring failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    reason?: string
  ): Promise<Payment> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      // Set timestamps based on status
      if (status === "confirmed") {
        updateData.confirmedAt = new Date()
      } else if (status === "completed") {
        updateData.completedAt = new Date()
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentId))
        .returning()

      // Create transaction record for status change
      await this.createTransaction({
        paymentId,
        type: "payment",
        amount: "0",
        currency: updatedPayment.currency,
        description: reason || `Payment status updated to ${status}`,
        metadata: { statusChange: { from: updatedPayment.status, to: status } },
      })

      console.log(`Payment ${paymentId} status updated to ${status}`)
      return updatedPayment
    } catch (error) {
      console.error("Failed to update payment status:", error)
      throw error
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)

      return payment || null
    } catch (error) {
      console.error("Failed to get payment:", error)
      throw error
    }
  }

  /**
   * Search payments with filters
   */
  async searchPayments(
    filters: PaymentSearchFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaymentSearchResult> {
    try {
      const offset = (page - 1) * limit
      const conditions = []

      // Build filter conditions
      if (filters.status) {
        conditions.push(eq(payments.status, filters.status))
      }
      if (filters.payerId) {
        conditions.push(eq(payments.payerId, filters.payerId))
      }
      if (filters.payeeId) {
        conditions.push(eq(payments.payeeId, filters.payeeId))
      }
      if (filters.bookingId) {
        conditions.push(eq(payments.bookingId, filters.bookingId))
      }
      if (filters.paymentMethod) {
        conditions.push(eq(payments.paymentMethod, filters.paymentMethod))
      }
      if (filters.startDate) {
        conditions.push(gte(payments.createdAt, filters.startDate))
      }
      if (filters.endDate) {
        conditions.push(lte(payments.createdAt, filters.endDate))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get payments
      const paymentResults = await db
        .select()
        .from(payments)
        .where(whereClause)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset)

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(whereClause)

      return {
        payments: paymentResults,
        total: count,
        page,
        limit,
        hasMore: offset + paymentResults.length < count,
      }
    } catch (error) {
      console.error("Failed to search payments:", error)
      throw error
    }
  }

  /**
   * Create transaction record
   */
  async createTransaction(transaction: NewTransaction): Promise<Transaction> {
    try {
      const [newTransaction] = await db.insert(transactions).values(transaction).returning()

      return newTransaction
    } catch (error) {
      console.error("Failed to create transaction:", error)
      throw error
    }
  }

  /**
   * Create refund
   */
  async createRefund(refundData: NewRefund): Promise<Refund> {
    try {
      const [refund] = await db.insert(refunds).values(refundData).returning()

      // Update payment status if full refund
      const payment = await this.getPaymentById(refundData.paymentId)
      if (payment && parseFloat(refundData.amount) >= parseFloat(payment.amount)) {
        await this.updatePaymentStatus(payment.id, "refunded", "Full refund processed")
      }

      return refund
    } catch (error) {
      console.error("Failed to create refund:", error)
      throw error
    }
  }

  /**
   * Create dispute
   */
  async createDispute(disputeData: NewDispute): Promise<Dispute> {
    try {
      const [dispute] = await db.insert(disputes).values(disputeData).returning()

      // Update payment status to disputed
      await this.updatePaymentStatus(disputeData.paymentId, "disputed", "Payment disputed")

      return dispute
    } catch (error) {
      console.error("Failed to create dispute:", error)
      throw error
    }
  }

  /**
   * Get payment transactions
   */
  async getPaymentTransactions(paymentId: string): Promise<Transaction[]> {
    try {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.paymentId, paymentId))
        .orderBy(desc(transactions.createdAt))
    } catch (error) {
      console.error("Failed to get payment transactions:", error)
      throw error
    }
  }

  /**
   * Validate payment method
   */
  validatePaymentMethod(method: PaymentMethodType, data: any): boolean {
    switch (method) {
      case "ton_wallet":
      case "ton_connect":
        return data.tonWalletAddress && this.isValidTonAddress(data.tonWalletAddress)
      case "jetton_usdt":
      case "jetton_usdc":
        return data.tonWalletAddress && this.isValidTonAddress(data.tonWalletAddress)
      default:
        return false
    }
  }

  /**
   * Simple TON address validation
   */
  private isValidTonAddress(address: string): boolean {
    try {
      // Basic validation - TON addresses are typically 48 characters
      return address.length === 48 && /^[A-Za-z0-9_-]+$/.test(address)
    } catch {
      return false
    }
  }

  /**
   * Find payment by TON transaction hash or comment
   */
  async findPaymentByTonTransaction(transactionHash: string, comment?: string): Promise<Payment | null> {
    try {
      // First try to find by transaction hash
      let payment = await db
        .select()
        .from(payments)
        .where(eq(payments.tonTransactionHash, transactionHash))
        .limit(1)

      if (payment.length > 0) {
        return payment[0]
      }

      // If not found and comment exists, try to find by booking ID in comment
      if (comment) {
        const bookingIdMatch = comment.match(/booking\s+([a-f0-9-]+)/i)
        if (bookingIdMatch) {
          const bookingId = bookingIdMatch[1]
          payment = await db
            .select()
            .from(payments)
            .where(eq(payments.bookingId, bookingId))
            .limit(1)

          if (payment.length > 0) {
            return payment[0]
          }
        }
      }

      return null
    } catch (error) {
      console.error("Failed to find payment by TON transaction:", error)
      throw error
    }
  }

  /**
   * Handle Stripe payment success
   */
  async handleStripePaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId))
        .limit(1)

      if (payment.length > 0) {
        await this.updatePaymentStatus(payment[0].id, "confirmed", "Stripe payment succeeded")
      }
    } catch (error) {
      console.error("Failed to handle Stripe payment success:", error)
      throw error
    }
  }

  /**
   * Handle Stripe payment failure
   */
  async handleStripePaymentFailure(paymentIntentId: string): Promise<void> {
    try {
      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId))
        .limit(1)

      if (payment.length > 0) {
        await this.updatePaymentStatus(payment[0].id, "failed", "Stripe payment failed")
      }
    } catch (error) {
      console.error("Failed to handle Stripe payment failure:", error)
      throw error
    }
  }

  /**
   * Handle Stripe dispute
   */
  async handleStripeDispute(chargeId: string): Promise<void> {
    try {
      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.stripeChargeId, chargeId))
        .limit(1)

      if (payment.length > 0) {
        await this.updatePaymentStatus(payment[0].id, "disputed", "Stripe dispute created")
      }
    } catch (error) {
      console.error("Failed to handle Stripe dispute:", error)
      throw error
    }
  }

  /**
   * Update payment transaction ID
   */
  async updatePaymentTransactionId(paymentId: string, transactionId: string): Promise<void> {
    try {
      await db
        .update(payments)
        .set({
          tonTransactionHash: transactionId,
          updatedAt: new Date()
        })
        .where(eq(payments.id, paymentId))
    } catch (error) {
      console.error("Failed to update payment transaction ID:", error)
      throw error
    }
  }

  /**
   * Update refund status
   */
  async updateRefundStatus(refundId: string, status: string, reason?: string): Promise<void> {
    try {
      await db
        .update(refunds)
        .set({
          status: status as any,
          reason,
          updatedAt: new Date()
        })
        .where(eq(refunds.id, refundId))
    } catch (error) {
      console.error("Failed to update refund status:", error)
      throw error
    }
  }
}
