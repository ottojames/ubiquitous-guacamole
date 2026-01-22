# Competitor Analysis: UK Public Notice Market

**Researched:** 2026-01-22
**Confidence:** HIGH (multiple authoritative sources verified)

## Executive Summary

The UK public notice market is fragmented, undergoing regulatory disruption, and ripe for digital transformation. The market divides into three segments: official government notices (The Gazette), newspaper-based statutory notices (declining but legally mandated), and emerging digital aggregation platforms. A significant market opportunity exists because:

1. **Regulatory change is imminent** - Government consultation (October 2025) proposes ending newspaper notice requirements for Licensing Act applications
2. **No direct submission platform exists** - Public Notice Portal aggregates but doesn't accept direct submissions
3. **Pricing is opaque and inflated** - Newspaper notice costs range £125-£400 with no transparency
4. **Local newspaper industry is collapsing** - 18% circulation decline in H1 2025, 6,000 fewer journalists since 2007
5. **Council software vendors don't address public-facing notice publication**

**Primary opportunity:** Build the "submission layer" that neither The Gazette (official notices only) nor Public Notice Portal (aggregation only) provides.

---

## Market Segments

### Segment 1: Official Government Notices (The Gazette)

**Provider:** The Gazette (London, Edinburgh, Belfast)
**Operator:** The Stationery Office (TSO) under Crown copyright
**URL:** https://www.thegazette.co.uk/

#### What They Do
- UK's official public record since 1665
- Legally required for: insolvency, deceased estates, state honours, company notices
- NOT required for: Licensing Act notices, planning notices (these go to newspapers)

#### Publication Schedule
| Edition | Frequency | Deadline |
|---------|-----------|----------|
| London | Daily (working days) | 11:30am, 2 days prior |
| Edinburgh | Monday/Wednesday | 9:30am, day before |
| Belfast | Monday | 3pm, day before |

#### Pricing (2026)

| Notice Type | Public Sector | Other Advertisers |
|-------------|---------------|-------------------|
| Insolvency (XML/webform) | Free | Free |
| Insolvency (other) | £131.70 | £263.40 |
| Deceased Estates | £96.55-£131.70 | £96.55-£131.70 |
| Other Notices | £0-£131.70 | £0-£263.40 |

Additional fees:
- Offline proofing: £46.60-£60.05
- Late advertisements: £46.60-£60.05
- Notice withdrawal: £25.75-£131.70
- Brand/logo insertion: £66.45-£87.55
- All prices exclude 20% VAT

#### Submission Methods
- Web forms (single notices)
- Excel templates (up to 20 notices)
- XML files (bulk)
- REST API (via GitHub documentation)
- Post/email for offline submission

#### Strengths
- Unquestionable authority and permanence
- Modern API for bulk submitters
- Instant online publishing for selected types
- Comprehensive search and archive

