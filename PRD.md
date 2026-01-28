# Instance 3: Specific Council Research

**Focus:** Research individual priority councils — departments, contacts, methods
**Output:** Create `/councils/*.json` files for each council researched

---

## Tasks

### Major Cities
- [x] Research Westminster City Council — all departments handling public notices, contact emails, submission methods. Create `/councils/westminster.json`
- [x] Research Birmingham City Council — all departments, contacts, methods. Create `/councils/birmingham.json`
- [x] Research Manchester City Council — all departments, contacts, methods. Create `/councils/manchester.json`
- [x] Research Leeds City Council — all departments, contacts, methods. Create `/councils/leeds.json`
- [x] Research Liverpool City Council — all departments, contacts, methods. Create `/councils/liverpool.json`

### London Boroughs
- [x] Research Camden Council — departments, contacts, methods. Create `/councils/camden.json`
- [x] Research Islington Council — departments, contacts, methods. Create `/councils/islington.json`
- [x] Research Tower Hamlets Council — departments, contacts, methods. Create `/councils/tower-hamlets.json`
- [ ] Research Hackney Council — departments, contacts, methods. Create `/councils/hackney.json`
- [ ] Research Southwark Council — departments, contacts, methods. Create `/councils/southwark.json`

---

## Council JSON Format

Create each council file in `/councils/` with this structure:

```json
{
  "name": "Council Name",
  "type": "London Borough|Metropolitan|etc",
  "region": "Region",
  "website": "https://...",
  "departments": [
    {
      "name": "Licensing",
      "handles": ["premises-licence", "alcohol-variation"],
      "email": "licensing@council.gov.uk",
      "phone": "phone number",
      "submissionMethod": "email|web-form|portal",
      "webForm": "url or null",
      "notes": ""
    }
  ],
  "verified": false,
  "lastUpdated": "2026-01-28"
}
```

---

## Councils Researched

*Track progress:*

### Westminster City Council
- **Type**: London Borough
- **Website**: https://www.westminster.gov.uk
- **File**: `/councils/westminster.json`
- **Departments Researched**: 6 (Licensing, Street Trading, Planning, Building Control, Highways, Health & Safety)
- **Key Findings**:
  - Largest licensing authority in the UK (9,000+ applications/year, 14+ staff)
  - Licensing email: licensing@westminster.gov.uk
  - Planning via national Planning Portal (no direct council email)
  - Building Control: DistrictSurveyors@westminster.gov.uk
  - Health & Safety: healthandsafety@westminster.gov.uk
  - Highways: Phone only (020 7641 2000), TMO portal available
  - Street Trading: streettradinglicensing@westminster.gov.uk

### Birmingham City Council
- **Type**: Metropolitan Borough
- **Website**: https://www.birmingham.gov.uk
- **File**: `/councils/birmingham.json`
- **Departments Researched**: 7 (Licensing, Street Trading/Markets, Planning, Building Control, Highways/Transport, Environmental Health, Property Licensing)
- **Key Findings**:
  - Largest local authority in the UK (1 million+ citizens)
  - Licensing email: licensing@birmingham.gov.uk (handles premises, gambling, taxi/private hire)
  - Planning via national Planning Portal, local search at eplanning.birmingham.gov.uk
  - Building Control outsourced to Acivico: building.consultancy@acivico.co.uk (experiencing delays)
  - Highways/TRO: transport.projects@birmingham.gov.uk
  - Street Trading/Markets: marketstalls@birmingham.gov.uk
  - Property Licensing (HMO): pl@birmingham.gov.uk
  - Environmental Health: No email, online forms at birmingham.gov.uk/env-health-contact
  - Public consultations (TROs) at birminghambeheard.org.uk

### Manchester City Council
- **Type**: Metropolitan Borough
- **Website**: https://www.manchester.gov.uk
- **File**: `/councils/manchester.json`
- **Departments Researched**: 9 (Licensing, Street Trading, Planning, Building Control, Highways, Environmental Health, Public Protection, Trading Standards, Property Licensing)
- **Key Findings**:
  - Licensing email: premises.licensing@manchester.gov.uk (handles Licensing Act 2003 and Gambling Act 2005)
  - Licensing phone (also out of hours after 8pm): 0161 234 5004
  - Planning: planning@manchester.gov.uk, phone 0161 234 4516
  - Building Control: building.control@manchester.gov.uk (experiencing delays due to staff shortages)
  - Highways/TRO: highwaynetworkmanagement@manchester.gov.uk
  - Trading Standards: trading_standards@manchester.gov.uk
  - Property Licensing (HMO): hmolicensingenquiry@manchester.gov.uk
  - Environmental Health: No email, online forms only (contact form at manchester.gov.uk/xfp/form/1882)
  - Selective Licensing Scheme 3 covers parts of 6 wards (May 2025-May 2030)
  - Council address: Town Hall, Albert Square, Manchester M60 2LA
  - Main phone: 0161 234 5000

