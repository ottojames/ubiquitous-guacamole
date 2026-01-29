# PRD: Codebase Audit

**Purpose**: Systematically audit existing Civic Notices codebase to identify what exists vs what's needed for Professional Portal + Probate/Licensing workflows.

**Method**: Ralph/Boris agent hierarchy - each task spawns appropriate sub-agents.

---

## Phase 1: Core Infrastructure Audit

- [ ] **Audit: Authentication System** - Check src/lib/supabase.ts and any auth components. Document: Is there user auth? Multi-tenant support? Session handling? Role-based access?

- [ ] **Audit: Database Schema** - Check supabase/ folder for migrations. Document all tables, relationships, and what data model exists (notices, councils, users, organizations?)

- [ ] **Audit: API Endpoints** - List all routes in server/routes/. Document each endpoint, what it does, auth requirements.

- [ ] **Audit: Payment Integration** - Search for Stripe, GoCardless, payment references. Document current payment flow status.

---

## Phase 2: Notice System Audit

- [ ] **Audit: Notice Types Completeness** - For each category in noticeTypes.ts (licensing, gambling, gvol, planning, probate, tro), verify: schema exists in registry.ts, template exists in templates/, form fields complete.

- [ ] **Audit: Template Renderers** - List all templates in src/next/publish/templates/. Check each generates valid notice text. Note any TODOs or placeholders.

- [ ] **Audit: Schema Registry** - Check src/next/publish/schema/registry.ts. List all registered schemas, their validation rules, missing fields.

- [ ] **Audit: Publish Wizard Flow** - Document the current wizard steps, what each step does, completion status. Check NewPublishFlow.tsx and steps/.

---

## Phase 3: Council Infrastructure Audit

- [ ] **Audit: Council Data** - Check councils/ folder structure. How many councils? What data per council (contacts, departments, boundaries)?

- [ ] **Audit: Council Notifications** - Check email service for sendCouncilNotification. Document: auto-notification on publish? Template? Delivery status tracking?

- [ ] **Audit: Geographic Features** - Check geocoding, bbox search, map components. Document PostcodesIO integration status.

---

## Phase 4: Professional Portal Gap Analysis

- [ ] **Gap: Multi-Tenant Architecture** - Does current codebase support multiple organizations? Workspace isolation? Document what exists vs what PRD-professional-portal-licensing.md requires.

- [ ] **Gap: Workflow Management** - Check for: application tracking, status updates, deadline management, task queues. Compare to professional-portal-features.md requirements.

- [ ] **Gap: Client Portal Features** - Any white-label capability? Client-facing views? Consultant branding options?

- [ ] **Gap: Analytics & Reporting** - Dashboard components? Usage metrics? Export capabilities?

- [ ] **Gap: Subscription/Billing** - SaaS billing infrastructure? Usage tracking? Plan management?

---

## Phase 5: Summary Output

- [ ] **Create: AUDIT-RESULTS.md** - Compile all findings into single document with: Current Capabilities, Missing Features, Technical Debt, Recommended Build Order.

---

## Completion Criteria

Each audit task must produce:
1. File paths examined
2. Findings documented in progress.txt
3. Mark task [x] when complete
4. Commit changes if any files modified

**Start**: Read this PRD, check progress.txt for context, begin with Phase 1.
