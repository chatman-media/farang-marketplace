import { Request, Response } from "express"
import { PaymentService } from "../services/PaymentService.js"
import { TonService } from "../services/TonService.js"
import { StripeService } from "../services/StripeService.js"
import crypto from "crypto"

export class WebhookController {
  private paymentService: PaymentService
  private tonService: TonService
  private stripeService: StripeService

  constructor() {
    this.paymentService = new PaymentService()
    this.tonService = new TonService()
    this.stripeService = new StripeService()
  }

  /**
   * Handle TON payment webhook
   */
  handleTonWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers["x-ton-signature"] as string
      const payload = JSON.stringify(req.body)
      const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET

      if (!webhookSecret) {
        console.error("Webhook secret not configured")
        res.status(500).json({ error: "Webhook configuration error" })
        return
      }

      // Verify webhook signature
      if (!this.tonService.verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error("Invalid webhook signature")
        res.status(401).json({ error: "Invalid signature" })
        return
      }

      const { transaction, event_type } = req.body

      switch (event_type) {
        case "transaction_confirmed":
          await this.handleTransactionConfirmed(transaction)
          break
        case "transaction_failed":
          await this.handleTransactionFailed(transaction)
          break
        default:
          console.log(`Unhandled webhook event: ${event_type}`)
      }

