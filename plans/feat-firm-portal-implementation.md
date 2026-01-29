# Firm Portal Implementation Plan

## Overview

Add comprehensive Firm Portal tasks to the existing PRD.md for Ralph (autonomous coding agent) to execute. The Firm Portal enables law firms and licensing consultants to manage their notice publication workflow, clients, and team members through a subscription-based model (£49/month + £50/notice).

## Context

### Project Details
- **Platform**: CivicNotices - UK public notice digital publication platform
- **Tech Stack**: React 19 + Vite + TypeScript + Tailwind CSS (frontend), Express (backend), Supabase (PostgreSQL + Auth)
- **Path Alias**: `@/*` maps to `src/*`

### Pricing Model
- **Public**: £50/notice (no account needed)
- **Firms**: £49/month subscription + £50/notice (full management portal)
- **Councils**: Free receiving portal + £19.99/notice when publishing

### Existing Infrastructure
Based on the codebase analysis:
- `firm_subscriptions` table already exists with Stripe integration
- `client_relationships` table exists for firm-client associations
- `subscription_tiers` table has pricing tiers defined
- `firm_clients` view provides aggregated client data
- Firm pages exist at `src/pages/firm/` (Dashboard, Clients, Billing, Team, Settings, Notices)
- FirmLayout provides organization context via outlet

## Research Insights (Deepened: 2026-01-20)

### Enhancement Summary
This plan was enhanced with parallel research agents covering:
- **Supabase RLS Best Practices**: Multi-tenant isolation patterns
- **Kanban Board Patterns**: dnd-kit accessibility and performance
- **Workflow State Machines**: PostgreSQL FSM implementation patterns
- **E2E Testing**: Playwright multi-role auth and user journey testing
- **Security Review**: Critical findings for RLS policy corrections
- **Architecture Review**: RESTful API design recommendations
- **Code Simplicity Review**: React hook optimization patterns

### Key Research Findings

**1. Supabase Multi-Tenant RLS Patterns**
- Use `app_metadata` (NOT `user_metadata`) for tenant_id storage - immutable by users
- Create helper functions: `auth.tenant_id()` for extracting tenant from JWT claims
- Use `SECURITY DEFINER` functions with `EXISTS` subqueries for membership checks
- Add composite indexes: `CREATE INDEX idx_member_user_org ON member(user_id, organization_id)`
- **Critical**: Fix role name inconsistency - use `'org_admin'` not `'admin'` in policies

**2. Kanban Board Best Practices (dnd-kit)**
- Use dnd-kit for React 18+ (react-beautiful-dnd is deprecated)
- Configure sensors: `MouseSensor` (10px activation), `TouchSensor` (250ms delay)
- Hardware acceleration with CSS transforms for 60fps drag performance
- ARIA attributes: `role="grid"`, `aria-sort`, live regions for screen readers
- Keyboard navigation: Arrow keys, Tab, Enter, Space, Home, End

**3. PostgreSQL State Machine Patterns**
- Use Statesman pattern: transitions table with `most_recent` boolean
- Unique constraints for concurrency safety: `UNIQUE(notice_id, sort_key)`
- Lock acquisition via UPDATE before INSERT for atomic transitions
- Use `SKIP LOCKED` for concurrent job processing (pg-boss pattern)

**4. Security Audit Findings (CRITICAL)**
- **Fix**: Add authorization checks to `SECURITY DEFINER` functions
- **Fix**: Views bypass RLS - use `security_invoker = true` (PostgreSQL 15+)
- **Fix**: `audit_actions` table needs immutability trigger like `audit_logs`
- **Fix**: Role name mismatch in policies (`'admin'` vs `'org_admin'`)

### Recommended Architecture Improvements

**RESTful Route Naming Corrections:**
```
# Current (inconsistent)
GET /api/workflow/configs
GET /api/workflow/config/:noticeType

# Recommended (consistent pluralization)
GET /api/workflow/configs
GET /api/workflow/configs/:noticeType
POST /api/workflow/notices              # Initialize workflow for notice
PATCH /api/workflow/notices/:noticeId/stage  # Transition stage
```

**React Hook Simplification:**
```typescript
// Instead of manual state management, use React Query
import { useQuery } from '@tanstack/react-query';

export function useWorkflow() {
  return useQuery({
    queryKey: ['workflow-configs'],
    queryFn: () => fetch('/api/workflow/configs').then(r => r.json()),
  });
}
```

---

## What Needs to Be Added

### Phase 8: Database Schema (Firm Portal Workflows)

New tables needed (in dependency order):
1. `firm_departments` - Departments within firm (Licensing, Probate, Planning, etc.)
2. `workflow_configs` - Workflow configuration per department/notice type
3. `workflow_stages` - Individual stages in a workflow
4. `notice_workflow_status` - Which stage each notice is at
5. `deadline_reminders` - Scheduled notification records
6. `notice_templates` - Saved templates per firm

### Phase 9: TypeScript Types (Firm Portal)

Types for all new tables and API responses.

### Phase 10: Backend API (Firm Portal Workflows)

New endpoints:
- Firm department management (CRUD)
- Workflow config management (CRUD)
- Notice stage transitions
- Deadline queries
- Template CRUD

### Phase 11: Firm Portal UI Enhancements

Pages/components:
- Kanban board view for notices
- Calendar view for deadlines
- Enhanced workflow tracking
- Template management UI

### Phase 12: Workflow Engine

- Default workflow stages per notice type
- Firm customization of stages
- Stage transition logic
- Automatic transitions
- Deadline calculation

### Phase 13: Notification System

- Email notifications via Resend/SendGrid
- Deadline reminders
- Representation alerts

### Phase 14: Stripe Billing Integration

- Enhanced subscription checkout
- Webhook handling
- Billing portal

---

## Detailed Task Breakdown

The following tasks will be appended to PRD.md. Each task is:
- **Atomic**: Completable in one Ralph iteration
- **Self-contained**: Has ALL info needed
- **Testable**: Ralph can verify it works
- **Sequential**: Dependencies resolved in order

---

## Phase 8: Database Schema (Firm Portal Workflows)

### Task 8.1: Create firm_departments table

Create migration file `supabase/migrations/[timestamp]_create_firm_departments.sql`:

```sql
-- Firm Departments Table
-- Allows firms to organize work by practice area

CREATE TABLE IF NOT EXISTS public.firm_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Department details
  name TEXT NOT NULL, -- 'Licensing', 'Probate', 'Planning', 'Traffic & Highways'
  slug TEXT NOT NULL,
  description TEXT,

  -- Configuration
  default_notice_types TEXT[], -- Array of notice type slugs this dept handles
  color TEXT DEFAULT '#6366f1', -- For UI differentiation
  icon TEXT DEFAULT 'folder', -- Icon name

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure unique dept names per firm
  UNIQUE(firm_id, slug)
);

-- Indexes
CREATE INDEX idx_firm_departments_firm ON public.firm_departments(firm_id);
CREATE INDEX idx_firm_departments_status ON public.firm_departments(status) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER update_firm_departments_updated_at
  BEFORE UPDATE ON public.firm_departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.firm_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their departments" ON public.firm_departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can insert departments" ON public.firm_departments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Firm admins can update departments" ON public.firm_departments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Firm admins can delete departments" ON public.firm_departments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_departments.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.firm_departments TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.2: Create workflow_configs table

Create migration file `supabase/migrations/[timestamp]_create_workflow_configs.sql`:

```sql
-- Workflow Configuration Table
-- Defines customizable workflows per notice type per firm/department

CREATE TABLE IF NOT EXISTS public.workflow_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.firm_departments(id) ON DELETE SET NULL,

  -- Configuration
  notice_type TEXT NOT NULL, -- 'premises-licence', 'probate', 'planning', 'tro', 'gvol', 'gambling'
  name TEXT NOT NULL, -- Display name for this workflow
  description TEXT,

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- If true, use for all notices of this type

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure one default workflow per notice type per firm
  UNIQUE(firm_id, notice_type, is_default) -- PostgreSQL partial unique handled differently
);

