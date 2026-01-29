# PRD: Professional Portal - Expanded Multi-Vertical Platform

**Target Launch**: Q3 2024 | **Revenue Target**: £4.5M ARR at maturity | **Three Core Verticals**

---

## Executive Summary

The Professional Portal transforms Civic Notices from a transactional statutory advertising service into a **comprehensive workflow management platform** serving three distinct professional markets:

1. **Licensing Consultants** — Premises & gambling licence applications
2. **Probate Practitioners** — Deceased estate administration (Trustee Act s.27)
3. **Transport Operators** — Goods Vehicle Operator Licence (GVOL/O-Licence) applications

Each vertical shares a common platform foundation but addresses **regulatory-specific workflows** with statutory notice publication at their core. This creates a **defensible moat** — competitors must replicate both the software AND the newspaper advertising relationships.

### Combined Market Opportunity

| Vertical | Target Users | Applications/Year | Price Point | TAM |
|----------|--------------|-------------------|-------------|-----|
| Licensing | 500-750 consultants | 25,000+ | £199/month | £1.8M |
| Probate | 5,000+ firms | 250,000+ | £149/month | £8.9M |
| GVOL | 2,000+ operators/agents | 11,000+ | £99/month | £2.4M |

**Conservative Year 3 Target**: 1,500 subscribers = **£4.5M ARR**

---

## Part 1: Market Analysis

### 1.1 Licensing Consultant Market (Existing PRD)

**Market Size**:
- 500-750 licensing consultants/firms in UK
- £200M+ annual licensing application market
- Average consultant handles 20-50 applications annually

**Pain Points**:
- Manual tracking across multiple applications
- Deadline management complexity (28-day consultation periods)
- Council-specific requirements (350+ licensing authorities)
- Newspaper advertising coordination

**Our Advantage**: Already serving this market with statutory notices.

---

### 1.2 Probate Practitioner Market (NEW)

**Market Size**:
- **650,000+ deaths annually in UK** (rising to 727,000 by 2033/34)
- **~40% require formal probate** = 260,000 probate applications/year
- **£2.81bn UK Wills, Probate & Trusts market** (2024), growing 6.2% annually
- 28% increase in grant issues H1 2024 vs H1 2023 (processing backlog clearing)

**Target Customer Segments**:

| Segment | Size | Estimated Probate Cases/Year | Target Penetration |
|---------|------|------------------------------|-------------------|
| High Street Solicitors (1-5 partners) | ~8,000 firms | 100-500 per firm | 500 firms |
| Boutique Private Client Firms | ~2,000 firms | 50-200 per firm | 200 firms |
| Professional Will Writers | ~1,500 practitioners | 20-100 per firm | 100 practitioners |
| Bank Trust Departments | ~20 institutions | 1,000+ per bank | 10 institutions |

**Regulatory Requirements (Trustee Act 1925 s.27)**:
- **Mandatory**: Notice in The London Gazette
- **Mandatory** (for land): Notice in newspaper circulating in district where property located
- **Mandatory**: Minimum 2-month waiting period for creditor claims
- **Protective effect**: PRs protected from unknown creditors/beneficiaries after notice period

**Current Process Pain Points**:
1. Manual Gazette submission (slow web form, ~£100+ per notice)
2. Finding appropriate local newspapers for each property
3. Tracking 2-month deadlines across dozens of estates
4. Client communication about estate progress
5. No integrated workflow (estate admin software ≠ notice software)

**Competitor Analysis**:

| Competitor | Strength | Weakness | Price |
|------------|----------|----------|-------|
| LEAP Estates | Full practice management | No integrated Gazette/newspaper | £99-300/month |
| Clio UK | Modern UX, cloud-based | Generic workflows, no notice integration | £65-145/user/month |
| WillSuite | Will drafting focus | Estate admin is secondary | £50-150/month |
| PracticeEvolve | Large firm focused | Expensive, complex | £200+/user/month |

**Our Unique Advantage**: Direct integration with Gazette + newspaper network = **only platform** offering click-to-publish deceased estates notices with automated deadline tracking.

---

### 1.3 GVOL/O-Licence Market (NEW)

**Market Size**:
- **66,821 valid goods vehicle operator licences** in UK
- **5,451 valid PSV operator licences**
- **373,318 authorised goods vehicles**
- **11,383 applications/variations processed** in 2023-24
- **5-year renewal cycle** = ~13,000+ continuations annually

**Target Customer Segments**:

| Segment | Size | Typical Applications/Year | Target Penetration |
|---------|------|---------------------------|-------------------|
| Transport Consultants/Agents | ~500 specialists | 20-100 per agent | 200 agents |
| Haulage Companies (direct) | ~15,000 SMEs | 1-5 per company | 500 companies |
| Fleet Managers | ~5,000 professionals | 1-3 per manager | 300 managers |
| Solicitors handling O-licence | ~1,000 firms | 5-20 per firm | 100 firms |