      res.status(200).json({ success: true })
    } catch (error) {
      console.error("TON webhook error:", error)
      res.status(500).json({ error: "Webhook processing failed" })
    }
  }

  /**
   * Handle confirmed transaction
   */
  private async handleTransactionConfirmed(transaction: any): Promise<void> {
    try {
      const { hash, from, to, amount, confirmations } = transaction

      // Find payment by transaction hash
      const payment = await this.findPaymentByTxHash(hash)
      if (!payment) {
        console.log(`No payment found for transaction hash: ${hash}`)
        return
      }

      // Update confirmation count
      await this.updatePaymentConfirmations(payment.id, confirmations)

      // If enough confirmations, mark as confirmed
      const requiredConfirmations = payment.requiredConfirmations || 3
      if (confirmations >= requiredConfirmations) {
        await this.paymentService.updatePaymentStatus(
          payment.id,
          "confirmed",
          `Transaction confirmed with ${confirmations} confirmations`
        )

        // Auto-complete payment after confirmation
        setTimeout(async () => {
          await this.paymentService.updatePaymentStatus(
            payment.id,
            "completed",
            "Payment completed automatically"
          )
        }, 5000)
      }

      console.log(`Transaction confirmed: ${hash} (${confirmations} confirmations)`)
    } catch (error) {
      console.error("Error handling confirmed transaction:", error)
    }
  }

  /**
   * Handle failed transaction
   */
  private async handleTransactionFailed(transaction: any): Promise<void> {
    try {
      const { hash, error_message } = transaction

      // Find payment by transaction hash
      const payment = await this.findPaymentByTxHash(hash)
      if (!payment) {
        console.log(`No payment found for transaction hash: ${hash}`)
        return
      }

      await this.paymentService.updatePaymentStatus(
        payment.id,
        "failed",
        `Transaction failed: ${error_message}`
      )

      console.log(`Transaction failed: ${hash} - ${error_message}`)
    } catch (error) {
      console.error("Error handling failed transaction:", error)
    }
  }

  /**
   * Find payment by transaction hash
   */
  private async findPaymentByTxHash(hash: string): Promise<any> {
    try {
      // This would be implemented in PaymentService
      // For now, return null as placeholder
      return null
    } catch (error) {
      console.error("Error finding payment by tx hash:", error)
      return null
    }
  }

  /**
   * Update payment confirmations
   */
  private async updatePaymentConfirmations(
    paymentId: string,
    confirmations: number
  ): Promise<void> {
    try {
      // This would be implemented in PaymentService
      console.log(`Updating payment ${paymentId} confirmations to ${confirmations}`)
    } catch (error) {
      console.error("Error updating payment confirmations:", error)
    }
  }

  /**
   * Handle generic payment webhook
   */
  handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payment_id, status, transaction_hash, metadata } = req.body

      if (!payment_id) {
        res.status(400).json({ error: "Payment ID required" })
        return
      }

      const payment = await this.paymentService.getPaymentById(payment_id)
      if (!payment) {
        res.status(404).json({ error: "Payment not found" })
        return
      }

      // Update payment status based on webhook
      await this.paymentService.updatePaymentStatus(
        payment_id,
        status,
        `Status updated via webhook: ${metadata?.reason || "External update"}`
      )

      // Create transaction record if hash provided
      if (transaction_hash) {
        await this.paymentService.createTransaction({
          paymentId: payment_id,
          type: "payment",
          amount: payment.amount,
          currency: payment.currency,
          tonTransactionHash: transaction_hash,
          description: "Transaction updated via webhook",
          metadata: metadata,
        })
      }

      res.status(200).json({ success: true })
    } catch (error) {
      console.error("Payment webhook error:", error)
      res.status(500).json({ error: "Webhook processing failed" })
    }
  }

  /**
   * Handle refund webhook
   */
  handleRefundWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payment_id, refund_amount, refund_reason, transaction_hash } = req.body

      if (!payment_id || !refund_amount) {
        res.status(400).json({ error: "Payment ID and refund amount required" })
        return
      }

      const payment = await this.paymentService.getPaymentById(payment_id)
      if (!payment) {
        res.status(404).json({ error: "Payment not found" })
        return
      }

      // Create refund record
      await this.paymentService.createRefund({
        paymentId: payment_id,
        requestedBy: payment.payeeId, // Assuming refund initiated by payee
        amount: refund_amount.toString(),
        currency: payment.currency,
        reason: "webhook_refund",
        description: refund_reason || "Refund processed via webhook",
        status: "completed",
        tonTransactionHash: transaction_hash,
        processedAt: new Date(),
      })

      res.status(200).json({ success: true })
    } catch (error) {
      console.error("Refund webhook error:", error)
      res.status(500).json({ error: "Refund webhook processing failed" })
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    } catch (error) {
      console.error("Signature verification error:", error)
      return false
    }
  }

  /**
   * Handle Stripe payment webhook
   */
  handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers["stripe-signature"] as string
      const payload = req.body

      if (!signature) {
        res.status(400).json({
          error: "Missing Stripe signature",
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(payload, signature)

      console.log("Stripe webhook event received:", event.type)

      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handleStripePaymentSucceeded(event.data.object)
          break
        case "payment_intent.payment_failed":
          await this.handleStripePaymentFailed(event.data.object)
          break
        case "payment_intent.requires_action":
          await this.handleStripePaymentRequiresAction(event.data.object)
          break
        case "charge.dispute.created":
          await this.handleStripeDisputeCreated(event.data.object)
          break
        default:
          console.log("Unhandled Stripe event type:", event.type)
      }

      res.status(200).json({
        success: true,
        message: "Stripe webhook processed successfully",
        eventType: event.type,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Stripe webhook processing error:", error)
      res.status(400).json({
        error: "Webhook Processing Error",
        message: error instanceof Error ? error.message : "Failed to process Stripe webhook",
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Handle successful Stripe payment
   */
  private async handleStripePaymentSucceeded(paymentIntent: any): Promise<void> {
    try {
      const paymentId = paymentIntent.metadata?.paymentId
      if (!paymentId) {
        console.error("No payment ID found in Stripe payment intent metadata")
        return
      }

      await this.paymentService.updatePaymentStatus(
        paymentId,
        "completed",
        "Payment completed via Stripe"
      )

      console.log(`Stripe payment ${paymentIntent.id} completed for payment ${paymentId}`)
    } catch (error) {
      console.error("Failed to handle Stripe payment success:", error)
    }
  }

  /**
   * Handle failed Stripe payment
   */
  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    try {
      const paymentId = paymentIntent.metadata?.paymentId
      if (!paymentId) {
        console.error("No payment ID found in Stripe payment intent metadata")
        return
      }

      const failureReason = paymentIntent.last_payment_error?.message || "Payment failed"

      await this.paymentService.updatePaymentStatus(
        paymentId,
        "failed",
        `Stripe payment failed: ${failureReason}`
      )

      console.log(
        `Stripe payment ${paymentIntent.id} failed for payment ${paymentId}: ${failureReason}`
      )
    } catch (error) {
      console.error("Failed to handle Stripe payment failure:", error)
    }
  }

  /**
   * Handle Stripe payment requiring action
   */
  private async handleStripePaymentRequiresAction(paymentIntent: any): Promise<void> {
    try {
      const paymentId = paymentIntent.metadata?.paymentId
      if (!paymentId) {
        console.error("No payment ID found in Stripe payment intent metadata")
        return
      }

      await this.paymentService.updatePaymentStatus(
        paymentId,
        "pending",
        "Payment requires additional action (3D Secure, etc.)"
      )

      console.log(`Stripe payment ${paymentIntent.id} requires action for payment ${paymentId}`)
    } catch (error) {
      console.error("Failed to handle Stripe payment requiring action:", error)
    }
  }

  /**
   * Handle Stripe dispute created
   */
  private async handleStripeDisputeCreated(charge: any): Promise<void> {
    try {
      const paymentIntent = charge.payment_intent
      const paymentId = charge.metadata?.paymentId

      if (!paymentId) {
        console.error("No payment ID found in Stripe charge metadata")
        return
      }

      // Create dispute record
      await this.paymentService.createDispute({
        paymentId,
        raisedBy: "customer", // Stripe disputes are raised by customers
        reason: charge.dispute?.reason || "chargeback",
        description:
          charge.dispute?.evidence?.customer_communication || "Stripe chargeback dispute",
        externalDisputeId: charge.dispute?.id,
      })

      await this.paymentService.updatePaymentStatus(
        paymentId,
        "disputed",
        `Stripe dispute created: ${charge.dispute?.reason || "chargeback"}`
      )

      console.log(`Stripe dispute created for payment ${paymentId}: ${charge.dispute?.id}`)
    } catch (error) {
      console.error("Failed to handle Stripe dispute creation:", error)
    }
  }

  /**
   * Health check for webhooks
   */
  webhookHealthCheck = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: "ok",
      service: "payment-webhook",
      timestamp: new Date().toISOString(),
    })
  }
}
