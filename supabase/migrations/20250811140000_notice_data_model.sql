-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Notices table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  applicant JSONB NOT NULL,
  premises JSONB,
  consultation JSONB,
  publication JSONB,
  extras JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notices_status_check'
  ) THEN
    ALTER TABLE public.notices
      ADD CONSTRAINT notices_status_check
      CHECK (status IN ('draft', 'submitted', 'published'));
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notices_updated_at ON public.notices;
CREATE TRIGGER set_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.set_notices_updated_at();

-- Notice templates table
CREATE TABLE IF NOT EXISTS public.notice_templates (
  key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  text_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, version)
);

-- Notice events table
CREATE TABLE IF NOT EXISTS public.notice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proofs table
CREATE TABLE IF NOT EXISTS public.proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  urn TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure JSONB columns exist for indexing
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS notice_type TEXT,
  ADD COLUMN IF NOT EXISTS applicant JSONB,
  ADD COLUMN IF NOT EXISTS premises JSONB,
  ADD COLUMN IF NOT EXISTS consultation JSONB,
  ADD COLUMN IF NOT EXISTS publication JSONB,
  ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '{}'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notices_updated_at ON public.notices (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_postcode ON public.notices ((premises->>'postcode'));
CREATE INDEX IF NOT EXISTS idx_notices_addr_tsv ON public.notices USING GIN (to_tsvector('english', coalesce(premises->>'address', '')));

-- Seed template rows
INSERT INTO public.notice_templates (key, version, label, text_template, html_template)
VALUES
  (
    'licensing_premises_new_v1',
    1,
    'Licensing Act 2003 - Premises Licence (New)',
    'LICENSING ACT 2003\nApplication for a Premises Licence\n\nNotice is hereby given that {{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} for a Premises Licence in respect of {{premisesName}}, {{premisesAddress}}.\n\nThe application seeks authorisation for the following licensable activities:\n{{licensableActivitiesList}}.\n\nProposed hours of operation are:\n{{activitiesHoursTable}}\n\nAlcohol will be supplied: {{alcoholOnOff}}.\nDesignated Premises Supervisor (DPS): {{dpsFullName}}, Personal Licence issued by {{dpsIssuingAuthority}}, No. {{dpsLicenceNo}}.\n\nRepresentations may be made in writing to {{licensingAuthorityAddress}} or by email to {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at {{inspectionAddressOrURL}} during normal office hours.\n\nIt is an offence under Section 158 of the Licensing Act 2003 to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is unlimited.\n\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application for a Premises Licence</h2>\n<p>Notice is hereby given that {{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} for a Premises Licence in respect of {{premisesName}}, {{premisesAddress}}.</p>\n<p>The application seeks authorisation for the following licensable activities:</p>\n<ul>{{licensableActivitiesItems}}</ul>\n<p>Proposed hours of operation are:</p>\n<ul>{{activitiesHoursItems}}</ul>\n<p>Alcohol will be supplied: {{alcoholOnOff}}.</p>\n<p>Designated Premises Supervisor (DPS): {{dpsFullName}}, Personal Licence issued by {{dpsIssuingAuthority}}, No. {{dpsLicenceNo}}.</p>\n<p>Representations may be made in writing to {{licensingAuthorityAddress}} or by email to {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at {{inspectionAddressOrURL}} during normal office hours.</p>\n<p>It is an offence under Section 158 of the Licensing Act 2003 to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is unlimited.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'licensing_premises_variation_v1',
    1,
    'Licensing Act 2003 - Premises Licence (Variation)',
    'LICENSING ACT 2003\nApplication to Vary a Premises Licence\n\n{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} to vary the Premises Licence for {{premisesName}}, {{premisesAddress}} as follows:\n\nProposed variation(s):\n{{variationSummary}}\n\nExisting permitted activities and hours remain unless varied above.\n\nRepresentations may be made in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. Inspection: {{inspectionAddressOrURL}} (office hours).\n\nOffence statement: as per Section 158 of the Licensing Act 2003.\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application to Vary a Premises Licence</h2>\n<p>{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} to vary the Premises Licence for {{premisesName}}, {{premisesAddress}} as follows:</p>\n<p>{{variationSummary}}</p>\n<p>Existing permitted activities and hours remain unless varied above.</p>\n<p>Representations may be made in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. Inspection: {{inspectionAddressOrURL}} (office hours).</p>\n<p>Offence statement: as per Section 158 of the Licensing Act 2003.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'licensing_premises_review_v1',
    1,
    'Licensing Act 2003 - Premises Licence (Review)',
    'LICENSING ACT 2003\nApplication for the Review of a Premises Licence\n\n{{applicantDisplayName}} has applied to {{licensingAuthorityName}} for a review of the premises licence for {{premisesName}}, {{premisesAddress}} on the grounds of:\n{{reviewGroundsSummary}}\n\nAny responsible authority or other person may make representations in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} by {{repsDeadline}}. Papers may be inspected at {{inspectionAddressOrURL}} during office hours.\n\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application for the Review of a Premises Licence</h2>\n<p>{{applicantDisplayName}} has applied to {{licensingAuthorityName}} for a review of the premises licence for {{premisesName}}, {{premisesAddress}} on the grounds of:</p>\n<p>{{reviewGroundsSummary}}</p>\n<p>Any responsible authority or other person may make representations in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} by {{repsDeadline}}. Papers may be inspected at {{inspectionAddressOrURL}} during office hours.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'licensing_club_new_v1',
    1,
    'Licensing Act 2003 - Club Premises Certificate (New)',
    'LICENSING ACT 2003\nApplication for a Club Premises Certificate\n\n{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} for a Club Premises Certificate at {{premisesName}}, {{premisesAddress}}.\n\nThe application seeks authorisation for the following qualifying club activities:\n{{licensableActivitiesList}}.\n\nProposed hours of operation are:\n{{activitiesHoursTable}}\n\nAdditional information: {{additionalNotes}}\n\nRepresentations may be made in writing to {{licensingAuthorityAddress}} or by email to {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at {{inspectionAddressOrURL}} during normal office hours.\n\nIt is an offence under Section 158 of the Licensing Act 2003 to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is unlimited.\n\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application for a Club Premises Certificate</h2>\n<p>{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} for a Club Premises Certificate at {{premisesName}}, {{premisesAddress}}.</p>\n<p>The application seeks authorisation for the following qualifying club activities:</p>\n<ul>{{licensableActivitiesItems}}</ul>\n<p>Proposed hours of operation are:</p>\n<ul>{{activitiesHoursItems}}</ul>\n<p>Additional information: {{additionalNotes}}</p>\n<p>Representations may be made in writing to {{licensingAuthorityAddress}} or by email to {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at {{inspectionAddressOrURL}} during normal office hours.</p>\n<p>It is an offence under Section 158 of the Licensing Act 2003 to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is unlimited.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'licensing_club_variation_v1',
    1,
    'Licensing Act 2003 - Club Premises Certificate (Variation)',
    'LICENSING ACT 2003\nApplication to Vary a Club Premises Certificate\n\n{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} to vary the Club Premises Certificate for {{premisesName}}, {{premisesAddress}} as follows:\n\nProposed variation(s):\n{{variationSummary}}\n\nExisting permitted club activities and hours remain unless varied above.\n\nRepresentations may be made in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. Inspection: {{inspectionAddressOrURL}} (office hours).\n\nOffence statement: as per Section 158 of the Licensing Act 2003.\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application to Vary a Club Premises Certificate</h2>\n<p>{{applicantDisplayName}} of {{applicantServiceAddress}} has applied to {{licensingAuthorityName}} to vary the Club Premises Certificate for {{premisesName}}, {{premisesAddress}} as follows:</p>\n<p>{{variationSummary}}</p>\n<p>Existing permitted club activities and hours remain unless varied above.</p>\n<p>Representations may be made in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. Inspection: {{inspectionAddressOrURL}} (office hours).</p>\n<p>Offence statement: as per Section 158 of the Licensing Act 2003.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'licensing_club_review_v1',
    1,
    'Licensing Act 2003 - Club Premises Certificate (Review)',
    'LICENSING ACT 2003\nApplication for the Review of a Club Premises Certificate\n\n{{applicantDisplayName}} has applied to {{licensingAuthorityName}} for a review of the Club Premises Certificate for {{premisesName}}, {{premisesAddress}} on the grounds of:\n{{reviewGroundsSummary}}\n\nAny responsible authority or other person may make representations in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} by {{repsDeadline}}. Papers may be inspected at {{inspectionAddressOrURL}} during office hours.\n\nDated: {{applicationDate}}.',
    '<h1>LICENSING ACT 2003</h1>\n<h2>Application for the Review of a Club Premises Certificate</h2>\n<p>{{applicantDisplayName}} has applied to {{licensingAuthorityName}} for a review of the Club Premises Certificate for {{premisesName}}, {{premisesAddress}} on the grounds of:</p>\n<p>{{reviewGroundsSummary}}</p>\n<p>Any responsible authority or other person may make representations in writing to {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} by {{repsDeadline}}. Papers may be inspected at {{inspectionAddressOrURL}} during office hours.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'gambling_premises_generic_v1',
    1,
    'Gambling Act 2005 - Premises Notice',
    'GAMBLING ACT 2005\nNotice of Application for a Premises Licence\n\n{{applicantDisplayName}} of {{applicantAddress}} has applied to {{licensingAuthorityName}} for a {{applicationVariant}} of a {{premisesType}} premises licence at {{premisesName}}, {{premisesAddress}}.\n\nThe application seeks authorisation for the following:\n{{gamblingActivitiesList}}.\n\nRepresentations may be made in writing to the Licensing Authority at {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at the offices of the Licensing Authority during normal working hours.\n\nDated: {{applicationDate}}.',
    '<h1>GAMBLING ACT 2005</h1>\n<h2>Notice of Application for a Premises Licence</h2>\n<p>{{applicantDisplayName}} of {{applicantAddress}} has applied to {{licensingAuthorityName}} for a {{applicationVariant}} of a {{premisesType}} premises licence at {{premisesName}}, {{premisesAddress}}.</p>\n<p>The application seeks authorisation for the following:</p>\n<ul>{{gamblingActivitiesItems}}</ul>\n<p>Representations may be made in writing to the Licensing Authority at {{licensingAuthorityAddress}} or {{licensingAuthorityEmail}} no later than {{repsDeadline}}. The application may be inspected at the offices of the Licensing Authority during normal working hours.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'gvol_operating_centre_v1',
    1,
    'Goods Vehicle Operating Centre Notice',
    'GOODS VEHICLE OPERATOR’S LICENCE\n\n{{applicantLegalName}} of {{applicantServiceAddress}} is applying to the Traffic Commissioner for {{trafficArea}} for a {{applicationType}} of an Operator’s Licence at {{operatingCentreAddress}} to keep:\n{{vehicleTrailerLine}}\n\nOwners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations in writing to: {{trafficAreaAddress}}, by {{repsDeadline}}.\n\nA copy of the representations must at the same time be sent to {{applicantLegalName}} at the address given above.\n\nDated: {{applicationDate}}.',
    '<h1>GOODS VEHICLE OPERATOR’S LICENCE</h1>\n<p>{{applicantLegalName}} of {{applicantServiceAddress}} is applying to the Traffic Commissioner for {{trafficArea}} for a {{applicationType}} of an Operator’s Licence at {{operatingCentreAddress}} to keep:</p>\n<ul><li>{{vehicleTrailerLine}}</li></ul>\n<p>Owners or occupiers of land (including buildings) near the operating centre who believe that their use or enjoyment of that land would be affected may make representations in writing to: {{trafficAreaAddress}}, by {{repsDeadline}}.</p>\n<p>A copy of the representations must at the same time be sent to {{applicantLegalName}} at the address given above.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'planning_press_notice_v1',
    1,
    'Planning Press Notice',
    'TOWN AND COUNTRY PLANNING ACTS\n\n{{lpaName}} has received the following application:\nReference: {{applicationRef}}. Site: {{siteAddress}}.\nProposal: {{proposal}}.\nReason for press notice: {{triggerList}}.\n\nThe application and plans may be inspected at {{inspectionAddressOrURL}} during normal office hours.\n\nRepresentations must be submitted by {{repsDeadline}} via {{lpaPortalURL}} or in writing to {{lpaAddress}}.\n\nDated: {{applicationDate}}.',
    '<h1>TOWN AND COUNTRY PLANNING ACTS</h1>\n<p>{{lpaName}} has received the following application:</p>\n<p>Reference: {{applicationRef}}. Site: {{siteAddress}}.</p>\n<p>Proposal: {{proposal}}.</p>\n<p>Reason for press notice:</p>\n<ul>{{triggerItems}}</ul>\n<p>The application and plans may be inspected at {{inspectionAddressOrURL}} during normal office hours.</p>\n<p>Representations must be submitted by {{repsDeadline}} via {{lpaPortalURL}} or in writing to {{lpaAddress}}.</p>\n<p>Dated: {{applicationDate}}.</p>'
  ),
  (
    'probate_trustee_s27_v1',
    1,
    'Probate Trustee Act s.27 Notice',
    'TRUSTEE ACT 1925, SECTION 27\nNOTICE TO CREDITORS AND OTHERS\n\nRe: {{deceasedFullName}} (deceased), late of {{lastAddress}}, who died on {{dateOfDeath}}.\n\nCreditors and others having claims against or an interest in the estate of the above named are required to send particulars in writing to {{solicitorOrPRName}} of {{solicitorOrPRAddress}} on or before {{claimsDeadline}}, after which the estate may be distributed having regard only to the claims of which notice has been received.\n\nDated: {{applicationDate}}.',
    '<h1>TRUSTEE ACT 1925, SECTION 27</h1>\n<h2>NOTICE TO CREDITORS AND OTHERS</h2>\n<p>Re: {{deceasedFullName}} (deceased), late of {{lastAddress}}, who died on {{dateOfDeath}}.</p>\n<p>Creditors and others having claims against or an interest in the estate of the above named are required to send particulars in writing to {{solicitorOrPRName}} of {{solicitorOrPRAddress}} on or before {{claimsDeadline}}, after which the estate may be distributed having regard only to the claims of which notice has been received.</p>\n<p>Dated: {{applicationDate}}.</p>'
  )
ON CONFLICT (key, version) DO UPDATE SET
  label = EXCLUDED.label,
  text_template = EXCLUDED.text_template,
  html_template = EXCLUDED.html_template;
