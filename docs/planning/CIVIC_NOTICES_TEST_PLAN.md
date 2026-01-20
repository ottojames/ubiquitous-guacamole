# Civic Notices Platform — Comprehensive Test Plan

**Document Version**: 1.0
**Date**: 4 November 2025
**Target Audience**: QA Engineers, Developers, Legal Counsel
**Status**: Production-Ready Testing Strategy

---

## Executive Summary

### Purpose

This test plan provides comprehensive testing strategy for validating all 32 statutory compliance fixes and enhancements to the Civic Notices Platform. It ensures that every change meets both technical quality standards and regulatory compliance requirements.

### Testing Approach

**Multi-Layered Testing Strategy**:
1. **Unit Tests** - Validate individual components (templates, schemas, functions)
2. **Integration Tests** - Validate component interactions (schema → template pipeline)
3. **End-to-End Tests** - Validate complete user journeys (wizard flow)
4. **Regulatory Validation** - Manual checklists for statutory compliance
5. **Performance Tests** - Ensure no degradation from changes
6. **Security Tests** - Verify data protection and access control

### Success Criteria

**For Production Launch**:
- 100% of CRITICAL issue fixes validated
- 100% of HIGH priority features validated
- Zero critical bugs
- Legal counsel sign-off obtained
- All regulatory checklists complete

---

## Test Environment Setup

### Prerequisites

**Required Software**:
```bash
# Testing frameworks
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test

# Code coverage
npm install -D @vitest/coverage-v8

# Test utilities
npm install -D msw  # Mock Service Worker for API mocking
```

**Environment Configuration**:
```bash
# Copy test environment template
cp .env.test.example .env.test

# Configure test database (use separate Supabase project)
# VITE_SUPABASE_URL=https://test-project.supabase.co
# VITE_SUPABASE_ANON_KEY=test_anon_key
# SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
```

**Playwright Setup**:
```bash
# Install Playwright browsers
npx playwright install chromium firefox webkit

# Configure Playwright
npx playwright install-deps
```

### Test Data Fixtures

**File**: `tests/fixtures/notices.ts`

```typescript
export const LICENSING_FIXTURE = {
  noticeType: 'licensing-premises-new',
  APPLICANT_NAME: 'Test Applicant Ltd',
  APPLICANT_ADDRESS: '123 Test Street, London SW1A 1AA',
  PREMISES_NAME: 'The Crown & Anchor',
  PREMISES_ADDRESS: '456 High Street, London W1',
  AUTHORITY_NAME: 'Westminster City Council',
  REPRESENTATION_ADDRESS: 'Licensing Team, Westminster City Hall',
  REPRESENTATION_EMAIL: 'licensing@westminster.gov.uk',
  DEADLINE_DATE: '2025-12-15',
  NEWSPAPER_NAME: 'Westminster Gazette',
  NEWSPAPER_CIRCULATION_AREA: 'City of Westminster',
  NEWSPAPER_CIRCULATES_LOCALLY: true,
};

export const GAMBLING_FIXTURE = {
  noticeType: 'gambling-betting-new',
  APPLICANT_NAME: 'Test Bookmakers Ltd',
  AUTHORITY_NAME: 'Test Borough Council',
  PREMISES_NAME: 'High Street Betting Shop',
  PREMISES_ADDRESS: '10 High Street, Test Town',
  INSPECTION_LOCATION: 'Council Offices, 1 Town Hall Square',
  REPRESENTATION_ADDRESS: 'Licensing Department, Council Offices',
  DEADLINE_DATE: '2025-12-20',
};

export const GVOL_FIXTURE = {
  noticeType: 'gvol-new',
  APPLICANT_NAME: 'Test Transport Ltd',
  APPLICANT_ADDRESS: '10 Industrial Estate, Leeds',
  OPERATING_CENTRE: '20 Warehouse Road, Leeds LS10',
  TRAFFIC_AREA: 'Western',
  TRAFFIC_COMMISSIONER_OFFICE: 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
  DEADLINE_DATE: '2025-12-25',
};

export const PLANNING_FIXTURE = {
  noticeType: 'planning-listed',
  APPLICANT_NAME: 'Test Developer Ltd',
  AUTHORITY_NAME: 'Test Planning Authority',
  SITE_ADDRESS: 'Listed Building, 5 Heritage Lane',
  PROPOSAL_DESCRIPTION: 'Alterations to historic facade',
  APPLICATION_REFERENCE: 'P/2025/12345',
  INSPECTION_LOCATION: 'Planning Office, Town Hall',
  COMMENT_METHOD: 'in writing',
  COMMENT_DESTINATIONS: 'Planning Team, Town Hall',
  DEADLINE_DATE: '2026-01-10',
  HISTORIC_ENGLAND_NOTIFIED: true,
};

export const PROBATE_FIXTURE = {
  noticeType: 'probate',
  DECEASED_NAME: 'John Smith',
  DECEASED_LAST_ADDRESS: '10 Oak Lane, Test Town',
  DATE_OF_DEATH: '2025-10-01',
  PERSONAL_REPRESENTATIVE: 'Jane Smith (Executor)',
  SOLICITOR_NAME: 'Test Solicitors LLP',
  SOLICITOR_ADDRESS: '50 Legal Row, Test City',
  DEADLINE_DATE: '2026-01-01',
};
```

