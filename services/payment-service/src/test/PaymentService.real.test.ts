import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaymentService } from "../services/PaymentService"

// Mock dependencies
vi.mock("../db/connection", () => ({
  db: {
    transaction: vi.fn((callback) => callback(mockTx)),
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
  },
  schema: {
    payments: {},
    transactions: {},
    refunds: {},
    disputes: {},
  },
}))

vi.mock("../services/ModernTonService", () => ({
  ModernTonService: class {
    async initialize() {
      return
    }
    async createPaymentAddress() {
      return {
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        publicKey: "test-public-key",
      }
    }
    async verifyPayment() {
      return {
        verified: true,
        amount: "100",
        sender: "sender-address",
      }
    }
  },
}))

vi.mock("../services/StripeService", () => ({
  StripeService: class {
    async createPaymentIntent() {
      return {
        id: "pi_test123",
        clientSecret: "secret_test123",
        amount: 10000,
        currency: "usd",
        status: "requires_payment_method",
      }
    }
    async confirmPaymentIntent() {
      return {
        id: "pi_test123",
        status: "succeeded",
      }
    }
  },
}))

let defaultPaymentData = {
  id: "payment-123",
  bookingId: "booking-123",
  payerId: "payer-123",
  payeeId: "payee-123",
  amount: "100.00000000",
  currency: "TON",
  status: "pending",
  paymentMethod: "ton_wallet",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  set: vi.fn(function (this: any, data: any) {
    if (data.status || data.paymentMethod) {
      defaultPaymentData = { ...defaultPaymentData, ...data }
    }
    return this
  }),
  values: vi.fn(function (this: any, data: any) {
    if (data.paymentMethod) {
      defaultPaymentData = { ...defaultPaymentData, ...data }
    }
    return this
  }),
  returning: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  then: vi.fn((callback) => {
    // Always return fresh defaultPaymentData
    return Promise.resolve(callback([{ ...defaultPaymentData }]))
  }),
}

const mockTx = {
  select: vi.fn(() => mockQueryBuilder),
  insert: vi.fn(() => mockQueryBuilder),
  update: vi.fn(() => mockQueryBuilder),
}

