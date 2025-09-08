-- Migration: Add automation fields to communication_history and campaigns
-- Date: 2024-12-08

-- Add outcome and next_action fields to communication_history
ALTER TABLE communication_history 
ADD COLUMN IF NOT EXISTS outcome VARCHAR(20),
ADD COLUMN IF NOT EXISTS next_action JSONB;

-- Add contact_count field to campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- Create index for outcome field
CREATE INDEX IF NOT EXISTS idx_communication_outcome ON communication_history(outcome);

-- Update existing campaigns to calculate contact_count
-- This is a placeholder - in real implementation you would calculate based on target_segment
UPDATE campaigns SET contact_count = 0 WHERE contact_count IS NULL;

-- Add comments for new fields
COMMENT ON COLUMN communication_history.outcome IS 'Interaction outcome: SUCCESSFUL, FAILED, NO_ANSWER, SCHEDULED_FOLLOWUP';
COMMENT ON COLUMN communication_history.next_action IS 'JSON object with next action details: {type, dueDate, assignedTo, description}';
COMMENT ON COLUMN campaigns.contact_count IS 'Number of contacts targeted by this campaign';
