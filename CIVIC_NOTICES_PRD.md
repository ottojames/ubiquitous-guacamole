# CIVIC NOTICES - PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Version 1.0 - January 14, 2026

---

## EXECUTIVE SUMMARY

### Product Vision
Civic Notices is a digital public notice platform that replaces newspaper requirements for UK statutory notices. It enables solicitors/applicants to publish licensing notices that automatically route to relevant councils, while allowing residents to discover and respond to notices in their area.

### Business Objectives
- Replace £50M annual newspaper notice market
- Achieve £100M+ valuation within 18-24 months
- Capture 300+ councils and 500+ law firms
- Process 100,000+ notices annually

### Success Metrics
- **Primary**: Monthly Recurring Revenue (MRR) reaching £1.5M within 12 months
- **Secondary**:
  - Notice publication volume (1000+/month by month 6)
  - Council adoption rate (50% of UK councils within 18 months)
  - Resident engagement (10%+ representation rate vs <0.1% newspapers)
  - Time to publish (<5 minutes vs days with newspapers)

---

## PHASE 0: CURRENT STATE AUDIT (MUST COMPLETE FIRST)

### Capability Inventory

| Feature | Exists? | Location | Evidence | Gaps/Bugs | Owner | Fix Estimate |
|---------|---------|----------|----------|-----------|-------|--------------|
| **PUBLIC PORTAL** |
| Notice search by postcode | ✅ Yes | `/notices` | Working | No distance radius filter | - | 2 hours |
| Map view with pins | ✅ Yes | `/notices` (map tab) | MapLibre GL implemented | Missing mini-map on detail page | - | 4 hours |
| Notice detail page | ✅ Yes | `/notice/:id` | Working | No mini-map, no print view | - | 3 hours |
| Submit representation | ✅ Yes | `/notice/:id` form | Working | No email confirmation, no attachments | - | 4 hours |
| **PUBLISH FLOW** |
| Multi-step wizard | ✅ Yes | `/publish/*` | 4 steps working | Missing preview editor with line breaks | - | 6 hours |
| OCR document upload | ✅ Yes | Step 2 | Tesseract.js | Accuracy ~80%, no field mapping UI | - | 8 hours |
| Structured templates | ⚠️ Partial | `/publish/step-1` | Basic types only | No council-specific templates | - | 16 hours |
| Address lookup | ✅ Yes | Step 3 | getAddress.io | Working | - | - |
| Payment integration | ❌ No | - | Stripe keys in .env but not connected | Not implemented | - | 8 hours |
| **COUNCIL PORTAL** |
| Authentication | ✅ Yes | Magic links | Supabase Auth | Working | - | - |
| Department structure | ✅ Yes | DB schema | organizations + departments tables | UI incomplete | - | 4 hours |
| Notice management | ✅ Yes | `/c/:org/:dept/notices` | Basic CRUD | Missing bulk actions | - | 4 hours |
| Template management | ⚠️ Partial | `/c/:org/:dept/templates` | DB exists | No UI for editing | - | 8 hours |
| Representation inbox | ✅ Yes | `/c/:org/:dept/representations` | List view | No export, no internal comments | - | 6 hours |
| Analytics dashboard | ⚠️ Basic | `/c/:org/:dept/dashboard` | Count stats only | No charts, no filtering | - | 8 hours |
| **FIRM PORTAL** |
| Firm registration | ❌ No | - | - | Not built | - | 8 hours |
| Client management | ❌ No | - | - | Not built | - | 8 hours |
| Bulk publishing | ❌ No | - | - | Not built | - | 12 hours |
| Subscription billing | ❌ No | - | - | Not built | - | 16 hours |
| **INFRASTRUCTURE** |
| Email service | ⚠️ Partial | Resend API key configured | Not sending | Templates not created | - | 4 hours |
| Resident alerts | ❌ No | - | - | Not implemented | - | 12 hours |
| Audit logging | ✅ Yes | `audit_log` table | Triggers working | Missing UI | - | 4 hours |
| Demo data | ⚠️ Mixed | Supabase | Westminster, Sampleton data | Needs cleanup script | - | 2 hours |

