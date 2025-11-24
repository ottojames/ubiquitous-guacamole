-- Add internal_notes JSONB column to representations table
-- This stores an array of comments from council officers

ALTER TABLE public.representations
ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.representations.internal_notes IS
'Array of internal comments from council officers. Each comment has: id, user_id, user_name, comment, created_at';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_representations_internal_notes ON public.representations USING gin(internal_notes);