### Leeds City Council
- **Type**: Metropolitan Borough
- **Website**: https://www.leeds.gov.uk
- **File**: `/councils/leeds.json`
- **Departments Researched**: 12 (Entertainment Licensing, Taxi/Private Hire, HMO Licensing, Selective Licensing, Markets/Street Trading, Street Cafe, Planning, Building Control, Highways, Environmental Health, Child Performance, Animal Welfare)
- **Key Findings**:
  - Entertainment Licensing email: entertainment.licensing@leeds.gov.uk, phone 0113 378 5029
  - Handles both Licensing Act 2003 and Gambling Act 2005 applications
  - Taxi/Private Hire: taxiprivatehire.licensing@leeds.gov.uk, phone 0113 378 1570
  - HMO Licensing: hmo.team@leeds.gov.uk, phone 0113 535 1369
  - Selective Licensing: ESWSelective.licensing@leeds.gov.uk (scheme starts Feb 2026 for 6 wards)
  - Markets: markets@leeds.gov.uk, phone 0113 378 1950
  - Street Cafe: streetcafes@leeds.gov.uk (£500 annual fee)
  - Planning: phone 0113 222 4409, uses national Planning Portal
  - Building Control: building.control@leeds.gov.uk, phone 0113 378 6006 (experiencing delays)
  - Highways/TRO: legal.development@leeds.gov.uk, TraffWeb system at leeds.traffweb.app
  - Environmental Health: env.health@leeds.gov.uk, phone 0113 378 5959
  - Responsible authorities: West Yorkshire Police (Elland Road), West Yorkshire Fire (Birkenshaw)
  - Council address: Civic Hall, Calverley Street, Leeds LS1 1UR
  - Main phone: 0113 222 4444

### Liverpool City Council
- **Type**: Metropolitan Borough
- **Website**: https://www.liverpool.gov.uk
- **File**: `/councils/liverpool.json`
- **Departments Researched**: 11 (Licensing, Taxi/Private Hire, HMO Licensing, Selective Licensing, Street Trading, Markets, Planning, Building Control, Highways, Environmental Health, Trading Standards)
- **Key Findings**:
  - Licensing email: licensingact2003@liverpool.gov.uk, phone 0151 233 3015
  - Uses LALPAC system for all licensing applications and registers
  - Taxi Licensing: No email (portal only), phone 0151 233 3015 - no longer accepts email submissions
  - HMO/Selective Licensing: privatesector.housing@liverpool.gov.uk
  - Selective Licensing Scheme (2022-2027) covers 16 wards - ~80% of private rentals (45,000 properties)
  - Street Trading: Currently not granting new licences, only Waterloo Place applications accepted
  - Planning: planning@liverpool.gov.uk, phone 0151 233 3021, area-specific emails available
  - Building Control: planningandbuildingcontrol@liverpool.gov.uk, phone 0151 233 3021
  - Highways/TRO: phone 0151 233 3001, TTRO requires PAA number
  - Environmental Health: Environmental.Health@liverpool.gov.uk
  - Responsible authorities: Merseyside Police (Rose Hill, Cazneau Street), Merseyside Fire (Bootle HQ)
  - All departments based at Cunard Building, Water Street, L3 1AH
  - Main phone: 0151 233 3000

