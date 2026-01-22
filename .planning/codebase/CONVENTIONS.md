# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `SiteHeader.tsx`, `NoticePreview.tsx`)
- Utilities/Services: camelCase (e.g., `address.ts`, `notices.ts`, `supabase.ts`)
- Tests: Same name as file with `.test.ts` or `.spec.ts` suffix (e.g., `wizardSteps.test.ts`)
- Directories: kebab-case (e.g., `next/publish/flow/steps/`, `components/search/`)
- Schema/config files: camelCase (e.g., `noticeTypes.ts`, `registry.ts`, `licensing.ts`)

**Functions:**
- Exported functions: camelCase (e.g., `fetchAddressSuggestions()`, `buildNoticeSearchQuery()`)
- Internal helpers: camelCase with descriptive names (e.g., `buildPrimaryEndpoint()`, `dedupeSuggestions()`)
- React components: Export as default or named PascalCase
- Factory functions: Prefix with `create` or `build` (e.g., `createScopedSignal()`, `buildLabel()`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `REQUEST_TIMEOUT_MS`, `MIN_QUERY_LENGTH`)
- Local variables: camelCase (e.g., `fetchWithRetry`, `debugInfo`, `scoped`)
- Type instances: camelCase (e.g., `suggestion`, `notice`, `draft`)
- Boolean variables: Prefix with `is` or `has` (e.g., `isLikelyCorsError()`, `hasPermission()`)

**Types:**
- Interfaces and types: PascalCase (e.g., `AddressSuggestion`, `NoticeBuilder`, `NoticeBase`)
- Type unions: Descriptive PascalCase (e.g., `NoticeType`, `AddressProviderStatus`)
- Generic type parameters: Single uppercase letter or descriptive (e.g., `T`, `BuilderSchema`)
- Function types: End with name pattern (e.g., `RequestSuggestionsParams`, `AddressQueryError`)

## Code Style

**Formatting:**
- No Prettier config file in project (uses ESLint formatting conventions)
- Indentation: 2 spaces
- Semicolons: Required throughout
- Arrow functions: Preferred for callbacks and utility functions
- String quotes: Double quotes `"` for general code, backticks for template literals with interpolation
- Line length: Observed max ~100-120 characters before wrapping

**Linting:**
- ESLint config: `eslint.config.js` (flat config format)
- TypeScript strict mode: Enabled
- Unused vars: Disabled (`@typescript-eslint/no-unused-vars: off`)
- React refresh: Warnings only (`react-refresh/only-export-components: warn`)
- No empty blocks: Disabled (`no-empty: off`)
- No undefined: Disabled (`no-undef: off`)

**Example linting exceptions:**
- See `eslint.config.js` lines 35-41: Intentionally disabled rules for development flexibility

## Import Organization

**Order:**
1. React and React Router imports
2. Third-party libraries (`zod`, `lucide-react`, etc.)
3. Type imports (`import type { ... }`)
4. Internal absolute imports using `@/` alias (e.g., `@/lib/supabase`)
5. Relative imports from same module

**Path Aliases:**
- `@/*` → `src/*` (primary pattern)
- `lodash.debounce` → `src/shims/lodash.debounce.ts` (custom shim)
- Defined in `tsconfig.json` lines 16-19

**Example from `src/components/SiteHeader.tsx`:**
```typescript
import React, { useEffect, useState } from 'react';
import * as UI from '@/styles/ui';
import { FileText, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '@/config/navigation';
```

**Barrel exports:**
- Used in `src/styles/ui` (exports UI constants)
- Not uniformly applied; most modules export specific items

## Error Handling

**Patterns:**
- Try/catch with typed error handling: `catch (error: any)` common, some `catch (error)` without type
- Custom error classes: `class ProviderResponseError extends Error` (`src/lib/address.ts:373`)
  - Set `name`, status, provider properties explicitly
  - Example: `src/lib/address.ts:373-382`
- Graceful fallbacks: `.catch(() => null)` or `.catch(() => [])` returns neutral value (seen in `address.ts` lines 543, 643, 999)
- Error logging: `console.error()` for logging, `console.warn()` for warnings
- Retriable errors: Tracked with `error.retriable` boolean (e.g., `src/lib/address.ts:49-55`)

