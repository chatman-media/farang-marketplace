CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'active', 'completed', 'cancelled', 'no_show', 'expired', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('accommodation', 'transportation', 'tour', 'activity', 'dining', 'event', 'service');--> statement-breakpoint
CREATE TYPE "public"."cancellation_reason" AS ENUM('user_request', 'host_unavailable', 'payment_failed', 'policy_violation', 'force_majeure', 'system_error');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'investigating', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."service_booking_type" AS ENUM('consultation', 'project', 'hourly', 'package', 'subscription');--> statement-breakpoint
CREATE TABLE "availability_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"conflict_type" varchar(50) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"booking_id" uuid,
	"reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"reason" text,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"agency_id" uuid,
	"type" "booking_type" NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"check_in" timestamp with time zone NOT NULL,
	"check_out" timestamp with time zone,
	"nights" integer NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"infants" integer DEFAULT 0 NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"service_fees" numeric(10, 2) DEFAULT '0',
	"taxes" numeric(10, 2) DEFAULT '0',
	"total_price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_id" varchar(255),
	"payment_method" varchar(50),
	"special_requests" text,
	"host_notes" text,
	"guest_notes" text,
	"cancellation_reason" "cancellation_reason",
	"cancellation_date" timestamp with time zone,
	"cancellation_policy" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"initiated_by" uuid NOT NULL,
	"dispute_type" varchar(50) NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"resolution" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"refund_amount" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"service_type" "service_booking_type" NOT NULL,
	"provider_id" uuid NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"scheduled_time" varchar(8),
	"duration" jsonb NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Bangkok' NOT NULL,
	"delivery_method" varchar(20) NOT NULL,
	"location" jsonb,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"deliverables" jsonb DEFAULT '[]'::jsonb,
	"communication_preference" varchar(20) NOT NULL,
	"milestones" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_conflicts" ADD CONSTRAINT "availability_conflicts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_conflicts_listing_id_idx" ON "availability_conflicts" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "availability_conflicts_date_range_idx" ON "availability_conflicts" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_id_idx" ON "booking_status_history" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_status_history_changed_at_idx" ON "booking_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "bookings_listing_id_idx" ON "bookings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "bookings_guest_id_idx" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "bookings_host_id_idx" ON "bookings" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_check_in_idx" ON "bookings" USING btree ("check_in");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_idx" ON "bookings" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "disputes_booking_id_idx" ON "disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disputes_initiated_by_idx" ON "disputes" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "service_bookings_booking_id_idx" ON "service_bookings" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "service_bookings_provider_id_idx" ON "service_bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "service_bookings_scheduled_date_idx" ON "service_bookings" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "service_bookings_service_type_idx" ON "service_bookings" USING btree ("service_type");