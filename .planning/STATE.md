# Project State

**Project:** Ralph's Civic Notices
**Last Updated:** 2026-01-22

---

## Project Reference

**Core Value:** Councils can receive and manage public notices and representations in one place, with full department isolation and audit logging

**Current Focus:** Demo-ready platform for council presentations

**Milestone:** v1 Demo Ready

---

## Current Position

**Phase:** 1 of 8 (Council Template System)
**Plan:** 3 of 4 complete
**Status:** In progress
**Last activity:** 2026-01-22 - Completed 01-03-PLAN.md

### Progress

```
Phase 1 [###############     ] 75%  Templates (3/4 plans)
Phase 2 [                    ] 0%   Isolation
Phase 3 [                    ] 0%   Publish Flow
Phase 4 [                    ] 0%   Representations
Phase 5 [                    ] 0%   Email
Phase 6 [                    ] 0%   User Flows
Phase 7 [                    ] 0%   Firm Portal
Phase 8 [                    ] 0%   Polish
```

**Overall:** 0/8 phases complete | 3/28 requirements done

---

## Performance Metrics

### Session Stats

| Metric | Value |
|--------|-------|
| Tasks Completed | 7 |
| Tasks Blocked | 0 |
| Bugs Found | 1 |
| Bugs Fixed | 1 |

### Quality Indicators

| Indicator | Status |
|-----------|--------|
| Tests Passing | Yes (24 placeholder tests + 31 renderer tests) |
| Type Errors | Pre-existing (not from this plan) |
| Console Errors | Unknown |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 8 phases for comprehensive depth | Research suggests 8-12 phases; 8 covers all requirements without over-fragmentation | 2026-01-22 |
| Templates before isolation | Can't verify isolation without data to isolate | 2026-01-22 |
| Email after representations | Notifications depend on events (publication, representation) | 2026-01-22 |
| TRO notices use AUTHORITY_NAME | TROs are issued by authorities, not applicants | 2026-01-22 |
| Planning has 6 notice types | major, eia, listed, conservation, prow, departure | 2026-01-22 |
| Blue highlight for substituted placeholders | Provides clear visual feedback that content is dynamic | 2026-01-22 |
| Amber warning for unknown placeholders | Alerts users to typos without blocking | 2026-01-22 |
| localStorage for preview toggle | Preserves user preference across sessions | 2026-01-22 |
| Keep unknown placeholders visible | Alerts users to typos or unsupported placeholders in rendered output | 2026-01-22 |
| Store template metadata in extras | Provides audit trail without schema changes; stores template_id, name, original text | 2026-01-22 |
| Real-time preview via useMemo | Updates immediately as users type without manual refresh | 2026-01-22 |

### Discovered Issues

| Issue | Location | Status | Notes |
|-------|----------|--------|-------|
| Missing category colors | TemplateTextEditor.tsx | Fixed | Added gambling, transport, planning, probate, tro categories |

### Technical Debt

| Item | Location | Severity | Notes |
|------|----------|----------|-------|
| Dual publish flow | Legacy vs NewPublishFlow | Medium | Feature flag `NEW_PUBLISH_FLOW` controls; legacy should be removed |
| Test mode remnants | Various | Low | `TEST_MODE` env var exists; should be removed per CLAUDE.md |

### Open Questions

| Question | Context | Blocking |
|----------|---------|----------|
| Which councils for demo? | Need realistic demo data | Phase 8 |
| Stripe business account status | Payments integration awaiting account | Phase 3 |

---

## Session Continuity

### What Was Just Completed

- Plan 01-03: Template Rendering Integration
  - Created templateRenderer utility with placeholder-to-form-field mapping
  - NoticeEditor now fetches and stores template_text from loaded templates
  - Live preview section shows rendered template text as form fields change
  - Template metadata (id, name, original text) stored in notice.extras for audit
  - 31 unit tests covering all renderer functionality

### What Comes Next

1. Execute Plan 01-04 (Template Testing)
2. Complete Phase 1 and begin Phase 2 (Isolation)

### Context to Preserve

**Codebase Highlights:**
- 34 notice types in `src/next/publish/config/noticeTypes.ts` (was 32, added 2 review types)
- Department mapping in `src/next/publish/config/departmentNoticeTypes.ts`
- Council portal pages in `src/pages/council/`
- Firm portal pages in `src/pages/firm/`
- Email templates in `server/services/email.ts`
- RLS policies in `supabase/migrations/20260121100001_department_isolation_rls.sql`

**Key Files:**
- Templates: `src/pages/council/Templates.tsx`
- Template Editor: `src/pages/council/TemplateTextEditor.tsx`
- Template Preview: `src/pages/council/TemplatePreview.tsx`
- Template Validation: `src/pages/council/TemplateValidationWarnings.tsx`
- Template Renderer: `src/lib/templateRenderer.ts`
- Placeholder Registry: `src/next/publish/config/placeholders.ts`
- Notice Editor: `src/pages/council/NoticeEditor.tsx`
- Publish Flow: `src/next/publish/flow/NewPublishFlow.tsx`
- Representations: `src/pages/council/Representations.tsx`
- Council Matcher: `server/services/councilMatcher.ts`
- Auth Context: `src/contexts/UnifiedAuthContext.tsx`

### Handoff Notes

Plan 01-03 complete. Template text now renders into notice descriptions with placeholder substitution. NoticeEditor has live preview that updates as form fields change. Template metadata stored in extras for audit trail. Ready for Plan 01-04 (Template Testing) to verify end-to-end flows.

---

## File References

| Document | Path | Purpose |
|----------|------|---------|
| Project Definition | `.planning/PROJECT.md` | Core value and constraints |
| Requirements | `.planning/REQUIREMENTS.md` | What must be delivered |
| Roadmap | `.planning/ROADMAP.md` | Phase structure and criteria |
| Research Summary | `.planning/research/SUMMARY.md` | Domain knowledge |
| Architecture | `.planning/codebase/ARCHITECTURE.md` | System structure |
| Integrations | `.planning/codebase/INTEGRATIONS.md` | External services |
| Plan 01-01 Summary | `.planning/phases/01-council-template-system/01-01-SUMMARY.md` | Placeholder coverage complete |
| Plan 01-02 Summary | `.planning/phases/01-council-template-system/01-02-SUMMARY.md` | Live preview implementation |
| Plan 01-03 Summary | `.planning/phases/01-council-template-system/01-03-SUMMARY.md` | Template rendering integration |

---

*State updated: 2026-01-22*
