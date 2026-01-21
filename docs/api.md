# CivicNotices API Documentation

## Overview

CivicNotices provides a RESTful API for managing public notices, representations, and workflow management. The API is available at `http://localhost:5174` in development.

**Base URL**: `/api`

## Authentication

Most endpoints require authentication via a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

- **Public endpoints**: No authentication required (browsing notices, submitting representations)
- **Authenticated endpoints**: Require valid JWT token
- **Admin endpoints**: Require admin role in JWT claims

---

## Notices

### Search Notices

```http
GET /api/notices/search
```

Search and filter public notices.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `type` | string | Notice type (premises, variation, review, gvol, tro, planning, gambling, probate, other) |
| `council_id` | uuid | Filter by council |
| `status` | string | Notice status |
| `lat`, `lng`, `radius` | number | Geospatial search (center point + radius in km) |
| `page`, `limit` | number | Pagination |

**Response**:
```json
{
  "notices": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20 }
}
```

### Get Notice by ID

```http
GET /api/notices/:id
```

Get detailed information about a specific notice.

**Response**:
```json
{
  "id": "uuid",
  "notice_type": "premises",
  "title": "...",
  "content": "...",
  "applicant_name": "...",
  "premises_address": "...",
  "council_id": "uuid",
  "status": "published",
  "created_at": "2026-01-21T00:00:00Z",
  "consultation_end_date": "2026-02-21T00:00:00Z"
}
```

### Submit Notice (Pay-per-notice)

```http
POST /api/notices/submit
```

Submit a notice for publication. Can be authenticated or anonymous.

**Request Body**:
```json
{
  "notice_type": "premises",
  "applicant_name": "John Smith",
  "premises_address": "123 High Street, London, SW1A 1AA",
  "content": "Notice text...",
  "council_id": "uuid",
  "payment_intent_id": "pi_..."
}
```

**Response**:
```json
{
  "ok": true,
  "notice": { "id": "uuid", ... },
  "certificate_number": "CN-2026-001234"
}
```

### Draft Notice (Authenticated)

```http
POST /api/notices/draft
```

**Requires**: Authentication + `notices.create` permission

Create a draft notice for later submission.

---

## Representations

Public comments, objections, and support for notices.

### List Representations for Notice

```http
GET /api/notices/:noticeId/representations
```

Get all representations for a specific notice.

**Response**:
```json
{
  "representations": [
    {
      "id": "uuid",
      "notice_id": "uuid",
      "type": "objection",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "text": "I object because...",
      "is_read": false,
      "created_at": "2026-01-21T12:00:00Z"
    }
  ]
}
```

### Submit Representation

```http
POST /api/notices/:noticeId/representations
```

Submit a public representation (objection, support, or comment) on a notice.

**Request Body**:
```json
{
  "type": "objection",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "456 Oak Lane, London, W1 1AB",
  "text": "I object to this application because..."
}
```

**Response**:
```json
{
  "ok": true,
  "representation": { "id": "uuid", ... }
}
```

### Mark Representation as Read

```http
POST /api/notices/:id/representations/:repId/mark-read
```

**Requires**: Authentication

Mark a representation as read by council staff.

---

## Workflow Management

For firm users managing notice workflows.

### Get Workflow Configurations

```http
GET /api/workflow/configs
```

**Requires**: Authentication

Get all workflow configurations for the authenticated user's organization.

**Response**:
```json
{
  "ok": true,
  "configs": [
    {
      "id": "uuid",
      "notice_type": "premises",
      "is_active": true,
      "stages": [
        { "id": "uuid", "name": "Draft", "slug": "draft", "position": 1 },
        { "id": "uuid", "name": "Submitted", "slug": "submitted", "position": 2 }
      ]
    }
  ]
}
```

### Get Workflow Configuration by Notice Type

```http
GET /api/workflow/configs/:noticeType
```

**Requires**: Authentication

Get workflow configuration for a specific notice type.

### Get Notice Workflow Status

