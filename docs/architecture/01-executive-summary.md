# Executive Summary
## Civic Notices Portal - Department-Level Multi-Tenant System

[← Back to Index](./00-INDEX.md) | [Next: Architecture →](./02-architecture.md)

---

## 1.1 System Overview

This specification defines a **department-level multi-tenant civic notices portal** enabling councils, law firms, and licensing professionals to publish, manage, and respond to legal notices (primarily licensing applications) with complete data isolation at the department level.

### Core Innovation

Unlike traditional organization-based multi-tenancy, this system implements **department-level data silos** within councils, allowing large organizations to operate multiple independent departments (Licensing, Planning, Traffic, Environmental Health) with:
- Separate teams
- Independent workflows
- Isolated notice databases
- Centralized billing and organization management

---

## 1.2 Key Architectural Principles

### 1. Department-First Data Model
All notices, templates, and attachments belong to specific departments, not organizations. This enables true functional isolation within large councils.

### 2. Dual-Level Membership
Organization-wide roles (Owner, Org Admin) coexist with department-specific roles (Dept Admin, Editor, Viewer), allowing flexible permission management.

### 3. Strict Data Isolation
Row-Level Security (RLS) policies enforce department boundaries. Users only access data from departments where they have active memberships.

### 4. Flexible Role Assignment
The same user can be:
- Admin in Licensing Department
- Editor in Planning Department
- Viewer in Traffic Department

### 5. Context Switching
Multi-department users switch their "active context," changing visible data and available actions dynamically.

### 6. Visual Consistency
All interfaces follow the established Pricing Page design system (Tailwind, rounded-3xl cards, specific shadow values).

---

## 1.3 User Types

### Council Users (Department-Scoped)

**Department Admin**
- Full control over single department
- Manage notices, templates, team, and settings
- Approve notices if approval workflow enabled

**Editor**
- Create, edit, and publish notices and templates
- View department team
- Cannot manage team or settings

**Viewer**
- Read-only access to department data
- Cannot create, edit, or publish
- Cannot access team or settings pages

### Organization-Wide Council Users

**Organization Owner**
- Full control over organization and all departments
- Billing authority
- Can delete organization
- Irrevocable (can only transfer ownership)

**Organization Admin**
- Cross-department oversight
- Create/archive departments
- Manage org-wide settings
- Cannot delete organization or modify billing

### Firm Users (Single-Tier)

**Firm Owner**
- Full control over firm account
- Manage billing and firm settings
- Manage team and clients

**Firm Admin**
- Manage team members and clients
- Submit notices to councils
- Cannot modify billing or delete account

**Firm User**
- Submit notices to council departments
- View own submissions
- Manage assigned clients

### Platform Users

**Site Administrator**
- Platform-wide oversight
- Approve/suspend organizations
- View all data (read-only except moderation)
- Moderate published notices
- Access global audit log
- Configure platform settings

---

## 1.4 Core Workflows

### 1. Council Notice Publication
```
Licensing Officer → Creates Notice → Enters Details →
Uploads Attachments → Publishes to Public Portal
```
- Officer works within their department context
- All data automatically scoped to department
- Published notices become publicly searchable
- Geocoding happens automatically from postcode

### 2. Firm Submission
```
Solicitor → Submits Notice to Council Department →
Council Reviews → Accept/Reject/Request Changes →
Publishes if Approved
```
- Firm selects specific council department as target
- Submission enters council's inbox
- Council officer claims and reviews
- Two-way communication until resolution
- Accepted submissions become published notices

### 3. Public Response
```
Citizen → Finds Notice on Map → Reads Details →
Submits Representation Before Deadline
```
- Public portal shows all published notices
- Map-based discovery with clustering
- Deadline prominently displayed
- Simple representation form

### 4. Multi-Department Management
```
Org Admin → Views All Departments Dashboard →
Drills into Specific Department →
Switches Context → Manages as Dept Admin
```
- Cross-department analytics on overview dashboard
- Click department to switch active context
- Full admin capabilities within selected department
- Can create new departments or archive existing ones

### 5. Template Reuse
```
Editor → Creates Template from Common Notice →
Other Editors Use Template →
Pre-fills 80% of Fields → Quick Publication
```
- Templates scoped to department
- Pre-fills licensable activities, hours, authority info
- Speeds up repetitive notice creation
- Tracks usage statistics

---

## 1.5 Technical Stack

