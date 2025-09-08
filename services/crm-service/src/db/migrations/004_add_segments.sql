-- Migration: Add customer segments table
-- Date: 2025-01-08

-- Customer segments table
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Array of segment criteria
  operator VARCHAR(3) NOT NULL DEFAULT 'AND', -- 'AND' or 'OR'
  is_active BOOLEAN DEFAULT true,
  customer_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_segments_name ON customer_segments(name);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_created_by ON customer_segments(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_segments_created_at ON customer_segments(created_at);

-- Customer segment memberships table (for caching segment results)
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, segment_id)
);

-- Indexes for segment memberships
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_id ON customer_segment_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment_id ON customer_segment_memberships(segment_id);



-- Insert some default segments
INSERT INTO customer_segments (name, description, criteria, operator, created_by) VALUES
(
  'High Value Customers',
  'Customers with lifetime value greater than $1000',
  '[{"field": "lifetimeValue", "operator": "greater_than", "value": 1000, "dataType": "number"}]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Active Leads',
  'Leads with high lead score and recent activity',
  '[
    {"field": "status", "operator": "equals", "value": "lead", "dataType": "enum"},
    {"field": "leadScore", "operator": "greater_than", "value": 70, "dataType": "number"},
    {"field": "lastInteractionAt", "operator": "days_ago", "value": 30, "dataType": "date"}
  ]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
),
(
  'VIP Customers',
  'Customers with VIP tag',
  '[{"field": "tags", "operator": "has_tag", "value": "vip", "dataType": "array"}]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Email Subscribers',
  'Customers who prefer email communication',
  '[{"field": "preferredChannel", "operator": "equals", "value": "email", "dataType": "enum"}]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Inactive Customers',
  'Customers with no interactions in the last 90 days',
  '[
    {"field": "status", "operator": "in", "value": ["customer", "prospect"], "dataType": "enum"},
    {"field": "lastInteractionAt", "operator": "date_before", "value": "90 days ago", "dataType": "date"}
  ]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
),
(
  'New Customers',
  'Customers created in the last 30 days',
  '[{"field": "createdAt", "operator": "days_ago", "value": 30, "dataType": "date"}]',
  'AND',
  '00000000-0000-0000-0000-000000000000'
);
