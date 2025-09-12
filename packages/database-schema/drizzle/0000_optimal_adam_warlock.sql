CREATE TYPE "public"."availability_status" AS ENUM('available', 'busy', 'away', 'offline');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('email', 'sms', 'call', 'whatsapp', 'line', 'telegram', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('individual', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'lpg', 'cng');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'th', 'ru', 'zh', 'ja');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."listing_purpose" AS ENUM('rent', 'sale', 'short_term_rental');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'inactive', 'sold', 'rented', 'reserved', 'maintenance', 'pending_approval', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('accommodation', 'service', 'vehicle', 'product');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('fixed', 'negotiable', 'auction', 'per_hour', 'per_day', 'per_week', 'per_month', 'per_year');--> statement-breakpoint
CREATE TYPE "public"."product_condition" AS ENUM('new', 'like_new', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."product_listing_type" AS ENUM('sale', 'rental', 'auction', 'exchange');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('available', 'sold', 'reserved', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('electronics', 'clothing', 'home_garden', 'sports_outdoors', 'books_media', 'toys_games', 'health_beauty', 'automotive', 'food_beverages', 'other');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'sold', 'reserved', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'condo', 'villa', 'townhouse', 'studio', 'room', 'office', 'retail', 'warehouse', 'land', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('individual', 'company', 'agency', 'freelancer');--> statement-breakpoint
CREATE TYPE "public"."transmission_type" AS ENUM('manual', 'automatic', 'cvt', 'semi_automatic');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'moderator', 'service_provider');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('rental', 'sale', 'lease', 'ride_sharing', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."vehicle_condition" AS ENUM('new', 'excellent', 'good', 'fair', 'poor', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'rented', 'maintenance', 'reserved', 'sold', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('scooter', 'motorcycle', 'car', 'bicycle', 'boat', 'jet_ski', 'atv', 'truck', 'van', 'bus');--> statement-breakpoint
CREATE TYPE "public"."verification_level" AS ENUM('basic', 'verified', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "campaign_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"template_id" uuid,
	"type" "communication_type" NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"type" varchar(50) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "communication_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"lead_id" uuid,
	"user_id" uuid NOT NULL,
	"type" "communication_type" NOT NULL,
	"subject" varchar(255),
	"content" text,
	"direction" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "customer_segment_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"company" varchar(255),
	"job_title" varchar(100),
	"customer_type" "customer_type" DEFAULT 'individual',
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"assigned_to" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"source" varchar(100),
	"estimated_value" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'THB',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "listing_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending',
	"payment_method" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"guest_details" jsonb DEFAULT '{}'::jsonb,
	"special_requests" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" "listing_category" NOT NULL,
	"type" "listing_type" NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"price_type" "price_type" DEFAULT 'fixed',
	"location_address" text NOT NULL,
	"location_city" varchar(100) NOT NULL,
	"location_region" varchar(100) NOT NULL,
	"location_country" varchar(100) DEFAULT 'Thailand' NOT NULL,
	"location_zip_code" varchar(20),
	"location_latitude" varchar(50),
	"location_longitude" varchar(50),
	"images" json DEFAULT '[]'::json,
	"videos" json DEFAULT '[]'::json,
	"documents" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"slug" varchar(255),
	"tags" json DEFAULT '[]'::json,
	"search_keywords" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"inquiry_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "communication_type" NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variables" json DEFAULT '[]'::json,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "migrations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"product_type" "product_type" NOT NULL,
	"condition" "product_condition" NOT NULL,
	"status" "product_status" DEFAULT 'available' NOT NULL,
	"listing_type" "product_listing_type" DEFAULT 'sale' NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"sku" varchar(100),
	"weight" numeric(8, 3),
	"dimensions" jsonb,
	"color" varchar(50),
	"material" varchar(100),
	"quantity" integer DEFAULT 1 NOT NULL,
	"min_quantity" integer DEFAULT 1,
	"max_quantity" integer,
	"original_price" numeric(10, 2),
	"discount_percentage" numeric(5, 2),
	"shipping_weight" numeric(8, 3),
	"shipping_cost" numeric(10, 2),
	"free_shipping" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "products_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "real_estate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"property_type" "property_type" NOT NULL,
	"purpose" "listing_purpose" NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"floor_area" numeric(10, 2),
	"land_area" numeric(10, 2),
	"floors" integer,
	"building_name" varchar(255),
	"floor" integer,
	"unit_number" varchar(50),
	"year_built" integer,
	"price_per_sqm" numeric(10, 2),
	"maintenance_fee" numeric(10, 2),
	"deposit" numeric(10, 2),
	"furnished" boolean DEFAULT false,
	"pet_friendly" boolean DEFAULT false,
	"parking" boolean DEFAULT false,
	"balcony" boolean DEFAULT false,
	"garden" boolean DEFAULT false,
	"pool" boolean DEFAULT false,
	"gym" boolean DEFAULT false,
	"security" boolean DEFAULT false,
	"electricity" boolean DEFAULT true,
	"water" boolean DEFAULT true,
	"internet" boolean DEFAULT false,
	"air_conditioning" boolean DEFAULT false,
	"minimum_stay" integer,
	"maximum_stay" integer,
	"check_in_time" varchar(10),
	"check_out_time" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"amenities" jsonb DEFAULT '{}'::jsonb,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "real_estate_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255),
	"business_type" "provider_type" NOT NULL,
	"business_registration" varchar(100),
	"tax_id" varchar(50),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"website" varchar(255),
	"address" text,
	"city" varchar(100),
	"region" varchar(100),
	"country" varchar(100) DEFAULT 'Thailand',
	"zip_code" varchar(20),
	"verification_level" "verification_level" DEFAULT 'basic',
	"verification_status" "verification_status" DEFAULT 'pending',
	"verified_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"availability_status" "availability_status" DEFAULT 'available',
	"rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb,
	"working_hours" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "service_providers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"avatar" varchar(500),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending',
	"language" "language" DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"category" "vehicle_category" NOT NULL,
	"condition" "vehicle_condition" NOT NULL,
	"status" "vehicle_status" DEFAULT 'available' NOT NULL,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"color" varchar(50),
	"engine_size" numeric(5, 2),
	"fuel_type" "fuel_type",
	"transmission" "transmission_type",
	"mileage" integer,
	"air_conditioning" boolean DEFAULT false,
	"gps" boolean DEFAULT false,
	"bluetooth" boolean DEFAULT false,
	"usb_charging" boolean DEFAULT false,
	"registration_number" varchar(50),
	"insurance_valid" boolean DEFAULT false,
	"insurance_expiry" timestamp,
	"daily_rate" numeric(10, 2),
	"weekly_rate" numeric(10, 2),
	"monthly_rate" numeric(10, 2),
	"deposit" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "vehicles_listing_id_unique" UNIQUE("listing_id")
);
