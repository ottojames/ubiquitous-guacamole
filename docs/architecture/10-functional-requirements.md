# Functional Requirements
## Technical Specifications & Implementation Details

[← Back to Index](./00-INDEX.md) | [Previous: User Flows](./09-user-flows.md) | [Next: Implementation Roadmap →](./11-implementation-roadmap.md)

---

## Overview

This document specifies technical requirements for implementing the system including database schemas, RLS policies, API endpoints, storage configuration, and integration points.

---

## 10.1 Database Schema (Supabase PostgreSQL)

### Core Tables

**Detailed schemas are defined in [02-architecture.md](./02-architecture.md) Section 2.2**

Summary of tables:
1. `organizations` - Councils and firms
2. `departments` - Functional divisions within councils
3. `organization_memberships` - Org-wide roles
4. `department_memberships` - Dept-specific roles
5. `notices` - Published and draft notices
6. `templates` - Reusable notice templates
7. `attachments` - Files attached to notices
8. `invitations` - Email invitations
9. `clients` - Firm clients
10. `submissions` - Firm submissions to councils
11. `representations` - Public responses to notices
12. `audit_logs` - Complete activity trail

### Indexes

**Critical Indexes for Performance**:

```sql
-- Organizations
CREATE INDEX idx_orgs_domain ON organizations(domain);
CREATE INDEX idx_orgs_status ON organizations(status);
CREATE INDEX idx_orgs_type ON organizations(type);

-- Departments
CREATE UNIQUE INDEX idx_depts_org_slug ON departments(organization_id, slug);
CREATE INDEX idx_depts_org_status ON departments(organization_id, status);

-- Department Memberships
CREATE UNIQUE INDEX idx_dept_members_unique ON department_memberships(department_id, user_id);
CREATE INDEX idx_dept_members_user ON department_memberships(user_id);
CREATE INDEX idx_dept_members_last_accessed ON department_memberships(user_id, last_accessed_at DESC);

-- Notices
CREATE INDEX idx_notices_dept ON notices(department_id);
CREATE INDEX idx_notices_org ON notices(organization_id);
CREATE INDEX idx_notices_status ON notices(status);
CREATE INDEX idx_notices_published ON notices(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_notices_location ON notices USING GIST((premises->'location'));

-- Audit Logs
CREATE INDEX idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_dept_created ON audit_logs(department_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

---

## 10.2 Row-Level Security (RLS) Policies

### Notices Table Policies

**Select Policy** (Read):
```sql
CREATE POLICY notices_select_policy ON notices
FOR SELECT
USING (
  -- Published notices are public
  status = 'published'
  OR
  -- Department members can see their dept's notices
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
  )
  OR
  -- Org admins can see their org's notices
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'org_admin')
  )
);
```

**Insert Policy** (Create):
```sql
CREATE POLICY notices_insert_policy ON notices
FOR INSERT
WITH CHECK (
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
    AND role IN ('department_admin', 'editor')
  )
);
```

**Update Policy**:
```sql
CREATE POLICY notices_update_policy ON notices
FOR UPDATE
USING (
  department_id IN (
    SELECT dm.department_id
    FROM department_memberships dm
    WHERE dm.user_id = auth.uid()
    AND (
      dm.role = 'department_admin'
      OR (dm.role = 'editor' AND notices.created_by = auth.uid())
    )
  )
  OR
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'org_admin')
  )
);
```

**Delete Policy**:
```sql
CREATE POLICY notices_delete_policy ON notices
FOR DELETE
USING (
  department_id IN (
    SELECT department_id
    FROM department_memberships
    WHERE user_id = auth.uid()
    AND role = 'department_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id
    FROM organization_memberships
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'org_admin')
  )
);
```

### Templates, Attachments, Memberships
Similar RLS patterns apply to all department-scoped tables.

---

## 10.3 Storage Configuration (Supabase Storage)

### Bucket: `notices`

**Structure**:
```
notices/
├── {dept-slug}/
│   ├── {notice-id}/
│   │   ├── application.pdf
│   │   ├── plan.jpg
│   │   └── ...
```

**RLS Policies**:

**Upload Policy**:
```sql
CREATE POLICY notices_storage_insert ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'notices'
  AND auth.uid() IN (
    SELECT dm.user_id
    FROM department_memberships dm
    JOIN departments d ON dm.department_id = d.id
    WHERE storage.foldername(name)[1] = d.slug
    AND dm.role IN ('department_admin', 'editor')
  )
);
```

**Download Policy**:
```sql
CREATE POLICY notices_storage_select ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notices'
  AND (
    -- Published notices are public
    EXISTS (
      SELECT 1 FROM notices n
      WHERE storage.foldername(name)[2]::uuid = n.id
      AND n.status = 'published'
    )
    OR
    -- Department members can access their dept's files
    auth.uid() IN (
      SELECT dm.user_id
      FROM department_memberships dm
      JOIN departments d ON dm.department_id = d.id
      WHERE storage.foldername(name)[1] = d.slug
    )
  )
);
```

### Bucket: `logos`

For organization and user logos, similar structure and policies.

---

## 10.4 API Endpoints

### Authentication Endpoints

**POST `/api/auth/magic-link`**
- Body: `{ email: string }`
- Sends magic link email
- Returns: `{ success: boolean }`

**GET `/api/auth/callback?token=xxx`**
- Validates token
- Creates session
- Returns redirect URL based on memberships

---

### Organization Endpoints

**POST `/api/organizations`**
- Body: Organization details + departments (councils)
- Creates pending organization
- Returns: `{ id, status: 'pending_approval' }`

**GET `/api/organizations/:id`** (Auth required)
- Returns organization details
- RLS enforced

**PATCH `/api/organizations/:id`** (Owner/Org Admin)
- Updates organization info
- Audit logged

**DELETE `/api/organizations/:id`** (Owner only)
- Soft delete with cascading
- Extreme confirmation required

---

### Department Endpoints

**POST `/api/departments`** (Org Admin/Owner)
- Body: `{ organization_id, name, type, email, description, settings }`
- Creates department
- Auto-assigns creator as Dept Admin
- Returns: `{ id, slug }`

**GET `/api/departments?organization_id=xxx`** (Org Admin)
- Lists all departments in organization
- Returns array of departments

**PATCH `/api/departments/:id`** (Dept Admin+)
- Updates department settings
- Audit logged

**POST `/api/departments/:id/archive`** (Dept Admin+)
- Archives department
- Validation checks enforced
- Returns: `{ success, archived_at }`

---

### Notice Endpoints

**GET `/api/notices?department_id=xxx&status=published`**
- Lists notices filtered by department and status
- RLS enforced
- Supports pagination: `?offset=0&limit=25`
- Supports sorting: `?sort=published_at&order=desc`

**GET `/api/notices/:id`**
- Returns single notice with full details
- Generates description if null (on-the-fly)
- RLS enforced

**POST `/api/notices`** (Editor+)
- Body: Complete notice object
- Validates required fields
- Geocodes address (postcodes.io)
- Creates attachments
- Returns: `{ id, status }`

**PATCH `/api/notices/:id`** (Editor own drafts, Admin all)
- Updates notice
- Re-geocodes if address changed
- Audit logged

**POST `/api/notices/:id/publish`** (Editor+, or Admin if approval required)
- Changes status to 'published'
- Sets published_at, calculates expires_at
- Sends notifications
- Returns: `{ success, published_at }`

**DELETE `/api/notices/:id`** (Admin only)
- Soft delete
- Cascades to attachments
- Audit logged

---

### Geospatial Search

**GET `/api/notices/bbox?sw_lat=51.5&sw_lng=-0.2&ne_lat=51.6&ne_lng=-0.1`**
- Returns notices within bounding box
- Only published notices
- Used for map clustering
- Returns: `{ notices: [...], count }`

**GET `/api/notices/nearby?lat=51.5&lng=-0.1&radius=5000`**
- Returns notices within radius (meters)
- Only published
- Returns: `{ notices: [...] }`

---

### Template Endpoints

**GET `/api/templates?department_id=xxx`**
- Lists templates for department
- RLS enforced

**POST `/api/templates`** (Editor+)
- Creates template
- Body: `{ department_id, name, notice_type, default_values }`

**PATCH `/api/templates/:id`** (Creator or Admin)
- Updates template

**DELETE `/api/templates/:id`** (Creator or Admin)
- Deletes template (doesn't affect notices created from it)

---

### Team Management Endpoints

**GET `/api/departments/:dept_id/members`**
- Lists department members
- RLS enforced

**POST `/api/invitations`** (Admin only)
- Body: `{ department_id, email, role, personal_message }`
- Creates invitation with token
- Sends email
- Returns: `{ id, token, expires_at }`

**POST `/api/invitations/:token/accept`**
- Validates token
- Creates department_membership
- Returns: `{ success, department_id }`

**PATCH `/api/memberships/:id/role`** (Admin only)
- Changes user's role
- Audit logged

**DELETE `/api/memberships/:id`** (Admin only)
- Removes user from department
- Validates not last admin

---

### Submission Endpoints (Firms → Councils)

**POST `/api/submissions`** (Firm users)
- Body: `{ target_department_id, client_id, notice_data, attachments, firm_message }`
- Creates submission
- Notifies council dept
- Returns: `{ id, reference_number }`

**GET `/api/submissions?department_id=xxx`** (Council - inbox)
- Lists submissions for department
- Filters: status, firm, date

**PATCH `/api/submissions/:id/claim`** (Council Editor+)
- Assigns submission to user
- Status → 'under_review'

**POST `/api/submissions/:id/request-changes`** (Council Admin)
- Body: `{ message, issue_types }`
- Status → 'changes_requested'
- Emails firm

**POST `/api/submissions/:id/accept`** (Council Admin)
- Creates notice from submission
- Status → 'accepted'
- Emails firm with published notice link

**POST `/api/submissions/:id/reject`** (Council Admin)
- Body: `{ reason, category }`
- Status → 'rejected'
- Emails firm

---

### Audit Endpoints

**GET `/api/audit?department_id=xxx&from=date&to=date`**
- Lists audit logs
- Filters: action types, users, resources
- RLS enforced
- Returns: `{ logs: [...], total }`

**GET `/api/audit/export?department_id=xxx&format=csv`**
- Exports audit log
- Returns CSV file

---

## 10.5 External Integrations

### Postcodes.io API (Geocoding)

**Endpoint**: `https://api.postcodes.io/postcodes/:postcode`

