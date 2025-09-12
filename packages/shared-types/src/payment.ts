export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  DISPUTED = "disputed",
}

export enum PaymentMethod {
  TON_WALLET = "ton_wallet",
  TON_CONNECT = "ton_connect",
  JETTON_USDT = "jetton_usdt",
  JETTON_USDC = "jetton_usdc",
  STRIPE_CARD = "stripe_card",
  PROMPTPAY = "promptpay",
}

export interface PaymentRequest {
  bookingId: string
  amount: number
  currency: string
  method: PaymentMethod
  returnUrl?: string
}

export interface PaymentResponse {
  id: string
  status: PaymentStatus
  paymentUrl?: string
  transactionHash?: string
}

export interface WebhookPayload {
  paymentId: string
  status: PaymentStatus
  transactionHash?: string
  amount: number
  currency: string
  timestamp: Date
}

export enum TransactionType {
  PAYMENT = "payment",
  REFUND = "refund",
  FEE = "fee",
  COMMISSION = "commission",
  WITHDRAWAL = "withdrawal",
  DEPOSIT = "deposit",
  CONFIRMATION = "confirmation",
}

export enum RefundStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum DisputeStatus {
  OPEN = "open",
  INVESTIGATING = "investigating",
  RESOLVED = "resolved",
  CLOSED = "closed",
  ESCALATED = "escalated",
}

export interface PaymentTransaction {
  id: string
  paymentId: string
  type: TransactionType
  amount: number
  currency: string
  tonTransactionHash?: string
  blockNumber?: string
  gasUsed?: number
  gasFee?: number
  stripePaymentIntentId?: string
  stripeChargeId?: string
  status: string
  description?: string
  metadata?: Record<string, any>
  createdAt: Date
  confirmedAt?: Date
}

export interface PaymentRefund {
  id: string
  paymentId: string
  requestedBy: string
  amount: number
  currency: string
  reason: string
  description?: string
  status: RefundStatus
  processedBy?: string
  tonTransactionHash?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
}

export interface PaymentDispute {
  id: string
  paymentId: string
  raisedBy: string
  reason: string
  description: string
  evidence?: Record<string, any>
  status: DisputeStatus
  assignedTo?: string
  resolution?: string
  resolutionAmount?: number
  externalDisputeId?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

export interface PaymentMethodInfo {
  id: string
  userId: string
  type: PaymentMethod
  name: string
  tonWalletAddress?: string
  tonWalletName?: string
  cardLast4?: string
  cardBrand?: string
  cardExpiryMonth?: number
  cardExpiryYear?: number
  isDefault: boolean
  isVerified: boolean
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  verifiedAt?: Date
}
