-- Create council_settings table for auto-populating publish wizard fields
CREATE TABLE IF NOT EXISTS public.council_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,

    -- Authority contact details
    authority_address TEXT NOT NULL,
    authority_email TEXT NOT NULL,
    authority_phone TEXT NOT NULL,
    online_register_url TEXT NOT NULL,

    -- Additional settings
    authority_name TEXT,
    licensing_manager_name TEXT,
    licensing_manager_email TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one setting per department
    UNIQUE(department_id)
);

-- Add RLS policies
ALTER TABLE public.council_settings ENABLE ROW LEVEL SECURITY;

-- Allow department members to read their settings
CREATE POLICY "Department members can read settings" ON public.council_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.department_members
            WHERE department_members.department_id = council_settings.department_id
            AND department_members.user_id = auth.uid()
        )
    );

-- Allow super admins to manage settings
CREATE POLICY "Super admins can manage settings" ON public.council_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.department_members
            WHERE department_members.department_id = council_settings.department_id
            AND department_members.user_id = auth.uid()
            AND department_members.role IN ('super_admin', 'admin')
        )
    );

-- Create indexes
CREATE INDEX idx_council_settings_department_id ON public.council_settings(department_id);

-- Add some default settings for existing departments
INSERT INTO public.council_settings (department_id, authority_address, authority_email, authority_phone, online_register_url, authority_name)
SELECT
    d.id,
    CASE
        WHEN o.name LIKE '%Westminster%' THEN '64 Victoria Street, London SW1E 6QP'
        WHEN o.name LIKE '%Sampletonborough%' THEN '1 Town Hall Square, Sampletonborough SB1 1AA'
        ELSE '1 Civic Centre, Council Street'
    END as authority_address,
    COALESCE(d.contact_email, 'licensing@council.gov.uk') as authority_email,
    CASE
        WHEN o.name LIKE '%Westminster%' THEN '020 7641 2500'
        WHEN o.name LIKE '%Sampletonborough%' THEN '01234 567890'
        ELSE '01234 567890'
    END as authority_phone,
    CASE
        WHEN o.name LIKE '%Westminster%' THEN 'https://www.westminster.gov.uk/licensing/register'
        WHEN o.name LIKE '%Sampletonborough%' THEN 'https://licensing.sampletonborough.gov.uk'
        ELSE 'https://council.gov.uk/licensing'
    END as online_register_url,
    o.name || ' - ' || d.name as authority_name
FROM public.departments d
INNER JOIN public.organizations o ON d.organization_id = o.id
WHERE d.type = 'licensing'
AND NOT EXISTS (
    SELECT 1 FROM public.council_settings cs
    WHERE cs.department_id = d.id
);

COMMENT ON TABLE public.council_settings IS 'Council department settings for auto-populating publish wizard fields';