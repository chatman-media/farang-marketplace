-- Migration: Add user preferences support
-- This migration adds support for user preferences including language, currency, timezone, and notification settings

-- Update the profile JSONB column to include preferences
-- Since we're using JSONB, we don't need to alter the table structure
-- The preferences will be stored as part of the profile JSON object

-- Add a comment to document the new structure
COMMENT ON COLUMN users.profile IS 'User profile data including preferences for language, currency, timezone, and notification channels (email, push, sms, telegram, whatsapp, line)';

-- Create an index on preferences language for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_language ON users ((profile->'preferences'->>'language'));

-- Create an index on preferences currency for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_currency ON users ((profile->'preferences'->>'currency'));

-- Create an index on notification preferences for better query performance
CREATE INDEX IF NOT EXISTS idx_users_profile_notifications ON users USING GIN ((profile->'preferences'->'notifications'));

-- Update existing users to have default preferences if they don't exist
UPDATE users 
SET profile = jsonb_set(
  profile, 
  '{preferences}', 
  '{
    "language": "en",
    "currency": "USD", 
    "notifications": {
      "email": true,
      "push": true,
      "sms": false,
      "telegram": false,
      "whatsapp": false,
      "line": false
    }
  }'::jsonb
)
WHERE profile->'preferences' IS NULL;

-- Add a check constraint to ensure language is valid
ALTER TABLE users ADD CONSTRAINT check_valid_language 
CHECK (
  profile->'preferences'->>'language' IS NULL OR 
  profile->'preferences'->>'language' IN ('en', 'ru', 'th', 'cn', 'ar')
);

-- Add a check constraint to ensure currency is valid format (3 characters)
ALTER TABLE users ADD CONSTRAINT check_valid_currency 
CHECK (
  profile->'preferences'->>'currency' IS NULL OR 
  length(profile->'preferences'->>'currency') = 3
);
