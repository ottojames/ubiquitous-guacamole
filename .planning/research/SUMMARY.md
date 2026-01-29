# Project Research Summary

**Project:** Ralph's Civic Notices
**Domain:** Digital Public Notice Platform (UK Statutory Compliance)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

Ralph's Civic Notices aims to replace local newspapers as the statutory channel for UK public notice advertising, with primary focus on Licensing Act 2003 premises licence applications. The October 2025 government consultation signals regulatory change that could eliminate newspaper publication requirements, creating a significant market opportunity. The platform operates at the intersection of three domains: legal compliance (28-day consultation periods, statutory content requirements), government technology (WCAG 2.2 AA, Cyber Essentials Plus, G-Cloud framework), and SaaS multi-tenancy (council/department isolation, RBAC, audit trails).

The technical foundation is sound: React 19 + Vite frontend, Express API, Supabase (PostgreSQL + Storage), Stripe payments, and MapLibre GL for geospatial visualization. The dual-level tenancy model (organization → department) aligns perfectly with council organizational structures. The codebase demonstrates mature patterns for auth middleware, RLS policies, OCR text extraction, and multi-step wizard flows with draft persistence.

Critical risks center on regulatory timing (government response pending), competitive positioning (Public Notice Portal aggregates but doesn't accept submissions), and council adoption friction (SSO integration, back-office system connectivity, procurement routes). The recommended strategy is to hedge: build for current newspaper requirements while positioning for digital-first approval, obtain Cyber Essentials Plus and G-Cloud listing early, and prioritize the submission layer that neither The Gazette nor Public Notice Portal provides.

## Key Findings

### Recommended Stack

The existing stack is fit for purpose and requires no significant changes. React 19 provides modern concurrent rendering and improved form handling for the multi-step wizard. Express with TypeScript offers flexibility for complex business logic (OCR processing, geocoding, payment webhooks). Supabase combines PostgreSQL (with PostGIS for spatial queries), authentication, storage, and real-time subscriptions in one service. Stripe handles mixed pricing models (per-notice + subscription). MapLibre GL provides high-performance map clustering with GeoJSON sources.

**Core technologies:**
- **React 19 + Vite**: Frontend SPA with hot reload, modern hooks (use()), lazy loading for wizard steps
- **Express (TypeScript)**: API server with layered auth middleware, webhook handlers, file upload processing
- **Supabase**: PostgreSQL + Storage + Auth + Realtime — RLS policies enforce multi-tenant isolation
- **Stripe**: Payment processing with checkout sessions, webhooks, subscription + usage-based billing
- **MapLibre GL**: Geospatial visualization with clustering (Supercluster), bbox search, feature state management
- **Tesseract.js + pdf-parse**: OCR for scanned documents with intelligent fallback (native PDF text → OCR for images)
- **Resend**: Transactional email with HTML templates (confirmation, invitation, representation submission)
- **postcodes.io**: Free geocoding service for UK postcodes with local caching layer

**Version notes:**
- Stripe API version: `2025-12-15.clover`
- WCAG compliance: 2.2 Level AA (legal requirement as of October 2024)
- ISO 27001: 2022 standard (transition deadline October 2025)

### Expected Features

Based on competitor analysis and regulatory requirements, the feature set divides into table stakes (legal compliance), competitive differentiators (user experience and integration), and future expansion (additional notice types).

**Must have (table stakes):**
- **Licensing Act 2003 notice publication** — premises licence, variation, review applications with 28-day consultation
- **Statutory content validation** — applicant details, premises address, objection deadline, licensing objectives
- **Newspaper integration** — placement with ~600 local newspapers (current legal requirement)
- **Publication proof** — timestamped certificates for legal proceedings, immutable audit trail
- **Geospatial search** — location-based discovery with postcode/radius/bbox queries
- **Email notifications** — confirmation emails for applicants, representation submission receipts
- **WCAG 2.2 AA compliance** — keyboard navigation, screen reader support, color contrast, focus indicators
- **UK GDPR compliance** — data residency, audit logging, retention policies, FOI export capability

**Should have (competitive):**
- **Transparent pricing** — published rates for newspaper notices (£125-£400 range currently opaque)
- **OCR text extraction** — upload PDF/image, extract legal details automatically with confidence scoring
- **Council portal** — B2G offering with department isolation, SSO (SAML 2.0), role-based permissions
- **Draft persistence** — sessionStorage + database backup for cross-device resume
- **Map clustering** — visual discovery of nearby notices with radius highlighting
- **Template system** — generate compliant notice text from structured data (per notice type)
- **Data export** — CSV/JSON export for FOI requests and reporting

**Defer (v2+):**
- **Planning notices** — TCPA 1990 (21-day consultation, statutory consultees, more complex than licensing)
- **Traffic Regulation Orders** — Road Traffic Regulation Act 1984 (highways department workflow)
- **IDOX Uniform integration** — direct API integration with council back-office systems (per-council effort)
- **Gazette integration** — submission to official gazette (different statutory domain)
- **Bulk upload** — CSV import for multiple notices (councils handle >50 per month)
- **White-label** — custom branding for enterprise councils
- **Mobile app** — native iOS/Android for public search (web-first is sufficient)

### Architecture Approach

The architecture follows a dual-level multi-tenant SaaS pattern with defense-in-depth security. Organizations (councils or licensing firms) contain departments (Licensing, Planning, etc.), with data isolation enforced at the department level via PostgreSQL Row-Level Security policies. Authentication uses Supabase JWT with custom claims for organization/department membership. Authorization implements RBAC with three-table pattern (roles, permissions, role_permissions) and server-side permission checks at both Express middleware and RLS policy layers.

**Major components:**
1. **Publishing Wizard** — 4-step flow (Notice Type → Upload/OCR → Confirm Details → Review & Pay) with draft persistence and Zod schema validation per notice type
2. **Geospatial Engine** — PostGIS database functions (bbox search, radius search), postcodes.io geocoding with caching, MapLibre GL clustering with debounced bounds updates
3. **Payment Flow** — Stripe Checkout for per-notice payments, webhook handlers for payment confirmation, metadata linking (noticeId → session)
4. **Notification System** — Resend email service with lazy initialization, HTML + plaintext templates, graceful degradation
5. **OCR Pipeline** — Multi-format support (PDF, DOCX, RTF, images), Tesseract.js fallback for scanned documents, regex-based legal detail extraction
6. **Council Admin Portal** — Organization/department management, SSO configuration, user/role provisioning, audit trail access

**Data flow pattern:**
```
Applicant → Draft creation → OCR extraction → User confirmation →
Payment (Stripe) → Webhook → Notice publication → Email confirmation →
Geospatial indexing → Public search
```

### Critical Pitfalls

The research identifies regulatory, technical, and commercial pitfalls that must be addressed during implementation.

1. **Regulatory timing uncertainty** — Government consultation closed November 2025, response pending. Building exclusively for digital-first publication risks being premature if newspaper requirements remain. **Mitigation:** Implement newspaper integration as Phase 1 (legal compliance today), add digital-first as Phase 2 (positioned for regulatory approval).

2. **Council adoption friction** — Councils require SSO (SAML 2.0), security certifications (Cyber Essentials Plus), accessibility statements (WCAG 2.2 AA), and G-Cloud framework listing for streamlined procurement. Without these, sales cycles extend 6-12 months. **Mitigation:** Prioritize compliance requirements in Phase 1, obtain Cyber Essentials Plus certification before sales outreach.

3. **Public Notice Portal competition** — News Media Association's aggregation platform has 5M views and 23K users but explicitly does NOT accept submissions. They could pivot to submission if regulatory change occurs. **Mitigation:** Build submission layer first (their weakness), establish council relationships early (switching cost), emphasize compliance features they lack (audit trails, RBAC, SSO).

4. **Newspaper industry resistance** — Local newspapers derive significant revenue from statutory notices (one publication reported £90K/year from single council). NMA lobbying characterized proposals as "devastating" and "betrayal of local communities." **Mitigation:** Position platform as newspaper partner (intermediary model like Legal Notice Gateway), negotiate bulk rates with publishers, maintain print channel even if digital becomes primary.

5. **IDOX Uniform integration complexity** — Dominant council case management system uses SOAP API with per-council configuration variations. Building deep integration requires per-council implementation effort. **Mitigation:** Phase 1 uses manual export/import (low friction), Phase 2 adds SOAP API integration (select councils), Phase 3 becomes registered data provider (Digital Planning ecosystem).

6. **Geospatial performance at scale** — Client-side clustering breaks down above ~5,000 notices. Current implementation uses Supercluster on frontend with debounced bbox updates. **Mitigation:** Add server-side clustering and vector tiles before launching city-wide councils (London boroughs, Birmingham, etc.).

7. **OCR accuracy for scanned documents** — Tesseract.js provides reasonable accuracy but struggles with poor-quality scans (faded text, skewed images, handwriting). Cloud OCR services (Google Vision, AWS Textract) offer better results but add cost. **Mitigation:** Show confidence scores to users, implement preview/correction UI, consider cloud OCR tier for premium users.

## Implications for Roadmap

Based on research, the roadmap should prioritize legal compliance and council adoption blockers first, then expand to competitive features and additional notice types. The regulatory uncertainty argues for hedging: satisfy current newspaper requirements while building digital-first infrastructure.

### Phase 1: Compliance & Council Adoption Foundation
**Rationale:** Without legal compliance and procurement readiness, the platform cannot be used by councils or applicants. This phase removes adoption blockers.

**Delivers:**
- WCAG 2.2 AA accessibility implementation (legal requirement)
- Cyber Essentials Plus certification (PPN 014 procurement requirement)
- SAML 2.0 SSO implementation (council IT integration)
- UK data residency + GDPR compliance (data protection)
- G-Cloud 14/15 framework listing (streamlined procurement)
- Audit logging for all user actions (accountability requirement)

**Addresses:** Must-have compliance features from regulatory research, council adoption blockers from council requirements research

**Avoids:** Pitfall #2 (council adoption friction), Pitfall #5 (procurement delays)

**Research needs:** Standard compliance patterns, skip phase-specific research

---

### Phase 2: Licensing Act Notice Publication (MVP)
**Rationale:** Licensing Act 2003 is the announced regulatory reform target and has the clearest statutory requirements. Building this first validates product-market fit before expanding to other notice types.

**Delivers:**
- Premises licence application notices (new, variation, review)
- Newspaper integration with transparent pricing (intermediary model)
- Publication proof certificates with timestamp + immutability
- 28-day consultation period automation
- Email notifications for applicants and councils
- Basic map search with postcode/address lookup

**Addresses:** Table stakes features (Licensing Act notices, newspaper integration, publication proof), competitive differentiator (transparent pricing)

**Avoids:** Pitfall #1 (regulatory timing) by supporting current newspaper requirements, Pitfall #4 (newspaper resistance) by partnering rather than replacing

**Uses:** Express webhook handlers, Stripe checkout sessions, Resend email templates, postcodes.io geocoding

**Research needs:** Deep research required — newspaper partnership agreements, pricing negotiations, legal review of publication certificates

---

### Phase 3: OCR-Assisted Application Flow
**Rationale:** Differentiation from Public Notice Portal (read-only) and legacy intermediaries (manual submission). Reduces applicant friction and positions for digital-first approval.

**Delivers:**
- Multi-format upload (PDF, DOCX, images)
- OCR text extraction with Tesseract.js + pdf-parse
- Legal detail extraction (applicant, premises, deadline)
- Preview/correction UI with confidence indicators
- Template-based notice generation (Zod validation)
- Draft persistence (sessionStorage + database backup)

**Addresses:** Competitive features (OCR extraction, template system, draft persistence)

**Avoids:** Pitfall #7 (OCR accuracy) by showing confidence scores and enabling correction

**Uses:** Multi-step wizard patterns from codebase, Zod schema registry, existing draft store implementation

**Research needs:** Minimal — patterns already implemented in codebase, extend to additional notice types

---

### Phase 4: Council B2G Portal
**Rationale:** Council sales have longer cycles but higher LTV and create moat (switching cost). This phase converts the platform from B2C tool to B2G infrastructure.

**Delivers:**
- Organization/department multi-tenancy
- SSO configuration per council (SAML 2.0)
- Role-based access control (department admin, officer, viewer)
- Department-level data isolation (RLS policies)
- Bulk notice approval workflows
- Audit trail access and FOI export

**Addresses:** Council requirements (SSO, department isolation, audit trails), competitive moat

**Avoids:** Pitfall #2 (council adoption friction) by providing expected enterprise features

**Uses:** Existing dual-tenant model from codebase, RLS policies, RBAC permission system

**Research needs:** Minimal — architecture already implemented, requires UI polish

---

### Phase 5: Geospatial Discovery & Alerts
**Rationale:** Public-facing discovery drives organic traffic and validates product-market fit with end users (residents, businesses). Map visualization is differentiator vs. text-heavy newspaper notices.

**Delivers:**
- Interactive map with clustering (MapLibre GL)
- Bbox and radius search (PostGIS functions)
- Email alerts by location (daily/weekly/monthly)
- Notice detail pages with nearby notices
- Mobile-responsive map interface

**Addresses:** Competitive features (geospatial search, map clustering, email alerts)

**Avoids:** Pitfall #6 (performance at scale) by implementing server-side clustering

**Uses:** Existing MapLibre implementation, PostGIS bbox functions, Resend email service

**Research needs:** Minimal — core patterns exist, requires performance optimization for large notice counts

---

### Phase 6: Planning & TRO Expansion
**Rationale:** After proving model with Licensing Act notices, expand to other statutory notice types. Planning notices have higher public interest and more complex workflows.

**Delivers:**
- Planning application notices (TCPA 1990)
- Traffic Regulation Order notices (RTRA 1984)
- Notice type templates for each legislation
- Statutory consultee notification workflows
- 21-day consultation period automation

**Addresses:** Deferred features (planning notices, TRO notices), revenue expansion

**Avoids:** Building complex notice types before validating core model

**Research needs:** Deep research required — planning legislation has multiple application types, statutory consultee requirements, EIA thresholds

---

### Phase 7: IDOX Uniform Integration
**Rationale:** Deep integration with council back-office systems creates defensible moat and reduces council workflow friction. This is enterprise-grade differentiation.

**Delivers:**
- SOAP API client for Uniform
- Automatic case creation in council system
- Bidirectional data sync (application → decision)
- Document upload via FTP/DocLoader
- Per-council configuration management

**Addresses:** Enterprise features, workflow automation

**Avoids:** Pitfall #5 (integration complexity) by deferring until core product validated

**Research needs:** Deep research required — SOAP API documentation, per-council variations, test environment access

---

### Phase Ordering Rationale

**Compliance first (Phase 1):** Cannot sell to councils without procurement readiness. Cyber Essentials Plus, G-Cloud listing, and WCAG compliance are blockers, not nice-to-haves.

**Licensing Act next (Phase 2):** Announced regulatory reform target, clearest requirements, highest volume. Validates product-market fit before expanding.

**OCR differentiation (Phase 3):** Public Notice Portal aggregates but doesn't accept submissions. OCR-assisted flow is competitive moat vs. manual intermediaries.

**Council portal (Phase 4):** B2G sales create switching cost and higher LTV. Must come after B2C validation to avoid premature enterprise feature bloat.

**Public discovery (Phase 5):** Drives organic traffic and network effects. Requires sufficient notice volume (Phases 2-4) to be useful.

**Notice type expansion (Phase 6):** Prove model with Licensing Act before tackling more complex notice types (planning has multiple application categories, statutory consultees, EIA thresholds).

**Deep integration (Phase 7):** IDOX integration is per-council effort. Defer until established customer base justifies implementation cost.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Licensing Act MVP):** Newspaper partnership agreements, pricing negotiations, legal review of publication certificates
- **Phase 6 (Planning/TRO Expansion):** Planning legislation has 8+ application types with varying requirements, TRO has Permanent vs. Experimental vs. Temporary variations
- **Phase 7 (IDOX Integration):** SOAP API documentation, council-specific configuration, test environment access

