# Implementation Roadmap
## Phase-by-Phase Build Plan

[← Back to Index](./00-INDEX.md) | [Previous: Functional Requirements](./10-functional-requirements.md)

---

## ⚠️ CRITICAL - START HERE

This is your **step-by-step implementation plan**. Follow these phases in order. Each phase builds on the previous.

**Estimated Timeline**: 3-6 months (depending on team size and velocity)
**Team**: 2-3 developers recommended
**Complexity**: Medium-Large

---

## Phase 0: Foundation & Setup (Week 1)

**Goal**: Set up development environment and core infrastructure

### Tasks

**1. Repository & Environment Setup**
- ✅ Already done: Project exists in ubiquitous-guacamole
- Review existing codebase structure
- Ensure all dependencies up to date: `npm install`
- Verify Vite, React 19.x, TypeScript strict mode

**2. Supabase Configuration**
- Create new Supabase project (or use existing)
- Note connection credentials
- Update `.env` with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side)

**3. Development Tools**
- Set up database migration tool (Supabase CLI)
- Configure linting and formatting (already in place)
- Set up Git workflow (feature branches, PRs)

**4. Documentation Review**
- Read all architecture docs in `/docs/architecture/`
- Understand department-level isolation model
- Review permission matrices

**Deliverable**: Development environment ready, Supabase connected

**Estimated Time**: 3-5 days

---

## Phase 1: Database Foundation (Weeks 2-3)

**Goal**: Build complete database schema with RLS policies

### Tasks

**1. Create Core Tables** (in order of dependencies)

**Step 1.1**: Organizations table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('council', 'firm')),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended', 'archived')),
  registration_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address JSONB,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_domain ON organizations(domain);
CREATE INDEX idx_orgs_status ON organizations(status);
CREATE INDEX idx_orgs_type ON organizations(type);
```

**Step 1.2**: Departments table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('licensing', 'planning', 'traffic', 'environmental_health', 'building_control', 'other')),
  email TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  settings JSONB DEFAULT '{
    "default_representation_period_days": 28,
    "require_approval_for_publication": false,
    "allowed_notice_types": []
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT unique_org_slug UNIQUE (organization_id, slug),
  CONSTRAINT council_only CHECK (
    (SELECT type FROM organizations WHERE id = organization_id) = 'council'
  )
);

CREATE UNIQUE INDEX idx_depts_org_slug ON departments(organization_id, slug);
CREATE INDEX idx_depts_org_status ON departments(organization_id, status);
CREATE INDEX idx_depts_type ON departments(type);
```

**Step 1.3**: Organization Memberships
```sql
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'org_admin')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

CREATE UNIQUE INDEX idx_org_members_unique ON organization_memberships(organization_id, user_id);
CREATE INDEX idx_org_members_user ON organization_memberships(user_id);
```

**Step 1.4**: Department Memberships
```sql
CREATE TABLE department_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('department_admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_dept_user UNIQUE (department_id, user_id)
);

CREATE UNIQUE INDEX idx_dept_members_unique ON department_memberships(department_id, user_id);
CREATE INDEX idx_dept_members_user ON department_memberships(user_id);
CREATE INDEX idx_dept_members_last_accessed ON department_memberships(user_id, last_accessed_at DESC);
```

**Step 1.5**: Notices table (see [02-architecture.md](./02-architecture.md) for full schema)

**Step 1.6**: Templates, Attachments, Invitations, Clients, Audit Logs