---

## Unit Testing Plan

### Test Organization

**Directory Structure**:
```
src/next/publish/
├── templates/
│   ├── __tests__/
│   │   ├── licensing.test.ts
│   │   ├── gambling.test.ts
│   │   ├── gvol.test.ts
│   │   ├── planning.test.ts
│   │   └── probate.test.ts
├── schema/
│   ├── __tests__/
│   │   ├── licensing-schema.test.ts
│   │   ├── gambling-schema.test.ts
│   │   ├── gvol-schema.test.ts
│   │   └── planning-schema.test.ts
└── validation/
    └── __tests__/
        └── windowRules.test.ts
```

### CRITICAL Issue Testing (CRIT-001 to CRIT-008)

#### CRIT-001: False Statement Warning

**File**: `src/next/publish/templates/__tests__/licensing.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderLicensingTemplate } from '../licensing';
import { LICENSING_FIXTURE } from '../../../tests/fixtures/notices';

describe('CRIT-001: False Statement Warning', () => {
  const REQUIRED_PHRASES = [
    'false statement in connection with an application',
    'level 5 fine',
    'knowingly or recklessly'
  ];

  const LICENSING_VARIANTS = [
    'licensing-premises-new',
    'licensing-premises-variation',
    'licensing-premises-review',
    'licensing-club-new',
    'licensing-club-variation',
    'licensing-club-review'
  ];

  it('all 6 licensing templates include false statement warning', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const notice = { ...LICENSING_FIXTURE, noticeType: variant };
      const rendered = renderLicensingTemplate(notice);

      REQUIRED_PHRASES.forEach(phrase => {
        expect(
          rendered.toLowerCase(),
          `${variant} should contain "${phrase}"`
        ).toContain(phrase.toLowerCase());
      });
    });
  });

  it('warning uses exact statutory wording from Reg 25(1)(d)', () => {
    const EXACT_WORDING = 'It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.';

    LICENSING_VARIANTS.forEach(variant => {
      const notice = { ...LICENSING_FIXTURE, noticeType: variant };
      const rendered = renderLicensingTemplate(notice);

      expect(rendered).toContain(EXACT_WORDING);
    });
  });

  it('warning appears at end of each template', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const notice = { ...LICENSING_FIXTURE, noticeType: variant };
      const rendered = renderLicensingTemplate(notice);

      const warningIndex = rendered.toLowerCase().indexOf('false statement');
      const templateLength = rendered.length;

      // Warning should be in final third of template
      expect(warningIndex).toBeGreaterThan(templateLength * 0.66);
    });
  });

  it('no templates have placeholder or incomplete warnings', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const notice = { ...LICENSING_FIXTURE, noticeType: variant };
      const rendered = renderLicensingTemplate(notice);

      // Check for common template placeholder mistakes
      expect(rendered).not.toContain('{{WARNING}}');
      expect(rendered).not.toContain('[INSERT WARNING]');
      expect(rendered).not.toContain('TODO');
    });
  });
});
```

**Run Test**:
```bash
npm test -- --run licensing.test.ts
```

**Expected Coverage**: 100% of CRIT-001 changes

---

#### CRIT-002: Responsible Authorities Statement

**File**: `src/next/publish/templates/__tests__/licensing.test.ts`