### Demo Data Cleanup Requirements
**URGENT - Must complete before any council demos**
- [ ] Remove all Sampleton Council data
- [ ] Remove all test notices
- [ ] Remove test users except approved demo accounts
- [ ] Create clean seed script with minimal demo data
- [ ] Document which accounts are for demos

---

## USER PERSONAS & JOURNEYS

### 1. Public Applicant (One-off Publisher)
**Who**: Individual or business needing to publish a statutory notice
**Goal**: Publish compliant notice quickly without legal expertise
**Pain Points**:
- Don't know requirements
- Fear of getting it wrong
- Newspaper process is opaque and expensive

**Journey**:
1. Arrives at site → Selects notice type
2. Chooses between:
   - **Route A**: Upload existing document → OCR extracts fields → Edit/verify
   - **Route B**: Fill structured template → Preview
3. Preview notice with ability to edit (INCLUDING line breaks/paragraphs)
4. Pay £49.99 (one-off Stripe payment)
5. Notice goes live immediately
6. Receives confirmation email with:
   - Link to published notice
   - PDF certificate
   - Deadline reminders
7. Can track representations via magic link

### 2. Resident/Public Citizen
**Who**: Local resident wanting to know about changes in their area
**Goal**: Stay informed and have their say on local matters
**Pain Points**:
- Never see newspaper notices
- Find out too late
- Don't know how to object

**Journey**:
1. Searches by postcode
2. Sets customizable radius (0.5km, 1km, 2km, 5km)
3. Views notices on map with pins
4. Clicks pin → Opens notice with mini-map on right
5. Subscribes to email alerts for their area
6. Receives email when new notice published within radius
7. Submits representation:
   - Can be anonymous OR verified
   - Text required
   - Attachments optional (evidence)
   - Rate limited (max 3 per notice per IP)
8. Receives confirmation email with reference number

### 3. Solicitor/Law Firm (Subscription)
**Who**: Legal professionals publishing notices regularly for clients
**Goal**: Efficient bulk publishing with client management
**Pain Points**:
- Manual process per client
- No bulk operations
- Tracking across clients

**Journey**:
1. Registers firm account
2. Selects subscription tier (£99 for 3, £299 for 10, £999 for 50 notices/month)
3. Dashboard shows:
   - Remaining notice allowance
   - Client list with quick publish buttons
   - All published notices
   - Representation counts
4. Publishing flow SKIPS payment (uses allowance)
5. Can bulk upload CSV of notices
6. Receives monthly invoice

### 4. Council Officer (Free Account)
**Who**: Licensing/planning officer managing statutory processes
**Goal**: Ensure compliance and manage public feedback
**Pain Points**:
- Paper representations
- No central view
- Manual tracking

**Journey**:
1. Receives invite to department (e.g., Westminster Licensing)
2. Dashboard auto-filtered to their department
3. Sees all notices published FOR their department
4. Can filter/sort by:
   - View count
   - Representation count
   - Status
   - Deadline
5. Reviews representations with internal commenting:
   - Head of department sees all comments
   - Junior officers see only their own
6. Exports representations to CSV for committee meetings
7. Manages ONE template per notice type for consistency

---

## FUNCTIONAL REQUIREMENTS

### FR1: Notice Publishing System

#### FR1.1: Dual Publishing Routes
**Requirement**: System MUST provide two distinct publishing paths

**Route A - OCR Upload**:
```
GIVEN user selects "Upload existing document"
WHEN they upload a PDF or image
THEN system extracts text via OCR
AND presents extracted fields in editable form
AND allows user to correct/complete any fields
AND validates against legal requirements
```

**Route B - Structured Template**:
```
GIVEN user selects "Use template"
WHEN they choose notice type and council
THEN system presents council's template (if exists) OR default template
AND validates each field as filled
AND shows real-time preview
```

