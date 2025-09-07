import { Router } from "express"
import { body, param, query } from "express-validator"
import { PaymentController } from "../controllers/PaymentController.js"
import { authMiddleware, requireRole } from "../middleware/auth.js"

const router = Router()
const paymentController = new PaymentController()

// Initialize payment controller
await paymentController.initialize()

/**
 * @route POST /api/payments
 * @desc Create a new payment
 * @access Private (authenticated users)
 */
router.post(
  "/",
  authMiddleware,
  [
    body("bookingId").isUUID().withMessage("Booking ID must be a valid UUID"),
    body("payeeId").isUUID().withMessage("Payee ID must be a valid UUID"),
    body("amount")
      .isDecimal({ decimal_digits: "0,8" })
      .withMessage("Amount must be a valid decimal number"),
    body("currency")
      .optional()
      .isIn(["TON", "USDT", "USDC", "USD", "THB"])
      .withMessage("Currency must be one of: TON, USDT, USDC, USD, THB"),
    body("fiatAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Fiat amount must be a positive number"),
    body("fiatCurrency")
      .optional()
      .isIn(["USD", "THB", "EUR", "GBP"])
      .withMessage("Fiat currency must be one of: USD, THB, EUR, GBP"),
    body("paymentMethod")
      .isIn([
        "ton_wallet",
        "ton_connect",
        "jetton_usdt",
        "jetton_usdc",
        "stripe_card",
        "stripe_sepa",
        "stripe_ideal",
        "stripe_sofort",
        "wise_transfer",
        "revolut_pay",
        "paypal",
        "bank_transfer",
        "promptpay",
        "truemoney",
        "rabbit_linepay",
      ])
      .withMessage("Invalid payment method"),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
    body("tonWalletAddress")
      .optional()
      .isLength({ min: 48, max: 48 })
      .withMessage("TON wallet address must be 48 characters"),
  ],
  paymentController.createPayment
)

/**
 * @route POST /api/payments/:paymentId/process-ton
 * @desc Process TON payment
 * @access Private (payer only)
 */
router.post(
  "/:paymentId/process-ton",
  authMiddleware,
  [
    param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID"),
    body("fromAddress")
      .isLength({ min: 48, max: 48 })
      .withMessage("From address must be a valid TON address"),
  ],
  paymentController.processTonPayment
)

/**
 * @route POST /api/payments/:paymentId/process-stripe
 * @desc Process Stripe payment
 * @access Private (payer only)
 */
router.post(
  "/:paymentId/process-stripe",
  authMiddleware,
  [
    param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID"),
    body("paymentMethodId")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Payment method ID is required"),
    body("customerId").optional().isString().withMessage("Customer ID must be a string"),
  ],
  paymentController.processStripePayment
)

/**
 * @route POST /api/payments/:paymentId/confirm-stripe
 * @desc Confirm Stripe payment intent
 * @access Private (payer only)
 */
router.post(
  "/:paymentId/confirm-stripe",
  authMiddleware,
  [param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID")],
  paymentController.confirmStripePayment
)

/**
 * @route GET /api/payments/search
 * @desc Search payments with filters
 * @access Private (authenticated users)
 */
router.get(
  "/search",
  authMiddleware,
  [
    query("status")
      .optional()
      .isIn([
        "pending",
        "processing",
        "confirmed",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "disputed",
      ])
      .withMessage("Invalid payment status"),
    query("paymentMethod")
      .optional()
      .isIn([
        "ton_wallet",
        "ton_connect",
        "jetton_usdt",
        "jetton_usdc",
        "credit_card",
        "bank_transfer",
      ])
      .withMessage("Invalid payment method"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
    query("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
    query("minAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum amount must be a positive number"),
    query("maxAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum amount must be a positive number"),
  ],
  paymentController.searchPayments
)

/**
 * @route GET /api/payments/:paymentId
 * @desc Get payment by ID
 * @access Private (payment participants only)
 */
router.get(
  "/:paymentId",
  authMiddleware,
  [param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID")],
  paymentController.getPayment
)

/**
 * @route PATCH /api/payments/:paymentId/status
 * @desc Update payment status
 * @access Private (payee or admin only)
 */
router.patch(
  "/:paymentId/status",
  authMiddleware,
  [
    param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID"),
    body("status")
      .isIn([
        "pending",
        "processing",
        "confirmed",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "disputed",
      ])
      .withMessage("Invalid payment status"),
    body("reason")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Reason must not exceed 200 characters"),
  ],
  paymentController.updatePaymentStatus
)

/**
 * @route GET /api/payments/:paymentId/transactions
 * @desc Get payment transaction history
 * @access Private (payment participants only)
 */
router.get(
  "/:paymentId/transactions",
  authMiddleware,
  [param("paymentId").isUUID().withMessage("Payment ID must be a valid UUID")],
  paymentController.getPaymentTransactions
)

export default router
