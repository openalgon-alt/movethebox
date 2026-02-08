-- MoveTheBox CRM Database Schema
-- Dialect: PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users Table
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'salesperson');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'salesperson',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Ensure columns exist if table already existed without them
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'salesperson';

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    incentive_pct DECIMAL(5, 2) DEFAULT 0.00,
    is_customizable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Leads Table
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Follow-up', 'Closed', 'Lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status lead_status NOT NULL DEFAULT 'New',
    source VARCHAR(100),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    next_follow_up_date DATE,
    last_contacted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

-- 5. Lead Line Items
CREATE TABLE IF NOT EXISTS lead_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sold_price DECIMAL(10, 2) NOT NULL,
    commission_amt DECIMAL(10, 2) NOT NULL,
    commission_pct DECIMAL(5, 2),
    is_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lead_line_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Activities
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('NOTE', 'STATUS_CHANGE', 'CALL', 'EMAIL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type activity_type NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. Tenant Settings
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    follow_up_config JSONB DEFAULT '{"defaultInterval": 3, "excludeWeekends": true, "enableDailyReminder": true}'::jsonb,
    modules_config JSONB DEFAULT '{"incentives": false, "products": false}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned ON leads(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_next_follow_up ON leads(tenant_id, next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_updated_at ON leads(tenant_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_items_tenant_lead ON lead_line_items(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_items_lead ON lead_line_items(lead_id);

-- RLS Policies (Examples - implementation depends on auth method)
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON leads USING (tenant_id = current_setting('app.current_tenant')::uuid);