**Phases with standard patterns (skip phase-specific research):**
- **Phase 1 (Compliance):** WCAG, Cyber Essentials, G-Cloud are well-documented with official guidance
- **Phase 3 (OCR Flow):** Patterns already implemented in codebase, extend to additional templates
- **Phase 4 (Council Portal):** Architecture exists (dual-tenant, RLS, RBAC), requires UI implementation
- **Phase 5 (Geospatial Discovery):** MapLibre + PostGIS patterns proven in codebase, optimize for scale

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Regulatory requirements | HIGH | Verified via legislation.gov.uk and official guidance |
| Council requirements | HIGH | Official GDS/NCSC/ICO documentation |
| Market opportunity | HIGH | Government consultation, competitor analysis, pricing research |
| Technical patterns | HIGH | Derived from actual codebase analysis |
| Regulatory timing | LOW | Government response pending, timeline unknown |
| Newspaper partnerships | MEDIUM | Intermediary model proven (Legal Notice Gateway) but requires negotiation |
| Council adoption rate | MEDIUM | Compliance readiness is necessary but not sufficient for adoption |

**Overall confidence:** HIGH for product direction and technical approach, MEDIUM for go-to-market execution, LOW for regulatory timeline.

### Gaps to Address

**Regulatory response timeline:** Government consultation closed November 2025, response pending. Cannot predict if newspaper requirements will be eliminated, made optional, or retained. **Mitigation:** Build for current requirements (Phase 2 newspaper integration) while positioning for digital-first (Phase 3 OCR flow).

