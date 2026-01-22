# Council Integration Requirements Research

**Project:** Ralph's Civic Notices
**Researched:** 2026-01-22
**Focus:** UK local authority requirements for digital notice management platforms

## Executive Summary

UK local authorities operate under strict regulatory frameworks that govern how they procure, deploy, and operate digital services. A public notice management platform targeting council adoption must satisfy requirements across multiple dimensions: accessibility (WCAG 2.2 AA), security (Cyber Essentials Plus, ISO 27001), data protection (UK GDPR), identity federation (SSO), and integration with existing back-office systems (primarily IDOX Uniform).

This research identifies the practical requirements for council adoption and compliance, organised by domain.

---

## 1. Council Department Structures

### Departments with Statutory Notice Requirements

Based on UK legislation, the following council departments have statutory requirements to publish public notices:

| Department | Primary Legislation | Notice Period | Newspaper Required |
|------------|--------------------|--------------|--------------------|
| **Licensing** | Licensing Act 2003, Gambling Act 2005 | 28 days | Yes |
| **Planning** | TCPA 1990, DMPO 2015 | 21 days | Sometimes |
| **Highways** | Road Traffic Regulation Act 1984 | 21 days | Yes |
| **Environmental Health** | EPA 1990 | Varies | No (public register) |
| **Building Control** | Building Act 1984, Building Safety Act 2022 | Varies | No |

### Licensing Department (Primary Target)

**Key workflow elements:**
- Applicants submit applications with supporting documents
- Responsible Authorities (Police, Fire, Environmental Health, Child Protection, Planning, Trading Standards) are notified
- 28-day consultation period for representations
- If no objections received, licence must be granted
- If objections received, hearing is required

**Digital submission requirements (TENs example):**
- Electronic submission accepted and encouraged
- Council forwards copies to Police and Environmental Health automatically when submitted electronically
- Fee payment (currently 21 GBP) must be processed
- Digital copy must be available on-site (no paper required)

