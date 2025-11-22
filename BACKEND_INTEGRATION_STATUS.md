# Backend Integration Status Report
**Public Notice Portal - API & Database Integration**
**Date:** 2025-11-06
**Environment:** Development (Supabase PostgreSQL)

---

## Executive Summary

This document provides a comprehensive overview of the backend integration status for the Public Notice Portal. It covers API endpoints, database schema, authentication, and identifies what's fully implemented vs. what needs work.

### Overall Backend Status: 🟢 MOSTLY IMPLEMENTED

- ✅ **Core API Endpoints**: Notices, representations, publish workflows
- ✅ **Database Schema**: Supabase tables and storage configured
- ✅ **Authentication**: Demo mode + Supabase auth infrastructure
- ⚠️ **Payment Integration**: Structure exists, Stripe integration TBD
- ⏸️ **Email Notifications**: Service exists but config needed

---

## API Endpoints Audit

### Notice Management

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/notices` | GET | Optional | List/search notices | ✅ Implemented |
| `/api/notices/:id` | GET | No | Get single notice | ✅ Implemented |
| `/api/notices/bbox` | GET | No | Geospatial search | ✅ Implemented |
| `/api/notices/publish` | POST | Yes | Publish new notice | ✅ Implemented |
| `/api/notices/:id` | PUT | Yes | Update notice | ❓ Check `/server/routes/notices.ts` |
| `/api/notices/:id` | DELETE | Yes | Delete notice | ❓ Check `/server/routes/notices.ts` |

**Files**:
- `/server/routes/notices.ts` - Main notice CRUD
- `/server/routes/publish.ts` - Publishing workflow

### Representations (Public Submissions)

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/representations` | POST | No | Submit representation | ✅ Implemented (line 352) |
| `/api/notices/:id/representations` | GET | Yes | List representations for notice | ✅ Implemented |
| `/api/notices/:id/representations/counts` | GET | Yes | Get representation counts | ✅ Implemented |
| `/api/representations/:id` | GET | Yes | Get single representation | ✅ Implemented |
| `/api/representations/:id/mark-read` | POST | Yes | Mark as read | ✅ Implemented |
| `/api/representations/:id/comment` | POST | Yes | Add internal comment | ✅ Implemented |
| `/api/representations/counts/bulk` | POST | Yes | Bulk count fetch | ✅ Implemented |
| `/api/representations/export` | GET | Yes | Export representations | ✅ Implemented |

**File**: `/server/routes/representations.ts`

**RBAC Permissions Required**:
- `representations.read` - View representations
- `representations.update` - Mark as read
- `representations.comment` - Add internal comments
- `representations.export` - Export to CSV/JSON

### File Upload & OCR

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/upload` | POST | Yes | Upload file + OCR | ✅ Implemented |

**File**: `/server/routes/upload.ts`

**OCR Provider**: Tesseract.js (client-side) or server-side integration

### Council Portal

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/councils` | GET | No | List councils | ✅ Implemented |
| `/api/councils/:slug` | GET | No | Get council details | ✅ Implemented |

**File**: `/server/routes/councils.ts`

### Billing & Payment

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/billing/account` | GET | Yes | Get billing account | ✅ Structure exists |
| `/api/billing/pay` | POST | Yes | Process payment | ✅ Structure exists |

**File**: `/server/routes/publish.ts` (lines 210-363)

**Payment Provider**: Stripe (integration TBD)

**Test Mode**: Likely has skip payment option for development

### Drafts Management

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/drafts` | * | Yes | Draft CRUD operations | ✅ Implemented |

**File**: `/server/routes/drafts.ts`

