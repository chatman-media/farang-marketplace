import { Router } from 'express';
import { body } from 'express-validator';
import { WebhookController } from '../controllers/WebhookController.js';

const router = Router();
const webhookController = new WebhookController();

/**
 * @route POST /api/webhooks/ton
 * @desc Handle TON blockchain webhooks
 * @access Public (with signature verification)
 */
router.post(
  '/ton',
  [
    body('event_type')
      .isIn(['transaction_confirmed', 'transaction_failed', 'block_confirmed'])
      .withMessage('Invalid event type'),
    body('transaction').isObject().withMessage('Transaction data required'),
  ],
  webhookController.handleTonWebhook
);

/**
 * @route POST /api/webhooks/payment
 * @desc Handle generic payment webhooks
 * @access Public (with signature verification)
 */
router.post(
  '/payment',
  [
    body('payment_id').isUUID().withMessage('Payment ID must be a valid UUID'),
    body('status')
      .isIn([
        'pending',
        'processing',
        'confirmed',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'disputed',
      ])
      .withMessage('Invalid payment status'),
  ],
  webhookController.handlePaymentWebhook
);

/**
 * @route POST /api/webhooks/refund
 * @desc Handle refund webhooks
 * @access Public (with signature verification)
 */
router.post(
  '/refund',
  [
    body('payment_id').isUUID().withMessage('Payment ID must be a valid UUID'),
    body('refund_amount')
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Refund amount must be a valid decimal number'),
  ],
  webhookController.handleRefundWebhook
);

/**
 * @route POST /api/webhooks/stripe
 * @desc Handle Stripe payment webhooks
 * @access Public (with signature verification)
 */
router.post('/stripe', webhookController.handleStripeWebhook);

/**
 * @route GET /api/webhooks/health
 * @desc Webhook health check
 * @access Public
 */
router.get('/health', webhookController.webhookHealthCheck);

export default router;
