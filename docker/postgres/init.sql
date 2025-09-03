-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'agency', 'manager', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE listing_category AS ENUM ('bikes', 'cars', 'equipment');
CREATE TYPE listing_type AS ENUM ('rent', 'sale', 'both');
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE booking_type AS ENUM ('rent', 'purchase');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('ton', 'card');
CREATE TYPE message_role AS ENUM ('user', 'ai', 'manager', 'system');
CREATE TYPE conversation_status AS ENUM ('active', 'resolved', 'escalated', 'archived');
CREATE TYPE service_category AS ENUM ('delivery', 'emergency', 'maintenance', 'insurance');

-- CRM Types
CREATE TYPE customer_status AS ENUM ('lead', 'prospect', 'customer', 'inactive', 'blocked');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE lead_source AS ENUM ('website', 'telegram', 'whatsapp', 'email', 'referral', 'social_media', 'direct', 'advertising');
CREATE TYPE communication_channel AS ENUM ('email', 'telegram', 'whatsapp', 'sms', 'phone', 'in_app');
CREATE TYPE communication_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('draft', 'scheduled', 'sent', 'delivered', 'read', 'responded', 'failed', 'bounced');
CREATE TYPE campaign_type AS ENUM ('welcome', 'nurture', 'promotional', 'follow_up', 'reactivation', 'abandoned_cart');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- AI Types
CREATE TYPE ai_service_type AS ENUM ('chat', 'search', 'recommendation', 'voice', 'translation', 'content_analysis');
CREATE TYPE intent_type AS ENUM ('search', 'booking', 'support', 'information', 'complaint', 'price_inquiry', 'availability', 'general');

-- Create initial tables (basic structure)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    telegram_id VARCHAR(50),
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'user',
    profile JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Tables
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    telegram_id VARCHAR(50),
    whatsapp_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    preferred_channel communication_channel DEFAULT 'email',
    status customer_status DEFAULT 'lead',
    lead_score INTEGER DEFAULT 0,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    listing_id UUID,
    source lead_source NOT NULL,
    status lead_status DEFAULT 'new',
    priority lead_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    value DECIMAL(10,2),
    notes TEXT,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE communication_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    lead_id UUID REFERENCES leads(id),
    channel communication_channel NOT NULL,
    direction communication_direction NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    template_id UUID,
    campaign_id UUID,
    status message_status DEFAULT 'draft',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    channel communication_channel NOT NULL,
    language VARCHAR(10) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type campaign_type NOT NULL,
    status campaign_status DEFAULT 'draft',
    channels communication_channel[],
    target_segment JSONB,
    messages JSONB,
    triggers JSONB,
    schedule JSONB,
    analytics JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Service Tables
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    channel VARCHAR(50) DEFAULT 'web',
    status conversation_status DEFAULT 'active',
    assigned_manager_id UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'medium',
    tags TEXT[],
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type ai_service_type NOT NULL,
    user_id UUID REFERENCES users(id),
    request_data JSONB,
    response_data JSONB,
    processing_time INTEGER, -- milliseconds
    confidence DECIMAL(3,2),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- CRM Indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at);

CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_communication_history_customer_id ON communication_history(customer_id);
CREATE INDEX idx_communication_history_lead_id ON communication_history(lead_id);
CREATE INDEX idx_communication_history_channel ON communication_history(channel);
CREATE INDEX idx_communication_history_status ON communication_history(status);
CREATE INDEX idx_communication_history_created_at ON communication_history(created_at);

CREATE INDEX idx_message_templates_channel ON message_templates(channel);
CREATE INDEX idx_message_templates_language ON message_templates(language);
CREATE INDEX idx_message_templates_is_active ON message_templates(is_active);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- AI Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_manager_id ON conversations(assigned_manager_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_ai_analytics_service_type ON ai_analytics(service_type);
CREATE INDEX idx_ai_analytics_user_id ON ai_analytics(user_id);
CREATE INDEX idx_ai_analytics_created_at ON ai_analytics(created_at);
CREATE INDEX idx_ai_analytics_success ON ai_analytics(success);