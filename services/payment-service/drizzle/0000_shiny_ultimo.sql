CREATE TYPE "public"."dispute_status" AS ENUM('open', 'investigating', 'resolved', 'closed', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('ton_wallet', 'ton_connect', 'jetton_usdt', 'jetton_usdc', 'stripe_card', 'promptpay');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'confirmed', 'completed', 'failed', 'cancelled', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund', 'fee', 'commission', 'withdrawal', 'deposit', 'confirmation');--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"raised_by" uuid NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"resolution" text,
	"resolution_amount" numeric(12, 2),
	"external_dispute_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_method" NOT NULL,
	"name" varchar(100) NOT NULL,
	"ton_wallet_address" varchar(48),
	"ton_wallet_name" varchar(100),
	"card_last4" varchar(4),
	"card_brand" varchar(20),
	"card_expiry_month" integer,
	"card_expiry_year" integer,
	"is_default" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"payee_id" uuid NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(10) DEFAULT 'TON' NOT NULL,
	"fiat_amount" numeric(12, 2),
	"fiat_currency" varchar(3) DEFAULT 'USD',
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"ton_transaction_hash" varchar(64),
	"ton_wallet_address" varchar(48),
	"ton_amount" numeric(20, 8),
	"confirmation_blocks" integer DEFAULT 0,
	"required_confirmations" integer DEFAULT 3,
	"platform_fee" numeric(12, 2) DEFAULT '0',
	"processing_fee" numeric(12, 2) DEFAULT '0',
	"total_fees" numeric(12, 2) DEFAULT '0',
	"description" text,
	"metadata" jsonb,
	"external_payment_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"webhook_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"processed_by" uuid,
	"ton_transaction_hash" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"ton_transaction_hash" varchar(64),
	"block_number" varchar(20),
	"gas_used" numeric(20, 8),
	"gas_fee" numeric(20, 8),
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "disputes_payment_id_idx" ON "disputes" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "disputes_raised_by_idx" ON "disputes" USING btree ("raised_by");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_methods_type_idx" ON "payment_methods" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_methods_ton_wallet_idx" ON "payment_methods" USING btree ("ton_wallet_address");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_payer_id_idx" ON "payments" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payments_payee_id_idx" ON "payments" USING btree ("payee_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_ton_tx_hash_idx" ON "payments" USING btree ("ton_transaction_hash");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_requested_by_idx" ON "refunds" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_payment_id_idx" ON "transactions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_ton_tx_hash_idx" ON "transactions" USING btree ("ton_transaction_hash");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");