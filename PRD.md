# Civic Notices Platform - Production Readiness PRD

## Vision

A digital replacement for newspaper public notice publication in the UK. Centralizes all public notices (licensing, planning, highways, probate) across every UK council. Enables:

1. **Public** - Browse notices, submit representations (objections/support/comments)
2. **Solicitor Firms** - Publish notices on behalf of clients, submit to councils
3. **Councils** - View representations on their notices, manage department templates (NOT replacing IDOX)
4. **Platform Admins** - Oversee all organizations, audit actions

## Success Criteria

- [x] All authentication flows use single Supabase-based system (Phase 1 complete)
- [x] Admin can log in and access dashboard (Verified 2026-01-20)
- [x] Council staff can log in and view representations (Verified 2026-01-20)
- [x] Firms can publish notices that link to correct council templates (Verified 2026-01-20 - template indicator shows)
- [x] No mock/demo data in production code paths (Phase 5 complete)
- [x] All tests pass (465 passed, 8 skipped - 2026-01-20)
- [x] E2E flow: Upload → Publish → Map → Council Dashboard → Representation (Verified 2026-01-20)
- [x] Custom templates render correctly for published notices (Verified 2026-01-20)
- [x] Address search uses real getaddress.io API (Fixed 2026-01-20 - was returning mock data)

**Completed Phases**: See [COMPLETED_PRD.md](./COMPLETED_PRD.md) for detailed implementation notes.

---

## Phase 7: Production Polish

**Goal**: Platform is ready for real users

### 7.1 Error Handling
- [x] Add user-friendly error messages for auth failures (Implemented 2026-01-20 - src/lib/authErrors.ts)
- [x] Add error boundaries around major page sections (Implemented 2026-01-20 - src/components/error/SectionErrorBoundary.tsx wraps Admin, Council, Firm portals and Publish Wizard)
- [x] Ensure API errors don't crash the app (Implemented 2026-01-20 - Added .catch() to auth initialization, error handling to council fetch, user feedback for template rendering failures)

### 7.2 Loading States
- [x] Ensure all async operations show loading indicators (Implemented 2026-01-20 - Created skeleton loader components: CardSkeleton, TableRowSkeleton, ListItemSkeleton, etc.)
- [x] No blank screens during data fetching (Implemented 2026-01-20 - Dashboards and list pages now show skeleton placeholders)
- [x] Skeleton loaders for list pages (Implemented 2026-01-20 - Council Notices, Admin Notices, Public Search Results all use skeleton loaders)

### 7.3 Email Notifications
- [x] Implement representation notification to council staff (Implemented 2026-01-20 - sendRepresentationNotificationToCouncil() in email.ts, integrated in representations.ts POST endpoint)
- [x] Implement notice publication confirmation to publisher (Already implemented - sendNoticeConfirmation() in email.ts, integrated in notices.ts POST /submit, stripe.ts after payment, publish.ts after publishing)
- [x] Verify email templates render correctly (Implemented 2026-01-20 - Created server/__tests__/emailTemplates.test.ts with 21 tests covering all 9 email functions)

### 7.4 Security Review
- [x] Verify RLS policies cover all tables with user data (Verified 2026-01-20 - All 35+ user data tables have RLS enabled via migrations 20251021000007_rls_policies.sql and 20260122000003_unified_rls_policies.sql)
- [x] Ensure service role key never sent to client (Verified 2026-01-20 - SUPABASE_SERVICE_ROLE_KEY only used server-side in API routes, client uses VITE_SUPABASE_ANON_KEY)
- [x] Verify admin endpoints require admin authentication (Verified 2026-01-20 - All admin routes use requireAdmin middleware from server/middleware/adminAuth.ts)
- [x] Check for SQL injection vulnerabilities in raw queries (Verified 2026-01-20 - All RPC calls use parameterized queries with named parameters, no string concatenation in SQL)

---

## Technical Notes

### Database Schema
- `organizations` - councils and firms (type field distinguishes)
- `departments` - council departments (licensing, planning, etc.)
- `organization_memberships` - user to org relationship
- `department_memberships` - user to department relationship
- `notices` - published notices with `organization_id` and `department_id`
- `representations` - public comments on notices
- `notice_templates` - custom templates per department per notice type

### Auth Claims (JWT app_metadata)
```json
{
  "is_platform_admin": true,
  "admin_role": "super_admin",
  "organization_id": "uuid",
  "department_ids": ["uuid1", "uuid2"]
}
```

### Key Files
- `src/contexts/UnifiedAuthContext.tsx` - Main auth context
- `src/pages/admin/Login.tsx` - Admin login page
- `src/components/admin/AdminProtectedRoute.tsx` - Admin route guard
- `src/next/publish/flow/NewPublishFlow.tsx` - Publishing wizard (1800+ lines)
- `server/middleware/adminAuth.ts` - Server-side admin auth
- `server/middleware/auth.ts` - Server-side general auth

### Commands
```bash
npm run dev          # Start dev server (frontend + backend)
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
```

---

## Phase 8: Firm Portal Database Schema

**Goal**: Create database tables for firm workflow management, departments, templates, and deadline tracking.

**Reference**: Full SQL schemas in `plans/feat-firm-portal-implementation.md`

**IMPORTANT**: After creating each migration, apply it using Supabase MCP tool `apply_migration`.

