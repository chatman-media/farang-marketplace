import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { ModernTonService } from "../services/ModernTonService"
import { PaymentService } from "../services/PaymentService"

const paymentService = new PaymentService()
const tonService = new ModernTonService()

// Zod schemas for validation
const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  currency: z.string().optional().default("TON"),
  method: z.enum(["ton_wallet", "ton_connect", "jetton_usdt", "jetton_usdc", "stripe_card", "promptpay"]),
  walletAddress: z.string().optional(),
  comment: z.string().optional(),
  fiatAmount: z.number().optional(),
  fiatCurrency: z.string().optional(),
})

const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "processing", "confirmed", "completed", "failed", "cancelled", "refunded", "disputed"]),
  reason: z.string().optional(),
})

const searchPaymentsSchema = z.object({
  status: z.string().optional(),
  payerId: z.string().uuid().optional(),
  payeeId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  method: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export default async function paymentsRoutes(fastify: FastifyInstance) {
  // Create payment
  fastify.post(
    "/payments",
    {
      schema: {
        body: createPaymentSchema,
        response: {
          201: z.object({
            success: z.boolean(),
            data: z.object({
              paymentId: z.string().uuid(),
              status: z.string(),
              amount: z.string(),
              currency: z.string(),
              method: z.string(),
              tonPaymentUrl: z.string().optional(),
              qrCode: z.string().optional(),
              expiresAt: z.string(),
            }),
          }),
        },
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof createPaymentSchema> }>, reply: FastifyReply) => {
      try {
        const { bookingId, amount, currency, method, walletAddress, comment, fiatAmount, fiatCurrency } = request.body

        // Create payment
        const payment = await paymentService.createPayment({
          bookingId,
          payerId: "user-id", // Would get from JWT
          payeeId: "host-id", // Would get from booking
          amount,
          currency,
          fiatAmount,
          fiatCurrency,
          paymentMethod: method,
          description: comment,
          tonWalletAddress: walletAddress,
        })

        let tonPaymentUrl: string | undefined
        let qrCode: string | undefined

        // Generate TON payment URL if it's a TON payment
        if (method.includes("ton")) {
          tonPaymentUrl = tonService.generatePaymentUrl({
            toAddress: walletAddress || process.env.TON_WALLET_ADDRESS!,
            amount,
            comment: `Payment for booking ${bookingId}`,
            timeout: 600, // 10 minutes
          })

          // Generate QR code (placeholder)
          qrCode = `data:image/png;base64,placeholder-qr-code`
        }

        return reply.code(201).send({
          success: true,
          data: {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency || "TON",
            method: payment.paymentMethod,
            tonPaymentUrl,
            qrCode,
            expiresAt: payment.expiresAt?.toISOString() || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        })
      } catch (error) {
        fastify.log.error({ error }, "Failed to create payment")
        return reply.code(500).send({
          success: false,
          error: "Failed to create payment",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    },
  )

  // Get payment by ID
  fastify.get(
    "/payments/:id",
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const payment = await paymentService.getPaymentById(request.params.id)

        if (!payment) {
          return reply.code(404).send({
            success: false,
            error: "Payment not found",
          })
        }

        return reply.send({
          success: true,
          data: payment,
        })
      } catch (error) {
        fastify.log.error({ error }, "Failed to get payment")
        return reply.code(500).send({
          success: false,
          error: "Failed to get payment",
        })
      }
    },
  )

  // Update payment status
  fastify.patch(
    "/payments/:id/status",
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: updatePaymentStatusSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: z.infer<typeof updatePaymentStatusSchema>
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { status, reason } = request.body

        const updatedPayment = await paymentService.updatePaymentStatus(request.params.id, status, reason)

        return reply.send({
          success: true,
          data: updatedPayment,
        })
      } catch (error) {
        fastify.log.error({ error }, "Failed to update payment status")
        return reply.code(500).send({
          success: false,
          error: "Failed to update payment status",
        })
      }
    },
  )

  // Search payments
  fastify.get(
    "/payments/search",
    {
      schema: {
        querystring: searchPaymentsSchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: z.infer<typeof searchPaymentsSchema> }>, reply: FastifyReply) => {
      try {
        const filters = request.query

        // Type-safe search with proper casting
        const searchFilters = {
          ...filters,
          status: filters.status as any, // Cast to proper enum type
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        }

        const result = await paymentService.searchPayments(searchFilters, filters.page, filters.limit)

        return reply.send({
          success: true,
          data: result,
        })
      } catch (error) {
        fastify.log.error({ error }, "Failed to search payments")
        return reply.code(500).send({
          success: false,
          error: "Failed to search payments",
        })
      }
    },
  )
}