-- Indexes
CREATE INDEX idx_workflow_configs_firm ON public.workflow_configs(firm_id);
CREATE INDEX idx_workflow_configs_dept ON public.workflow_configs(department_id);
CREATE INDEX idx_workflow_configs_type ON public.workflow_configs(notice_type);
CREATE INDEX idx_workflow_configs_active ON public.workflow_configs(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_workflow_configs_updated_at
  BEFORE UPDATE ON public.workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view workflows" ON public.workflow_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_configs.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage workflows" ON public.workflow_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_configs.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.workflow_configs TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.3: Create workflow_stages table

Create migration file `supabase/migrations/[timestamp]_create_workflow_stages.sql`:

```sql
-- Workflow Stages Table
-- Individual stages within a workflow

CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  workflow_id UUID NOT NULL REFERENCES public.workflow_configs(id) ON DELETE CASCADE,

  -- Stage details
  name TEXT NOT NULL, -- 'Draft', 'Submitted', 'Advertising', 'Consultation', etc.
  slug TEXT NOT NULL, -- 'draft', 'submitted', 'advertising', etc.
  description TEXT,

  -- Position & UI
  position INTEGER NOT NULL DEFAULT 0, -- Order in the workflow
  color TEXT NOT NULL DEFAULT '#6366f1', -- Hex color for Kanban cards
  icon TEXT, -- Optional icon name

  -- Stage behavior
  is_initial BOOLEAN NOT NULL DEFAULT FALSE, -- Starting stage for new notices
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE, -- End stage (Complete, Refused, etc.)
  auto_transition_days INTEGER, -- Auto-move to next stage after N days

  -- Deadline settings
  has_deadline BOOLEAN NOT NULL DEFAULT FALSE,
  deadline_type TEXT CHECK (deadline_type IN ('fixed_days', 'calendar_date', 'calculated')),
  deadline_days INTEGER, -- Days from stage entry
  deadline_working_days BOOLEAN DEFAULT FALSE, -- Use working days only
  deadline_name TEXT, -- 'Consultation End', 'Hearing Date', etc.

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique positions and slugs within workflow
  UNIQUE(workflow_id, position),
  UNIQUE(workflow_id, slug)
);

-- Indexes
CREATE INDEX idx_workflow_stages_workflow ON public.workflow_stages(workflow_id);
CREATE INDEX idx_workflow_stages_position ON public.workflow_stages(workflow_id, position);
CREATE INDEX idx_workflow_stages_initial ON public.workflow_stages(workflow_id, is_initial) WHERE is_initial = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_workflow_stages_updated_at
  BEFORE UPDATE ON public.workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS - inherit from workflow_configs
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view stages" ON public.workflow_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_configs wc
      JOIN public.organization_memberships om ON om.organization_id = wc.firm_id
      WHERE wc.id = workflow_stages.workflow_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage stages" ON public.workflow_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_configs wc
      JOIN public.organization_memberships om ON om.organization_id = wc.firm_id
      WHERE wc.id = workflow_stages.workflow_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.workflow_stages TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.4: Create notice_workflow_status table

Create migration file `supabase/migrations/[timestamp]_create_notice_workflow_status.sql`:

```sql
-- Notice Workflow Status Table
-- Tracks which stage each notice is at

CREATE TABLE IF NOT EXISTS public.notice_workflow_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflow_configs(id) ON DELETE RESTRICT,
  current_stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE RESTRICT,

  -- Firm context (denormalized for RLS efficiency)
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Current stage details
  entered_stage_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_date TIMESTAMPTZ, -- Calculated from stage settings

  -- Tracking
  is_overdue BOOLEAN GENERATED ALWAYS AS (deadline_date IS NOT NULL AND deadline_date < NOW()) STORED,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One workflow status per notice
  UNIQUE(notice_id)
);

-- Indexes
CREATE INDEX idx_notice_workflow_status_notice ON public.notice_workflow_status(notice_id);
CREATE INDEX idx_notice_workflow_status_workflow ON public.notice_workflow_status(workflow_id);
CREATE INDEX idx_notice_workflow_status_stage ON public.notice_workflow_status(current_stage_id);
CREATE INDEX idx_notice_workflow_status_firm ON public.notice_workflow_status(firm_id);
CREATE INDEX idx_notice_workflow_status_deadline ON public.notice_workflow_status(deadline_date) WHERE deadline_date IS NOT NULL;
CREATE INDEX idx_notice_workflow_status_overdue ON public.notice_workflow_status(firm_id, is_overdue) WHERE is_overdue = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_notice_workflow_status_updated_at
  BEFORE UPDATE ON public.notice_workflow_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.notice_workflow_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their notice statuses" ON public.notice_workflow_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can update notice statuses" ON public.notice_workflow_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Firm members can insert notice statuses" ON public.notice_workflow_status
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = notice_workflow_status.firm_id
      AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.notice_workflow_status TO authenticated;

-- CRITICAL: Councils cannot see this data (workflow is firm-internal)
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.5: Create workflow_stage_history table

Create migration file `supabase/migrations/[timestamp]_create_workflow_stage_history.sql`:

```sql
-- Workflow Stage History Table
-- Audit log of stage transitions for each notice

CREATE TABLE IF NOT EXISTS public.workflow_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_status_id UUID NOT NULL REFERENCES public.notice_workflow_status(id) ON DELETE CASCADE,

  -- Transition details
  from_stage_id UUID REFERENCES public.workflow_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE RESTRICT,

  -- Metadata
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transitioned_by UUID REFERENCES auth.users(id),
  transition_type TEXT NOT NULL DEFAULT 'manual' CHECK (transition_type IN ('manual', 'automatic', 'system')),
  notes TEXT, -- Optional notes for the transition

  -- Firm context (denormalized for RLS)
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_workflow_stage_history_notice ON public.workflow_stage_history(notice_id);
CREATE INDEX idx_workflow_stage_history_status ON public.workflow_stage_history(workflow_status_id);
CREATE INDEX idx_workflow_stage_history_firm ON public.workflow_stage_history(firm_id);
CREATE INDEX idx_workflow_stage_history_time ON public.workflow_stage_history(transitioned_at);

-- RLS
ALTER TABLE public.workflow_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view stage history" ON public.workflow_stage_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_stage_history.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can insert stage history" ON public.workflow_stage_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = workflow_stage_history.firm_id
      AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.workflow_stage_history TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.6: Create deadline_reminders table

Create migration file `supabase/migrations/[timestamp]_create_deadline_reminders.sql`:

```sql
-- Deadline Reminders Table
-- Scheduled notification records

CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_status_id UUID REFERENCES public.notice_workflow_status(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Reminder details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'deadline_upcoming',      -- X days before deadline
    'deadline_today',         -- On the deadline day
    'deadline_overdue',       -- After deadline passed
    'representation_received',-- When representation submitted
    'stage_reminder'          -- Generic stage reminder
  )),

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),

  -- Delivery
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push')),
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_user_id UUID REFERENCES auth.users(id),

  -- Content
  subject TEXT,
  message TEXT,
  related_deadline_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_error TEXT
);

-- Indexes
CREATE INDEX idx_deadline_reminders_notice ON public.deadline_reminders(notice_id);
CREATE INDEX idx_deadline_reminders_firm ON public.deadline_reminders(firm_id);
CREATE INDEX idx_deadline_reminders_scheduled ON public.deadline_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_deadline_reminders_status ON public.deadline_reminders(status);
CREATE INDEX idx_deadline_reminders_pending ON public.deadline_reminders(scheduled_for, status) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_deadline_reminders_updated_at
  BEFORE UPDATE ON public.deadline_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their reminders" ON public.deadline_reminders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = deadline_reminders.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage reminders" ON public.deadline_reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = deadline_reminders.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.deadline_reminders TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.7: Create firm_notice_templates table

Create migration file `supabase/migrations/[timestamp]_create_firm_notice_templates.sql`:

```sql
-- Firm Notice Templates Table
-- Saved templates per firm for quick notice creation

CREATE TABLE IF NOT EXISTS public.firm_notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.firm_departments(id) ON DELETE SET NULL,

  -- Template details
  name TEXT NOT NULL, -- 'Standard Pub Licence', 'Late Night Variation', etc.
  description TEXT,
  notice_type TEXT NOT NULL, -- 'premises-licence', 'variation', etc.

  -- Template data
  template_data JSONB NOT NULL DEFAULT '{}', -- Pre-filled form fields

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_shared BOOLEAN NOT NULL DEFAULT TRUE, -- Share across all dept members
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_firm_notice_templates_firm ON public.firm_notice_templates(firm_id);
CREATE INDEX idx_firm_notice_templates_dept ON public.firm_notice_templates(department_id);
CREATE INDEX idx_firm_notice_templates_type ON public.firm_notice_templates(notice_type);
CREATE INDEX idx_firm_notice_templates_active ON public.firm_notice_templates(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_firm_notice_templates_updated_at
  BEFORE UPDATE ON public.firm_notice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.firm_notice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view shared templates" ON public.firm_notice_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
    )
    AND (is_shared = TRUE OR created_by = auth.uid())
  );

CREATE POLICY "Firm members can create templates" ON public.firm_notice_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Template owners can update" ON public.firm_notice_templates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Template owners can delete" ON public.firm_notice_templates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = firm_notice_templates.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.firm_notice_templates TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.8: Seed default workflow stages for Premises Licence

Create migration file `supabase/migrations/[timestamp]_seed_premises_licence_workflow.sql`:

```sql
-- Seed Default Workflow Stages for Premises Licence
-- Based on researched stages from todo.md

