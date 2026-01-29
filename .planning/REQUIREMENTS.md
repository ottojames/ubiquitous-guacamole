# Requirements

**Project:** Ralph's Civic Notices
**Last Updated:** 2026-01-22

## Requirements Summary

| Priority | Count | Status |
|----------|-------|--------|
| v1 (Must Have) | 28 | Pending |
| v2 (Deferred) | 8 | Deferred |

---

## v1 Requirements (Demo-Ready)

### Council Template System (TMPL)

**TMPL-01** - Template creation per notice type per department
- Department can create one template per notice type they manage
- Template includes default values and custom notice text
- Status: Partially Implemented (UI exists, needs testing)

**TMPL-02** - All 32 notice types have working templates
- Licensing: 4 types (premises new/variation, club new/variation)
- Gambling: 16 types (betting/bingo/agc/fec x new/variation/review/transfer)
- GVOL: 2 types (new/variation)
- Planning: 6 types (major/eia/listed/conservation/prow/departure)
- Probate: 1 type (trustee s.27)
- TRO: 3 types (permanent/temporary/experimental)
- Status: Schemas exist, template UI exists, end-to-end untested

**TMPL-03** - Template text renders correctly with placeholders
- {{applicant}}, {{premises_address}}, {{deadline}} etc. replaced correctly
- Preview shows rendered output before creation
- Status: Partial (TemplateTextEditor exists, rendering untested)

**TMPL-04** - Template validation warns on missing required fields
- Each notice type has required fields per legislation
- Validation shows warnings if template doesn't include them
- Status: Partial (TemplateValidationWarnings component exists)

### Department Isolation (DEPT)

**DEPT-01** - Licensing department sees only licensing notices
- Licensing Act 2003 + Gambling Act 2005 notice types
- Other department notices invisible
- Status: RLS policies exist, needs verification

**DEPT-02** - Planning department sees only planning notices
- TCPA 1990 notice types
- Other department notices invisible
- Status: RLS policies exist, needs verification

**DEPT-03** - Traffic/Highways department sees only TRO notices
- RTRA 1984 notice types + GVOL
- Other department notices invisible
- Status: RLS policies exist, needs verification

**DEPT-04** - Department switcher works for multi-department users
- User can belong to multiple departments
- Switcher shows all departments user has access to
- Switching changes context and filters data
- Status: DepartmentSwitcher component exists, needs testing

**DEPT-05** - RLS policies enforce isolation at database level
- Even API bypass cannot access other department data
- Audit log entries scoped to department
- Status: Migrations exist, enforcement untested

### Data Flow (FLOW)

**FLOW-01** - Publisher submits notice via wizard
- 4-step flow: Type > Upload > Details > Pay
- Notice created in database with council_id and department assignment
- Status: NewPublishFlow exists, council assignment untested

**FLOW-02** - Notice appears in correct council department dashboard
- Council determined by premises postcode
- Department determined by notice type category
- Dashboard shows pending submissions
- Status: Council matching exists, flow untested

**FLOW-03** - Council staff can view notice details
- Full notice content visible
- Attached documents downloadable
- Status: NoticeDetail page exists

**FLOW-04** - Public can submit representations
- Support, Objection, or Comment
- Stored with notice reference
- Status: Representation submission exists

**FLOW-05** - Representations appear in council dashboard
- Filtered by department's notices only
- Sortable by date, type, review status
- Status: Representations page exists, filtering untested

**FLOW-06** - Council can mark representations as reviewed
- Timestamp and reviewer recorded
- Status: Review functionality exists

**FLOW-07** - Council can assign representations to team members
- Assignment modal works
- Assigned user notified
- Status: AssignRepresentationModal exists

### Email System (EMAIL)

**EMAIL-01** - Publication confirmation sent to notice publisher
- Sent when notice status changes to published
- Contains notice details and view link
- Status: sendNoticeConfirmation exists, trigger untested

**EMAIL-02** - Representation confirmation sent to representor
- Sent when representation submitted
- Contains submission details and deadline
- Status: sendRepresentationConfirmation exists, trigger untested

**EMAIL-03** - Council notified of new representations
- Sent to department email or assigned user
- Contains representation preview and dashboard link
- Status: sendRepresentationNotificationToCouncil exists, trigger untested

