export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  TON = 'ton',
  CARD = 'card',
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  returnUrl?: string;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  paymentUrl?: string;
  transactionHash?: string;
}

export interface WebhookPayload {
  paymentId: string;
  status: PaymentStatus;
  transactionHash?: string;
  amount: number;
  currency: string;
  timestamp: Date;
}