-- This function creates default workflow for a firm
CREATE OR REPLACE FUNCTION create_default_premises_licence_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- Create the workflow config
  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'premises-licence',
    'Premises Licence Application',
    'Standard workflow for Licensing Act 2003 premises licence applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  -- Insert stages in order
  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Pre-Application', 'pre-application', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Advertising', 'advertising', 3, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 10, TRUE, 'Advertising Deadline'),
    (v_workflow_id, 'Consultation', 'consultation', 4, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 28, FALSE, 'Consultation End'),
    (v_workflow_id, 'Awaiting Decision', 'awaiting-decision', 5, '#818cf8', FALSE, FALSE, TRUE, 'fixed_days', 40, FALSE, 'Decision Target'),
    (v_workflow_id, 'Hearing Scheduled', 'hearing-scheduled', 6, '#f97316', FALSE, FALSE, TRUE, 'calendar_date', NULL, NULL, 'Hearing Date'),
    (v_workflow_id, 'Decision', 'decision', 7, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 8, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, FALSE, 'Appeal Window Closes'),
    (v_workflow_id, 'Complete', 'complete', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_premises_licence_workflow TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.9: Seed default workflow stages for Probate

Create migration file `supabase/migrations/[timestamp]_seed_probate_workflow.sql`:

```sql
-- Seed Default Workflow Stages for Probate
-- Based on researched stages from todo.md (Trustee Act 1925 s.27)

CREATE OR REPLACE FUNCTION create_default_probate_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'probate',
    'Probate Notice',
    'Standard workflow for Trustee Act 1925 s.27 probate notices',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Draft', 'draft', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Published', 'published', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Waiting Period', 'waiting-period', 2, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 60, FALSE, '2-Month Expiry'),
    (v_workflow_id, 'Claims Received', 'claims-received', 3, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Period Expired', 'period-expired', 4, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Estate Distributed', 'estate-distributed', 5, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_probate_workflow TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.10: Seed default workflow stages for Planning

Create migration file `supabase/migrations/[timestamp]_seed_planning_workflow.sql`:

```sql
-- Seed Default Workflow Stages for Planning Applications
-- Based on researched stages from todo.md

CREATE OR REPLACE FUNCTION create_default_planning_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (
    firm_id,
    notice_type,
    name,
    description,
    is_active,
    is_default
  ) VALUES (
    p_firm_id,
    'planning',
    'Planning Application',
    'Standard workflow for planning applications',
    TRUE,
    TRUE
  ) RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_working_days, deadline_name) VALUES
    (v_workflow_id, 'Pre-Application', 'pre-application', 0, '#a78bfa', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Submitted', 'submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Validation', 'validation', 2, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Consultation', 'consultation', 3, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 21, FALSE, 'Consultation End'),
    (v_workflow_id, 'Site Visit', 'site-visit', 4, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Amendments', 'amendments', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Officer Report', 'officer-report', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Committee/Delegated', 'committee-delegated', 7, '#ec4899', FALSE, FALSE, TRUE, 'fixed_days', 56, FALSE, 'Decision Target (8 weeks)'),
    (v_workflow_id, 'Decision', 'decision', 8, '#8b5cf6', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Discharge Conditions', 'discharge-conditions', 9, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal', 'appeal', 10, '#ef4444', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL),
    (v_workflow_id, 'Complete', 'complete', 11, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_planning_workflow TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.11: Seed default workflow stages for TRO, GVOL, Gambling

Create migration file `supabase/migrations/[timestamp]_seed_remaining_workflows.sql`:

```sql
-- Seed Default Workflow Stages for TRO, GVOL, and Gambling
-- Based on researched stages from todo.md

-- TRO - Traffic Regulation Order
CREATE OR REPLACE FUNCTION create_default_tro_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'tro', 'Traffic Regulation Order', 'Standard workflow for TRO notices', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Investigation', 'investigation', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Design', 'design', 1, '#a78bfa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Statutory Consultation', 'statutory-consultation', 2, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice of Intention', 'notice-of-intention', 3, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 4, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Objection Deadline'),
    (v_workflow_id, 'Objection Review', 'objection-review', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Modifications', 'modifications', 6, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notice of Making', 'notice-of-making', 7, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Implementation', 'implementation', 8, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'In Force', 'in-force', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GVOL - Goods Vehicle Operator Licence
CREATE OR REPLACE FUNCTION create_default_gvol_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'gvol', 'Goods Vehicle Operator Licence', 'Standard workflow for O licence applications', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Preparation', 'preparation', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Application Submitted', 'application-submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Newspaper Advertisement', 'newspaper-advertisement', 2, '#fbbf24', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Traffic Commissioner Review', 'tc-review', 3, '#818cf8', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Objection Period', 'objection-period', 4, '#f59e0b', FALSE, FALSE, TRUE, 'fixed_days', 40, 'Decision Target'),
    (v_workflow_id, 'Decision', 'decision', 5, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Interim Licence', 'interim-licence', 6, '#14b8a6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Licence Issued', 'licence-issued', 7, '#22c55e', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Renewal Due', 'renewal-due', 8, '#f97316', FALSE, TRUE, TRUE, 'fixed_days', 1825, '5-Year Renewal');

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gambling - Gambling Act 2005
CREATE OR REPLACE FUNCTION create_default_gambling_workflow(p_firm_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO public.workflow_configs (firm_id, notice_type, name, description, is_active, is_default)
  VALUES (p_firm_id, 'gambling', 'Gambling Premises Licence', 'Standard workflow for Gambling Act 2005 applications', TRUE, TRUE)
  RETURNING id INTO v_workflow_id;

  INSERT INTO public.workflow_stages (workflow_id, name, slug, position, color, is_initial, is_terminal, has_deadline, deadline_type, deadline_days, deadline_name) VALUES
    (v_workflow_id, 'Operating Licence', 'operating-licence', 0, '#94a3b8', TRUE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Application Submitted', 'application-submitted', 1, '#60a5fa', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Notify Authorities', 'notify-authorities', 2, '#fbbf24', FALSE, FALSE, TRUE, 'fixed_days', 7, 'Authority Notification Deadline'),
    (v_workflow_id, 'Advertisement', 'advertisement', 3, '#f59e0b', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Consultation', 'consultation', 4, '#818cf8', FALSE, FALSE, TRUE, 'fixed_days', 28, 'Consultation End'),
    (v_workflow_id, 'Representations', 'representations', 5, '#f97316', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Determination', 'determination', 6, '#a855f7', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Decision', 'decision', 7, '#8b5cf6', FALSE, FALSE, FALSE, NULL, NULL, NULL),
    (v_workflow_id, 'Appeal Period', 'appeal-period', 8, '#ef4444', FALSE, FALSE, TRUE, 'fixed_days', 21, 'Appeal Window Closes'),
    (v_workflow_id, 'Complete', 'complete', 9, '#22c55e', FALSE, TRUE, FALSE, NULL, NULL, NULL);

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_default_tro_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_gvol_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_gambling_workflow TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.12: Create transition_notice_stage function

Create migration file `supabase/migrations/[timestamp]_create_transition_notice_stage.sql`:

```sql
-- Function to transition a notice to a new workflow stage
-- Records history and calculates new deadline

CREATE OR REPLACE FUNCTION transition_notice_stage(
  p_notice_id UUID,
  p_to_stage_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_transition_type TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_workflow_status RECORD;
  v_new_stage RECORD;
  v_history_id UUID;
  v_new_deadline TIMESTAMPTZ;
BEGIN
  -- Get current workflow status
  SELECT * INTO v_workflow_status
  FROM public.notice_workflow_status
  WHERE notice_id = p_notice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No workflow status found for notice %', p_notice_id;
  END IF;

  -- Get new stage details
  SELECT * INTO v_new_stage
  FROM public.workflow_stages
  WHERE id = p_to_stage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stage % not found', p_to_stage_id;
  END IF;

  -- Validate stage belongs to same workflow
  IF v_new_stage.workflow_id != v_workflow_status.workflow_id THEN
    RAISE EXCEPTION 'Stage % does not belong to workflow %', p_to_stage_id, v_workflow_status.workflow_id;
  END IF;

  -- Calculate deadline if stage has one
  IF v_new_stage.has_deadline AND v_new_stage.deadline_type = 'fixed_days' THEN
    IF v_new_stage.deadline_working_days THEN
      -- Add working days (simple: skip weekends)
      v_new_deadline := NOW() + (v_new_stage.deadline_days * INTERVAL '1.4 day'); -- Rough estimate
    ELSE
      v_new_deadline := NOW() + (v_new_stage.deadline_days || ' days')::INTERVAL;
    END IF;
  END IF;

  -- Record history
  INSERT INTO public.workflow_stage_history (
    notice_id,
    workflow_status_id,
    from_stage_id,
    to_stage_id,
    transition_type,
    notes,
    transitioned_by,
    firm_id
  ) VALUES (
    p_notice_id,
    v_workflow_status.id,
    v_workflow_status.current_stage_id,
    p_to_stage_id,
    p_transition_type,
    p_notes,
    auth.uid(),
    v_workflow_status.firm_id
  ) RETURNING id INTO v_history_id;

  -- Update workflow status
  UPDATE public.notice_workflow_status
  SET
    current_stage_id = p_to_stage_id,
    entered_stage_at = NOW(),
    deadline_date = v_new_deadline,
    updated_at = NOW()
  WHERE id = v_workflow_status.id;

  -- TODO: Schedule deadline reminders if applicable

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION transition_notice_stage TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.13: Create initialize_notice_workflow function

Create migration file `supabase/migrations/[timestamp]_create_initialize_notice_workflow.sql`:

```sql
-- Function to initialize workflow for a newly published notice
-- Called when firm publishes a notice

CREATE OR REPLACE FUNCTION initialize_notice_workflow(
  p_notice_id UUID,
  p_firm_id UUID,
  p_notice_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_workflow_config RECORD;
  v_initial_stage RECORD;
  v_status_id UUID;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Find default workflow for this notice type for this firm
  SELECT * INTO v_workflow_config
  FROM public.workflow_configs
  WHERE firm_id = p_firm_id
    AND notice_type = p_notice_type
    AND is_active = TRUE
    AND is_default = TRUE
  LIMIT 1;

  -- If no firm-specific workflow, check if we should create one
  IF NOT FOUND THEN
    -- Create default workflow for this firm
    CASE p_notice_type
      WHEN 'premises-licence' THEN
        SELECT create_default_premises_licence_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'probate' THEN
        SELECT create_default_probate_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'planning' THEN
        SELECT create_default_planning_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'tro' THEN
        SELECT create_default_tro_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'gvol' THEN
        SELECT create_default_gvol_workflow(p_firm_id) INTO v_workflow_config.id;
      WHEN 'gambling' THEN
        SELECT create_default_gambling_workflow(p_firm_id) INTO v_workflow_config.id;
      ELSE
        -- Default to premises-licence workflow as fallback
        SELECT create_default_premises_licence_workflow(p_firm_id) INTO v_workflow_config.id;
    END CASE;

    -- Refresh to get the workflow
    SELECT * INTO v_workflow_config
    FROM public.workflow_configs
    WHERE id = v_workflow_config.id;
  END IF;

  -- Get initial stage
  SELECT * INTO v_initial_stage
  FROM public.workflow_stages
  WHERE workflow_id = v_workflow_config.id
    AND is_initial = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fall back to first stage by position
    SELECT * INTO v_initial_stage
    FROM public.workflow_stages
    WHERE workflow_id = v_workflow_config.id
    ORDER BY position ASC
    LIMIT 1;
  END IF;

  -- Calculate deadline if initial stage has one
  IF v_initial_stage.has_deadline AND v_initial_stage.deadline_type = 'fixed_days' THEN
    v_deadline := NOW() + (v_initial_stage.deadline_days || ' days')::INTERVAL;
  END IF;

  -- Create workflow status
  INSERT INTO public.notice_workflow_status (
    notice_id,
    workflow_id,
    current_stage_id,
    firm_id,
    entered_stage_at,
    deadline_date
  ) VALUES (
    p_notice_id,
    v_workflow_config.id,
    v_initial_stage.id,
    p_firm_id,
    NOW(),
    v_deadline
  ) RETURNING id INTO v_status_id;

  -- Record initial history entry
  INSERT INTO public.workflow_stage_history (
    notice_id,
    workflow_status_id,
    from_stage_id,
    to_stage_id,
    transition_type,
    notes,
    transitioned_by,
    firm_id
  ) VALUES (
    p_notice_id,
    v_status_id,
    NULL, -- No previous stage
    v_initial_stage.id,
    'system',
    'Workflow initialized',
    auth.uid(),
    p_firm_id
  );

  RETURN v_status_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION initialize_notice_workflow TO authenticated;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 8.14: Add firm_id and client_id columns to notices table

Create migration file `supabase/migrations/[timestamp]_add_firm_client_to_notices.sql`:

```sql
-- Add firm_id and client_id to notices table for Firm Portal integration
-- This links notices to the publishing firm and optionally to a client

-- Add columns if they don't exist
DO $$
BEGIN
  -- Add firm_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'firm_id'
  ) THEN
    ALTER TABLE public.notices
    ADD COLUMN firm_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;

  -- Add client_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notices'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.notices
    ADD COLUMN client_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notices_firm_id ON public.notices(firm_id);
CREATE INDEX IF NOT EXISTS idx_notices_client_id ON public.notices(client_id);
CREATE INDEX IF NOT EXISTS idx_notices_firm_client ON public.notices(firm_id, client_id);

-- Add comment
COMMENT ON COLUMN public.notices.firm_id IS 'The firm that published this notice (for Firm Portal users)';
COMMENT ON COLUMN public.notices.client_id IS 'The client this notice is for (optional, for Firm Portal users)';
```

**Verify**: Run `npm run typecheck` - should pass

---

## Phase 9: TypeScript Types (Firm Portal)

### Task 9.1: Create TypeScript types for workflow tables

Create file `src/types/workflow.ts`:

```typescript
// Workflow Types for Firm Portal

export interface FirmDepartment {
  id: string;
  firm_id: string;
  name: string;
  slug: string;
  description: string | null;
  default_notice_types: string[];
  color: string;
  icon: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WorkflowConfig {
  id: string;
  firm_id: string;
  department_id: string | null;
  notice_type: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  color: string;
  icon: string | null;
  is_initial: boolean;
  is_terminal: boolean;
  auto_transition_days: number | null;
  has_deadline: boolean;
  deadline_type: 'fixed_days' | 'calendar_date' | 'calculated' | null;
  deadline_days: number | null;
  deadline_working_days: boolean;
  deadline_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeWorkflowStatus {
  id: string;
  notice_id: string;
  workflow_id: string;
  current_stage_id: string;
  firm_id: string;
  entered_stage_at: string;
  deadline_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStageHistory {
  id: string;
  notice_id: string;
  workflow_status_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  transitioned_at: string;
  transitioned_by: string | null;
  transition_type: 'manual' | 'automatic' | 'system';
  notes: string | null;
  firm_id: string;
}

export interface DeadlineReminder {
  id: string;
  notice_id: string;
  workflow_status_id: string | null;
  firm_id: string;
  reminder_type: 'deadline_upcoming' | 'deadline_today' | 'deadline_overdue' | 'representation_received' | 'stage_reminder';
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  channel: 'email' | 'sms' | 'push';
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_user_id: string | null;
  subject: string | null;
  message: string | null;
  related_deadline_date: string | null;
  created_at: string;
  updated_at: string;
  sent_error: string | null;
}

export interface FirmNoticeTemplate {
  id: string;
  firm_id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  notice_type: string;
  template_data: Record<string, unknown>;
  is_active: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_used_at: string | null;
}

// Joined types for UI
export interface NoticeWithWorkflow {
  id: string;
  // ... notice fields
  workflow_status: NoticeWorkflowStatus | null;
  current_stage: WorkflowStage | null;
}

export interface WorkflowConfigWithStages extends WorkflowConfig {
  stages: WorkflowStage[];
}
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 9.2: Export workflow types from main types index

Update file `src/types/index.ts` to add:

```typescript
// Add at the end of the file
export * from './workflow';
```

**Verify**: Run `npm run typecheck` - should pass

---

## Phase 10: Backend API (Firm Portal Workflows)

### Task 10.1: Create workflow routes file

Create file `server/routes/workflow.ts`:

```typescript
import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/workflow/configs - Get all workflows for the user's firm
router.get('/configs', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('workflow_configs')
      .select(`
        *,
        stages:workflow_stages(*)
      `)
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('notice_type');

    if (error) throw error;

    // Sort stages by position
    const configs = data?.map(config => ({
      ...config,
      stages: config.stages?.sort((a: any, b: any) => a.position - b.position)
    }));

    res.json({ configs });
  } catch (error: any) {
    console.error('Error fetching workflow configs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflow/config/:noticeType - Get workflow for specific notice type
router.get('/config/:noticeType', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const { noticeType } = req.params;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('workflow_configs')
      .select(`
        *,
        stages:workflow_stages(*)
      `)
      .eq('firm_id', firmId)
      .eq('notice_type', noticeType)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      data.stages = data.stages?.sort((a: any, b: any) => a.position - b.position);
    }

    res.json({ config: data });
  } catch (error: any) {
    console.error('Error fetching workflow config:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflow/notice/:noticeId/status - Get workflow status for a notice
router.get('/notice/:noticeId/status', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { noticeId } = req.params;

    const { data, error } = await supabase
      .from('notice_workflow_status')
      .select(`
        *,
        current_stage:workflow_stages(*),
        workflow:workflow_configs(*)
      `)
      .eq('notice_id', noticeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ status: data });
  } catch (error: any) {
    console.error('Error fetching notice workflow status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflow/notice/:noticeId/transition - Transition notice to new stage
router.post('/notice/:noticeId/transition', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { noticeId } = req.params;
    const { toStageId, notes } = req.body;

    if (!toStageId) {
      return res.status(400).json({ error: 'toStageId is required' });
    }

    const { data, error } = await supabase.rpc('transition_notice_stage', {
      p_notice_id: noticeId,
      p_to_stage_id: toStageId,
      p_notes: notes || null,
      p_transition_type: 'manual'
    });

    if (error) throw error;

    // Fetch updated status
    const { data: status } = await supabase
      .from('notice_workflow_status')
      .select(`
        *,
        current_stage:workflow_stages(*),
        workflow:workflow_configs(*)
      `)
      .eq('notice_id', noticeId)
      .single();

    res.json({ historyId: data, status });
  } catch (error: any) {
    console.error('Error transitioning notice stage:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflow/notice/:noticeId/history - Get stage history for a notice
router.get('/notice/:noticeId/history', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { noticeId } = req.params;

    const { data, error } = await supabase
      .from('workflow_stage_history')
      .select(`
        *,
        from_stage:from_stage_id(name, color),
        to_stage:to_stage_id(name, color)
      `)
      .eq('notice_id', noticeId)
      .order('transitioned_at', { ascending: false });

    if (error) throw error;

    res.json({ history: data });
  } catch (error: any) {
    console.error('Error fetching stage history:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflow/initialize - Initialize workflow for a notice
router.post('/initialize', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { noticeId, noticeType } = req.body;
    const firmId = req.user?.organizationId;

    if (!noticeId || !noticeType) {
      return res.status(400).json({ error: 'noticeId and noticeType are required' });
    }

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase.rpc('initialize_notice_workflow', {
      p_notice_id: noticeId,
      p_firm_id: firmId,
      p_notice_type: noticeType
    });

    if (error) throw error;

    // Fetch the created status
    const { data: status } = await supabase
      .from('notice_workflow_status')
      .select(`
        *,
        current_stage:workflow_stages(*),
        workflow:workflow_configs(*)
      `)
      .eq('id', data)
      .single();

    res.json({ statusId: data, status });
  } catch (error: any) {
    console.error('Error initializing workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 10.2: Register workflow routes in server index

Update `server/index.ts` to add:

```typescript
// Add import at the top
import workflowRoutes from './routes/workflow.js';

// Add route registration (near other route registrations)
app.use('/api/workflow', workflowRoutes);
```

**Verify**: Run `npm run typecheck` and `npm run dev:server` - should start without errors

---

### Task 10.3: Create firm departments routes

Create file `server/routes/firmDepartments.ts`:

```typescript
import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/firm/departments - List all departments for user's firm
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('firm_departments')
      .select('*')
      .eq('firm_id', firmId)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    res.json({ departments: data });
  } catch (error: any) {
    console.error('Error fetching firm departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/firm/departments - Create a new department
router.post('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const userId = req.user?.id;
    const { name, description, defaultNoticeTypes, color, icon } = req.body;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
      .from('firm_departments')
      .insert({
        firm_id: firmId,
        name,
        slug,
        description: description || null,
        default_notice_types: defaultNoticeTypes || [],
        color: color || '#6366f1',
        icon: icon || 'folder',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ department: data });
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/firm/departments/:id - Update a department
router.put('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;
    const { name, description, defaultNoticeTypes, color, icon, status } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (description !== undefined) updates.description = description;
    if (defaultNoticeTypes !== undefined) updates.default_notice_types = defaultNoticeTypes;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('firm_departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ department: data });
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/firm/departments/:id - Archive a department
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;

    // Soft delete by setting status to archived
    const { error } = await supabase
      .from('firm_departments')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error archiving department:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 10.4: Register firm department routes in server index

Update `server/index.ts` to add:

```typescript
// Add import at the top
import firmDepartmentsRoutes from './routes/firmDepartments.js';

// Add route registration
app.use('/api/firm/departments', firmDepartmentsRoutes);
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 10.5: Create firm templates routes

Create file `server/routes/firmTemplates.ts`:

```typescript
import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/firm/templates - List all templates
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const { noticeType, departmentId } = req.query;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    let query = supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (noticeType) {
      query = query.eq('notice_type', noticeType);
    }
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ templates: data });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/firm/templates/:id - Get a single template
router.get('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ template: data });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/firm/templates - Create a new template
router.post('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const userId = req.user?.id;
    const { name, description, noticeType, templateData, departmentId, isShared } = req.body;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!name || !noticeType || !templateData) {
      return res.status(400).json({ error: 'name, noticeType, and templateData are required' });
    }

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .insert({
        firm_id: firmId,
        department_id: departmentId || null,
        name,
        description: description || null,
        notice_type: noticeType,
        template_data: templateData,
        is_shared: isShared !== false,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ template: data });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/firm/templates/:id - Update a template
router.put('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;
    const { name, description, templateData, isActive, isShared } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (templateData !== undefined) updates.template_data = templateData;
    if (isActive !== undefined) updates.is_active = isActive;
    if (isShared !== undefined) updates.is_shared = isShared;

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ template: data });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/firm/templates/:id/use - Record template usage
router.post('/:id/use', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;

    const { error } = await supabase.rpc('increment', {
      table_name: 'firm_notice_templates',
      row_id: id,
      column_name: 'usage_count',
      increment_by: 1
    });

    // If RPC doesn't exist, fall back to direct update
    if (error) {
      await supabase
        .from('firm_notice_templates')
        .update({
          usage_count: supabase.sql`usage_count + 1`,
          last_used_at: new Date().toISOString()
        })
        .eq('id', id);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording template usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/firm/templates/:id - Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;

    // Soft delete
    const { error } = await supabase
      .from('firm_notice_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 10.6: Register firm template routes in server index

Update `server/index.ts` to add:

```typescript
// Add import at the top
import firmTemplatesRoutes from './routes/firmTemplates.js';

// Add route registration
app.use('/api/firm/templates', firmTemplatesRoutes);
```

**Verify**: Run `npm run typecheck` - should pass

---

## Phase 11: Firm Portal UI Enhancements

### Task 11.1: Create useWorkflow hook

Create file `src/hooks/useWorkflow.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { WorkflowConfig, WorkflowStage, NoticeWorkflowStatus } from '@/types/workflow';

interface WorkflowConfigWithStages extends WorkflowConfig {
  stages: WorkflowStage[];
}

export function useWorkflow(firmId: string | undefined) {
  const [configs, setConfigs] = useState<WorkflowConfigWithStages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    if (!firmId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/workflow/configs');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, loading, error, refetch: fetchConfigs };
}

export function useNoticeWorkflow(noticeId: string | undefined) {
  const [status, setStatus] = useState<NoticeWorkflowStatus | null>(null);
  const [currentStage, setCurrentStage] = useState<WorkflowStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!noticeId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/workflow/notice/${noticeId}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data.status);
      setCurrentStage(data.status?.current_stage || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  const transitionToStage = useCallback(async (toStageId: string, notes?: string) => {
    if (!noticeId) return;

    try {
      const response = await fetch(`/api/workflow/notice/${noticeId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStageId, notes })
      });
      if (!response.ok) throw new Error('Failed to transition stage');
      const data = await response.json();
      setStatus(data.status);
      setCurrentStage(data.status?.current_stage || null);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [noticeId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, currentStage, loading, error, refetch: fetchStatus, transitionToStage };
}
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.2: Create WorkflowStageBadge component

Create file `src/components/firm/WorkflowStageBadge.tsx`:

```typescript
import { WorkflowStage } from '@/types/workflow';

interface WorkflowStageBadgeProps {
  stage: WorkflowStage | null;
  isOverdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkflowStageBadge({ stage, isOverdue = false, size = 'md' }: WorkflowStageBadgeProps) {
  if (!stage) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        No workflow
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  // Convert hex color to Tailwind-like styling
  const bgStyle = { backgroundColor: `${stage.color}20` }; // 20 = 12.5% opacity
  const textStyle = { color: stage.color };
  const borderStyle = isOverdue ? { borderColor: '#ef4444', borderWidth: '2px' } : {};

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ ...bgStyle, ...borderStyle }}
    >
      {stage.icon && (
        <span className="mr-1" style={textStyle}>
          {/* Icon would go here */}
        </span>
      )}
      <span style={textStyle}>{stage.name}</span>
      {isOverdue && (
        <span className="ml-1 text-red-500">!</span>
      )}
    </span>
  );
}
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.3: Create KanbanBoard component

Create file `src/components/firm/KanbanBoard.tsx`:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkflowStage, NoticeWorkflowStatus } from '@/types/workflow';

interface Notice {
  id: string;
  title?: string;
  premises?: { name?: string; address?: string };
  applicant?: { name?: string };
  created_at: string;
  workflow_status?: NoticeWorkflowStatus;
  client?: { name: string };
}

interface KanbanBoardProps {
  stages: WorkflowStage[];
  notices: Notice[];
  onDragEnd?: (noticeId: string, toStageId: string) => void;
  firmSlug: string;
}

export function KanbanBoard({ stages, notices, onDragEnd, firmSlug }: KanbanBoardProps) {
  const [draggedNoticeId, setDraggedNoticeId] = useState<string | null>(null);

  const getNoticesForStage = (stageId: string) => {
    return notices.filter(n => n.workflow_status?.current_stage_id === stageId);
  }

  const handleDragStart = (e: React.DragEvent, noticeId: string) => {
    setDraggedNoticeId(noticeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedNoticeId && onDragEnd) {
      onDragEnd(draggedNoticeId, stageId);
    }
    setDraggedNoticeId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageNotices = getNoticesForStage(stage.id);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column Header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-t-lg"
              style={{ backgroundColor: `${stage.color}20` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-medium text-gray-900">{stage.name}</h3>
              </div>
              <span className="text-sm text-gray-500">{stageNotices.length}</span>
            </div>

            {/* Column Content */}
            <div className="bg-gray-50 rounded-b-lg p-2 min-h-[200px] space-y-2">
              {stageNotices.map((notice) => (
                <div
                  key={notice.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, notice.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow"
                >
                  <Link
                    to={`/f/${firmSlug}/notices/${notice.id}`}
                    className="block"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {notice.premises?.name || notice.title || 'Untitled Notice'}
                    </p>
                    {notice.applicant?.name && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {notice.applicant.name}
                      </p>
                    )}
                    {notice.client?.name && (
                      <p className="text-xs text-indigo-600 truncate mt-1">
                        {notice.client.name}
                      </p>
                    )}
                    {notice.workflow_status?.is_overdue && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        Overdue
                      </span>
                    )}
                    {notice.workflow_status?.deadline_date && !notice.workflow_status?.is_overdue && (
                      <p className="text-xs text-gray-400 mt-2">
                        Due: {new Date(notice.workflow_status.deadline_date).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                </div>
              ))}

              {stageNotices.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notices
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.4: Update Firm Notices page with Kanban view toggle

Update file `src/pages/firm/Notices.tsx` to add:
- Import the KanbanBoard component
- Add view toggle state (list/kanban/calendar)
- Fetch workflow data alongside notices
- Render appropriate view based on toggle

This task modifies an existing file. Add the following:

1. Add imports:
```typescript
import { useState } from 'react';
import { KanbanBoard } from '@/components/firm/KanbanBoard';
import { useWorkflow, useNoticeWorkflow } from '@/hooks/useWorkflow';
```

2. Add view state:
```typescript
const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
```

3. Add workflow data fetch and render logic for Kanban view

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.5: Create Templates management page

Create file `src/pages/firm/Templates.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FirmNoticeTemplate } from '@/types/workflow';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface ContextType {
  firm: Organization;
  userRole: string;
}

export default function Templates() {
  const { firm, userRole } = useOutletContext<ContextType>();
  const { firmSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<FirmNoticeTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FirmNoticeTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [firm.id]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/firm/templates');
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/firm/templates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete template');
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Templates</h1>
          <p className="text-gray-600">Save and reuse notice templates for faster publishing</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Create Template
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
          <p className="text-gray-500 mt-2">
            Create a template to speed up notice creation
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.notice_type.replace(/-/g, ' ')}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  Used {template.usage_count} times
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowModal(true);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.6: Add Templates route to App.tsx

Update `src/App.tsx` to add the Templates route:

```typescript
// Add import
import Templates from '@/pages/firm/Templates';

// Add route inside firm layout routes
<Route path="templates" element={<Templates />} />
```

**Verify**: Run `npm run typecheck` - should pass

---

### Task 11.7: Add Templates link to FirmLayout sidebar

Update `src/pages/firm/FirmLayout.tsx` to add a Templates navigation item in the sidebar.

Look for the existing navigation items (Dashboard, Notices, Clients, etc.) and add:

```typescript
{
  name: 'Templates',
  href: `/f/${firmSlug}/templates`,
  icon: DocumentDuplicateIcon, // from @heroicons/react/24/outline
  current: location.pathname.includes('/templates')
}
```

**Verify**: Run `npm run typecheck` - should pass

---

## Phase 12: Notification System (Preview)

### Task 12.1: Create email service for deadline reminders

Create file `server/services/deadlineNotifications.ts`:

```typescript
import { sendEmail } from './email.js';
import { getServiceSupabaseClient } from '../lib/supabase.js';

interface DeadlineReminder {
  id: string;
  notice_id: string;
  firm_id: string;
  recipient_email: string;
  subject: string;
  message: string;
  related_deadline_date: string;
  reminder_type: string;
}

export async function processDeadlineReminders() {
  const supabase = getServiceSupabaseClient();

  // Get pending reminders that are due
  const { data: reminders, error } = await supabase
    .from('deadline_reminders')
    .select(`
      *,
      notice:notices(id, title, premises)
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (error) {
    console.error('Error fetching reminders:', error);
    return;
  }

  for (const reminder of reminders || []) {
    try {
      // Send the email
      await sendEmail({
        to: reminder.recipient_email,
        subject: reminder.subject || `Deadline Reminder: ${reminder.notice?.title || 'Notice'}`,
        html: generateReminderEmailHtml(reminder),
      });

      // Mark as sent
      await supabase
        .from('deadline_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

    } catch (err: any) {
      console.error(`Error sending reminder ${reminder.id}:`, err);

      // Mark as failed
      await supabase
        .from('deadline_reminders')
        .update({
          status: 'failed',
          sent_error: err.message
        })
        .eq('id', reminder.id);
    }
  }
}

function generateReminderEmailHtml(reminder: any): string {
  const deadlineDate = reminder.related_deadline_date
    ? new Date(reminder.related_deadline_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'soon';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .deadline { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Deadline Reminder</h1>
        </div>
        <div class="content">
          <p>This is a reminder about an upcoming deadline:</p>

          <div class="deadline">
            <strong>Notice:</strong> ${reminder.notice?.premises?.name || reminder.notice?.title || 'Notice'}<br>
            <strong>Deadline:</strong> ${deadlineDate}
          </div>

          <p>${reminder.message || 'Please ensure all required actions are completed before the deadline.'}</p>

          <a href="${process.env.VITE_APP_URL || 'https://civicnotices.uk'}/f/notices/${reminder.notice_id}" class="button">
            View Notice
          </a>
        </div>
        <div class="footer">
          <p>Civic Notices Platform</p>
          <p>You received this email because you have notifications enabled for deadline reminders.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to schedule reminders for a stage transition
export async function scheduleDeadlineReminders(
  noticeId: string,
  firmId: string,
  deadlineDate: string,
  stageName: string
) {
  const supabase = getServiceSupabaseClient();

  // Get firm admin emails for notifications
  const { data: members } = await supabase
    .from('organization_memberships')
    .select('user_id, profiles:user_id(email)')
    .eq('organization_id', firmId)
    .in('role', ['owner', 'admin']);

  const emails = members?.map(m => (m.profiles as any)?.email).filter(Boolean) || [];

  if (emails.length === 0) return;

  const deadline = new Date(deadlineDate);

  // Schedule reminders: 7 days before, 3 days before, 1 day before, day of
  const reminderDays = [7, 3, 1, 0];

  for (const daysBefore of reminderDays) {
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    // Don't schedule reminders in the past
    if (reminderDate < new Date()) continue;

    for (const email of emails) {
      await supabase.from('deadline_reminders').insert({
        notice_id: noticeId,
        firm_id: firmId,
        reminder_type: daysBefore === 0 ? 'deadline_today' : 'deadline_upcoming',
        scheduled_for: reminderDate.toISOString(),
        channel: 'email',
        recipient_email: email,
        subject: `${daysBefore === 0 ? 'TODAY' : `${daysBefore} days`}: ${stageName} deadline`,
        related_deadline_date: deadlineDate
      });
    }
  }
}
```

**Verify**: Run `npm run typecheck` - should pass

---

## Phase 15: Rigorous Browser E2E Testing

This phase adds comprehensive browser-based end-to-end tests that simulate real user journeys through the Firm Portal. Tests are written from the perspective of actual users who would be using each feature.

### Task 15.1: Create Playwright E2E test fixtures for multi-role auth

Create file `e2e/fixtures/firm-auth.ts`:

```typescript
import { test as base, expect } from '@playwright/test';
import path from 'path';

// Define user roles for firm portal testing
export type FirmRole = 'owner' | 'admin' | 'editor' | 'viewer';

interface FirmUser {
  email: string;
  password: string;
  role: FirmRole;
  firmSlug: string;
}

// Test users representing actual personas
const firmUsers: Record<FirmRole, FirmUser> = {
  owner: {
    email: 'owner@wilsonpartners.com',
    password: 'testpass123',
    role: 'owner',
    firmSlug: 'wilson-partners'
  },
  admin: {
    email: 'admin@wilsonpartners.com',
    password: 'testpass123',
    role: 'admin',
    firmSlug: 'wilson-partners'
  },
  editor: {
    email: 'editor@wilsonpartners.com',
    password: 'testpass123',
    role: 'editor',
    firmSlug: 'wilson-partners'
  },
  viewer: {
    email: 'viewer@wilsonpartners.com',
    password: 'testpass123',
    role: 'viewer',
    firmSlug: 'wilson-partners'
  }
};

// Extend base test to include role-based authentication
export const test = base.extend<{
  firmOwner: FirmUser;
  firmAdmin: FirmUser;
  firmEditor: FirmUser;
  firmViewer: FirmUser;
}>({
  firmOwner: firmUsers.owner,
  firmAdmin: firmUsers.admin,
  firmEditor: firmUsers.editor,
  firmViewer: firmUsers.viewer
});

// Auth state storage for session reuse
export async function saveAuthState(page: any, user: FirmUser) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`/f/${user.firmSlug}/**`);

  // Save storage state
  const storageStatePath = path.join(__dirname, `.auth/${user.role}.json`);
  await page.context().storageState({ path: storageStatePath });
  return storageStatePath;
}

export { expect };
```

**Verify**: File exists and TypeScript compiles

---

### Task 15.2: Firm Owner - Complete workflow management journey

Create file `e2e/firm-portal/owner-workflow-management.spec.ts`:

```typescript
import { test, expect } from '../fixtures/firm-auth';

/**
 * USER PERSPECTIVE: Firm Owner (Sarah, Managing Partner at Wilson Partners)
 *
 * Sarah is the owner of Wilson Partners LLP. She needs to:
 * 1. Set up her firm's workflow stages for licensing applications
 * 2. Create departments for different practice areas
 * 3. Invite team members with appropriate roles
 * 4. Configure notification settings
 * 5. Verify billing is set up correctly
 */

test.describe('Firm Owner: Workflow Management', () => {
  test.use({ storageState: '.auth/owner.json' });

  test.beforeEach(async ({ page, firmOwner }) => {
    await page.goto(`/f/${firmOwner.firmSlug}/settings`);
  });

  test('can create a new department for practice area', async ({ page }) => {
    // Sarah wants to create a Licensing department
    await page.click('[data-testid="departments-tab"]');
    await page.click('[data-testid="create-department-button"]');

    // Fill in department details as Sarah would
    await page.fill('[data-testid="dept-name"]', 'Licensing');
    await page.fill('[data-testid="dept-description"]', 'Premises and personal licences');
    await page.selectOption('[data-testid="dept-color"]', '#6366f1');
    await page.click('[data-testid="save-department"]');

    // Verify department appears in the list
    await expect(page.locator('[data-testid="department-list"]')).toContainText('Licensing');
  });

  test('can configure workflow stages for premises licence', async ({ page }) => {
    // Sarah needs to customize the workflow for her firm
    await page.click('[data-testid="workflows-tab"]');
    await page.click('[data-testid="premises-licence-workflow"]');

    // She adds a "Client Review" stage after "Draft"
    await page.click('[data-testid="add-stage-button"]');
    await page.fill('[data-testid="stage-name"]', 'Client Review');
    await page.fill('[data-testid="stage-position"]', '1');
    await page.click('[data-testid="save-stage"]');

    // Verify the new stage appears in the workflow
    const stages = page.locator('[data-testid="workflow-stage"]');
    await expect(stages.nth(1)).toContainText('Client Review');
  });

  test('can invite a new team member with editor role', async ({ page }) => {
    await page.goto(`/f/wilson-partners/team`);
    await page.click('[data-testid="invite-member-button"]');

    // Invite a new paralegal
    await page.fill('[data-testid="invite-email"]', 'paralegal@wilsonpartners.com');
    await page.selectOption('[data-testid="invite-role"]', 'editor');
    await page.click('[data-testid="send-invite"]');

    // Verify invitation was sent
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invites"]')).toContainText('paralegal@wilsonpartners.com');
  });

  test('can view and manage billing settings', async ({ page, firmOwner }) => {
    await page.goto(`/f/${firmOwner.firmSlug}/billing`);

    // Verify subscription details are visible
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Active');
    await expect(page.locator('[data-testid="monthly-fee"]')).toContainText('£49');

    // Sarah can access the Stripe billing portal
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-testid="manage-billing-button"]')
    ]);

    // Verify redirect to Stripe
    await expect(newPage.url()).toContain('stripe.com');
  });
});
```

**Verify**: Run `npx playwright test e2e/firm-portal/owner-workflow-management.spec.ts`

---

### Task 15.3: Firm Editor - Kanban board and notice workflow journey

Create file `e2e/firm-portal/editor-kanban-workflow.spec.ts`:

```typescript
import { test, expect } from '../fixtures/firm-auth';

/**
 * USER PERSPECTIVE: Firm Editor (Tom, Licensing Consultant)
 *
 * Tom is a licensing consultant at Wilson Partners. His daily work involves:
 * 1. Viewing his assigned notices on the Kanban board
 * 2. Dragging notices between workflow stages
 * 3. Creating new notices from templates
 * 4. Tracking deadlines
 * 5. Adding notes when transitioning stages
 */

test.describe('Firm Editor: Kanban Board Workflow', () => {
  test.use({ storageState: '.auth/editor.json' });

  test('can view notices on Kanban board grouped by workflow stage', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');

    // Tom switches to Kanban view
    await page.click('[data-testid="view-toggle-kanban"]');

    // Verify all workflow stages are visible as columns
    const stageColumns = page.locator('[data-testid="kanban-column"]');
    await expect(stageColumns).toHaveCount(6); // Draft, Submitted, Advertising, Consultation, Decision, Complete

    // Verify notices appear in their correct stages
    const draftColumn = page.locator('[data-testid="kanban-column-draft"]');
    await expect(draftColumn.locator('[data-testid="notice-card"]')).toHaveCountGreaterThan(0);
  });

  test('can drag notice from Draft to Submitted stage', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-kanban"]');

    // Tom drags the first notice from Draft to Submitted
    const noticeCard = page.locator('[data-testid="kanban-column-draft"] [data-testid="notice-card"]').first();
    const noticeTitle = await noticeCard.locator('[data-testid="notice-title"]').textContent();
    const submittedColumn = page.locator('[data-testid="kanban-column-submitted"]');

    // Perform drag and drop
    await noticeCard.dragTo(submittedColumn);

    // Verify the notice moved to Submitted column
    await expect(submittedColumn).toContainText(noticeTitle!);

    // Verify transition modal appears for notes
    await expect(page.locator('[data-testid="transition-modal"]')).toBeVisible();
    await page.fill('[data-testid="transition-notes"]', 'Application reviewed and complete');
    await page.click('[data-testid="confirm-transition"]');

    // Verify success notification
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Stage updated');
  });

  test('can use keyboard to navigate and move notices on Kanban', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-kanban"]');

    // Tom uses keyboard for accessibility
    await page.keyboard.press('Tab'); // Focus first notice
    await page.keyboard.press('Space'); // Pick up notice
    await page.keyboard.press('ArrowRight'); // Move to next column
    await page.keyboard.press('Space'); // Drop notice

    // Verify ARIA announcement
    await expect(page.locator('[role="alert"]')).toContainText('moved to');
  });

  test('can create notice from template', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices/new');

    // Tom selects a saved template
    await page.click('[data-testid="use-template-button"]');
    await page.click('[data-testid="template-standard-pub"]');

    // Verify form is pre-filled with template data
    await expect(page.locator('[data-testid="premises-name"]')).toHaveValue(/The Red Lion/);
    await expect(page.locator('[data-testid="notice-type"]')).toHaveValue('premises-licence');
  });

  test('can see deadline warnings on overdue notices', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-kanban"]');

    // Verify overdue notices have visual indicator
    const overdueNotice = page.locator('[data-testid="notice-card"][data-overdue="true"]').first();
    await expect(overdueNotice).toBeVisible();
    await expect(overdueNotice.locator('[data-testid="overdue-badge"]')).toContainText('Overdue');
  });
});
```

**Verify**: Run `npx playwright test e2e/firm-portal/editor-kanban-workflow.spec.ts`

---

### Task 15.4: Firm Viewer - Read-only access verification

Create file `e2e/firm-portal/viewer-readonly-access.spec.ts`:

```typescript
import { test, expect } from '../fixtures/firm-auth';

