-- Migration: Add Real Estate Tables
-- Description: Add specialized tables for real estate listings (Airbnb + Avito style)
-- Date: 2025-01-08

-- Create property type enum
CREATE TYPE property_type AS ENUM (
  'condo',
  'apartment', 
  'house',
  'villa',
  'townhouse',
  'studio',
  'penthouse',
  'duplex',
  'loft',
  'commercial',
  'office',
  'retail',
  'warehouse',
  'land',
  'building'
);

-- Create property status enum
CREATE TYPE property_status AS ENUM (
  'available',
  'rented', 
  'sold',
  'reserved',
  'under_contract',
  'off_market',
  'maintenance'
);

-- Create listing purpose enum
CREATE TYPE listing_purpose AS ENUM (
  'rent',
  'sale', 
  'short_term_rental',
  'long_term_rental',
  'both'
);

-- Create furnishing enum
CREATE TYPE furnishing AS ENUM (
  'unfurnished',
  'partially_furnished', 
  'fully_furnished',
  'luxury_furnished'
);

-- Create building type enum
CREATE TYPE building_type AS ENUM (
  'low_rise',
  'mid_rise', 
  'high_rise',
  'detached',
  'semi_detached',
  'terraced',
  'cluster'
);

-- Create view type enum
CREATE TYPE view_type AS ENUM (
  'city',
  'sea',
  'mountain',
  'garden',
  'pool',
  'river',
  'park',
  'golf',
  'no_view'
);

-- Create orientation enum
CREATE TYPE orientation AS ENUM (
  'north',
  'south',
  'east', 
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest'
);

-- Add real_estate category to existing listing_category enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_category') THEN
        CREATE TYPE listing_category AS ENUM (
          'accommodation',
          'real_estate',
          'transportation',
          'tours',
          'activities',
          'dining',
          'shopping',
          'services',
          'events',
          'vehicles',
          'products'
        );
    ELSE
        -- Add real_estate to existing enum if not present
        BEGIN
            ALTER TYPE listing_category ADD VALUE 'real_estate';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create real_estate table
