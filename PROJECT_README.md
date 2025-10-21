# Civic Notices Portal - Multi-Tenant Licensing Application Platform

A comprehensive SaaS platform for managing licensing applications and public notices across UK councils, law firms, and the general public.

## 🌟 Overview

This platform streamlines the licensing application workflow by connecting three key stakeholders:

- **Councils** - Review and approve licensing applications submitted by law firms
- **Law Firms** - Submit licensing applications on behalf of their clients
- **Public** - View published notices and submit representations (comments/objections)

## 🏗️ Architecture

### Multi-Tenant Design

The platform implements a complete multi-tenant architecture with organization-level and department-level data isolation:

```
Organizations (councils / law_firms)
  └── Departments (licensing departments, practice areas)
       └── Users (with role-based access control)
```

### Four Distinct Portals

1. **Council Portal** (`/c/:orgSlug/:deptSlug/*`)
   - Review incoming submissions from law firms
   - Approve, reject, or request changes
   - Publish approved notices to the public
   - Manage public representations/feedback
   - Track SLA compliance and analytics

2. **Firm Portal** (`/f/:orgSlug/*`)
   - Submit licensing applications to councils
   - Track submission status
   - Respond to change requests
   - View feedback from licensing officers

3. **Public Portal** (`/public/*`)
   - Browse published licensing notices
   - Search by location, council, notice type
   - Submit representations before deadlines
   - No authentication required

4. **Admin Portal** (`/admin/*`)
   - Platform-wide administration
   - Manage organizations and users
   - System analytics and monitoring
   - Super admin access control

## 📋 Features

### Council Portal Features

- **Submissions Dashboard** - Intake queue for pending applications
- **Submission Reviewer** - Approve/reject/request changes workflow
- **Publications Manager** - Manage live published notices
- **Representations Manager** - Review public feedback
- **Compliance Dashboard** - SLA tracking with 5/10 day rules
- **Analytics** - Submission trends and performance metrics
- **Bulk Actions** - Multi-select batch processing
- **Exports** - CSV data export for reporting
- **Templates** - Reusable notice templates
- **Team Management** - Invite/manage department members
- **Audit Log** - Complete change tracking

### Firm Portal Features

- **Dashboard** - Submission history and status overview
- **New Submission** - Multi-field application form
- **Submission Detail** - View status, feedback, and resubmit
- **Submission List** - Filter by status, search, track progress
- **Team Management** - Manage firm members

### Public Portal Features

- **Homepage** - Feature overview and notice types
- **Browse Notices** - Search and filter published notices
- **Notice Detail** - Full application details
- **Submit Representation** - Public feedback form with deadline tracking

### Admin Portal Features

- **Dashboard** - Platform-wide statistics
- **Organizations** - Create/manage councils and law firms
- **Users** - Platform-wide user management
- **System Analytics** - Cross-organization insights

## 🚀 Tech Stack

- **Frontend**: React 19.x + TypeScript + Vite
- **Routing**: React Router v6 (nested routes)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **State**: React hooks + Supabase real-time
- **Forms**: Native HTML5 validation

## 📊 Database Schema

### Core Tables

- `organizations` - Councils and law firms
- `departments` - Sub-organizations (licensing depts, practice areas)
- `profiles` - User profiles (linked to auth.users)
- `organization_memberships` - Org-level user access
- `department_memberships` - Dept-level user access with roles
- `submissions` - Licensing applications from firms
- `notices` - Published notices (approved submissions)
- `representations` - Public feedback on notices
- `templates` - Reusable notice templates
- `audit_log` - Complete change tracking

### Key Relationships

```
submissions (firm → council)
  ├── submitting_organization_id → organizations (law_firm)
  ├── receiving_department_id → departments (council)
  ├── assigned_to → profiles (licensing officer)
  └── status (new, in_review, approved, rejected, changes_requested)

notices (published by council)
  ├── department_id → departments (council)
  ├── created_by → profiles
  └── status (draft, pending, published, expired, archived)

representations (public → council)
  ├── notice_id → notices
  ├── department_id → departments
  └── status (new, reviewed, actioned)
```

## 🔐 Authentication & Authorization

### Auth Flow

1. User signs in with magic link (Supabase Auth)
2. Callback checks organization memberships
3. Context switcher displays available departments
4. User selects department → routed to appropriate portal

### Role-Based Access Control (RBAC)

- **Admin** - Full access (create/edit/delete everything)
- **Editor** - Create and edit content
- **Viewer** - Read-only access

### Row-Level Security (RLS)

All database tables use RLS policies to enforce:
- Organization-level data isolation
- Department-level access control
- Role-based permissions

