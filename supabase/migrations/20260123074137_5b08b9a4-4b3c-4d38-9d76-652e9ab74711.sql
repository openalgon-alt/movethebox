-- Create leads table for the CRM
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Follow-up', 'Closed', 'Lost')),
  assigned_to TEXT,
  next_follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for this simple CRM)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on leads" 
ON public.leads 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Allow public insert access on leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Allow public update access on leads" 
ON public.leads 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Allow public delete access on leads" 
ON public.leads 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up_date);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);