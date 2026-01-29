# Instance 2: Council Landscape Research

**Focus:** Research UK council structure, directories, lookup methods
**Output:** Populate findings in this PRD, then merge back to main

---

## Tasks

- [x] Research total number of UK councils and council types (County, District, Unitary, Metropolitan, London Borough, Welsh, Scottish). Create a complete table with counts and examples
- [x] Research and document the official UK council directory sources (GOV.UK, LGA, etc.) — find the authoritative list
- [x] Research postcode → council lookup methods (APIs, datasets). Document the best free/cheap method to implement
- [x] Research common council department structures — which departments handle which notice types
- [x] Research contact email patterns across councils (planning@, licensing@, highways@, etc.)
- [x] Research submission methods councils accept (email, web forms, portals, post)

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

### Contact Email Patterns

#### Overview

UK councils follow predictable email patterns based on department function and domain naming. This research documents the common patterns to enable programmatic email generation for notice submission.

#### Domain Name Patterns

**Principal Authorities (Counties, Districts, Unitaries, Metro Boroughs):**

| Country | Domain Pattern | Examples |
|---------|---------------|----------|
| England | `@[councilname].gov.uk` | @westminster.gov.uk, @surrey.gov.uk, @birmingham.gov.uk |
| Scotland | `@[councilname].gov.uk` | @glasgow.gov.uk, @edinburgh.gov.uk, @aberdeencity.gov.uk |
| Wales | `@[councilname].gov.uk` | @cardiff.gov.uk, @swansea.gov.uk, @ceredigion.gov.uk |
| Northern Ireland | `@[councilname].gov.uk` | @belfastcity.gov.uk, @derrystrabane.com |

**Parish/Town Councils:**
- Must use `-pc` or `-tc` suffix: `@yourtown-tc.gov.uk`, `@yourparish-pc.gov.uk`
- Role-based emails required: `clerk@yourparishcouncil.gov.uk`

**Note:** Some councils use legacy domains (e.g., @derrystrabane.com) but .gov.uk is now best practice as of March 2025.

#### Department Email Patterns by Function

**1. Licensing Department**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `licensing@` | **Most common** | licensing@cambridge.gov.uk, licensing@birmingham.gov.uk, licensing@royalgreenwich.gov.uk |
| `licensing.team@` | Less common | licensing.team@[council].gov.uk |
| Combined service | Shared services | FSS_AR@lambeth.gov.uk (specific functions) |

**Verified Examples:**
- Birmingham: licensing@birmingham.gov.uk
- Royal Borough of Greenwich: licensing@royalgreenwich.gov.uk
- Cambridge: licensing@cambridge.gov.uk
- Lambeth: licensing.team@lambeth.gov.uk

**2. Planning Department**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `planning@` | **Most common** | planning@cheshireeast.gov.uk, planning@carmarthenshire.gov.uk |
| `planning.registration@` | For applications | planning.registration@birmingham.gov.uk |
| `planningappeals@` | For appeals | planningappeals@westnorthants.gov.uk |
| `development.control@` | Alternative name | development.control@[council].gov.uk |
| `cynllun.plan@` | Welsh bilingual | cynllun.plan@conwy.gov.uk |

**Verified Examples:**
- Birmingham: planning.registration@birmingham.gov.uk
- Cheshire East: planning@cheshireeast.gov.uk
- Glasgow: onlineplanning@glasgow.gov.uk
- Edinburgh: planningandbuildingstandards.support@edinburgh.gov.uk
- Conwy (Welsh): cynllun.plan@conwy.gov.uk

**3. Highways Department**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `highways@` | **Most common** | Highways@bathnes.gov.uk |
| `streetworks@` | For road works | streetworks@[council].gov.uk |
| `temporary.road.closures@` | For TROs | temporary.road.closures@hants.gov.uk |
| `trafficorders@` | For TROs | trafficorders@[council].gov.uk |
| `parking@` | Parking-specific | parking@bristol.gov.uk, parking@n-somerset.gov.uk |

