-- Enable Row Level Security
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

-- Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT,
    status TEXT DEFAULT 'New',
    assigned_to TEXT,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Connectors Table
CREATE TABLE IF NOT EXISTS public.connectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_name TEXT NOT NULL,
    auth_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers
DROP TRIGGER IF EXISTS handle_leads_updated_at ON public.leads;
CREATE TRIGGER handle_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_connectors_updated_at ON public.connectors;
CREATE TRIGGER handle_connectors_updated_at
    BEFORE UPDATE ON public.connectors
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies (Open for now as per previous simple CRM setup, user can lock down later)
CREATE POLICY "Enable read access for all users" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.leads FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.connectors FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.connectors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.connectors FOR UPDATE USING (true);
