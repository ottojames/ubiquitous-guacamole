# PRD: Traffic Regulation Order (TRO) Workflow
## Civic Notices Council Portal

**Version:** 1.0  
**Date:** 29 January 2026  
**Status:** Draft  
**Author:** Civic Notices Product Team

---

## Executive Summary

This PRD defines the TRO (Traffic Regulation Order) workflow module for Civic Notices' Council Portal. TROs are statutory notices that UK councils **must** publish when making changes to roads — from parking restrictions and speed limits to road closures and one-way systems.

**Market opportunity:**
- 400+ traffic regulation authorities across Great Britain
- ~53,300 TROs created annually (DfT data)
- £126.4 million total annual processing cost
- Newspaper advertising alone: £40-50 million annually

**Strategic fit:** TROs align perfectly with Civic Notices' core competency — statutory advertising — while opening the B2G (business-to-government) market that the platform pivot was designed for.

---

## Table of Contents

1. [Market Analysis](#1-market-analysis)
2. [Legal Requirements](#2-legal-requirements)
3. [User Personas](#3-user-personas)
4. [Workflow Stages](#4-workflow-stages)
5. [Feature Requirements](#5-feature-requirements)
6. [Integration Points](#6-integration-points)
7. [Competitor Analysis](#7-competitor-analysis)
8. [Revenue Model](#8-revenue-model)
9. [Success Metrics](#9-success-metrics)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Market Analysis

### 1.1 Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Traffic Regulation Authorities (England & Wales) | ~400 | DfT/GeoPlace Discovery |
| Highway Authorities (England) | ~150 | Commons Library |
| Highway Authorities (Wales) | ~22 | Commons Library |
| Annual TROs created | ~53,300 | DfT 2022 Discovery |
| Annual processing cost | £126.4 million | DfT 2022 Discovery |
| Average cost per TRO | ~£2,370 | Calculated |

### 1.2 Authority Types

| Authority Type | Count | Avg TROs/Year | Notes |
|---------------|-------|---------------|-------|
| County Councils | 25 | 100-200 | Highest volume |
| Unitary Authorities | 58 | 60-100 | Combined highways |
| Metropolitan Districts | 36 | 80-150 | Urban density |
| London Boroughs | 33 | 100-200 | Highest complexity |
| District Councils (shire) | ~180 | 20-40 | Parking only |
| Welsh Councils | 22 | 40-80 | |
| Scottish Councils | 32 | 40-80 | Different regs |

### 1.3 TRO Volume by Type

| TRO Type | % of Total | Annual Volume | Typical Duration |
|----------|-----------|---------------|------------------|
| Temporary (TTROs) | 60% | ~32,000 | Up to 18 months |
| Permanent | 25% | ~13,300 | Indefinite |
| Experimental (ETROs) | 10% | ~5,300 | Up to 18 months |
| Emergency | 5% | ~2,700 | 21 days (extendable) |

### 1.4 Pricing Benchmarks (What Councils Currently Pay)

| Council | TTRO Fee | Notes |
|---------|----------|-------|
| Bath & NE Somerset | £1,669 - £1,990 | 8 week / 6 week notice |
| Manchester | £2,522+ | Minimum for roadworks |
| Thurrock | £1,800 | 2024 fees |
| West Sussex | £576 | 5 days or less |
| West Lothian | £833 | Scotland |
| Liverpool | £50 admin + full cost | |

**Average external cost per TRO:** £800-1,500 (newspaper advertising)  
**Average internal processing cost:** £1,500-2,000 (staff time, admin)

### 1.5 Regulatory Tailwinds

**DfT Consultation on TRO Reform (March 2022):**
- Proposed removing mandatory newspaper advertising
- Digital-first publication requirements
- Centralized D-TRO repository (launched September 2025)

**Automated Vehicles Act 2024:**
- Created powers for DfT to mandate D-TRO compliance
- Digital traffic orders essential for connected/autonomous vehicles
- Strong government push for standardization

**D-TRO Service (DfT):**
- Central repository launched end of January 2025
- API-based data sharing
- All TRAs expected to publish D-TROs
- Creates compliance requirement = sales opportunity

---

## 2. Legal Requirements

### 2.1 Primary Legislation

| Legislation | Purpose |
|-------------|--------|
| **Road Traffic Regulation Act 1984** | Primary enabling Act for TROs |
| **Local Authorities' Traffic Orders (Procedure) (England and Wales) Regulations 1996** | Procedural requirements |
| **Road Traffic (Temporary Restrictions) Procedure Regulations 1992** | TTRO procedures |
| **Traffic Management Act 2004** | Enforcement powers |

### 2.2 Compliance Checklist: Permanent TROs

```
□ Pre-consultation
  □ Notify statutory consultees (police, fire, ambulance, bus operators, 
    road haulage, freight transport)
  □ Notify county councillors / local members
  □ Notify Town/Parish/Community Councils
  
□ Public Notice Requirements
  □ Publish Notice of Intention in local newspaper (Regulation 7(1)(a))
  □ Display site notices at affected roads (Regulation 7(1)(c))
  □ Make documents available for public inspection (Schedule 2)
  □ Allow 21-day objection period from date of newspaper publication
  
□ Objection Handling
  □ Record all objections received during 21-day period
  □ Formally consider each objection
  □ Attempt to resolve with objectors
  □ Refer unresolved to Committee/Delegated Decision
  □ Notify objectors of decision
  
□ Making the Order
  □ Seal the TRO document
  □ Publish Notice of Making in newspaper within 14 days
  □ Update site notices
  □ Implement signs and road markings
  
□ Post-Implementation
  □ Maintain TRO register
  □ Respond to High Court appeals (6-week window)
```

### 2.3 Compliance Checklist: Temporary TROs (TTROs)

```
□ Pre-Notice Requirements
  □ Notify statutory undertakers (utilities)
  □ Consult emergency services (for closures >21 days)
  
□ Publication Requirements
  □ Publish in local newspaper at least 7 days before order starts
    (21 days if >18 months duration)
  □ Display site notices at road ends and diversion points
  □ Publish Notice of Making after order made
  
□ Duration Limits
  □ Footpaths/bridleways: Maximum 6 months
  □ Other roads: Maximum 18 months
  □ Emergency notices: 21 days (one extension permitted)
```

### 2.4 Newspaper Publication Requirements (Current Law)

**Regulation 7(1)(a) - 1996 Regulations:**
> "publish, at least once, a notice... in a newspaper circulating in the area in which any road or other place to which the order relates is situated"

**Notice of Intention must include (Schedule 1):**
- Description of roads affected
- Effect of the proposed order
- Where/when documents can be inspected
- How to make objections
- Closing date for objections (minimum 21 days)

**Notice of Making must include:**
- Confirmation order has been made
- Date order comes into force
- Brief description of effect
- Where order can be inspected

### 2.5 Statutory Consultees

| Consultee | Requirement | Lead Time |
|-----------|-------------|----------|
| Police | Mandatory | 21+ days |
| Fire & Rescue | Mandatory | 21+ days |
| Ambulance Service | Mandatory | 21+ days |
| Freight Transport Association | Recommended | 21+ days |
| Road Haulage Association | Recommended | 21+ days |
| Bus operators | Mandatory (if affected) | 21+ days |
| Parish/Town Councils | Recommended | 21+ days |
| Local councillors | Recommended | 21+ days |
| Statutory undertakers (utilities) | Mandatory for TTROs | Varies |

---

## 3. User Personas

### 3.1 Primary Users (Council Staff)

#### Traffic Officer / TRO Officer
**Role:** Creates and manages TROs day-to-day  
**Pain points:**
- Manual processes, paper-heavy workflow
- Tracking multiple TROs at different stages
- Meeting statutory deadlines
- Coordinating with multiple departments

**Needs:**
- Simple TRO creation with templates
- Dashboard showing all active TROs and deadlines
- Automated reminders for consultation periods
- Integration with GIS/mapping systems

#### Legal/Democratic Services Officer
**Role:** Ensures legal compliance, seals orders  
**Pain points:**
- Checking each TRO for compliance
- Managing objection hearings
- Maintaining sealed order records
- Responding to legal challenges

**Needs:**
- Compliance checklists built into workflow
- Audit trail of all actions
- Objection tracking and reporting
- Secure document storage

#### Highways Manager
**Role:** Approves TROs, manages budget  
**Pain points:**
- No visibility of TRO pipeline
- Budget tracking for newspaper ads
- Performance reporting
- Resource allocation

**Needs:**
- Pipeline dashboard
- Cost analytics
- Team workload visibility
- Reporting for members

### 3.2 Secondary Users

#### Cabinet Member / Portfolio Holder
**Needs:** High-level dashboard, objection escalations, political sensitivity alerts

#### Finance Officer
**Needs:** Cost tracking, budget vs actual, invoice management

#### Communications Team
**Needs:** Public-facing content, press releases, social media coordination

### 3.3 External Users

#### Members of Public
**Needs:**
- Find TROs affecting their area
- Understand what changes are proposed
- Submit objections easily
- Track objection status

#### Statutory Consultees
**Needs:**
- Receive notifications efficiently
- Respond to consultations
- Track responses

#### Utility Companies / Contractors
**Needs:**
- Apply for TTROs
- Track application status
- Receive approved orders

---

## 4. Workflow Stages

### 4.1 Permanent TRO Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PERMANENT TRO WORKFLOW                       │
│                        (Typical: 6-18 months)                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   REQUEST    │────>│   ASSESS     │────>│   DESIGN     │
│              │     │              │     │              │
│ • Councillor │     │ • Feasibility│     │ • Technical  │
│ • Community  │     │ • Priority   │     │ • Signs/lines│
│ • Officer    │     │ • Funding    │     │ • Legal draft│
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   INFORMAL   │<────│  STATUTORY   │<────│   PREPARE    │
│ CONSULTATION │     │ CONSULTATION │     │              │
│              │     │              │     │ • Documents  │
│ • Pre-consult│     │ • Police     │     │ • Maps       │
│ • Letter drop│     │ • Emergency  │     │ • Schedules  │
│ • 21 days    │     │ • Transport  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FORMAL     │────>│  OBJECTIONS  │────>│  DECISION    │
│ CONSULTATION │     │              │     │              │
│              │     │ • Record all │     │ • Delegated  │
│ • Newspaper  │     │ • Resolve    │     │ • Committee  │
│ • Site notice│     │ • Report     │     │ • Abandon    │
│ • 21 days    │     │              │     │ • Modify     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                          ┌───────────────────────┼───────────────┐
                          │                       │               │
                          ▼                       ▼               ▼
                   ┌──────────────┐     ┌──────────────┐  ┌──────────────┐
                   │    MAKE      │     │  RE-CONSULT  │  │   ABANDON    │
                   │              │     │              │  │              │
                   │ • Seal order │     │ • If changed │  │ • Close case │
                   │ • Notice of  │     │ • Back to    │  │ • Notify     │
                   │   Making     │     │   formal     │  │              │
                   └──────────────┘     └──────────────┘  └──────────────┘
                          │
                          ▼
                   ┌──────────────┐     ┌──────────────┐
                   │  IMPLEMENT   │────>│   ACTIVE     │
                   │              │     │              │
                   │ • Signs      │     │ • Enforce    │
                   │ • Markings   │     │ • Monitor    │
                   │ • D-TRO pub  │     │ • Review     │
                   └──────────────┘     └──────────────┘
```

### 4.2 TTRO Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TTRO WORKFLOW                              │
│                       (Typical: 3-6 weeks)                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ APPLICATION  │────>│   ASSESS     │────>│   APPROVE    │
│              │     │              │     │              │
│ • Utility    │     │ • Check plan │     │ • Fee paid   │
│ • Contractor │     │ • Conflicts  │     │ • Legal OK   │
│ • Event org  │     │ • Diversions │     │ • Issue ref  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   PUBLISH    │────>│   ACTIVE     │
                     │              │     │              │
                     │ • Newspaper  │     │ • Monitor    │
                     │   (7+ days)  │     │ • Site signs │
                     │ • Site signs │     │ • Complaints │
                     └──────────────┘     └──────────────┘
                                                  │
                          ┌───────────────────────┤
                          │                       │
                          ▼                       ▼
                   ┌──────────────┐     ┌──────────────┐
                   │    EXTEND    │     │    CLOSE     │
                   │              │     │              │
                   │ • If needed  │     │ • Remove     │
                   │ • Re-publish │     │   signs      │
                   │              │     │ • Archive    │
                   └──────────────┘     └──────────────┘
```

### 4.3 Experimental TRO (ETRO) Workflow

```
Similar to Permanent TRO but:
- No initial formal consultation required
- Order made immediately after statutory consultation
- 6-month objection window AFTER implementation
- Maximum 18 months duration
- Decision point: Make permanent / Modify / Revoke
```

### 4.4 Emergency TRO Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  EMERGENCY   │────>│   APPROVE    │────>│  IMPLEMENT   │
│  SITUATION   │     │              │     │              │
│              │     │ • Senior     │     │ • Immediate  │
│ • Danger     │     │   officer    │     │ • Site signs │
│ • Urgent     │     │ • Record     │     │ • 21 days    │
│              │     │   reason     │     │   max        │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                          ┌───────────────────────┤
                          │                       │
                          ▼                       ▼
                   ┌──────────────┐     ┌──────────────┐
                   │   EXTEND     │     │   CONVERT    │
                   │              │     │              │
                   │ • One 21-day │     │ • To TTRO or │
                   │   extension  │     │   Permanent  │
                   │              │     │              │
                   └──────────────┘     └──────────────┘
```

---

## 5. Feature Requirements

### 5.1 Core Features (MVP)

#### 5.1.1 TRO Creation & Templates

| Feature | Priority | Description |
|---------|----------|-------------|
| TRO type selection | P0 | Permanent, Temporary, Experimental, Emergency |
| Template library | P0 | Pre-built templates for common TRO types |
| Rich text editor | P0 | For legal schedule text |
| Document upload | P0 | Supporting plans, maps, schedules |
| Auto-numbering | P1 | Sequential TRO reference numbers |
| Clone existing TRO | P1 | For similar orders |

**Template Categories:**
- Speed limits (20mph, 30mph, 40mph zones)
- Parking restrictions (single/double yellow, controlled zones)
- Weight limits
- One-way streets
- Prohibition of driving
- Bus lanes
- Pedestrian zones
- Road closures (temporary)
- Event orders (Section 16A)

#### 5.1.2 Mapping & GIS Integration

| Feature | Priority | Description |
|---------|----------|-------------|
| Interactive map | P0 | Draw restriction areas on map |
| Address lookup | P0 | Find roads by name/postcode |
| Ordnance Survey base | P0 | OS MasterMap or similar |
| Export GeoJSON | P0 | For D-TRO compliance |
| Import shapefiles | P1 | From existing GIS systems |
| Restriction visualization | P1 | Different styles per restriction type |

#### 5.1.3 Consultation Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Statutory consultee register | P0 | Pre-configured contacts |
| Automated notifications | P0 | Email/letter templates |
| Response tracking | P0 | Record consultation responses |
| 21-day countdown | P0 | Automatic deadline tracking |
| Reminder system | P0 | Before deadlines expire |
| Response dashboard | P1 | Summary of all responses |

#### 5.1.4 Public Objection Handling

| Feature | Priority | Description |
|---------|----------|-------------|
| Online objection form | P0 | Public-facing submission |
| Objection register | P0 | Log all objections with timestamp |
| Categorization | P0 | Theme/issue tagging |
| Resolution tracking | P0 | Status per objection |
| Officer assignment | P1 | Who's handling which objection |
| Response templates | P1 | Standard responses |
| Committee report generator | P1 | Auto-generate objection summary |

#### 5.1.5 Publication

| Feature | Priority | Description |
|---------|----------|-------------|
| Notice generator | P0 | Auto-generate Notice of Intention |
| Newspaper booking | P0 | Integration with Statutory Advertising workflow |
| Site notice generator | P0 | Printable A4/A3 notices |
| Civic Notices listing | P0 | Publish to public portal |
| Notice of Making generator | P0 | Post-decision publication |
| D-TRO export | P1 | DfT compliant format |

### 5.2 Advanced Features (Phase 2)

#### 5.2.1 Workflow Automation

| Feature | Priority | Description |
|---------|----------|-------------|
| Stage-gate automation | P2 | Auto-advance when criteria met |
| Approval workflows | P2 | Multi-level sign-off |
| Escalation rules | P2 | Overdue tasks escalate |
| Email notifications | P2 | Stakeholder updates |
| Calendar integration | P2 | Sync deadlines to calendars |

#### 5.2.2 Reporting & Analytics

| Feature | Priority | Description |
|---------|----------|-------------|
| Pipeline dashboard | P2 | TROs by stage |
| Performance metrics | P2 | Time-to-completion |
| Cost tracking | P2 | Budget vs actual |
| Objection analytics | P2 | Common themes |
| Member reports | P2 | Ward-level summaries |
| BVPI compliance | P2 | Best value indicators |

#### 5.2.3 Integration

| Feature | Priority | Description |
|---------|----------|-------------|
| D-TRO API | P2 | DfT repository sync |
| Committee management | P2 | ModernGov integration |
| GIS systems | P2 | ESRI, MapInfo |
| Finance systems | P2 | Invoicing, cost coding |
| Highways systems | P2 | Works management |

### 5.3 Public Portal Features

| Feature | Priority | Description |
|---------|----------|-------------|
| TRO search | P0 | By location, type, date |
| Interactive map | P0 | View TROs on map |
| Document access | P0 | View full TRO documents |
| Objection submission | P0 | Online form |
| Notification signup | P1 | "Alert me for this area" |
| Comment system | P2 | Community feedback |

---

## 6. Integration Points

### 6.1 Existing Civic Notices Infrastructure

| Component | Integration | Notes |
|-----------|-------------|-------|
| Notice publication engine | Direct | Use existing workflow |
| Payment processing | Direct | Council billing |
| User authentication | Direct | Extend to council users |
| Document storage | Direct | Use existing infrastructure |
| Public portal | Direct | New TRO section |

### 6.2 External Integrations

| System | Priority | Integration Type |
|--------|----------|------------------|
| **D-TRO (DfT)** | P1 | API (mandatory for compliance) |
| **Ordnance Survey** | P1 | MasterMap / AddressBase |
| **Council SSO** | P1 | SAML/OAuth |
| **Email/SMTP** | P0 | Notifications |
| **PDF generation** | P0 | Notices, reports |

### 6.3 D-TRO Integration Requirements

The DfT's D-TRO service requires:
- GeoJSON spatial data
- Standardized data model
- API-based submission
- TRA (Traffic Regulation Authority) registration
- DSP (Digital Solution Provider) registration for platforms

**Civic Notices would register as a DSP**, enabling:
- Publishing TROs on behalf of TRAs
- Querying the national TRO repository
- Receiving updates from other authorities

---

## 7. Competitor Analysis

### 7.1 Direct Competitors

#### ParkMap (Buchanan Computing / Causeway)
**Market position:** Market leader, 90+ authorities  
**Strengths:**
- Deep GIS capabilities
- Full D-TRO compliance
- Established relationships
- Comprehensive TRO database

**Weaknesses:**
- Complex, steep learning curve
- High implementation costs (£50k+)
- Enterprise sales cycle
- Desktop-heavy interface

**Pricing:** £15,000-50,000 annually (estimated)

#### eVO (Digital Marketplace listing)
**Strengths:**
- TSRGD compliant toolset
- D-TRO API integration
- Out-of-the-box solution

**Weaknesses:**
- Limited market penetration
- Less established brand

#### CurbIQ (Arcadis)
**Strengths:**
- Strong Arcadis brand
- GIS platform
- D-TRO compliant

**Weaknesses:**
- Part of larger enterprise offering
- May be overkill for smaller authorities

### 7.2 Adjacent Competitors

#### Citizen Space (Delib)
**Focus:** Consultation and engagement  
**Used for:** TRO public consultations  
**Weakness:** Not TRO-specific workflow

#### Commonplace
**Focus:** Community engagement  
**Used for:** Transport consultations  
**Weakness:** Not compliance-focused

---

## 6. Integration Points

### 6.1 Existing Civic Notices Infrastructure

| Component | Integration | Notes |
|-----------|-------------|-------|
| Notice publication engine | Direct | Use existing workflow |
| Payment processing | Direct | Council billing |
| User authentication | Direct | Extend to council users |
| Document storage | Direct | Use existing infrastructure |
| Public portal | Direct | New TRO section |

### 6.2 External Integrations

| System | Priority | Integration Type |
|--------|----------|------------------|
| **D-TRO (DfT)** | P1 | API (mandatory for compliance) |
| **Ordnance Survey** | P1 | MasterMap / AddressBase |
| **Council SSO** | P1 | SAML/OAuth |
| **Email/SMTP** | P0 | Notifications |
| **PDF generation** | P0 | Notices, reports |

### 6.3 D-TRO Integration Requirements

The DfT's D-TRO service requires:
- GeoJSON spatial data
- Standardized data model
- API-based submission
- TRA (Traffic Regulation Authority) registration
- DSP (Digital Solution Provider) registration for platforms

**Civic Notices would register as a DSP**, enabling:
- Publishing TROs on behalf of TRAs
- Querying the national TRO repository
- Receiving updates from other authorities

---

## 7. Competitor Analysis

### 7.1 Direct Competitors

#### ParkMap (Buchanan Computing / Causeway)
**Market position:** Market leader, 90+ authorities  
**Strengths:**
- Deep GIS capabilities
- Full D-TRO compliance
- Established relationships
- Comprehensive TRO database

**Weaknesses:**
- Complex, steep learning curve
- High implementation costs (Â£50k+)
- Enterprise sales cycle
- Desktop-heavy interface

**Pricing:** Â£15,000-50,000 annually (estimated)

#### eVO (Digital Marketplace listing)
**Strengths:**
- TSRGD compliant toolset
- D-TRO API integration
- Out-of-the-box solution

**Weaknesses:**
- Limited market penetration
- Less established brand

#### CurbIQ (Arcadis)
**Strengths:**
- Strong Arcadis brand
- GIS platform
- D-TRO compliant

**Weaknesses:**
- Part of larger enterprise offering
- May be overkill for smaller authorities

### 7.2 Adjacent Competitors

#### Citizen Space (Delib)
**Focus:** Consultation and engagement  
**Used for:** TRO public consultations  
**Weakness:** Not TRO-specific workflow

#### Commonplace
**Focus:** Community engagement  
**Used for:** Transport consultations  
**Weakness:** Not compliance-focused

### 7.3 Competitive Positioning

```
                    High Complexity / High Cost
                              │
                   ┌──────────┼──────────┐
                   │          │          │
                   │  ParkMap │  CurbIQ  │
                   │          │          │
                   └──────────┼──────────┘
                              │
Low Engagement ───────────────┼─────────────── High Engagement
                              │
                   ┌──────────┼──────────┐
                   │          │          │
                   │          │ Citizen  │
                   │  >>>     │ Space    │
                   │ CIVIC    │          │
                   │ NOTICES  │          │
                   │  <<<     │          │
                   └──────────┼──────────┘
                              │
                    Low Complexity / Low Cost
```

**Civic Notices positioning:**
- Simpler than enterprise GIS platforms
- More affordable (SaaS model)
- Compliance-focused but engagement-enabled
- Built on proven statutory advertising expertise

### 7.3 Competitive Positioning

```
                    High Complexity / High Cost
                              |
                   +----------+----------+
                   |          |          |
                   |  ParkMap |  CurbIQ  |
                   |          |          |
                   +----------+----------+
                              |
Low Engagement ---------------+--------------- High Engagement
                              |
                   +----------+----------+
                   |          |          |
                   |          | Citizen  |
                   |  >>>     | Space    |
                   | CIVIC    |          |
                   | NOTICES  |          |
                   |  <<<     |          |
                   +----------+----------+
                              |
                    Low Complexity / Low Cost
```

**Civic Notices positioning:**
- Simpler than enterprise GIS platforms
- More affordable (SaaS model)
- Compliance-focused but engagement-enabled
- Built on proven statutory advertising expertise

---

## 8. Revenue Model

### 8.1 Pricing Tiers

| Tier | Authority Type | Annual Price | Includes |
|------|---------------|--------------|----------|
| **Starter** | Small districts | £3,000 | Up to 30 TROs/year |
| **Standard** | Unitary/Borough | £8,000 | Up to 100 TROs/year |
| **Professional** | County/Metro | £15,000 | Up to 200 TROs/year |
| **Enterprise** | Large/TfL | £25,000+ | Unlimited + custom |

### 8.2 Additional Revenue

| Service | Price | Notes |
|---------|-------|-------|
| Newspaper advertising | Pass-through + margin | Core Statutory Advertising business |
| Onboarding/training | £2,000 | Per authority |
| Data migration | £5,000-15,000 | Import existing TROs |
| Custom integration | Day rate | GIS, finance systems |
| Premium support | +25% | SLA, dedicated contact |

### 8.3 Revenue Projections

**Conservative Scenario:**

| Year | Councils | Avg Price | MRR | ARR |
|------|----------|-----------|-----|-----|
| Y1 | 15 | £6,000 | £7,500 | £90,000 |
| Y2 | 50 | £7,000 | £29,167 | £350,000 |
| Y3 | 100 | £8,000 | £66,667 | £800,000 |
| Y4 | 175 | £8,500 | £124,000 | £1,487,500 |
| Y5 | 250 | £9,000 | £187,500 | £2,250,000 |

**Aggressive Scenario (with D-TRO mandate):**

| Year | Councils | Avg Price | ARR |
|------|----------|-----------|-----|
| Y1 | 30 | £6,000 | £180,000 |
| Y2 | 100 | £7,500 | £750,000 |
| Y3 | 200 | £8,500 | £1,700,000 |
| Y4 | 300 | £9,000 | £2,700,000 |
| Y5 | 400 | £10,000 | £4,000,000 |

### 8.4 Unit Economics

| Metric | Target |
|--------|--------|
| CAC (Customer Acquisition Cost) | £5,000-10,000 |
| LTV (Lifetime Value) | £40,000+ (5+ year retention) |
| LTV:CAC Ratio | 4:1 minimum |
| Gross Margin | 75%+ |
| Payback Period | <12 months |

---

## 9. Success Metrics

### 9.1 Business Metrics

| Metric | Y1 Target | Y3 Target |
|--------|-----------|-----------|
| Councils onboarded | 15 | 100 |
| ARR | £90k | £800k |
| Net Revenue Retention | 110%+ | 115%+ |
| Customer Churn | <10% | <5% |

### 9.2 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TROs processed | 500+ (Y1) | System count |
| Time saved per TRO | 40%+ | Before/after study |
| Compliance rate | 100% | No legal challenges |
| User satisfaction | NPS 40+ | Quarterly survey |
| Feature adoption | 80% core | Usage analytics |

### 9.3 Engagement Metrics

| Metric | Target |
|--------|--------|
| Public objections submitted | 10% via platform |
| Consultation responses | 20% increase |
| Search queries | Growth indicator |
| Return visitors | Engagement health |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Goal:** MVP for pilot councils

- [ ] TRO data model design
- [ ] Core workflow engine
- [ ] Basic templates (top 5 TRO types)
- [ ] Document generation (notices)
- [ ] Integration with existing Civic Notices publication
- [ ] Simple GIS (address lookup, basic mapping)
- [ ] Public listing page
- [ ] Online objection form

**Milestone:** 2 pilot councils processing TTROs

### Phase 2: Compliance (Months 4-6)

**Goal:** Full legal compliance, D-TRO ready

- [ ] All TRO types supported
- [ ] Full template library
- [ ] Statutory consultee management
- [ ] 21-day period automation
- [ ] Objection tracking & reporting
- [ ] Committee report generator
- [ ] D-TRO export format
- [ ] Audit logging

**Milestone:** 5 councils live, D-TRO pilot

### Phase 3: Scale (Months 7-12)

**Goal:** Market expansion, enterprise features

- [ ] D-TRO API integration (live)
- [ ] Council SSO integration
- [ ] Advanced GIS (draw on map)
- [ ] Analytics dashboard
- [ ] Multi-council admin
- [ ] API for third-party integrations
- [ ] Mobile-responsive workflow

**Milestone:** 15+ councils, £90k ARR

### Phase 4: Dominance (Year 2)

- [ ] Full ParkMap feature parity
- [ ] AI-powered drafting assistance
- [ ] Predictive objection analysis
- [ ] Public engagement features
- [ ] National coverage (Scotland/NI regs)

---

## 8. Revenue Model

### 8.1 Pricing Tiers

| Tier | Authority Type | Annual Price | Includes |
|------|---------------|--------------|----------|
| **Starter** | Small districts | Â£3,000 | Up to 30 TROs/year |
| **Standard** | Unitary/Borough | Â£8,000 | Up to 100 TROs/year |
| **Professional** | County/Metro | Â£15,000 | Up to 200 TROs/year |
| **Enterprise** | Large/TfL | Â£25,000+ | Unlimited + custom |

### 8.2 Additional Revenue

| Service | Price | Notes |
|---------|-------|-------|
| Newspaper advertising | Pass-through + margin | Core Statutory Advertising business |
| Onboarding/training | Â£2,000 | Per authority |
| Data migration | Â£5,000-15,000 | Import existing TROs |
| Custom integration | Day rate | GIS, finance systems |
| Premium support | +25% | SLA, dedicated contact |

### 8.3 Revenue Projections

**Conservative Scenario:**

| Year | Councils | Avg Price | MRR | ARR |
|------|----------|-----------|-----|-----|
| Y1 | 15 | Â£6,000 | Â£7,500 | Â£90,000 |
| Y2 | 50 | Â£7,000 | Â£29,167 | Â£350,000 |
| Y3 | 100 | Â£8,000 | Â£66,667 | Â£800,000 |
| Y4 | 175 | Â£8,500 | Â£124,000 | Â£1,487,500 |
| Y5 | 250 | Â£9,000 | Â£187,500 | Â£2,250,000 |

**Aggressive Scenario (with D-TRO mandate):**

| Year | Councils | Avg Price | ARR |
|------|----------|-----------|-----|
| Y1 | 30 | Â£6,000 | Â£180,000 |
| Y2 | 100 | Â£7,500 | Â£750,000 |
| Y3 | 200 | Â£8,500 | Â£1,700,000 |
| Y4 | 300 | Â£9,000 | Â£2,700,000 |
| Y5 | 400 | Â£10,000 | Â£4,000,000 |

### 8.4 Unit Economics

| Metric | Target |
|--------|--------|
| CAC (Customer Acquisition Cost) | Â£5,000-10,000 |
| LTV (Lifetime Value) | Â£40,000+ (5+ year retention) |
| LTV:CAC Ratio | 4:1 minimum |
| Gross Margin | 75%+ |
| Payback Period | <12 months |

---

## 9. Success Metrics

### 9.1 Business Metrics

| Metric | Y1 Target | Y3 Target |
|--------|-----------|----------|
| Councils onboarded | 15 | 100 |
| ARR | Â£90k | Â£800k |
| Net Revenue Retention | 110%+ | 115%+ |
| Customer Churn | <10% | <5% |

### 9.2 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TROs processed | 500+ (Y1) | System count |
| Time saved per TRO | 40%+ | Before/after study |
| Compliance rate | 100% | No legal challenges |
| User satisfaction | NPS 40+ | Quarterly survey |
| Feature adoption | 80% core | Usage analytics |

### 9.3 Engagement Metrics

| Metric | Target |
|--------|--------|
| Public objections submitted | 10% via platform |
| Consultation responses | 20% increase |
| Search queries | Growth indicator |
| Return visitors | Engagement health |

---

## Appendix A: Sample Notice of Intention

```
THE ROAD TRAFFIC REGULATION ACT 1984
THE LOCAL AUTHORITIES' TRAFFIC ORDERS (PROCEDURE)
(ENGLAND AND WALES) REGULATIONS 1996

NOTICE OF INTENTION

[COUNCIL NAME] COUNCIL

[ORDER TITLE] ORDER 202X

Notice is hereby given that [Council Name] Council proposes to make 
the above Order under Section [X] of the Road Traffic Regulation 
Act 1984.

THE EFFECT of the Order will be to [description of effect]

A COPY of the proposed Order together with a plan showing the roads 
affected and a statement of the Council's reasons for proposing to 
make the Order may be examined at [location] during normal office 
hours or at [website].

OBJECTIONS to the proposed Order, stating the grounds on which they 
are made, must be sent in writing to [contact details] by [date - 
minimum 21 days from publication].

Dated: [date]

[Officer name]
[Title]
[Council Name] Council
```

---

## Appendix B: D-TRO Data Model Summary

The DfT D-TRO data model includes:

- **Regulation** (what the restriction is)
- **Provision** (the legal basis)
- **Location** (GeoJSON geometry)
- **Condition** (when it applies - time, vehicle type)
- **Authority** (who made it)
- **Validity** (start/end dates)

Civic Notices must export TROs in this format to publish to the D-TRO national repository.

---

## Appendix C: Key Sales Messages for Councils

### For Traffic Officers:
> "Stop wrestling with spreadsheets and Word documents. Civic Notices gives you one place to manage every TRO from first draft to enforcement."

### For Finance:
> "Cut your TRO processing costs by 40%. Automated workflows mean fewer staff hours, and our competitive newspaper rates mean lower advertising spend."

### For Legal:
> "Built-in compliance checklists mean no more worrying about missed deadlines or procedural errors. Full audit trail for every action."

### For Cabinet Members:
> "Give residents a modern way to find out about traffic changes in their area and have their say. Show you're a forward-thinking council."

### For IT:
> "Cloud-based SaaS — no servers to maintain. D-TRO compliant out of the box. SSO integration available."

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 29 Jan 2026 | Civic Notices Product | Initial PRD |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Goal:** MVP for pilot councils

- [ ] TRO data model design
- [ ] Core workflow engine
- [ ] Basic templates (top 5 TRO types)
- [ ] Document generation (notices)
- [ ] Integration with existing Civic Notices publication
- [ ] Simple GIS (address lookup, basic mapping)
- [ ] Public listing page
- [ ] Online objection form

**Milestone:** 2 pilot councils processing TTROs

### Phase 2: Compliance (Months 4-6)

**Goal:** Full legal compliance, D-TRO ready

- [ ] All TRO types supported
- [ ] Full template library
- [ ] Statutory consultee management
- [ ] 21-day period automation
- [ ] Objection tracking & reporting
- [ ] Committee report generator
- [ ] D-TRO export format
- [ ] Audit logging

**Milestone:** 5 councils live, D-TRO pilot

### Phase 3: Scale (Months 7-12)

**Goal:** Market expansion, enterprise features

- [ ] D-TRO API integration (live)
- [ ] Council SSO integration
- [ ] Advanced GIS (draw on map)
- [ ] Analytics dashboard
- [ ] Multi-council admin
- [ ] API for third-party integrations
- [ ] Mobile-responsive workflow

**Milestone:** 15+ councils, Â£90k ARR

### Phase 4: Dominance (Year 2)

- [ ] Full ParkMap feature parity
- [ ] AI-powered drafting assistance
- [ ] Predictive objection analysis
- [ ] Public engagement features
- [ ] National coverage (Scotland/NI regs)

---

## Appendix A: Sample Notice of Intention

```
THE ROAD TRAFFIC REGULATION ACT 1984
THE LOCAL AUTHORITIES' TRAFFIC ORDERS (PROCEDURE)
(ENGLAND AND WALES) REGULATIONS 1996

NOTICE OF INTENTION

[COUNCIL NAME] COUNCIL

[ORDER TITLE] ORDER 202X

Notice is hereby given that [Council Name] Council proposes to make 
the above Order under Section [X] of the Road Traffic Regulation 
Act 1984.

THE EFFECT of the Order will be to [description of effect]

A COPY of the proposed Order together with a plan showing the roads 
affected and a statement of the Council's reasons for proposing to 
make the Order may be examined at [location] during normal office 
hours or at [website].

OBJECTIONS to the proposed Order, stating the grounds on which they 
are made, must be sent in writing to [contact details] by [date - 
minimum 21 days from publication].

Dated: [date]

[Officer name]
[Title]
[Council Name] Council
```

---

## Appendix B: D-TRO Data Model Summary

The DfT D-TRO data model includes:

- **Regulation** (what the restriction is)
- **Provision** (the legal basis)
- **Location** (GeoJSON geometry)
- **Condition** (when it applies - time, vehicle type)
- **Authority** (who made it)
- **Validity** (start/end dates)

Civic Notices must export TROs in this format to publish to the D-TRO national repository.

---

## Appendix C: Key Sales Messages for Councils

### For Traffic Officers:
> "Stop wrestling with spreadsheets and Word documents. Civic Notices gives you one place to manage every TRO from first draft to enforcement."

### For Finance:
> "Cut your TRO processing costs by 40%. Automated workflows mean fewer staff hours, and our competitive newspaper rates mean lower advertising spend."

### For Legal:
> "Built-in compliance checklists mean no more worrying about missed deadlines or procedural errors. Full audit trail for every action."

### For Cabinet Members:
> "Give residents a modern way to find out about traffic changes in their area and have their say. Show you're a forward-thinking council."

### For IT:
> "Cloud-based SaaS â no servers to maintain. D-TRO compliant out of the box. SSO integration available."

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 29 Jan 2026 | Civic Notices Product | Initial PRD |