/**
 * USER PERSPECTIVE: Firm Viewer (Lisa, Trainee Solicitor)
 *
 * Lisa is a trainee at Wilson Partners. She can:
 * 1. View all notices in the portal
 * 2. See workflow status and history
 * 3. Access client information for context
 *
 * She CANNOT:
 * 1. Create or edit notices
 * 2. Move notices between stages
 * 3. Modify settings or invite users
 * 4. Delete anything
 */

test.describe('Firm Viewer: Read-Only Access Verification', () => {
  test.use({ storageState: '.auth/viewer.json' });

  test('can view notices but cannot create new ones', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');

    // Lisa can see the notices list
    await expect(page.locator('[data-testid="notices-list"]')).toBeVisible();

    // But the "Create Notice" button is not visible or disabled
    const createButton = page.locator('[data-testid="create-notice-button"]');
    await expect(createButton).toBeHidden();
  });

  test('can view Kanban board but cannot drag notices', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-kanban"]');

    // Lisa can see the board
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();

    // But notices are not draggable (no cursor-move class)
    const noticeCard = page.locator('[data-testid="notice-card"]').first();
    await expect(noticeCard).not.toHaveAttribute('draggable', 'true');
  });

  test('can view notice details but cannot edit', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="notice-card"]').first();

    // Lisa can see notice details
    await expect(page.locator('[data-testid="notice-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="workflow-history"]')).toBeVisible();

    // But edit buttons are hidden
    await expect(page.locator('[data-testid="edit-notice-button"]')).toBeHidden();
    await expect(page.locator('[data-testid="transition-stage-button"]')).toBeHidden();
  });

  test('cannot access settings or team management', async ({ page }) => {
    // Lisa tries to access settings directly
    await page.goto('/f/wilson-partners/settings');

    // She should be redirected or see access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    // OR verify redirect
    // await expect(page).toHaveURL('/f/wilson-partners/notices');
  });

  test('can view client list but cannot modify', async ({ page }) => {
    await page.goto('/f/wilson-partners/clients');

    // Lisa can see clients
    await expect(page.locator('[data-testid="clients-list"]')).toBeVisible();

    // But cannot add or edit
    await expect(page.locator('[data-testid="add-client-button"]')).toBeHidden();
  });
});
```

**Verify**: Run `npx playwright test e2e/firm-portal/viewer-readonly-access.spec.ts`

---

### Task 15.5: Multi-tenant isolation - Firm A cannot see Firm B data

Create file `e2e/firm-portal/multi-tenant-isolation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