**Regulatory Requirements**:
- New licence applications must advertise in local newspaper
- Operating centre additions/changes require advertisement
- **21-day objection period** from publication
- Traffic Commissioner makes determination
- **5-year licence duration** with formal continuation process

**Required Advertisement Content** (per GV79):
- Applicant name and address
- Operating centre location(s)
- Number and type of vehicles
- Application type (new/variation)

**Current Process Pain Points**:
1. Finding appropriate local newspaper for each operating centre
2. Ensuring correct legal wording meets Traffic Commissioner requirements
3. Tracking 21-day objection period start/end
4. Managing multiple operating centres across different traffic areas
5. 5-year renewal deadline management

**Competitor Analysis**:

| Competitor | Focus | Weakness |
|------------|-------|---------|
| VOL (Gov.uk) | Official application portal | No workflow management, no newspaper integration |
| Transport Manager CPC courses | Training focus | No operational workflow |
| Generic fleet management | Vehicle tracking | No licensing workflow |

**Our Unique Advantage**: **Only platform** offering automated O-licence newspaper advertisements with Traffic Commissioner compliant wording + deadline tracking.

---

## Part 2: Unified Platform Architecture

### 2.1 Shared Platform Features (All Verticals)

#### Visual Pipeline/Kanban Dashboard
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   INTAKE    │  │   DRAFTING  │  │   PUBLISH   │  │   WAITING   │  │  COMPLETE   │
│             │  │             │  │             │  │             │  │             │
│  New cases  │  │  Preparing  │  │  Live ads   │  │  Statutory  │  │  Deadline   │
│  received   │→ │  documents  │→ │  running    │→ │  period     │→ │  cleared    │
│             │  │             │  │             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

**Shared Features**:
- Drag-and-drop case progression
- Color-coded deadline urgency (red: <7 days, amber: <14 days)
- Case value and status indicators
- Activity timeline per case
- Multi-user collaboration

#### Deadline Engine (Critical Differentiator)

| Vertical | Key Deadlines |
|----------|---------------|
| Licensing | 28-day consultation, council determination (8-12 weeks), appeal (21 days) |
| Probate | 2-month creditor claims, IHT payment (6 months), distribution safe date |
| GVOL | 21-day objection period, determination, 5-year renewal |

**Alert Cascade**:
1. **14 days**: Dashboard warning + email
2. **7 days**: SMS + email + dashboard
3. **48 hours**: Phone call trigger + urgent dashboard
4. **Missed**: Escalation protocol + client notification

#### White-Label Client Portal
- Consultant/firm branding
- Real-time case status for clients
- Document repository
- Secure messaging
- Invoice history

#### Financial Management
- Milestone-based invoicing
- Expense tracking (newspaper costs, filing fees)
- Payment processing integration
- Aged debtor reports

---

### 2.2 Licensing-Specific Features

**10-Stage Workflow**:
1. Lead/Enquiry
2. Quote/Proposal
3. Instructed
4. Application Prep
5. Newspaper Publication
6. Council Submission
7. Consultation Period (28 days)
8. Hearing/Determination
9. Decision Received
10. Completed

**Licensing-Specific Tools**:
- Council database (350+ authorities with requirements)
- Premises licence template library
- Gambling Act (2005) notice templates
- Representation tracking
- Hearing diary management

**Integration Points**:
- Direct newspaper order placement (existing Civic Notices integration)
- Council portal deep links
- BII membership validation

---

### 2.3 Probate-Specific Features (NEW)

**6-Stage Workflow**:
1. **Instruction Received** — Client onboarding, conflict check
2. **Grant Preparation** — Asset gathering, IHT calculations
3. **Notice Publication** — Gazette + local newspaper(s)
4. **Waiting Period** — 2-month countdown + claims management
5. **Claims Review** — Handle any creditor responses
6. **Distribution** — Safe to distribute, final accounts

**Probate-Specific Tools**:

| Feature | Description |
|---------|-------------|
| **Gazette Integration** | Direct API submission to London Gazette (automated) |
| **Property-Newspaper Mapper** | Auto-suggest newspapers by property postcode |
| **Deadline Calculator** | Auto-calculate 2-month + buffer safe distribution date |
| **Claims Tracker** | Log and manage creditor claims during waiting period |
| **Estate Value Calculator** | Basic IHT/estate value estimation |
| **Multi-Property Handler** | One estate, multiple properties = multiple newspaper notices |

**Gazette API Integration** (Technical):
```json
POST /api/gazette/submit
{
  "notice_type": "deceased_estate",
  "deceased_name": "John Smith",
  "deceased_address": "123 High Street, London",
  "date_of_death": "2024-01-15",
  "executor_name": "Smith & Partners Solicitors",
  "executor_address": "...",
  "claim_deadline": "2024-04-20"
}
```

