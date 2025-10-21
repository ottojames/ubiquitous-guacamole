# Department-Level Architecture
## Data Model & Entity Relationships

[← Back to Index](./00-INDEX.md) | [Previous: Executive Summary](./01-executive-summary.md) | [Next: Roles & Permissions →](./03-roles-permissions.md)

---

## 2.1 Entity Relationship Model

```
Organization (Council/Firm)
├── organization_memberships (org-wide roles: Owner, Org Admin)
│   └── User
├── Departments (councils only, multiple)
│   ├── department_memberships (dept roles: Admin, Editor, Viewer)
│   │   └── User (same user can be in multiple depts with different roles)
│   ├── Notices (owned by department)
│   │   ├── Attachments (inherited from notice → department)
│   │   └── Representations (public responses)
│   ├── Templates (dept-scoped, reusable notice patterns)
│   └── Invitations (targeted to specific department)
├── Clients (firms only, for tracking which clients notices are for)
└── Audit Logs (dept-aware, show department_id context)
```

### Relationship Summary

**One-to-Many**:
- Organization → Departments (council only)
- Organization → Organization Memberships
- Department → Department Memberships
- Department → Notices
- Department → Templates
- Department → Invitations
- Notice → Attachments
- Notice → Representations
- Organization (firm) → Clients

**Many-to-Many** (through join tables):
- Users ↔ Organizations (through organization_memberships)
- Users ↔ Departments (through department_memberships)

---

## 2.2 Core Entities

### Organization

**Purpose**: Represents a council or law firm using the platform.

**Schema**:
```typescript
{
  id: uuid (pk)
  type: enum('council', 'firm')
  name: text
  domain: text (unique)
  status: enum('pending_approval', 'active', 'suspended', 'archived')
  registration_number: text
  contact_email: text
  contact_phone: text
  address: jsonb {
    street: string
    city: string
    county: string
    postcode: string
    country: string
  }
  logo_url: text
  settings: jsonb {
    timezone: string
    data_retention_years: number
    custom_branding: boolean
    primary_color: string (if custom_branding)
  }
  created_at: timestamp
  updated_at: timestamp
}
```

**Business Rules**:
- Councils can have unlimited departments
- Firms have zero departments (flat structure)
- Domain used for email-based auto-matching (e.g., user@sampleton.gov.uk → Sampleton Council)
- Status flow: `pending_approval` → `active` (by admin) or `rejected`
- Suspended orgs: members cannot log in, data preserved
- Archived orgs: read-only, cannot create new data

**Indexes**:
- `domain` (unique, for email matching)
- `status` (for filtering pending approvals)
- `type` (for separating councils/firms)

---

### Department

**Purpose**: Functional division within a council (e.g., Licensing, Planning).

**Schema**:
```typescript
{
  id: uuid (pk)
  organization_id: uuid (fk → organizations, must be type='council')
  name: text
  slug: text (unique per org)
  type: enum(
    'licensing',
    'planning',
    'traffic',
    'environmental_health',
    'building_control',
    'other'
  )
  email: text
  description: text
  status: enum('active', 'archived')
  settings: jsonb {
    default_representation_period_days: number (default 28)
    default_newspaper: string
    require_approval_for_publication: boolean
    allowed_notice_types: string[] (notice type IDs)
  }
  created_at: timestamp
  updated_at: timestamp
  archived_at: timestamp (nullable)
}
```

**Business Rules**:
- Slug auto-generated from name: "Licensing Department" → "licensing"
- Must be unique within organization (composite unique: org_id + slug)
- Each department operates as completely independent unit
- Archiving department:
  - Sets status='archived', archived_at=now()
  - Prevents new notices but preserves all historical data
  - Members lose access but memberships preserved
  - Can be restored by org admin
- Department type determines:
  - Available notice types
  - Default templates
  - Public portal categorization

**Indexes**:
- `organization_id, slug` (composite unique)
- `organization_id, status` (for active department queries)
- `type` (for filtering by department type)