/**
 * SECURITY TEST: Multi-Tenant Isolation
 *
 * Scenario: Two competing law firms use the platform:
 * - Wilson Partners (firm A)
 * - Smith & Co Solicitors (firm B)
 *
 * CRITICAL REQUIREMENT: Firm A users must NEVER see Firm B data.
 * This includes notices, clients, team members, and workflow configs.
 */

test.describe('Multi-Tenant Isolation: Cross-Firm Data Access Prevention', () => {

  test('Firm A user cannot access Firm B notices via direct URL', async ({ page }) => {
    // Login as Wilson Partners user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'editor@wilsonpartners.com');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/f/wilson-partners/**');

    // Try to access Smith & Co notice directly
    await page.goto('/f/smith-co/notices/some-notice-id');

    // Should see 403 or redirect to own firm
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    // OR
    // await expect(page).toHaveURL('/f/wilson-partners/notices');
  });

  test('Firm A user cannot see Firm B clients in API response', async ({ page, request }) => {
    // Login as Wilson Partners user and get session
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@wilsonpartners.com');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/f/wilson-partners/**');

    // Make API request to fetch clients
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/firm/clients');
      return res.json();
    });

    // Verify no Smith & Co clients in response
    for (const client of response.clients) {
      expect(client.firm_id).not.toEqual('smith-co-firm-id');
      expect(client.firm?.name).not.toContain('Smith');
    }
  });

  test('Kanban board only shows own firm notices', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'editor@wilsonpartners.com');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/f/wilson-partners/**');

    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-kanban"]');

    // Get all notice cards
    const noticeCards = page.locator('[data-testid="notice-card"]');
    const count = await noticeCards.count();

    for (let i = 0; i < count; i++) {
      const firmBadge = noticeCards.nth(i).locator('[data-testid="firm-badge"]');
      // If firm badge exists, it should only show Wilson Partners
      if (await firmBadge.isVisible()) {
        await expect(firmBadge).toContainText('Wilson Partners');
      }
    }
  });

  test('workflow configs are firm-specific', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@wilsonpartners.com');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/f/wilson-partners/**');

    await page.goto('/f/wilson-partners/settings');
    await page.click('[data-testid="workflows-tab"]');

    // Verify only Wilson Partners workflows are shown
    const workflowConfigs = page.locator('[data-testid="workflow-config"]');
    const count = await workflowConfigs.count();

    for (let i = 0; i < count; i++) {
      const firmName = workflowConfigs.nth(i).locator('[data-testid="config-firm"]');
      if (await firmName.isVisible()) {
        await expect(firmName).toContainText('Wilson Partners');
      }
    }
  });
});
```

**Verify**: Run `npx playwright test e2e/firm-portal/multi-tenant-isolation.spec.ts`

---

### Task 15.6: Deadline notifications and calendar integration tests

Create file `e2e/firm-portal/deadline-calendar-tests.spec.ts`:

```typescript
import { test, expect } from '../fixtures/firm-auth';

/**
 * USER PERSPECTIVE: All firm users checking deadlines
 *
 * Users need to:
 * 1. See upcoming deadlines in calendar view
 * 2. Receive visual warnings for approaching deadlines
 * 3. View deadline history for notices
 * 4. See consultation end dates clearly marked
 */