**Verified Examples:**
- Bath & NE Somerset: Highways@bathnes.gov.uk
- Hampshire: temporary.road.closures@hants.gov.uk
- Bristol: parking@bristol.gov.uk

**4. Environmental Health Department**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `envhealth@` | Common short form | envhealth@huntingdonshire.gov.uk, envhealth@argyll-bute.gov.uk |
| `environmentalhealth@` | Full form | environmentalhealth@cannockchasedc.gov.uk |
| `environmental.health@` | With period | environmental.health@[council].gov.uk |
| `foodsafety@` | Food-specific | foodsafety@[council].gov.uk |

**Verified Examples:**
- Huntingdonshire: envhealth@huntingdonshire.gov.uk
- Argyll & Bute: envhealth@argyll-bute.gov.uk
- Cannock Chase: environmentalhealth@cannockchasedc.gov.uk

**5. Building Control Department**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `buildingcontrol@` | **Most common** | buildingcontrol@lambeth.gov.uk, buildingcontrol@hackney.gov.uk |
| `building.control@` | With period | building.control@manchester.gov.uk, building.control@kirklees.gov.uk |
| `building.standards@` | Scotland | building.standards@glasgow.gov.uk |

**Verified Examples:**
- Lambeth: buildingcontrol@lambeth.gov.uk
- Hackney: buildingcontrol@hackney.gov.uk
- Manchester: building.control@manchester.gov.uk
- Kirklees: building.control@kirklees.gov.uk
- Glasgow: building.standards@glasgow.gov.uk

**6. Electoral Services**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `electoralservices@` | **Most common** | electoralservices@westminster.gov.uk, electoralservices@hillingdon.gov.uk |
| `elections@` | Shorter form | elections@shropshire.gov.uk |
| `electoral.services@` | With period | electoral.services@[council].gov.uk |

**Verified Examples:**
- Westminster: electoralservices@westminster.gov.uk
- Hillingdon: electoralservices@hillingdon.gov.uk
- Shropshire: elections@shropshire.gov.uk

**7. Democratic/Legal Services**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `democracy@` | Committee services | democracy@shropshire.gov.uk |
| `democratic.services@` | Full form | democratic.services@huntingdonshire.gov.uk |
| `legal.services@` | Legal team | Legal.services@brighton-hove.gov.uk |
| `committee@` | Committee support | committee@[council].gov.uk |

**Verified Examples:**
- Shropshire: democracy@shropshire.gov.uk
- Huntingdonshire: democratic.services@huntingdonshire.gov.uk
- Brighton & Hove: Legal.services@brighton-hove.gov.uk

**8. General/Customer Services**

| Pattern | Prevalence | Examples |
|---------|-----------|----------|
| `customerservices@` | **Most common** | customerservices@wiltshire.gov.uk, customerservices@bedford.gov.uk |
| `customer.services@` | With period | customer.services@nwleicestershire.gov.uk, customer.services@suffolk.gov.uk |
| `enquiries@` | General enquiries | enquiries@[council].gov.uk |

**Verified Examples:**
- Wiltshire: customerservices@wiltshire.gov.uk
- Bedford: customerservices@bedford.gov.uk
- Suffolk: customer.services@suffolk.gov.uk
- Bristol: customer.services@bristol.gov.uk
- Dundee: customerservices@dundeecity.gov.uk

#### Email Pattern Summary Table

| Department | Primary Pattern | Alternative Patterns |
|------------|----------------|---------------------|
| Licensing | `licensing@` | `licensing.team@` |
| Planning | `planning@` | `planning.registration@`, `planningappeals@`, `cynllun.plan@` (Wales) |
| Highways | `highways@` | `streetworks@`, `trafficorders@`, `temporary.road.closures@` |
| Environmental Health | `envhealth@` | `environmentalhealth@`, `environmental.health@` |
| Building Control | `buildingcontrol@` | `building.control@`, `building.standards@` (Scotland) |
| Electoral | `electoralservices@` | `elections@` |
| Democratic | `democratic.services@` | `democracy@`, `committee@` |
| Customer Services | `customerservices@` | `customer.services@`, `enquiries@` |

