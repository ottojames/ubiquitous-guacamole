# Instance 3: Specific Council Research

**Focus:** Research individual priority councils — departments, contacts, methods
**Output:** Create `/councils/*.json` files for each council researched

---

## Tasks

### Major Cities
- [x] Research Westminster City Council — all departments handling public notices, contact emails, submission methods. Create `/councils/westminster.json`
- [ ] Research Birmingham City Council — all departments, contacts, methods. Create `/councils/birmingham.json`
- [ ] Research Manchester City Council — all departments, contacts, methods. Create `/councils/manchester.json`
- [ ] Research Leeds City Council — all departments, contacts, methods. Create `/councils/leeds.json`
- [ ] Research Liverpool City Council — all departments, contacts, methods. Create `/councils/liverpool.json`

### London Boroughs
- [ ] Research Camden Council — departments, contacts, methods. Create `/councils/camden.json`
- [ ] Research Islington Council — departments, contacts, methods. Create `/councils/islington.json`
- [ ] Research Tower Hamlets Council — departments, contacts, methods. Create `/councils/tower-hamlets.json`
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

