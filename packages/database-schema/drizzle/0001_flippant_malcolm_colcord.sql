CREATE TYPE "public"."communication_platform" AS ENUM('telegram', 'whatsapp', 'phone', 'email', 'website', 'other');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('incoming', 'outgoing', 'system', 'ai_generated');--> statement-breakpoint
CREATE TYPE "public"."pricing_system" AS ENUM('calendar', 'seasonal');--> statement-breakpoint
CREATE TYPE "public"."rental_status" AS ENUM('active', 'completed', 'cancelled', 'overdue', 'pending');--> statement-breakpoint
CREATE TABLE "ai_prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"platform" "communication_platform" NOT NULL,
	"message_type" "message_type" NOT NULL,
	"message_text" text NOT NULL,
	"external_message_id" varchar(100),
	"sender_name" varchar(200),
	"context_summary" text,
	"is_processed_by_ai" boolean DEFAULT false,
	"ai_response" text,
	"message_timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "vehicle_calendar_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"weekly_rate" numeric(10, 2),
	"monthly_rate" numeric(10, 2),
	"is_available" boolean DEFAULT true,
	"max_bookings" integer DEFAULT 1,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"engine_oil_km" integer DEFAULT 0,
	"gear_oil_km" integer DEFAULT 0,
	"radiator_water_km" integer DEFAULT 0,
	"front_brakes_km" integer DEFAULT 0,
	"rear_brakes_km" integer DEFAULT 0,
	"air_filter_km" integer DEFAULT 0,
	"spark_plugs_km" integer DEFAULT 0,
	"tech_inspection_date" timestamp,
	"insurance_date" timestamp,
	"cigarette_lighter" boolean DEFAULT false,
	"front_bearing" varchar(100),
	"rear_bearing" varchar(100),
	"front_tire" varchar(100),
	"rear_tire" varchar(100),
	"battery" varchar(100),
	"belt" varchar(100),
	"starter" varchar(100),
	"gasket" varchar(100),
	"water" varchar(100),
	"rear_disc_needs_replacement" varchar(200),
	"last_service_date" timestamp,
	"replacement_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"maintenance_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "vehicle_maintenance_vehicle_id_unique" UNIQUE("vehicle_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"actual_end_date" timestamp,
	"status" "rental_status" DEFAULT 'pending',
	"daily_rate" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2),
	"deposit" numeric(10, 2) DEFAULT '0',
	"delivery_fee" numeric(10, 2),
	"pickup_fee" numeric(10, 2),
	"late_fee" numeric(10, 2),
	"damage_fee" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "real_estate" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "real_estate" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "listing_type" SET DEFAULT 'rental';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE varchar(17);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_id" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_username" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_client" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_rented_before" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_platform" "communication_platform" DEFAULT 'telegram';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_contact_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_contact_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manager_communication_info" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "power" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "old_vehicle_number" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sticker" varchar(100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "rental_sticker" varchar(100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gps_tracker_id" varchar(100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gps_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "pricing_system" "pricing_system" DEFAULT 'seasonal';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "one_year_rent" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "six_month_high_season" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "six_month_low_season" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "days_1_3" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "days_4_7" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "days_7_14" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "days_15_25" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "december_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "january_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "february_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "march_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "april_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "may_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "summer_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "september_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "october_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "november_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_unique" UNIQUE("phone");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_old_vehicle_number_unique" UNIQUE("old_vehicle_number");--> statement-breakpoint
ALTER TABLE "public"."listings" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."listing_category";--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('transportation', 'tours', 'services', 'vehicles', 'products');--> statement-breakpoint
ALTER TABLE "public"."listings" ALTER COLUMN "category" SET DATA TYPE "public"."listing_category" USING "category"::"public"."listing_category";--> statement-breakpoint
ALTER TABLE "public"."listings" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."listing_type";--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('rental', 'service');--> statement-breakpoint
ALTER TABLE "public"."listings" ALTER COLUMN "type" SET DATA TYPE "public"."listing_type" USING "type"::"public"."listing_type";--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "listing_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."product_listing_type";--> statement-breakpoint
CREATE TYPE "public"."product_listing_type" AS ENUM('rental', 'service');--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "listing_type" SET DATA TYPE "public"."product_listing_type" USING "listing_type"::"public"."product_listing_type";--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."product_status";--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('available', 'rented', 'reserved', 'inactive');--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "status" SET DATA TYPE "public"."product_status" USING "status"::"public"."product_status";--> statement-breakpoint
DROP TYPE "public"."property_status";--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'reserved', 'maintenance', 'inactive');--> statement-breakpoint
ALTER TABLE "public"."vehicles" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."vehicle_category";--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('rental', 'lease', 'ride_sharing', 'delivery');--> statement-breakpoint
ALTER TABLE "public"."vehicles" ALTER COLUMN "category" SET DATA TYPE "public"."vehicle_category" USING "category"::"public"."vehicle_category";--> statement-breakpoint
ALTER TABLE "public"."vehicles" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."vehicle_status";--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'rented', 'maintenance', 'reserved', 'inactive');--> statement-breakpoint
ALTER TABLE "public"."vehicles" ALTER COLUMN "status" SET DATA TYPE "public"."vehicle_status" USING "status"::"public"."vehicle_status";