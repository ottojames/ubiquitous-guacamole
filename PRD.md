# Instance 2: Council Landscape Research

**Focus:** Research UK council structure, directories, lookup methods
**Output:** Populate findings in this PRD, then merge back to main

---

## Tasks

- [x] Research total number of UK councils and council types (County, District, Unitary, Metropolitan, London Borough, Welsh, Scottish). Create a complete table with counts and examples
- [x] Research and document the official UK council directory sources (GOV.UK, LGA, etc.) — find the authoritative list
- [x] Research postcode → council lookup methods (APIs, datasets). Document the best free/cheap method to implement
- [x] Research common council department structures — which departments handle which notice types
- [ ] Research contact email patterns across councils (planning@, licensing@, highways@, etc.)
- [ ] Research submission methods councils accept (email, web forms, portals, post)

---

## Council Landscape Findings

### UK Council Types Overview

**Total UK Local Authorities: 382** (as of 2024)

| Country | Total |
|---------|-------|
| England | 317 |
| Scotland | 32 |
| Wales | 22 |
| Northern Ireland | 11 |

### England Council Types (317 total)

| Type | Count | Examples | Notes |
|------|-------|----------|-------|
| **County Council** | 21 | Surrey, Kent, Essex, Hampshire, Lancashire, Norfolk, Devon, Hertfordshire | Upper-tier authority. Shares area with district councils. Responsible for ~80% of services: education, social care, highways, waste disposal, libraries |
| **District Council** | 164 | Guildford, Maidstone, Chelmsford, Waverley, Reigate & Banstead, Spelthorne | Lower-tier authority within county council areas. Handles: housing, planning applications, council tax collection, waste collection, local licensing |
| **Unitary Authority** | 62 | Bristol, Reading, Slough, Milton Keynes, Swindon, Peterborough, Luton, Bedford | Single-tier: provides ALL local government services. No county/district split. |
| **Metropolitan Borough** | 36 | Birmingham, Manchester, Liverpool, Sheffield, Leeds, Newcastle, Bradford, Wolverhampton | Unitary authorities in 6 metro counties. Joint boards for some services (fire, transport) |
| **London Borough** | 32 | Westminster, Camden, Islington, Hackney, Tower Hamlets, Greenwich, Lambeth, Southwark | Unitary authorities in Greater London. Work alongside GLA/Mayor of London |
| **Sui Generis** | 2 | City of London Corporation, Council of the Isles of Scilly | Unique legal status with special powers |

### Scotland Council Types (32 total)

| Type | Count | Examples | Notes |
|------|-------|----------|-------|
| **Unitary Council** | 32 | Glasgow City, Edinburgh City, Aberdeen City, Highland, Fife, South Lanarkshire, North Lanarkshire, Dundee City | All Scottish councils are unitary since 1996. Single tier handles all local government services. |

**Complete Scotland List:** Aberdeen City, Aberdeenshire, Angus, Argyll & Bute, Clackmannanshire, Dumfries & Galloway, Dundee City, East Ayrshire, East Dunbartonshire, East Lothian, East Renfrewshire, Edinburgh City, Falkirk, Fife, Glasgow City, Highland, Inverclyde, Midlothian, Moray, North Ayrshire, North Lanarkshire, Orkney Islands, Perth & Kinross, Renfrewshire, Scottish Borders, Shetland Islands, South Ayrshire, South Lanarkshire, Stirling, West Dunbartonshire, Western Isles (Comhairle nan Eilean Siar), West Lothian

### Wales Council Types (22 total)

| Type | Count | Examples | Notes |
|------|-------|----------|-------|
| **County Council** | 11 | Powys, Gwynedd, Pembrokeshire, Carmarthenshire, Ceredigion, Monmouthshire, Flintshire, Denbighshire, Isle of Anglesey | Unitary authorities with county status (typically more rural areas) |
| **County Borough** | 11 | Cardiff, Swansea, Newport, Wrexham, Bridgend, Caerphilly, Merthyr Tydfil, Neath Port Talbot, Rhondda Cynon Taf, Blaenau Gwent, Torfaen | Unitary authorities with county borough status (large population centres) |