test.describe('Deadline Tracking and Calendar View', () => {
  test.use({ storageState: '.auth/editor.json' });

  test('calendar view shows all notice deadlines', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-calendar"]');

    // Verify calendar is rendered
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

    // Verify deadlines appear on calendar
    const deadlineEvents = page.locator('[data-testid="calendar-event"]');
    await expect(deadlineEvents).toHaveCountGreaterThan(0);
  });

  test('clicking deadline in calendar opens notice details', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="view-toggle-calendar"]');

    // Click on a deadline event
    await page.click('[data-testid="calendar-event"]').first();

    // Verify notice details modal/page opens
    await expect(page.locator('[data-testid="notice-details"]')).toBeVisible();
  });

  test('deadlines within 3 days show warning styling', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');

    // Find notices with upcoming deadlines
    const urgentDeadlines = page.locator('[data-testid="deadline-warning"]');

    if (await urgentDeadlines.count() > 0) {
      // Verify they have warning styling (orange/red background)
      const firstUrgent = urgentDeadlines.first();
      await expect(firstUrgent).toHaveClass(/bg-orange|bg-amber|text-red/);
    }
  });

  test('deadline history shows all stage transitions with dates', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');
    await page.click('[data-testid="notice-card"]').first();

    // Open workflow history panel
    await page.click('[data-testid="show-history-button"]');

    // Verify history entries with dates
    const historyEntries = page.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCountGreaterThan(0);

    // Each entry should have a date
    const firstEntry = historyEntries.first();
    await expect(firstEntry.locator('[data-testid="entry-date"]')).toBeVisible();
  });
});
```

**Verify**: Run `npx playwright test e2e/firm-portal/deadline-calendar-tests.spec.ts`

---

### Task 15.7: Update Playwright configuration for Firm Portal tests

Update `playwright.config.ts` to add firm portal test project:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    // Setup project to create auth states
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Firm Portal tests with Chrome
    {
      name: 'firm-portal-chromium',
      testDir: './e2e/firm-portal',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    // Firm Portal tests with Firefox
    {
      name: 'firm-portal-firefox',
      testDir: './e2e/firm-portal',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    // Mobile Safari for responsive testing
    {
      name: 'firm-portal-mobile',
      testDir: './e2e/firm-portal',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup']
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
```

