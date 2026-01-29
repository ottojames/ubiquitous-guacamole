# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Rules

1. **Always use the orchestrator** - All development tasks must flow through the dev orchestrator agent. Use `Task` tool with `subagent_type: "dev"` for any feature work, bug fixes, or code changes.
2. Always permanent solutions
3. No demo data whatsoever
4. Remove test mode entirely - do not use test mode
5. When verifying something you must always verify from the user's perspective and test via Chrome browser, then wait for the expected result to render in order for it to be passed as a success
6. **HEADLESS BROWSER ONLY** - All browser verification MUST be done in headless mode. NEVER open visible Chrome windows. NEVER use the `--headed` flag with Playwright. Always use `headless: true` in Playwright config. No exceptions unless user explicitly requests a visible browser.
7. No sycophancy
8. Never agree with me without verification
9. Do not be falsely enthusiastic
10. Do not tell me my idea is great or that I am right
11. Do not tell me that you'd be happy to do anything
12. Simply analyse, verify, and respond with your findings
13. Skip all pleasantries and get to the point

## Systemic Fixes Requirement

**CRITICAL**: All fixes must be systemic, not point fixes.

When fixing a bug or implementing a feature:
1. **Identify ALL affected code paths** - If fixing a form validation issue, check ALL forms that use the same validation logic
2. **Fix at the root** - Don't patch symptoms, fix the underlying cause
3. **Consider parallel functions** - If changing one function, check if similar/parallel functions need the same change
4. **Test across all variants** - A fix for licensing forms must also work for gambling, planning, TRO, etc.
5. **No whack-a-mole** - Never fix one instance of a bug only to have it appear elsewhere

Examples:
- If `NATURE_OF_VARIATION` is broken for licensing-variation, check gambling-variation too
- If PaymentStep has a bug, check all code paths through PaymentStep (allowance, Stripe, direct submit)
- If schema validation fails silently, fix it for ALL schemas in the registry

**The user should NEVER have to report the same class of bug twice.**

## Agent Hierarchy System

This project uses a hierarchical agent system for development. See `.claude/agents/README.md` for full documentation.

### How It Works

All development tasks flow through an orchestrator that coordinates specialized agents:

```
ORCHESTRATOR
    │
    ├── THINKING LAYER (Before Building)
    │   ├── Analyst   → Understands requirements, asks questions
    │   ├── Architect → Designs simplest solution
    │   └── Critic    → Finds holes in plans
    │
    ├── BUILDING LAYER (Implementation)
    │   ├── Coder     → Implements approved plans
    │   └── Fixer     → Makes surgical fixes
    │
    └── VERIFICATION LAYER (After Building)
        ├── Tester    → Runs typecheck, lint, tests
        ├── Browser   → Visual verification in Chrome (REQUIRED)
        └── UserSim   → Tests edge cases
```

### Key Principles

1. **No agent trusts itself** - Every output is verified by another agent
2. **Browser verification is mandatory** - Nothing is "complete" until visually verified
3. **Ask early** - Questions before building prevent wasted work
4. **3 failures = escalate** - Don't spin forever, ask for help
5. **Simple > Clever** - Match existing patterns

### Iteration Loop

```
Coder → Tester → Browser → Success? → DONE
                   │
                   └── Failure? → Fixer → Re-verify (max 3 attempts)
```

### Configuration

Settings in `.claude/agents/config/settings.json`:
- `askBeforeBuilding`: Show plan before coding (default: true)
- `browserVerification`: Always verify in browser (default: true)
- `maxIterations`: Fix attempts before escalating (default: 3)

## Project Overview

This is a Public Notice Portal for managing and publishing legal notices (primarily licensing applications). It's a full-stack TypeScript application with:
- **Frontend**: React (19.x) + Vite SPA with React Router
- **Backend**: Express API server (port 5174)
- **Database**: Supabase (PostgreSQL) with storage for notice documents
- **Maps**: MapLibre GL for geospatial notice visualization

## Development Commands

