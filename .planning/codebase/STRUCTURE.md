# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
project-root/
├── src/                           # Frontend React SPA
│   ├── main.tsx                   # Entry point: React DOM render
│   ├── App.tsx                    # Root router component (BrowserRouter, Routes)
│   ├── env.ts                     # Feature flags (NEW_PUBLISH_FLOW)
│   ├── index.css                  # Global styles (Tailwind imports)
│   ├── setupTests.ts              # Vitest config
│   ├── app/                       # API client pages (checkout, notices, etc.)
│   ├── pages/                     # Top-level page components
│   │   ├── Home.tsx               # Landing page with search & discovery
│   │   ├── Notices.tsx            # Public notice listing
│   │   ├── NoticeDetailPage.tsx   # Single notice view
│   │   ├── PublishPage.tsx        # Legacy publish flow
│   │   ├── Pricing.tsx            # Pricing & features
│   │   ├── admin/                 # Admin portal routes
│   │   ├── council/               # Council dashboard routes
│   │   ├── firm/                  # Law firm dashboard routes
│   │   ├── auth/                  # Auth flows (SignIn, ForgotPassword, etc.)
│   │   ├── onboarding/            # Signup flows (CouncilRegistration, etc.)
│   │   └── legal/                 # Static pages (Privacy, Terms)
│   ├── components/                # Reusable UI components
│   │   ├── layout/                # Header, Footer, sidebars
│   │   ├── ui/                    # Generic UI (Button, Modal, Form, etc.)
│   │   ├── search/                # Search/filter/map components
│   │   ├── notice/                # Notice card, detail, list
│   │   ├── publish/               # Legacy publish form components
│   │   ├── auth/                  # Auth UI (ProtectedRoute, login forms)
│   │   ├── admin/                 # Admin-specific components
│   │   ├── council/               # Council-specific components
│   │   ├── firm/                  # Firm-specific components
│   │   ├── dev/                   # ErrorBoundary, debug components
│   │   └── error/                 # SectionErrorBoundary
│   ├── next/publish/              # New publish wizard (feature-flagged)
│   │   ├── flow/                  # Main wizard orchestration
│   │   │   ├── NewPublishFlow.tsx # Multi-step wizard container
│   │   │   ├── steps/             # Step components (Type, Upload, Details, Review)
│   │   │   ├── components/        # Shared step UI (ReviewCard, ProgressBar, etc.)
│   │   │   ├── lib/               # legalDetails.ts (OCR extraction logic)
│   │   │   ├── NoticePreview.tsx  # Read-only notice preview
│   │   │   ├── EditableNoticePreview.tsx
│   │   │   └── TemplateBuilderForm.tsx
│   │   ├── config/                # Notice type definitions & blueprints
│   │   │   ├── noticeTypes.ts     # All notice definitions (licensing, gambling, etc.)
│   │   │   ├── __tests__/         # Config tests
│   │   │   └── formBlueprints.ts  # Form field definitions per notice type
│   │   ├── schema/                # Zod schemas & builders
│   │   │   ├── registry.ts        # Schema builder registry
│   │   │   ├── licensing.ts       # Licensing notice schema
│   │   │   ├── gambling.ts        # Gambling notice schema
│   │   │   ├── planning.ts        # Planning notice schema
│   │   │   ├── gvol.ts            # Goods Vehicle Operator schema
│   │   │   ├── tro.ts             # Traffic Regulation Order schema
│   │   │   └── probate.ts         # Probate notice schema
│   │   ├── templates/             # Template renderers
│   │   │   ├── licensing.ts       # renderText() for licensing notices
│   │   │   ├── gambling.ts        # renderText() for gambling notices
│   │   │   ├── planning.ts        # renderText() for planning notices
│   │   │   └── utils.ts           # Common template utilities
│   │   ├── validation/            # Validation rules
│   │   │   └── windowRules.ts     # Legal deadline & consultation window validators
│   │   └── sampleData.ts          # Sample draft data for testing
│   ├── wizard/                    # Draft state management
│   │   ├── wizardSteps.ts         # Step definitions (1-4 with paths)
│   │   ├── draftStore.ts          # SessionStorage persistence helpers
│   │   ├── useSafeTransition.ts   # Hook for safe step navigation
│   │   └── WizardStepper.tsx      # Visual stepper component
│   ├── lib/                       # Core utilities & services
│   │   ├── supabase.ts            # Supabase client initialization
│   │   ├── api.ts                 # API_BASE URL resolution
│   │   ├── notices.ts             # Notice search queries, types (NoticeSearchItem, etc.)
│   │   ├── address.ts             # UK postcode validation & formatting
│   │   ├── councils.ts            # Council lookup & matching
│   │   ├── addressLookup.ts       # Address suggestion fetching
│   │   ├── compliance/            # Compliance rule engine
│   │   │   ├── engine.ts          # Generic rule validator
│   │   │   └── premisesRules.ts   # Licensing premises rules
│   │   ├── licensing/             # Licensing-specific logic
│   │   │   └── checks.ts          # Compliance checks for licensing
│   │   ├── proofs/                # Proof of publication utilities
│   │   ├── dates/                 # Date helpers
│   │   │   └── licensing.ts       # Deadline calculations
│   │   ├── sentry.ts              # Error tracking initialization
│   │   ├── ui/toast.ts            # Toast notification system
│   │   ├── format.ts              # Formatting helpers
│   │   ├── cn.ts                  # ClassNames utility (Tailwind)
│   │   └── templateService.ts     # Notice text rendering service
│   ├── hooks/                     # Custom React hooks
│   │   ├── useNoticeSearch.ts     # Notice search with fetch logic
│   │   ├── useDraftNotice.ts      # Draft notice persistence
│   │   ├── useStats.ts            # Platform statistics
│   │   ├── useStripePayment.ts    # Stripe payment flow
│   │   ├── useRepresentations.ts  # Representation fetching
│   │   ├── useFocusTrap.ts        # Accessibility focus management
│   │   ├── useReducedMotion.ts    # Motion preferences
│   │   └── useWorkflow.ts         # Workflow state management
│   ├── contexts/                  # React context providers
│   │   ├── UnifiedAuthContext.tsx # Auth state (user, org, dept, permissions)
│   │   └── ...                    # Other context providers
│   ├── types/                     # TypeScript definitions
│   │   ├── notice.ts              # Notice, NoticeDraft, Address types
│   │   ├── organization.ts        # Organization, Department types
│   │   ├── permissions.ts         # Role, Permission enums
│   │   ├── workflow.ts            # Workflow state types
│   │   └── index.ts               # Re-exports
│   ├── config/                    # Static configuration
│   │   └── navigation.ts          # Nav links, menu items
│   ├── styles/                    # CSS & Tailwind
│   │   ├── ui.ts                  # Tailwind utility exports
│   │   └── ...                    # Component-level styles
│   ├── utils/                     # Miscellaneous utilities
│   └── __tests__/                 # Top-level integration tests
│
├── server/                        # Express API backend
│   ├── index.ts                   # Express app setup, route registration
│   ├── routes/                    # Modular route handlers (40+)
│   │   ├── notices.ts             # GET/POST notices, search, bbox queries
│   │   ├── upload.ts              # POST file uploads with OCR processing
│   │   ├── address.ts             # Address lookup queries
│   │   ├── publish.ts             # Notice publication workflow
│   │   ├── representations.ts     # Representation submission & fetching
│   │   ├── council.ts             # Council-specific endpoints
│   │   ├── firm.ts                # Firm-specific endpoints
│   │   ├── stripe.ts              # Stripe webhooks & payment
│   │   ├── admin/                 # Admin-specific routes
│   │   │   ├── auth.ts            # Admin login
│   │   │   ├── accounts.ts        # User account management
│   │   │   ├── audit.ts           # Audit log queries
│   │   │   └── stats.ts           # Platform stats
│   │   ├── drafts.ts              # Draft persistence
│   │   ├── templates.ts           # Template management
│   │   ├── team.ts                # Team member management
│   │   ├── analytics.ts           # Analytics queries
│   │   └── ...                    # 30+ other routes
│   ├── services/                  # Business logic layer
│   │   ├── email.ts               # Email sending via Resend/Nodemailer
│   │   ├── stripe.ts              # Stripe integration
│   │   ├── addressProvider.ts     # Address lookup providers (getAddress.io, etc.)
│   │   ├── councilMatcher.ts      # Council matching logic
│   │   ├── complianceChecker.ts   # Compliance rule validation
│   │   ├── noticeDrafter.ts       # AI-powered notice drafting
│   │   ├── representationAnalyzer.ts # Representation analysis
│   │   └── webhooks.ts            # External webhook handlers
│   ├── middleware/                # Express middleware
│   │   ├── adminAuth.ts           # Admin auth & IP allowlist
│   │   └── ...                    # Other middleware
│   ├── lib/                       # Server utilities
│   │   ├── sentry.ts              # Server error tracking
│   │   ├── swagger.ts             # OpenAPI documentation
│   │   └── ...                    # DB queries, validators
│   ├── jobs/                      # Cron & background tasks
│   │   ├── emailJobs.ts           # Scheduled email reminders
│   │   ├── deadlineReminders.ts   # Deadline notification jobs
│   │   └── ...                    # Other scheduled tasks
│   ├── utils/                     # Server utilities
│   └── __tests__/                 # Server tests
│
├── package.json                   # Dependencies, scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Vitest test runner config
├── eslint.config.js               # ESLint configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── .env.example                   # Environment template
├── .env                           # Local environment (gitignored)
└── .planning/codebase/            # Planning documents
    ├── ARCHITECTURE.md
    ├── STRUCTURE.md
    ├── CONVENTIONS.md
    ├── TESTING.md
    ├── CONCERNS.md
    ├── STACK.md
    └── INTEGRATIONS.md