```typescript
describe('CRIT-002: Responsible Authorities Statement', () => {
  const LICENSING_VARIANTS = [
    'licensing-premises-new',
    'licensing-premises-variation',
    'licensing-premises-review',
    'licensing-club-new',
    'licensing-club-variation',
    'licensing-club-review'
  ];

  it('all templates include responsible authorities service requirement', () => {
    LICENSING_VARIANTS.forEach(variant => {
      const notice = { ...LICENSING_FIXTURE, noticeType: variant };
      const rendered = renderLicensingTemplate(notice);

      expect(rendered).toContain('Representors must also serve a copy');
      expect(rendered).toContain('responsible authorities');
    });
  });

  it('displays URL when provided', () => {
    const noticeWithUrl = {
      ...LICENSING_FIXTURE,
      noticeType: 'licensing-premises-new',
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://westminster.gov.uk/licensing/responsible-authorities'
    };

    const rendered = renderLicensingTemplate(noticeWithUrl);

    expect(rendered).toContain('https://westminster.gov.uk/licensing/responsible-authorities');
    expect(rendered).toContain('list is available at');
  });

  it('uses generic text when URL not provided', () => {
    const noticeWithoutUrl = {
      ...LICENSING_FIXTURE,
      noticeType: 'licensing-premises-new',
      // No RESPONSIBLE_AUTHORITIES_LIST_URL
    };

    const rendered = renderLicensingTemplate(noticeWithoutUrl);

    expect(rendered).toContain('responsible authorities');
    expect(rendered).not.toContain('https://');
    expect(rendered).not.toContain('list is available at');
  });

  it('conditional rendering works for all variants', () => {
    LICENSING_VARIANTS.forEach(variant => {
      // Test with URL
      const withUrl = {
        ...LICENSING_FIXTURE,
        noticeType: variant,
        RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://example.com/ra'
      };
      const renderedWithUrl = renderLicensingTemplate(withUrl);
      expect(renderedWithUrl).toContain('https://example.com/ra');

      // Test without URL
      const withoutUrl = { ...LICENSING_FIXTURE, noticeType: variant };
      const renderedWithoutUrl = renderLicensingTemplate(withoutUrl);
      expect(renderedWithoutUrl).toContain('responsible authorities');
      expect(renderedWithoutUrl).not.toContain('https://example.com/ra');
    });
  });
});

describe('CRIT-002: Schema Validation', () => {
  it('accepts valid URL for RESPONSIBLE_AUTHORITIES_LIST_URL', () => {
    const validData = {
      ...LICENSING_FIXTURE,
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://example.com/responsible-authorities'
    };

    expect(() => LicensingSchema.parse(validData)).not.toThrow();
  });

  it('rejects invalid URL for RESPONSIBLE_AUTHORITIES_LIST_URL', () => {
    const invalidData = {
      ...LICENSING_FIXTURE,
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'not-a-valid-url'
    };

    expect(() => LicensingSchema.parse(invalidData)).toThrow(/url/i);
  });

  it('accepts omitted RESPONSIBLE_AUTHORITIES_LIST_URL (optional field)', () => {
    const dataWithoutUrl = { ...LICENSING_FIXTURE };
    delete dataWithoutUrl.RESPONSIBLE_AUTHORITIES_LIST_URL;

    expect(() => LicensingSchema.parse(dataWithoutUrl)).not.toThrow();
  });
});
```

---

#### CRIT-003: Schedule 9 Reference

**File**: `src/next/publish/templates/__tests__/gambling.test.ts`

```typescript
describe('CRIT-003: Gambling Schedule 9 Reference', () => {
  const GAMBLING_VARIANTS = [
    'gambling-betting-new', 'gambling-betting-variation', 'gambling-betting-review', 'gambling-betting-transfer',
    'gambling-bingo-new', 'gambling-bingo-variation', 'gambling-bingo-review', 'gambling-bingo-transfer',
    'gambling-agc-new', 'gambling-agc-variation', 'gambling-agc-review', 'gambling-agc-transfer',
    'gambling-fec-new', 'gambling-fec-variation', 'gambling-fec-review', 'gambling-fec-transfer',
  ];

  it('all 16 gambling templates cite Schedule 9', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const notice = { ...GAMBLING_FIXTURE, noticeType: variant };
      const rendered = renderGamblingTemplate(notice);

      expect(
        rendered,
        `${variant} should contain "GAMBLING ACT 2005, SCHEDULE 9"`
      ).toContain('GAMBLING ACT 2005, SCHEDULE 9');
    });
  });

  it('Schedule 9 appears in header of each template', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const notice = { ...GAMBLING_FIXTURE, noticeType: variant };
      const rendered = renderGamblingTemplate(notice);

      const lines = rendered.split('\n');
      const header = lines.slice(0, 3).join('\n');

      expect(header).toContain('SCHEDULE 9');
    });
  });

  it('no templates have old wording without Schedule 9', () => {
    GAMBLING_VARIANTS.forEach(variant => {
      const notice = { ...GAMBLING_FIXTURE, noticeType: variant };
      const rendered = renderGamblingTemplate(notice);

      // Should NOT match "GAMBLING ACT 2005" without "SCHEDULE 9" following
      expect(rendered).not.toMatch(/GAMBLING ACT 2005(?!,\s*SCHEDULE 9)/);
    });
  });
});
```

