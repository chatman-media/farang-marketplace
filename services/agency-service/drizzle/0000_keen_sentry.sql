CREATE TYPE "public"."agency_status" AS ENUM('pending', 'active', 'suspended', 'inactive', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."service_assignment_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('vehicles', 'watercraft', 'equipment', 'property', 'electronics', 'tools', 'furniture', 'events', 'recreation', 'household', 'other');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"business_registration_number" varchar(100),
	"tax_id" varchar(50),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"website" varchar(255),
	"primary_location" jsonb NOT NULL,
	"coverage_areas" jsonb DEFAULT '[]' NOT NULL,
	"commission_rate" numeric(5, 4) DEFAULT '0.15' NOT NULL,
	"minimum_order_value" numeric(12, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"status" "agency_status" DEFAULT 'pending' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" numeric(10, 0) DEFAULT '0',
	"total_orders" numeric(10, 0) DEFAULT '0',
	"completed_orders" numeric(10, 0) DEFAULT '0',
	"documents" jsonb DEFAULT '{}',
	"verification_notes" text,
	"settings" jsonb DEFAULT '{}',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"last_active_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "service_category" NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"pricing_model" varchar(50) DEFAULT 'fixed' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"estimated_duration" varchar(100),
	"requirements" jsonb DEFAULT '[]',
	"capabilities" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commission_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"service_assignment_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_id" uuid,
	"transaction_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"agency_service_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"booking_id" uuid,
	"service_price" numeric(12, 2) NOT NULL,
	"commission_amount" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(5, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"status" "service_assignment_status" DEFAULT 'active' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"customer_rating" numeric(3, 2),
	"customer_feedback" text,
	"agency_notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agency_services" ADD CONSTRAINT "agency_services_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_service_assignment_id_service_assignments_id_fk" FOREIGN KEY ("service_assignment_id") REFERENCES "public"."service_assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_agency_service_id_agency_services_id_fk" FOREIGN KEY ("agency_service_id") REFERENCES "public"."agency_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_user_id_idx" ON "agencies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_status_idx" ON "agencies" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_verification_status_idx" ON "agencies" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_rating_idx" ON "agencies" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_email_idx" ON "agencies" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_services_agency_id_idx" ON "agency_services" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_services_category_idx" ON "agency_services" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_services_is_active_idx" ON "agency_services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commission_payments_agency_id_idx" ON "commission_payments" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commission_payments_service_assignment_id_idx" ON "commission_payments" USING btree ("service_assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commission_payments_status_idx" ON "commission_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commission_payments_paid_at_idx" ON "commission_payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_assignments_agency_id_idx" ON "service_assignments" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_assignments_listing_id_idx" ON "service_assignments" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_assignments_booking_id_idx" ON "service_assignments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_assignments_status_idx" ON "service_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_assignments_assigned_at_idx" ON "service_assignments" USING btree ("assigned_at");