**Async error patterns:**
```typescript
// Graceful JSON parsing
const payload = await response.json().catch(() => null);

// Abort signal checks
if (error?.name === 'AbortError') return [];

// Status code discrimination
if (status === 401 || status === 403) { /* credentials error */ }
if (status === 429) { /* rate limit */ }
```

**Validation errors:**
- Zod schema validation: Throws on `.parse()`, catches and returns errors
- Window rule violations: Returned as `WindowRuleIssue[]` array, not thrown

## Logging

**Framework:** `console` object (console.log, console.debug, console.warn, console.error)

**Patterns:**
- Debug logging: Conditional `if (debugEnabled())` pattern in `src/lib/address.ts:90-94`
- Tagged logs: `[address]` prefix for module identification (seen throughout `address.ts`)
- One-time logs: `logOnce()` helper prevents log spam (lines 166-174)
- Analytics stub: `track()` function placeholder for analytics (e.g., `SiteHeader.tsx:7-9`)

**Example:**
```typescript
function debugLog(...args: any[]) {
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    console.debug(...args);
  }
}

debugLog('[address] requestSuggestions fetch', { provider, url, attempt });
```

## Comments

**When to Comment:**
- Complex algorithms: Address deduplication in `src/lib/address.ts:348-364`
- Non-obvious control flow: Retry logic with rate limiting (lines 509-630)
- Business logic: Licensing notification windows (schema/licensing.ts)
- Type guards: Why a specific check is needed
- Workarounds: Marked with TODO/FIXME or explained inline

**JSDoc/TSDoc:**
- Minimal usage observed
- Type signatures documented via TypeScript types, not JSDoc
- Function purposes documented via export statements and inline comments where complex

**Example from `src/lib/address.ts`:**
```typescript
// getAddress.io autocomplete supports fuzzy search. `/find` requires full postcodes.
let endpoint = base;
if (/\/find$/i.test(endpoint)) {
  endpoint = endpoint.replace(/\/find$/i, '/autocomplete');
}
```

## Function Design

**Size:**
- Typical range: 10-50 lines for utility functions
- Longer functions: Extracted helpers (e.g., `fetchWithRetry` nested in `requestSuggestions`)
- Component functions: 50-150 lines including JSX

**Parameters:**
- Prefer object parameters for 3+ arguments (e.g., `RequestSuggestionsParams` in `src/lib/address.ts:480-491`)
- Destructure in function signature: `function buildNoticeSearchQuery(params: NoticeSearchParams = {})`
- Optional parameters with defaults: `(baseOverride?: string)`, `(timeoutMs = REQUEST_TIMEOUT_MS)`
- AbortSignal pattern: Pass as optional last param for cancellation support

**Return Values:**
- Async functions: Return `Promise<T>`
- Multiple values: Return typed object, not tuple (e.g., `AddressQueryResult` type)
- Empty states: Return `null`, `[]`, or `undefined` (context-dependent)
- Success/error: Return discriminated union with `status` field or throw custom error

## Module Design

**Exports:**
- Named exports for utilities (functions, types, constants)
- Default exports for React components
- Both named and default for complex modules
- Type-only exports: `export type` syntax

**Example from `src/lib/notices.ts`:**
```typescript
export type NoticeBoundingBox = [number, number, number, number];
export type NoticeSearchParams = { /* ... */ };
export function buildNoticeSearchQuery(params: NoticeSearchParams = {}): string { /* ... */ }
export async function fetchNotices(params: NoticeSearchParams = {}): Promise<NoticeSearchItem[]> { /* ... */ }
```

**Barrel Files:**
- Used sparingly: `src/styles/ui` exports constants
- Most modules export specific items directly
- Avoid for large module groups

**Module organization:**
- Utilities group: `src/lib/` for shared services (address, notices, supabase)
- Components group: `src/components/` for UI components
- Feature group: `src/next/publish/` for wizard-related code
- Type group: `src/types/` for shared type definitions
- Context group: `src/contexts/` for React contexts

---

*Convention analysis: 2026-01-22*
