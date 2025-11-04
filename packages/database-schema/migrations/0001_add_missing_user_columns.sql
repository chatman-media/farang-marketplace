-- Add missing columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(500),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_client BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_rented_before BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS manager_communication_info TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create missing enums if they don't exist
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_platform AS ENUM ('telegram', 'whatsapp', 'email', 'phone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language AS ENUM ('en', 'ru', 'th', 'zh', 'de');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns with enum types
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS preferred_platform communication_platform DEFAULT 'telegram';

-- Update phone length to support international format
ALTER TABLE users 
  ALTER COLUMN phone TYPE VARCHAR(17);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username);
CREATE INDEX IF NOT EXISTS idx_users_is_client ON users(is_client);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Make telegram_id unique if not already
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_telegram_id_key;
  
ALTER TABLE users 
  ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);

-- Make phone unique if not already  
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_phone_key;
  
ALTER TABLE users 
  ADD CONSTRAINT users_phone_key UNIQUE (phone);