**Newspaper partnership pricing:** Transparent pricing is competitive differentiator but requires negotiating bulk rates with ~600 local newspapers controlled by 3 major publishers. **Mitigation:** Start with intermediary model (markup on published rates), negotiate bulk agreements as volume grows.

**Council procurement timelines:** G-Cloud listing streamlines procurement but councils still have 3-6 month evaluation cycles. Early revenue may come from B2C (individual applicants, licensing agents) rather than B2G. **Mitigation:** Phase 2 focuses on applicant-facing features, Phase 4 adds council portal after validation.

**IDOX API access:** Deep integration requires test environment access and per-council configuration. IDOX may not prioritize small platform integrations. **Mitigation:** Phase 1-6 use manual export/import, defer SOAP integration until customer demand justifies effort.

**Public Notice Portal response:** NMA-backed aggregator could pivot to accept submissions if regulatory change occurs. They have brand recognition (5M views) and newspaper partnerships. **Mitigation:** First-mover advantage on submission layer, emphasize compliance features they lack (audit trails, RBAC, SSO), establish council relationships early.

## Sources

### Primary Sources (HIGH confidence)

**Regulatory:**
- [Licensing Act 2003](https://www.legislation.gov.uk/ukpga/2003/17) — legislation.gov.uk
- [S.I. 2005/42 - Premises Licences Regulations](https://www.legislation.gov.uk/uksi/2005/42) — official secondary legislation
- [Section 182 Guidance (November 2025)](https://www.gov.uk/government/publications/explanatory-memorandum-revised-guidance-issued-under-s-182-of-licensing-act-2003) — Home Office official guidance
- [Reforming the Licensing System Consultation](https://www.gov.uk/government/calls-for-evidence/reforming-the-licensing-system) — October 2025 government consultation
- [Gambling Act 2005](https://www.legislation.gov.uk/ukpga/2005/19) — legislation.gov.uk
- [DMPO 2015](https://www.legislation.gov.uk/uksi/2015/595) — planning notice requirements
- [Road Traffic Regulation Act 1984](https://www.legislation.gov.uk/ukpga/1984/27) — TRO legislation

**Council requirements:**
- [GOV.UK Accessibility Requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) — WCAG 2.2 legal mandate
- [NCSC Cyber Essentials](https://www.ncsc.gov.uk/cyberessentials/overview) — security certification
- [PPN 014 Cyber Essentials Scheme](https://www.gov.uk/government/publications/ppn-014-cyber-essentials-scheme) — procurement requirement
- [G-Cloud Buyers Guide](https://www.gov.uk/guidance/g-cloud-buyers-guide) — framework procurement
- [ICO GDPR Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/) — data protection
- [GDS Modern Digital Government Roadmap](https://gds.blog.gov.uk/2026/01/20/our-roadmap-for-modern-digital-government/) — GOV.UK One Login trajectory
- [GOV.UK Design System](https://design-system.service.gov.uk/) — accessibility patterns

**Market analysis:**
- [The Gazette - 2026 Pricing](https://www.thegazette.co.uk/place-notice/pricing) — official notice pricing
- [Public Notice Portal](https://publicnoticeportal.uk/) — competitor analysis
- [News Media Association - Public Notice Portal](https://newsmediauk.org/local-media-works/public-notice-portal/) — industry positioning
- [Legal Notice Gateway](https://legalnoticegateway.com/) — competitor analysis
- [Press Gazette - Regional Daily ABCs H1 2025](https://pressgazette.co.uk/media-audience-and-business-data/media_metrics/regional-daily-abcs-print-circulation-down-by-average-of-18-in-h1-2025/) — newspaper decline metrics

**Technical:**
- Codebase analysis — `server/middleware/auth.ts`, `server/routes/notices.ts`, `src/wizard/draftStore.ts`
- Migration files — `supabase/migrations/20260121100001_department_isolation_rls.sql`
- [IDOX Uniform](https://www.idoxgroup.com/solutions/regulatory-services/uniform/) — integration target

### Secondary Sources (MEDIUM confidence)

**Industry response:**
- [Society of Editors Statement](https://www.societyofeditors.org/soe_news/society-deeply-concerned-by-plans-to-remove-licensing-application-notices-from-local-newspapers/) — newspaper lobbying
- [Hold the Front Page - Reeves Plans](https://www.holdthefrontpage.co.uk/2025/news/reeves-set-to-scrap-outdated-rule-on-public-notices-in-local-press/) — news coverage
- [Behind Local News - Industry Response](https://behindlocalnews.substack.com/p/local-news-prepares-to-fight-chancellors) — local journalism impact

**Council systems:**
- [Digital Planning Programme](https://www.localdigital.gov.uk/digital-planning/) — modernization initiative
- [Planning Portal API modernisation](https://www.planningportal.co.uk/local-authority-bulletins/we-want-to-work-with-local-planning-authorities-and-their-it-suppliers-to-improve-planning-software/) — integration standards
- [Socitm One Login Discovery](https://socitm.net/resource-hub/partner-briefings/one-login-local-government-discovery/) — GOV.UK One Login trajectory

### Tertiary Sources (inference-based)

**Pricing estimates:**
- [Premises Licensing - Milton Keynes](https://premises-licensing.co.uk/premises-licence-in-milton-keynes-costs-requirements-how-to-apply/) — £306 newspaper cost
- [Premises Licensing - Hackney](https://premises-licensing.co.uk/premises-licence-in-hackney-costs-requirements-how-to-apply/) — £271 newspaper cost
- [Premises Licensing - Stoke](https://premises-licensing.co.uk/premises-licence-in-stoke-costs-requirements-how-to-apply/) — £196 newspaper cost

**Multi-tenancy patterns:**
- General SaaS best practices (not council-specific verification)
- RBAC patterns derived from codebase implementation

---

*Research completed: 2026-01-22*
*Ready for roadmap: Yes*
*Next step: Requirements definition and roadmap creation*