**All 22 Welsh councils are unitary** - established 1996 by Local Government (Wales) Act 1994, replacing previous 8 counties + 37 districts.

### Two-Tier vs Single-Tier Explained

**Two-Tier Areas (County + Districts):**
- County council handles: Education, social services, highways, strategic planning, libraries, waste disposal
- District council handles: Housing, planning applications, council tax collection, local licensing, waste collection
- Public notices may go to EITHER tier depending on notice type (e.g., planning → district, highways → county)

**Single-Tier/Unitary Areas:**
- One council handles ALL services
- Public notices always go to the same council regardless of type

### The 6 Metropolitan Counties

These no longer have county councils (abolished 1986) but still exist as geographic areas:
1. **Greater Manchester** (10 boroughs): Manchester, Salford, Bolton, Bury, Oldham, Rochdale, Stockport, Tameside, Trafford, Wigan
2. **West Midlands** (7 boroughs): Birmingham, Coventry, Dudley, Sandwell, Solihull, Walsall, Wolverhampton
3. **West Yorkshire** (5 boroughs): Leeds, Bradford, Calderdale, Kirklees, Wakefield
4. **South Yorkshire** (4 boroughs): Sheffield, Barnsley, Doncaster, Rotherham
5. **Merseyside** (5 boroughs): Liverpool, Sefton, Knowsley, St Helens, Wirral
6. **Tyne & Wear** (5 boroughs): Newcastle, Gateshead, North Tyneside, South Tyneside, Sunderland

### Upcoming Changes (2025-2028)

**English Devolution White Paper (Dec 2024):**
- Government plans to abolish ALL two-tier areas in England
- Will create new unitary authorities with minimum 500,000 population
- Deadline for council proposals: November 2025
- New arrangements in place: 2027-28

**Surrey Example (confirmed Oct 2025):**
- Surrey County Council + 11 districts → 2 new unitaries (West Surrey, East Surrey)
- Operational: 1 April 2027

This means the current structure of 21 county councils + 164 districts will be replaced by ~50-60 larger unitaries.