**Constraints**:
- CHECK: `organization_id` must reference org with `type='council'`
- CHECK: `slug` matches pattern `^[a-z0-9-]+$`

---

### Organization Membership (Org-Wide Roles)

**Purpose**: Grants organization-level access (Owner, Org Admin).

**Schema**:
```typescript
{
  id: uuid (pk)
  organization_id: uuid (fk → organizations)
  user_id: uuid (fk → auth.users)
  role: enum('owner', 'org_admin')
  created_at: timestamp
  invited_by: uuid (fk → users, nullable)
}
```

**Business Rules**:
- Only councils use org-wide roles (firms use simpler structure)
- Org membership grants access to:
  - Organization settings
  - Billing
  - Department creation
  - Cross-department analytics
- Does NOT grant access to department data (need dept membership for that)
- **One owner per organization**:
  - Owner assigned to first creator during onboarding
  - Cannot be removed, only transferred
  - Transfer requires owner confirmation
- **Multiple org admins allowed**
- Org Admin limitations vs Owner:
  - Cannot delete organization
  - Cannot modify billing
  - Cannot transfer ownership

**Indexes**:
- `organization_id, user_id` (composite unique)
- `user_id` (for user's org membership lookup)

**Constraints**:
- UNIQUE: `(organization_id, user_id)`
- CHECK: Only one owner per organization (enforced at app level)

---

### Department Membership (Dept-Specific Roles)

**Purpose**: Grants department-level access (Admin, Editor, Viewer).

**Schema**:
```typescript
{
  id: uuid (pk)
  department_id: uuid (fk → departments)
  user_id: uuid (fk → auth.users)
  role: enum('department_admin', 'editor', 'viewer')
  created_at: timestamp
  invited_by: uuid (fk → users, nullable)
  last_accessed_at: timestamp
}
```

**Business Rules**:
- User can have memberships in **multiple departments** with **different roles**
  - Example: Sarah is Admin in Licensing, Editor in Planning, Viewer in Traffic
- Each membership is independent:
  - Revoking membership in one dept doesn't affect others
  - Role change in one dept doesn't affect others
- Department membership required to access ANY department data
- `last_accessed_at` determines:
  - Default department when user logs in (most recent)
  - "Most recently accessed" badge in context switcher
- Removing last dept admin requires confirmation
  - Must assign new admin first
  - Or transfer admin role to existing member

**Indexes**:
- `department_id, user_id` (composite unique)
- `user_id` (for user's dept membership lookup)
- `user_id, last_accessed_at` (for default dept selection)

**Constraints**:
- UNIQUE: `(department_id, user_id)`

---

### Notice

**Purpose**: Represents a public notice (licensing application, planning notice, etc.).

**Schema**:
```typescript
{
  id: uuid (pk)
  department_id: uuid (fk → departments) ← CRITICAL: Department ownership
  organization_id: uuid (fk → organizations) // redundant but useful for queries
  type: text (notice type ID, e.g., 'premises-licence-new')
  status: enum('draft', 'pending_approval', 'published', 'expired', 'archived')
  title: text
  description: text (generated formal notice text)

  premises: jsonb {
    name: string
    address: {
      street: string
      city: string
      county: string
      postcode: string
    }
    location: {
      type: 'Point'
      coordinates: [longitude, latitude]
    }
  }

  applicant: jsonb {
    name: string
    address: {...}
    email: string
    phone: string
    type: string (individual/company/partnership/other)
  }

  licensing: jsonb {
    activities: string[] (licensable activities)
    operating_hours: {
      monday: {start: string, end: string}
      tuesday: {...}
      // ... etc
    }
    dps: {
      name: string
      licence_number: string
      issuing_authority: string
    }
    conditions: string
  }

  legal: jsonb {
    authority_name: string
    authority_address: string
    representation_deadline: date
    hearing_date: date (nullable)
    publication_date: date
    newspaper: string
  }

  extras: jsonb (type-specific additional fields)

  created_by: uuid (fk → users)
  published_at: timestamp (nullable)
  expires_at: timestamp (nullable)
  submitted_by_firm_id: uuid (nullable, fk → organizations where type='firm')
  view_count: integer (default 0)
  created_at: timestamp
  updated_at: timestamp
}
```

**Business Rules**:
- Notice belongs to ONE department only (enforced by RLS)
- Only users with membership in that department can access it
- **Draft visibility**:
  - Creator can always see their own drafts
  - Dept admins see all drafts
  - If `require_approval` setting enabled: editors cannot publish, must submit for approval
- **Published notices**:
  - Become publicly searchable (no auth required)
  - Appear on map at geocoded coordinates
  - Show in public notice list
- **Geocoding flow**:
  - On publish, extract postcode from premises.address
  - Call postcodes.io API for coordinates
  - Store in premises.location.coordinates
- **Expiry calculation**:
  - `expires_at = publication_date + representation_period_days`
  - Auto-calculated on publish
  - Expired notices still visible but marked as expired
- **Firm submissions**:
  - If submitted by firm: `submitted_by_firm_id` set
  - Creates audit trail linking to firm
  - Firm cannot edit after council accepts

**Indexes**:
- `department_id` (for dept-scoped queries)
- `organization_id` (for org-wide queries)
- `status` (for filtering published/draft)
- `published_at` (for sorting)
- `premises.location` (GiST index for geospatial queries)
- `type` (for filtering by notice type)

**RLS Policies** (conceptual):
```sql
-- Select policy
CREATE POLICY notices_select ON notices
FOR SELECT
USING (
  status = 'published' OR  -- Anyone can see published
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
  )
);

-- Insert policy
CREATE POLICY notices_insert ON notices
FOR INSERT
WITH CHECK (
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
    AND role IN ('department_admin', 'editor')
  )
);

-- Update policy
CREATE POLICY notices_update ON notices
FOR UPDATE
USING (
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
  )
  AND (
    role = 'department_admin' OR
    (role = 'editor' AND created_by = auth.uid())
  )
);

-- Delete policy
CREATE POLICY notices_delete ON notices
FOR DELETE
USING (
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
    AND role = 'department_admin'
  )
);
```

---

### Template

**Purpose**: Reusable notice template with pre-filled default values.

**Schema**:
```typescript
{
  id: uuid (pk)
  department_id: uuid (fk → departments) ← CRITICAL: Dept-scoped
  name: text
  notice_type: text (notice type ID)
  default_values: jsonb {
    // Pre-filled field values
    // Example:
    licensing: {
      activities: ['sale-alcohol-on', 'live-music']
      operating_hours: {...}
    }
    legal: {
      authority_name: 'Sampleton Borough Council'
      newspaper: 'Sampleton Gazette'
    }
  }
  created_by: uuid (fk → users)
  use_count: integer (default 0)
  created_at: timestamp
  updated_at: timestamp
}
```

**Business Rules**:
- Templates scoped to department (not shared across departments)
- Other departments can create their own templates for same notice type
- Using template:
  - Increments `use_count`
  - Copies `default_values` to new notice
  - User can modify any field
  - New notice not linked back to template
- Templates can be duplicated across departments by org admins
- Deleting template:
  - Does not affect notices created from it
  - Only creator and admins can delete

**Indexes**:
- `department_id` (for dept template lookup)
- `notice_type` (for filtering templates by type)

**RLS Policies**:
```sql
-- Same pattern as notices but restricted to editors/admins
CREATE POLICY templates_select ON templates
FOR SELECT
USING (
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
  )
);
```

---

### Attachment

**Purpose**: Files attached to notices (PDFs, images, documents).

**Schema**:
```typescript
{
  id: uuid (pk)
  notice_id: uuid (fk → notices)
  department_id: uuid (fk → departments) // inherited from notice
  file_name: text
  file_size: bigint
  mime_type: text
  storage_path: text // Path in Supabase storage
  uploaded_by: uuid (fk → users)
  created_at: timestamp
}
```

**Business Rules**:
- Department ID inherited from parent notice
  - Ensures RLS policies work correctly
  - Enables dept-scoped storage paths
- Storage path structure: `notices/{dept_slug}/{notice_id}/{file_name}`
- Max file size: 10MB per file (configurable)
- Allowed MIME types:
  - PDFs: `application/pdf`
  - Images: `image/jpeg`, `image/png`
  - Documents: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Deleting notice cascades to delete attachments

**Indexes**:
- `notice_id` (for notice attachments lookup)
- `department_id` (for RLS enforcement)

**Storage RLS**:
```sql
-- Users can access attachments if they can access the parent notice
CREATE POLICY attachments_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notices' AND
  (name LIKE 'notices/%/%' AND
   EXISTS (
     SELECT 1 FROM notices n
     JOIN department_memberships dm ON n.department_id = dm.department_id
     WHERE storage.path LIKE '%/' || n.id || '/%'
     AND dm.user_id = auth.uid()
   )
  )
);
```

---

### Invitation

**Purpose**: Email invitation to join organization or department.

**Schema**:
```typescript
{
  id: uuid (pk)
  organization_id: uuid (fk → organizations)
  department_id: uuid (nullable, fk → departments) // null = org-wide invite
  email: text
  role: text // org or dept role depending on target
  token: text (unique)
  invited_by: uuid (fk → users)
  personal_message: text (nullable)
  status: enum('pending', 'accepted', 'expired', 'cancelled')
  expires_at: timestamp (default now() + 7 days)
  accepted_at: timestamp (nullable)
  created_at: timestamp
}
```

**Business Rules**:
- **Department_id = null**: Organization-wide invitation
  - Role: `owner` or `org_admin`
  - Creates `organization_membership` on accept
- **Department_id set**: Department-specific invitation
  - Role: `department_admin`, `editor`, or `viewer`
  - Creates `department_membership` on accept
- Token used in accept URL: `/onboarding/accept-invite?token=xxx`
- Invitation expiry:
  - Default 7 days from creation
  - Can be resent (generates new token, extends expiry)
  - Expired invitations cannot be accepted
- Accepting invitation:
  - User must be signed in (or signs in with invited email)
  - Creates appropriate membership record
  - Marks invitation as accepted
  - Sends confirmation to inviter
- Cancelling invitation:
  - Marks as cancelled
  - Sends notification to invited email
  - Cannot be undone

**Indexes**:
- `token` (unique, for accept lookup)
- `email, status` (for checking existing invites)
- `organization_id, status` (for pending invites list)
- `department_id, status` (for dept pending invites)

**Constraints**:
- UNIQUE: `token`
- CHECK: `expires_at > created_at`

---

### Client (Firms Only)

**Purpose**: Law firm's clients for whom they submit notices.

**Schema**:
```typescript
{
  id: uuid (pk)
  organization_id: uuid (fk → organizations, must be type='firm')
  name: text
  contact_name: text
  contact_email: text
  contact_phone: text
  address: jsonb {
    street: string
    city: string
    county: string
    postcode: string
  }
  notes: text
  created_by: uuid (fk → users)
  created_at: timestamp
  updated_at: timestamp
}
```

**Business Rules**:
- Only firm organizations can have clients
- Firms track clients for:
  - Billing purposes
  - Submission tracking
  - Pre-filling applicant info
- When firm submits notice:
  - Selects client from list
  - Client info can auto-populate applicant fields
  - Submission linked to client
- Archiving client:
  - Preserves historical submissions
  - Hides from active client list

**Indexes**:
- `organization_id` (for firm's client list)
- `name` (for client search)

**Constraints**:
- CHECK: `organization_id` references org with `type='firm'`

---

### Audit Log

**Purpose**: Complete activity trail for compliance and troubleshooting.

**Schema**:
```typescript
{
  id: uuid (pk)
  organization_id: uuid (fk → organizations)
  department_id: uuid (nullable, fk → departments) // null = org-wide action
  user_id: uuid (fk → users)
  action: text (e.g., 'notice.published', 'user.invited')
  resource_type: text (e.g., 'notice', 'template', 'user')
  resource_id: uuid
  details: jsonb {
    description: string
    before: object (old values)
    after: object (new values)
    metadata: object (IP, user agent, etc.)
  }
  ip_address: text
  user_agent: text
  created_at: timestamp
}
```

**Business Rules**:
- **Department_id null**: Organization-wide action
  - Examples: create dept, modify org settings, invite org admin
- **Department_id set**: Department-scoped action
  - Examples: publish notice, create template, invite editor
- Audit log is append-only (no updates or deletes)
- Retention based on org settings (`data_retention_years`)
- Queryable by:
  - Department admins: their department only
  - Org admins: all departments or org-wide
  - Site admins: entire platform
- Export functionality for compliance

**Indexes**:
- `organization_id, created_at` (for org audit queries)
- `department_id, created_at` (for dept audit queries)
- `user_id, created_at` (for user activity)
- `action` (for filtering by action type)
- `resource_type, resource_id` (for resource history)

**RLS Policies**:
```sql
-- Dept admins see their dept's logs
CREATE POLICY audit_select_dept ON audit_logs
FOR SELECT
USING (
  department_id IN (
    SELECT department_id FROM department_memberships
    WHERE user_id = auth.uid()
    AND role = 'department_admin'
  )
);

-- Org admins see all org logs
CREATE POLICY audit_select_org ON audit_logs
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'org_admin')
  )
);
```

---

## 2.3 Data Isolation Model

### Department Boundary Enforcement

**Three-Layer Security**:

#### 1. Database Level (RLS Policies)
- PostgreSQL Row-Level Security enforces department boundaries
- Every query automatically filtered by user's department memberships
- Cannot be bypassed even with direct SQL access
- Example:
  ```sql
  SELECT * FROM notices;
  -- Automatically becomes:
  SELECT * FROM notices
  WHERE department_id IN (user's dept memberships);
  ```

#### 2. API Level (Middleware)
- API endpoints validate department access before processing
- Active department ID extracted from session/JWT
- Middleware checks user has membership in requested department
- Example:
  ```typescript
  // Request: GET /api/notices?department_id=abc
  // Middleware validates:
  if (!user.hasDeptMembership(department_id)) {
    throw 403 Forbidden
  }
  ```

#### 3. UI Level (Component Guards)
- Components receive department_id from React Context
- All data fetches include department filter
- Navigation menu only shows accessible departments
- Conditional rendering based on user's role in active department

### Cross-Department Access

**Organization Admins/Owners**:
- Can query across departments with explicit "All Departments" view
- Requires toggling view mode
- Aggregated views show department name in all records
- Drilling into specific record switches active context to that department

**Example Query Flow**:
```typescript
// Dept Admin querying their dept
const notices = await supabase
  .from('notices')
  .select('*')
  .eq('department_id', activeDepartmentId);
// RLS: ✅ Allowed (user has dept membership)

// Org Admin querying all depts
const notices = await supabase
  .from('notices')
  .select('*, departments(*)')
  .eq('organization_id', organizationId);
// RLS: ✅ Allowed (org admin can see org-wide)

// User trying to access dept they're not in
const notices = await supabase
  .from('notices')
  .select('*')
  .eq('department_id', 'other-dept-id');
// RLS: ❌ Returns empty array (RLS blocks)
```

---

## 2.4 Database Migrations Strategy

### Phase 1: Core Schema
1. Create `organizations` table
2. Create `departments` table
3. Create `organization_memberships` table
4. Create `department_memberships` table

### Phase 2: Notice System
5. Create `notices` table with GiST index
6. Create `templates` table
7. Create `attachments` table
8. Create storage bucket policies

### Phase 3: Collaboration
9. Create `invitations` table
10. Create `clients` table (firms)
11. Create `representations` table (public responses)

### Phase 4: Compliance
12. Create `audit_logs` table
13. Set up RLS policies on all tables
14. Create audit trigger functions

---

[← Back to Index](./00-INDEX.md) | [Previous: Executive Summary](./01-executive-summary.md) | [Next: Roles & Permissions →](./03-roles-permissions.md)