### Frontend
- **Framework**: React 19.x
- **Routing**: React Router (SPA)
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Maps**: MapLibre GL
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Express.js (port 5174)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (magic links, OAuth)
- **Geocoding**: postcodes.io API

### Infrastructure
- **RLS Policies**: Department-level data isolation
- **File Storage**: Department-scoped paths
- **Audit Logging**: Complete activity tracking
- **Real-time**: Supabase subscriptions for live updates

---

## 1.6 Key Features

### Department Management
- Create unlimited departments within councils
- Each with own team, settings, notice types
- Archive departments (preserves history)
- Cross-department analytics for org admins

### Notice Management
- Multi-step wizard (Type → Details → Attachments → Review)
- Auto-save drafts every 30 seconds
- Address autocomplete with UK postcode validation
- Automatic geocoding for map placement
- OCR text extraction from uploaded PDFs
- Template-based creation for speed
- Approval workflows (optional)

### Team Collaboration
- Department-scoped team management
- Role-based permissions (Admin, Editor, Viewer)
- Email invitations with 7-day expiry
- Multi-department memberships
- Context switching interface

### Firm Submission Portal
- Submit notices on behalf of clients
- Client management system
- Target specific council departments
- Track submission status
- Respond to change requests
- View accepted notices when published

### Platform Administration
- Approve new organizations
- Moderate content
- Manage all orgs, depts, users
- Global audit log
- Platform settings

---

## 1.7 Data Isolation Example

**Scenario**: Sampleton Council has 3 departments

```
Sampleton Council (Organization)
├── Licensing Department
│   ├── Team: 5 members
│   ├── Notices: 120 active
│   └── Templates: 8 templates
├── Planning Department
│   ├── Team: 3 members
│   ├── Notices: 45 active
│   └── Templates: 4 templates
└── Traffic Department
    ├── Team: 2 members
    ├── Notices: 30 active
    └── Templates: 2 templates
```

**User: Sarah Jones**
- Licensing: Department Admin (sees all 120 notices, can manage team)
- Planning: Editor (sees all 45 notices, can create/edit)
- Traffic: Not a member (sees nothing, cannot access)

**User: Michael Brown (Org Admin)**
- Can view all 3 departments
- Sees aggregated 195 notices across all depts
- Can drill into any department
- Can create new departments

**Data Queries**:
- Sarah in Licensing context: `WHERE department_id = 'licensing-uuid'`
- Sarah in Planning context: `WHERE department_id = 'planning-uuid'`
- Sarah trying Traffic: `403 Forbidden` (no membership)
- Michael in "All Depts" view: `WHERE organization_id = 'sampleton-uuid'`

---

## 1.8 Success Metrics

### For Councils
- Faster notice publication (target: <10 minutes from start to publish)
- Reduced errors through templates (target: 80% using templates within 3 months)
- Clear audit trail for compliance
- Team collaboration within departments

### For Firms
- Streamlined submission process (target: <15 minutes per submission)
- Real-time status tracking
- Reduced back-and-forth with councils
- Client management in one place

### For Public
- Easy notice discovery via map
- Clear representation deadlines
- Simple response mechanism
- Transparent process

### For Platform
- Scalable multi-tenant architecture
- Department-level isolation prevents data leaks
- Centralized moderation and oversight
- Audit compliance built-in

---

## 1.9 Differentiation from Current System

| Current System | New System |
|---------------|------------|
| Organization-based multi-tenancy | **Department-based** multi-tenancy |
| Council-wide permissions | **Dept-scoped** + org-wide roles |
| Single dashboard per org | **Multiple dashboards** (dept + org-wide) |
| No firm submission | **Firm submission portal** |
| Manual geocoding | **Automatic geocoding** |
| No templates | **Dept-scoped templates** |
| Basic audit | **Complete audit trail** |
| No approval workflows | **Optional approval workflows** |

---

## 1.10 Next Steps for Implementation

1. **Review Architecture** → [02-architecture.md](./02-architecture.md)
2. **Understand Roles** → [03-roles-permissions.md](./03-roles-permissions.md)
3. **Study Page Specs** → [04-07: Page Specifications](./04-pages-auth.md)
4. **Follow Roadmap** → [11-implementation-roadmap.md](./11-implementation-roadmap.md) ⭐

---

[← Back to Index](./00-INDEX.md) | [Next: Architecture →](./02-architecture.md)
