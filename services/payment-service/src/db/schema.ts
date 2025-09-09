import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  text,
  jsonb,
  pgEnum,
  index,
  boolean,
  integer,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "confirmed",
  "completed",
  "failed",
  "cancelled",
  "refunded",
  "disputed",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "ton_wallet",
  "ton_connect",
  "jetton_usdt",
  "jetton_usdc",
  "stripe_card",
  "promptpay",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "payment",
  "refund",
  "fee",
  "commission",
  "withdrawal",
  "deposit",
  "confirmation",
])

export const refundStatusEnum = pgEnum("refund_status", ["pending", "processing", "completed", "failed", "cancelled"])

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "investigating", "resolved", "closed", "escalated"])

// Main Tables
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull(),
    payerId: uuid("payer_id").notNull(),
    payeeId: uuid("payee_id").notNull(),

    // Payment Details
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("TON"),
    fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }),
    fiatCurrency: varchar("fiat_currency", { length: 3 }).default("USD"),

    // Payment Method & Status
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Blockchain Details
    tonTransactionHash: varchar("ton_transaction_hash", { length: 64 }),
    tonWalletAddress: varchar("ton_wallet_address", { length: 48 }),
    tonAmount: decimal("ton_amount", { precision: 20, scale: 8 }),
    confirmationBlocks: integer("confirmation_blocks").default(0),
    requiredConfirmations: integer("required_confirmations").default(3),

    // Fees and Commission
    platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).default("0"),
    processingFee: decimal("processing_fee", {
      precision: 12,
      scale: 2,
    }).default("0"),
    totalFees: decimal("total_fees", { precision: 12, scale: 2 }).default("0"),

    // Metadata
    description: text("description"),
    metadata: jsonb("metadata"),

    // Webhook & External References
    externalPaymentId: varchar("external_payment_id", { length: 255 }),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
    webhookData: jsonb("webhook_data"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    bookingIdIdx: index("payments_booking_id_idx").on(table.bookingId),
    payerIdIdx: index("payments_payer_id_idx").on(table.payerId),
    payeeIdIdx: index("payments_payee_id_idx").on(table.payeeId),
    statusIdx: index("payments_status_idx").on(table.status),
    tonTxHashIdx: index("payments_ton_tx_hash_idx").on(table.tonTransactionHash),
    createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
  }),
)

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),

    // Transaction Details
    type: transactionTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),

    // Blockchain Details
    tonTransactionHash: varchar("ton_transaction_hash", { length: 64 }),
    blockNumber: varchar("block_number", { length: 20 }),
    gasUsed: decimal("gas_used", { precision: 20, scale: 8 }),
    gasFee: decimal("gas_fee", { precision: 20, scale: 8 }),

    // Stripe Details
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeChargeId: varchar("stripe_charge_id", { length: 255 }),

    // Status and Metadata
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    description: text("description"),
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
  },
  (table) => ({
    paymentIdIdx: index("transactions_payment_id_idx").on(table.paymentId),
    typeIdx: index("transactions_type_idx").on(table.type),
    tonTxHashIdx: index("transactions_ton_tx_hash_idx").on(table.tonTransactionHash),
    statusIdx: index("transactions_status_idx").on(table.status),
  }),
)

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    requestedBy: uuid("requested_by").notNull(),

    // Refund Details
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    reason: varchar("reason", { length: 100 }).notNull(),
    description: text("description"),

    // Status and Processing
    status: refundStatusEnum("status").notNull().default("pending"),
    processedBy: uuid("processed_by"),

    // Blockchain Details
    tonTransactionHash: varchar("ton_transaction_hash", { length: 64 }),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => ({
    paymentIdIdx: index("refunds_payment_id_idx").on(table.paymentId),
    requestedByIdx: index("refunds_requested_by_idx").on(table.requestedBy),
    statusIdx: index("refunds_status_idx").on(table.status),
  }),
)

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    raisedBy: uuid("raised_by").notNull(),

    // Dispute Details
    reason: varchar("reason", { length: 100 }).notNull(),
    description: text("description").notNull(),
    evidence: jsonb("evidence"),

    // Status and Resolution
    status: disputeStatusEnum("status").notNull().default("open"),
    assignedTo: uuid("assigned_to"),
    resolution: text("resolution"),
    resolutionAmount: decimal("resolution_amount", { precision: 12, scale: 2 }),

    // External References
    externalDisputeId: varchar("external_dispute_id", { length: 255 }),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    paymentIdIdx: index("disputes_payment_id_idx").on(table.paymentId),
    raisedByIdx: index("disputes_raised_by_idx").on(table.raisedBy),
    statusIdx: index("disputes_status_idx").on(table.status),
  }),
)

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    // Method Details
    type: paymentMethodEnum("type").notNull(),
    name: varchar("name", { length: 100 }).notNull(),

    // TON Wallet Details
    tonWalletAddress: varchar("ton_wallet_address", { length: 48 }),
    tonWalletName: varchar("ton_wallet_name", { length: 100 }),

    // Card Details (encrypted)
    cardLast4: varchar("card_last4", { length: 4 }),
    cardBrand: varchar("card_brand", { length: 20 }),
    cardExpiryMonth: integer("card_expiry_month"),
    cardExpiryYear: integer("card_expiry_year"),

    // Status and Verification
    isDefault: boolean("is_default").default(false),
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),

    // Metadata
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => ({
    userIdIdx: index("payment_methods_user_id_idx").on(table.userId),
    typeIdx: index("payment_methods_type_idx").on(table.type),
    tonWalletIdx: index("payment_methods_ton_wallet_idx").on(table.tonWalletAddress),
  }),
)

// Relations
export const paymentsRelations = relations(payments, ({ many }) => ({
  transactions: many(transactions),
  refunds: many(refunds),
  disputes: many(disputes),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id],
  }),
}))

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
}))

export const disputesRelations = relations(disputes, ({ one }) => ({
  payment: one(payments, {
    fields: [disputes.paymentId],
    references: [payments.id],
  }),
}))

// Export types
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Refund = typeof refunds.$inferSelect
export type NewRefund = typeof refunds.$inferInsert
export type Dispute = typeof disputes.$inferSelect
export type NewDispute = typeof disputes.$inferInsert
export type PaymentMethod = typeof paymentMethods.$inferSelect
export type NewPaymentMethod = typeof paymentMethods.$inferInsert

// Export enum types
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]
export type PaymentMethodType = (typeof paymentMethodEnum.enumValues)[number]
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number]
export type RefundStatus = (typeof refundStatusEnum.enumValues)[number]
export type DisputeStatus = (typeof disputeStatusEnum.enumValues)[number]