**2. Enable RLS on All Tables**
```sql
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

**3. Create RLS Policies** (see [10-functional-requirements.md](./10-functional-requirements.md) Section 10.2)

**4. Create Storage Buckets**
```sql
-- Using Supabase dashboard or SQL
INSERT INTO storage.buckets (id, name, public) VALUES ('notices', 'notices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
```

**5. Create Storage RLS Policies** (Section 10.3)

**Testing**:
- Create test organization (council)
- Create test department
- Create test users with different roles
- Verify RLS: user A cannot see user B's different-department data
- Test all CRUD operations with different roles

**Deliverable**: Complete database schema with working RLS

**Estimated Time**: 1.5-2 weeks

---

## Phase 2: Authentication & Onboarding (Weeks 4-5)

**Goal**: Build complete auth flow and organization onboarding

### Tasks

**1. Auth Pages**

**Sign In** (`/auth/sign-in`):
- Magic link form (email input)
- Supabase Auth integration: `supabase.auth.signInWithOtp()`
- Design matching Pricing Page (gradient background, centered card)

**Callback** (`/auth/callback`):
- Parse token from URL
- Query user's memberships
- Routing logic (see [04-pages-auth.md](./04-pages-auth.md))

**2. Organization Creation Wizard** (`/onboarding/create-organization`):
- Multi-step form (4 steps for councils, 3 for firms)
- Step 1: Choose type (Council/Firm cards)
- Step 2: Organization details (name, domain, registration, contact, address, logo upload)
- Step 3 (councils only): Create departments (dynamic form, "Add Another" functionality)
- Step 4: Review & submit (create org, depts, memberships in transaction)

**3. Pending Approval Page** (`/onboarding/pending-approval`):
- Display application details
- Inform user of review process

**4. Accept Invitation** (`/onboarding/accept-invite?token=xxx`):
- Validate token
- Display invitation details (org, dept, role, inviter)
- Accept/Decline actions
- Create membership on accept

**5. Context Switcher** (`/switch-context`):
- Query user's all memberships
- Display department tiles (grid layout)
- "All Departments" tile for org admins
- Update last_accessed_at on selection
- Store active context in session/state

**6. Backend API Routes**:
- `POST /api/auth/magic-link`
- `POST /api/organizations` (create)
- `POST /api/invitations` (create)
- `POST /api/invitations/:token/accept`

**Testing**:
- Complete onboarding flow: sign up → create council → create departments → pending approval
- Admin approves org → user signs in → sees context switcher
- User accepts invitation → joins department
- Test edge cases: expired tokens, invalid emails

**Deliverable**: Full authentication and onboarding flow

**Estimated Time**: 1.5-2 weeks

---

## Phase 3: Council Portal - Core Features (Weeks 6-9)

**Goal**: Build essential council functionality (dashboard, notices, team)

### Tasks

**1. Base Layout**:
- Top nav bar (org logo, dept dropdown, notifications, user menu)
- Sidebar navigation (Dashboard, Notices, Templates, Team, Settings, Audit, Help)
- Breadcrumb trail
- Department context provider (React Context)

**2. Department Dashboard** (`/c/:org/:dept/dashboard`):
- 4 stat cards (Active Notices, Drafts, Published This Month, Pending Reviews)
- Recent activity feed (from audit_logs)
- Quick actions panel (Create Notice, Import Template, Invite Member)
- Upcoming deadlines table (notices with approaching representation deadlines)

**3. Notice List** (`/c/:org/:dept/notices`):
- Filter sidebar (status, date, type, creator, search)
- List view (table with all columns)
- Grid view (card layout)
- View toggle, sort dropdown
- Pagination
- Bulk actions (select multiple, publish/archive/delete)

**4. Notice Editor** (`/c/:org/:dept/notices/new`):
- 4-step wizard with progress stepper
- Step 1: Select notice type (grid of type cards)
- Step 2: Notice details form:
  - Premises info (name, address with autocomplete, map preview)
  - Applicant info (with "same as premises" option)
  - Licensing details (activities checklist, hours picker, DPS)
  - Legal info (authority, deadlines, publication date, newspaper)
- Step 3: Attachments (drag-drop upload, OCR extraction for PDFs)
- Step 4: Review & publish (preview all sections, generated notice text, publication options)
- Auto-save functionality (sessionStorage, every 30 seconds)

**5. Edit Notice** (`/c/:org/:dept/notices/:id/edit`):
- Same as new editor but pre-filled
- Warning banner if published
- Additional actions: Unpublish, Delete
- Permission checks (editors own drafts only, admins all)

**6. Team Management** (`/c/:org/:dept/team`):
- Active members table (avatar, name, email, role, joined, last active, actions)
- Pending invitations section (resend, cancel)
- Invite member modal (email, role selection, personal message)
- Change role modal (radio buttons with descriptions)
- Remove confirmation modal (warnings, validate not last admin)

**7. Backend API Routes**:
- `GET /api/notices?department_id=xxx`
- `POST /api/notices`
- `PATCH /api/notices/:id`
- `DELETE /api/notices/:id`
- `POST /api/notices/:id/publish`
- `GET /api/departments/:id/members`
- `POST /api/invitations`
- `PATCH /api/memberships/:id/role`
- `DELETE /api/memberships/:id`

**8. Geocoding Integration**:
- postcodes.io API calls when publishing notice
- Store coordinates in notices.premises.location
- Display on map preview

**Testing**:
- Create notice as Editor (full flow)
- Publish notice
- Edit existing notice
- Invite new team member
- Change roles
- Test permission enforcement (Viewer cannot create, Editor cannot manage team)

**Deliverable**: Core council portal functionality working

**Estimated Time**: 3-4 weeks

---

## Phase 4: Council Portal - Advanced Features (Weeks 10-12)

**Goal**: Templates, settings, audit log, org overview

### Tasks

**1. Templates Manager** (`/c/:org/:dept/templates`):
- Grid of template cards (icon, name, type, pre-filled fields, usage stats)
- Create template modal (name, type, field toggles with default values)
- Edit/duplicate/delete templates
- Use template flow (pre-fills notice editor)

**2. Settings** (`/c/:org/:dept/settings`):
- Tab 1: Department Settings (info, notice defaults, allowed types, status)
- Tab 2: Organization Settings (org info, departments table, org-wide settings) - Org Admin only
- Tab 3: Notifications (email preferences, frequency, test email)
- Tab 4: Danger Zone (archive dept, delete dept, delete org) - with safeguards

**3. Audit Log** (`/c/:org/:dept/audit`):
- Filter sidebar (action types, users, date range, resource type)
- Audit table (timestamp, user, action, resource, details)
- Expandable rows (full details, before/after diff, IP, user agent)
- Export CSV functionality
- Org-wide view toggle (Org Admin only)

**4. Organization Overview** (`/c/:org/all-departments/dashboard`) - Org Admin only:
- Aggregated stats across all departments
- Department performance grid (table of all depts with stats)
- Cross-department activity feed
- Quick actions (create dept, invite org admin, view org settings, download report)
- Department health indicators (pending reviews, deadlines, inactive depts, pending invites)

**5. Submissions Inbox** (`/c/:org/:dept/submissions-inbox`):
- Stats row (new, under review, processed)
- Filter bar (status tabs, firm filter, date range)
- Submissions list (cards with firm logo, premises, status, assigned user)
- Submission detail modal (tabs: details, attachments, firm message, history)
- Actions: Claim, Request Changes, Reject, Accept & Publish
- Real-time subscriptions for new submissions

**6. Backend API Routes**:
- `GET /api/templates?department_id=xxx`
- `POST /api/templates`
- `PATCH /api/templates/:id`
- `DELETE /api/templates/:id`
- `PATCH /api/departments/:id` (settings)
- `POST /api/departments/:id/archive`
- `GET /api/audit?department_id=xxx`
- `GET /api/audit/export` (CSV)
- `GET /api/submissions?department_id=xxx`
- `PATCH /api/submissions/:id/claim`
- `POST /api/submissions/:id/request-changes`
- `POST /api/submissions/:id/accept`
- `POST /api/submissions/:id/reject`

**Testing**:
- Create template, use in notice
- Change department settings
- Archive department (validate requirements)
- View audit log, export CSV
- Org Admin views all departments dashboard
- Test submission flow (firm submits → council claims → accepts)

**Deliverable**: Complete council portal with all features

**Estimated Time**: 2-3 weeks

---

## Phase 5: Firm Portal (Weeks 13-15)

**Goal**: Build firm submission portal

### Tasks

**1. Firm Dashboard** (`/f/:org/dashboard`):
- Stats (active submissions, accepted this month, total clients, pending actions)
- Recent submissions table
- Quick actions (submit notice, add client, view all submissions)
- Submission status chart (donut chart)
- Notifications panel

**2. Submissions List** (`/f/:org/submissions`):
- Filter bar (status tabs, council/dept, client, date, type)
- Table (title, client, submitted to, status, dates, actions)
- Status-specific indicators (changes requested alert, accepted link to public notice)

**3. New Submission Wizard** (`/f/:org/submissions/new`):
- Step 1: Council & Client (search councils, select dept, select/add client)
- Step 2: Notice details (same as council editor + firm message textarea)
- Step 3: Review & submit (all details, generated preview, submit button)

**4. Submission Detail** (`/f/:org/submissions/:id`):
- Status banners (changes requested, rejected, accepted)
- Tabs: Details, Council Communication (timeline), Edit & Resubmit
- Actions panel (council contact, client info, withdraw, duplicate, download, print)
- Modals: Council response, rejection reason

**5. Client Management** (`/f/:org/clients`):
- List/grid views
- Table: client name, contact, email, phone, submissions count, last submission
- Grid: client cards with quick submit button
- Add/edit client modal (name, contact person, email, phone, address, notes)
- Client detail page (info, submissions list, activity timeline)

**6. Firm Team & Settings**:
- Similar to council but simpler (no departments)
- Roles: Owner, Admin, User
- Settings tabs: Firm Info, Notifications, Danger Zone

**7. Backend API Routes**:
- `POST /api/submissions` (firm creates)
- `GET /api/submissions?organization_id=xxx` (firm views own)
- `PATCH /api/submissions/:id` (firm edits after changes requested)
- `POST /api/submissions/:id/withdraw`
- `GET /api/clients?organization_id=xxx`
- `POST /api/clients`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

**Testing**:
- Firm user submits notice to council
- Council requests changes
- Firm resubmits
- Council accepts → firm sees published notice
- Firm manages clients
- Firm invites team members

**Deliverable**: Complete firm portal

**Estimated Time**: 2-3 weeks

---

## Phase 6: Admin Portal (Weeks 16-17)

**Goal**: Platform administration interface

### Tasks

**1. Admin Dashboard** (`/admin/dashboard`):
- Stats (total orgs, pending approvals, total depts, active notices, total users)
- Pending approvals queue (table with review actions)
- Approval modal (org details, approve/reject buttons)
- Recent platform activity (timeline)

**2. Organization Management** (`/admin/organizations`):
- Filters (type, status, search)
- Table (org name, type, status, depts, users, notices, created, actions)
- Org detail page (full info, dept list, member list, recent notices, audit log)
- Actions: View details, suspend, activate, delete

**3. Department Management** (`/admin/departments`):
- Filters (council, type, status, search)
- Table (dept name, council, type, status, members, notices, created, actions)
- Dept detail page
- Actions: View details, view dashboard (impersonate), archive/restore

**4. User Management** (`/admin/users`):
- Filters (memberships, org, last active)
- Table (user, orgs count, depts count, last active, created, actions)
- User detail page (info, memberships, activity, notices)
- Actions: View details, impersonate, suspend, delete

**5. Content Moderation** (`/admin/moderation`):
- Flagged notices queue (review modal with approve/unpublish/delete)
- All published notices (searchable, quick unpublish)

**6. Global Audit Log & Platform Settings**:
- Similar to council audit but platform-wide
- Settings tabs (general, org approval, notice types, email templates, storage limits)

**7. Backend API Routes**:
- `GET /api/admin/organizations?status=pending_approval`
- `PATCH /api/admin/organizations/:id/approve`
- `PATCH /api/admin/organizations/:id/suspend`
- `DELETE /api/admin/organizations/:id`
- `GET /api/admin/users`
- `GET /api/admin/audit`

**Testing**:
- Admin approves org
- Admin suspends org → users cannot sign in
- Admin views all users, depts, orgs
- Admin moderates flagged notice

**Deliverable**: Complete admin portal

**Estimated Time**: 1.5-2 weeks

---

## Phase 7: Public Portal Integration (Weeks 18-19)

**Goal**: Connect authenticated portal to existing public portal

### Tasks

**1. Public Notice Detail Enhancements**:
- Use newly published notices from council portal
- Ensure geocoded coordinates display on map
- Representation submission uses new API

**2. Public Search Integration**:
- Search uses new dept-scoped notices
- Department filter in search UI
- Council organization name displayed

**3. Public Representation Submission**:
- POST to new API endpoint
- Links back to notice via notice_id

**4. Map Clustering with Dept Context**:
- Show dept name on notice popup
- Color-code by dept type (optional)

**Testing**:
- Publish notice in council portal → appears on public map
- Click notice → see full details
- Submit representation → council receives it
- Search for notices → filters work

**Deliverable**: Authenticated and public portals fully integrated

**Estimated Time**: 1.5-2 weeks

---

## Phase 8: Polish & Testing (Weeks 20-22)

**Goal**: Refine UX, fix bugs, comprehensive testing

### Tasks

**1. UI/UX Polish**:
- Review all pages for design system consistency
- Add loading states, skeleton loaders
- Improve empty states
- Add helpful tooltips and helper text
- Responsive design testing (mobile, tablet, desktop)

**2. Performance Optimization**:
- Implement React Query caching
- Optimize database queries (check indexes)
- Lazy load components
- Image optimization (logos, attachments)

**3. Error Handling**:
- Comprehensive error messages
- Retry logic for failed API calls
- Offline state handling
- Form validation improvements

**4. Testing**:
- Unit tests for critical functions (validation, permissions)
- Integration tests for API endpoints
- E2E tests for critical flows:
  - Council: Create & publish notice
  - Firm: Submit notice, council accepts
  - Admin: Approve organization
  - User: Sign in, switch contexts
- Browser testing (Chrome, Safari, Firefox)

**5. Documentation**:
- Update README with setup instructions
- Document environment variables
- Create admin guide for platform management
- Create user guide for councils and firms

**6. Security Audit**:
- Review RLS policies
- Test permission boundaries (users trying to access unauthorized data)
- Check for SQL injection, XSS vulnerabilities
- Review rate limiting

**Deliverable**: Production-ready system

**Estimated Time**: 2-3 weeks

---

## Phase 9: Deployment & Launch (Week 23)

**Goal**: Deploy to production

### Tasks

**1. Supabase Production Setup**:
- Create production Supabase project
- Run database migrations
- Configure RLS policies
- Set up storage buckets
- Configure production environment variables

**2. Frontend Deployment**:
- Build production bundle: `npm run build`
- Deploy to hosting (Vercel, Netlify, or Cloudflare Pages)
- Configure custom domain
- Set up SSL certificates
- Configure environment variables

**3. Backend Deployment**:
- Deploy Express API server (if separate) or use Supabase Edge Functions
- Configure production database connection
- Set up monitoring (Sentry, LogRocket)

**4. Initial Data Seeding**:
- Create site admin user
- Add notice types
- Configure platform settings

**5. Launch Checklist**:
- ✅ All tests passing
- ✅ Database migrations applied
- ✅ Environment variables configured
- ✅ SSL certificates active
- ✅ Monitoring tools configured
- ✅ Backups configured
- ✅ Error tracking active
- ✅ Analytics configured (optional)

**6. Soft Launch**:
- Invite pilot council to create account
- Monitor for errors
- Gather feedback
- Iterate

**Deliverable**: System live in production

**Estimated Time**: 1 week

---

## Post-Launch: Iteration & Enhancement

### Ongoing Tasks

**1. User Feedback & Support**:
- Monitor support requests
- Track feature requests
- Iterate on UX based on usage patterns

**2. Performance Monitoring**:
- Track API response times
- Monitor database query performance
- Optimize slow queries

**3. Feature Enhancements**:
- Advanced search features
- Email notifications (transactional emails)
- Bulk operations
- Reporting and analytics dashboards
- Mobile app (future)

**4. Maintenance**:
- Regular security updates
- Database backups
- Monitor storage usage
- Clean up expired invitations

---

## Development Best Practices

### Git Workflow
- Feature branches: `feature/notice-editor`
- Pull requests with reviews
- Squash merge to main
- Tag releases: `v1.0.0`

### Code Quality
- ESLint + Prettier (already configured)
- TypeScript strict mode (already enabled)
- Code reviews for all PRs
- No console.logs in production

### Testing Standards
- Write tests for new features
- Maintain >80% code coverage
- E2E tests for critical flows
- Manual QA before releases

### Documentation
- Comment complex logic
- Update architecture docs when making structural changes
- Keep README up to date

---

## Risk Mitigation

### Technical Risks

**Risk 1: RLS Policy Complexity**
- **Mitigation**: Thoroughly test policies with different role combinations
- **Fallback**: Extra API-level validation

**Risk 2: Geocoding API Failures**
- **Mitigation**: Graceful fallback (continue without coordinates, log warning)
- **Fallback**: Manual coordinate entry

**Risk 3: Large File Uploads**
- **Mitigation**: Client-side validation (10MB limit), progress indicators
- **Fallback**: Error handling, retry logic

### Timeline Risks

**Risk 1: Scope Creep**
- **Mitigation**: Stick to roadmap, defer nice-to-haves to post-launch
- **Marker**: Weekly sprint reviews

**Risk 2: Dependency Issues**
- **Mitigation**: Lock dependencies, test updates in staging first
- **Marker**: Use renovate bot for updates

---

## Success Criteria

### Phase Completion Criteria

Each phase complete when:
- ✅ All tasks finished
- ✅ Tests passing (unit + integration)
- ✅ Code reviewed and merged
- ✅ No critical bugs
- ✅ Documentation updated

### Launch Criteria

Ready to launch when:
- ✅ All 9 phases complete
- ✅ E2E tests passing
- ✅ Security audit passed
- ✅ Performance benchmarks met
- ✅ At least 1 pilot council onboarded successfully
- ✅ Monitoring and error tracking active

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0. Foundation | 3-5 days | Week 1 |
| 1. Database | 1.5-2 weeks | Week 3 |
| 2. Auth & Onboarding | 1.5-2 weeks | Week 5 |
| 3. Council Core | 3-4 weeks | Week 9 |
| 4. Council Advanced | 2-3 weeks | Week 12 |
| 5. Firm Portal | 2-3 weeks | Week 15 |
| 6. Admin Portal | 1.5-2 weeks | Week 17 |
| 7. Public Integration | 1.5-2 weeks | Week 19 |
| 8. Polish & Testing | 2-3 weeks | Week 22 |
| 9. Deployment | 1 week | Week 23 |

**Total Estimated Timeline**: 20-23 weeks (5-6 months)

**With 2-3 developers**: Can parallelize some work, potentially reduce to 3-4 months

---

## Next Steps

**Immediate Actions**:

1. ✅ Read this entire roadmap
2. ✅ Review all architecture documents
3. ✅ Set up development environment (Phase 0)
4. ⏭️ Start Phase 1: Create database tables
5. ⏭️ Follow phases in sequence

**Regular Checkpoints**:
- End of each phase: Review progress, adjust timeline
- Weekly: Team sync, blockers discussion
- Bi-weekly: Demo to stakeholders

---

**🚀 Ready to build?** Start with [Phase 0: Foundation & Setup](#phase-0-foundation--setup-week-1)

---

[← Back to Index](./00-INDEX.md) | [Previous: Functional Requirements](./10-functional-requirements.md)
