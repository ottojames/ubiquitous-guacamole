# CivicNotices - Quick Reference Guide

## Navigation

### All Routes (src/App.tsx)
**Public:**
- `/` - Home (search)
- `/notices` - Search/map
- `/notices/:id` - Detail
- `/notices/:id/respond` - Submit representation
- `/login` - Demo login

**Council Portal:**
- `/c/:orgSlug/:deptSlug/dashboard` - Dashboard
- `/c/:orgSlug/:deptSlug/notices` - List
- `/c/:orgSlug/:deptSlug/notices/new` - Create
- `/c/:orgSlug/:deptSlug/notices/:id` - Detail
- `/c/:orgSlug/:deptSlug/team` - Team
- `/c/:orgSlug/:deptSlug/templates` - Templates
- `/c/:orgSlug/:deptSlug/settings` - Settings
- `/c/:orgSlug/:deptSlug/audit` - Audit log

## Key Components by Function

### Public Portal (src/pages/)
| File | Purpose | Size | Status |
|------|---------|------|--------|
| Home.tsx | Address search | 48KB | ✅ Complete |
| Notices.tsx | Search + map | 32KB | ✅ Complete |
| NoticeDetailPage.tsx | Read notice | 22KB | ✅ Complete |
| SubmitRepresentation.tsx | Submit rep | 21KB | ✅ Complete |
| Pricing.tsx | Pricing | 26KB | ✅ Complete |

### Council Portal (src/pages/council/)
| File | Purpose | Size | Status |
|------|---------|------|--------|
| CouncilLayout.tsx | Parent layout | 11KB | ✅ Complete |
| Dashboard.tsx | Stats + recent | 20KB | ✅ Partial |
| Notices.tsx | List notices | 14KB | ✅ Partial |
| NoticeDetail.tsx | Read-only detail | 13KB | ✅ Partial |
| NoticeEditor.tsx | Create/edit | 22KB | 🚧 Incomplete |
| Team.tsx | Manage team | 12KB | 🚧 UI only |
| Templates.tsx | Manage templates | 15KB | 🚧 UI only |
| Settings.tsx | Settings | 12KB | 🚧 UI only |
| AuditLog.tsx | Activity log | 11KB | 🚧 UI only |

## Database (supabase/migrations/)

### Critical Tables
- `organizations` - Councils and firms
- `departments` - Functional divisions (licensing, planning, etc)
- `notices` - Statutory notices
- `representations` - Public submissions on notices
- `submissions` - Firm-to-council notice submissions

### Membership & Roles
- `organization_memberships` - Org-level roles (owner, org_admin)
- `department_memberships` - Dept-level roles (dept_admin, editor, viewer)

### Functions (representation tracking)
- `get_representation_counts(notice_id, user_id)` - Total + unread
- `mark_representation_read(rep_id, user_id)` - Mark as read
- `get_bulk_representation_counts(notice_ids[], user_id)` - Bulk fetch

## Backend API (server/routes/)

```
/api/notices/*          - Search, CRUD, geospatial
/api/representations/*  - ❌ NOT IMPLEMENTED
/api/submissions/*      - ❌ NOT IMPLEMENTED
/api/addresses/*        - Address lookup
/api/upload/*           - File + OCR
/api/publish/*          - Publishing
```

## Configuration Files

| File | Purpose |
|------|---------|
| `src/env.ts` | Feature flags (VITE_NEW_PUBLISH_FLOW) |
| `src/config/departmentConfig.ts` | Department types + labels |
| `src/lib/dateUtils.ts` | Date helpers (isClosingSoon, isExpired) |
| `src/lib/supabase.ts` | Supabase client init |
| `/src/lib/councils.ts` | Council directory |

## Demo Credentials

**Email:** `licensing@sample.gov.uk`  
**Password:** `sample123`  
Routes to: `/c/sample-borough/licensing`

**OR**

**Email:** `demo@council.gov.uk`  
**Password:** `demo123`  
Routes to: `/c/westminster/licensing`

## Department Types (7)

| Type | Publish? | Rep Label | Example |
|------|----------|-----------|---------|
| licensing | ❌ No | Representations | Monitor premises licences |
| planning | ✅ Yes | Public Comments | Create planning notices |
| traffic | ✅ Yes | Objections | Create traffic orders |
| GVOL | ❌ No | Representations | Monitor GVOL notices |
| environmental | ❌ No | Consultation Responses | Monitor environmental |
| probate | ❌ No | Representations | Monitor probate notices |
| procurement | ✅ Yes | Supplier Questions | Create procurement notices |

## Key Missing Pieces

### Backend (High Priority)
```
❌ /api/representations/:noticeId         [GET list, POST create]
❌ /api/representations/:repId/mark-read  [mark as read]
❌ /api/submissions/:deptId                [inbox management]
❌ /api/templates/:deptId                  [CRUD templates]
❌ /api/audit-logs/:deptId                 [audit queries]
```

### Frontend (High Priority)
```
❌ Representations tab content (NoticeDetail)
❌ Submissions inbox page
❌ Team management integration
❌ Real publish workflow
❌ Real authentication (auth UI only)
```

## Audit Issues (37 total)

**Critical (7):** Keyboard navigation, AI disclosure, deadline validation, ARIA labels
**High (12):** Bank holidays, focus management, error handling, mobile responsive
**Medium (13):** Various UX/content issues
**Low (5):** Minor enhancements

See: `/audit-report.md`

## Development Commands

```bash
npm run dev              # Frontend + backend
npm run dev:web         # Frontend only (5173)
npm run dev:server      # Backend only (5174)
npm test                # Run tests
npm run lint            # ESLint
npm run typecheck       # TypeScript
npm run coverage        # Coverage report
```

## File Structure Summary

```
src/
├── App.tsx                 - Main router
├── pages/                  - Page components
│   ├── Home.tsx
│   ├── Notices.tsx
│   ├── NoticeDetailPage.tsx
│   ├── SubmitRepresentation.tsx
│   ├── auth/              - Auth pages
│   └── council/           - Council portal pages
├── config/
│   └── departmentConfig.ts - Department configuration
├── lib/
│   ├── supabase.ts
│   ├── councils.ts
│   ├── dateUtils.ts
│   └── notices.ts
├── components/
│   ├── search/            - Search components
│   └── layout/            - Layout components
└── env.ts                 - Feature flags

server/
├── routes/
│   ├── notices.ts
│   ├── publish.ts
│   ├── upload.ts
│   ├── address.ts
│   └── ai-summary.ts
└── lib/
    ├── supabase.ts
    └── geocode.ts

supabase/migrations/
├── 20251021000000_multi_tenant_foundation.sql
├── 20251021000001_memberships.sql
├── 20251021000002_notices_enhanced.sql
├── 20251021000005_submissions_representations.sql
└── 20251025000001_representation_reads_tracking.sql
```

## Status Summary

- ✅ **Production Ready**: Public notice search, representations form, geospatial queries
- 🚧 **In Development**: Dashboard, notices management, new publish wizard
- ❌ **Not Started**: Representation management UI, submissions workflow, real auth

## Next Steps

1. **Implement representation endpoints** - Enable council staff to view/manage representations
2. **Build submissions inbox** - For monitor-only departments
3. **Complete publish workflow** - New notice creation for publishing departments
4. **Add real authentication** - Replace demo mode
5. **Implement representations tab** - Show reps on NoticeDetail