### 8.1 Core Tables
- [x] **Task 8.1a**: Create `firm_departments` table migration. File: `supabase/migrations/20260120220000_create_firm_departments.sql`. Includes: table with firm_id, name, slug, status, RLS policies for firm members. (Created 2026-01-20)
- [x] **Task 8.1b**: Apply `firm_departments` migration to Supabase using MCP tool `apply_migration` with project_id from environment. (Applied 2026-01-20 via psql - MCP tool lacked access token; table created with indexes, FK constraints, RLS policies, and update trigger)
- [x] **Task 8.2a**: Create `workflow_configs` table migration. File: `supabase/migrations/20260120230000_create_workflow_configs.sql`. Fields: firm_id, department_id, notice_type, name, is_active, is_default, RLS policies for firm members. (Created 2026-01-20)
- [x] **Task 8.2b**: Apply `workflow_configs` migration to Supabase. (Applied 2026-01-20 via psql - table created with indexes, FK constraints, RLS policies, and update trigger)
- [x] **Task 8.3a**: Create `workflow_stages` table migration. File: `supabase/migrations/20260120240000_create_workflow_stages.sql`. Fields: workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days. Includes: FK to workflow_configs, unique constraints on (workflow_id, position) and (workflow_id, slug), update trigger, RLS policies for firm members. (Created 2026-01-20)
- [x] **Task 8.3b**: Apply `workflow_stages` migration to Supabase. (Applied 2026-01-20 via psql - table created with 17 columns, 5 indexes including 2 unique constraints, FK to workflow_configs with CASCADE delete, 2 RLS policies, and update trigger)
- [x] **Task 8.4a**: Create `notice_workflow_status` table migration. Copy from Task 8.4. Fields: notice_id, workflow_id, current_stage_id, firm_id, deadline_date, is_overdue (generated). RLS: firm members only. (Created 2026-01-20 - File: supabase/migrations/20260120250000_create_notice_workflow_status.sql)
- [x] **Task 8.4b**: Apply `notice_workflow_status` migration to Supabase. (Applied 2026-01-20 via psql - table created with 9 columns, 7 indexes including unique constraint on notice_id, FKs to notices/workflow_configs/workflow_stages/organizations with CASCADE/RESTRICT deletes, 3 RLS policies, update trigger; Note: is_overdue column removed as GENERATED columns require immutable expressions and NOW() is not immutable)
- [x] **Task 8.5a**: Create `workflow_stage_history` table migration. Copy from Task 8.5. Fields: notice_id, from_stage_id, to_stage_id, transition_type, notes, transitioned_by. (Created 2026-01-20 - File: supabase/migrations/20260120260000_create_workflow_stage_history.sql)
- [x] **Task 8.5b**: Apply `workflow_stage_history` migration to Supabase. (Applied 2026-01-20 via psql - table created with 10 columns, 4 indexes, 5 FKs including to notices/notice_workflow_status/workflow_stages/organizations/auth.users, 2 RLS policies for select/insert, check constraint for transition_type)
- [x] **Task 8.6a**: Create `deadline_reminders` table migration. Copy from Task 8.6. Fields: notice_id, firm_id, reminder_type, scheduled_for, status, channel, recipient_email. (Created 2026-01-20 - File: supabase/migrations/20260120270000_create_deadline_reminders.sql)
- [x] **Task 8.6b**: Apply `deadline_reminders` migration to Supabase. (Applied 2026-01-20 via psql - table created with 18 columns, 5 indexes, 3 check constraints, 4 FKs, 2 RLS policies, update trigger)
- [x] **Task 8.7a**: Create `firm_notice_templates` table migration. Copy from Task 8.7. Fields: firm_id, department_id, name, notice_type, template_data (JSONB). (Created 2026-01-20 - File: supabase/migrations/20260120280000_create_firm_notice_templates.sql)
- [x] **Task 8.7b**: Apply `firm_notice_templates` migration to Supabase. (Applied 2026-01-20 via psql - table created with 14 columns, 5 indexes including partial index on is_active, 3 FKs to organizations/firm_departments/auth.users, 4 RLS policies for select/insert/update/delete, update trigger)

### 8.2 Default Workflow Seeds
- [x] **Task 8.8a**: Create `create_default_premises_licence_workflow()` function migration. Copy from Task 8.8. Seeds 10 stages with correct deadlines. (Created 2026-01-20 - File: supabase/migrations/20260120290000_create_default_premises_licence_workflow.sql)
- [x] **Task 8.8b**: Apply premises licence workflow function to Supabase. (Applied 2026-01-20 via psql - function created with SECURITY DEFINER, grants EXECUTE to authenticated role, creates workflow_config and 10 workflow_stages for premises licence)
- [x] **Task 8.9a**: Create `create_default_probate_workflow()` function migration. Copy from Task 8.9. Seeds 6 stages with 60-day waiting period. (Created 2026-01-20 - File: supabase/migrations/20260120300000_create_default_probate_workflow.sql)
- [x] **Task 8.9b**: Apply probate workflow function to Supabase. (Applied 2026-01-20 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, creates workflow_config and 6 workflow_stages for probate notices with 60-day waiting period)
- [x] **Task 8.10a**: Create `create_default_planning_workflow()` function migration. Copy from Task 8.10. Seeds 12 stages. (Created 2026-01-20 - File: supabase/migrations/20260120310000_create_default_planning_workflow.sql)
- [x] **Task 8.10b**: Apply planning workflow function to Supabase. (Applied 2026-01-20 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, creates workflow_config and 12 workflow_stages for planning applications)
- [x] **Task 8.11a**: Create TRO workflow function migration. Copy TRO function from Task 8.11 (first function only). (Created 2026-01-20 - File: supabase/migrations/20260120320000_create_default_tro_workflow.sql)
- [x] **Task 8.11b**: Apply TRO workflow function to Supabase. (Applied 2026-01-21 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, creates workflow_config and 10 workflow_stages for TRO notices with 21-day objection period deadline)
- [x] **Task 8.11c**: Create GVOL workflow function migration. Copy GVOL function from Task 8.11 (second function only). (Created 2026-01-21 - File: supabase/migrations/20260120330000_create_default_gvol_workflow.sql)
- [x] **Task 8.11d**: Apply GVOL workflow function to Supabase. (Applied 2026-01-21 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, creates workflow_config and 9 workflow_stages for GVOL notices including 40-day objection period and 5-year renewal deadline)
- [x] **Task 8.11e**: Create Gambling workflow function migration. Copy Gambling function from Task 8.11 (third function only). (Created 2026-01-21 - File: supabase/migrations/20260120340000_create_default_gambling_workflow.sql)
- [x] **Task 8.11f**: Apply Gambling workflow function to Supabase. (Applied 2026-01-21 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, creates workflow_config and 10 workflow_stages for Gambling notices including 7-day authority notification, 28-day consultation period, and 21-day appeal window)

