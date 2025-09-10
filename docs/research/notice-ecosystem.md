# UK Public Notice Ecosystem

This note summarises other notice regimes and how a schema‑driven approach
applies across them. Information sourced from statutory guidance and sample
notices held internally.

## Regimes overview

| Regime | Statute | Typical audience | Statutory period | Key channels |
|--------|---------|-----------------|------------------|--------------|
| Premises Licence | Licensing Act 2003 | Local residents, businesses | 28 days | Email, portal, post |
| Goods Vehicle Operator (GVOL) | Goods Vehicles (Licensing of Operators) Act 1995 | Residents near operating centre | 21 days | Email, post |
| Traffic Regulation Order (TRO) | Road Traffic Regulation Act 1984 | Road users | 21 days | Web portal, post |
| Planning | Town and Country Planning Act 1990 | Neighbours, community | 21 days | Portal, email, post |
| Gambling | Gambling Act 2005 | Local residents | 28 days | Email, portal |
| Insolvency/Probate/Company | Insolvency Act 1986 etc. | Creditors, claimants | 21–28 days | Email, post |

## Generalisable schema concepts

- **Subject** – applicant, operator, debtor, road scheme, etc.
- **Location** – address, coordinates, map link, UPRN when relevant
- **Activity/Proposal** – what is being licensed, restricted or notified
- **Inspection/Information** – where supporting documents can be viewed
- **Representation/Objection** – channels and deadline
- **Jurisdiction pack** – region/council specific wording and contact details

These elements appear in most regimes, enabling reuse of core components.

## Future support assumptions

- **GVOL** – will reuse premises schema with “operating centre” vocabulary and 21‑day deadline rule
- **TRO** – location requires geometry; activities represented as “restrictions” with start/end dates
- **Planning** – applicant and site fields plus proposal text; deadlines vary by type but follow day‑after rule
- **Gambling** – identical to premises but with Gambling Act citations
- **Insolvency/Probate/Company** – subject entity is person or company; deadline driven by insolvency rules

