CREATE TYPE "public"."agency_status" AS ENUM('pending', 'active', 'suspended', 'inactive', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('available', 'busy', 'away', 'offline');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('accommodation', 'transportation', 'tour', 'activity', 'dining', 'event', 'service');--> statement-breakpoint
CREATE TYPE "public"."building_type" AS ENUM('low_rise', 'mid_rise', 'high_rise', 'detached', 'semi_detached', 'terraced', 'cluster');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cancellation_reason" AS ENUM('user_request', 'host_unavailable', 'payment_failed', 'policy_violation', 'force_majeure', 'system_error');--> statement-breakpoint
CREATE TYPE "public"."communication_platform" AS ENUM('telegram', 'whatsapp', 'phone', 'email', 'website', 'other');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('email', 'sms', 'call', 'whatsapp', 'line', 'telegram', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('individual', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'investigating', 'resolved', 'closed', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'lpg', 'cng');--> statement-breakpoint
CREATE TYPE "public"."furnishing" AS ENUM('unfurnished', 'partially_furnished', 'fully_furnished', 'luxury_furnished');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'th', 'ru', 'zh', 'ja');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('transportation', 'tours', 'services', 'vehicles', 'products');--> statement-breakpoint
CREATE TYPE "public"."listing_purpose" AS ENUM('rent', 'sale', 'short_term_rental', 'long_term_rental', 'both');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'inactive', 'sold', 'rented', 'reserved', 'maintenance', 'pending_approval', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('rental', 'service');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('incoming', 'outgoing', 'system', 'ai_generated');--> statement-breakpoint
CREATE TYPE "public"."orientation" AS ENUM('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('ton_wallet', 'ton_connect', 'jetton_usdt', 'jetton_usdc', 'stripe_card', 'promptpay');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('fixed', 'negotiable', 'auction', 'per_hour', 'per_day', 'per_week', 'per_month', 'per_year');--> statement-breakpoint
CREATE TYPE "public"."pricing_system" AS ENUM('calendar', 'seasonal');--> statement-breakpoint
CREATE TYPE "public"."product_condition" AS ENUM('new', 'like_new', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."product_listing_type" AS ENUM('rental', 'service');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('available', 'rented', 'reserved', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('home_appliances', 'kitchen_appliances', 'cleaning_equipment', 'audio_equipment', 'video_equipment', 'gaming_consoles', 'computers_laptops', 'mobile_devices', 'networking_equipment', 'power_tools', 'hand_tools', 'garden_tools', 'sports_equipment', 'outdoor_gear', 'water_sports', 'photography_equipment', 'musical_instruments', 'art_supplies', 'event_equipment', 'party_supplies', 'other');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'rented', 'sold', 'reserved', 'under_contract', 'off_market', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('condo', 'apartment', 'house', 'villa', 'townhouse', 'studio', 'penthouse', 'duplex', 'loft', 'commercial', 'office', 'retail', 'warehouse', 'land', 'building');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('individual', 'company', 'agency', 'freelancer');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."rental_status" AS ENUM('active', 'completed', 'cancelled', 'overdue', 'pending');--> statement-breakpoint
CREATE TYPE "public"."service_assignment_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_booking_type" AS ENUM('consultation', 'project', 'hourly', 'package', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund', 'fee', 'commission', 'withdrawal', 'deposit', 'confirmation');--> statement-breakpoint
CREATE TYPE "public"."transmission_type" AS ENUM('manual', 'automatic', 'cvt', 'semi_automatic');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'moderator', 'service_provider');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('economy', 'standard', 'premium', 'luxury', 'sport', 'electric', 'classic', 'rental');--> statement-breakpoint
CREATE TYPE "public"."vehicle_condition" AS ENUM('new', 'excellent', 'good', 'fair', 'poor', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'rented', 'maintenance', 'reserved', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('scooter', 'motorcycle', 'car', 'bicycle', 'boat', 'jet_ski', 'atv', 'truck', 'van', 'bus');--> statement-breakpoint
CREATE TYPE "public"."verification_level" AS ENUM('basic', 'verified', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."view_type" AS ENUM('city', 'sea', 'mountain', 'garden', 'pool', 'river', 'park', 'golf', 'no_view');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"website" varchar(255),
	"logo_url" varchar(500),
	"status" "agency_status" DEFAULT 'pending' NOT NULL,
	"owner_id" uuid NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "agency_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"category" "product_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"from_status" varchar(20),
	"to_status" varchar(20) NOT NULL,
	"reason" text,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
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
	"payment_status" "payment_status" DEFAULT 'pending',
	"payment_method" varchar(50),
	"payment_id" varchar(255),
	"special_requests" text,
	"host_notes" text,
	"guest_notes" text,
	"cancellation_reason" "cancellation_reason",
	"cancellation_date" timestamp with time zone,
	"cancellation_policy" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
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
	"contact_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb
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
CREATE TABLE "commission_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"outcome" varchar(50),
	"next_action" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "content_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"entity_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"content_text" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"language" varchar(10) DEFAULT 'en',
	"sentiment_score" numeric(3, 2),
	"sentiment_label" varchar(20),
	"sentiment_confidence" numeric(3, 2),
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"moderation_flagged" boolean DEFAULT false,
	"moderation_categories" jsonb DEFAULT '[]'::jsonb,
	"moderation_scores" jsonb DEFAULT '{}'::jsonb,
	"quality_score" numeric(3, 2),
	"quality_issues" jsonb DEFAULT '[]'::jsonb,
	"quality_suggestions" jsonb DEFAULT '[]'::jsonb,
	"processing_time" integer,
	"algorithm" varchar(100),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_segment_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_segment_memberships_customer_id_segment_id_unique" UNIQUE("customer_id","segment_id")
);
--> statement-breakpoint
CREATE TABLE "customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"operator" varchar(3) DEFAULT 'AND',
	"is_active" boolean DEFAULT true NOT NULL,
	"customer_count" integer DEFAULT 0,
	"last_calculated_at" timestamp,
	"created_by" uuid DEFAULT '00000000-0000-0000-0000-000000000000',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"status" varchar(20) DEFAULT 'lead',
	"lifetime_value" numeric(10, 2),
	"lead_score" integer DEFAULT 0,
	"last_interaction_at" timestamp,
	"preferred_channel" varchar(20) DEFAULT 'email',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"initiated_by" uuid NOT NULL,
	"dispute_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
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
	"type" varchar(50) NOT NULL,
	"category" varchar(100),
	"subject" varchar(500),
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "migrations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ml_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"version" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'training' NOT NULL,
	"accuracy" numeric(5, 4),
	"precision" numeric(5, 4),
	"recall" numeric(5, 4),
	"f1_score" numeric(5, 4),
	"training_samples" integer,
	"training_features" integer,
	"last_trained" timestamp,
	"hyperparameters" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_method" NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"last4" varchar(4),
	"brand" varchar(50),
	"exp_month" integer,
	"exp_year" integer,
	"wallet_address" varchar(255),
	"jetton_address" varchar(255),
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_payment_id" varchar(255),
	"provider_reference" varchar(255),
	"listing_id" uuid,
	"booking_id" uuid,
	"user_id" uuid,
	"blockchain_tx_hash" varchar(255),
	"blockchain_address" varchar(255),
	"jetton_address" varchar(255),
	"platform_fee" numeric(20, 8) DEFAULT '0',
	"processing_fee" numeric(20, 8) DEFAULT '0',
	"total_amount" numeric(20, 8) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"product_type" "product_type" NOT NULL,
	"subcategory" varchar(100),
	"condition" "product_condition" NOT NULL,
	"status" "product_status" DEFAULT 'available' NOT NULL,
	"listing_type" "product_listing_type" DEFAULT 'rental' NOT NULL,
	"brand" varchar(50),
	"model" varchar(100),
	"sku" varchar(100),
	"serial_number" varchar(100),
	"manufacturing_year" integer,
	"country_of_origin" varchar(50),
	"length" integer,
	"width" integer,
	"height" integer,
	"weight" integer,
	"volume" integer,
	"material" varchar(100),
	"size" varchar(50),
	"technical_specs" jsonb DEFAULT '{}'::jsonb,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"included" jsonb DEFAULT '[]'::jsonb,
	"requirements" jsonb DEFAULT '[]'::jsonb,
	"condition_notes" text,
	"defects" jsonb DEFAULT '[]'::jsonb,
	"repairs" jsonb DEFAULT '[]'::jsonb,
	"warranty_period" varchar(50),
	"warranty_type" varchar(20),
	"support_available" boolean DEFAULT false,
	"manual_included" boolean DEFAULT false,
	"price" numeric(12, 2) NOT NULL,
	"price_type" "price_type" NOT NULL,
	"original_price" numeric(12, 2),
	"msrp" numeric(12, 2),
	"rental_pricing" jsonb,
	"shipping_cost" numeric(8, 2),
	"handling_fee" numeric(8, 2),
	"installation_fee" numeric(8, 2),
	"accepted_payments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"installment_available" boolean DEFAULT false,
	"installment_options" jsonb DEFAULT '[]'::jsonb,
	"is_available" boolean DEFAULT true NOT NULL,
	"quantity" integer,
	"quantity_type" varchar(20) DEFAULT 'exact',
	"stock_level" varchar(20) DEFAULT 'in_stock',
	"restock_date" timestamp,
	"available_from" timestamp,
	"available_until" timestamp,
	"blackout_dates" jsonb DEFAULT '[]'::jsonb,
	"available_locations" jsonb DEFAULT '[]'::jsonb,
	"pickup_locations" jsonb DEFAULT '[]'::jsonb,
	"delivery_available" boolean DEFAULT false,
	"delivery_areas" jsonb DEFAULT '[]'::jsonb,
	"delivery_time" varchar(50),
	"seller_id" uuid NOT NULL,
	"seller_type" varchar(20) NOT NULL,
	"seller_name" varchar(100) NOT NULL,
	"seller_rating" numeric(3, 2),
	"seller_reviews" integer DEFAULT 0,
	"is_seller_verified" boolean DEFAULT false,
	"business_license" varchar(100),
	"tax_id" varchar(50),
	"contact_phone" varchar(20),
	"contact_email" varchar(100),
	"contact_website" varchar(200),
	"contact_address" text,
	"social_media" jsonb DEFAULT '{}'::jsonb,
	"business_hours" varchar(100),
	"languages" jsonb DEFAULT '[]'::jsonb,
	"response_time" varchar(50),
	"return_policy" text,
	"warranty_policy" text,
	"shipping_policy" text,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"payment_id" uuid NOT NULL,
	"transaction_id" uuid,
	"reason" text,
	"refund_type" varchar(50) NOT NULL,
	"provider_refund_id" varchar(255),
	"provider_reference" varchar(255),
	"blockchain_tx_hash" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"query" text NOT NULL,
	"type" varchar(20) DEFAULT 'text' NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"results_count" integer,
	"clicked_results" jsonb DEFAULT '[]'::jsonb,
	"processing_time" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_service_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"status" "service_assignment_status" DEFAULT 'active' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "training_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"logs" jsonb DEFAULT '[]'::jsonb,
	"error" text,
	"config" jsonb DEFAULT '{"epochs":100,"batchSize":32,"learningRate":0.001,"validationSplit":0.2}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" varchar(3) DEFAULT 'THB' NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_id" uuid,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"blockchain_tx_hash" varchar(255),
	"blockchain_address" varchar(255),
	"description" text,
	"reference" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_behaviors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"city" varchar(100),
	"country" varchar(100),
	"device_type" varchar(20),
	"device_os" varchar(50),
	"device_browser" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language" "language" DEFAULT 'en',
	"currency" varchar(3) DEFAULT 'USD',
	"timezone" varchar(50) DEFAULT 'UTC',
	"notifications" jsonb DEFAULT '{"email":true,"push":true,"sms":false,"telegram":false,"whatsapp":false,"line":false}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(17),
	"telegram_id" varchar(50),
	"telegram_username" varchar(100),
	"avatar" varchar(500),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending',
	"is_client" boolean DEFAULT false,
	"has_rented_before" boolean DEFAULT false,
	"preferred_platform" "communication_platform" DEFAULT 'telegram',
	"language" "language" DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"last_login_at" timestamp,
	"first_contact_date" timestamp,
	"last_contact_date" timestamp,
	"notes" text,
	"manager_communication_info" text,
	"profile" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
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
	"power" varchar(50),
	"engine_size" numeric(5, 2),
	"fuel_type" "fuel_type",
	"transmission" "transmission_type",
	"mileage" integer,
	"old_vehicle_number" varchar(50),
	"sticker" varchar(100),
	"rental_sticker" varchar(100),
	"gps_tracker_id" varchar(50),
	"gps_provider" varchar(50),
	"has_charger" boolean DEFAULT false,
	"has_helmet" boolean DEFAULT false,
	"has_lock" boolean DEFAULT false,
	"accessories" jsonb DEFAULT '[]'::jsonb,
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
	"pricing_system" "pricing_system" DEFAULT 'seasonal',
	"one_year_rent" numeric(10, 2),
	"six_month_high_season" numeric(10, 2),
	"six_month_low_season" numeric(10, 2),
	"days_1_3" numeric(10, 2),
	"days_4_7" numeric(10, 2),
	"days_7_14" numeric(10, 2),
	"days_15_25" numeric(10, 2),
	"december_price" numeric(10, 2),
	"january_price" numeric(10, 2),
	"february_price" numeric(10, 2),
	"march_price" numeric(10, 2),
	"april_price" numeric(10, 2),
	"may_price" numeric(10, 2),
	"summer_price" numeric(10, 2),
	"september_price" numeric(10, 2),
	"october_price" numeric(10, 2),
	"november_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_maintenance_update" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	CONSTRAINT "vehicles_listing_id_unique" UNIQUE("listing_id"),
	CONSTRAINT "vehicles_old_vehicle_number_unique" UNIQUE("old_vehicle_number")
);
--> statement-breakpoint
ALTER TABLE "availability_conflicts" ADD CONSTRAINT "availability_conflicts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_jobs" ADD CONSTRAINT "training_jobs_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "content_analysis_type_idx" ON "content_analysis" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_analysis_entity_id_idx" ON "content_analysis" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "content_analysis_timestamp_idx" ON "content_analysis" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "content_analysis_sentiment_score_idx" ON "content_analysis" USING btree ("sentiment_score");--> statement-breakpoint
CREATE INDEX "disputes_booking_id_idx" ON "disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disputes_initiated_by_idx" ON "disputes" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "ml_models_name_idx" ON "ml_models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ml_models_type_idx" ON "ml_models" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ml_models_status_idx" ON "ml_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ml_models_version_idx" ON "ml_models" USING btree ("version");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_methods_type_idx" ON "payment_methods" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_methods_is_default_idx" ON "payment_methods" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "payment_methods_provider_id_idx" ON "payment_methods" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_listing_id_idx" ON "payments" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_transaction_id_idx" ON "refunds" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refunds_created_at_idx" ON "refunds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_queries_user_id_idx" ON "search_queries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_queries_type_idx" ON "search_queries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "search_queries_timestamp_idx" ON "search_queries" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "search_queries_query_idx" ON "search_queries" USING btree ("query");--> statement-breakpoint
CREATE INDEX "service_bookings_booking_id_idx" ON "service_bookings" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "service_bookings_provider_id_idx" ON "service_bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "service_bookings_scheduled_date_idx" ON "service_bookings" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "service_bookings_service_type_idx" ON "service_bookings" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "training_jobs_model_id_idx" ON "training_jobs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "training_jobs_status_idx" ON "training_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_jobs_start_time_idx" ON "training_jobs" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "transactions_payment_id_idx" ON "transactions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "transactions_from_user_id_idx" ON "transactions" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "transactions_to_user_id_idx" ON "transactions" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_behaviors_user_id_idx" ON "user_behaviors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_behaviors_action_idx" ON "user_behaviors" USING btree ("action");--> statement-breakpoint
CREATE INDEX "user_behaviors_entity_type_idx" ON "user_behaviors" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "user_behaviors_entity_id_idx" ON "user_behaviors" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "user_behaviors_session_id_idx" ON "user_behaviors" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_behaviors_timestamp_idx" ON "user_behaviors" USING btree ("timestamp");