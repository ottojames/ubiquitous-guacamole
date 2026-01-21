-- Add firm_id and client_id to notices table for Firm Portal integration
-- This links notices to the publishing firm and optionally to a client

-- Add columns if they don't exist
DO $$
BEGIN
  -- Add firm_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'firm_id'
  ) THEN
    ALTER TABLE public.notices
    ADD COLUMN firm_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;

  -- Add client_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.notices
    ADD COLUMN client_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notices_firm_id ON public.notices(firm_id);
CREATE INDEX IF NOT EXISTS idx_notices_client_id ON public.notices(client_id);
CREATE INDEX IF NOT EXISTS idx_notices_firm_client ON public.notices(firm_id, client_id);

-- Add comments
COMMENT ON COLUMN public.notices.firm_id IS 'The firm that published this notice (for Firm Portal users)';
COMMENT ON COLUMN public.notices.client_id IS 'The client this notice is for (optional, for Firm Portal users)';