#### FR1.2: Preview Editor
**Requirement**: Preview MUST support rich text editing

```
GIVEN user reaches preview step
WHEN they view the notice text
THEN they can:
  - Add line breaks (Enter key)
  - Add paragraph breaks (double Enter)
  - Edit any text inline
  - See changes reflected immediately
AND formatted text is preserved in published notice
```

#### FR1.3: Notice Page Layout
**Requirement**: Published notice page MUST show map context

```
GIVEN a published notice page
THEN page displays:
  - Notice content (left side, 2/3 width)
  - Mini-map (right side, 1/3 width) showing:
    - Pin at notice location
    - 1km radius circle
    - Zoom controls
  - Representation form below
  - Share/print buttons
```

### FR2: Council Template System

#### FR2.1: Template Governance

**🔴 CLARIFICATION NEEDED**: How do council templates work?

**Option A - Council Creates Templates in Civic Notices**:
```
- Council creates/edits templates within our platform
- Templates stored in our database
- Applicants see council-specific template when publishing
- Changes versioned and audited
```

**Option B - Link to Council's External Forms**:
```
- We scrape/integrate with council's existing portal
- Significant technical challenges (auth, anti-bot, inconsistent systems)
- Likely not feasible for most councils
```

**RECOMMENDATION**: Option A with these rules:
- ONE template per notice type per department
- Template changes require department head approval
- Previous versions archived but not editable
- Templates include:
  - Required fields
  - Field validation rules
  - Help text
  - Legal boilerplate

#### FR2.2: Template Selection Logic
```
GIVEN applicant selects notice type "Premises Licence"
AND selects "Westminster Council"
WHEN system checks for template
THEN:
  IF Westminster has custom template for Premises Licence
    THEN use Westminster's template
  ELSE use default Civic Notices template
```

### FR3: Resident Notification System

#### FR3.1: Subscription Management
```
GIVEN resident on /notices page
WHEN they click "Get email alerts"
THEN they can:
  - Enter email
  - Enter postcode
  - Select radius: 0.5km, 1km, 2km, 5km
  - Choose frequency: Immediate, Daily digest, Weekly digest
AND receive confirmation email with manage/unsubscribe link
```

#### FR3.2: Alert Triggers
```
GIVEN notice is published
WHEN system processes publication
THEN:
  - Find all subscriptions where notice location is within radius of subscription postcode
  - Queue emails based on subscriber preferences
  - Send within 5 minutes (immediate) or batch (digest)
  - Include: notice title, address, deadline, link
  - Prevent duplicates if notice edited
```

### FR4: Representation System

#### FR4.1: Identity Requirements

**🔴 CLARIFICATION NEEDED**: Anonymous vs Verified representations?

**Option A - Allow Both**:
```
- Anonymous: Only requires representation text
- Verified: Requires name, email, address
- Council sees flag indicating which type
```

**Option B - Verified Only**:
```
- All representations require name, email, address
- More defensible legally
- Reduces spam
```

**RECOMMENDATION**: Option A with these safeguards:
- Anonymous limited to 1 per IP per notice
- Verified can submit multiple
- Rate limiting: max 10 per hour per IP
- Captcha after 3 submissions

#### FR4.2: Representation Features
```
- Text field (required, min 10 chars, max 5000)
- Support/Object/Comment selection
- File attachments (optional, max 5 files, 10MB each)
- Terms acceptance checkbox
- Email confirmation sent
- Reference number generated
```

### FR5: Billing & Payments

#### FR5.1: Pricing Structure

**Public Applicants**: £49.99 per notice (one-off Stripe payment)

**Law Firms** (monthly subscription):
- Starter: £99/month (3 notices)
- Professional: £299/month (10 notices)
- Business: £999/month (50 notices)
- Enterprise: £2499/month (unlimited)

**Councils**: FREE (no payment required)

#### FR5.2: Payment Flow
```
Public Applicant:
  Publish flow → Payment page → Stripe Checkout → Success → Notice live

Law Firm:
  Publish flow → Use allowance → Skip payment → Notice live
  Monthly billing → Invoice generated → Auto-charge card

Council:
  Never see payment options
```

