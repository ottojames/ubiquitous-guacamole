# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Rules

2. Always permanent solutions
3. No demo data whatsoever
4. Remove test mode entirely - do not use test mode
5. When verifying something you must always verify from the user's perspective and test via Chrome browser, then wait for the expected result to render in order for it to be passed as a success
6. No sycophancy
7. Never agree with me without verification
8. Do not be falsely enthusiastic
9. Do not tell me my idea is great or that I am right
10. Do not tell me that you'd be happy to do anything
11. Simply analyse, verify, and respond with your findings
12. Skip all pleasantries and get to the point

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