---

### Regulatory Validation Checklists

#### Licensing Act 2003 Validation Checklist

**Test Type**: Manual + Automated
**Run By**: QA Engineer + Legal Counsel
**Schedule**: Week 10

```typescript
describe('Regulatory Validation: Licensing Act 2003', () => {
  it('LICENSING-REG-001: All 6 templates include false statement warning', () => {
    // Automated check (same as CRIT-001 tests)
  });

  it('LICENSING-REG-002: All templates state responsible authorities service requirement', () => {
    // Automated check (same as CRIT-002 tests)
  });

  it('LICENSING-REG-003: DPS personal licence authority displayed when applicable', () => {
    const noticeWithDps = {
      ...LICENSING_FIXTURE,
      noticeType: 'licensing-premises-new',
      DPS_NAME: 'John Smith',
      DPS_LICENSING_AUTHORITY: 'Camden Council'
    };

    const rendered = renderLicensingTemplate(noticeWithDps);

    expect(rendered).toContain('John Smith');
    expect(rendered).toContain('Camden Council');
    expect(rendered).toContain('personal licence');
  });

  it('LICENSING-REG-004: 28-day consultation period mentioned', () => {
    // Validation rule test (MED-019)
  });

  it('LICENSING-REG-005: Multi-jurisdiction support works for boundary premises', () => {
    const boundaryPremises = {
      ...LICENSING_FIXTURE,
      noticeType: 'licensing-premises-new',
      AUTHORITY_NAME: 'Westminster City Council',
      ADDITIONAL_LICENSING_AUTHORITIES: [
        { name: 'Camden Borough Council', address: '', email: '' },
        { name: 'City of London Corporation', address: '', email: '' }
      ]
    };

    const rendered = renderLicensingTemplate(boundaryPremises);

    expect(rendered).toContain('Westminster City Council');
    expect(rendered).toContain('concurrent applications');
    expect(rendered).toContain('Camden Borough Council');
    expect(rendered).toContain('City of London Corporation');
  });
});
```

**Manual Checklist** (Legal Counsel Review):

- [ ] False statement warning uses exact Reg 25(1)(d) wording
- [ ] Responsible authorities statement is clear and accurate
- [ ] 10-working-day newspaper window is correct per Reg 25(2)(a)
- [ ] 28-day consultation period is correct per Reg 26(2)
- [ ] DPS declaration includes personal licence authority
- [ ] Interim steps notice type available (s.53A-53C)
- [ ] Multi-jurisdiction rendering is legally correct
- [ ] All variants (new, variation, review, club) are compliant

---

#### Gambling Act 2005 Validation Checklist

```typescript
describe('Regulatory Validation: Gambling Act 2005', () => {
  it('GAMBLING-REG-001: All templates cite Schedule 9', () => {
    // Automated (CRIT-003 tests)
  });

  it('GAMBLING-REG-002: All templates list three licensing objectives', () => {
    const requiredObjectives = [
      'preventing gambling from being a source of crime',
      'ensuring that gambling is conducted in a fair and open way',
      'protecting children and other vulnerable persons'
    ];

    GAMBLING_VARIANTS.forEach(variant => {
      const notice = { ...GAMBLING_FIXTURE, noticeType: variant };
      const rendered = renderGamblingTemplate(notice);

      requiredObjectives.forEach(objective => {
        expect(rendered.toLowerCase()).toContain(objective.toLowerCase());
      });
    });
  });

  it('GAMBLING-REG-003: Transfer notices state 14-day determination period', () => {
    const transferVariants = [
      'gambling-betting-transfer',
      'gambling-bingo-transfer',
      'gambling-agc-transfer',
      'gambling-fec-transfer'
    ];

    transferVariants.forEach(variant => {
      const notice = { ...GAMBLING_FIXTURE, noticeType: variant };
      const rendered = renderGamblingTemplate(notice);

      expect(rendered).toMatch(/14[\s-]day/i);
      expect(rendered).toContain('determine');
    });
  });

  it('GAMBLING-REG-004: Review applicant category captured', () => {
    // Schema validation test
    const reviewData = {
      ...GAMBLING_FIXTURE,
      noticeType: 'gambling-betting-review',
      REVIEW_APPLICANT_CATEGORY: 'licensing_authority'
    };

    expect(() => GamblingSchema.parse(reviewData)).not.toThrow();
  });
});
```

