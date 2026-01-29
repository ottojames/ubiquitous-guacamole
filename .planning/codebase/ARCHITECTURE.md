# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Client-server SPA with layered separation (frontend React app, Express backend, Supabase database).

**Key Characteristics:**
- Feature-driven modularization (publish flows, council operations, search/discovery)
- Dual publish flow system (legacy and new wizard-based)
- Supabase for auth, database, and file storage
- React Router 7 for client-side routing
- Express server with modular route handlers and business logic services

## Layers

**Presentation (Frontend):**
- Purpose: User interface components, page routing, form handling
- Location: `src/pages/`, `src/components/`
- Contains: Page components, UI components (buttons, forms, modals), layout wrappers
- Depends on: React hooks, React Query, Context API, `src/lib/`
- Used by: React Router entry point (`src/main.tsx`), browser only

**Page & Route Layer:**
- Purpose: High-level page containers, route matching, navigation
- Location: `src/pages/` (Home, Notices, PublishPage, council/*, firm/*, admin/*)
- Contains: React Router routes, page-level state orchestration
- Depends on: Components, context providers, hooks
- Used by: App router (`src/App.tsx`)

**Feature Modules (Publish Flow):**
- Purpose: Encapsulated workflow logic with steps, validation, and state management
- Location: `src/next/publish/flow/`, `src/wizard/`
- Contains: Multi-step wizard (4 steps), draft persistence, schema builders, template renderers
- Depends on: Notice types, validation rules, services
- Used by: NewPublishFlow entry point, step components

**Business Logic & Services (Frontend):**
- Purpose: Data fetching, transformations, validation
- Location: `src/lib/`, `src/hooks/`
- Contains: Notice search (useNoticeSearch), address lookup, council matching, formatting helpers
- Depends on: API calls via fetch
- Used by: Components, pages, feature modules

**API & Server:**
- Purpose: Express API routes, request handling, business logic
- Location: `server/routes/`, `server/services/`
- Contains: 40+ route handlers (notices, upload, council, billing, etc.), service layer
- Depends on: Supabase client, external APIs
- Used by: Frontend fetch calls, internal cron jobs

**Data Layer:**
- Purpose: Supabase integration for auth, database queries, file storage
- Location: `src/lib/supabase.ts`, server-side Supabase calls
- Contains: Database tables (notices, councils, users, organizations), auth sessions
- Depends on: Supabase SDK, environment credentials
- Used by: All route handlers, frontend context

## Data Flow

**Notice Search & Discovery:**

1. User enters postcode/address in search bar (Home page)
2. Frontend calls `useNoticeSearch()` hook with filters
3. Hook builds query string with `buildNoticeSearchQuery()` and fetches `GET /api/notices/search?...`
4. Server route handler (`server/routes/notices.ts`) queries Supabase with filters
5. Results include geolocation data for map clustering via Supercluster
6. Response streams back to hook, updates component state, renders NoticeCarousel/SearchResults

**Notice Publication (New Wizard Flow):**

1. User selects notice type (Step 1: `/publish/step-1`) → stored in draft via `setDraftId()`
2. Upload documents (Step 2: `/publish/step-2`) → POST to `POST /api/upload` with OCR
3. Server extracts legal details via `LegalDetails` service, returns populated fields
4. User confirms/edits details (Step 3: `/publish/step-3`)
5. Review & payment (Step 4: `/publish/step-4`) → validates via `windowRules`
6. Submit payment via Stripe → triggers Supabase notice creation + email notifications

**State Management:**

- **Draft Persistence:** SessionStorage key `publish:draftId` via `src/wizard/draftStore.ts`
- **Auth State:** Supabase session in UnifiedAuthContext (user, organization, department, permissions)
- **UI State:** Component-level React useState or React Query for data fetching
- **Server State:** Express session middleware (optional), primarily stateless

## Key Abstractions

**Notice Type System:**
- Purpose: Define legal notice types (licensing, gambling, planning, TRO, etc.) with validation rules
- Examples: `src/next/publish/config/noticeTypes.ts`, `src/next/publish/schema/registry.ts`
- Pattern: Lookup table (`getDefinitionById()`) → schema builder (Zod) → template renderer

**Schema Registry:**
- Purpose: Map notice types to validation schemas and model transformers
- Examples: `src/next/publish/schema/licensing.ts`, `src/next/publish/schema/gambling.ts`
- Pattern: Each schema builder exposes `schema: ZodType` + `mapToNoticeBase(input): NoticeBase`

**Template Renderers:**
- Purpose: Generate formatted notice text from validated data
- Examples: `src/next/publish/templates/licensing.ts` → `renderText(notice): string`
- Pattern: Each notice type has dedicated renderer; output used for publication

**Compliance Engine:**
- Purpose: Validate notices against legal rules (deadlines, mandatory fields, window constraints)
- Examples: `src/lib/compliance/engine.ts`, `src/lib/licensing/checks.ts`
- Pattern: Rule-based validator with error messaging

**Address & Council Lookup:**
- Purpose: Validate UK postcodes, match councils, provide address suggestions
- Examples: `src/lib/address.ts`, `src/lib/councils.ts`, `src/lib/addressLookup.ts`
- Pattern: Postcodes.io for geocoding, local council registry for matching

**Authentication & Authorization:**
- Purpose: Manage user sessions, organization context, department-level permissions
- Examples: `src/contexts/UnifiedAuthContext.tsx`, `src/types/permissions.ts`
- Pattern: Context-based provider with permission helpers (`hasPermission()`, `canAccessAdmin()`)

## Entry Points

**Frontend:**
- Location: `src/main.tsx` → ReactDOM render
- Triggers: App initialization, Sentry setup, React Query client setup
- Responsibilities: Bootstrap React app, wrap with providers (UnifiedAuthProvider, QueryClientProvider, ErrorBoundary)

**Server:**
- Location: `server/index.ts`
- Triggers: Node.js process startup
- Responsibilities: Express app setup, route registration, middleware (morgan, cors, Sentry), cron jobs

**New Publish Wizard:**
- Location: `src/next/publish/flow/NewPublishFlow.tsx`
- Triggers: Route `/publish/step-*` navigation
- Responsibilities: Multi-step flow orchestration, draft persistence, payment initiation

**Home Page Discovery:**
- Location: `src/pages/Home.tsx`
- Triggers: Route `/`
- Responsibilities: Search UI, notice carousel, council landing page

## Error Handling

**Strategy:** Multi-layer error boundaries + service-level error returns

**Patterns:**

**React Error Boundaries:**
- Global: `src/components/dev/ErrorBoundary.tsx` wraps entire app (catches render errors)
- Section-level: `src/components/error/SectionErrorBoundary.tsx` for major sections (dashboard, admin, etc.)
- Fallback: Console error + user-friendly message

**API/Service Errors:**
- Fetch errors caught in hooks (e.g., `useNoticeSearch()` returns `error: string | null`)
- Server returns `{ error: string }` on 4xx/5xx with HTTP status
- Frontend displays toast notifications via `toast()` utility

**Validation Errors:**
- Form validation via Zod schemas with `.parse()` → throws ZodError
- Schema registry catches parse errors, returns validation detail
- UI renders field-level error messages

**Sentry Integration:**
- Initialized in `src/lib/sentry.ts` for frontend
- Server-side via `@sentry/node` in `server/lib/sentry.ts`
- Captures unhandled exceptions, sends to Sentry dashboard

## Cross-Cutting Concerns

**Logging:** Console-based (dev) via morgan for Express, browser DevTools for React. Sentry for production errors.

**Validation:**
- Client: Zod schemas for notices, forms, addresses
- Server: Zod parsing before database operations, window rule validation
- Database: Supabase column types enforce structure

**Authentication:**
- Supabase managed auth with custom org/dept context in UnifiedAuthContext
- Session token stored in localStorage, auto-refreshed
- Admin auth via separate route (`/admin/login`) with IP allowlist

**Authorization:**
- Role-based access control (RBAC) via permissions.ts (e.g., 'can_publish', 'can_view_analytics')
- Department-level scoping for council users
- ProtectedRoute components check permissions before rendering

**Data Consistency:**
- Supabase ensures referential integrity (foreign keys on councils, organizations)
- Draft IDs tied to session to prevent cross-user access
- Notice status enum (Draft → Submitted → Published) enforced in database

---

*Architecture analysis: 2026-01-22*
