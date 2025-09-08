-- CRM Service Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Link to platform user if exists
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  telegram_id VARCHAR(100),
  whatsapp_id VARCHAR(100),
  line_id VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(255),
  job_title VARCHAR(255),
  website VARCHAR(255),
  address JSONB, -- {street, city, state, country, postalCode}
  social_profiles JSONB, -- {facebook, instagram, linkedin, twitter, youtube, tiktok}
  source VARCHAR(50),
  timezone VARCHAR(50),
  preferred_language VARCHAR(10) DEFAULT 'en',
  preferred_channel VARCHAR(20) DEFAULT 'email',
  communication_preferences JSONB, -- {email, sms, telegram, whatsapp, line, phone, marketing, transactional, frequency, timezone}
  status VARCHAR(20) DEFAULT 'lead',
  lead_score INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tags
  custom_fields JSONB DEFAULT '{}',
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  lifetime_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  listing_id UUID, -- Reference to listing if applicable
  source VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to UUID, -- Reference to user who handles this lead
  value DECIMAL(10,2),
  property_interest TEXT,
  estimated_value DECIMAL(12,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  currency VARCHAR(3) DEFAULT 'THB',
  stage VARCHAR(50),
  campaign VARCHAR(100),
  medium VARCHAR(50),
  expected_close_date DATE,
  notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication history table
CREATE TABLE IF NOT EXISTS communication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound' or 'outbound'
  subject VARCHAR(255),
  content TEXT NOT NULL,
  template_id UUID,
  campaign_id UUID,
  status VARCHAR(20) DEFAULT 'sent',
  outcome VARCHAR(20), -- 'SUCCESSFUL', 'FAILED', 'NO_ANSWER', 'SCHEDULED_FOLLOWUP'
  next_action JSONB, -- {type, dueDate, assignedTo, description}
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  subject VARCHAR(255),
  content TEXT NOT NULL,
  variables TEXT[], -- Array of variable names
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  channels TEXT[] NOT NULL, -- Array of communication channels
  target_segment JSONB NOT NULL, -- Customer segment criteria
  triggers JSONB NOT NULL, -- Campaign triggers
  schedule JSONB, -- Campaign schedule if applicable
  contact_count INTEGER DEFAULT 0, -- Number of contacts in campaign
  analytics JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"responded":0,"unsubscribed":0,"bounced":0,"conversionRate":0}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign messages table
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  template_id UUID NOT NULL REFERENCES message_templates(id),
  delay_minutes INTEGER DEFAULT 0, -- Minutes after trigger
  conditions JSONB DEFAULT '[]', -- Message conditions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL, -- Automation trigger
  conditions JSONB DEFAULT '[]', -- Automation conditions
  actions JSONB NOT NULL, -- Automation actions
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_communication_customer_id ON communication_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_communication_lead_id ON communication_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_communication_channel ON communication_history(channel);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