### FR6: Access Control & Permissions

#### FR6.1: Council Internal Comments

**🔴 CLARIFICATION NEEDED**: Exact visibility rules?

**Current Understanding**:
```
- Head of Department: Sees all comments in department
- Senior Officers: See own + junior officers' comments
- Junior Officers: See only own comments
```

**Need to Define**:
- How are seniority levels determined?
- Can comments be edited/deleted?
- Are comments included in exports?

#### FR6.2: Role Matrix

| Role | Can Publish | Can View Reps | Can Comment | Can Export | Can Edit Templates |
|------|------------|---------------|-------------|------------|-------------------|
| Public | Via payment | Own only | No | No | No |
| Firm Admin | Yes | Own notices | No | Own notices | No |
| Firm Member | Yes | Own notices | No | Own notices | No |
| Council Head | No* | All dept | Yes (all) | Yes | Yes |
| Council Officer | No* | Assigned | Yes (own) | Assigned | No |
| System Admin | Yes | All | Yes | Yes | Yes |

*Councils don't publish in this system - they receive publications

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR1: Performance
- Page load: < 2 seconds (P50), < 4 seconds (P95)
- Search results: < 500ms
- Map render: < 1 second for 1000 pins
- OCR processing: < 10 seconds per page
- Email delivery: < 5 minutes

### NFR2: Accessibility
- WCAG 2.1 Level AA compliance
- Screen reader compatible
- Keyboard navigation throughout
- Mobile responsive (all features)
- Print-friendly notice pages

### NFR3: Security & Compliance
- GDPR compliant with lawful basis documented
- Data retention: 7 years for legal notices
- Right to erasure: Not applicable for statutory records
- Audit log immutability (no updates/deletes)
- Evidence packages digitally signed
- Rate limiting on all public endpoints
- OWASP Top 10 mitigation

### NFR4: Reliability
- 99.9% uptime SLA
- Automated backups every 4 hours
- Point-in-time recovery to any point in last 30 days
- Geo-redundant storage
- Graceful degradation if OCR service fails

### NFR5: Scalability
- Support 10,000 concurrent users
- Handle 1,000 notices/day
- Store 1,000,000 notices
- Email 100,000 alerts/day

---

## ACCEPTANCE CRITERIA

### AC1: Notice Publishing
```
GIVEN a new user wanting to publish a premises licence notice
WHEN they complete the publish flow
THEN:
  ✓ Notice appears on public portal within 30 seconds
  ✓ Notice contains all legally required fields
  ✓ Deadline is calculated correctly (including bank holidays)
  ✓ Publisher receives confirmation email with link
  ✓ Council sees notice in their dashboard immediately
  ✓ Notice page includes mini-map showing location
  ✓ Representations can be submitted immediately
```

### AC2: Resident Alerts
```
GIVEN a resident subscribed to SW1A with 1km radius
WHEN a notice is published at SW1A 1AA
THEN:
  ✓ Email sent within 5 minutes
  ✓ Email contains notice title, address, deadline, link
  ✓ Unsubscribe link works
  ✓ No duplicate if notice edited
  ✓ Respects frequency preference (immediate/daily/weekly)
```

### AC3: Council Templates
```
GIVEN Westminster Council creates a premises licence template
WHEN an applicant publishes for Westminster
THEN:
  ✓ Westminster's template is presented
  ✓ All Westminster-specific fields are included
  ✓ Validation rules are applied
  ✓ Submitted data matches template structure
  ✓ Council receives structured data they can process
```

### AC4: Billing
```
GIVEN a law firm on Professional tier (10 notices/month)
WHEN they publish their 11th notice
THEN:
  ✓ System prevents publication
  ✓ Offers upgrade to Business tier
  ✓ OR pay one-off £49.99
  ✓ Monthly invoice shows 10 used
```

---

## OUT OF SCOPE