```http
GET /api/workflow/notices/:noticeId/status
```

**Requires**: Authentication

Get the current workflow status of a notice.

**Response**:
```json
{
  "ok": true,
  "status": {
    "notice_id": "uuid",
    "current_stage_id": "uuid",
    "current_stage_name": "Submitted",
    "entered_stage_at": "2026-01-21T10:00:00Z"
  }
}
```

### Transition Notice Stage

```http
POST /api/workflow/notices/:noticeId/transition
```

**Requires**: Authentication + firm member

Move a notice to a different workflow stage.

**Request Body**:
```json
{
  "toStageId": "uuid",
  "notes": "Moving to next stage"
}
```

### Initialize Notice Workflow

```http
POST /api/workflow/notices/:noticeId/initialize
```

**Requires**: Authentication + firm member

Initialize workflow tracking for a notice.

**Request Body**:
```json
{
  "noticeType": "premises"
}
```

---

## Drafts

Manage notice drafts before publication.

### List Drafts

```http
GET /api/drafts
```

**Requires**: Authentication

Get all drafts for the authenticated user.

### Get Draft by ID

```http
GET /api/drafts/:id
```

**Requires**: Authentication

### Create Draft

```http
POST /api/drafts
```

**Requires**: Authentication

**Request Body**:
```json
{
  "notice_type": "premises",
  "applicant_name": "...",
  "premises_address": "...",
  "content": "..."
}
```

### Update Draft

```http
PUT /api/drafts/:id
```

**Requires**: Authentication

### Delete Draft

```http
DELETE /api/drafts/:id
```

**Requires**: Authentication

### Publish Draft

```http
POST /api/drafts/:id/publish
```

**Requires**: Authentication

Convert a draft to a published notice.

---

## Certificates

Publication certificates and receipts.

### Get Publication Certificate

```http
GET /api/certificates/publication/:noticeId
```

Download the PDF publication certificate for a notice.

**Response**: `application/pdf`

### Get Payment Receipt

```http
GET /api/certificates/receipt/:noticeId
```

Download the PDF payment receipt for a notice.

**Response**: `application/pdf`

### Verify Certificate

```http
GET /api/certificates/verify/:certificateNumber
```

Verify a publication certificate by its certificate number.

**Response**:
```json
{
  "ok": true,
  "valid": true,
  "notice": { "id": "uuid", "title": "...", "published_at": "..." }
}
```

---

## Compliance Checking (AI)

AI-powered compliance analysis for notices.

### Check Notice Compliance

```http
POST /api/compliance/check
```

Analyze a draft notice for compliance issues.

**Request Body**:
```json
{
  "noticeType": "premises",
  "applicantName": "John Smith",
  "premisesAddress": "123 High Street, London",
  "content": "Notice text..."
}
```

**Response**:
```json
{
  "ok": true,
  "result": {
    "isCompliant": true,
    "issues": [],
    "suggestions": ["Consider adding..."],
    "checkedAt": "2026-01-21T12:00:00Z"
  }
}
```

### Check NoticeBase Compliance

```http
POST /api/compliance/check-base
```

Check compliance using the NoticeBase format (for wizard flow).

---

## Notice Drafting (AI)

AI-powered notice text generation.

### Generate Draft

```http
POST /api/drafting/generate
```

Generate notice text from structured input.

**Request Body**:
```json
{
  "noticeType": "premises",
  "applicantName": "John Smith",
  "premisesAddress": "123 High Street, London, SW1A 1AA"
}
```

**Response**:
```json
{
  "ok": true,
  "result": {
    "success": true,
    "draftText": "LICENSING ACT 2003...",
    "noticeType": "premises",
    "generatedAt": "2026-01-21T12:00:00Z",
    "suggestions": ["Review operating hours"]
  }
}
```

### Generate from NoticeBase

```http
POST /api/drafting/from-notice-base
```

Generate draft from NoticeBase format (wizard flow).

### Generate from Draft

```http
POST /api/drafting/from-draft
```

