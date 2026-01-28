# Instance 2: Council Landscape Research

**Focus:** Research UK council structure, directories, lookup methods
**Output:** Populate findings in this PRD, then merge back to main

---

## Tasks

- [x] Research total number of UK councils and council types (County, District, Unitary, Metropolitan, London Borough, Welsh, Scottish). Create a complete table with counts and examples
- [ ] Research and document the official UK council directory sources (GOV.UK, LGA, etc.) — find the authoritative list
- [ ] Research postcode → council lookup methods (APIs, datasets). Document the best free/cheap method to implement
- [ ] Research common council department structures — which departments handle which notice types
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
*Document authoritative sources:*

### Postcode Lookup Method
*Document best API/method:*

### Department Patterns
*Document findings:*

### Contact Patterns
*Document findings:*

### Submission Methods
*Document findings:*