#### Implementation Recommendations for Civic Notices

**Pattern Matching Strategy:**

1. **Primary email construction**: `[department]@[council_domain].gov.uk`
   - Start with most common pattern for each department type

2. **Fallback patterns**: Try variations with/without periods:
   - `licensing@` → `licensing.team@`
   - `buildingcontrol@` → `building.control@`

3. **Country-specific handling**:
   - Scotland: Building control uses `building.standards@`
   - Wales: Consider bilingual patterns (e.g., `cynllun.plan@`)

4. **Verification approach**:
   - Store verified emails in database with last_verified timestamp
   - Fall back to `customerservices@` or generic contact when unsure
   - Link to council website contact page as ultimate fallback

**Data Model Suggestion:**

```typescript
interface CouncilContact {
  council_id: string;          // GSS code
  department: DepartmentType;
  email: string;
  verified_at: Date | null;
  source: 'manual' | 'scraped' | 'generated';
  fallback_url: string;        // Council contact page URL
}

type DepartmentType =
  | 'licensing'
  | 'planning'
  | 'highways'
  | 'environmental_health'
  | 'building_control'
  | 'electoral'
  | 'democratic'
  | 'customer_services';
```

#### Limitations

1. **No central directory**: No authoritative central source for council department emails exists
2. **Frequent changes**: Staff turnover means specific contact emails change regularly
3. **Shared services**: Some regions share services across multiple councils
4. **Naming variations**: Same function has different department names across councils
5. **Welsh bilingual**: Welsh councils may accept both English and Welsh prefixes

#### Sources

