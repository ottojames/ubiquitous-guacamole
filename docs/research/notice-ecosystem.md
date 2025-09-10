# Public Notice Ecosystem

This research note outlines how the schema and template approach used for Premises Licence notices can extend to other statutory notice types.

## General model

- **Schema** – structured data describing the application (applicant, location, dates, activities).
- **Template** – deterministic render combining schema fields with wording rules supplied by the authority pack.
- **Compliance engine** – rule set per notice type that validates the schema and provides actionable errors.

## Notice families

### Goods Vehicle Operator Licensing (GVOL)
- Governed by the Goods Vehicles (Licensing of Operators) Act 1995.
- Requires operator name, operating centre address, and advertisement schedule.
- Consultation periods depend on traffic area; notices must run for one week in local press.

### Traffic Regulation Orders (TRO)
- Made under the Road Traffic Regulation Act 1984.
- Schemas include road names, extent descriptions, order purpose, and effect duration.
- Templates vary widely; many councils provide standard paragraphs.

### Planning Applications
- Town and Country Planning Act 1990.
- Schema contains applicant, proposal description, site address, grid reference, and environmental impact flags.
- Templates differ for major, minor, and listed building consent.

### Gambling Notices
- Gambling Act 2005.
- Similar to premises licence but with gambling activities and gambling commission references.

### Insolvency, Probate, Company
- Advertised in The Gazette; schemas include debtor details, dates of appointment, and reference numbers.

## Benefits of schema + template approach

- Deterministic render ensures councils receive notices in required format.
- Reuse of compliance rules across notice types promotes consistency.
- Authority packs capture local variations without changing code.