```bash
# Setup (first time)
npm install
cp .env.example .env
# Edit .env with Supabase credentials before proceeding

# Development (runs both frontend and backend)
npm run dev
# Runs on http://localhost:5173 (Vite dev server)
# API proxied to http://localhost:5174

# Run only frontend or backend separately
npm run dev:web      # Just the Vite frontend (port 5173)
npm run dev:server   # Just the Express API (port 5174)

# Testing
npm test             # Run all tests (Vitest)
npm run test:watch   # Watch mode
npm run coverage     # Generate coverage report

# Linting & Type Checking
npm run lint         # ESLint
npm run typecheck    # TypeScript compiler check

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Scripts
npm run ingest:councils              # Import councils from data/councils.docx
npm run backfill:locations           # Geocode existing notices
npm run backfill:locations -- --dry-run  # Preview without changes
```

## Architecture

### Dual Publish Flow System

**CRITICAL**: This codebase currently has TWO publish flows in active development:

1. **Legacy Flow** (`src/pages/PublishPage.tsx`, `src/components/publish/*`)
   - Original implementation
   - Being phased out

2. **New Wizard Flow** (`src/next/publish/flow/NewPublishFlow.tsx`, `src/wizard/*`)
   - Multi-step wizard with draft persistence
   - Feature flagged via `NEW_PUBLISH_FLOW` env var
   - Routes: `/publish/step-1` through `/publish/step-4`
   - Steps: 1) Notice Type → 2) Upload/OCR → 3) Confirm Details → 4) Review & Pay

When working on publish functionality, clarify which flow the user is referring to. The wizard flow is the current focus.

### Directory Structure

```
src/
├── wizard/              # Wizard stepper and draft state management
│   ├── wizardSteps.ts   # Step definitions (Type, Upload, Details, Review)
│   ├── draftStore.ts    # SessionStorage-based draft persistence
│   └── WizardStepper.tsx
├── next/publish/        # New publish flow implementation
│   ├── flow/            # Main wizard flow components
│   │   ├── NewPublishFlow.tsx      # Main wizard container
│   │   ├── steps/                   # Step components
│   │   ├── lib/legalDetails.ts      # Legal field extraction/validation
│   │   └── components/              # Shared step components
│   ├── config/          # Notice type definitions
│   ├── schema/          # Zod schemas + builders (registry.ts)
│   ├── templates/       # Template renderers for each notice type
│   └── validation/      # Window rule validators
├── components/          # Reusable UI components
│   ├── publish/         # Legacy publish components
│   └── ui/              # Generic UI components
├── pages/              # Top-level page components
├── routes/             # Legacy route components
├── lib/                # Core utilities
│   ├── supabase.ts     # Supabase client
│   ├── address.ts      # UK address parsing/validation
│   └── notices.ts      # Notice data helpers
└── types/              # TypeScript types

server/
├── routes/
│   ├── upload.ts       # File upload + OCR processing
│   ├── notices.ts      # Notice CRUD + geospatial search
│   └── address.ts      # Address lookup integration
└── services/           # Business logic services
```

### Key Concepts

**Notice Definitions** (`src/next/publish/config/noticeTypes.ts`)
- Each notice type (e.g., premises-licence, variation, review) has:
  - ID, display name, description
  - Associated schema key (for validation)
  - Template renderer key (for text generation)

**Schema Registry** (`src/next/publish/schema/registry.ts`)
- Maps notice type IDs to Zod schemas
- Each builder has:
  - `schema`: Zod validation schema
  - `mapToNoticeBase()`: Transforms validated data to `NoticeBase` format

**Template Renderers** (`src/next/publish/templates/`)
- Each renderer exposes `renderText(notice: NoticeBase): string`
- Generates formatted notice text for publication

**Legal Details Extraction** (`src/next/publish/flow/lib/legalDetails.ts`)
- Parses uploaded documents via OCR
- Extracts required fields (applicant, premises address, deadlines)
- Validates completeness for publication compliance

**Geospatial Features**
- Notices are geocoded via postcodes.io
- Map view uses MapLibre GL with clustering (Supercluster)
- Bbox search: `GET /api/notices/bbox` (see `server/routes/notices.ts:~100`)

### Path Aliases

The project uses `@/*` for `src/*`:
```typescript
import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/notice/NoticeCard';
```

### Environment Variables

Required:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

Optional:
- `NEW_PUBLISH_FLOW` - Enable new wizard flow (default: false)
- `VITE_MAP_STYLE_URL` - MapTiler or compatible style URL
- `ADDRESS_PROVIDER` - Address lookup service (default: "mock")
- `POSTCODES_IO_URL` - Override postcodes.io endpoint

## Testing Strategy

