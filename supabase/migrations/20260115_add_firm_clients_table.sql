-- Create firm_clients table for storing law firm clients
CREATE TABLE IF NOT EXISTS public.firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  default_address TEXT,
  default_postcode TEXT,
  active BOOLEAN DEFAULT true,
  recent_premises TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_firm_clients_firm_id ON public.firm_clients(firm_id);
CREATE INDEX idx_firm_clients_active ON public.firm_clients(active);

-- Insert test clients for Wilson & Partners
INSERT INTO public.firm_clients (id, firm_id, name, company, email, phone, default_address, default_postcode, active, recent_premises) VALUES
  ('850e8400-e29b-41d4-c001-446655440001', '850e8400-e29b-41d4-f001-446655440001', 'The Red Lion Pub', 'Red Lion Holdings Ltd', 'manager@redlion.com', '020 1234 5678', '123 High Street', 'SW1A 1AA', true, ARRAY['The Red Lion', 'Red Lion Beer Garden']),
  ('850e8400-e29b-41d4-c001-446655440002', '850e8400-e29b-41d4-f001-446655440001', 'The Crown Hotel', 'Crown Holdings PLC', 'licensing@crownhotel.co.uk', '020 2345 6789', '456 Kings Road', 'SW10 2BB', true, ARRAY['The Crown Hotel', 'Crown Bar & Lounge']),
  ('850e8400-e29b-41d4-c001-446655440003', '850e8400-e29b-41d4-f001-446655440001', 'Blue Moon Restaurant', 'Blue Moon Dining Ltd', 'info@bluemoon.restaurant', '020 3456 7890', '789 Queens Avenue', 'W1D 3CC', true, ARRAY['Blue Moon Restaurant', 'Blue Moon Terrace']),
  ('850e8400-e29b-41d4-c001-446655440004', '850e8400-e29b-41d4-f001-446655440001', 'The White Hart Inn', 'White Hart Hospitality', 'manager@whitehart.pub', '020 4567 8901', '321 Victoria Street', 'SW1E 4DD', true, ARRAY['The White Hart Inn']),
  ('850e8400-e29b-41d4-c001-446655440005', '850e8400-e29b-41d4-f001-446655440001', 'Green Gardens Cafe', 'Green Gardens Ltd', 'hello@greengarden.cafe', '020 5678 9012', '654 Park Lane', 'W1K 5EE', true, ARRAY['Green Gardens Cafe', 'Garden Terrace']);

-- Add comment
COMMENT ON TABLE public.firm_clients IS 'Stores client information for law firms to enable quick publishing with pre-filled details';