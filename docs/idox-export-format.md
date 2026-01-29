# IDOX Export Format Documentation

## Overview

IDOX is the leading provider of licensing management software for UK local authorities. Their Uniform platform is used by hundreds of councils to manage premises licences, environmental health, and other regulatory functions.

This document describes the CSV format used to export representations from CivicNotices for import into IDOX systems.

## Background

### What is IDOX?

IDOX provides "front-to-back integration and automation to streamline the entire licensing process" for UK councils. Their software enables case management across all licence types including:
- Alcohol (Licensing Act 2003)
- Taxi and private hire
- Food and business premises
- Entertainment and gambling

### Why Export for IDOX?

Councils receive public representations (objections, support, comments) through CivicNotices. To maintain a single source of truth in their IDOX system, they need to import these representations into Uniform. The CSV export provides IDOX-compatible data formatting.

## CSV Format Specification

### File Naming

```
idox-representations-YYYY-MM-DD.csv
```

Example: `idox-representations-2026-01-21.csv`

### Encoding

- UTF-8 encoding
- All fields double-quoted
- Commas as field separators
- CRLF or LF line endings accepted

### Header Row

The CSV includes the following 14 columns:

| Column | Field Name | Description | Required |
|--------|-----------|-------------|----------|
| 1 | Representation ID | UUID of the representation | Yes |
| 2 | Notice Reference | UUID of the related notice | Yes |
| 3 | Submitter Name | Name of person making representation | No* |
| 4 | Submitter Email | Email address | No* |
| 5 | Stance | Support, Objection, or Comment | Yes |
| 6 | Representation Text | Full text of the representation | Yes |
| 7 | Date Submitted | ISO 8601 timestamp | Yes |
| 8 | Reviewed Status | "Reviewed" or "Not Reviewed" | Yes |
| 9 | Reviewed By | Name of reviewing officer | No |
| 10 | Reviewed Date | ISO 8601 timestamp | No |
| 11 | Assigned To | Name of assigned officer | No |
| 12 | Application Type | Type of licence application | Yes |
| 13 | Premises Name | Trading name or applicant | Yes |
| 14 | Premises Address | JSON object with address details | Yes |

*Anonymous representations allowed under Licensing Act 2003 in exceptional circumstances

### Field Details

#### Representation ID
- Format: UUID v4
- Example: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
- Used as unique identifier for matching records

#### Notice Reference
- Format: UUID v4
- Links representation to the licence application in CivicNotices
- Can be cross-referenced with IDOX application reference

#### Submitter Name
- Plain text
- "Anonymous" if withheld
- Per Licensing Act 2003: representations must include name/address to be valid

#### Stance
- One of: "Support", "Objection", "Comment"
- Maps to IDOX representation types:
  - Support → In Favour
  - Objection → Against / Objecting
  - Comment → Neutral / Neither

#### Representation Text
- Free text, may be multi-line
- Double quotes escaped as `""`
- May contain the four licensing objectives:
  - Prevention of crime and disorder
  - Public safety
  - Prevention of public nuisance
  - Protection of children from harm

#### Date Submitted
- ISO 8601 format: `YYYY-MM-DDTHH:MM:SS.sssZ`
- Example: `"2026-01-21T14:30:00.000Z"`
- Used to verify submission within 28-day consultation period

#### Reviewed Status
- "Reviewed" if council officer has processed
- "Not Reviewed" if pending review
- IDOX may use different terminology (e.g., "Processed", "Pending")

#### Application Type
- Notice type from CivicNotices
- Common values:
  - `premises-licence` - New premises licence
  - `premises-licence-variation` - Full variation
  - `minor-variation` - Minor variation
  - `temporary-event-notice` - TEN
  - `club-premises-certificate` - Club certificate

#### Premises Address
- JSON object format:
  ```json
  {"line1":"123 High Street","line2":"","town":"London","postcode":"SW1A 1AA"}
  ```
- Contains structured UK address

### Example CSV

```csv
"Representation ID","Notice Reference","Submitter Name","Submitter Email","Stance","Representation Text","Date Submitted","Reviewed Status","Reviewed By","Reviewed Date","Assigned To","Application Type","Premises Name","Premises Address"
"a1b2c3d4-e5f6-7890-abcd-ef1234567890","98765432-dcba-4321-fedc-ba0987654321","John Smith","john.smith@email.com","Objection","I wish to object to this application on the grounds of prevention of public nuisance. The premises is located directly below residential flats and late-night operation would cause significant disturbance.","2026-01-15T10:30:00.000Z","Reviewed","Sarah Jones","2026-01-16T09:15:00.000Z","","premises-licence","The Red Lion","{""line1"":""45 Market Street"",""town"":""Manchester"",""postcode"":""M1 1AA""}"
"b2c3d4e5-f6a7-8901-bcde-f12345678901","98765432-dcba-4321-fedc-ba0987654321","Anonymous","","Support","I support this application. The premises will bring employment and vitality to the area.","2026-01-14T16:45:00.000Z","Not Reviewed","","","","premises-licence","The Red Lion","{""line1"":""45 Market Street"",""town"":""Manchester"",""postcode"":""M1 1AA""}"
```

## IDOX Integration Notes

### Import Process

1. Export CSV from CivicNotices Council Portal
2. Open IDOX Uniform Licensing module
3. Navigate to the relevant licence application
4. Use Import function to load representations
5. Review and validate imported records

### Field Mapping Considerations

IDOX field names may differ by council configuration. Common mappings:

| CivicNotices Field | IDOX Uniform Field |
|-------------------|-------------------|
| Representation ID | External Reference |
| Notice Reference | Application Reference |
| Submitter Name | Objector Name / Representor Name |
| Submitter Email | Objector Email |
| Stance | Response Type |
| Representation Text | Comments |
| Date Submitted | Date Received |
| Reviewed Status | Status |
| Application Type | Application Type |

### Data Validation

Before import, IDOX may validate:
- Date Submitted is within consultation period
- Required fields are present
- Stance maps to valid response type

### Deduplication

Use `Representation ID` to prevent duplicate imports. IDOX can be configured to reject records with matching External Reference values.

## Legal Requirements

### Licensing Act 2003

Representations must relate to one or more licensing objectives:
1. Prevention of crime and disorder
2. Public safety
3. Prevention of public nuisance
4. Protection of children from harm

### Data Retention

Per council data protection policies:
- Representation data typically retained 6 years
- Personal data handled per GDPR requirements

### Valid Representations

Councils cannot accept representations that are:
- Frivolous
- Vexatious
- Repetitious
- Based on matters other than licensing objectives

## References

- [Licensing Act 2003 Councillors Handbook](https://www.local.gov.uk/publications/licensing-act-2003-councillors-handbook-england-and-wales-0)
- [IDOX Licensing Software](https://www.idoxgroup.com/solutions/public-protection/licensing/)
- [IDOX Uniform Integration (Jadu)](https://docs.jadu.net/connect/cxm-admin-guide/integration/integrations_hub/idox_uniform_licensing/)
- [Digital Marketplace - IDOX Cloud Licensing](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/878160248249482)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-21 | Initial documentation |