**EMAIL-04** - Area alert emails sent to subscribers
- User subscribes to postcode + radius
- New notices in area trigger email
- Status: Alert system exists, delivery untested

**EMAIL-05** - Deadline reminder emails
- Sent at configurable intervals (48h, 24h)
- Contains notice details and action link
- Status: sendDeadlineReminder exists, cron job untested

**EMAIL-06** - Email verification for alert subscriptions
- Verification link sent on subscription
- Subscription inactive until verified
- Status: sendSubscriptionVerification exists, flow untested

### User Flows (USER)

**USER-01** - Publisher flow: Submit notice end-to-end
- Start to payment completion
- Confirmation email received
- Notice visible on public site
- Status: Flow exists, end-to-end untested

**USER-02** - Resident flow: Discover notice, submit representation
- Search by postcode
- View notice on map
- Submit representation
- Receive confirmation
- Status: Components exist, flow untested

**USER-03** - Council staff flow: Review submissions and representations
- Login to council portal
- See pending notices
- View representations
- Mark as reviewed
- Status: Components exist, flow untested

**USER-04** - Firm user flow: Manage notices and clients
- Login to firm portal
- View client list
- Submit notices for clients
- Track status
- Status: FirmLayout exists, functionality incomplete

### Firm Portal (FIRM)

**FIRM-01** - Firm can manage client list
- Add/edit/remove clients
- Client details stored
- Status: Clients.tsx exists

**FIRM-02** - Firm can submit notices on behalf of clients
- Client selection in publish flow
- Billing to firm account
- Status: Publish flow exists, client integration untested

**FIRM-03** - Firm subscription model works
- Flat monthly fee (TBD)
- Portal access tied to subscription status
- Status: Stripe subscription exists, enforcement untested

---

## v2 Requirements (Post-Demo)

**V2-01** - WCAG 2.2 AA compliance audit
- Full accessibility review
- Fix identified issues
- Deferred: Compliance is important but not blocking demo

**V2-02** - Cyber Essentials Plus certification
- Security assessment
- Documentation
- Deferred: Required for council procurement, not demo

**V2-03** - SAML 2.0 SSO for councils
- Council IT integration
- Azure AD, Okta support
- Deferred: Enterprise feature

**V2-04** - IDOX Uniform integration
- SOAP API client
- Case management sync
- Deferred: Per-council implementation

**V2-05** - Bulk notice upload
- CSV import for councils
- Validation and preview
- Deferred: Volume feature

**V2-06** - Newspaper partnership integration
- Intermediary placement
- Transparent pricing
- Deferred: Business development required

**V2-07** - Planning notice expansion
- Full TCPA 1990 coverage
- Statutory consultee workflows
- Deferred: Complex requirements

**V2-08** - G-Cloud framework listing
- Procurement documentation
- Terms and conditions
- Deferred: Business operations

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | Phase 1 | Pending |
| TMPL-02 | Phase 1 | Pending |
| TMPL-03 | Phase 1 | Pending |
| TMPL-04 | Phase 1 | Pending |
| DEPT-01 | Phase 2 | Pending |
| DEPT-02 | Phase 2 | Pending |
| DEPT-03 | Phase 2 | Pending |
| DEPT-04 | Phase 2 | Pending |
| DEPT-05 | Phase 2 | Pending |
| FLOW-01 | Phase 3 | Pending |
| FLOW-02 | Phase 3 | Pending |
| FLOW-03 | Phase 3 | Pending |
| FLOW-04 | Phase 4 | Pending |
| FLOW-05 | Phase 4 | Pending |
| FLOW-06 | Phase 4 | Pending |
| FLOW-07 | Phase 4 | Pending |
| EMAIL-01 | Phase 5 | Pending |
| EMAIL-02 | Phase 5 | Pending |
| EMAIL-03 | Phase 5 | Pending |
| EMAIL-04 | Phase 5 | Pending |
| EMAIL-05 | Phase 5 | Pending |
| EMAIL-06 | Phase 5 | Pending |
| USER-01 | Phase 6 | Pending |
| USER-02 | Phase 6 | Pending |
| USER-03 | Phase 6 | Pending |
| USER-04 | Phase 7 | Pending |
| FIRM-01 | Phase 7 | Pending |
| FIRM-02 | Phase 7 | Pending |
| FIRM-03 | Phase 7 | Pending |

---

*Requirements derived from PROJECT.md goals and existing codebase analysis*