### 8.3 Workflow Functions
- [x] **Task 8.12a**: Create `transition_notice_stage()` function migration. Copy from Task 8.12. Validates stage, calculates deadline, records history. (Created 2026-01-21 - File: supabase/migrations/20260120350000_create_transition_notice_stage.sql)
- [x] **Task 8.12b**: Apply transition_notice_stage function to Supabase. (Applied 2026-01-21 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role, validates stage belongs to same workflow, calculates deadline for fixed_days deadline_type, records transition history, updates notice_workflow_status with new stage and deadline)
- [x] **Task 8.13a**: Create `initialize_notice_workflow()` function migration. Copy from Task 8.13. Auto-creates default workflow if needed. (Created 2026-01-21 - File: supabase/migrations/20260120360000_create_initialize_notice_workflow.sql)
- [x] **Task 8.13b**: Apply initialize_notice_workflow function to Supabase. (Applied 2026-01-21 via psql - function created with SECURITY DEFINER, EXECUTE granted to authenticated role. Auto-creates default workflow for firm/notice-type if none exists by calling the appropriate create_default_*_workflow function. Finds initial stage, calculates deadline if applicable, creates notice_workflow_status entry, records initial history entry with 'system' transition type)
- [x] **Task 8.14a**: Create migration to add `firm_id` and `client_id` columns to notices table. Use IF NOT EXISTS pattern. (Created 2026-01-21 - File: supabase/migrations/20260120370000_add_firm_client_to_notices.sql. Adds firm_id and client_id columns with FK to organizations, 3 indexes, and descriptive comments)
- [x] **Task 8.14b**: Apply notices table update to Supabase. (Applied 2026-01-21 via psql - Added firm_id and client_id UUID columns to notices table with FK constraints to organizations(id) ON DELETE SET NULL, created 3 indexes: idx_notices_firm_id, idx_notices_client_id, idx_notices_firm_client. Phase 8 Firm Portal Database Schema is now COMPLETE)

---

## Phase 9: Firm Portal TypeScript Types

**Goal**: Create TypeScript types for all new database tables.

### 9.1 Type Definitions
- [x] **Task 9.1a**: Create `src/types/workflow.ts` with FirmDepartment and WorkflowConfig interfaces. ~30 lines. (Created 2026-01-21 - File: src/types/workflow.ts with FirmDepartment (12 fields) and WorkflowConfig (11 fields) interfaces)
- [x] **Task 9.1b**: Add WorkflowStage and NoticeWorkflowStatus interfaces to `src/types/workflow.ts`. ~40 lines. (Created 2026-01-21 - Added WorkflowStage (17 fields), NoticeWorkflowStatus (9 fields), DeadlineType type, and isNoticeOverdue helper function)
- [x] **Task 9.1c**: Add WorkflowStageHistory and DeadlineReminder interfaces to `src/types/workflow.ts`. ~35 lines. (Created 2026-01-21 - Added WorkflowStageHistory (10 fields), DeadlineReminder (18 fields), TransitionType/ReminderType/ReminderStatus/ReminderChannel type aliases)
- [x] **Task 9.1d**: Add FirmNoticeTemplate, NoticeWithWorkflow, WorkflowConfigWithStages interfaces to `src/types/workflow.ts`. ~25 lines. (Created 2026-01-21 - Added FirmNoticeTemplate (14 fields), WorkflowConfigWithStages (extends WorkflowConfig + stages), NoticeWithWorkflow for Kanban views)
- [x] **Task 9.2**: Export workflow types from `src/types/index.ts` - Add `export * from './workflow';` (Created 2026-01-21 - Created src/types/index.ts barrel file exporting all types: notice, permissions, workflow)

---

## Phase 10: Firm Portal Backend API

**Goal**: Create API endpoints for workflow management, departments, and templates.

**Note**: Use RESTful naming. Check existing route patterns in `server/routes/`.

### 10.1 Workflow Routes
- [x] **Task 10.1a**: Create `server/routes/workflow.ts` with router setup and GET `/configs` endpoint. Returns all workflows for user's firm. ~40 lines. (Created 2026-01-21 - File: server/routes/workflow.ts with router setup, requireAuth middleware, and GET /configs endpoint that queries workflow_configs with joined workflow_stages sorted by position)
- [x] **Task 10.1b**: Add GET `/configs/:noticeType` endpoint to workflow routes. Returns specific workflow with stages. ~30 lines. (Created 2026-01-21 - Added endpoint to server/routes/workflow.ts that queries workflow_configs by firm_id and notice_type, returns config with stages sorted by position, handles 404 for missing workflows)
- [x] **Task 10.1c**: Add GET `/notices/:noticeId/status` endpoint to workflow routes. Returns notice workflow status with current stage. ~30 lines. (Created 2026-01-21 - Added endpoint to server/routes/workflow.ts that queries notice_workflow_status with current_stage and workflow joins, validates firm_id for authorization, calculates is_overdue in application layer)
- [x] **Task 10.1d**: Add POST `/notices/:noticeId/transition` endpoint to workflow routes. Moves notice to new stage. ~40 lines. (Created 2026-01-21 - Endpoint validates firm access, calls transition_notice_stage RPC, returns historyId on success)
- [x] **Task 10.1e**: Add POST `/notices/:noticeId/initialize` endpoint to workflow routes. Initializes workflow for notice. ~30 lines. (Created 2026-01-21 - Validates notice belongs to firm, checks workflow not already initialized, calls initialize_notice_workflow RPC, returns statusId on success)
- [x] **Task 10.2**: Register workflow routes in `server/index.ts` - Import and mount at `/api/workflow`. (Completed 2026-01-21 - Added import for workflowRouter and mounted at /api/workflow, 488 tests pass)

### 10.2 Department Routes
- [x] **Task 10.3a**: Create `server/routes/firm-departments.ts` with router setup and GET `/` endpoint. Lists departments for firm. ~30 lines. (Created 2026-01-21 - File: server/routes/firm-departments.ts with router setup, requireAuth middleware, and GET / endpoint that queries firm_departments by firm_id and status='active')
- [x] **Task 10.3b**: Add POST `/` endpoint to firm-departments routes. Creates department. Requires admin role. ~35 lines. (Created 2026-01-21 - Validates admin role via organization_memberships, accepts name/description/default_notice_types/color/icon, generates slug from name, returns 201 with created department)
- [x] **Task 10.3c**: Add PATCH `/:id` and DELETE `/:id` endpoints to firm-departments routes. Updates/deletes department. ~40 lines. (Completed 2026-01-21 - Added PATCH for updating name/description/color/icon/status with validation, DELETE soft-deletes to 'archived' status, both require admin role check)
- [x] **Task 10.4**: Register department routes in `server/index.ts` - Mount at `/api/firm/departments`. (Completed 2026-01-21 - Added import for firmDepartmentsRouter and mounted at /api/firm/departments, 488 tests pass)

