-- Create representations (objections/comments) table for published notices
-- This allows the public to submit feedback on published licensing applications

CREATE TABLE IF NOT EXISTS public.representations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notice_id BIGINT NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,

  -- Respondent details (anonymous/public submissions allowed)
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_type TEXT NOT NULL CHECK (respondent_type IN ('resident', 'business', 'organization', 'other')),
  respondent_address TEXT,

  -- Representation content
  representation_type TEXT NOT NULL DEFAULT 'objection' CHECK (representation_type IN ('objection', 'support', 'comment')),
  comments TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'acknowledged')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  council_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_representations_notice_id ON public.representations(notice_id);
CREATE INDEX IF NOT EXISTS idx_representations_status ON public.representations(status);
CREATE INDEX IF NOT EXISTS idx_representations_created_at ON public.representations(created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_representations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_representations_updated_at ON public.representations;
CREATE TRIGGER set_representations_updated_at
BEFORE UPDATE ON public.representations
FOR EACH ROW
EXECUTE FUNCTION public.set_representations_updated_at();

-- Enable RLS
ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.representations TO anon, authenticated;
GRANT INSERT ON public.representations TO anon, authenticated;
GRANT UPDATE ON public.representations TO authenticated;

-- RLS Policies

-- 1. Public can view all representations on published notices
CREATE POLICY "Public can view representations on published notices"
ON public.representations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = representations.notice_id
      AND n.status = 'published'
  )
);

-- 2. Anyone (including anonymous) can submit representations on published notices
CREATE POLICY "Anyone can submit representations on published notices"
ON public.representations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = representations.notice_id
      AND n.status = 'published'
      AND n.reps_deadline >= CURRENT_DATE
  )
);

-- 3. Council members can update representations for their notices
CREATE POLICY "Councils can manage representations for their notices"
ON public.representations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = representations.notice_id
      AND auth.jwt()->>'council_id' = n.council_id::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.id = representations.notice_id
      AND auth.jwt()->>'council_id' = n.council_id::text
  )
);

COMMENT ON TABLE public.representations IS
'Public representations (objections/support/comments) submitted for published notices';

COMMENT ON COLUMN public.representations.respondent_type IS
'Type of respondent: resident, business, organization, or other';

COMMENT ON COLUMN public.representations.representation_type IS
'Type of representation: objection (against), support (for), or general comment';

COMMENT ON COLUMN public.representations.status IS
'Processing status: new (not yet reviewed), reviewed (seen by council), acknowledged (formal response sent)';
