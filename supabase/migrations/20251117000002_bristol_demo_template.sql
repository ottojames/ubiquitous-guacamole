-- Bristol Council Demo Template
-- Creates a sample custom template for Bristol City Council Licensing Department
-- This demonstrates the template text feature for the Thursday demo

-- ============================================================================
-- FIND OR CREATE BRISTOL CITY COUNCIL ORGANIZATION
-- ============================================================================

DO $$
DECLARE
  bristol_org_id UUID;
  bristol_dept_id UUID;
BEGIN
  -- Find or create Bristol City Council organization
  SELECT id INTO bristol_org_id
  FROM public.organizations
  WHERE slug = 'bristol-city-council'
  LIMIT 1;

  IF bristol_org_id IS NULL THEN
    -- Create organization
    INSERT INTO public.organizations (
      name,
      slug,
      type,
      email,
      created_at,
      updated_at
    ) VALUES (
      'Bristol City Council',
      'bristol-city-council',
      'council',
      'info@bristol.gov.uk',
      NOW(),
      NOW()
    )
    RETURNING id INTO bristol_org_id;

    RAISE NOTICE 'Created Bristol City Council organization: %', bristol_org_id;
  ELSE
    RAISE NOTICE 'Found existing Bristol City Council organization: %', bristol_org_id;
  END IF;

  -- Find or create Licensing Department
  SELECT id INTO bristol_dept_id
  FROM public.departments
  WHERE organization_id = bristol_org_id
    AND slug = 'licensing'
  LIMIT 1;

  IF bristol_dept_id IS NULL THEN
    -- Create licensing department
    INSERT INTO public.departments (
      organization_id,
      name,
      slug,
      type,
      email,
      created_at,
      updated_at
    ) VALUES (
      bristol_org_id,
      'Licensing',
      'licensing',
      'licensing',
      'licensing@bristol.gov.uk',
      NOW(),
      NOW()
    )
    RETURNING id INTO bristol_dept_id;

    RAISE NOTICE 'Created Bristol Licensing Department: %', bristol_dept_id;
  ELSE
    RAISE NOTICE 'Found existing Bristol Licensing Department: %', bristol_dept_id;
  END IF;

  -- ============================================================================
  -- CREATE SAMPLE TEMPLATE: NEW PREMISES LICENCE
  -- ============================================================================

  -- Delete existing template if it exists (for idempotency)
  DELETE FROM public.templates
  WHERE department_id = bristol_dept_id
    AND name = 'Bristol Standard Premises Licence Notice';

  -- Insert the custom template
  INSERT INTO public.templates (
    department_id,
    name,
    description,
    notice_type,
    template_text,
    default_values,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    bristol_dept_id,
    'Bristol Standard Premises Licence Notice',
    'Standard template for new premises licence applications in Bristol',
    'licensing-premises-new',
    'LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

BRISTOL CITY COUNCIL - LICENSING AUTHORITY

Notice is hereby given that {{APPLICANT_NAME}} has applied to Bristol City Council for a premises licence under the Licensing Act 2003 for:

{{PREMISES_NAME}}
{{PREMISES_ADDRESS}}

LICENSABLE ACTIVITIES APPLIED FOR:
{{LICENSABLE_ACTIVITIES}}

PROPOSED OPERATING SCHEDULE:
{{ACTIVITY_SCHEDULE}}

The application may be inspected at:
Bristol City Council Licensing Office
100 Temple Street
Bristol
BS1 6AG

Opening hours: Monday to Friday, 9:00 AM to 5:00 PM
Or online at: www.bristol.gov.uk/licensing

REPRESENTATIONS:
Any person wishing to make a representation concerning this application must do so in writing by {{DEADLINE_DATE}}.

Representations should be sent to:
Licensing Team
Bristol City Council
PO Box 3399
Bristol
BS1 9NE

Email: licensing@bristol.gov.uk

A copy of the representation must also be sent to the applicant or their representative.

Please note: It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine on the standard scale.

For guidance on making representations, please visit www.bristol.gov.uk/licensing or contact the Licensing Team on 0117 922 2500.

Bristol City Council Licensing Department
Published: {{PUBLICATION_DATE}}',
    '{}',
    TRUE,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created Bristol Standard Premises Licence template';

  -- ============================================================================
  -- CREATE SAMPLE TEMPLATE: PREMISES LICENCE VARIATION
  -- ============================================================================

  -- Delete existing template if it exists
  DELETE FROM public.templates
  WHERE department_id = bristol_dept_id
    AND name = 'Bristol Premises Licence Variation Notice';

  INSERT INTO public.templates (
    department_id,
    name,
    description,
    notice_type,
    template_text,
    default_values,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    bristol_dept_id,
    'Bristol Premises Licence Variation Notice',
    'Template for premises licence variation applications',
    'licensing-premises-variation',
    'LICENSING ACT 2003
APPLICATION TO VARY A PREMISES LICENCE

{{APPLICANT_NAME}} has applied to Bristol City Council to vary the premises licence for:

{{PREMISES_NAME}}
{{PREMISES_ADDRESS}}

NATURE OF THE VARIATION:
{{NATURE_OF_VARIATION}}

PROPOSED ACTIVITIES AND HOURS AFTER VARIATION:
{{ACTIVITY_SCHEDULE}}

The application documents can be inspected at Bristol City Council Licensing Office, 100 Temple Street, Bristol, BS1 6AG during normal office hours (Monday-Friday, 9:00 AM - 5:00 PM) or online at www.bristol.gov.uk/licensing.

REPRESENTATIONS DEADLINE: {{DEADLINE_DATE}}

Representations must be made in writing to:
Licensing Team, Bristol City Council, PO Box 3399, Bristol, BS1 9NE
Email: licensing@bristol.gov.uk

Representors must also serve a copy of their representation on the applicant.

It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine on summary conviction is a level 5 fine.

Bristol City Council - Licensing Act 2003',
    '{}',
    TRUE,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created Bristol Premises Licence Variation template';

  -- ============================================================================
  -- VALIDATION REPORT
  -- ============================================================================

  -- Show validation status of created templates
  RAISE NOTICE '=== TEMPLATE VALIDATION REPORT ===';

  FOR rec IN
    SELECT
      t.name,
      t.notice_type,
      t.is_validated,
      array_length(t.placeholders, 1) as placeholder_count,
      array_length(t.required_placeholders, 1) as required_count,
      array_length(t.validation_warnings, 1) as warning_count
    FROM public.templates t
    WHERE t.department_id = bristol_dept_id
  LOOP
    RAISE NOTICE 'Template: %', rec.name;
    RAISE NOTICE '  Notice Type: %', rec.notice_type;
    RAISE NOTICE '  Validated: %', rec.is_validated;
    RAISE NOTICE '  Placeholders: %', COALESCE(rec.placeholder_count, 0);
    RAISE NOTICE '  Required: %', COALESCE(rec.required_count, 0);
    RAISE NOTICE '  Warnings: %', COALESCE(rec.warning_count, 0);
  END LOOP;

END $$;