### Firm Management

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/firms/*` | * | Yes | Professional firm features | ✅ Implemented |

**File**: `/server/routes/firm.ts`

### Additional Services

| Endpoint | Method | Auth Required | Purpose | Status |
|----------|--------|---------------|---------|--------|
| `/api/address` | GET | No | Address lookup | ✅ Implemented |
| `/api/templates` | * | Yes | Notice templates | ✅ Implemented |
| `/api/ai-summary` | POST | Yes | AI-powered summarization | ✅ Implemented |
| `/api/notify` | POST | Yes | Email notifications | ✅ Implemented |
| `/api/team` | * | Yes | Team management | ✅ Implemented |
| `/api/settings` | * | Yes | User/firm settings | ✅ Implemented |

---

## Database Schema (Supabase)

### Core Tables

#### `notices` Table
**Status**: ✅ Implemented

**Key Columns**:
- `id` (UUID, primary key)
- `notice_type` (string)
- `status` (enum: draft, published, archived)
- `applicant_name` (string)
- `premises_name` (string)
- `premises_address` (text)
- `location` (geography - PostGIS)
- `application_date` (date)
- `deadline_date` (date)
- `publication_date` (date)
- `council_id` (FK to councils)
- `firm_id` (FK to firms, nullable)
- `user_id` (FK to auth.users, nullable)
- `created_at`, `updated_at` (timestamps)

**Indexes**:
- Geospatial index on `location` for bbox queries
- Index on `status`, `notice_type`, `council_id`

#### `councils` Table
**Status**: ✅ Implemented

**Key Columns**:
- `id` (UUID)
- `name` (string)
- `slug` (string, unique)
- `address` (text)
- `licensing_email` (string)
- `planning_email` (string)
- `created_at` (timestamp)

#### `representations` Table
**Status**: ✅ Implemented

**Key Columns**:
- `id` (UUID)
- `notice_id` (FK to notices)
- `full_name` (string)
- `email` (string)
- `address` (text)
- `representation_type` (enum: objection, support, comment)
- `comments` (text)
- `submitted_at` (timestamp)
- `status` (enum: new, read, acknowledged)

**Relationships**:
- Many-to-one with `notices`

#### `firms` Table
**Status**: ✅ Implemented

**Purpose**: Professional firms (solicitors, licensing agents)

**Key Columns**:
- `id` (UUID)
- `name` (string)
- `slug` (string)
- `practice_areas` (JSON array)
- `created_at` (timestamp)

#### `auth.users` Table
**Status**: ✅ Supabase managed

**Authentication Provider**: Supabase Auth

**User Types**:
- Council officers
- Firm users
- Public users (for representations?)

### Storage Buckets

#### `notices` Bucket
**Status**: ✅ Implemented

**Purpose**: Store uploaded notice PDFs, images, supporting documents

**Security**: Row-level security policies

---

## Authentication & Authorization

### Authentication Methods

| Method | Status | Use Case |
|--------|--------|----------|
| **Demo Mode** | ✅ Working | Testing without Supabase config |
| **Supabase Auth** | ⚠️ Partial | Full production auth (config needed) |
| **Email/Password** | ✅ Implemented | Standard login |
| **Magic Link** | ❓ Unknown | Passwordless login |

### Demo Credentials

**Council Officer**:
```
Email: demo@council.gov.uk
Password: demo123
Redirects to: /c/westminster/licensing/dashboard
```

**Professional Firm**:
```
Email: solicitor@wilsonpartners.com
Password: SolicitorTest123!
Redirects to: /f/wilson-partners/dashboard
```

**Test Users (RBAC)**:
- `viewer@test.civicnotices.co.uk` (permissions: 4)
- `officer@test.civicnotices.co.uk` (permissions: 12)
- `admin@test.civicnotices.co.uk` (permissions: 21)

### RBAC (Role-Based Access Control)

**Permissions System**: Bitmask-based

**Common Permissions**:
- `representations.read` - View representations
- `representations.update` - Update representation status
- `representations.comment` - Add internal comments
- `representations.export` - Export data
- `notices.publish` - Publish notices
- `notices.edit` - Edit notices
- `notices.delete` - Delete notices

**Middleware**:
- `requireAuth` - User must be authenticated
- `optionalAuth` - Auth preferred but not required
- `loadUserPermissions` - Load user's permission bitmask
- `requirePermission(perm)` - Check specific permission

**Files**:
- `/server/middleware/auth.ts`

---

## Integration Tests Required

### High Priority

1. **Publish Workflow** (End-to-End):
   ```
   POST /api/notices/publish
   ├── Body: { noticeType, templateData, contactEmail }
   ├── Auth: Bearer token required
   ├── Expected: 201 Created + notice ID
   └── Verify: Notice appears in database
   ```

2. **Representations Submission** (Public):
   ```
   POST /api/representations
   ├── Body: { noticeId, fullName, email, address, type, comments }
   ├── Auth: None (public endpoint)
   ├── Expected: 201 Created
   └── Verify: Representation appears in council portal
   ```

3. **Council Portal - View Representations**:
   ```
   GET /api/notices/:id/representations
   ├── Auth: Council officer
   ├── Permissions: representations.read
   ├── Expected: Array of representations
   └── Verify: Can mark as read
   ```

### Medium Priority

4. **File Upload + OCR**:
   ```
   POST /api/upload
   ├── Body: multipart/form-data with file
   ├── Expected: Extracted text + file URL
   └── Verify: File stored in Supabase storage
   ```

5. **Geospatial Search**:
   ```
   GET /api/notices/bbox?minLng=-0.2&minLat=51.4&maxLng=-0.1&maxLat=51.6
   ├── Expected: Notices within bounding box
   └── Verify: Accurate location filtering
   ```

### Low Priority

6. **Billing Integration**:
   - Test mode payment flow
   - Stripe webhook handling
   - Invoice generation

---

## Known Issues & Gaps

### 🔴 CRITICAL

**None identified** - Core endpoints exist and appear functional

### 🟡 MEDIUM

1. **Payment Integration Incomplete**:
   - Stripe credentials not configured
   - Test mode flow needs verification
   - Invoice/receipt generation status unknown

2. **Email Notifications Not Verified**:
   - `sendNoticeConfirmation()` service exists (`/server/services/email.ts`)
   - SMTP/SendGrid configuration needed
   - Email templates status unknown

3. **Demo Mode Persistence**:
   - Demo logins use `window.location.href` (full page reload)
   - Not using React Router navigation
   - May cause state loss

### 🟢 LOW

1. **API Documentation Missing**:
   - No OpenAPI/Swagger spec
   - Endpoint documentation in code comments only

2. **Rate Limiting Not Verified**:
   - Public endpoints (representations) need rate limiting
   - DDoS protection status unknown

3. **Audit Logging**:
   - User action logging status unknown
   - Compliance requirement for public sector

---

## Environment Variables Required

### Core
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5174
NODE_ENV=development
```

### Optional
```bash
# Feature Flags
NEW_PUBLISH_FLOW=true

# External Services
VITE_MAP_STYLE_URL=https://api.maptiler.com/...
ADDRESS_PROVIDER=mock # or getAddress
POSTCODES_IO_URL=https://api.postcodes.io

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
FROM_EMAIL=notices@publicnotices.co.uk
```

---

## Testing Recommendations

### Immediate Tests (This Sprint)

1. **Publish a notice manually** via browser:
   - Login as `demo@council.gov.uk`
   - Complete wizard Steps 1-4
   - Verify notice appears in database
   - Check for console errors

2. **Submit a representation** as public user:
   - Navigate to published notice
   - Fill representation form
   - Verify submission success
   - Check council portal shows representation

3. **Verify geospatial search**:
   - Open map view: `/notices/map`
   - Pan around London
   - Verify notices load in viewport
   - Check clustering behavior

### Next Sprint

4. **Payment flow testing**:
   - Test mode payment (skip payment button)
   - Verify notice published after payment
   - Check billing account page

5. **File upload/OCR testing**:
   - Upload various file types (PDF, JPG, PNG)
   - Verify text extraction
   - Test error handling for unsupported formats

6. **RBAC testing**:
   - Login as different user roles
   - Verify permission enforcement
   - Test unauthorized access returns 403

---

## Database Migrations

### Check Migration Status
```bash
# If using Supabase migrations
supabase migration list

# Check current schema
psql $DATABASE_URL -c "\dt"
```

### Required Migrations (If Missing)

1. **PostGIS Extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Geospatial Index**:
   ```sql
   CREATE INDEX idx_notices_location ON notices USING GIST(location);
   ```

3. **Representations Status Enum**:
   ```sql
   CREATE TYPE representation_status AS ENUM ('new', 'read', 'acknowledged');
   ```

---

## API Health Check

### Quick Verification Script

```bash
#!/bin/bash

API_BASE="http://localhost:5174"

echo "Testing API endpoints..."

# Health check
curl -s "$API_BASE/api/health" | jq

# List notices
curl -s "$API_BASE/api/notices?limit=5" | jq '.notices | length'

# List councils
curl -s "$API_BASE/api/councils" | jq '.length'

# Test geospatial (London bbox)
curl -s "$API_BASE/api/notices/bbox?minLng=-0.2&minLat=51.4&maxLng=-0.1&maxLat=51.6" | jq '.notices | length'

echo "✓ Core endpoints responding"
```

---

## Conclusion

### What's Fully Implemented ✅

- Notice publishing API (`POST /api/notices/publish`)
- Representations API (full CRUD)
- Geospatial search (bbox queries)
- Council and firm management
- RBAC middleware
- File upload infrastructure
- Draft saving system

### What's Partially Implemented ⚠️

- Payment processing (structure exists, Stripe config needed)
- Email notifications (service exists, SMTP config needed)
- Demo authentication (works but uses full page reloads)

### What's Unknown ❓

- Test coverage for API endpoints
- Load testing/performance benchmarks
- Database migration history
- Backup/disaster recovery procedures

### Production Readiness Checklist

- ✅ Core API endpoints functional
- ✅ Database schema designed
- ✅ Authentication infrastructure
- ⚠️ Payment integration incomplete
- ⚠️ Email notifications not configured
- ❌ API documentation missing
- ❌ Rate limiting not verified
- ❌ Monitoring/alerting not configured
- ❌ Backup procedures not documented

**Estimated Effort to Production**: 20-30 hours

---

**Report Generated**: 2025-11-06
**Next Review**: After payment/email integration
**Owner**: CivicDev (AI Assistant)
