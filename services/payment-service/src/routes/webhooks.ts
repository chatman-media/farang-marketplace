import crypto from "crypto"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { ModernTonService } from "../services/ModernTonService"
import { PaymentService } from "../services/PaymentService"

const paymentService = new PaymentService()
const tonService = new ModernTonService()

// Zod schemas for webhook validation
const tonWebhookSchema = z.object({
  transaction_hash: z.string(),
  from_address: z.string(),
  to_address: z.string(),
  amount: z.string(),
  comment: z.string().optional(),
  timestamp: z.number(),
  confirmed: z.boolean(),
})

const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
})

const refundWebhookSchema = z.object({
  refund_id: z.string().uuid(),
  payment_id: z.string().uuid(),
  amount: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  reason: z.string().optional(),
})

export default async function webhooksRoutes(fastify: FastifyInstance) {
  // TON blockchain webhook
  fastify.post(
    "/webhooks/ton",
    {
      schema: {
        body: tonWebhookSchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof tonWebhookSchema> }>, reply: FastifyReply) => {
      try {
        const { transaction_hash, from_address, to_address, amount, comment, confirmed } = request.body

        fastify.log.info({ transaction_hash }, "Received TON webhook")

        if (confirmed) {
          // Find payment by transaction hash or comment
          const payment = await paymentService.findPaymentByTonTransaction(transaction_hash, comment)

          if (payment) {
            // Verify transaction on blockchain
            const isValid = await tonService.verifyTransaction(transaction_hash)

            if (isValid) {
              await paymentService.updatePaymentStatus(
                payment.id,
                "confirmed",
                `TON transaction confirmed: ${transaction_hash}`,
              )

              fastify.log.info({ paymentId: payment.id }, "Payment confirmed via TON webhook")
            } else {
              fastify.log.warn({ transaction_hash }, "Invalid TON transaction in webhook")
            }
          } else {
            fastify.log.warn({ transaction_hash }, "No payment found for TON transaction")
          }
        }

        return reply.send({ success: true, processed: true })
      } catch (error) {
        fastify.log.error({ error }, "Failed to process TON webhook")
        return reply.code(500).send({
          success: false,
          error: "Failed to process webhook",
        })
      }
    },
  )

  // Stripe webhook
  fastify.post(
    "/webhooks/stripe",
    {
      preHandler: async (request, reply) => {
        // Verify Stripe webhook signature
        const signature = request.headers["stripe-signature"] as string
        const payload = JSON.stringify(request.body)

        if (!signature || !payload) {
          return reply.code(400).send({ error: "Missing signature or payload" })
        }

        try {
          const expectedSignature = crypto
            .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET!)
            .update(payload, "utf8")
            .digest("hex")

          const providedSignature = signature.split("=")[1]

          if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
            return reply.code(400).send({ error: "Invalid signature" })
          }
        } catch (error) {
          return reply.code(400).send({ error: "Signature verification failed" })
        }
      },
      schema: {
        body: stripeWebhookSchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof stripeWebhookSchema> }>, reply: FastifyReply) => {
      try {
        const { type, data } = request.body

        fastify.log.info({ type }, "Received Stripe webhook")

        switch (type) {
          case "payment_intent.succeeded":
            const paymentIntent = data.object
            await paymentService.handleStripePaymentSuccess(paymentIntent.id)
            break

          case "payment_intent.payment_failed":
            const failedPayment = data.object
            await paymentService.handleStripePaymentFailure(failedPayment.id)
            break

          case "charge.dispute.created":
            const dispute = data.object
            await paymentService.handleStripeDispute(dispute.charge)
            break

          default:
            fastify.log.info({ type }, "Unhandled Stripe webhook type")
        }

        return reply.send({ success: true, processed: true })
      } catch (error) {
        fastify.log.error({ error }, "Failed to process Stripe webhook")
        return reply.code(500).send({
          success: false,
          error: "Failed to process webhook",
        })
      }
    },
  )

  // Generic payment webhook
  fastify.post(
    "/webhooks/payment",
    {
      schema: {
        body: z.object({
          payment_id: z.string().uuid(),
          status: z.enum(["pending", "processing", "confirmed", "completed", "failed", "cancelled"]),
          transaction_id: z.string().optional(),
          reason: z.string().optional(),
          metadata: z.record(z.string(), z.any()).optional(),
        }),
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          payment_id: string
          status: string
          transaction_id?: string
          reason?: string
          metadata?: Record<string, any>
        }
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { payment_id, status, transaction_id, reason, metadata } = request.body

        fastify.log.info({ payment_id, status }, "Received payment webhook")

        await paymentService.updatePaymentStatus(payment_id, status as any, reason)

        if (transaction_id) {
          await paymentService.updatePaymentTransactionId(payment_id, transaction_id)
        }

        return reply.send({ success: true, processed: true })
      } catch (error) {
        fastify.log.error({ error }, "Failed to process payment webhook")
        return reply.code(500).send({
          success: false,
          error: "Failed to process webhook",
        })
      }
    },
  )

  // Refund webhook
  fastify.post(
    "/webhooks/refund",
    {
      schema: {
        body: refundWebhookSchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof refundWebhookSchema> }>, reply: FastifyReply) => {
      try {
        const { refund_id, payment_id, amount, status, reason } = request.body

        fastify.log.info({ refund_id, payment_id, status }, "Received refund webhook")

        await paymentService.updateRefundStatus(refund_id, status, reason)

        if (status === "completed") {
          await paymentService.updatePaymentStatus(payment_id, "refunded", "Refund completed")
        }

        return reply.send({ success: true, processed: true })
      } catch (error) {
        fastify.log.error({ error }, "Failed to process refund webhook")
        return reply.code(500).send({
          success: false,
          error: "Failed to process webhook",
        })
      }
    },
  )

  // Webhook health check
  fastify.get("/webhooks/health", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      webhooks: {
        ton: "active",
        stripe: "active",
        payment: "active",
        refund: "active",
      },
    })
  })
}
