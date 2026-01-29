-- Sampleton Borough Council Variation Template
-- Creates a proper variation template for Sampleton's Licensing Department
-- Modeled after Westminster Council's format (Section 34 Licensing Act 2003)
-- The NATURE_OF_VARIATION field is auto-generated from selected activities

-- ============================================================================
-- CREATE/UPDATE VARIATION TEMPLATE
-- ============================================================================

DO $$
DECLARE
  sampleton_dept_id UUID := '00000000-0000-0000-0001-000000000001';
  template_exists BOOLEAN;
BEGIN
  -- Check if Sampleton Licensing Department exists
  PERFORM 1 FROM public.departments WHERE id = sampleton_dept_id;
  IF NOT FOUND THEN
    RAISE NOTICE 'Sampleton Licensing Department not found. Skipping template creation.';
    RETURN;
  END IF;

  -- Check if variation template already exists
  SELECT EXISTS(
    SELECT 1 FROM public.templates
    WHERE department_id = sampleton_dept_id
    AND notice_type = 'licensing-premises-variation'
  ) INTO template_exists;

  IF template_exists THEN
    -- Update existing template
    UPDATE public.templates
    SET
      name = 'Sampleton Premises Licence Variation Notice',
      description = 'Standard template for premises licence variation applications under Section 34 Licensing Act 2003',
      template_text = 'LICENSING ACT 2003
NOTICE OF APPLICATION TO VARY A PREMISES LICENCE
Section 34

SAMPLETON BOROUGH COUNCIL
LICENSING AUTHORITY

Notice is hereby given that {{APPLICANT_NAME}} has applied to Sampleton Borough Council on {{APPLICATION_DATE}} to vary the premises licence for:

{{PREMISES_NAME}}
{{PREMISES_ADDRESS}}

THE PROPOSED VARIATION IS TO:
{{NATURE_OF_VARIATION}}

PROPOSED HOURS AFTER VARIATION:
{{ACTIVITY_SCHEDULE}}

The application and related documents can be inspected at:
Sampleton Borough Council
Licensing Department
Civic Centre, High Street
Sampleton, SM1 1AA

Inspection hours: Monday to Friday, 9:00 AM to 5:00 PM

Online: www.sampleton.gov.uk/licensing-register

REPRESENTATIONS:
Any person wishing to make representations concerning this application must do so in writing to the Licensing Authority by {{DEADLINE_DATE}}.

All representations should be submitted to:
Licensing Department
Sampleton Borough Council
PO Box 100
Sampleton
SM1 1ZZ

Email: licensing@sampleton.gov.uk

A copy of the representation must also be sent to the applicant or their representative.

It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine on the standard scale.

Sampleton Borough Council - Licensing Act 2003',
      updated_at = NOW()
    WHERE department_id = sampleton_dept_id
    AND notice_type = 'licensing-premises-variation';

    RAISE NOTICE 'Updated Sampleton Premises Licence Variation template';
  ELSE
    -- Create new template
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
      sampleton_dept_id,
      'Sampleton Premises Licence Variation Notice',
      'Standard template for premises licence variation applications under Section 34 Licensing Act 2003',
      'licensing-premises-variation',
      'LICENSING ACT 2003
NOTICE OF APPLICATION TO VARY A PREMISES LICENCE
Section 34

SAMPLETON BOROUGH COUNCIL
LICENSING AUTHORITY

Notice is hereby given that {{APPLICANT_NAME}} has applied to Sampleton Borough Council on {{APPLICATION_DATE}} to vary the premises licence for:

{{PREMISES_NAME}}
{{PREMISES_ADDRESS}}

THE PROPOSED VARIATION IS TO:
{{NATURE_OF_VARIATION}}

PROPOSED HOURS AFTER VARIATION:
{{ACTIVITY_SCHEDULE}}

The application and related documents can be inspected at:
Sampleton Borough Council
Licensing Department
Civic Centre, High Street
Sampleton, SM1 1AA

Inspection hours: Monday to Friday, 9:00 AM to 5:00 PM

Online: www.sampleton.gov.uk/licensing-register

REPRESENTATIONS:
Any person wishing to make representations concerning this application must do so in writing to the Licensing Authority by {{DEADLINE_DATE}}.

All representations should be submitted to:
Licensing Department
Sampleton Borough Council
PO Box 100
Sampleton
SM1 1ZZ

Email: licensing@sampleton.gov.uk

A copy of the representation must also be sent to the applicant or their representative.

It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine on the standard scale.

Sampleton Borough Council - Licensing Act 2003',
      '{}',
      TRUE,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created Sampleton Premises Licence Variation template';
  END IF;

  -- ============================================================================
  -- ALSO CREATE CLUB PREMISES CERTIFICATE VARIATION TEMPLATE
  -- ============================================================================

  SELECT EXISTS(
    SELECT 1 FROM public.templates
    WHERE department_id = sampleton_dept_id
    AND notice_type = 'licensing-club-variation'
  ) INTO template_exists;

  IF NOT template_exists THEN
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
      sampleton_dept_id,
      'Sampleton Club Premises Certificate Variation Notice',
      'Template for club premises certificate variation applications under Section 84 Licensing Act 2003',
      'licensing-club-variation',
      'LICENSING ACT 2003
NOTICE OF APPLICATION TO VARY A CLUB PREMISES CERTIFICATE
Section 84

SAMPLETON BOROUGH COUNCIL
LICENSING AUTHORITY

Notice is hereby given that {{APPLICANT_NAME}} has applied to Sampleton Borough Council on {{APPLICATION_DATE}} to vary the club premises certificate for:

{{PREMISES_NAME}}
{{PREMISES_ADDRESS}}

THE PROPOSED VARIATION IS TO:
{{NATURE_OF_VARIATION}}

PROPOSED HOURS/ACTIVITIES AFTER VARIATION:
{{ACTIVITY_SCHEDULE}}

The application and related documents can be inspected at:
Sampleton Borough Council
Licensing Department
Civic Centre, High Street
Sampleton, SM1 1AA

Inspection hours: Monday to Friday, 9:00 AM to 5:00 PM

Online: www.sampleton.gov.uk/licensing-register

REPRESENTATIONS:
Any person wishing to make representations concerning this application must do so in writing to the Licensing Authority by {{DEADLINE_DATE}}.

All representations should be submitted to:
Licensing Department
Sampleton Borough Council
PO Box 100
Sampleton
SM1 1ZZ

Email: licensing@sampleton.gov.uk

It is an offence to knowingly or recklessly make a false statement in connection with an application. The maximum fine is a level 5 fine.

Sampleton Borough Council - Licensing Act 2003',
      '{}',
      TRUE,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Created Sampleton Club Premises Certificate Variation template';
  END IF;

END $$;