### Sources
- [House of Commons Library - Local government in England: structures](https://commonslibrary.parliament.uk/research-briefings/sn07104/)
- [GOV.UK - Local government structure and elections](https://www.gov.uk/guidance/local-government-structure-and-elections)
- [Wikipedia - Local government in England](https://en.wikipedia.org/wiki/Local_government_in_England)
- [Wikipedia - Local government in Scotland](https://en.wikipedia.org/wiki/Local_government_in_Scotland)
- [Wikipedia - Principal areas of Wales](https://en.wikipedia.org/wiki/Principal_areas_of_Wales)
- [LGiU - Local government facts and figures: England](https://lgiu.org/local-government-facts-and-figures-england/)

### Directory Sources

**Authoritative UK Council Directory Sources:**

#### 1. Official Government Sources (Recommended for Production)

| Source | URL | Data Format | Coverage | Update Frequency | Notes |
|--------|-----|-------------|----------|------------------|-------|
| **ONS Geoportal** | [geoportal.statistics.gov.uk](https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-april-2025-names-and-codes-in-the-uk/about) | CSV, GeoJSON, API | All UK | Annual (April) | **Primary source for GSS codes**. Official statistical geography. Current: April 2025 dataset |
| **data.gov.uk** | [data.gov.uk LAD dataset](https://www.data.gov.uk/dataset/b2c91962-58e7-40f1-ad56-7aa2473a93fd/local-authority-districts-april-2025-names-and-codes-in-the-uk-v21) | CSV, JSON | All UK | Annual | Mirror of ONS data with API access |
| **GOV.UK Find Local Council** | [gov.uk/find-local-council](https://www.gov.uk/find-local-council) | Web/API | All UK | Real-time | User-facing service. Has undocumented API. Not versioned, may change |
| **Planning Data** | [planning.data.gov.uk](https://www.planning.data.gov.uk/dataset/local-authority-district) | CSV, JSON, GeoJSON | England | Ongoing | Focus on planning authorities. Experimental API available |
| **MHCLG Open Data** | [opendatacommunities.org](https://opendatacommunities.org/data/local-authorities) | CSV, API | England | Varies | **Warning: Shutting down March 2025** - only EPC and IMD tools will remain |

#### 2. Membership Bodies (Good for Contact Info)

| Source | URL | Coverage | Notes |
|--------|-----|----------|-------|
| **LGA (Local Government Association)** | [local.gov.uk](https://www.local.gov.uk/our-support/guidance-and-resources/communications-support/digital-councils/social-media/go-further/a-z-councils-online) | England + Wales (339 councils) | A-Z councils online. Cross-party membership body. Good for policy/contact |
| **COSLA** | [cosla.gov.uk/councils](https://www.cosla.gov.uk/councils) | Scotland (32 councils) | All 32 Scottish councils are members. Convention of Scottish Local Authorities |
| **WLGA** | [wlga.gov.uk/welsh-local-authority-links](https://www.wlga.gov.uk/welsh-local-authority-links) | Wales (22 councils) | Welsh Local Government Association. Links to all Welsh council websites |
| **NILGA** | [nilga.org/about/councils-in-northern-ireland](https://www.nilga.org/about/councils-in-northern-ireland) | Northern Ireland (11 councils) | Northern Ireland Local Government Association |

#### 3. Community-Maintained Datasets (Best for Development)

| Source | URL | Data Format | Notes |
|--------|-----|-------------|-------|
| **mySociety UK LA Names & Codes** | [github.com/mysociety/uk_local_authority_names_and_codes](https://github.com/mysociety/uk_local_authority_names_and_codes) | CSV, SQLite | **Highly recommended**. Maps between GSS codes, names, official register codes. Includes historical and future councils. Regular updates |
| **mySociety Download Page** | [pages.mysociety.org/uk_local_authority_names_and_codes](https://pages.mysociety.org/uk_local_authority_names_and_codes/) | Multiple | Versioned datapackages. Includes lookup tables between coding schemes |
| **MapIt** | [mapit.mysociety.org](https://mapit.mysociety.org/) | API (JSON) | Postcode → council lookup. Used by GOV.UK. Rate-limited for free tier |

#### 4. Government Registers & APIs

| Source | URL | Notes |
|--------|-----|-------|
| **GOV.UK Local Authorities API** | [docs.publishing.service.gov.uk](https://docs.publishing.service.gov.uk/repos/frontend/local-authorities-api.html) | Postcode lookup → council. Returns smallest authority (district in two-tier). Not versioned, may change |
| **GOV.UK Local Links Manager** | [docs.publishing.service.gov.uk](https://docs.publishing.service.gov.uk/repos/local-links-manager/example-api-output.html) | Returns council details + county council for two-tier areas |
| **ONS Names & Codes API** | [ons.gov.uk](https://www.ons.gov.uk/methodology/geography/geographicalproducts/namescodesandlookups/namesandcodeslistings) | Official administrative geography codes |

#### Recommended Approach for Civic Notices

**For Council Master Data:**
1. Use **ONS Geoportal April 2025** dataset as canonical source for council names and GSS codes
2. Supplement with **mySociety dataset** for name variations and historical mappings
3. Store locally, update annually when ONS publishes new version

**For Postcode Lookup:**
- See next section (Postcode Lookup Method)

**For Contact Information:**
- LGA/COSLA/WLGA/NILGA websites for official council URLs
- Individual council websites for department contacts (no authoritative central source exists)

#### Code Format Notes

**GSS Code Format:** `E0NNNNNNN` (9 characters)
- E06 = Unitary Authority
- E07 = District
- E08 = Metropolitan Borough
- E09 = London Borough
- E10 = County Council
- S12 = Scottish Council
- W06 = Welsh Unitary
- N09 = NI District

**Old ONS Code Format:** `ANNNNNNNN` (deprecated but still referenced in some datasets)

### Postcode Lookup Method

**Recommended: Postcodes.io** (Free, no auth, comprehensive data)

#### Option Comparison Table

| Service | Cost | Auth | Rate Limit | Two-Tier Handling | Data Source | Recommendation |
|---------|------|------|------------|-------------------|-------------|----------------|
| **Postcodes.io** | Free | None | Unlimited (fair use) | Returns district only, `admin_county` field available | ONS NSPL quarterly | **Best for production** |
| **GOV.UK Local Authorities API** | Free | None | Rate limited | Returns district with parent county in response | OS Places API | Undocumented, may change |
| **MapIt** | £22/mo (free for low-volume non-profit) | API key | Tiered by plan | Returns `council.county` and `council.district` | ONS + Ordnance Survey | Good if budget allows |
| **ONS NSPL Dataset** | Free download | N/A | N/A (local) | LAD codes only | Quarterly releases | Best for offline/batch |

#### Postcodes.io API (Recommended)

**Why Postcodes.io?**
- Completely free, no API key required
- No explicit rate limits (fair use)
- Returns comprehensive local authority data including GSS codes
- Open source (can self-host if needed)
- Backed by ONS National Statistics Postcode Lookup data
- Updated quarterly

**Endpoint:** `GET https://api.postcodes.io/postcodes/{postcode}`

**Key Fields Returned:**
```json
{
  "admin_district": "Westminster",        // District/Unitary name
  "admin_county": null,                   // County name (null for unitaries)
  "codes": {
    "admin_district": "E09000033",        // GSS code for district
    "admin_county": "E99999999"           // GSS code for county
  }
}
```

**Two-Tier Area Handling:**
- `admin_district` always returns the lowest tier (district in two-tier, unitary otherwise)
- `admin_county` returns county name in two-tier areas, null otherwise
- Need to check BOTH fields to route notices correctly in two-tier areas

**Example Responses:**

*Unitary (Westminster):*
```json
{
  "admin_district": "Westminster",
  "admin_county": null
}
```

*Two-tier (Guildford in Surrey):*
```json
{
  "admin_district": "Guildford",
  "admin_county": "Surrey"
}
```

**Limitation:** ~1.2% of UK addresses (387,000) are in a different local authority than their postcode's centroid. This is unavoidable with postcode-only lookup - the same limitation applies to all services.

#### Alternative: GOV.UK Local Authorities API

**Endpoint:** `GET https://www.gov.uk/api/local-authority?postcode={postcode}`

**Pros:**
- Same source GOV.UK uses for their own lookup
- Returns URL slug for council (useful for deep linking)
- Explicitly handles two-tier with parent county in response

**Cons:**
- Undocumented, unversioned - "may change without notice"
- Rate limited (limits not published)
- Not intended for third-party production use

**Response Format:**
```json
{
  "local_authorities": [{
    "name": "Guildford Borough Council",
    "slug": "guildford",
    "tier": "district",
    "homepage_url": "https://www.guildford.gov.uk",
    "parent": {
      "name": "Surrey County Council",
      "slug": "surrey",
      "tier": "county"
    }
  }]
}
```

#### Alternative: ONS NSPL Dataset (Offline/Batch)

**Download:** [ONS Geoportal - NSPL May 2025](https://geoportal.statistics.gov.uk/datasets/077631e063eb4e1ab43575d01381ec33)

**Pros:**
- Complete UK coverage (2.7M+ postcodes)
- No API dependency
- Includes historical/terminated postcodes
- Released quarterly (Feb, May, Aug, Nov)

**Cons:**
- Large file (~300MB CSV)
- Requires local storage/database
- Manual updates required
- Only returns LAD code, need separate lookup for names

**Key Fields:**
- `pcd`: Postcode (7-char format)
- `pcd2`: Postcode (8-char format with space)
- `lad25cd`: Local Authority District GSS code (e.g., E09000033)
- Requires separate LAD names/codes file to map code → name

#### Implementation Recommendation for Civic Notices

**Phase 1 (MVP):** Use Postcodes.io
```typescript
async function getCouncilFromPostcode(postcode: string) {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
  const data = await res.json();

  if (data.status !== 200) throw new Error('Invalid postcode');

  return {
    district: data.result.admin_district,
    county: data.result.admin_county,  // null for unitaries
    districtCode: data.result.codes.admin_district,
    countyCode: data.result.codes.admin_county,
  };
}

// For notice routing:
// - If county is null → unitary authority, use district
// - If county exists → two-tier area, may need both depending on notice type
```

**Phase 2 (Scale):** Self-host NSPL
- Download quarterly NSPL dataset
- Import into Supabase/PostgreSQL
- Create postcode → LAD lookup table
- Eliminates external API dependency
- Enables bulk operations without rate limit concerns

#### Sources

- [Postcodes.io Documentation](https://postcodes.io/docs/overview/)
- [Postcodes.io GitHub](https://github.com/ideal-postcodes/postcodes.io)
- [GOV.UK Local Authorities API](https://docs.publishing.service.gov.uk/repos/frontend/local-authorities-api.html)
- [MapIt by mySociety](https://mapit.mysociety.org/)
- [MapIt Pricing](https://mapit.mysociety.org/pricing/)
- [ONS NSPL May 2025](https://geoportal.statistics.gov.uk/datasets/077631e063eb4e1ab43575d01381ec33)
- [ONS Postcode Products](https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodeproducts)
- [Digital Land - Finding LA for Address](https://digital-land.github.io/local-authority-addresses/)

### Department Patterns

#### Overview: Council Organisational Structure

UK councils typically organize their senior management around key directorate headings:

| Directorate | Typical Services Included |
|-------------|---------------------------|
| **Place** | Planning, Regeneration, Highways, Environment, Building Control |
| **Communities** | Housing, Community Safety, Customer Access, Licensing |
| **Resources** | Finance, HR, IT, Legal Services, Democratic Services |
| **People** | Adults Social Care, Children's Services, Education |

Within these directorates, specific departments handle public notice requirements.

#### Departments That Issue Public Notices

**1. Licensing Department** (District/Unitary level)
- **Location**: Usually within "Communities" or "Regulatory Services" directorate
- **Statutory Basis**: Licensing Act 2003, Gambling Act 2005
- **Notice Types**:
  - Premises licence applications (new, variation, review)
  - Gambling premises licences
  - Personal licence applications
  - Temporary event notices
  - Street trading licences
  - Sex establishment licences
  - Taxi/private hire vehicle licences
- **Notice Period**: 28 consecutive days for premises licences
- **Publication**: Local newspaper + site notice required

**2. Planning Department** (District/Unitary level)
- **Location**: Usually within "Place" directorate
- **Sub-teams**: Development Management, Planning Policy, Planning Enforcement
- **Statutory Basis**: Town and Country Planning Act 1990, DMPO 2015
- **Notice Types**:
  - Planning application notices (major/minor applications)
  - Listed building consent
  - Conservation area notices
  - Advertisement consent
  - Tree preservation orders (TPOs)
  - Environmental Impact Assessments
  - Local Plan consultations
- **Notice Period**: Minimum 21 days
- **Publication**: Site notice + newspaper (for major applications)

**3. Highways Department** (County level in two-tier, Unitary otherwise)
- **Location**: Usually within "Place" or standalone "Highways & Transport" directorate
- **Statutory Basis**: Road Traffic Regulation Act 1984
- **Notice Types**:
  - Traffic Regulation Orders (TROs) - permanent, temporary, experimental
  - Road closures (temporary and permanent)
  - Parking restrictions
  - Speed limit changes
  - Bus lanes
  - Cycle lanes
  - Street works notices
- **Notice Period**: 21 days consultation period
- **Publication**: Local newspaper + site notices on affected roads

**4. Environmental Health Department** (District/Unitary level)
- **Location**: Usually within "Regulatory Services" or "Environmental Services" directorate
- **Statutory Basis**: Environmental Protection Act 1990 Part 2A
- **Notice Types**:
  - Contaminated land remediation notices
  - Statutory nuisance abatement notices
  - Air quality management area declarations
  - Food safety emergency prohibition notices
- **Notice Period**: Varies (21 days typical for appeals)
- **Publication**: Public register maintained, individual notices served

**5. Building Control Department** (District/Unitary level)
- **Location**: Usually combined with Planning within "Place" directorate
- **Statutory Basis**: Building Act 1984, Building Regulations 2010, Building Safety Act 2022
- **Notice Types**:
  - Demolition notices (to adjacent property owners)
  - Dangerous structure notices
  - Building regulation compliance notices
  - Initial/final notices (Approved Inspectors)
- **Notice Period**: Varies by notice type
- **Publication**: Usually direct service, not newspaper

**6. Electoral Services Department** (All council tiers)
- **Location**: Usually within "Resources" or "Democratic Services" directorate
- **Statutory Basis**: Representation of the People Act 1983
- **Notice Types**:
  - Electoral register publication
  - Election notices (polling stations, candidates)
  - Boundary review consultations
- **Publication**: Council offices + website

**7. Legal/Democratic Services** (All council tiers)
- **Notice Types**:
  - Public Path Orders (footpath diversions/closures)
  - Compulsory Purchase Orders
  - Council meeting notices
  - Public consultations
  - PSPO (Public Spaces Protection Orders)
- **Publication**: Varies by order type

#### Two-Tier Area Responsibility Split

In two-tier areas (County + District), public notice responsibilities are divided:

| Notice Type | Responsible Authority |
|-------------|----------------------|
| Licensing (alcohol, gambling) | **District Council** |
| Planning (general applications) | **District Council** |
| Planning (minerals & waste) | **County Council** |
| Highways (TROs, road closures) | **County Council** |
| Environmental Health | **District Council** |
| Building Control | **District Council** |
| Education notices | **County Council** |
| Social care notices | **County Council** |
| Waste disposal | **County Council** |
| Waste collection | **District Council** |

**Critical for Notice Routing:**
- Postcode lookup returns `admin_district` (e.g., "Guildford")
- Must also check `admin_county` (e.g., "Surrey") for highways/education
- If `admin_county` is null → unitary authority, all notices go to same council
- If `admin_county` exists → route licensing/planning to district, highways to county

#### Common Department Name Variations

The same function may have different names across councils:

| Function | Common Names |
|----------|--------------|
| Licensing | Licensing, Licensing & Regulatory Services, Environmental Health & Licensing, Public Protection |
| Planning | Planning, Development Management, Development Control, Planning & Building Control |
| Highways | Highways, Highways & Transportation, Roads & Transport, Traffic & Transportation |
| Environmental Health | Environmental Health, Environmental Services, Public Protection, Regulatory Services |
| Building Control | Building Control, Building Standards (Scotland), Building Regulations |

#### Shared Services

Some councils share regulatory services across multiple authorities:
- **Worcestershire Regulatory Services**: Covers licensing and environmental health for all 6 Worcestershire districts
- **Staffordshire Regulatory Services Partnership**: Shared between multiple boroughs
- These shared services still issue notices on behalf of individual constituent councils

#### Digital Transformation

Modern councils increasingly use:
- Online consultation portals (e.g., Planning Portal integrations)
- Public notice portals (publicnoticeportal.uk)
- Email notification services for registered interests
- Interactive maps for TRO consultations

However, statutory requirements for newspaper publication remain for most notice types.

#### Sources

- [House of Commons Library - Traffic Regulation Orders](https://commonslibrary.parliament.uk/research-briefings/sn06013/)
- [GOV.UK - Statutory nuisances: how councils deal with complaints](https://www.gov.uk/guidance/statutory-nuisances-how-councils-deal-with-complaints)
- [GOV.UK - Alcohol licensing](https://www.gov.uk/guidance/alcohol-licensing)
- [Wikipedia - Local planning authority](https://en.wikipedia.org/wiki/Local_planning_authority)
- [Wikipedia - Development management in the UK](https://en.wikipedia.org/wiki/Development_management_in_the_United_Kingdom)
- [Wikipedia - Local government in England](https://en.wikipedia.org/wiki/Local_government_in_England)
- [LGA - Local Government Structure Overview](https://www.local.gov.uk/sites/default/files/documents/local-government-structur-634.pdf)
- [Edinburgh Council - How we are organised](https://www.edinburgh.gov.uk/work-us/organised)
- [South Lanarkshire - Planning and Regulatory Services](https://www.southlanarkshire.gov.uk/info/200171/council_departments/589/community_and_enterprise_resources/3)
- [Dudley Council - Public notices](https://www.dudley.gov.uk/council-community/public-notices/)

### Contact Patterns
*Document findings:*

### Submission Methods
*Document findings:*