**Manual Checklist**:

- [ ] Schedule 9 cited in all 16 templates
- [ ] Three licensing objectives stated in all templates
- [ ] Transfer notices state 14-day period (Schedule 9 para 35)
- [ ] Review notices capture applicant category
- [ ] Newspaper circulation confirmed
- [ ] All premises types covered (betting, bingo, AGC, FEC)

---

## Integration Testing Plan

### Schema → Template Pipeline Tests

**File**: `tests/integration/schema-template-pipeline.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { LicensingSchema } from '@/next/publish/schema/licensing';
import { renderLicensingTemplate } from '@/next/publish/templates/licensing';

describe('Integration: Schema → Template Pipeline', () => {
  it('licensing schema validates and renders complete notice', () => {
    // Step 1: Parse and validate input data
    const inputData = {
      noticeType: 'licensing-premises-new',
      APPLICANT_NAME: 'Test Pub Ltd',
      PREMISES_NAME: 'The Red Lion',
      PREMISES_ADDRESS: '10 High Street, London',
      AUTHORITY_NAME: 'Westminster City Council',
      REPRESENTATION_ADDRESS: 'Licensing Team, City Hall',
      REPRESENTATION_EMAIL: 'licensing@westminster.gov.uk',
      DEADLINE_DATE: '2025-12-15',
      NEWSPAPER_NAME: 'Westminster Gazette',
      NEWSPAPER_CIRCULATION_AREA: 'City of Westminster',
      NEWSPAPER_CIRCULATES_LOCALLY: true,
      RESPONSIBLE_AUTHORITIES_LIST_URL: 'https://westminster.gov.uk/licensing/responsible-authorities'
    };

    // Step 2: Schema validation
    const validated = LicensingSchema.parse(inputData);
    expect(validated).toBeTruthy();
    expect(validated.APPLICANT_NAME).toBe('Test Pub Ltd');

    // Step 3: Render template
    const rendered = renderLicensingTemplate(validated);

    // Step 4: Verify output
    expect(rendered).toContain('Test Pub Ltd');
    expect(rendered).toContain('The Red Lion');
    expect(rendered).toContain('false statement');
    expect(rendered).toContain('responsible authorities');
    expect(rendered).toContain('https://westminster.gov.uk/licensing/responsible-authorities');
  });

  it('GVOL schema with Traffic Commissioner renders correctly', () => {
    const inputData = {
      noticeType: 'gvol-new',
      APPLICANT_NAME: 'Test Transport Ltd',
      APPLICANT_ADDRESS: '10 Industrial Estate, Leeds',
      OPERATING_CENTRE: '20 Warehouse Road, Leeds LS10',
      TRAFFIC_AREA: 'Western',
      TRAFFIC_COMMISSIONER_OFFICE: 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
      DEADLINE_DATE: '2025-12-25',
    };

    const validated = GvolSchema.parse(inputData);
    const rendered = renderGvolTemplate(validated);

    expect(rendered).toContain('Traffic Commissioner');
    expect(rendered).toContain('Hillcrest House');
    expect(rendered).not.toContain('AUTHORITY_NAME');
  });
});
```

---

## End-to-End Testing Plan

### Playwright E2E Tests