- [Birmingham Licensing Contact](https://www.birmingham.gov.uk/info/20081/licensing/213/contact_the_licensing_team)
- [Royal Borough of Greenwich Licensing](https://www.royalgreenwich.gov.uk/info/200160/contact_us/2003/contact_licensing)
- [Lambeth Building Control](https://www.lambeth.gov.uk/about-council/contact-us/contact-details/building-control)
- [Manchester Building Control](https://www.manchester.gov.uk/info/200011/building_control/1838/contact_building_control)
- [Westminster Electoral Services](https://www.westminster.gov.uk/about-council/democracy/elections-referendums-and-how-vote/register-vote/contact-electoral-services)
- [Huntingdonshire Environmental Health](https://www.huntingdonshire.gov.uk/environmental-issues/contact-us-environmental-health/)
- [Shropshire Legal & Democratic Services](https://next.shropshire.gov.uk/legal-and-democratic-services/about-us/)
- [GOV.UK List of .gov.uk domain names](https://www.gov.uk/government/publications/list-of-gov-uk-domain-names)
- [Scottish Council Building Standards](https://www.gov.scot/publications/building-standards-contact-information/)
- [Welsh Local Planning Authorities](https://www.gov.wales/find-your-local-planning-authority)

### Submission Methods

#### Overview

UK councils accept public notice submissions and related applications through multiple channels. The preferred method varies by council and notice type, but all statutory notices must ultimately be published through approved channels (typically local newspapers and site notices).

#### Submission Channels by Type

**1. Online Portals & Web Forms**

| Platform | Description | Coverage |
|----------|-------------|----------|
| **Planning Portal** | National online planning application system. Preferred by most councils. | England & Wales |
| **GOV.UK Forms** | For licensing applications (alcohol, gambling, personal licences) | UK-wide |
| **Council Self-Service Portals** | MyCouncil, Citizen Access platforms (Granicus/govService, Abavus) | Individual councils |
| **Scottish Government ePlanning** | Planning applications for Scotland | Scotland |

**Key Features of Online Submission:**
- Instant validation of required fields and documents
- Automatic routing to correct department
- Payment integration (GOV.UK Pay, Capita, Civica)
- Application tracking and status updates
- Receipt confirmation within minutes

**2. Email Submission**

Many councils accept applications and notices via email, particularly for:
- Licensing applications with supporting documents
- TRO objections and comments
- Building control notifications
- Environmental health complaints

**Common Patterns:**
- `licensing@[council].gov.uk` - Licensing applications
- `planning@[council].gov.uk` - Planning applications (some councils)
- `trafficorders@[council].gov.uk` - TRO consultations
- `buildingcontrol@[council].gov.uk` - Building notices

**Requirements for Email Submission:**
- PDF format for application forms
- Maximum attachment size limits (typically 10-25MB)
- May require follow-up phone payment
- Longer processing times than online

**3. Postal/Paper Submission**

Still accepted by all councils but increasingly discouraged:
- Planning applications: 2 copies of forms, plans, and documents required
- Processing delays compared to online (up to 5 additional working days)
- **Additional fees from 2025**: Some councils charge administrative surcharges for paper applications
  - Lambeth: Administration charge from 4 August 2025
  - Derby: Administration costs from 1 September 2025

**Requirements:**
- Do not bind or use plastic covers (councils scan documents)
- Include correct fee payment (cheque or reference for bank transfer)
- Send to correct departmental address

**4. In-Person Submission**

Declining in availability but still offered:
- Council reception/Customer Services
- Appointment-based for complex applications
- Cash/card payment on site
- Limited hours (typically 9am-5pm weekdays)

#### Submission Methods by Notice Type

| Notice Type | Online | Email | Post | In-Person | Notes |
|-------------|--------|-------|------|-----------|-------|
| **Premises Licence (Alcohol)** | ✅ GOV.UK | ✅ | ✅ | Limited | Also requires newspaper + site notice |
| **Gambling Premises** | ❌ Often not | ✅ | ✅ | ❌ | Complex documentation required |
| **Planning Application** | ✅ Portal | ✅ Some | ✅ | Limited | Online strongly preferred |
| **Listed Building Consent** | ✅ Portal | ✅ | ✅ | ❌ | Consultation required |
| **TRO Objections** | ✅ Some | ✅ | ✅ | ❌ | 21-day objection period |
| **Building Notice** | ✅ Some | ✅ | ✅ | ✅ | Building Control |
| **Environmental Health** | ✅ Forms | ✅ | ✅ | ✅ | Complaint-based |

#### Council Digital Maturity Spectrum

**Fully Digital-First (Electronic Only):**
- Edinburgh Council: "We only accept electronic licence application forms and payments submitted using our electronic submission form. We do not accept paper application forms."
- Requires scanning apps (Microsoft Lens, Adobe Scan) for document conversion

**Digital Preferred (Paper with Surcharge):**
- Lambeth, Derby: Accept paper but charge additional admin fees from 2025
- Online processing prioritised

**Multi-Channel (Equal Treatment):**
- Three Rivers: "It doesn't matter which delivery method you choose."
- Oxford: Email, post, or Public Access Register equally accepted

**Limited Digital:**
- Some rural councils with restricted online services
- May require specific forms downloaded and printed

#### Platform Landscape

**National Platforms:**
- **Planning Portal** (planningportal.co.uk): Operated by PortalPlanQuest for England & Wales
- **GOV.UK Forms**: Licensing Act 2003 applications, personal licences
- **The Gazette** (thegazette.co.uk): Statutory notices requiring Gazette publication

**Council Platform Providers:**
- **Granicus/govService** (formerly Firmstep): ~1/3 of UK councils
- **Abavus My Council Services**: Growing market share
- **Capita/Civica**: Legacy payment and form integrations
- **Idox**: Planning and regulatory services

**Integration Standards:**
- **GOV.UK Pay**: Free payment platform for councils, PCI DSS compliant
- **GOV.UK Notify**: Text and email notification service
- **GOV.UK One Login**: Single sign-on (expanding to councils 2025-2027)

#### The Public Notice Publication Flow

**Important Distinction:** There are two separate workflows:

1. **Application Submission** (to council):
   - Online portal, email, or post
   - Goes to council licensing/planning team
   - Starts internal processing

2. **Notice Publication** (statutory requirement):
   - **Newspaper publication**: Local newspaper, within 10 working days of application
   - **Site notice**: Displayed at premises/site for 21-28 days
   - **Online aggregation**: Public Notice Portal (publicnoticeportal.uk) aggregates from newspapers

**Public Notice Portal:**
- Does NOT accept direct submissions from councils or businesses
- Aggregates notices from local news publishers only
- Nearly 900 local/regional news titles
- Searchable archive with email alerts
- Funded by Google News Initiative

#### Recommendations for Civic Notices Platform

**Phase 1: Focus on High-Volume Channels**
1. Email submission (to council licensing@/planning@ addresses)
2. Integration with Planning Portal (via their API if available)
3. Direct submission to GOV.UK Forms endpoints

**Phase 2: Notice Publication**
1. Partner with local newspaper groups for publication
2. Consider bulk newspaper booking service
3. Site notice template generation (PDF/print)

**Phase 3: Council Integration**
1. Granicus/govService API integration for participating councils
2. White-label submission portal for council adoption
3. GOV.UK Pay integration for payments

#### Key Findings

1. **No single national submission portal exists** - each council has its own systems
2. **Online is strongly preferred** but not universally required
3. **Paper surcharges are emerging** - councils pushing digital adoption through pricing
4. **Email remains a universal fallback** - all councils accept email for most submissions
5. **Statutory newspaper publication is still required** - despite digital transformation, most public notices legally require newspaper publication
6. **TRO reform pending** - Government plans to digitalise TRO publication requirements

#### Sources

- [Planning Portal - Paper Forms](https://www.planningportal.co.uk/planning/planning-applications/paper-forms/)
- [GOV.UK - Alcohol Licensing](https://www.gov.uk/guidance/alcohol-licensing)
- [GOV.UK - Building Regulations Approval](https://www.gov.uk/building-regulations-approval/how-to-apply)
- [Edinburgh Council - Licences and Permits](https://www.edinburgh.gov.uk/licences-permits/licences-permits-applications)
- [Hackney Council - Premises Licence](https://hackney.gov.uk/premises-licence/)
- [Lambeth Council - Planning Applications](https://www.lambeth.gov.uk/planning-building-control/planning-applications/submit-or-pay-planning-application)
- [Public Notice Portal](https://publicnoticeportal.uk/)
- [News Media Association - Public Notice Portal Launch](https://newsmediauk.org/blog/2023/05/25/local-news-sector-announces-full-launch-of-public-notice-portal/)
- [GOV.UK Pay - Get Started](https://www.payments.service.gov.uk/getstarted/)
- [GDS Blog - Local Government Pay](https://gds.blog.gov.uk/2017/09/12/local-government-pay/)
- [Granicus Acquires Firmstep](https://granicus.com/uk/press-release/granicus-acquires-firmstep/)
- [Bristol Council - TRO Comments](https://www.bristol.gov.uk/residents/streets-travel/make-a-comment-on-traffic-regulation-orders-tros)
- [House of Commons Library - TROs](https://commonslibrary.parliament.uk/research-briefings/sn06013/)
- [GOV.UK - TRO Publishing Requirements Consultation](https://www.gov.uk/government/consultations/traffic-regulation-orders-changes-to-publishing-requirements-and-special-events-order-approvals)
- [Gambling Commission - Premises Licences](https://www.gamblingcommission.gov.uk/guidance/guidance-to-licensing-authorities/part-2-premises-licences)

---

## Phase 1: Implement Postcode Lookup (After Research)

- [x] Update `/src/lib/councilLookup.ts` to use the researched postcode API (likely postcodes.io). Replace the rough heuristic with real lookup.
- [x] Add proper error handling for postcode lookup failures.
- [x] Create `/src/lib/councilLookup.test.ts` with tests for the new lookup function using real postcodes.

## Phase 2: Council Data Structure

- [x] Create `/src/data/councils.ts` with TypeScript interfaces for council data structure.
- [x] Create `/src/data/departments.ts` with department types and which notice types each handles.
- [ ] Wire council lookup to return department contacts based on notice type.
- [ ] Run npm run typecheck to verify all implementations work correctly.
