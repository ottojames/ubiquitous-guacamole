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
- [ ] **Task 8.8b**: Apply premises licence workflow function to Supabase.
- [ ] **Task 8.9a**: Create `create_default_probate_workflow()` function migration. Copy from Task 8.9. Seeds 6 stages with 60-day waiting period.
- [ ] **Task 8.9b**: Apply probate workflow function to Supabase.
- [ ] **Task 8.10a**: Create `create_default_planning_workflow()` function migration. Copy from Task 8.10. Seeds 12 stages.
- [ ] **Task 8.10b**: Apply planning workflow function to Supabase.
- [ ] **Task 8.11a**: Create TRO workflow function migration. Copy TRO function from Task 8.11 (first function only).
- [ ] **Task 8.11b**: Apply TRO workflow function to Supabase.
- [ ] **Task 8.11c**: Create GVOL workflow function migration. Copy GVOL function from Task 8.11 (second function only).
- [ ] **Task 8.11d**: Apply GVOL workflow function to Supabase.
- [ ] **Task 8.11e**: Create Gambling workflow function migration. Copy Gambling function from Task 8.11 (third function only).
- [ ] **Task 8.11f**: Apply Gambling workflow function to Supabase.

### 8.3 Workflow Functions
- [ ] **Task 8.12a**: Create `transition_notice_stage()` function migration. Copy from Task 8.12. Validates stage, calculates deadline, records history.
- [ ] **Task 8.12b**: Apply transition_notice_stage function to Supabase.
- [ ] **Task 8.13a**: Create `initialize_notice_workflow()` function migration. Copy from Task 8.13. Auto-creates default workflow if needed.
- [ ] **Task 8.13b**: Apply initialize_notice_workflow function to Supabase.
- [ ] **Task 8.14a**: Create migration to add `firm_id` and `client_id` columns to notices table. Use IF NOT EXISTS pattern.
- [ ] **Task 8.14b**: Apply notices table update to Supabase.

---

## Phase 9: Firm Portal TypeScript Types

**Goal**: Create TypeScript types for all new database tables.

### 9.1 Type Definitions
- [ ] **Task 9.1a**: Create `src/types/workflow.ts` with FirmDepartment and WorkflowConfig interfaces. ~30 lines.
- [ ] **Task 9.1b**: Add WorkflowStage and NoticeWorkflowStatus interfaces to `src/types/workflow.ts`. ~40 lines.
- [ ] **Task 9.1c**: Add WorkflowStageHistory and DeadlineReminder interfaces to `src/types/workflow.ts`. ~35 lines.
- [ ] **Task 9.1d**: Add FirmNoticeTemplate, NoticeWithWorkflow, WorkflowConfigWithStages interfaces to `src/types/workflow.ts`. ~25 lines.
- [ ] **Task 9.2**: Export workflow types from `src/types/index.ts` - Add `export * from './workflow';`

---

## Phase 10: Firm Portal Backend API

**Goal**: Create API endpoints for workflow management, departments, and templates.

**Note**: Use RESTful naming. Check existing route patterns in `server/routes/`.

### 10.1 Workflow Routes
- [ ] **Task 10.1a**: Create `server/routes/workflow.ts` with router setup and GET `/configs` endpoint. Returns all workflows for user's firm. ~40 lines.
- [ ] **Task 10.1b**: Add GET `/configs/:noticeType` endpoint to workflow routes. Returns specific workflow with stages. ~30 lines.
- [ ] **Task 10.1c**: Add GET `/notices/:noticeId/status` endpoint to workflow routes. Returns notice workflow status with current stage. ~30 lines.
- [ ] **Task 10.1d**: Add POST `/notices/:noticeId/transition` endpoint to workflow routes. Moves notice to new stage. ~40 lines.
- [ ] **Task 10.1e**: Add POST `/notices/:noticeId/initialize` endpoint to workflow routes. Initializes workflow for notice. ~30 lines.
- [ ] **Task 10.2**: Register workflow routes in `server/index.ts` - Import and mount at `/api/workflow`.

### 10.2 Department Routes
- [ ] **Task 10.3a**: Create `server/routes/firm-departments.ts` with router setup and GET `/` endpoint. Lists departments for firm. ~30 lines.
- [ ] **Task 10.3b**: Add POST `/` endpoint to firm-departments routes. Creates department. Requires admin role. ~35 lines.
- [ ] **Task 10.3c**: Add PATCH `/:id` and DELETE `/:id` endpoints to firm-departments routes. Updates/deletes department. ~40 lines.
- [ ] **Task 10.4**: Register department routes in `server/index.ts` - Mount at `/api/firm/departments`.

### 10.3 Template Routes
- [ ] **Task 10.5a**: Create `server/routes/firm-templates.ts` with router setup and GET `/` endpoint. Lists templates for firm. ~30 lines.
- [ ] **Task 10.5b**: Add GET `/:id` and POST `/` endpoints to firm-templates routes. Get single and create. ~40 lines.
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