Generate draft from existing NoticeDraft format.

---

## Representation Analysis (AI)

AI-powered analysis of public representations.

### Analyze Single Representation

```http
POST /api/representation-analysis/analyze
```

Analyze a single representation text.

**Request Body**:
```json
{
  "text": "I object to this application because...",
  "stance": "objection",
  "representationId": "uuid"
}
```

**Response**:
```json
{
  "ok": true,
  "analysis": {
    "stance": "objection",
    "stanceConfidence": 0.95,
    "themes": [
      { "name": "Noise", "confidence": 0.8 }
    ],
    "licensingObjectives": [
      {
        "name": "Prevention of Public Nuisance",
        "cited": true,
        "relevantText": "noise late at night"
      }
    ],
    "summary": "Objection citing noise concerns...",
    "wordCount": 50,
    "sentenceCount": 3,
    "analyzedAt": "2026-01-21T12:00:00Z"
  }
}
```

### Analyze Multiple Representations

```http
POST /api/representation-analysis/analyze-multiple
```

Batch analysis with aggregate statistics.

**Request Body**:
```json
{
  "representations": [
    { "id": "uuid1", "text": "...", "type": "objection" },
    { "id": "uuid2", "text": "...", "type": "support" }
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "analyses": [...],
  "aggregate": {
    "total": 2,
    "supportCount": 1,
    "objectionCount": 1,
    "commentCount": 0,
    "topThemes": ["Noise", "Community Impact"],
    "objectivesCited": {
      "Prevention of Public Nuisance": 2
    }
  }
}
```

---

## Firm Management

### Get Firm Team

```http
GET /api/firm/:firmId/team
```

**Requires**: Authentication + firm member

List all team members in a firm.

### Invite Team Member

```http
POST /api/firm/:firmId/team/invite
```

**Requires**: Authentication + admin/owner role

**Request Body**:
```json
{
  "email": "newmember@example.com",
  "role": "officer"
}
```

### Update Member Role

```http
PATCH /api/firm/:firmId/team/:membershipId/role
```

**Requires**: Authentication + admin/owner role

### Remove Team Member

```http
DELETE /api/firm/:firmId/team/:membershipId
```

**Requires**: Authentication + admin/owner role

### Get Firm Settings

```http
GET /api/firm/:firmId/settings
```

**Requires**: Authentication + firm member

### Update Firm Settings

```http
PATCH /api/firm/:firmId/settings
```

**Requires**: Authentication + admin/owner role

---

## Firm Departments

### List Departments

```http
GET /api/firm/departments
```

**Requires**: Authentication

### Create Department

```http
POST /api/firm/departments
```

**Requires**: Authentication + admin/owner role

**Request Body**:
```json
{
  "name": "Commercial Property",
  "description": "Commercial licensing matters"
}
```

### Update Department

```http
PATCH /api/firm/departments/:id
```

**Requires**: Authentication + admin/owner role

### Delete Department

```http
DELETE /api/firm/departments/:id
```

**Requires**: Authentication + admin/owner role

---

## Firm Templates

### List Templates

```http
GET /api/firm/templates
```

**Requires**: Authentication

### Get Template

```http
GET /api/firm/templates/:id
```

**Requires**: Authentication

### Create Template

```http
POST /api/firm/templates
```

**Requires**: Authentication + admin/owner role

**Request Body**:
```json
{
  "name": "Standard Premises Licence",
  "notice_type": "premises",
  "description": "Template for standard premises licence applications",
  "template_data": { "fields": [...] },
  "is_shared": true
}
```

### Update Template

```http
PATCH /api/firm/templates/:id
```

**Requires**: Authentication + admin/owner role

### Delete Template

```http
DELETE /api/firm/templates/:id
```

**Requires**: Authentication + admin/owner role

### Use Template

```http
POST /api/firm/templates/:id/use
```

**Requires**: Authentication

Record template usage for analytics.

---

## Firm Subscriptions

### Get Subscription Tiers

