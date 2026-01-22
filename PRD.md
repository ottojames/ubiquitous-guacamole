# Civic Notices Platform - PRD

## Status: ACTIVE - TypeScript & Build Fixes

**Priority**: [CRITICAL] - Build is broken, cannot deploy
**Estimated Complexity**: [M] - Multiple files, targeted fixes
**Date**: 2026-01-22

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| `[CRITICAL]` | Security vulnerability or data integrity issue - must fix immediately |
| `[HIGH]` | Core functionality broken - users cannot complete key workflows |
| `[MEDIUM]` | Important improvement - impacts user experience significantly |
| `[LOW]` | Nice to have - polish and enhancements |

## Complexity Legend

| Tag | Effort |
|-----|--------|
| `[S]` | Small - < 30 mins, single file change |
| `[M]` | Medium - 1-2 hours, multiple files |
| `[L]` | Large - Half day, new features or significant refactor |
| `[XL]` | Extra Large - Full day+, architectural changes or new systems |

---

## Current Sprint: Fix Build Errors

The production build is currently broken due to TypeScript errors. These must be fixed before any other work proceeds.

### Phase 1: Core Publishing Flow Fixes [CRITICAL]

These errors are in the main publishing wizard - the core user flow.

- [x] **Fix ZodError.errors property** `[S]`
  - File: `src/next/publish/flow/NewPublishFlow.tsx:852`
  - Issue: `Property 'errors' does not exist on type 'ZodError<unknown>'`
  - Fix: Use `error.issues` instead of `error.errors` (Zod 4 API change)

- [ ] **Fix LegalDetails.applicationDate typo** `[S]`
  - File: `src/next/publish/flow/NewPublishFlow.tsx:1582`
  - Issue: `Property 'applicationDate' does not exist on type 'LegalDetails'`
  - Fix: Check if should be `applicationType` or add `applicationDate` to LegalDetails type

- [ ] **Fix null assignment to string** `[S]`
  - File: `src/next/publish/flow/NewPublishFlow.tsx:1674-1675`
  - Issue: `Type 'string | null' is not assignable to type 'string'`
  - Fix: Add null coalescing `?? ''` or update the target type to accept null

- [ ] **Fix onDetailChange type incompatibility** `[S]`
  - File: `src/next/publish/flow/NewPublishFlow.tsx:1862`
  - Issue: `Type '(key: keyof LegalDetails, value: string) => void'` not assignable
  - Fix: Either widen the type in UploadOcrPaneProps or narrow the callback

### Phase 2: UploadOcrPane Component Fixes [HIGH]

- [ ] **Add missing PlaceholderKeys** `[S]`
  - File: `src/next/publish/flow/components/UploadOcrPane.tsx:280,302-303`
  - Issue: `"variant"`, `"DPS_NAME"`, `"DPS_LICENSING_AUTHORITY"` not in PlaceholderKey type
  - Fix: Add these keys to the PlaceholderKey union type definition

- [ ] **Fix Council type mismatch** `[S]`
  - File: `src/next/publish/flow/components/UploadOcrPane.tsx:352`
  - Issue: `Property 'id' is missing in type` when casting to Council[]
  - Fix: Either add `id` to the objects or update the Council type

- [ ] **Fix Council.slug property** `[S]`
  - File: `src/next/publish/flow/components/UploadOcrPane.tsx:361`
  - Issue: `Property 'slug' does not exist on type 'Council'`
  - Fix: Add `slug` to Council type or use a different property

### Phase 3: Schema & Type Fixes [HIGH]

- [ ] **Fix Zod enum errorMap syntax** `[M]`
  - File: `src/next/publish/schema/gvol.ts:94`
  - Issue: Zod 4 changed enum errorMap API
  - Fix: Update to new syntax: `z.enum([...]).describe('...')` or use `z.enum([...], { message: '...' })`

- [ ] **Fix Applicant.email property** `[S]`
  - File: `src/next/publish/flow/steps/PaymentStep.tsx:126`
  - Issue: `Property 'email' does not exist on type 'Applicant'`
  - Fix: Add `email` to Applicant type or access it from correct nested property

- [ ] **Fix NoticeEditor type mismatch** `[S]`
  - File: `src/pages/council/NoticeEditor.tsx:107`
  - Issue: `NoticeData` not assignable to `Record<string, unknown>`
  - Fix: Add index signature to NoticeData or update the expected type

- [ ] **Fix activities undefined check** `[S]`
  - File: `src/pages/council/NoticeEditor.tsx:264`
  - Issue: `'details.activities' is possibly 'undefined'`
  - Fix: Add optional chaining `details.activities?.` or nullish check

### Phase 4: Minor Type Fixes [MEDIUM]

- [ ] **Fix SampleNotice checkbox value** `[S]`
  - File: `src/pages/SampleNotice.tsx:340`
  - Issue: `Type 'true' is not assignable to type 'string | number | readonly string[]'`
  - Fix: Change `checked={true}` to `defaultChecked={true}` or use `value="true"`

- [ ] **Add swagger-ui-react types** `[S]`
  - File: `src/pages/ApiDocs.tsx:2`
  - Issue: Missing type declarations for swagger-ui-react
  - Fix: Run `npm i -D @types/swagger-ui-react` or add `declare module 'swagger-ui-react'`

### Phase 5: ESLint Configuration [LOW]

- [ ] **Fix ESLint config for scripts** `[M]`
  - Issue: Scripts outside tsconfig causing parser errors
  - Fix: Update `eslint.config.js` to exclude `scripts/**/*.js`, `scripts/**/*.cjs`, `next-env.d.ts`, `premises-notice-portal/**`

- [ ] **Fix AdminSettings redeclaration** `[S]`
  - File: `src/pages/admin/Settings.tsx:14`
  - Issue: `'AdminSettings' is already defined`
  - Fix: Rename one of the declarations or merge them

---

## Verification Checklist

After all tasks complete, run:

```bash
npm run typecheck   # Should pass with 0 errors
npm run lint        # Should pass (warnings OK)
npm test            # Should pass
npm run build       # Should succeed
```

---

## Quick Reference

### Commands

```bash
npm run dev          # Start dev server (frontend + backend)
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
```

### Supabase Commands

```bash
supabase migration new <name>   # Create new migration
supabase db push               # Apply migrations
supabase db reset              # Reset and reapply all migrations
```

---

## Deferred Items

### Audit Log Integration
**Why deferred**: `[XL]` complexity, `[LOW]` priority. Infrastructure work should be scheduled as its own sprint.

### E2E Test Type Fixes
**Why deferred**: `[L]` complexity, `[LOW]` priority. E2E tests in `e2e/` and `cypress/` have many type errors but don't block production build.

### Script Type Fixes
**Why deferred**: `[M]` complexity, `[LOW]` priority. Scripts in `scripts/` have type errors but are dev-only utilities.