**Unit Tests**: Vitest with jsdom
- Component tests use Testing Library
- Place tests in `__tests__/` directories or colocate as `*.test.ts(x)`
- Run focused tests: `npm test -- <path-pattern>`

**E2E Tests**: Playwright (new) + Cypress (legacy)
- Playwright specs: `e2e/**/*.spec.ts`
- Cypress specs: `cypress/e2e/**/*.cy.ts`
- Base URL: `http://localhost:5173`

**Coverage Thresholds**:
- Lines: 80%, Statements: 80%, Functions: 80%, Branches: 70%
- Run `npm run coverage` to check

## Common Workflows

### Adding a New Notice Type

1. Define in `src/next/publish/config/noticeTypes.ts`
2. Create Zod schema in `src/next/publish/schema/`
3. Register builder in `src/next/publish/schema/registry.ts`
4. Create template renderer in `src/next/publish/templates/`
5. Add tests for schema validation and rendering

### Modifying Wizard Steps

- Step definitions: `src/wizard/wizardSteps.ts`
- Step components: `src/next/publish/flow/steps/`
- Main flow logic: `src/next/publish/flow/NewPublishFlow.tsx`
- Draft persistence uses sessionStorage (see `src/wizard/draftStore.ts`)

### Working with Supabase

- Client initialized in `src/lib/supabase.ts`
- Auth is disabled (`persistSession: false`)
- Tables: `notices`, `councils` (primary)
- Storage bucket: `notices` (PDFs, images)

### Address Lookup

- Configurable provider via `ADDRESS_PROVIDER` env var
- Default "mock" provider returns static data
- Real providers: getAddress.io integration (see `server/routes/address.ts`)
- UK postcode validation: `src/lib/ukPostcode.ts`

### Geocoding

- Notices geocoded via postcodes.io (free, no API key)
- Backfill existing notices: `npm run backfill:locations`
- Override endpoint with `POSTCODES_IO_URL` if needed

## Code Style

- ESLint config: `eslint.config.js` (flat config format)
- TypeScript strict mode enabled
- React 19.x (latest features like `use()` hook available)
- Tailwind CSS for styling (see `tailwind.config.js`)
- Unused vars warnings disabled in ESLint

## Port Management

If port 5174 is in use:
```bash
kill -9 $(lsof -ti tcp:5174)
```

## Debugging

- Server logs via morgan (dev format)
- Browser: React DevTools + standard console
- Vite HMR for instant feedback
- API health check: `http://localhost:5174/api/health`

## Navigation Decisions

### "For councils" Nav Item (Decided 2026-01-21)

**Decision**: Keep the current `/#for-councils` anchor link behavior.

**Reasoning**:
- The Home page has a comprehensive "For councils" section (id="for-councils") with:
  - Enterprise features overview (Digital submission, Instant publication, Compliance exports)
  - Council logos for social proof
  - Feature grid (SSO, API, role-based permissions, audit logs, etc.)
- The anchor scroll behavior works correctly
- Creating a dedicated `/councils` landing page would be `[L]` complexity for marginal benefit
- The Pricing page has council content but no dedicated anchor, and the Home page content is more comprehensive

**Alternatives Rejected**:
1. Remove entirely - Councils are a key audience, the content is valuable
2. Link to `/pricing` council section - Pricing has less council-specific content than Home

**Files affected**: `src/components/SiteHeader.tsx` (lines 45, 108), `src/pages/Home.tsx` (line 31, 788)

## Departments Requiring Public Notices (Researched 2026-01-21)

This section documents which UK local authority departments have statutory requirements to publish public notices.

### Licensing Department

**Legislation**: Licensing Act 2003, Gambling Act 2005

**Licensing Act 2003 (Premises Licences)**:
- **Site Notice**: Blue A4 notice, 16pt+ black font, displayed for 28 consecutive days at premises
- **Newspaper Notice**: Published in local newspaper within 10 working days of application
- **Content**: Applicant details, premises address, licensable activities, objection deadline
- **Responsible Authorities**: Police, Fire, Environmental Health, Child Protection, Planning, Trading Standards

**Gambling Act 2005 (Gambling Premises Licences)**:
- **Site Notice**: White A4 notice, displayed for 28 consecutive days at premises
- **Newspaper Notice**: Published in local newspaper within 10 working days
- **Additional**: If premises frontage > 50 metres, notices every 50 metres
- **Consultation Period**: 28 days for representations