#### Weaknesses
- Limited scope (doesn't cover Licensing Act, planning)
- Complex pricing structure
- No consumer-friendly UX
- Requires verification as "official person"

#### Competitive Implications
The Gazette is NOT a direct competitor for Licensing Act or planning notices. It serves a different statutory requirement. However, its existence establishes user expectations for authoritative digital notice publication.

---

### Segment 2: Newspaper-Based Statutory Notices

**Current Requirement:** Licensing Act 2003 mandates newspaper publication for premises licence applications.

#### Market Structure

Three publishers control ~70% of UK local newspaper circulation:
- **Newsquest** (205 brands, owned by USA Today Co.)
- **Reach plc** (Mirror, Express, regional titles)
- **National World** (formerly JPI Media)

This consolidation means pricing power rests with publishers, not applicants.

#### Pricing Reality (2025 Examples)

| Area | Required Newspaper | Cost (inc VAT) |
|------|-------------------|----------------|
| Milton Keynes | MK Citizen | £306 |
| Hackney | Hackney Gazette | £271 |
| Stoke | Evening Sentinel | £196 |
| Peterborough | Peterborough Telegraph | ~£400 |
| Hunts area | The Hunts | £230 |

**Typical range:** £125-£400 per notice

#### Critical Pain Points

1. **Price opacity** - Each newspaper sets its own rates with no standardisation
2. **Circulation decline** - 18% average decline in H1 2025 for regional dailies
3. **Reach questions** - "Circulating in the vicinity" increasingly meaningless as print dies
4. **Manual process** - Phone/email to newspaper advertising departments
5. **Proof delivery** - Paper tearsheets or PDF scans, inconsistent formats
6. **No verification** - System relies on applicant honesty about publication

#### Regulatory Threat to Newspapers

**October 2025 Consultation:** Government proposed ending newspaper notice requirements for Licensing Act applications.

Key quotes from consultation:
- "The requirement to place statutory notices in printed local newspapers reflects the need to keep local people informed... However, some licence applicants report significant and varying costs for advertising notices."
- Digital alternatives being explored: "online portals, council websites, and social media"

**Industry response:** News Media Association called proposals "devastating" and warned they would "disenfranchise local communities and deprive local journalism of a vital revenue stream."

**Revenue significance:** One local publication reported receiving £90,000/year in public notice advertising from their local council alone.

---

### Segment 3: Digital Aggregation & Intermediary Platforms

#### Public Notice Portal

**URL:** https://publicnoticeportal.uk/
**Operator:** News Media Association (newspaper industry body)
**Funding:** Google News Initiative

##### What It Does
- Aggregates notices from ~900 local/regional news publications
- Provides searchable database with location-based search
- Email alerts (daily/weekly/monthly)
- Archive access (notices back to May 2023)

##### Notice Categories
1. Planning
2. Traffic & Roads
3. Goods Vehicle Licensing
4. Alcohol & Licensing
5. Probate & Trustee
6. Contract & Tender
7. Statutory
8. Other

##### Business Model
- Free to search current notices
- Archive access: 10p per notice (minimum £5 transaction)
- Enterprise service for orders >£1,000

##### Critical Limitation
**Cannot accept submissions.** From their website:
> "Currently there is no way for businesses or public users to publish notices directly to Public Notice Portal. If you would like to publish a Public Notice, contacting either your local news publisher or your local authority is recommended."

##### Market Position
- Won Digital Initiative of the Year at Regional Press Awards 2024
- 5 million views, 23,000 registered users
- Reached 1 million users milestone May 2024

##### Competitive Implications
Public Notice Portal validates market demand for digital notice discovery but explicitly does NOT compete in the submission/publication layer. This is the gap.

---

#### Legal Notice Gateway

**URL:** https://legalnoticegateway.com/
**Position:** Notice submission intermediary

##### What It Does
- Centralized platform for creating and submitting notices
- Auto-formats to Gazette and newspaper standards
- Network of 600+ local newspapers
- Dashboard for tracking publication status

##### Notice Types Supported
- HGV Operator Licence Notices
- Probate Notices (Section 27)
- Insolvency Notices
- Premises Licence Notices (Licensing Act 2003)

##### Strengths
- Actually handles submission (unlike Public Notice Portal)
- Multi-channel (Gazette + newspapers)
- Compliance automation

##### Weaknesses
- Intermediary model (adds margin on top of publication costs)
- No transparent pricing ("request quote")
- Professional-focused, not consumer-friendly
- No apparent council/authority portal

##### Competitive Implications
Legal Notice Gateway is the closest direct competitor for the submission use case. However, their intermediary model means they're adding cost, not reducing it. A platform with direct newspaper relationships or digital-first publication could undercut.

---

#### Legal Advertisers UK / LegalAds

**URLs:**
- https://legaladvertisers.co.uk/
- https://www.legalads.co.uk/

##### What They Are
Traditional advertising agencies specializing in legal notice placement. They:
- Take orders via phone/email/portal
- Place notices with newspapers on behalf of clients
- Provide tearsheets/certificates of insertion
- Offer international placement (50+ countries)

##### Notice Types
- Licensing Act notices
- Trustee Act/probate notices
- Insolvency notices
- Gambling Act notices
- HGV operator notices

##### Business Model
Commission-based intermediary. "Discounted rates through bulk purchasing power."

##### Competitive Implications
These are the legacy players that a modern digital platform would disrupt. Their value proposition is "we know which newspapers to call" - easily automatable.

---

### Segment 4: Council Software Vendors

#### Idox

**Market position:** 30+ years in local government, leading planning/licensing software
**Products:** Cloud-based licensing management, planning case management
**Framework:** G-Cloud 12, DAS procurement frameworks

##### What They Do
- Back-office case management for councils
- Citizen portal for application submission/tracking (Public Access)
- Integration with planning portals

##### What They DON'T Do
- Public notice publication
- Newspaper submission
- Notice aggregation/discovery

#### Civica

**Market position:** Supplies 89% of UK local authorities
**Products:** Local government software across planning, licensing, housing

##### Same Gap
Council vendors focus on internal workflow, not external notice publication. They handle the application but not the statutory advertising requirement.

##### Competitive Implications
Neither Idox nor Civica compete in the public notice space. They're potential integration partners, not competitors. A notice platform that integrates with council case management systems would have a moat.

---

## Market Gap Analysis

| Capability | The Gazette | Newspapers | Public Notice Portal | Legal Notice Gateway | Civic Notices (Opportunity) |
|------------|-------------|------------|---------------------|---------------------|----------------------------|
| Official notices (insolvency, etc.) | YES | No | Aggregates | YES | No (out of scope) |
| Licensing Act notices | No | YES | Aggregates | YES | **YES** |
| Planning notices | No | Sometimes | Aggregates | No | **Future** |
| Direct submission | YES | Manual | **NO** | YES | **YES** |
| Transparent pricing | Partial | **NO** | N/A | **NO** | **YES** |
| Consumer-friendly UX | No | No | Yes (read) | No | **YES** |
| Council portal | No | No | No | No | **YES** |
| Digital-first publication | YES | Print-first | Read-only | Print-dependent | **YES** |
| Compliance automation | Yes | No | No | Yes | **YES** |
| Location-based discovery | Yes | No | **YES** | No | **YES** |

---

## Pricing Opportunity

Current market pricing is broken:

| Actor | Incentive | Result |
|-------|-----------|--------|
| Newspapers | Maximize per-notice revenue | £125-£400 with no transparency |
| Intermediaries | Commission margin | Add 15-30% on top |
| Councils | Minimize effort | Accept whatever newspapers charge |
| Applicants | No alternatives | Pay inflated prices |

**Opportunity:** Platform that:
1. Aggregates newspaper rates transparently
2. Negotiates bulk rates
3. Passes savings to applicants
4. Eventually replaces newspaper requirement entirely (if regulation changes)

---

## Regulatory Trajectory

### Current State (January 2026)
- Licensing Act 2003 still requires newspaper publication
- Consultation closed November 2025
- Government response pending

### Likely Outcomes

**Scenario A: Status Quo (30% probability)**
- Newspaper lobby prevails
- Requirements unchanged
- Opportunity: efficiency gains within existing system

**Scenario B: Digital Alternative Permitted (50% probability)**
- Government allows digital publication as alternative to newspaper
- Public Notice Portal positioned to expand
- **Opportunity:** First-mover advantage in compliant digital publication

**Scenario C: Newspaper Requirement Abolished (20% probability)**
- Full digitization mandated
- Massive disruption to newspaper revenue
- **Opportunity:** Become the digital infrastructure

### Hedged Strategy
Build platform that:
1. Works within current newspaper requirements (Scenario A)
2. Positions for digital-first approval (Scenario B)
3. Prepares for full digital transition (Scenario C)

---

## Competitive Positioning Recommendations

### Differentiation Opportunities

1. **Transparent pricing** - Show newspaper rates publicly (no one does this)
2. **Consumer UX** - Make notice publication as easy as buying something on Amazon
3. **Council portal** - Offer B2B/B2G solution to councils (Idox/Civica gap)
4. **Compliance automation** - Generate compliant notice text from structured data
5. **Location intelligence** - "Your notice will reach X people in Y postcodes"
6. **Digital-first** - Ready for regulatory change

### Avoid

1. **Competing with The Gazette** - Different statutory domain, Crown monopoly
2. **Aggregation-only** - Public Notice Portal already exists, well-funded
3. **Professional-only focus** - Legal Notice Gateway, Legal Advertisers already serve solicitors

### Target Segments (Priority Order)

1. **Individual applicants** - Underserved, price-sensitive, large volume
2. **Licensing agents** - Repeat customers, will pay for efficiency
3. **Councils** - B2G, longer sales cycle, but defensible moat
4. **Solicitors** - Already served by incumbents, harder to win

---

## Key Metrics to Watch

| Metric | Why It Matters |
|--------|----------------|
| Government response to licensing consultation | Determines regulatory runway |
| Regional newspaper closure rate | Market structure changes |
| Public Notice Portal growth | Validates demand |
| Council digital adoption | Integration opportunities |

---

## Sources

### Official/Government
- [The Gazette - Place Notice](https://www.thegazette.co.uk/place-notice)
- [The Gazette - 2026 Pricing](https://www.thegazette.co.uk/place-notice/pricing)
- [Reforming the Licensing System - GOV.UK Consultation](https://www.gov.uk/government/calls-for-evidence/reforming-the-licensing-system)
- [Planning Portal](https://www.planningportal.co.uk/)

### Industry Bodies
- [Public Notice Portal](https://publicnoticeportal.uk/)
- [News Media Association - Public Notice Portal](https://newsmediauk.org/local-media-works/public-notice-portal/)

### Competitors
- [Legal Notice Gateway](https://legalnoticegateway.com/)
- [Legal Advertisers UK](https://legaladvertisers.co.uk/)
- [LegalAds](https://www.legalads.co.uk/)

### Council Software
- [Idox Licensing Software](https://www.idoxgroup.com/solutions/public-protection/licensing/)
- [Civica Local Government](https://www.civica.com/en-gb/sector-pages/local-government/)

### Market Analysis
- [Press Gazette - Regional Daily ABCs H1 2025](https://pressgazette.co.uk/media-audience-and-business-data/media_metrics/regional-daily-abcs-print-circulation-down-by-average-of-18-in-h1-2025/)
- [House of Commons - Future of Local Media](https://commonslibrary.parliament.uk/research-briefings/cdp-2025-0230/)
- [DCMS Committee - Sustainability of Local Journalism](https://committees.parliament.uk/committee/378/culture-media-and-sport-committee/news/175585/more-support-needed-to-halt-damaging-decline-of-local-journalism-dcms-committee-warns/)

### Licensing Costs
- [Premises Licensing - Milton Keynes](https://premises-licensing.co.uk/premises-licence-in-milton-keynes-costs-requirements-how-to-apply/)
- [Premises Licensing - Hackney](https://premises-licensing.co.uk/premises-licence-in-hackney-costs-requirements-how-to-apply/)
- [Premises Licensing - Stoke](https://premises-licensing.co.uk/premises-licence-in-stoke-costs-requirements-how-to-apply/)