**Request**:
```typescript
GET https://api.postcodes.io/postcodes/SW1A1AA
```

**Response**:
```json
{
  "status": 200,
  "result": {
    "postcode": "SW1A 1AA",
    "longitude": -0.127695,
    "latitude": 51.501009,
    "country": "England",
    "admin_district": "Westminster"
  }
}
```

**Usage**:
- Called when publishing notice
- Stores coordinates in `notices.premises.location`
- Fallback if API fails: log warning, continue without coordinates

---

### Address Lookup API (Optional)

**Provider**: getAddress.io or similar

**Endpoint**: `GET /find/:postcode`

**Returns**:
- List of addresses for postcode
- User selects from dropdown
- Pre-fills address fields

---

## 10.6 Email System

### Transactional Emails (Supabase Auth + Custom)

**Email Templates**:

1. **Magic Link** (Supabase built-in)
2. **Organization Approved** (Custom)
   - To: Organization owner
   - Subject: "Your organization has been approved"
   - Link to sign in
3. **Invitation** (Custom)
   - To: Invitee
   - Subject: "You've been invited to join [Org/Dept]"
   - Link: `/onboarding/accept-invite?token=xxx`
4. **Role Changed** (Custom)
   - To: User
   - Subject: "Your role has been updated"
5. **Notice Published** (Custom)
   - To: Department members (if opted in)
   - Subject: "New notice published in [Dept]"