### Planning Department

**Legislation**: Town and Country Planning Act 1990, Town and Country Planning (Development Management Procedure) (England) Order 2015

**Planning Applications**:
- **Site Notice**: Displayed for minimum 21 days on or near the land
- **Newspaper Notice**: Required for major applications, listed buildings, conservation areas
- **Online Publication**: Planning portal and local authority website
- **Consultation**: Statutory consultees (Natural England, Historic England, Highways England, etc.)

**Development Types Requiring Notice**:
- Major developments (10+ dwellings, 1000m²+ commercial)
- Listed building consent
- Conservation area works
- Environmental Impact Assessment developments
- Departure from development plan

### Highways Department

**Legislation**: Road Traffic Regulation Act 1984, Local Authorities' Traffic Orders (Procedure) (England and Wales) Regulations 1996

**Traffic Regulation Orders (TROs)**:
- **Newspaper Notice**: Notice of Intention published in local press
- **Site Notices**: Displayed in affected roads
- **Objection Period**: 21 days
- **Notice of Making**: Published when order is made
- **Consultees**: Police, county/district/borough/town/parish councils

**Experimental TROs**:
- **No prior consultation required**, but Notice of Making must be published
- Ongoing consultation for first 6 months

### Environmental Health Department

**Legislation**: Environmental Protection Act 1990 Part 2A, Food Safety Act 1990

**Contaminated Land**:
- **Public Register**: Local authorities must maintain public register of remediation notices
- **Special Sites**: Entry created if land designated as Special Site
- **Liability Notices**: Served on "Appropriate Persons" (Class A: polluters, Class B: landowners)

**Food Safety**:
- **Emergency Prohibition Notices**: Can close premises with immediate effect (court confirmation required)
- **Registration**: Not a notice requirement, but businesses must register 28 days before trading
- **Improvement Notices**: Served on businesses for hygiene contraventions

**Statutory Nuisances**:
- **Abatement Notices**: Served under Environmental Protection Act 1990
- **Works in Default**: Local authority can carry out work and recover costs

### Building Control Department

**Legislation**: Building Act 1984, Building Regulations 2010, Building Safety Act 2022

**Public Body's Notice**: Section 54 of Building Act 1984
- **Demolition Notices**: Notice to adjacent property owners (Sections 80-83)
- **Plan Validity**: Section 32 notice if plans not commenced within 3 years
- **Compliance/Stop Notices**: Section 35B/35C enforcement

**Higher-Risk Buildings** (Building Safety Act 2022):
- Buildings 18m+ or 7+ storeys
- Building Safety Regulator oversight
- Public body's notices must be cancelled for higher-risk work

### Summary Table

| Department | Primary Legislation | Notice Duration | Newspaper Required |
|------------|--------------------|-----------------|--------------------|
| Licensing (Alcohol) | Licensing Act 2003 | 28 days | Yes |
| Licensing (Gambling) | Gambling Act 2005 | 28 days | Yes |
| Planning | TCPA 1990 / DMPO 2015 | 21 days | Sometimes |
| Highways | RTRA 1984 | 21 days | Yes |
| Environmental Health | EPA 1990 | N/A | No (public register) |
| Building Control | Building Act 1984 | Varies | No |

### Currently Supported in Civic Notices Platform

Based on the codebase (`src/next/publish/config/noticeTypes.ts`):
- ✅ Premises Licence (Licensing Act 2003)
- ✅ Variation applications
- ✅ Review applications
- ⚠️ Planning notices (not yet implemented)
- ⚠️ Traffic Regulation Orders (not yet implemented)
- ⚠️ Gambling Act notices (not yet implemented)

### References

- [Licensing Act 2003 Section 182 Guidance](https://www.gov.uk/government/publications/explanatory-memorandum-revised-guidance-issued-under-s-182-of-licensing-act-2003)
- [DMPO 2015](https://www.legislation.gov.uk/uksi/2015/595)
- [Road Traffic Regulation Act 1984](https://commonslibrary.parliament.uk/research-briefings/sn06013/)
- [Contaminated Land Statutory Guidance](https://www.gov.uk/government/publications/contaminated-land-statutory-guidance)
- [Building Act 1984](https://www.gov.uk/government/publications/the-building-act-1984-and-building-regulations-2010-circular-07-2010)