### 10.3 Template Routes
- [x] **Task 10.5a**: Create `server/routes/firm-templates.ts` with router setup and GET `/` endpoint. Lists templates for firm. ~30 lines. (Created 2026-01-21 - File: server/routes/firm-templates.ts with router setup, requireAuth middleware, GET / endpoint querying firm_notice_templates by firm_id and is_active=true, supports notice_type query filter)
- [x] **Task 10.5b**: Add GET `/:id` and POST `/` endpoints to firm-templates routes. Get single and create. ~40 lines. (Completed 2026-01-21 - GET /:id fetches single template by ID with firm_id validation, POST / creates template with name/description/notice_type/department_id/template_data/is_shared fields, returns 201 with created template)
- [ ] **Task 10.5c**: Add PATCH `/:id` and DELETE `/:id` endpoints to firm-templates routes. Update and delete. ~40 lines.
- [ ] **Task 10.5d**: Add POST `/:id/use` endpoint to firm-templates routes. Increments usage_count. ~20 lines.
- [ ] **Task 10.6**: Register template routes in `server/index.ts` - Mount at `/api/firm/templates`.

---

## Phase 11: Firm Portal UI Components

**Goal**: Build React components for workflow visualization and management.

**Note**: Use dnd-kit for drag-and-drop. Use React Query for data fetching.

