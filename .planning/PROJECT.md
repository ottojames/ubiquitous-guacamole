# Ralph's Civic Notices

## What This Is

A digital platform to replace local newspapers as the statutory channel for public notice advertising in the UK. When Rachel Reeves' legislation passes (initially targeting premises licences under the Licensing Act 2003), councils will no longer need newspapers. This platform becomes the official publication channel — and the inevitable destination for all public notices as the industry modernizes.

Three user types: **publishers** (individuals, law firms, consultancies) submit notices via a wizard; **residents** search their local area, view notices on a map, and submit representations; **councils** receive notices by department, manage representations with audit trails, and publish their own notices.

## Core Value

Councils can receive and manage public notices and representations in one place, with full department isolation and audit logging — replacing scattered newspaper ads and email-based objection handling.

## Requirements

### Validated

- ✓ Notice type system with 30+ types across 6 categories (licensing, gambling, GVOL, planning, probate, TRO) — existing
- ✓ Multi-step publish wizard with OCR document extraction — existing
- ✓ Map-based notice discovery with geolocation clustering — existing
- ✓ Three portal types (public, council, firm) — existing
- ✓ Representation submission system — existing
- ✓ Stripe payment integration (code complete, awaiting business account) — existing

### Active

- [ ] Council template system fully connected — each council's templates pull correctly for all 30+ notice types
- [ ] Department isolation verified — licensing sees only licensing, planning sees only planning, etc.
- [ ] End-to-end data flow between portals — notices flow correctly from publish → council → representations
- [ ] Email system connected — area alerts, publication confirmations, representation confirmations
- [ ] All user flows tested from each perspective (publisher, resident, council staff, firm user)
- [ ] Firm subscription model ready — portal functional for paying subscribers

### Out of Scope

- Mobile apps — web-first for v1
- Real-time chat/messaging — representations and audit comments are sufficient
- Council payment integration — awaiting Stripe business account, will connect when available
- Notice types beyond current 30+ — existing coverage is comprehensive for launch

## Context

**Regulatory driver:** Rachel Reeves announced plans to remove the statutory requirement for premises licences to be advertised in local newspapers. This creates a market opportunity to become the designated digital replacement.

**Current state:** Platform is partially built. Core architecture exists (React/Express/Supabase), publish wizard works, portals exist as demos. Unclear what's broken vs working — needs systematic audit and testing.

**Technical foundation:**
- React 19 + Vite frontend with React Router 7
- Express backend with 40+ route handlers
- Supabase (PostgreSQL) for data + storage
- Stripe for payments (integration complete)
- Resend for email (integration exists, needs connection)
- MapLibre GL for geospatial display

**Key existing systems:**
- Notice type registry: `src/next/publish/config/noticeTypes.ts` (30+ types)
- Schema builders: `src/next/publish/schema/` (Zod validation per type)
- Template renderers: `src/next/publish/templates/` (text generation per type)
- Compliance engine: `src/lib/compliance/` (deadline/window validation)
- Auth context: `src/contexts/UnifiedAuthContext.tsx` (user, org, dept, permissions)

## Constraints

- **Tech stack**: React/Express/Supabase/Stripe — already built, not changing
- **Notice types**: Must support all 30+ existing types across 6 categories
- **Department isolation**: Each council department only sees their notices — non-negotiable for council adoption
- **Compliance**: Must calculate correct representation deadlines per notice type (28 days for licensing, etc.)
- **Email delivery**: Resend API for transactional email — integration exists

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Councils get free portal access | Reduces friction for adoption; revenue from per-notice fees | — Pending |
| £50 per notice (direct), £19.99 (council) | Councils publish volume (TROs, etc.) so lower price; individuals pay premium for convenience | — Pending |
| Firm subscription model (flat fee TBD) | Recurring revenue from professional users who need notice management tools | — Pending |
| Premises licences first, expand later | Aligns with Reeves legislation timeline; proves model before expanding | — Pending |

---
*Last updated: 2026-01-22 after initialization*