**Verify**: Run `npx playwright test --list` to see all tests

---

### Task 15.8: Create global E2E setup for auth state persistence

Create file `e2e/global.setup.ts`:

```typescript
import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const users = [
  { email: 'owner@wilsonpartners.com', password: 'testpass123', role: 'owner', firmSlug: 'wilson-partners' },
  { email: 'admin@wilsonpartners.com', password: 'testpass123', role: 'admin', firmSlug: 'wilson-partners' },
  { email: 'editor@wilsonpartners.com', password: 'testpass123', role: 'editor', firmSlug: 'wilson-partners' },
  { email: 'viewer@wilsonpartners.com', password: 'testpass123', role: 'viewer', firmSlug: 'wilson-partners' }
];

async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');

  // Create auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();

  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173/login');
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', user.password);
      await page.click('[data-testid="login-button"]');

      // Wait for successful login
      await page.waitForURL(`/f/${user.firmSlug}/**`, { timeout: 30000 });

      // Save auth state
      await context.storageState({ path: path.join(authDir, `${user.role}.json`) });
      console.log(`✓ Created auth state for ${user.role}`);
    } catch (error) {
      console.error(`✗ Failed to create auth state for ${user.role}:`, error);
      throw error;
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

export default globalSetup;
```

**Verify**: Run `npx playwright test --project=setup`

---

**Verify**: Run `npm run typecheck` - should pass

---

## Summary

This plan adds 58+ atomic tasks to the PRD.md for implementing the comprehensive Firm Portal feature:

### Phases Added:
- **Phase 8**: Database Schema (14 tasks) - Tables for workflows, stages, templates, reminders
- **Phase 9**: TypeScript Types (2 tasks) - Type definitions for all new tables
- **Phase 10**: Backend API (6 tasks) - REST endpoints for workflow and template management
- **Phase 11**: Firm Portal UI (7 tasks) - Kanban board, templates page, workflow hooks
- **Phase 12**: Notification System (1 task preview) - Email reminder service
- **Phase 15**: Rigorous Browser E2E Testing (8 tasks) - User-centric Playwright tests for all personas

### Key Integration Points Addressed:
1. **Notices ↔ Firms**: Added `firm_id` and `client_id` columns to notices
2. **Notices ↔ Workflow**: `notice_workflow_status` tracks stage per notice
3. **Workflow Stages**: Based on researched stages from todo.md
4. **RLS Security**: Every table has policies for firm-only access

### Dependencies in Order:
1. Tables (Phase 8) - Must come first
2. Types (Phase 9) - Reference tables
3. API (Phase 10) - Uses tables and types
4. UI (Phase 11) - Consumes API
5. E2E Tests (Phase 15) - Validates all features end-to-end

---

## Acceptance Criteria

### Core Functionality
- [ ] All Phase 8 migrations apply successfully
- [ ] TypeScript types compile without errors
- [ ] API endpoints return correct data
- [ ] Kanban board displays notices by stage
- [ ] Drag-and-drop transitions notices
- [ ] Templates can be saved and reused
- [ ] Deadline reminders are scheduled

### Browser E2E Testing (Phase 15)
- [ ] Firm Owner can create departments and manage workflow stages
- [ ] Firm Editor can drag notices on Kanban board with stage transitions
- [ ] Firm Viewer has read-only access (cannot create, edit, or delete)
- [ ] Keyboard navigation works for Kanban board (accessibility)
- [ ] Multi-tenant isolation: Firm A cannot see Firm B's data
- [ ] Calendar view displays all upcoming deadlines
- [ ] All E2E tests pass on Chromium, Firefox, and Mobile Safari

### Security Verification
- [ ] RLS policies prevent cross-firm data access
- [ ] SECURITY DEFINER functions validate caller membership
- [ ] Role hierarchy enforced (owner > admin > editor > viewer)
- [ ] Audit logs are immutable

---

## References

- Existing migrations: `supabase/migrations/20260114000005_firm_subscriptions.sql`
- Existing migrations: `supabase/migrations/20260114000010_client_management.sql`
- Workflow research: `/todo.md` (lines 17-127)
- Firm pages: `src/pages/firm/`
- Auth context: `src/contexts/UnifiedAuthContext.tsx`
