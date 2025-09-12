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
ALTER TABLE "customer_segments" ADD COLUMN "operator" varchar(3) DEFAULT 'AND';--> statement-breakpoint
ALTER TABLE "customer_segments" ADD COLUMN "customer_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customer_segments" ADD COLUMN "last_calculated_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_segments" ADD COLUMN "created_by" uuid DEFAULT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "status" varchar(20) DEFAULT 'lead';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "lifetime_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "lead_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "last_interaction_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_channel" varchar(20) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "product_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."product_type";--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('home_appliances', 'kitchen_appliances', 'cleaning_equipment', 'audio_equipment', 'video_equipment', 'gaming_consoles', 'computers_laptops', 'mobile_devices', 'networking_equipment', 'power_tools', 'hand_tools', 'garden_tools', 'sports_equipment', 'outdoor_gear', 'water_sports', 'photography_equipment', 'musical_instruments', 'art_supplies', 'event_equipment', 'party_supplies', 'other');--> statement-breakpoint
ALTER TABLE "public"."products" ALTER COLUMN "product_type" SET DATA TYPE "public"."product_type" USING "product_type"::"public"."product_type";--> statement-breakpoint
DROP TYPE "public"."listing_purpose";--> statement-breakpoint
DROP TYPE "public"."property_status";--> statement-breakpoint
DROP TYPE "public"."property_type";