```

## Directory Purposes

**src/pages/:**
- Purpose: Route-mapped page components (one per major route)
- Contains: Top-level layout, state orchestration for page
- Key files: Home.tsx, Notices.tsx, PublishPage.tsx, admin/*, council/*, firm/*

**src/components/:**
- Purpose: Reusable, composable UI components
- Contains: Buttons, modals, forms, cards, layouts
- Key files: ProtectedRoute.tsx (auth guard), FilterBar.tsx, noticeCard components

**src/next/publish/:**
- Purpose: Encapsulated new wizard-based publish flow
- Contains: 4-step wizard, schema builders, template renderers, legal field extraction
- Key files: NewPublishFlow.tsx (orchestrator), wizardSteps.ts (definitions)

**src/lib/:**
- Purpose: Stateless utility functions and service modules
- Contains: API client helpers, address/council lookup, compliance rules
- Pattern: Pure functions, no React hooks, re-exported for use throughout app

**src/hooks/:**
- Purpose: Custom React hooks for data fetching and state management
- Contains: useNoticeSearch, useDraftNotice, useStats (wraps fetch + state)
- Pattern: Each hook manages loading/error/data states

**src/wizard/:**
- Purpose: Multi-step form orchestration and draft persistence
- Contains: Step definitions, SessionStorage management
- Key files: draftStore.ts (persistence), WizardStepper.tsx (UI)

**server/routes/:**
- Purpose: Express route handlers organized by feature
- Contains: One file per domain (notices, upload, council, etc.)
- Pattern: Each file exports router (e.g., `export default router`), registered in index.ts

**server/services/:**
- Purpose: Business logic extraction from routes
- Contains: Email, Stripe, compliance, address providers
- Pattern: Service class or export functions that routes call

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app bootstrap
- `server/index.ts`: Express app setup and route mounting
- `src/App.tsx`: Root router component

**Configuration:**
- `src/env.ts`: Feature flags
- `src/config/navigation.ts`: Navigation links
- `src/next/publish/config/noticeTypes.ts`: Notice definitions
- `.env.example`: Environment template (copy to .env)

**Core Logic:**
- `src/next/publish/flow/NewPublishFlow.tsx`: Wizard orchestration
- `src/next/publish/schema/registry.ts`: Schema builder registry
- `src/next/publish/templates/`: Notice text renderers
- `src/lib/notices.ts`: Notice search & formatting

**Testing:**
- `src/__tests__/`: Integration tests
- `server/__tests__/`: Backend tests
- `src/next/publish/config/__tests__/`: Notice type tests
- Colocated: `*.test.ts`, `*.spec.ts` in same directory as source

## Naming Conventions

**Files:**
- PascalCase for React components: `Home.tsx`, `NoticeCard.tsx`, `ErrorBoundary.tsx`
- camelCase for utilities/services: `notices.ts`, `addressLookup.ts`, `templateService.ts`
- camelCase for hooks: `useNoticeSearch.ts`, `useDraftNotice.ts`
- kebab-case for non-export files (rare): `__tests__/` directories

**Directories:**
- PascalCase for feature areas: `src/pages/council/`, `src/components/publish/`
- camelCase for utilities: `src/lib/`, `src/hooks/`, `src/utils/`
- lowercase for domain grouping: `server/routes/`, `server/services/`, `server/middleware/`

**Types/Interfaces:**
- PascalCase with descriptive names: `NoticeBase`, `NoticeDraft`, `Organization`, `Permission`
- Suffix with `Type` for unions/aliases: `NoticeType`, `UserType`
- Suffix with `Error` for error types: `ValidationError`

**Functions:**
- camelCase: `buildNoticeSearchQuery()`, `extractLegalDetails()`, `validateWindowRules()`
- Hooks prefixed with `use`: `useNoticeSearch()`, `useDraftNotice()`
- Getters prefixed with `get`: `getDefinitionById()`, `getNoticeBuilder()`

## Where to Add New Code

**New Feature (e.g., new notice type):**
- Primary code: `src/next/publish/config/noticeTypes.ts` (add definition) + `src/next/publish/schema/` (add Zod builder) + `src/next/publish/templates/` (add renderer)
- Tests: `src/next/publish/config/__tests__/` for definition tests, `src/next/publish/schema/__tests__/` for schema tests
- Server endpoint: If new API needed, `server/routes/` + `server/services/`

**New Page/Route:**
- Component: `src/pages/` with PascalCase filename (e.g., `NewPage.tsx`)
- Add route to `src/App.tsx` Routes
- If admin/council/firm scoped: create subdirectory `src/pages/admin/`, etc.

**New Component:**
- Reusable UI: `src/components/ui/ComponentName.tsx`
- Feature-specific: `src/components/[feature]/ComponentName.tsx` (e.g., `src/components/notice/NoticeCard.tsx`)
- Page-specific (one-off): Inside `src/pages/` as nested component or exported from same file

**New Utility:**
- Address/council logic: `src/lib/address.ts` or `src/lib/councils.ts`
- Formatting: `src/lib/format.ts`
- Type validation: `src/schemas/` with Zod
- General helpers: `src/utils/`

**New Hook:**
- Data fetching: `src/hooks/useFetch[Name].ts`
- State management: `src/hooks/use[Name]State.ts`
- Accessibility: `src/hooks/use[Feature].ts` (e.g., `useFocusTrap.ts`)

**New API Endpoint:**
- Route handler: `server/routes/[domain].ts`
- Business logic: Extract to `server/services/[service].ts`
- Database queries: Inline in route or in service file

## Special Directories

**src/next/publish/:**
- Purpose: New publish wizard (feature-flagged via `NEW_PUBLISH_FLOW`)
- Generated: No (all source)
- Committed: Yes
- Note: Replaces legacy `src/components/publish/` when flag enabled

**src/pages/admin/, src/pages/council/, src/pages/firm/:**
- Purpose: Role-specific portal routes
- Generated: No
- Committed: Yes
- Pattern: Each wraps layout component + nested routes

**server/routes/admin/:**
- Purpose: Admin-specific API endpoints
- Generated: No
- Committed: Yes
- Auth: Requires admin role via `requireAdmin` middleware

**src/__tests__/:**
- Purpose: Integration tests across modules
- Generated: No (source code, results in .tmp/)
- Committed: Yes
- Run: `npm test` or `npm run test:watch`

**.planning/codebase/:**
- Purpose: GSD planning documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: No (authored by Claude)
- Committed: Yes
- Note: Updated by `/gsd:map-codebase` command

---

*Structure analysis: 2026-01-22*