**Confidence:** HIGH - verified via [Section 182 Guidance (November 2025)](https://www.gov.uk/government/publications/explanatory-memorandum-revised-guidance-issued-under-s-182-of-licensing-act-2003/revised-guidance-issued-under-section-182-of-the-licensing-act-2003-december-2023-accessible-version)

### Planning Department (Secondary Target)

Currently undergoing significant digital transformation via the Digital Planning Programme:
- PlanX (front-end application service)
- BOPS (Back Office Planning System)
- Planning Portal modernisation with JSON-based APIs

**Confidence:** HIGH - verified via [MHCLG Digital Planning Programme](https://www.localdigital.gov.uk/digital-planning/digital-planning-software/funding/)

---

## 2. Department Isolation Requirements

### Data Governance Principles

UK councils must implement role-based access control (RBAC) that:
- Restricts data access to role-appropriate functions
- Implements principle of least privilege
- Maintains audit trails of all access
- Supports quarterly access reviews

### Multi-Tenancy Architecture Options

For council SaaS platforms, three architecture patterns are viable:

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Dedicated instance** | Separate app + database per council | Maximum isolation, highest cost |
| **Shared app, dedicated database** | Single app instance, separate databases | Good isolation, moderate cost |
| **Shared database with tenant isolation** | Schema/row-level isolation | Cost-effective, requires careful design |

**Recommendation:** Shared app with dedicated database per council. This provides:
- Strong data isolation (GDPR compliance)
- Independent backup/restore per council
- Simpler compliance auditing
- Cost-effective scaling

**Confidence:** MEDIUM - based on general multi-tenancy best practices, not council-specific verification

### Department-Level Isolation Within Councils

Within a single council instance:
- Licensing staff should not access Planning data
- Environmental Health staff should not access Highways data
- Council-wide admin role for cross-department oversight
- Each department should have own admin for role management

**Implementation pattern:**
```
Council
  -> Department (Licensing, Planning, etc.)
    -> Role (Admin, Officer, Viewer)
      -> Permissions (Create, Read, Update, Delete, Approve)
```

---

## 3. Existing Council Systems and Integration

### Primary Back-Office System: IDOX Uniform

IDOX Uniform is the dominant case management system across UK councils:
- 30+ years in market
- Covers Planning, Building Control, Environmental Health, Licensing, Highways
- Available cloud-hosted or on-premise

**Integration approach:**
- SOAP API with WSDL-based endpoints
- Username/password authentication
- FTP file transfer for document uploads (via DocLoader process)
- Each module (Planning, Licensing, etc.) has separate API methods

**Current integration projects:**
- PlanX to Uniform trial integration (Digital Planning Programme)
- Five software suppliers piloting new data standards (funded 225K GBP each)
- Wirral Council developing Power BI integration via Uniform API

**Confidence:** HIGH - verified via [IDOX Uniform documentation](https://www.idoxgroup.com/solutions/regulatory-services/uniform/) and [Contracts Finder awards](https://www.contractsfinder.service.gov.uk/Notice/f6f6e549-1ef6-4609-a577-087a910a9d88)

### Other Back-Office Providers

| Provider | Market Share | Focus Area |
|----------|--------------|------------|
| IDOX Uniform | Dominant | Full regulatory services |
| Civica | Significant | Environmental Health, Revenues |
| NEC | Moderate | Housing, Revenues |
| Arcus | Moderate | Planning |
| Ocella | Niche | Planning |

### Integration Strategy for Civic Notices

**Phase 1 (Manual):**
- Export notice data as structured JSON/CSV
- Council staff import into Uniform manually
- Low friction for adoption

**Phase 2 (API):**
- Direct SOAP API integration with Uniform
- Automatic case creation in council system
- Requires per-council configuration

**Phase 3 (Platform):**
- Become registered data provider
- Real-time bidirectional sync
- Part of Digital Planning ecosystem

---

## 4. Audit Trail Requirements

### UK GDPR Audit Requirements

Under UK GDPR (as amended by DUAA 2025), councils must:
- Maintain Records of Processing Activities (RoPA)
- Document data collection purposes and legal basis
- Track data retention periods
- Log data access and modifications
- Provide evidence of compliance for audits

### Required Audit Events

| Event Type | Data to Capture |
|------------|-----------------|
| Notice created | Timestamp, user ID, notice type, IP address |
| Notice modified | Timestamp, user ID, field changed, old/new values |
| Notice viewed | Timestamp, user ID, access context |
| Notice published | Timestamp, user ID, publication method |
| Notice deleted | Timestamp, user ID, reason, retention policy |
| User login | Timestamp, user ID, IP address, auth method |
| Permission changed | Timestamp, admin ID, user affected, permission delta |
| Export requested | Timestamp, user ID, data scope, format |

### Retention Requirements

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Licensing notices | 6 years after expiry | Limitation Act 1980 |
| Planning notices | Permanent (planning register) | TCPA 1990 |
| User access logs | 2 years | UK GDPR accountability |
| Financial records | 6 years | HMRC requirements |

### FOI Considerations

Councils must respond to Freedom of Information requests within 20 working days. Platform must support:
- Export of all notices for a given period
- Export of metadata and audit trails
- Redaction capabilities for personal data
- Cost calculation for complex requests (450 GBP limit for councils)

**Confidence:** HIGH - verified via [ICO GDPR Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation) and [FOI guidance](https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/request-handling-freedom-of-information/)

---

## 5. SSO and Identity Federation

### Current Landscape

UK councils use various identity providers:
- Microsoft Entra ID (Azure AD) - most common
- On-premise Active Directory with federation
- Some Google Workspace
- Emerging: GOV.UK One Login

### GOV.UK One Login

GDS is onboarding central government services, with local government discovery phase underway:
- LGA, Socitm, and Solace working with GDS
- Potential extension to councils from 2025
- Historical challenges (GOV.UK Verify adoption was problematic)

**Current status:** Some councils are waiting for better identity solutions before implementing customer accounts.

**Confidence:** MEDIUM - verified via [Socitm One Login discovery](https://socitm.net/resource-hub/partner-briefings/one-login-local-government-discovery/)

### GDS Local Initiative

New government unit launched to:
- Deepen collaboration between central and local government
- Support GOV.UK app and One Login for local services
- Improve digital services for communities

**Confidence:** HIGH - verified via [GDS blog](https://gds.blog.gov.uk/2026/01/20/our-roadmap-for-modern-digital-government/)

### Recommended SSO Implementation

**Protocol support required:**
- SAML 2.0 (most council IdPs support this)
- OIDC/OAuth 2.0 (for modern implementations)
- Azure AD direct federation

**Implementation priorities:**
1. SAML 2.0 SP implementation (covers majority of councils)
2. Azure AD Enterprise Application registration
3. OIDC support for forward compatibility
4. GOV.UK One Login preparation (when available)

**Configuration per council:**
- IdP metadata URL
- Entity ID
- Attribute mapping (email, name, department, role)
- Just-in-time user provisioning option

---

## 6. Accessibility and GOV.UK Design System

### Legal Requirements

The Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018 require:
- WCAG 2.2 Level AA compliance (as of October 2024)
- Published accessibility statement
- Regular review and updates

**Enforcement:**
- GDS monitors compliance annually
- Sampling of public sector websites and apps
- Request for information and intranet access
- Reputational and legal consequences for non-compliance

**Confidence:** HIGH - verified via [GOV.UK Accessibility Requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps)

### WCAG 2.2 Key Additions

| Criterion | Requirement |
|-----------|-------------|
| 2.4.11 Focus Not Obscured | Keyboard focus indicators must not be hidden |
| 2.5.7 Dragging Movements | Alternatives to drag gestures required |
| 2.5.8 Target Size | Minimum 24x24px touch targets |
| 3.2.6 Consistent Help | Help mechanisms in consistent location |
| 3.3.7 Redundant Entry | Don't ask for same info twice |

### GOV.UK Design System

For services used by the public, the GOV.UK Design System provides:
- Pre-tested, accessible components
- Consistent patterns across government
- Regular updates for WCAG compliance
- Documented best practices

**Applicability to Civic Notices:**
- Public-facing notice search/view: Should follow GOV.UK patterns
- Council admin interface: Should follow patterns where practical
- Does not require .service.gov.uk domain branding

**Confidence:** HIGH - verified via [GOV.UK Design System](https://design-system.service.gov.uk/accessibility/)

### Practical Implementation

**Required:**
- Semantic HTML structure
- Keyboard navigation for all functions
- Screen reader compatibility
- Colour contrast ratios (4.5:1 text, 3:1 UI)
- Focus indicators on all interactive elements
- Alt text for images
- Accessible forms with error messages

**Testing approach:**
- Automated testing (axe-core, WAVE)
- Manual keyboard testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- User testing with disabled users

---

## 7. Security Requirements

### Cyber Essentials Plus

As of PPN 014 (February 2025), suppliers to UK government must demonstrate Cyber Essentials certification when:
- Handling personal information of citizens
- Handling personal information of government employees
- Supplying ICT systems and services

**Civic Notices platform:** Handles citizen and business personal information, therefore Cyber Essentials Plus should be obtained.

**Requirements (v3.2, April 2025):**
- Secure configuration of devices and software
- Boundary firewalls and internet gateways
- Access control and administrative privilege management
- Patch management (vulnerability fixes within 14 days for critical)
- Malware protection
- Passwordless authentication now accepted

**Recertification:** Annual (12 months)

**Confidence:** HIGH - verified via [NCSC Cyber Essentials](https://www.ncsc.gov.uk/cyberessentials/overview) and [PPN 014](https://www.gov.uk/government/publications/ppn-014-cyber-essentials-scheme/ppn-014-cyber-essentials-scheme-html)

### ISO 27001

Not legally mandated but commonly required for:
- Public sector contracts with sensitive data
- Enterprise sales to councils
- Demonstrating mature security practices

**Current standard:** ISO 27001:2022 (transition deadline was October 2025)

**Key controls for SaaS:**
- Information security policies
- Asset management
- Access control
- Cryptography
- Operations security
- Communications security
- Supplier relationships
- Incident management
- Business continuity
- Compliance

**Confidence:** HIGH - verified via [ISO 27001 guidance](https://www.iso.org/standard/27001)

### Data Residency

UK councils typically require:
- Data stored in UK or EEA
- UK GDPR compliance
- Clear data processing location documentation
- Sub-processor disclosure

**Recommendation:** Host on UK-region cloud infrastructure (AWS London, Azure UK South, GCP London).

---

## 8. Procurement Routes

### G-Cloud Framework

Primary route for cloud software procurement by UK public sector:
- Current: G-Cloud 14 (from October 2024)
- Upcoming: G-Cloud 15 (tenders due January 2026, awards September 2026)
- Value: 14 billion GBP estimated
- SME-friendly: 90% of suppliers are SMEs, 40% of spend

**Benefits:**
- No full tender required
- Streamlined procurement
- Pre-approved supplier list
- Published pricing

**Requirements to list:**
- Complete supplier registration
- Service description and pricing
- Security certifications (Cyber Essentials minimum)
- Accessibility statement
- Terms and conditions acceptance

**Confidence:** HIGH - verified via [G-Cloud buyers guide](https://www.gov.uk/guidance/g-cloud-buyers-guide)

### Digital Marketplace

Replaced by Public Procurement Gateway in G-Cloud 13.

**Contract Award Service:** Used for buying cloud services through G-Cloud framework.

### Direct Procurement

For services not on framework, councils run competitive tenders:
- Find a Tender Service for publication
- Procurement Act 2023 rules (from October 2024)
- Longer timeline (3-6 months typical)

---

## 9. Integration Standards

### UK Government API Standards

The Data Standards Authority maintains API standards:
- RESTful design preferred
- HTTPS/TLS 1.3 (minimum 1.2)
- NCSC security guidance compliance
- Documentation standards

**API Hub (Alpha):** GDS developing centralised API discovery and connectivity.

**Confidence:** HIGH - verified via [GDS API Discovery findings](https://dataingovernment.blog.gov.uk/2025/04/03/joining-up-the-dots-the-findings-of-our-recent-api-discovery/)

### Data Standards for Planning

Digital Planning Programme establishing:
- JSON-based data standards (replacing legacy XML)
- Bidirectional data flow (application to decision)
- Standardised application data model
- Open APIs for service providers

**Implication:** Civic Notices should align with emerging planning data standards for future planning notice support.

**Confidence:** HIGH - verified via [Planning Portal API modernisation](https://www.planningportal.co.uk/local-authority-bulletins/we-want-to-work-with-local-planning-authorities-and-their-it-suppliers-to-improve-planning-software/)

### Gazette Integration

The Gazette (official UK public record) supports:
- 288 notice types required by law
- API for notice submission
- 2026 pricing in effect
- Public sector mandatory notices have specific pricing

**Confidence:** HIGH - verified via [The Gazette](https://www.thegazette.co.uk/place-notice)

---

## 10. Summary: Minimum Viable Council Offering

### Must Have (Compliance)

| Requirement | Criticality | Notes |
|-------------|-------------|-------|
| WCAG 2.2 AA compliance | Legal requirement | GDS monitors annually |
| UK GDPR compliance | Legal requirement | Data protection |
| Accessibility statement | Legal requirement | Published and maintained |
| HTTPS/TLS 1.2+ | Security baseline | NCSC requirement |
| Audit logging | Accountability | GDPR Article 30 |
| UK data residency | Procurement requirement | Most councils require |

### Should Have (Adoption)

| Requirement | Benefit | Notes |
|-------------|---------|-------|
| Cyber Essentials Plus | Procurement qualification | PPN 014 |
| G-Cloud listing | Procurement route | Faster sales cycle |
| SAML 2.0 SSO | IT integration | Council IdP federation |
| Data export | FOI compliance | CSV/JSON export |
| Department isolation | Data governance | RBAC per department |

### Nice to Have (Differentiation)

| Requirement | Benefit | Notes |
|-------------|---------|-------|
| ISO 27001 certification | Enterprise trust | 6-12 months to obtain |
| IDOX Uniform integration | Workflow automation | Per-council effort |
| GOV.UK One Login ready | Future-proofing | When available |
| API for third parties | Ecosystem play | Developer documentation |

---

## Sources

### Official Government Sources
- [GOV.UK Accessibility Requirements](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [NCSC Cyber Essentials](https://www.ncsc.gov.uk/cyberessentials/overview)
- [PPN 014 Cyber Essentials Scheme](https://www.gov.uk/government/publications/ppn-014-cyber-essentials-scheme/ppn-014-cyber-essentials-scheme-html)
- [G-Cloud Buyers Guide](https://www.gov.uk/guidance/g-cloud-buyers-guide)
- [Licensing Act 2003 Section 182 Guidance](https://www.gov.uk/government/publications/explanatory-memorandum-revised-guidance-issued-under-s-182-of-licensing-act-2003)

### Regulatory and Standards Bodies
- [ICO GDPR Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/)
- [ICO FOI Guidance](https://ico.org.uk/for-organisations/foi/)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)

### Industry and Programme Sources
- [IDOX Uniform](https://www.idoxgroup.com/solutions/regulatory-services/uniform/)
- [Digital Planning Programme](https://www.localdigital.gov.uk/digital-planning/)
- [Planning Portal](https://www.planningportal.co.uk/)
- [The Gazette](https://www.thegazette.co.uk/)
- [LGA Data Standards](https://www.local.gov.uk/our-support/research-and-data/data-standards-and-transparency)
- [Socitm One Login Discovery](https://socitm.net/resource-hub/partner-briefings/one-login-local-government-discovery/)

### GDS Blog and Updates
- [GDS Modern Digital Government Roadmap](https://gds.blog.gov.uk/2026/01/20/our-roadmap-for-modern-digital-government/)
- [API Discovery Findings](https://dataingovernment.blog.gov.uk/2025/04/03/joining-up-the-dots-the-findings-of-our-recent-api-discovery/)
- [API Hub Alpha](https://dataingovernment.blog.gov.uk/2025/11/28/strengthening-and-extending-connectivity-what-we-learned-from-the-api-hub-alpha/)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Accessibility requirements | HIGH | Official GDS documentation |
| Security requirements | HIGH | PPN 014 and NCSC guidance |
| GDPR/audit requirements | HIGH | ICO guidance |
| SSO patterns | MEDIUM | Various council implementations, GOV.UK One Login still emerging |
| IDOX integration | MEDIUM | Documentation available but per-council variation |
| Department isolation | MEDIUM | General RBAC principles, not council-specific verification |
| Procurement routes | HIGH | Official CCS documentation |
| Data standards | MEDIUM | Emerging standards, Digital Planning in progress |