```http
GET /api/firm-subscriptions/tiers
```

Get available subscription plans.

### Get Organization Subscription

```http
GET /api/firm-subscriptions/organization/:orgId
```

**Requires**: Authentication

### Create Subscription

```http
POST /api/firm-subscriptions/organization/:orgId
```

**Requires**: Authentication + admin/owner role

### Get Usage

```http
GET /api/firm-subscriptions/:subscriptionId/usage
```

**Requires**: Authentication

### Check Can Publish

```http
GET /api/firm-subscriptions/organization/:orgId/can-publish
```

**Requires**: Authentication

Check if organization can publish (within subscription limits).

### Cancel Subscription

```http
POST /api/firm-subscriptions/:subscriptionId/cancel
```

**Requires**: Authentication + admin/owner role

---

## Council Portal

### Get Pending Submissions

```http
GET /api/council/pending-submissions
```

**Requires**: Authentication + council role

Get notices pending council review.

### Approve Notice

```http
POST /api/council/notices/:id/approve
```

**Requires**: Authentication + council role

### Reject Notice

```http
POST /api/council/notices/:id/reject
```

**Requires**: Authentication + council role

**Request Body**:
```json
{
  "reason": "Incomplete information provided"
}
```

### Get Department Stats

```http
GET /api/council/departments/:councilId/stats
```

**Requires**: Authentication + council role

### Get Unread Representation Count

```http
GET /api/council/representations/unread-count
```

**Requires**: Authentication + council role

---

## Analytics

### Get Council Analytics

```http
GET /api/analytics/council/:councilId
```

**Requires**: Authentication + council role

Get analytics dashboard data for a council.

### Get Monthly Trends

```http
GET /api/analytics/council/:councilId/monthly-trends
```

**Requires**: Authentication + council role

### Get Department Comparison

```http
GET /api/analytics/council/:councilId/department-comparison
```

**Requires**: Authentication + council role

### Get Compliance Metrics

```http
GET /api/analytics/council/:councilId/compliance
```

**Requires**: Authentication + council role

### Get Engagement Metrics

```http
GET /api/analytics/council/:councilId/engagement
```

**Requires**: Authentication + council role

---

## File Upload

### Upload Notice Document

```http
POST /api/upload
```

Upload a document for OCR processing.

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "ok": true,
  "url": "https://storage.../file.pdf",
  "extractedText": "...",
  "ocrResult": { ... }
}
```

---

## Address Lookup

### Search Addresses

```http
GET /api/addresses?q=SW1A
```

Search for UK addresses by postcode or query.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Postcode or address query |

**Response**:
```json
{
  "addresses": [
    {
      "line1": "10 Downing Street",
      "line2": "",
      "town": "London",
      "postcode": "SW1A 2AA",
      "formatted": "10 Downing Street, London, SW1A 2AA"
    }
  ]
}
```

### Resolve Address

```http
GET /api/address/resolve?address=SW1A+2AA
```

Get detailed address information.

---

## Councils

### List Councils

```http
GET /api/councils
```

Get list of all UK councils.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Council type filter |
| `search` | string | Search by name |

---

## Statistics

### Get Platform Stats

```http
GET /api/stats
```

Get public platform statistics.

**Response**:
```json
{
  "ok": true,
  "data": {
    "notices": 1234,
    "representations": 5678,
    "councils": 160
  }
}
```

---

## Payments (Stripe)

### Create Checkout Session

```http
POST /api/stripe/create-checkout-session
```

Create a Stripe checkout session for notice payment.

**Request Body**:
```json
{
  "noticeId": "uuid",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

### Get Session Status

```http
GET /api/stripe/session/:sessionId/status
```

Check payment session status.

### Webhook

```http
POST /api/stripe/webhook
```

Stripe webhook endpoint (handles payment events).

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Notice type is required"
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

## Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Admin endpoints: No limit

---

## Versioning

The API is currently at v1. Breaking changes will be introduced in new versions with appropriate deprecation notices.