## 🎨 Design System

### Color Palette

- **Council Portal**: Blue (#2563eb) to Purple (#7c3aed) gradient
- **Firm Portal**: Indigo (#4f46e5) to Pink (#ec4899) gradient
- **Public Portal**: Blue (#3b82f6) to Purple (#a855f7) gradient
- **Admin Portal**: Purple (#9333ea) to Pink (#ec4899) gradient

### Component Patterns

- **Cards**: `rounded-3xl` with `shadow-[0_2px_12px_rgba(0,0,0,0.04)]`
- **Buttons**: `rounded-xl` with hover transitions
- **Forms**: `rounded-xl` inputs with focus rings
- **Status Badges**: Color-coded pills (green/yellow/red/orange/purple)

### Shared Components

- `ErrorBoundary` - Top-level error handling
- `LoadingSpinner` - Consistent loading states
- `EmptyState` - "No data" states with icons
- `ConfirmDialog` - Reusable confirmation modals

## 📁 Project Structure

```
src/
├── pages/
│   ├── auth/              # Sign-in, callback, context switcher
│   ├── onboarding/        # Organization creation wizard
│   ├── council/           # Council portal pages
│   ├── firm/              # Firm portal pages
│   ├── public/            # Public portal pages
│   └── admin/             # Admin portal pages
├── components/            # Reusable UI components
├── lib/                   # Utilities and helpers
│   └── supabase.ts        # Supabase client
├── types/                 # TypeScript type definitions
└── App.tsx                # Root routing

server/ (Express API)
├── routes/                # API endpoints
└── services/              # Business logic
```

## 🔄 Data Flow Examples

### Submission Workflow

1. **Firm creates submission** → `submissions` table (status: 'new')
2. **Council reviews** → SubmissionReviewer.tsx
3. **Officer actions**:
   - Approve → status: 'approved'
   - Reject → status: 'rejected'
   - Request Changes → status: 'changes_requested'
4. **If approved** → Create `notice` (status: 'published')
5. **Public views** → PublicNotices.tsx
6. **Public responds** → `representations` table (status: 'new')
7. **Council reviews feedback** → Representations.tsx

### SLA Tracking

- **New submissions**: 5-day target
- **In review**: 10-day target
- Compliance dashboard shows:
  - Within SLA count
  - At risk (2 days remaining)
  - Breached count
  - Team performance metrics

## 🧪 Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with Supabase credentials
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev
```

### Available Scripts

```bash
npm run dev            # Run both frontend and backend
npm run dev:web        # Frontend only (Vite)
npm run dev:server     # Backend only (Express)
npm test               # Run tests
npm run build          # Build for production
npm run lint           # ESLint
npm run typecheck      # TypeScript check
```

### Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

**Optional:**
- `NEW_PUBLISH_FLOW` - Enable experimental publish wizard

## 📊 Key Metrics

### Phase Breakdown

- **Phase 0**: Environment setup ✅
- **Phase 1**: Database foundation (tables, RLS, storage) ✅
- **Phase 2**: Auth & onboarding ✅
- **Phase 3**: Council portal core ✅
- **Phase 4**: Advanced features (templates, settings, audit) ✅
- **Phase 5**: Licensing officer workflow ✅
- **Phase 6**: Firm portal ✅
- **Phase 7**: Advanced workflows (compliance, analytics, bulk actions) ✅
- **Phase 8**: Public portal integration ✅
- **Phase 9**: Admin portal ✅
- **Phase 10**: Polish & testing (current)
- **Phase 11**: Deployment preparation

### Code Statistics

- **Total Pages**: 40+ React components
- **Total Lines**: ~15,000+ LOC
- **Portals**: 4 distinct user experiences
- **Database Tables**: 12+ core tables
- **Notice Types**: 8 licensing types supported

## 🎯 Future Enhancements

### Short Term

- [ ] Email notifications (submission updates, deadline reminders)
- [ ] PDF generation for published notices
- [ ] Advanced search with geolocation
- [ ] Document upload for submissions
- [ ] Mobile responsive improvements

### Long Term

- [ ] Real-time collaboration features
- [ ] Workflow automation rules
- [ ] Integration with council case management systems
- [ ] Public API for third-party integrations
- [ ] Multi-language support

## 📝 License

Proprietary - All rights reserved

## 👥 Contributors

Built with Claude Code - AI-assisted development

---

**Note**: This platform handles sensitive licensing data. Ensure proper security measures are in place before deploying to production, including:

- Proper RLS policies on all tables
- Secure environment variable management
- HTTPS enforcement
- Regular security audits
- Data backup procedures
- GDPR compliance for user data