6. **Submission Status Change** (Custom)
   - To: Firm user
   - Subject: "Update on your submission to [Council]"

**Email Service**: Supabase Edge Functions + Resend.com or SendGrid

---

## 10.7 Search & Filtering

### Full-Text Search (PostgreSQL)

**Notices Table**:
```sql
ALTER TABLE notices ADD COLUMN search_vector tsvector;

CREATE INDEX idx_notices_search ON notices USING GIN(search_vector);

-- Trigger to update search_vector
CREATE TRIGGER notices_search_vector_update
BEFORE INSERT OR UPDATE ON notices
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(
  search_vector, 'pg_catalog.english',
  title, description,
  premises->>'name',
  applicant->>'name'
);
```

**Search Query**:
```sql
SELECT * FROM notices
WHERE search_vector @@ to_tsquery('english', 'licence & pub')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'licence & pub')) DESC;
```

---

## 10.8 Caching Strategy

**Client-Side**:
- React Query for data caching
- 5-minute stale time for static data (notice types, templates)
- Real-time subscriptions for live data (notices, submissions)

**Server-Side**:
- None initially (Supabase handles database caching)
- Future: Redis for frequently accessed aggregations (stats, counts)

---

## 10.9 Real-Time Subscriptions (Supabase Realtime)

**Notice Changes**:
```typescript
supabase
  .channel('notices')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notices',
    filter: `department_id=eq.${departmentId}`
  }, (payload) => {
    // Update UI
  })
  .subscribe();
```

**Submission Updates** (for councils):
```typescript
supabase
  .channel('submissions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'submissions',
    filter: `target_department_id=eq.${departmentId}`
  }, (payload) => {
    // Show toast notification
  })
  .subscribe();
```

---

## 10.10 Security Considerations

### Authentication
- Magic links with 15-minute expiry
- Optional OAuth (Google, Microsoft)
- No password storage

### Authorization
- Three-layer enforcement (RLS + API + UI)
- JWT tokens with department context
- Refresh token rotation

### Data Protection
- All data encrypted at rest (Supabase default)
- HTTPS only
- Rate limiting on API endpoints (to prevent abuse)
- File upload validation (MIME types, size limits)

### Audit Trail
- All mutations logged
- IP address and user agent stored
- Tamper-proof append-only logs

---

[← Back to Index](./00-INDEX.md) | [Previous: User Flows](./09-user-flows.md) | [Next: Implementation Roadmap →](./11-implementation-roadmap.md)