**Document Templates**:
- Gazette notice (statutory wording)
- Local newspaper notice (varying formats)
- Client notification letters
- Creditor claim acknowledgment
- Safe distribution certificate

---

### 2.4 GVOL-Specific Features (NEW)

**5-Stage Workflow**:
1. **Application Received** — Client details, vehicle requirements
2. **Draft & Review** — Prepare GV79 details, confirm operating centres
3. **Newspaper Publication** — Submit to appropriate local papers
4. **Objection Period** — 21-day countdown, monitor for objections
5. **Determination** — TC decision, licence issued

**GVOL-Specific Tools**:

| Feature | Description |
|---------|-------------|
| **Traffic Area Mapper** | Auto-identify correct Traffic Area from operating centre postcode |
| **GV79 Template Generator** | Pre-populate newspaper advert with compliant wording |
| **Operating Centre Manager** | Track multiple centres across different areas |
| **Objection Monitor** | Log and alert on any objections received |
| **5-Year Renewal Tracker** | Proactive renewal reminders 6 months before expiry |
| **Vehicle Authorisation Tracker** | Monitor authorised vs actual vehicles |

**Newspaper Advert Template** (GV79 Compliant):
```
GOODS VEHICLE OPERATOR'S LICENCE
[Company Name] of [Address] is applying for a licence to use
[Operating Centre Address] as an operating centre for [X] goods
vehicles and [Y] trailers. Owners or occupiers of land (including
buildings) near the operating centre(s) who believe that their
use or enjoyment of that land would be affected, should make
written representations to the Traffic Commissioner at [address]
within 21 days of this notice.
```

**Integration Points**:
- VOL (Vehicle Operator Licensing) portal links
- Traffic Commissioner office contact database
- DVSA compliance checker integration (future)

---

## Part 3: Pricing Strategy

### 3.1 Tiered Pricing by Vertical

#### Licensing Portal

| Plan | Price | Applications/Year | Features |
|------|-------|-------------------|----------|
| Starter | £149/month | Up to 25 | Basic workflow, email support |
| Professional | £199/month | Up to 75 | Full automation, client portal, phone support |
| Enterprise | £299/month | Unlimited | Multi-user, custom integrations, dedicated AM |

#### Probate Portal

| Plan | Price | Estates/Year | Features |
|------|-------|--------------|----------|
| Solo | £99/month | Up to 20 | Basic workflow, Gazette integration |
| Practice | £149/month | Up to 50 | Full automation, multi-property, client portal |
| Firm | £249/month | Unlimited | Multi-user, analytics, API access |

#### GVOL Portal

| Plan | Price | Applications/Year | Features |
|------|-------|-------------------|----------|
| Operator | £79/month | Up to 5 | Self-service, basic tracking |
| Agent | £149/month | Up to 25 | Full workflow, client management |
| Fleet | £199/month | Unlimited | Multi-centre, renewal tracking, API |

### 3.2 Combined Platform Discount

Subscribers to multiple verticals receive **20% discount** on second vertical and **30% on third**.

Example: Law firm doing licensing + probate
- Licensing Professional: £199
- Probate Practice: £149 × 0.8 = £119
- **Combined: £318/month** (vs £348 separate)

---

## Part 4: Revenue Projections

### 4.1 Conservative Growth Model

#### Year 1 (Launch + Growth)

| Vertical | Q1 | Q2 | Q3 | Q4 | Year 1 Total |
|----------|----|----|----|----|--------------|
| Licensing | 25 | 50 | 100 | 150 | 150 subs |
| Probate | 0 | 20 | 60 | 100 | 100 subs |
| GVOL | 0 | 0 | 30 | 75 | 75 subs |

**Year 1 ARR**: £650k

#### Year 2 (Market Expansion)

| Vertical | Subscribers | ARPU | ARR |
|----------|-------------|------|-----|
| Licensing | 300 | £199 | £716k |
| Probate | 300 | £149 | £536k |
| GVOL | 200 | £129 | £310k |

**Year 2 ARR**: £1.56M

#### Year 3 (Market Maturity)

| Vertical | Subscribers | ARPU | ARR |
|----------|-------------|------|-----|
| Licensing | 500 | £199 | £1.19M |
| Probate | 700 | £149 | £1.25M |
| GVOL | 400 | £129 | £619k |

**Year 3 ARR**: £3.06M

#### Year 5 (Full Potential)

| Vertical | Subscribers | ARPU | ARR |
|----------|-------------|------|-----|
| Licensing | 750 | £219 | £1.97M |
| Probate | 1,200 | £159 | £2.29M |
| GVOL | 600 | £139 | £1.00M |