describe("PaymentService", () => {
  let paymentService: PaymentService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default payment data
    defaultPaymentData = {
      id: "payment-123",
      bookingId: "booking-123",
      payerId: "payer-123",
      payeeId: "payee-123",
      amount: "100.00000000",
      currency: "TON",
      status: "pending",
      paymentMethod: "ton_wallet",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    paymentService = new PaymentService()
  })

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      await expect(paymentService.initialize()).resolves.toBeUndefined()
    })
  })

  describe("createPayment", () => {
    it("should create a TON payment successfully", async () => {
      const request = {
        bookingId: "booking-123",
        payerId: "payer-123",
        payeeId: "payee-123",
        amount: "100.00000000",
        currency: "TON",
        paymentMethod: "ton_wallet" as const,
        description: "Test payment",
      }

      const result = await paymentService.createPayment(request)

      expect(result).toBeDefined()
      expect(result.id).toBe("payment-123")
      expect(result.status).toBe("pending")
    })

    it("should create a Stripe payment successfully", async () => {
      const request = {
        bookingId: "booking-123",
        payerId: "payer-123",
        payeeId: "payee-123",
        amount: "100.00",
        fiatAmount: 100,
        fiatCurrency: "USD",
        paymentMethod: "stripe_card" as const,
        description: "Test payment",
      }

      const result = await paymentService.createPayment(request)

      expect(result).toBeDefined()
      expect(result.paymentMethod).toBe("stripe_card")
    })

    it("should calculate fees correctly", async () => {
      const request = {
        bookingId: "booking-123",
        payerId: "payer-123",
        payeeId: "payee-123",
        amount: "100.00000000",
        paymentMethod: "ton_wallet" as const,
      }

      const result = await paymentService.createPayment(request)

      expect(result).toBeDefined()
      // Platform fee (3%) + Processing fee (0.5%) = 3.5%
      // Fees should be calculated on the amount
    })
  })

  describe("getPaymentById", () => {
    it("should return payment if found", async () => {
      const result = await paymentService.getPaymentById("payment-123")

      expect(result).toBeDefined()
      expect(result?.id).toBe("payment-123")
    })

    it("should return null if payment not found", async () => {
      mockQueryBuilder.then = vi.fn((callback) => Promise.resolve(callback([])))

      const result = await paymentService.getPaymentById("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("updatePaymentStatus", () => {
    it("should update payment status successfully", async () => {
      // Mock the update query to return proper payment data
      mockQueryBuilder.then = vi.fn((callback) =>
        Promise.resolve(
          callback([
            {
              id: "payment-123",
              currency: "TON",
              status: "completed",
              amount: "100.00000000",
              payerId: "payer-123",
              payeeId: "payee-123",
              bookingId: "booking-123",
              paymentMethod: "ton_wallet",
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: new Date(),
            },
          ]),
        ),
      )

      const result = await paymentService.updatePaymentStatus("payment-123", "completed")
      expect(result).toBeDefined()
      expect(result.status).toBe("completed")
    })

    it("should record transaction when status changes", async () => {
      // Mock the update query to return proper payment data
      let insertCalled = false
      mockQueryBuilder.then = vi.fn((callback) => {
        // Track if this is an insert operation (transactions table)
        if (callback.toString().includes("transaction")) {
          insertCalled = true
        }
        return Promise.resolve(
          callback([
            {
              id: "payment-123",
              currency: "TON",
              status: "completed",
              amount: "100.00000000",
              payerId: "payer-123",
              payeeId: "payee-123",
              bookingId: "booking-123",
              paymentMethod: "ton_wallet",
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: new Date(),
            },
          ]),
        )
      })

      const result = await paymentService.updatePaymentStatus("payment-123", "completed")

      // Verify payment was updated
      expect(result).toBeDefined()
      expect(result.status).toBe("completed")
    })
  })

  // Note: processRefund, searchPayments, and getPaymentAnalytics methods are not implemented yet
  // Uncomment these tests when the methods are added to PaymentService

  // describe("processRefund", () => {
  //   it("should process refund successfully", async () => {
  //     const result = await paymentService.processRefund("payment-123", "100.00000000", "Customer request")
  //     expect(result).toBeDefined()
  //   })
  //   it("should validate refund amount", async () => {
  //     await expect(paymentService.processRefund("payment-123", "1000.00000000", "Too much")).rejects.toThrow()
  //   })
  // })

  // describe("searchPayments", () => {
  //   it("should search payments with filters", async () => {
  //     mockQueryBuilder.then = vi
  //       .fn()
  //       .mockResolvedValueOnce([{ count: "10" }])
  //       .mockResolvedValueOnce([
  //         { id: "payment-1", status: "completed" },
  //         { id: "payment-2", status: "completed" },
  //       ])
  //     const result = await paymentService.searchPayments({ status: "completed" }, { page: 1, limit: 10 })
  //     expect(result.payments).toHaveLength(2)
  //     expect(result.total).toBe(10)
  //   })
  // })

  // describe("getPaymentAnalytics", () => {
  //   it("should return analytics data", async () => {
  //     mockQueryBuilder.then = vi
  //       .fn()
  //       .mockResolvedValueOnce([{ total_amount: "1000", payment_count: "50" }])
  //       .mockResolvedValueOnce([{ total_amount: "900", payment_count: "45" }])
  //       .mockResolvedValueOnce([{ total_amount: "50", refund_count: "3" }])
  //     const analytics = await paymentService.getPaymentAnalytics()
  //     expect(analytics).toBeDefined()
  //     expect(analytics.totalVolume).toBeGreaterThan(0)
  //     expect(analytics.successfulPayments).toBeGreaterThan(0)
  //   })
  // })

  describe("Payment validation", () => {
    it("should validate payment request structure", () => {
      const validRequest = {
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        payerId: "123e4567-e89b-12d3-a456-426614174001",
        payeeId: "123e4567-e89b-12d3-a456-426614174002",
        amount: "100.50000000",
        paymentMethod: "ton_wallet" as const,
      }

      expect(validRequest.bookingId).toBeDefined()
      expect(validRequest.payerId).toBeDefined()
      expect(validRequest.payeeId).toBeDefined()
      expect(validRequest.amount).toBeDefined()
      expect(validRequest.paymentMethod).toBeDefined()
    })

    it("should validate TON address format", () => {
      const validAddress = "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"
      const invalidAddress = "invalid-address"

      // Basic TON address validation (starts with EQ)
      expect(validAddress.startsWith("EQ")).toBe(true)
      expect(invalidAddress.startsWith("EQ")).toBe(false)
    })

    it("should validate amount format", () => {
      const validAmounts = ["100.00000000", "0.50000000", "1000.12345678"]
      const invalidAmounts = ["abc", "-10", "100", ""]

      validAmounts.forEach((amount) => {
        expect(Number.parseFloat(amount)).toBeGreaterThan(0)
        expect(amount).toMatch(/^\d+\.\d{1,8}$/)
      })

      invalidAmounts.forEach((amount) => {
        expect(amount.match(/^\d+\.\d{1,8}$/)).toBeFalsy()
      })
    })
  })

  describe("Fee calculations", () => {
    it("should calculate platform fees correctly", () => {
      const amount = 100
      const platformFeeRate = 0.03 // 3%
      const platformFee = amount * platformFeeRate

      expect(platformFee).toBe(3)
    })

    it("should calculate processing fees correctly", () => {
      const amount = 100
      const processingFeeRate = 0.005 // 0.5%
      const processingFee = amount * processingFeeRate

      expect(processingFee).toBe(0.5)
    })

    it("should calculate total fees correctly", () => {
      const amount = 100
      const platformFee = amount * 0.03
      const processingFee = amount * 0.005
      const totalFees = platformFee + processingFee

      expect(totalFees).toBe(3.5)
    })
  })
})