CREATE TABLE real_estate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Property basics
  property_type property_type NOT NULL,
  property_status property_status NOT NULL DEFAULT 'available',
  listing_purpose listing_purpose NOT NULL,
  
  -- Physical characteristics
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL,
  area DECIMAL(8,2) NOT NULL,
  living_area DECIMAL(8,2),
  land_area DECIMAL(10,2),
  floor INTEGER,
  total_floors INTEGER,
  
  -- Building details
  building_type building_type,
  building_age INTEGER,
  year_built INTEGER,
  year_renovated INTEGER,
  
  -- Furnishing and condition
  furnishing furnishing NOT NULL DEFAULT 'unfurnished',
  condition VARCHAR(20) NOT NULL DEFAULT 'good',
  
  -- Views and orientation
  views JSONB DEFAULT '[]'::jsonb,
  orientation orientation,
  balconies INTEGER DEFAULT 0,
  terraces INTEGER DEFAULT 0,

  -- Pricing details
  price DECIMAL(12,2) NOT NULL,
  price_per_sqm DECIMAL(8,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  price_type price_type NOT NULL DEFAULT 'fixed',
  
  -- Rental specific pricing (Airbnb style)
  daily_rate DECIMAL(8,2),
  weekly_rate DECIMAL(8,2),
  monthly_rate DECIMAL(8,2),
  yearly_rate DECIMAL(10,2),
  
  -- Additional costs
  maintenance_fee DECIMAL(8,2),
  common_area_fee DECIMAL(8,2),
  security_deposit DECIMAL(10,2),
  cleaning_fee DECIMAL(6,2),
  
  -- Utilities
  electricity_included BOOLEAN DEFAULT FALSE,
  water_included BOOLEAN DEFAULT FALSE,
  internet_included BOOLEAN DEFAULT FALSE,
  cable_included BOOLEAN DEFAULT FALSE,
  gas_included BOOLEAN DEFAULT FALSE,

  -- Parking
  parking_spaces INTEGER DEFAULT 0,
  parking_type VARCHAR(20),
  parking_fee DECIMAL(6,2),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create property_amenities table
CREATE TABLE property_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_estate_id UUID NOT NULL REFERENCES real_estate(id) ON DELETE CASCADE,
  
  -- Building amenities
  has_elevator BOOLEAN DEFAULT FALSE,
  has_swimming_pool BOOLEAN DEFAULT FALSE,
  has_fitness_center BOOLEAN DEFAULT FALSE,
  has_sauna BOOLEAN DEFAULT FALSE,
  has_garden BOOLEAN DEFAULT FALSE,
  has_playground BOOLEAN DEFAULT FALSE,
  has_security BOOLEAN DEFAULT FALSE,
  has_cctv BOOLEAN DEFAULT FALSE,
  has_key_card BOOLEAN DEFAULT FALSE,
  has_reception BOOLEAN DEFAULT FALSE,
  has_concierge BOOLEAN DEFAULT FALSE,
  has_mailbox BOOLEAN DEFAULT FALSE,
  
  -- Unit amenities
  has_air_conditioning BOOLEAN DEFAULT FALSE,
  has_heating BOOLEAN DEFAULT FALSE,
  has_washing_machine BOOLEAN DEFAULT FALSE,
  has_dryer BOOLEAN DEFAULT FALSE,
  has_dishwasher BOOLEAN DEFAULT FALSE,
  has_microwave BOOLEAN DEFAULT FALSE,
  has_refrigerator BOOLEAN DEFAULT FALSE,
  has_oven BOOLEAN DEFAULT FALSE,
  has_balcony BOOLEAN DEFAULT FALSE,
  has_terrace BOOLEAN DEFAULT FALSE,
  has_fireplace BOOLEAN DEFAULT FALSE,
  has_storage BOOLEAN DEFAULT FALSE,
  
  -- Technology
  has_wifi BOOLEAN DEFAULT FALSE,
  has_cable_tv BOOLEAN DEFAULT FALSE,
  has_smart_tv BOOLEAN DEFAULT FALSE,
  has_intercom BOOLEAN DEFAULT FALSE,
  has_smart_home BOOLEAN DEFAULT FALSE,
  
  -- Accessibility
  is_wheelchair_accessible BOOLEAN DEFAULT FALSE,
  has_handicap_parking BOOLEAN DEFAULT FALSE,
  
  -- Pet policy
  pets_allowed BOOLEAN DEFAULT FALSE,
  cats_allowed BOOLEAN DEFAULT FALSE,
  dogs_allowed BOOLEAN DEFAULT FALSE,
  pet_deposit DECIMAL(8,2),
  
  -- Additional amenities (flexible)
  custom_amenities JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create property_rules table (Airbnb style)
CREATE TABLE property_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_estate_id UUID NOT NULL REFERENCES real_estate(id) ON DELETE CASCADE,
  
  -- Check-in/out rules (for short-term rentals)
  check_in_time VARCHAR(10),
  check_out_time VARCHAR(10),
  self_check_in BOOLEAN DEFAULT FALSE,
  keypad_entry BOOLEAN DEFAULT FALSE,
  
  -- Guest rules
  max_guests INTEGER,
  infants_allowed BOOLEAN DEFAULT TRUE,
  children_allowed BOOLEAN DEFAULT TRUE,
  events_allowed BOOLEAN DEFAULT FALSE,
  parties_allowed BOOLEAN DEFAULT FALSE,
  smoking_allowed BOOLEAN DEFAULT FALSE,
  
  -- Noise and behavior
  quiet_hours_start VARCHAR(10),
  quiet_hours_end VARCHAR(10),
  
  -- Cancellation policy
  cancellation_policy VARCHAR(20) DEFAULT 'moderate',
  
  -- House rules (free text)
  house_rules TEXT,
  additional_rules JSONB DEFAULT '[]'::jsonb,
  
  -- Safety features
  has_smoke_detector BOOLEAN DEFAULT FALSE,
  has_carbon_monoxide_detector BOOLEAN DEFAULT FALSE,
  has_fire_extinguisher BOOLEAN DEFAULT FALSE,
  has_first_aid_kit BOOLEAN DEFAULT FALSE,
  has_security_camera BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_real_estate_listing_id ON real_estate(listing_id);
CREATE INDEX idx_real_estate_property_type ON real_estate(property_type);
CREATE INDEX idx_real_estate_listing_purpose ON real_estate(listing_purpose);
CREATE INDEX idx_real_estate_price ON real_estate(price);
CREATE INDEX idx_real_estate_bedrooms ON real_estate(bedrooms);
CREATE INDEX idx_real_estate_bathrooms ON real_estate(bathrooms);
CREATE INDEX idx_real_estate_area ON real_estate(area);
CREATE INDEX idx_real_estate_furnishing ON real_estate(furnishing);
CREATE INDEX idx_real_estate_created_at ON real_estate(created_at);

CREATE INDEX idx_property_amenities_real_estate_id ON property_amenities(real_estate_id);
CREATE INDEX idx_property_amenities_swimming_pool ON property_amenities(has_swimming_pool);
CREATE INDEX idx_property_amenities_fitness_center ON property_amenities(has_fitness_center);
CREATE INDEX idx_property_amenities_elevator ON property_amenities(has_elevator);
CREATE INDEX idx_property_amenities_air_conditioning ON property_amenities(has_air_conditioning);
CREATE INDEX idx_property_amenities_wifi ON property_amenities(has_wifi);
CREATE INDEX idx_property_amenities_pets_allowed ON property_amenities(pets_allowed);

CREATE INDEX idx_property_rules_real_estate_id ON property_rules(real_estate_id);
CREATE INDEX idx_property_rules_max_guests ON property_rules(max_guests);

-- Add constraints
ALTER TABLE real_estate ADD CONSTRAINT chk_bedrooms_positive CHECK (bedrooms >= 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_bathrooms_positive CHECK (bathrooms >= 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_area_positive CHECK (area > 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_price_positive CHECK (price >= 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_balconies_positive CHECK (balconies >= 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_terraces_positive CHECK (terraces >= 0);
ALTER TABLE real_estate ADD CONSTRAINT chk_parking_spaces_positive CHECK (parking_spaces >= 0);

ALTER TABLE property_rules ADD CONSTRAINT chk_max_guests_positive CHECK (max_guests IS NULL OR max_guests > 0);

-- Add comments
COMMENT ON TABLE real_estate IS 'Real estate specific data for property listings (Airbnb + Avito style)';
COMMENT ON TABLE property_amenities IS 'Property amenities and features for real estate listings';
COMMENT ON TABLE property_rules IS 'Property rules and policies for short-term rentals (Airbnb style)';

COMMENT ON COLUMN real_estate.listing_purpose IS 'Purpose of listing: rent, sale, short_term_rental, long_term_rental, or both';
COMMENT ON COLUMN real_estate.daily_rate IS 'Daily rental rate for short-term rentals (Airbnb style)';
COMMENT ON COLUMN real_estate.views IS 'Array of view types (city, sea, mountain, etc.)';
COMMENT ON COLUMN property_rules.cancellation_policy IS 'Cancellation policy: flexible, moderate, or strict';
