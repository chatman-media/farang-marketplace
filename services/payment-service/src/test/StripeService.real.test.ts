import { PaymentStatus } from "@marketplace/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Mock the Stripe SDK. StripeService instantiates `new Stripe(...)` in its
// constructor, so we replace the default export with a class whose instances
// expose the resource methods StripeService calls. Every method is a vi.fn()
// we can program per-test for happy-path and error scenarios.
// ---------------------------------------------------------------------------
const stripeMocks = {
  paymentIntents: {
    create: vi.fn(),
    confirm: vi.fn(),
    retrieve: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
  customers: {
    list: vi.fn(),
    create: vi.fn(),
  },
  paymentMethods: {
    create: vi.fn(),
    attach: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}

let lastStripeConfig: any

vi.mock("stripe", () => ({
  default: class MockStripe {
    paymentIntents = stripeMocks.paymentIntents
    refunds = stripeMocks.refunds
    customers = stripeMocks.customers
    paymentMethods = stripeMocks.paymentMethods
    webhooks = stripeMocks.webhooks
    constructor(_key: string, config: any) {
      lastStripeConfig = config
    }
  },
}))

// Import AFTER the mock is registered.
import { StripeService } from "../services/StripeService"

describe("StripeService (real, mocked Stripe SDK)", () => {
  let service: StripeService

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy"
    service = new StripeService()
  })

  describe("constructor", () => {
    it("constructs the Stripe client with typescript + apiVersion config", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      new StripeService()
      expect(lastStripeConfig).toMatchObject({ typescript: true })
      expect(lastStripeConfig.apiVersion).toBeTruthy()
    })

    it("throws when STRIPE_SECRET_KEY is missing", () => {
      const saved = process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_SECRET_KEY
      expect(() => new StripeService()).toThrow(/STRIPE_SECRET_KEY/)
      process.env.STRIPE_SECRET_KEY = saved
    })

    it("defaults webhookSecret to empty string when not set", () => {
      const saved = process.env.STRIPE_WEBHOOK_SECRET
      delete process.env.STRIPE_WEBHOOK_SECRET
      // Should construct without throwing even with no webhook secret.
      expect(() => new StripeService()).not.toThrow()
      process.env.STRIPE_WEBHOOK_SECRET = saved
    })
  })

  describe("createPaymentIntent", () => {
    it("creates a payment intent and maps a succeeded status to COMPLETED", async () => {
      stripeMocks.paymentIntents.create.mockResolvedValue({
        id: "pi_123",
        client_secret: "secret_123",
        status: "succeeded",
        latest_charge: "ch_123",
      })

      const result = await service.createPaymentIntent({
        amount: 10000,
        currency: "USD",
        paymentMethod: "pm_card_visa",
        customerId: "cus_1",
        description: "Booking",
        metadata: { paymentId: "p1" },
      })

      expect(result).toEqual({
        paymentIntentId: "pi_123",
        clientSecret: "secret_123",
        status: PaymentStatus.COMPLETED,
        chargeId: "ch_123",
      })
      // Currency is lowercased and confirm flags passed.
      expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
          currency: "usd",
          payment_method: "pm_card_visa",
          confirm: true,
          confirmation_method: "manual",
        }),
      )
    })

    it("defaults metadata to an empty object when omitted", async () => {
      stripeMocks.paymentIntents.create.mockResolvedValue({
        id: "pi_2",
        client_secret: "secret_2",
        status: "requires_payment_method",
      })

      await service.createPaymentIntent({
        amount: 500,
        currency: "eur",
        paymentMethod: "pm_x",
      })

      expect(stripeMocks.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: {} }))
    })

    it("wraps a declined card error in a 'Payment processing failed' Error", async () => {
      stripeMocks.paymentIntents.create.mockRejectedValue(new Error("Your card was declined."))

      await expect(
        service.createPaymentIntent({ amount: 100, currency: "usd", paymentMethod: "pm_chargeDeclined" }),
      ).rejects.toThrow("Payment processing failed: Your card was declined.")
    })

    it("handles a non-Error rejection with an 'Unknown error' message", async () => {
      stripeMocks.paymentIntents.create.mockRejectedValue("boom")
      await expect(
        service.createPaymentIntent({ amount: 100, currency: "usd", paymentMethod: "pm_x" }),
      ).rejects.toThrow("Payment processing failed: Unknown error")
    })
  })

  describe("confirmPaymentIntent", () => {
    it("confirms a payment intent and returns mapped status", async () => {
      stripeMocks.paymentIntents.confirm.mockResolvedValue({
        id: "pi_9",
        client_secret: "secret_9",
        status: "processing",
        latest_charge: "ch_9",
      })

      const result = await service.confirmPaymentIntent("pi_9")
      expect(result.status).toBe(PaymentStatus.PROCESSING)
      expect(result.chargeId).toBe("ch_9")
      expect(stripeMocks.paymentIntents.confirm).toHaveBeenCalledWith("pi_9")
    })

    it("throws 'Payment confirmation failed' on error", async () => {
      stripeMocks.paymentIntents.confirm.mockRejectedValue(new Error("intent already confirmed"))
      await expect(service.confirmPaymentIntent("pi_x")).rejects.toThrow(
        "Payment confirmation failed: intent already confirmed",
      )
    })
  })

  describe("getPaymentIntent", () => {
    it("retrieves a payment intent", async () => {
      stripeMocks.paymentIntents.retrieve.mockResolvedValue({ id: "pi_r", status: "succeeded" })
      const pi = await service.getPaymentIntent("pi_r")
      expect(pi.id).toBe("pi_r")
      expect(stripeMocks.paymentIntents.retrieve).toHaveBeenCalledWith("pi_r")
    })

    it("throws 'Failed to retrieve payment' on error", async () => {
      stripeMocks.paymentIntents.retrieve.mockRejectedValue(new Error("no such payment_intent"))
      await expect(service.getPaymentIntent("pi_missing")).rejects.toThrow(
        "Failed to retrieve payment: no such payment_intent",
      )
    })
  })

  describe("createRefund", () => {
    it("refunds the latest charge of the payment intent", async () => {
      stripeMocks.paymentIntents.retrieve.mockResolvedValue({ id: "pi_1", latest_charge: "ch_1" })
      stripeMocks.refunds.create.mockResolvedValue({ id: "re_1", status: "succeeded" })

      const refund = await service.createRefund({
        paymentIntentId: "pi_1",
        amount: 5000,
        reason: "requested_by_customer",
      })

      expect(refund.id).toBe("re_1")
      expect(stripeMocks.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({ charge: "ch_1", amount: 5000, reason: "requested_by_customer" }),
      )
    })

    it("throws when the payment intent has no latest_charge", async () => {
      stripeMocks.paymentIntents.retrieve.mockResolvedValue({ id: "pi_2", latest_charge: null })
      await expect(service.createRefund({ paymentIntentId: "pi_2" })).rejects.toThrow(
        "Refund processing failed: No charge found for this payment intent",
      )
      expect(stripeMocks.refunds.create).not.toHaveBeenCalled()
    })

    it("propagates a wrapped error when the Stripe refund call fails", async () => {
      stripeMocks.paymentIntents.retrieve.mockResolvedValue({ id: "pi_3", latest_charge: "ch_3" })
      stripeMocks.refunds.create.mockRejectedValue(new Error("charge already refunded"))
      await expect(service.createRefund({ paymentIntentId: "pi_3" })).rejects.toThrow(
        "Refund processing failed: charge already refunded",
      )
    })
  })

  describe("createCustomer", () => {
    it("returns an existing customer when one matches the email", async () => {
      stripeMocks.customers.list.mockResolvedValue({ data: [{ id: "cus_existing", email: "a@b.com" }] })
      const customer = await service.createCustomer({ email: "a@b.com" })
      expect(customer.id).toBe("cus_existing")
      expect(stripeMocks.customers.create).not.toHaveBeenCalled()
    })

    it("creates a new customer when none exists", async () => {
      stripeMocks.customers.list.mockResolvedValue({ data: [] })
      stripeMocks.customers.create.mockResolvedValue({ id: "cus_new" })
      const customer = await service.createCustomer({ email: "new@b.com", name: "New", phone: "123" })
      expect(customer.id).toBe("cus_new")
      expect(stripeMocks.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@b.com", name: "New", phone: "123" }),
      )
    })

    it("throws 'Customer creation failed' on error", async () => {
      stripeMocks.customers.list.mockRejectedValue(new Error("api down"))
      await expect(service.createCustomer({ email: "x@y.com" })).rejects.toThrow("Customer creation failed: api down")
    })
  })

  describe("createPaymentMethod", () => {
    it("creates a payment method and attaches it to the customer", async () => {
      stripeMocks.paymentMethods.create.mockResolvedValue({ id: "pm_new" })
      stripeMocks.paymentMethods.attach.mockResolvedValue({ id: "pm_new" })

      const pm = await service.createPaymentMethod("cus_1", { type: "card" })
      expect(pm.id).toBe("pm_new")
      expect(stripeMocks.paymentMethods.attach).toHaveBeenCalledWith("pm_new", { customer: "cus_1" })
    })

    it("throws 'Payment method creation failed' on error", async () => {
      stripeMocks.paymentMethods.create.mockRejectedValue(new Error("invalid card"))
      await expect(service.createPaymentMethod("cus_1", {})).rejects.toThrow(
        "Payment method creation failed: invalid card",
      )
    })
  })

  describe("verifyWebhookSignature", () => {
    it("returns the constructed event for a valid signature", () => {
      const event = { id: "evt_1", type: "payment_intent.succeeded" }
      stripeMocks.webhooks.constructEvent.mockReturnValue(event)
      const result = service.verifyWebhookSignature("payload", "sig")
      expect(result).toBe(event)
      expect(stripeMocks.webhooks.constructEvent).toHaveBeenCalledWith("payload", "sig", "whsec_test_dummy")
    })

    it("throws 'Invalid webhook signature' when verification fails", () => {
      stripeMocks.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("signature mismatch")
      })
      expect(() => service.verifyWebhookSignature("payload", "bad-sig")).toThrow("Invalid webhook signature")
    })
  })

  describe("calculateStripeFees", () => {
    it("adds the 30c fixed fee for USD", () => {
      expect(service.calculateStripeFees(1000, "USD")).toEqual({ stripeFee: 59, netAmount: 941 })
    })

    it("omits the fixed fee for non-USD currencies", () => {
      expect(service.calculateStripeFees(1000, "EUR")).toEqual({ stripeFee: 29, netAmount: 971 })
    })
  })

  describe("currency conversion", () => {
    it("converts regular currencies to cents and back", () => {
      expect(service.convertToStripeAmount(10.5, "USD")).toBe(1050)
      expect(service.convertFromStripeAmount(1050, "USD")).toBe(10.5)
    })

    it("does not scale zero-decimal currencies", () => {
      expect(service.convertToStripeAmount(1000, "JPY")).toBe(1000)
      expect(service.convertFromStripeAmount(1000, "JPY")).toBe(1000)
      expect(service.convertToStripeAmount(500.5, "VND")).toBe(501) // rounded
    })
  })

  describe("getSupportedPaymentMethods", () => {
    it("returns country-specific methods", () => {
      expect(service.getSupportedPaymentMethods("DE")).toEqual(["stripe_card", "stripe_sepa", "stripe_sofort"])
      expect(service.getSupportedPaymentMethods("nl")).toContain("stripe_ideal")
    })

    it("falls back to stripe_card for unknown countries", () => {
      expect(service.getSupportedPaymentMethods("XX")).toEqual(["stripe_card"])
    })
  })

  describe("validatePaymentMethodForCountry", () => {
    it("accepts a supported method", () => {
      expect(service.validatePaymentMethodForCountry("stripe_sepa", "DE")).toBe(true)
    })

    it("rejects an unsupported method", () => {
      expect(service.validatePaymentMethodForCountry("stripe_ideal", "US")).toBe(false)
    })
  })

  describe("status mapping (via createPaymentIntent)", () => {
    const cases: Array<[string, PaymentStatus]> = [
      ["requires_payment_method", PaymentStatus.PENDING],
      ["requires_confirmation", PaymentStatus.PENDING],
      ["requires_action", PaymentStatus.PENDING],
      ["processing", PaymentStatus.PROCESSING],
      ["succeeded", PaymentStatus.COMPLETED],
      ["canceled", PaymentStatus.CANCELLED],
      ["requires_capture", PaymentStatus.CONFIRMED],
      ["refunded", PaymentStatus.REFUNDED],
      ["something_unexpected", PaymentStatus.FAILED],
    ]

    it.each(cases)("maps stripe status %s -> %s", async (stripeStatus, expected) => {
      stripeMocks.paymentIntents.create.mockResolvedValue({
        id: "pi",
        client_secret: "secret",
        status: stripeStatus,
      })
      const res = await service.createPaymentIntent({ amount: 1, currency: "usd", paymentMethod: "pm" })
      expect(res.status).toBe(expected)
    })
  })
})