1. Mobile native apps (web responsive only)
2. Multi-language support (English only)
3. Social media integration
4. AI content generation (templates only)
5. Video/audio notices
6. Integration with all 382 council systems (templates suffice)
7. Blockchain verification
8. Physical mail notifications

---

## DEPENDENCIES

### External Services
- **Supabase**: Database, auth, storage (ACTIVE)
- **Stripe**: Payments (API KEYS NEEDED)
- **Resend/SendGrid**: Email delivery (CONFIGURED BUT NOT ACTIVE)
- **getAddress.io**: UK address lookup (ACTIVE)
- **Postcodes.io**: Geocoding (ACTIVE)
- **MapTiler**: Map tiles (ACTIVE)
- **Sentry**: Error tracking (ACTIVE)

### Technical Dependencies
- Node.js 20+
- PostgreSQL 14+
- Redis (for caching)

---

## RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Councils reject due to demo data | HIGH | HIGH | Phase 0: Clean all demo data |
| OCR accuracy too low | MEDIUM | HIGH | Provide manual override for all fields |
| Email deliverability issues | MEDIUM | HIGH | Use trusted provider, warm IPs |
| Stripe account rejected | LOW | CRITICAL | Have backup payment provider ready |
| Map service rate limits | LOW | MEDIUM | Cache tiles, use multiple providers |
| GDPR complaint | LOW | HIGH | Document lawful basis, privacy-by-design |

---

## TELEMETRY & SUCCESS TRACKING

### Events to Track
- Notice published (type, council, method, time-to-publish)
- Search performed (postcode, radius, result count)
- Representation submitted (notice, type, authenticated)
- Email opened (alert type, time-to-open)
- Template used vs skipped
- OCR accuracy (fields corrected)
- Payment completed/failed
- User registration by type

### KPIs to Monitor
- Daily Active Users (DAU)
- Notices published per day
- Representation rate (reps/notice)
- Email open rate
- Payment success rate
- Time to publish (median)
- Support ticket volume

---

## PRIORITY FIXES (MUST DO IMMEDIATELY)

### PF1: Remove Demo Logins from Production UI ⚠️ CRITICAL

**Problem**: Demo login credentials and quick login buttons are visible in production UI, creating security risk and unprofessional appearance.

**Requirements**:
1. **Council Portal Login** (`/auth/council` or `/council/login`):
   - Remove ALL hardcoded demo account lists
   - Remove demo buttons and quick login dropdowns
   - Remove any visible demo credentials
   - Display only standard login form (email/magic link)
   - Add helper text: "Need access? Contact support@civicnotices.co.uk"

2. **Professional/Firm Portal Login** (`/auth/firm` or `/firm/login`):
   - Remove ALL hardcoded demo account lists
   - Remove demo buttons and quick login dropdowns
   - Remove any visible demo credentials
   - Display only standard login form (email/password)
   - Add helper text: "Need access? Contact support@civicnotices.co.uk"

3. **Safe Demo Access Pattern**:
   - Option A: Environment gated - Show demo helpers ONLY if `DEMO_MODE=true` AND `NODE_ENV != production`
   - Option B: Hidden admin route (`/admin/demo`) protected by server-side secret
   - Option C: Documentation only - Keep demo credentials in `DEMO_ACCOUNTS.md` but never render in UI

**Acceptance Criteria**:
```
GIVEN any user visits council login page
WHEN page renders
THEN no demo credentials or quick login buttons are visible
AND only standard login form is shown

GIVEN any user visits firm/professional login page
WHEN page renders
THEN no demo credentials or quick login buttons are visible
AND only standard login form is shown

GIVEN environment variable DEMO_MODE=true AND NODE_ENV=development
WHEN developer visits login pages
THEN demo helpers MAY be shown for local development only
```

### PF2: Fix Publishing Wizard Submit Button ⚠️ CRITICAL

**Problem**: Step 4 submit button in publishing wizard does nothing when clicked, providing no feedback to users.