**File**: `e2e/licensing-notice-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Licensing Notice Creation Flow', () => {
  test('create premises licence new notice with all statutory elements', async ({ page }) => {
    // Step 1: Navigate to publish wizard
    await page.goto('http://localhost:5173/publish/step-1');

    // Select notice type
    await page.click('text=Licensing Act 2003');
    await page.click('text=Premises Licence — New');
    await page.click('button:has-text("Continue")');

    // Step 2: Upload form (skip OCR for E2E)
    await page.click('text=Skip upload and enter manually');
    await page.click('button:has-text("Continue")');

    // Step 3: Confirm details
    await page.fill('[name="APPLICANT_NAME"]', 'E2E Test Pub Ltd');
    await page.fill('[name="PREMISES_NAME"]', 'The Test Arms');
    await page.fill('[name="PREMISES_ADDRESS"]', '10 Test Street, London W1');
    await page.fill('[name="AUTHORITY_NAME"]', 'Test Borough Council');
    await page.fill('[name="REPRESENTATION_ADDRESS"]', 'Licensing Team, Town Hall');
    await page.fill('[name="REPRESENTATION_EMAIL"]', 'licensing@test.gov.uk');
    await page.fill('[name="DEADLINE_DATE"]', '2025-12-31');
    await page.fill('[name="NEWSPAPER_NAME"]', 'Test Gazette');
    await page.fill('[name="NEWSPAPER_CIRCULATION_AREA"]', 'Test Borough');
    await page.check('[name="NEWSPAPER_CIRCULATES_LOCALLY"]');
    await page.fill('[name="RESPONSIBLE_AUTHORITIES_LIST_URL"]', 'https://test.gov.uk/responsible-authorities');

    await page.click('button:has-text("Continue")');

    // Step 4: Review and verify statutory content
    const preview = page.locator('[data-testid="notice-preview"]');

    // Verify CRIT-001: False statement warning
    await expect(preview).toContainText('false statement in connection with an application');
    await expect(preview).toContainText('level 5 fine');

    // Verify CRIT-002: Responsible authorities
    await expect(preview).toContainText('Representors must also serve a copy');
    await expect(preview).toContainText('responsible authorities');
    await expect(preview).toContainText('https://test.gov.uk/responsible-authorities');

    // Verify all entered data appears
    await expect(preview).toContainText('E2E Test Pub Ltd');
    await expect(preview).toContainText('The Test Arms');

    // Optional: Publish (or stop here for E2E test)
    // await page.click('button:has-text("Publish Notice")');
  });

  test('create boundary premises notice with multiple authorities', async ({ page }) => {
    await page.goto('http://localhost:5173/publish/step-1');

    // ... fill basic details ...

    // Step 3: Enable multi-jurisdiction
    await page.check('[name="boundaryPremises"]');

    // Add additional authority
    await page.click('button:has-text("Add Authority")');
    await page.fill('[name="ADDITIONAL_LICENSING_AUTHORITIES[0].name"]', 'Camden Council');

    await page.click('button:has-text("Continue")');

    // Step 4: Verify multi-jurisdiction rendering
    const preview = page.locator('[data-testid="notice-preview"]');
    await expect(preview).toContainText('concurrent applications');
    await expect(preview).toContainText('Camden Council');
  });
});
```

---

## Performance Testing

### Load Testing Plan

**Tool**: Artillery or k6

**File**: `tests/performance/notice-creation-load.yml`

```yaml
config:
  target: 'http://localhost:5174'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Peak load"
  processor: "./notice-creation-scenario.js"

scenarios:
  - name: "Create licensing notice"
    flow:
      - post:
          url: "/api/notices"
          json:
            noticeType: "licensing-premises-new"
            APPLICANT_NAME: "Load Test Applicant {{ $randomNumber() }}"
            PREMISES_NAME: "Test Premises"
            # ... other required fields
      - think: 2
      - get:
          url: "/api/notices/{{ noticeId }}"
```

**Performance Benchmarks**:
- Notice creation: < 5 seconds (excluding OCR)
- Template rendering: < 2 seconds
- PDF generation: < 3 seconds
- Database queries: < 100ms

---

## Testing Schedule

### Week-by-Week Testing Plan

**Week 1-2: Unit Testing (CRITICAL Issues)**
- Day-by-day unit test creation alongside implementation
- Continuous test execution: `npm test -- --watch`
- Target: 100% coverage of CRITICAL changes

**Week 3-4: Integration Testing (HIGH Issues)**
- Schema→Template pipeline tests
- Wizard flow integration tests
- Target: All HIGH priority features validated

**Week 5-6: E2E Testing**
- Playwright tests for all notice types
- User journey validation
- Target: Complete flow testing

**Week 9: Comprehensive QA**
- Full E2E test suite execution
- Performance testing
- Security testing
- Accessibility testing

**Week 10: Regulatory Validation**
- Manual checklist validation
- Legal counsel review
- Sample notice generation for all variants
- Target: Legal sign-off obtained

---

## Test Execution Commands

```bash
# Run all unit tests
npm test

# Run unit tests with coverage
npm run coverage

# Run specific test file
npm test -- licensing.test.ts

# Run tests in watch mode (during development)
npm test -- --watch

# Run E2E tests
npx playwright test

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run E2E tests for specific browser
npx playwright test --project=chromium

# Generate E2E test report
npx playwright show-report
```

---

**Implementation documentation complete — ready for code execution and regulatory re-audit.**