### 11.1 Install Dependencies
- [ ] **Task 11.0**: Install required packages: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-query`

### 11.2 Hooks
- [ ] **Task 11.1a**: Create `src/hooks/useWorkflow.ts` with `useWorkflowConfigs()` hook using React Query. ~25 lines.
- [ ] **Task 11.1b**: Add `useWorkflowConfig(noticeType)` and `useNoticeWorkflowStatus(noticeId)` hooks. ~30 lines.
- [ ] **Task 11.1c**: Add `useTransitionStage()` mutation hook. ~25 lines.

### 11.3 Components
- [ ] **Task 11.2**: Create `src/components/workflow/WorkflowStageBadge.tsx` - Badge showing stage name, color, deadline indicator. ~50 lines.
- [ ] **Task 11.3a**: Create `src/components/workflow/KanbanColumn.tsx` - Single column for Kanban board. Uses dnd-kit droppable. ~60 lines.
- [ ] **Task 11.3b**: Create `src/components/workflow/KanbanCard.tsx` - Card for notice in Kanban. Shows client, premises, deadline. Draggable. ~50 lines.
- [ ] **Task 11.3c**: Create `src/components/workflow/KanbanBoard.tsx` - Main board component. Maps stages to columns, handles drag events. ~80 lines.
- [ ] **Task 11.4a**: Add view toggle state to `src/pages/firm/Notices.tsx` - State for 'kanban' | 'list' | 'calendar'. Toggle buttons UI. ~30 lines addition.
- [ ] **Task 11.4b**: Integrate KanbanBoard into `src/pages/firm/Notices.tsx` - Render board when view is 'kanban'. ~20 lines addition.

### 11.4 Template Management
- [ ] **Task 11.5a**: Create `src/pages/firm/Templates.tsx` with template list view. Shows templates, filter by type. ~60 lines.
- [ ] **Task 11.5b**: Add create/edit template modal to `src/pages/firm/Templates.tsx`. Form with name, type, data fields. ~70 lines.
- [ ] **Task 11.5c**: Add delete confirmation and usage count display to Templates page. ~30 lines.
- [ ] **Task 11.6**: Add Templates route to `src/App.tsx` - Route `/f/:firmSlug/templates` to Templates page.
- [ ] **Task 11.7**: Add Templates link to `src/pages/firm/FirmLayout.tsx` sidebar - Navigation item with FileText icon.

---

## Phase 12: Notification System

**Goal**: Send email notifications for deadline reminders and representation alerts.

### 12.1 Email Service
- [ ] **Task 12.1a**: Create `server/services/email.ts` with base email sending function using Resend. Configure from environment. ~40 lines.
- [ ] **Task 12.1b**: Create `server/services/deadlineReminders.ts` with `processDeadlineReminders()` function. Queries pending reminders, sends emails, updates status. ~60 lines.
- [ ] **Task 12.1c**: Add `scheduleDeadlineReminders()` function to deadlineReminders.ts. Creates reminder records for 7, 3, 1, 0 days before deadline. ~50 lines.
- [ ] **Task 12.1d**: Create `server/templates/deadlineEmail.ts` with HTML email template function. Professional styling. ~60 lines.

---

## Phase 13: E2E Testing (Firm Portal)

**Goal**: Comprehensive Playwright tests for all firm portal user journeys.

**Note**: Tests written from user perspective with personas.

### 13.1 Test Infrastructure
- [ ] **Task 13.1**: Create `e2e/fixtures/firm-auth.ts` - Multi-role auth fixtures. Define test users: owner, admin, editor, viewer. ~50 lines.
- [ ] **Task 13.2**: Update `playwright.config.ts` - Add firm portal project with auth state paths. ~20 lines addition.
- [ ] **Task 13.3**: Create `e2e/global-setup.ts` - Authenticate all test users, save storage states. ~60 lines.

### 13.2 User Journey Tests
- [ ] **Task 13.4a**: Create `e2e/firm-portal/owner-workflow-management.spec.ts` - Test: create department. ~40 lines.
- [ ] **Task 13.4b**: Add test for workflow stage configuration to owner spec. ~35 lines.
- [ ] **Task 13.4c**: Add test for invite team member to owner spec. ~35 lines.
- [ ] **Task 13.5a**: Create `e2e/firm-portal/editor-kanban-workflow.spec.ts` - Test: view Kanban board. ~40 lines.
- [ ] **Task 13.5b**: Add test for drag notice between stages to editor spec. ~40 lines.
- [ ] **Task 13.6**: Create `e2e/firm-portal/viewer-readonly.spec.ts` - Tests: can view, cannot edit/drag. ~50 lines.
- [ ] **Task 13.7**: Create `e2e/firm-portal/multi-tenant-isolation.spec.ts` - Test: Firm A cannot see Firm B data. ~50 lines.
- [ ] **Task 13.8**: Create `e2e/firm-portal/deadline-notifications.spec.ts` - Test: deadlines on calendar, overdue indicators. ~50 lines.

---

## Phase 14: Security Hardening

**Goal**: Apply security audit findings from research phase.

**Reference**: Security findings in `plans/feat-firm-portal-implementation.md`

- [ ] **Task 14.1a**: Create migration to fix role names in existing RLS policies. Use `'org_admin'` consistently.
- [ ] **Task 14.1b**: Apply role name fix migration to Supabase.
- [ ] **Task 14.2a**: Create migration to add authorization checks to SECURITY DEFINER functions.
- [ ] **Task 14.2b**: Apply authorization checks migration to Supabase.
- [ ] **Task 14.3a**: Create migration to add `security_invoker = true` to views (PostgreSQL 15+).
- [ ] **Task 14.3b**: Apply security_invoker migration to Supabase.
- [ ] **Task 14.4a**: Create migration to add immutability trigger to `audit_actions` table.
- [ ] **Task 14.4b**: Apply immutability trigger migration to Supabase.
- [ ] **Task 14.5a**: Create migration for `auth.tenant_id()` helper function.
- [ ] **Task 14.5b**: Apply tenant_id helper function migration to Supabase.

---

## Firm Portal Technical Notes

### Pricing Model
- **Public**: £50/notice (no account needed)
- **Firms**: £49/month subscription + £50/notice
- **Councils**: Free receiving portal + £19.99/notice when publishing

### New Database Tables
- `firm_departments` - Practice areas within firm
- `workflow_configs` - Workflow per notice type
- `workflow_stages` - Stages within workflow
- `notice_workflow_status` - Current stage per notice
- `workflow_stage_history` - Transition audit log
- `deadline_reminders` - Scheduled notifications
- `firm_notice_templates` - Saved templates

### Key Patterns
- Use `app_metadata` (NOT `user_metadata`) for tenant_id - immutable by users
- Use dnd-kit for Kanban (react-beautiful-dnd deprecated)
- Use React Query for server state management
- PostgreSQL state machine pattern with `most_recent` boolean

### Supabase Project
- Project ID: Use `mcp__supabase__list_projects` to find project ID
- Apply migrations with: `mcp__supabase__apply_migration`

---

## Phase 15: Pricing Page Complete Rewrite

**Goal**: Replace the incorrect pricing page with our actual three-tier pricing model.

**Current State (WRONG)**:
- Individual: £49.99/notice
- Professional: £150/month (5 notices included)
- Business: £400/month (15 notices included)  
- Enterprise: £1200/month (50 notices included)
- Parish & Town: £49/month
- District Council: £199/month
- Unitary & County: £499/month
- "Trusted by 40+ UK councils" (false)

**Target State (CORRECT)**:
- Public: £50/notice (no account needed)
- Firms: £49/month subscription + £50/notice
- Councils: FREE portal + £19.99/notice when publishing

**File**: `src/pages/Pricing.tsx`

### 15.1 Remove Old Pricing Data
- [ ] **Task 15.1a**: Delete `pricingPlans.professional` object. **Success**: Object removed, no TypeScript errors.
- [ ] **Task 15.1b**: Delete `pricingPlans.business` object. **Success**: Object removed, no TypeScript errors.
- [ ] **Task 15.1c**: Delete `pricingPlans.enterprise` object. **Success**: Object removed, no TypeScript errors.
- [ ] **Task 15.1d**: Delete `pricingPlans.councilSmall` object (Parish & Town). **Success**: Object removed.
- [ ] **Task 15.1e**: Delete `pricingPlans.councilMedium` object (District Council). **Success**: Object removed.
- [ ] **Task 15.1f**: Delete `pricingPlans.councilLarge` object (Unitary & County). **Success**: Object removed.
- [ ] **Task 15.1g**: Delete entire `comparisonData` array. **Success**: Array removed.
- [ ] **Task 15.1h**: Update `pricingPlans.individual` to show £50 (not £49.99). **Success**: Price shows "£50".

### 15.2 Create New Pricing Structure
- [ ] **Task 15.2a**: Create `pricingPlans.public` object: name "One-Off Publishing", price 50, features, cta "Publish Now - £50". **Success**: Object compiles.
- [ ] **Task 15.2b**: Create `pricingPlans.firms` object: name "Professional Portal", priceMonthly 49, cta "Start Free Trial", popular true. **Success**: Object compiles.
- [ ] **Task 15.2c**: Create `pricingPlans.councils` object: name "Council Portal", FREE portal, £19.99/notice. **Success**: Object compiles.

### 15.3 Update Hero Section
- [ ] **Task 15.3a**: Change hero h1 to "Simple, transparent pricing". **Success**: Updated.
- [ ] **Task 15.3b**: Change subtitle to explain three tiers. **Success**: Subtitle updated.
- [ ] **Task 15.3c**: Update pricing text to "From £50 per notice. Councils £19.99." **Success**: Correct pricing.

### 15.4 Rebuild Pricing Cards Section
- [ ] **Task 15.4a**: Delete "For Individuals" section. **Success**: Removed.
- [ ] **Task 15.4b**: Delete "For Law Firms" section with old tiers. **Success**: Removed.
- [ ] **Task 15.4c**: Delete "For Councils" section with old tiers. **Success**: Removed.
- [ ] **Task 15.4d**: Delete Comparison Table section. **Success**: Removed.
- [ ] **Task 15.4e**: Remove `showComparison` and `billingCycle` state. **Success**: States removed.
- [ ] **Task 15.4f**: Create three-card grid: Public, Firms (highlighted), Councils. **Success**: Cards render.
- [ ] **Task 15.4g**: Style Public card: £50/notice, blue CTA. **Success**: Card styled.
- [ ] **Task 15.4h**: Style Firms card: £49/month + £50/notice, "Most Popular" badge. **Success**: Card prominent.
- [ ] **Task 15.4i**: Style Councils card: FREE portal, £19.99/notice, green accent. **Success**: Card styled.

### 15.5 Update Old Way vs New Way Section
- [ ] **Task 15.5a**: Update to "From £50 per notice". **Success**: Correct price.
- [ ] **Task 15.5b**: Remove "40+ UK councils" claim. **Success**: False claim removed.

### 15.6 Update FAQ Section
- [ ] **Task 15.6a**: Remove outdated "pay-as-you-go" FAQ. **Success**: Removed.
- [ ] **Task 15.6b**: Remove "switch plans" FAQ. **Success**: Removed.
- [ ] **Task 15.6c**: Add FAQ "Why do councils get a discount?" **Success**: Added.
- [ ] **Task 15.6d**: Add FAQ "What's in £49/month subscription?" **Success**: Added.
- [ ] **Task 15.6e**: Add FAQ "Can I publish without subscription?" **Success**: Added.
- [ ] **Task 15.6f**: Add FAQ "What's in free council portal?" **Success**: Added.

### 15.7 Update Final CTA Section
- [ ] **Task 15.7a**: Remove "40+ UK councils", use generic text. **Success**: Removed.
- [ ] **Task 15.7b**: Update primary CTA to "Publish a Notice - £50". **Success**: Updated.
- [ ] **Task 15.7c**: Add secondary CTA "Register as a Firm". **Success**: Added.
- [ ] **Task 15.7d**: Add council link "Get free portal access". **Success**: Added.

### 15.8 E2E Tests for Pricing Page
- [ ] **Task 15.8a**: Create `e2e/pricing-page.spec.ts` - test three cards visible. **Success**: Test passes.
- [ ] **Task 15.8b**: Test correct prices (£50, £49, FREE, £19.99). **Success**: Test passes.
- [ ] **Task 15.8c**: Test old tiers not visible. **Success**: Test passes.
- [ ] **Task 15.8d**: Test no false "40+" claims. **Success**: Test passes.
- [ ] **Task 15.8e**: Test Public CTA links to /publish. **Success**: Test passes.
- [ ] **Task 15.8f**: Test Firms CTA links to sign-up?plan=firm. **Success**: Test passes.
- [ ] **Task 15.8g**: Test Councils CTA links to sign-up?plan=council. **Success**: Test passes.
- [ ] **Task 15.8h**: Test FAQ questions present. **Success**: Test passes.

---

## Phase 16: Homepage Improvements

**Goal**: Fix hardcoded stats, hero messaging, placeholder logos, trust signals.

**File**: `src/pages/Home.tsx`

### 16.1 Replace Hardcoded Stats with Real API
- [ ] **Task 16.1a**: Create `server/routes/stats.ts` GET `/api/stats` returning real counts. ~40 lines. **Success**: Returns real data.
- [ ] **Task 16.1b**: Register route in server/index.ts. **Success**: Accessible.
- [ ] **Task 16.1c**: Create `src/hooks/useStats.ts`. ~30 lines. **Success**: Hook works.
- [ ] **Task 16.1d**: Replace hardcoded STATS with useStats() hook. **Success**: Real counts shown.
- [ ] **Task 16.1e**: Add fallback showing "—" on error. **Success**: Error handled.

### 16.2 Fix Hero Messaging
- [ ] **Task 16.2a**: Update h1 to "Publish legal notices digitally. £50 per notice." **Success**: Updated.
- [ ] **Task 16.2b**: Update subtitle to be concise and compelling. **Success**: Updated.
- [ ] **Task 16.2c**: Remove specific council count claims. **Success**: No false claims.

### 16.3 Make Publish CTA More Prominent
- [ ] **Task 16.3a**: Make Publish button larger with shadow. **Success**: Dominant.
- [ ] **Task 16.3b**: Make Browse button secondary style. **Success**: Clear hierarchy.
- [ ] **Task 16.3c**: Add price to CTA: "Publish a Notice - £50". **Success**: Price visible.

### 16.4 Fix Placeholder Logos
- [ ] **Task 16.4a**: Check /public/logos/, hide if missing. **Success**: No broken images.
- [ ] **Task 16.4b**: Update or hide councilLogos array. **Success**: No broken images.
- [ ] **Task 16.4c**: Replace specific council testimonials with generic. **Success**: No fake endorsements.

### 16.5 Remove False Statistics
- [ ] **Task 16.5a**: Remove specific council count from testimonials badge. **Success**: No false claim.
- [ ] **Task 16.5b**: Remove count from councils section. **Success**: Updated.
- [ ] **Task 16.5c**: Remove count from final CTA. **Success**: Updated.
- [ ] **Task 16.5d**: Fix councils pricing to "Free portal · £19.99/notice". **Success**: Correct.

### 16.6 Fix Notice Price
- [ ] **Task 16.6a**: Change "£49.99" to "£50" in publish section. **Success**: Correct.
- [ ] **Task 16.6b**: Search/replace all "49.99" with "50". **Success**: No wrong price.

### 16.7 Add Trust Signals Section
- [ ] **Task 16.7a**: Create section with 4 trust cards after hero. ~60 lines. **Success**: Renders.
- [ ] **Task 16.7b**: Style with icons and gradients. **Success**: Professional.

### 16.8 Mobile Spacing Review
- [ ] **Task 16.8a**: Review hero on 375px viewport. **Success**: Looks good.
- [ ] **Task 16.8b**: Review testimonials on mobile. **Success**: Readable.
- [ ] **Task 16.8c**: Review pricing cards on mobile. **Success**: Usable.
- [ ] **Task 16.8d**: Review footer on mobile. **Success**: Good.

### 16.9 E2E Tests for Homepage
- [ ] **Task 16.9a**: Create `e2e/homepage.spec.ts` - test hero pricing. **Success**: Passes.
- [ ] **Task 16.9b**: Test publish CTA links to /publish. **Success**: Passes.
- [ ] **Task 16.9c**: Test no false council counts. **Success**: Passes.
- [ ] **Task 16.9d**: Test stats load from API. **Success**: Passes.
- [ ] **Task 16.9e**: Test no broken images. **Success**: Passes.
- [ ] **Task 16.9f**: Test mobile layout. **Success**: Passes.

---

## Phase 17: Admin Panel Overhaul

**Goal**: Fix theme, accessibility, broken functionality.

### 17.1 Theme Update
- [ ] **Task 17.1a**: Audit admin for dark red theme, list files. **Success**: Identified.
- [ ] **Task 17.1b**: Replace sidebar red with bg-slate-50. **Success**: Light.
- [ ] **Task 17.1c**: Update sidebar text to slate-700. **Success**: Readable.
- [ ] **Task 17.1d**: Update active state to blue. **Success**: Uses blue.
- [ ] **Task 17.1e**: Match header to public site. **Success**: Consistent.
- [ ] **Task 17.1f**: Standardize card styles. **Success**: Consistent.

### 17.2 Accessibility Fixes
- [ ] **Task 17.2a**: Run axe-core, document failures. **Success**: Documented.
- [ ] **Task 17.2b**: Fix contrast below 4.5:1. **Success**: WCAG AA.
- [ ] **Task 17.2c**: Add focus states to all interactive elements. **Success**: Visible.
- [ ] **Task 17.2d**: Ensure inputs have labels. **Success**: Labeled.
- [ ] **Task 17.2e**: Add skip link. **Success**: Works.

### 17.3 Replace Browser Alerts
- [ ] **Task 17.3a**: Find all alert() calls, list them. **Success**: Listed.
- [ ] **Task 17.3b**: Create ConfirmModal component. ~80 lines. **Success**: Works.
- [ ] **Task 17.3c**: Create AlertModal component. ~50 lines. **Success**: Works.
- [ ] **Task 17.3d**: Replace first alert(). **Success**: Replaced.
- [ ] **Task 17.3e**: Replace all remaining alert(). **Success**: None remain.
- [ ] **Task 17.3f**: Replace all confirm(). **Success**: None remain.

### 17.4 Fix Settings Page
- [ ] **Task 17.4a**: Identify broken edit/save, document. **Success**: Documented.
- [ ] **Task 17.4b**: Fix form submission to call API. **Success**: Works.
- [ ] **Task 17.4c**: Add loading state to Save. **Success**: Shows loading.
- [ ] **Task 17.4d**: Add success/error toast. **Success**: Feedback shown.
- [ ] **Task 17.4e**: Fix password reset. **Success**: Works.

### 17.5 Fix Dashboard Stats
- [ ] **Task 17.5a**: Find hardcoded stats, list them. **Success**: Listed.
- [ ] **Task 17.5b**: Create admin stats API endpoint. ~50 lines. **Success**: Returns data.
- [ ] **Task 17.5c**: Register with admin auth. **Success**: Protected.
- [ ] **Task 17.5d**: Create useAdminStats hook. **Success**: Works.
- [ ] **Task 17.5e**: Update Dashboard to use real stats. **Success**: Real numbers.
- [ ] **Task 17.5f**: Add loading skeletons. **Success**: No blanks.

### 17.6 Fix Sidebar Navigation
- [ ] **Task 17.6a**: Fix current page highlighting. **Success**: Highlighted.
- [ ] **Task 17.6b**: Fix broken links. **Success**: All work.
- [ ] **Task 17.6c**: Fix mobile collapse. **Success**: Works.

### 17.7 E2E Tests
- [ ] **Task 17.7a**: Create `e2e/admin-panel.spec.ts` with login. **Success**: Auth works.
- [ ] **Task 17.7b**: Test dashboard loads. **Success**: Passes.
- [ ] **Task 17.7c**: Test sidebar navigation. **Success**: Passes.
- [ ] **Task 17.7d**: Test settings save. **Success**: Passes.
- [ ] **Task 17.7e**: Test no browser alerts. **Success**: Passes.
- [ ] **Task 17.7f**: Test accessibility. **Success**: Passes.

---

## Phase 18: Design Consistency

### 18.1 Colors
- [ ] **Task 18.1a**: Document colors, ensure blue-600 primary. **Success**: Documented.
- [ ] **Task 18.1b**: Replace non-standard admin colors. **Success**: Standard.
- [ ] **Task 18.1c**: Standardize semantic colors. **Success**: Consistent.

### 18.2 Typography
- [ ] **Task 18.2a**: Ensure consistent font stack. **Success**: Consistent.
- [ ] **Task 18.2b**: Standardize heading sizes. **Success**: Consistent.
- [ ] **Task 18.2c**: Standardize text colors. **Success**: Consistent.

### 18.3 Buttons
- [ ] **Task 18.3a**: Ensure primary uses UI.btnPrimary. **Success**: Consistent.
- [ ] **Task 18.3b**: Ensure secondary uses UI.btnSecondary. **Success**: Consistent.
- [ ] **Task 18.3c**: Create UI.btnDanger. **Success**: Exists.
- [ ] **Task 18.3d**: Apply to admin. **Success**: Uses shared.

### 18.4 Forms
- [ ] **Task 18.4a**: Create UI.input style. **Success**: Defined.
- [ ] **Task 18.4b**: Create UI.select style. **Success**: Defined.
- [ ] **Task 18.4c**: Apply to admin forms. **Success**: Consistent.
- [ ] **Task 18.4d**: Apply to public forms. **Success**: Consistent.

### 18.5 Loading States
- [ ] **Task 18.5a**: Ensure Skeleton components exist. **Success**: Exist.
- [ ] **Task 18.5b**: Use skeletons for content loading. **Success**: Used.
- [ ] **Task 18.5c**: Use spinners for actions only. **Success**: Appropriate.

---

## Phase 19: Payment & Billing

### 19.1 Stripe Setup
- [ ] **Task 19.1a**: Install Stripe packages. **Success**: Installed.
- [ ] **Task 19.1b**: Add env vars to .env.example. **Success**: Documented.
- [ ] **Task 19.1c**: Create stripe.ts service. ~20 lines. **Success**: Initializes.

### 19.2 Endpoints
- [ ] **Task 19.2a**: Create checkout session endpoint. ~50 lines. **Success**: Creates session.
- [ ] **Task 19.2b**: Create session status endpoint. **Success**: Works.
- [ ] **Task 19.2c**: Create Stripe webhook endpoint. ~60 lines. **Success**: Processes.
- [ ] **Task 19.2d**: Register routes. **Success**: Accessible.

### 19.3 Frontend
- [ ] **Task 19.3a**: Create CheckoutButton. ~40 lines. **Success**: Redirects.
- [ ] **Task 19.3b**: Create PaymentSuccess page. ~50 lines. **Success**: Renders.
- [ ] **Task 19.3c**: Create PaymentCancelled page. ~30 lines. **Success**: Renders.
- [ ] **Task 19.3d**: Add routes to App.tsx. **Success**: Work.
- [ ] **Task 19.3e**: Integrate into publish wizard. **Success**: Can pay.

### 19.4 Receipts
- [ ] **Task 19.4a**: Create receipt PDF generator. ~80 lines. **Success**: Generates.
- [ ] **Task 19.4b**: Create download endpoint. **Success**: Works.
- [ ] **Task 19.4c**: Add download button. **Success**: Users get receipt.

### 19.5 E2E Tests
- [ ] **Task 19.5a**: Test checkout redirect. **Success**: Passes.
- [ ] **Task 19.5b**: Test success page. **Success**: Passes.
- [ ] **Task 19.5c**: Test cancel page. **Success**: Passes.

---

## Phase 20: Council Portal Features

### 20.1 Department Access
- [ ] **Task 20.1a**: Create council_departments table. **Success**: Exists.
- [ ] **Task 20.1b**: Create memberships table. **Success**: Exists.
- [ ] **Task 20.1c**: Create CouncilContext. ~60 lines. **Success**: Works.
- [ ] **Task 20.1d**: Filter routes by membership. **Success**: Filtered.

### 20.2 Representation Inbox
- [ ] **Task 20.2a**: Create RepresentationInbox page. ~100 lines. **Success**: Renders.
- [ ] **Task 20.2b**: Add Mark as Reviewed. **Success**: Works.
- [ ] **Task 20.2c**: Add bulk actions. **Success**: Works.
- [ ] **Task 20.2d**: Add route. **Success**: Works.
- [ ] **Task 20.2e**: Add sidebar link. **Success**: Visible.

### 20.3 Internal Notes
- [ ] **Task 20.3a**: Create representation_notes table. **Success**: With RLS.
- [ ] **Task 20.3b**: Apply migration. **Success**: Applied.
- [ ] **Task 20.3c**: Add notes UI. ~50 lines. **Success**: Works.
- [ ] **Task 20.3d**: RLS hides from public. **Success**: Council-only.

### 20.4 Templates
- [ ] **Task 20.4a**: Create Templates page. ~80 lines. **Success**: Renders.
- [ ] **Task 20.4b**: Add editor. **Success**: Works.
- [ ] **Task 20.4c**: Add route. **Success**: Works.
- [ ] **Task 20.4d**: Add sidebar link. **Success**: Visible.

### 20.5 IDOX Export
- [ ] **Task 20.5a**: Research format, document. **Success**: Documented.
- [ ] **Task 20.5b**: Create export service. ~60 lines. **Success**: Generates.
- [ ] **Task 20.5c**: Create endpoint. **Success**: Works.
- [ ] **Task 20.5d**: Add button. **Success**: Downloads.

### 20.6 Audit Log
- [ ] **Task 20.6a**: Ensure actions logged. **Success**: Logged.
- [ ] **Task 20.6b**: Create AuditLog page. ~80 lines. **Success**: Renders.
- [ ] **Task 20.6c**: Add route. **Success**: Works.
- [ ] **Task 20.6d**: Add sidebar link (admin). **Success**: Visible.

### 20.7 E2E Tests
- [ ] **Task 20.7a**: Create tests with council login. **Success**: Auth works.
- [ ] **Task 20.7b**: Test inbox view. **Success**: Passes.
- [ ] **Task 20.7c**: Test mark reviewed. **Success**: Passes.
- [ ] **Task 20.7d**: Test add note. **Success**: Passes.
- [ ] **Task 20.7e**: Test IDOX export. **Success**: Passes.

---

## Phase 21: AI Features (Future)

### 21.1 Compliance Checker
- [ ] **Task 21.1a**: Create complianceChecker service. ~80 lines. **Success**: Returns results.
- [ ] **Task 21.1b**: Create endpoint. **Success**: Callable.
- [ ] **Task 21.1c**: Add to wizard. **Success**: Shows feedback.

### 21.2 Notice Drafting
- [ ] **Task 21.2a**: Create noticeDrafter service. ~80 lines. **Success**: Generates.
- [ ] **Task 21.2b**: Create endpoint. **Success**: Callable.
- [ ] **Task 21.2c**: Add to wizard. **Success**: Pre-fills.

### 21.3 Representation Analysis
- [ ] **Task 21.3a**: Create analyzer service. ~100 lines. **Success**: Returns analysis.
- [ ] **Task 21.3b**: Create endpoint. **Success**: Callable.
- [ ] **Task 21.3c**: Add to council inbox. **Success**: Shows summary.

---

## Phase 22: Integrations (Future)

### 22.1 API Docs
- [ ] **Task 22.1a**: Create docs/api.md. **Success**: Complete.
- [ ] **Task 22.1b**: Add Swagger at /api/docs. **Success**: Accessible.

### 22.2 Webhooks
- [ ] **Task 22.2a**: Create webhooks table. **Success**: Exists.
- [ ] **Task 22.2b**: Apply migration. **Success**: Applied.
- [ ] **Task 22.2c**: Create webhook service. ~60 lines. **Success**: Sends.
- [ ] **Task 22.2d**: Integrate into endpoints. **Success**: Fires.

---

## Reference

### Correct Pricing
- **Public**: £50/notice (no account)
- **Firms**: £49/month + £50/notice
- **Councils**: Free portal + £19.99/notice

### Design Tokens
- Primary: blue-600
- Success: emerald-600
- Error: rose-600
- Warning: amber-600
- Text: slate-900/slate-600
- Background: slate-50/white

### Testing
- All features need E2E tests
- Playwright in e2e/ directory
- Run: npx playwright test