**Root Causes to Investigate**:
1. Missing or broken onClick handler
2. Stripe configuration missing (API keys not set)
3. Form validation failing silently
4. API endpoint returning error but not displayed
5. Navigation/routing not triggered after success

**Requirements**:
1. **Submit Button Behavior**:
   - MUST show loading state while processing
   - MUST display clear error messages if submission fails
   - MUST disable button during processing to prevent double-clicks
   - MUST provide visual feedback for all outcomes

2. **Error Handling**:
   - If Stripe keys missing: Show "Payment system not configured. Please contact support."
   - If validation fails: Show specific field errors
   - If API fails: Show "Unable to process payment. Please try again."
   - All errors must be logged server-side for debugging

3. **Success Path**:
   - Create Stripe checkout session
   - Redirect to Stripe hosted checkout
   - OR if payment disabled for testing: Create notice and show success message

**Acceptance Criteria**:
```
GIVEN user completes publish wizard to step 4
WHEN user clicks submit button
THEN button shows loading state
AND EITHER redirects to Stripe checkout
OR displays clear error message

GIVEN Stripe is not configured
WHEN user clicks submit
THEN error message states "Payment system not configured"
AND user is not left wondering what happened

GIVEN submission is in progress
WHEN user clicks submit again
THEN duplicate submission is prevented
AND button remains disabled until completion
```

---

## IMPLEMENTATION PRIORITY

### Phase 0: Demo Cleanup & Verification (Day 1)
- Audit all existing features
- Remove demo data
- Fix critical bugs found in audit
- Verify email sending

### Phase 1: Complete Core Publishing (Days 2-3)
- Payment integration
- Confirmation emails
- Preview editor with line breaks
- Notice page mini-map

### Phase 2: Resident Engagement (Days 4-5)
- Email alert subscriptions
- Radius-based notifications
- Representation attachments
- Confirmation emails

### Phase 3: Council Features (Days 6-7)
- Template creation UI
- Internal comments with permissions
- Export representations
- View/rep count sorting

### Phase 4: Law Firm Portal (Days 8-10)
- Registration flow
- Subscription billing
- Client management
- Bulk publishing

### Phase 5: Production Readiness (Days 11-12)
- Performance optimization
- Security audit
- Load testing
- Documentation

---

## QUESTIONS REQUIRING CLARIFICATION

1. **Council Templates**: Should councils create templates in our system (recommended) or do we integrate with their existing forms (complex)?

2. **Anonymous Representations**: Allow anonymous with rate limiting (recommended) or require verification for all?

3. **Internal Comments Hierarchy**: Define exact visibility rules - is it role-based (Head/Senior/Junior) or permission-based?

4. **Demo Accounts**: Which accounts should remain for demos? Need whitelist.

5. **Refund Policy**: What conditions allow refunds for published notices?

6. **Notice Amendments**: Can published notices be edited? If so, what triggers re-notification?

7. **International Addresses**: UK only or support international addresses for applicants?

8. **Audit Evidence Packages**: What specific documents need to be included for legal defensibility?

---

## DEFINITION OF DONE

A feature is considered complete when:

1. ✅ All acceptance criteria pass
2. ✅ Unit tests written and passing (>80% coverage)
3. ✅ Integration tests passing
4. ✅ Accessibility tested (WCAG 2.1 AA)
5. ✅ Security review completed
6. ✅ Documentation updated
7. ✅ Telemetry implemented
8. ✅ Deployed to staging
9. ✅ Product owner approval
10. ✅ No P0/P1 bugs

---

## APPENDICES

### A. Database Schema Requirements
[Link to detailed schema]

### B. API Specifications
[Link to OpenAPI spec]

### C. Email Templates
[Link to all email templates]

### D. Legal Requirements by Notice Type
[Link to compliance matrix]

### E. Competitor Analysis
[Link to competitor feature comparison]

---

**Document Status**: DRAFT - Pending Clarification
**Last Updated**: January 14, 2026
**Owner**: Product Team
**Next Review**: Upon clarification of open questions