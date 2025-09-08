-- Migration: Add message templates table
-- Created: 2025-01-08
-- Description: Create table for storing message templates used in automation

-- Drop existing message_templates table if it exists (from old schema)
DROP TABLE IF EXISTS message_templates CASCADE;

-- Message templates table
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'email', 'telegram', 'whatsapp', 'line', 'universal'
  category VARCHAR(100), -- 'welcome', 'follow_up', 'reminder', 'promotion', etc.
  subject VARCHAR(500), -- For email templates
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Array of variable names used in template
  conditions JSONB DEFAULT '{}', -- Conditions for when to use this template
  is_active BOOLEAN DEFAULT true,
  created_by UUID, -- Reference to user who created template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_message_templates_type ON message_templates(type);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_active ON message_templates(is_active);

-- Insert default templates
INSERT INTO message_templates (name, type, category, subject, content, variables, conditions) VALUES
(
  'welcome_email',
  'email',
  'welcome',
  'Welcome to Thailand Marketplace, {{firstName}}!',
  'Dear {{firstName}} {{lastName}},

Welcome to Thailand Marketplace! We''re excited to have you join our community.

{{#if company}}
We see you''re from {{company}}. We have special offers for business clients that might interest you.
{{/if}}

Here''s what you can do next:
- Browse our latest properties: {{websiteUrl}}/properties
- Set up your preferences: {{websiteUrl}}/profile
- Contact our team: {{supportEmail}}

{{#if source}}
Thank you for joining us through {{source}}.
{{/if}}

Best regards,
Thailand Marketplace Team',
  '["firstName", "lastName", "company", "websiteUrl", "supportEmail", "source"]',
  '{"triggers": ["new_customer", "registration_complete"]}'
),
(
  'follow_up_telegram',
  'telegram',
  'follow_up',
  null,
  'Hi {{firstName}}! 👋

Thanks for your interest in our properties. Have you had a chance to review the listings we sent you?

{{#if lastViewedProperty}}
I noticed you viewed {{lastViewedProperty}}. Would you like more information about similar properties?
{{/if}}

Feel free to ask any questions! I''m here to help. 😊',
  '["firstName", "lastViewedProperty"]',
  '{"triggers": ["lead_follow_up"], "conditions": {"daysSinceLastContact": {"$gte": 3}}}'
),
(
  'appointment_reminder',
  'universal',
  'reminder',
  'Appointment Reminder - {{appointmentDate}}',
  'Hi {{firstName}},

This is a friendly reminder about your upcoming appointment:

📅 Date: {{appointmentDate}}
🕐 Time: {{appointmentTime}}
📍 Location: {{appointmentLocation}}
👤 With: {{agentName}}

{{#if appointmentType}}
Type: {{appointmentType}}
{{/if}}

{{#if propertyAddress}}
Property: {{propertyAddress}}
{{/if}}

Please let us know if you need to reschedule.

Best regards,
{{agentName}}',
  '["firstName", "appointmentDate", "appointmentTime", "appointmentLocation", "agentName", "appointmentType", "propertyAddress"]',
  '{"triggers": ["appointment_scheduled"], "conditions": {"hoursBeforeAppointment": 24}}'
);