**Year 5 ARR**: £5.26M

---

## Part 5: Technical Requirements

### 5.1 Core Platform Development

| Component | Description | Effort |
|-----------|-------------|--------|
| Multi-tenant architecture | Separate vertical workspaces, shared auth | 3 months |
| Kanban engine | Configurable stages per vertical | 1 month |
| Deadline engine | Rule-based alerts with SMS/email/call | 2 months |
| Client portal | White-label, mobile-responsive | 2 months |
| Reporting dashboard | Per-user, per-firm analytics | 1 month |

### 5.2 Integration Development

| Integration | Vertical | Priority | Effort |
|-------------|----------|----------|--------|
| London Gazette API | Probate | High | 2 months |
| Newspaper ordering (existing) | All | Critical | Already built |
| Stripe/GoCardless | All | High | 1 month |
| VOL portal links | GVOL | Medium | 1 month |
| Council database | Licensing | High | 2 months |

### 5.3 Data & Security

- **GDPR compliance**: Encryption at rest/transit, right to erasure
- **SRA compliance**: Required for solicitor-facing products
- **Multi-tenant isolation**: Firm data segregation
- **Audit logging**: Full access and change history
- **Backup & DR**: Daily backups, 4-hour RTO

---

## Part 6: Implementation Roadmap

### Phase 1: Licensing Portal Enhancement (Months 1-3)
- Kanban dashboard MVP
- Deadline engine v1
- Client portal beta
- **Milestone**: 25 beta users

### Phase 2: Probate Portal MVP (Months 4-6)
- Gazette API integration
- Property-newspaper mapping
- 2-month deadline calculator
- Estate workflow templates
- **Milestone**: 20 probate beta users

### Phase 3: GVOL Portal MVP (Months 7-9)
- GV79 template generator
- Traffic area mapper
- 21-day objection tracker
- 5-year renewal calendar
- **Milestone**: 30 GVOL beta users

### Phase 4: Platform Unification (Months 10-12)
- Cross-vertical reporting
- Combined billing
- Mobile app v1
- Partner API
- **Milestone**: 200 total subscribers, £500k ARR run-rate

---

## Part 7: Competitive Advantages

### 7.1 The Statutory Advertising Moat

**No competitor can replicate our position**:
1. **Newspaper relationships**: Decades of advertising partnerships
2. **Pricing leverage**: Volume discounts unavailable to one-off buyers
3. **Fulfillment expertise**: Correct format, correct publication, guaranteed
4. **Proof of publication**: Automated tearsheet/certificate delivery

### 7.2 Regulatory Expertise

| Vertical | Expertise Required | Our Position |
|----------|-------------------|--------------|
| Licensing | Licensing Act 2003, Gambling Act 2005 | 10+ years experience |
| Probate | Trustee Act 1925 s.27, estate law | New but learnable |
| GVOL | GVS 1969, Traffic Commissioner rules | Existing knowledge |

### 7.3 First-Mover Positioning

- **Licensing**: No direct SaaS competitor
- **Probate**: Existing tools lack notice integration (LEAP, Clio)
- **GVOL**: No workflow tools exist specifically for O-licence

---

## Part 8: Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow probate adoption | Medium | High | Partner with STEP/Law Society for credibility |
| GVOL market smaller than estimated | Medium | Medium | Low fixed cost; pivot resource if needed |
| Gazette API changes | Low | High | Maintain fallback manual submission |
| Competitor entry | Medium | Medium | Deepen integrations, build switching cost |
| Regulatory change | Low | High | Active monitoring, rapid adaptation |

---

## Part 9: Success Metrics

### Customer Success

| Metric | Target |
|--------|--------|
| Time saved per case | 40% reduction |
| Deadline compliance | 99.5%+ |
| Customer NPS | 50+ |
| Feature adoption | 80%+ use core features |

### Financial Success

| Metric | Year 1 | Year 3 |
|--------|--------|--------|
| ARR | £650k | £3.0M |
| Gross margin | 75% | 80% |
| CAC payback | 8 months | 5 months |
| Monthly churn | <5% | <3% |
| LTV:CAC ratio | 4:1 | 8:1 |

---

## Conclusion

The expanded Professional Portal positions Civic Notices as the **essential operating system** for UK professionals who publish statutory notices. By serving three distinct but related markets, we:

1. **Diversify revenue** across regulatory verticals
2. **Deepen our moat** through unique newspaper + software integration
3. **Create cross-sell opportunities** for multi-practice firms
4. **Build defensible market leadership** in statutory workflow automation

**Expected Outcome**: £4.5M+ ARR at maturity, transforming from transactional service to indispensable professional infrastructure.

---

*Document Version: 1.0 | Created: January 2026 | Author: Product Team*