### London Borough of Camden
- **Type**: London Borough
- **Website**: https://www.camden.gov.uk
- **File**: `/councils/camden.json`
- **Departments Researched**: 8 (Licensing, Street Trading, Planning, Building Control, Highways, Environmental Health, HMO Licensing, Trading Standards)
- **Key Findings**:
  - Licensing email: licensing@camden.gov.uk, phone 020 7974 4444
  - Enforcement phone: 020 7974 6767
  - Handles Licensing Act 2003 and Gambling Act 2005 applications
  - Pre-application advice fees: Small £153, Medium £275.40, Large £581.40
  - Statement of Licensing Policy 2025-2030 in effect until 30 January 2027
  - Street Trading: marketsteam@camden.gov.uk, applications to marketapplications@camden.gov.uk
  - Operates 8 council-run markets and 48 trading sites (excludes Camden Lock private markets)
  - Planning: phone 020 7974 5613, uses national Planning Portal
  - Development Management at Camden Town Hall Extension, Argyle Street WC1H 8EQ
  - Building Control: building.control@camden.gov.uk, phone 020 7974 2387, Head: Nasser Rad
  - Highways: No email, multiple phone numbers by function (parking, road safety, signage, bus priority)
  - Environmental Health: noiseteam@camden.gov.uk for noise complaints
  - HMO Licensing: hmolicensing@camden.gov.uk, phone 020 7974 5969
  - Borough-wide additional HMO scheme started Dec 2025, runs to Dec 2030
  - HMO fee: £1,531 (£100 discount for accredited landlords)
  - Trading Standards: Via Citizens Advice Consumer Service (0808 223 1133)
  - Taxi/private hire licensing handled by Transport for London (not Camden)
  - Council address: 5 Pancras Square, Kings Cross, London N1C 4AG
  - Main phone: 020 7974 4444

### London Borough of Tower Hamlets
- **Type**: London Borough
- **Website**: https://www.towerhamlets.gov.uk
- **File**: `/councils/tower-hamlets.json`
- **Departments Researched**: 8 (Licensing, Street Trading & Markets, Planning, Building Control, Highways, Environmental Health, HMO Licensing, Trading Standards)
- **Key Findings**:
  - Licensing email: licensing@towerhamlets.gov.uk, phone 020 7364 5008
  - Statement of Licensing Policy 2023-2028 in effect
  - Statement of Gambling Policy 2025-2028 (effective December 2025)
  - Brick Lane Cumulative Impact Area active (extended November 2024); Bethnal Green CIA removed
  - Public Register: https://alcohol-entertainment.towerhamlets.gov.uk/Civica-elr-3.2_live/
  - Street Trading/Markets: streetmarkets@towerhamlets.gov.uk, phone 020 7364 1717
  - Operates 10 markets including: Brick Lane (Sun), Columbia Road (Sun), Petticoat Lane (Sun), Whitechapel (Mon-Sat)
  - Market Services address: 131 Commercial Street, E1 6BJ (Tue-Thu 10am-3pm)
  - Planning: planning@towerhamlets.gov.uk, development.control@towerhamlets.gov.uk, phone 020 7364 5009
  - Building Control: buildingcontrol@towerhamlets.gov.uk, phone 020 7364 5000
  - Highways/TMO: TMO.Project@towerhamlets.gov.uk, TraffWeb portal at towerhamlets.traffweb.app
  - Environmental Health: environmentalhealth@towerhamlets.gov.uk, foodsafety@towerhamlets.gov.uk
  - 24hr Noise Hotline (council tenants): 020 7364 2332
  - HMO Licensing: housinglicensing@towerhamlets.gov.uk, phone 020 7364 5008
  - Mandatory HMO: £781.50 + £54.50/room (3-year licence - shorter than typical)
  - Additional Licensing: £756 + £54.50/room (Borough-wide from April 2024 to March 2029)
  - Selective Licensing: £747 (Whitechapel, Weavers, Spitalfields & Banglatown until September 2026)
  - Responsible authorities: Met Police (CEMailbox-.TowerHamletsLicensing@met.police.uk), LFB (FSR-AdminSupport@london-fire.gov.uk)
  - Child Protection: Licensing-ChildProtection@towerhamlets.gov.uk
  - Council address: Tower Hamlets Town Hall, 160 Whitechapel Road, London E1 1BJ
  - Main phone: 020 7364 5000

---

## Phase 1: Wire Council Data (After Research)

- [ ] Create `/src/data/councils/index.ts` that imports all council JSON files and exports them as a typed object.
- [ ] Create a `getCouncilById(id: string)` function that returns council data.
- [ ] Create a `getCouncilDepartment(councilId: string, noticeType: string)` function that returns the right department contact.
- [ ] Run `npm run typecheck` to verify all council data types.

## Phase 2: Notification System

- [ ] Create `/src/lib/councilNotification.ts` with a function to generate notification emails for councils.
- [ ] Create email template that includes notice details and link to view on Civic Notices.
- [ ] Wire notification to use real council department emails from the JSON files.
