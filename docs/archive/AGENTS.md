# Agent Learnings - Civic Notices Portal

## Overview

This file captures patterns and learnings discovered by Ralph iterations to help future agents work effectively on this codebase.

## Project Architecture

### Dual Publish Flow System
**CRITICAL**: There are TWO publish flows:
1. **Legacy Flow**: `src/pages/PublishPage.tsx` (being phased out)
2. **New Wizard Flow**: `src/next/publish/flow/NewPublishFlow.tsx` (current focus)
   - Routes: `/publish/step-1` through `/publish/step-4`
   - Steps: Notice Type → Upload/OCR → Confirm Details → Review & Pay
   - Feature flagged via `NEW_PUBLISH_FLOW` env var

When working on publish functionality, ALWAYS clarify which flow.

### Directory Structure

```
src/
├── wizard/              # Wizard stepper components
│   ├── wizardSteps.ts   # Step definitions
│   ├── draftStore.ts    # SessionStorage draft persistence
│   └── WizardStepper.tsx
├── next/publish/        # New publish flow
│   ├── flow/            # Main wizard flow
│   ├── config/          # Notice type definitions
│   ├── schema/          # Zod schemas + builders
│   ├── templates/       # Template renderers
│   └── validation/      # Window rule validators
├── components/          # Reusable UI
│   ├── publish/         # Legacy publish components
│   └── ui/              # Generic components
├── lib/                 # Core utilities
│   ├── supabase.ts      # Supabase client
│   ├── address.ts       # UK address parsing
│   └── notices.ts       # Notice helpers

server/
├── routes/
│   ├── upload.ts        # File upload + OCR
│   ├── notices.ts       # Notice CRUD + search
│   └── address.ts       # Address lookup
└── services/            # Business logic
```

## Key Patterns

### Notice Type System
- Definitions: `src/next/publish/config/noticeTypes.ts`
- Each notice type has: ID, name, description, schema key, template key
- Schema registry: `src/next/publish/schema/registry.ts`
- Template renderers: `src/next/publish/templates/`

### Schema & Validation
- Use Zod for validation
- Each builder has:
  - `schema`: Zod validation schema
  - `mapToNoticeBase()`: Transform to `NoticeBase` format
- Register in `registry.ts`

### Legal Details Extraction
- File: `src/next/publish/flow/lib/legalDetails.ts`
- Parses uploaded documents via OCR
- Extracts: applicant, premises address, deadlines
- Validates completeness for publication compliance

### Geospatial Features
- Notices geocoded via postcodes.io
- Map uses MapLibre GL with Supercluster for clustering
- Bbox search: `GET /api/notices/bbox`
- Location data stored as PostGIS geography type

### Path Aliases
Always use `@/` for imports from `src/`:
```typescript
import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/notice/NoticeCard';
```

## Gotchas

### Port Management
- API server (5174) and Vite (5173) must both run for dev
- If port conflicts: `kill -9 $(lsof -ti tcp:5174)`

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

Optional:
- `NEW_PUBLISH_FLOW` - Enable wizard flow
- `ADDRESS_PROVIDER` - Address lookup service (default: "mock")

### Testing
- Unit tests: Vitest with jsdom
- E2E tests: Playwright (new) + Cypress (legacy)
- Coverage thresholds: 80% lines/statements/functions, 70% branches
- Run: `npm test` or `npm run coverage`

### Browser Testing Requirements
- ALL UI features MUST be tested in Chrome at `http://localhost:5173`
- Evidence format: "BROWSER TESTED: [steps] - [result]"
- Code existing ≠ feature working

## Dependencies

### Key Libraries
- React 19.x (latest features available)
- MapLibre GL - Map rendering
- Supercluster - Marker clustering
- Supabase JS - Database client
- Zod - Schema validation
- PDFKit - PDF generation
- Tesseract.js - OCR processing

## User Personas

See AVATAR_PROFILES.md for detailed personas:

**Council Users:**
- Sarah Mitchell (Licensing Head) - Needs dashboard, assign reps, export for Idox
- David Chen (Planning Head) - Needs application tracking, consultee management
- Priya Sharma (Environmental Health) - Needs enforcement notices, evidence upload

**Law Firm Users:**
- Emma Watson (Licensing Solicitor) - Needs blue notice PDFs, quick publish, client management
- Thomas Green (Planning Solicitor) - Needs site notices, neighbour tracking

Every feature should answer: "Would [Avatar Name] find this useful?"

## Quality Standards

Before committing:
1. `npm run typecheck` - MUST pass
2. `npm run lint` - MUST pass
3. `npm test` - MUST pass
4. `npm run dev` - MUST start without errors
5. Browser test - MUST verify feature works in Chrome

## Future Considerations

- Blue notice PDF generation with QR codes (Emma's #1 need)
- One-click address selection (publicnoticeportal.co.uk pattern)
- HubSpot-style email threading
- Idox integration for export
- Admin portal for test account creation
