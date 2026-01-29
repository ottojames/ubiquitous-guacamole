# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- Vitest (unit/component tests)
- Config: `vitest.config.ts`
- Environment: jsdom for browser-like testing
- Globals: Enabled (no need to import `describe`, `it`, `expect`)
- Setup file: `src/setupTests.ts` (runs before all tests)

**Playwright (E2E):**
- Config: `playwright.config.ts`
- Base URL: `http://localhost:5173` (dev server)
- Multiple projects: default, admin, firm-owner, firm-admin, firm-editor, firm-viewer
- Retries: 2 on CI, 0 locally
- Screenshots: Captured on failure only
- Traces: Collected on first retry

**Assertion Library:**
- Vitest built-in: `expect()` from Vitest
- React Testing Library: `render()`, `screen`, `waitFor()` for component testing
- User interactions: `userEvent` from `@testing-library/user-event`

**Run Commands:**
```bash
npm test              # Run all Vitest tests
npm run test:watch   # Watch mode
npm run coverage     # Generate coverage report (v8 provider)
npm run coverage:ci  # CI coverage run
```

## Test File Organization

**Location:**
- **Colocated pattern**: Tests next to source files with `.test.ts(x)` suffix
- **Directory pattern**: Some in `__tests__/` subdirectories (seen in `src/components/__tests__/`)
- Mixed: Both patterns used in codebase (colocated preferred based on config)

**Naming:**
- `.test.ts` for unit tests (pure functions)
- `.test.tsx` for component tests (React components)
- `.spec.ts` for Playwright E2E tests (in `e2e/` directory)
- `.focus.test.tsx` for focused test runs (e.g., `Checklist.focus.test.tsx`)

**Structure:**
```
src/
├── wizard/
│   ├── wizardSteps.ts
│   └── wizardSteps.test.ts
├── next/publish/
│   ├── validation/
│   │   ├── windowRules.ts
│   │   └── windowRules.test.ts
│   ├── templates/
│   │   ├── templates.ts
│   │   └── templates.test.ts
│   ├── schema/
│   │   └── registry.ts (not tested directly)
├── components/
│   ├── SiteHeader.tsx
│   └── __tests__/
│       └── SiteHeader.test.tsx

server/
└── __tests__/
    ├── addressProvider.test.ts
    ├── upload.test.ts
    ├── emailTemplates.test.ts
    └── noticesSearch.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';

describe('Module or Component Name', () => {
  // All tests for this module
  it('does X behavior', () => {
    // Arrange
    // Act
    // Assert
  });

  it('handles Y edge case', () => {
    // ...
  });
});
```

**Patterns:**
- Use `describe()` for grouping related tests
- Use `it()` for individual test cases (not `test()`)
- Setup: `beforeAll()`, `afterAll()` for resource setup/teardown
- Mocking time: `vi.useFakeTimers()`, `vi.setSystemTime()` (see `templates.test.ts:8-11`)

**Component test pattern:**
```typescript
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('UploadNoticeFlow gating', () => {
  it('disables Continue to Pay until required fields are filled', async () => {
    // Mock fetch
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => { /* ... */ });
    global.fetch = fetchMock;

    // Render component
    render(<UploadNoticeFlow />);

    // Query elements
    const noticeSelect = screen.getByTestId('select-notice-type');

    // User interactions
    await userEvent.selectOptions(noticeSelect, 'premises');
    await userEvent.click(screen.getByTestId('btn-continue-step1'));

    // Wait for async operations
    await waitFor(() => expect(continueBtn).toBeEnabled());

    // Assert
    expect(payBtn).toBeDisabled();

    // Cleanup
    global.fetch = originalFetch;
  });
});
```

## Mocking

**Framework:** Vitest's `vi` object

**Global mocks (src/setupTests.ts):**
```typescript
// Mock UnifiedAuthContext
vi.mock('@/contexts/UnifiedAuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    // ... full auth state
  }),
  UnifiedAuthProvider: ({ children }) => children,
}));

// Mock browser APIs
HTMLElement.prototype.scrollIntoView = () => {};
window.IntersectionObserver = MockIntersectionObserver;
```

**Patterns:**
- Module mocking: `vi.mock('@/path')` returns module-level defaults
- Function mocking: `vi.fn()` for individual functions
- Implementation mocking: `.mockImplementation(async (input) => { /* ... */ })`
- Return value mocking: `.mockResolvedValue()`, `.mockReturnValue()`
- Restore: `vi.restoreAllMocks()` (called implicitly between tests)

**What to Mock:**
- External API calls (address lookup, Supabase)
- Auth contexts (globally in setupTests.ts)
- Browser APIs (scrollIntoView, IntersectionObserver)
- Timers when testing time-based logic

**What NOT to Mock:**
- Zod schemas (validate actual schemas)
- Data transformation functions (test behavior directly)
- Template renderers (validate output against snapshots)
- React components you're testing (unless extracting as separate unit)

## Fixtures and Factories

**Test Data:**
```typescript
// Build test notice from definitions
function buildNotice(definitionId: string, adjust?: (draft: Record<string, any>) => void) {
  const builder = getNoticeBuilder(definitionId);
  const draft = buildSampleDraft(definitionId);
  if (adjust) adjust(draft as Record<string, any>);
  const parsed = builder.schema.parse(draft as Record<string, unknown>);
  return builder.mapToNoticeBase(parsed);
}

// Usage in test
const notice = buildNotice('licensing-premises-new', (draft) => {
  const applicationDate = new Date(draft.APPLICATION_DATE);
  draft.DEADLINE_DATE = toISODate(addDays(applicationDate, 20));
});
```

**Location:**
- Sample data: `src/next/publish/sampleData.ts` (referenced in tests)
- Factory builders: Inline in test files or extracted to shared test utils
- Mock responses: Inline using `vi.fn().mockImplementation()`

## Coverage

**Requirements:**
- Lines: 80%
- Statements: 80%
- Functions: 80%
- Branches: 70%

**Configuration (vitest.config.ts lines 20-40):**
```typescript
coverage: {
  provider: 'v8',
  reportsDirectory: './coverage',
  reporter: ['text', 'html', 'lcov'],
  all: true,
  include: ['src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/**',
    '**/__tests__/**',
    '**/*.d.ts',
    'src/main.tsx',
    'src/vite-env.d.ts',
    'src/**/index.ts',
  ],
  thresholds: {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 70,
  },
  reportOnFailure: true,
}
```

**View Coverage:**
```bash
npm run coverage
# Generates HTML report in ./coverage/index.html
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, utilities, schemas
- Approach: Direct function calls with known inputs
- Examples: `wizardSteps.test.ts`, `windowRules.test.ts`
- Validation tests: Zod schema parsing with valid/invalid data

**Component Tests:**
- Scope: React components in isolation with mocked dependencies
- Approach: `render()` component, query elements, simulate user interactions
- Examples: `SiteHeader.test.tsx`, `UploadNoticeFlow.test.tsx`
- Mocking: Global auth context, fetch API, timers
- Coverage: User flows, button enable/disable states, form validation

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Full component trees, real contexts, mocked external APIs
- Not explicitly separated; blended with component tests
- Example: `UploadNoticeFlow.test.tsx` tests address lookup + form validation flow

**E2E Tests:**
- Framework: Playwright
- Config: `playwright.config.ts`
- Base URL: `http://localhost:5173`
- Auth states: Stored in `.playwright/*.json` files
- Projects: default (public), admin, firm-owner, firm-admin, firm-editor, firm-viewer
- Run: `npx playwright test`

## Common Patterns

**Async Testing:**
```typescript
// Wait for async operation
await waitFor(() => expect(continueBtn).toBeEnabled());

// Act on async result
await act(async () => {
  await userEvent.type(addrInput, 'BR1 1AA');
});

// Wait for UI update after async
await new Promise((r) => setTimeout(r, 350));
await waitFor(() => screen.getByText(/1 High St, Town/i));
```

**Error Testing:**
```typescript
// Validate error codes from window rules
const issues = validateWindowRules(notice);
expect(issues.some((issue) => issue.code === 'LICENSING_SITE_NOTICE')).toBe(true);

// Mock error response
const fetchMock = vi.fn().mockImplementation(async (url) => {
  if (url.includes('/error')) {
    return { ok: false, json: async () => ({ error: 'Not found' }) };
  }
  return { ok: true, json: async () => ({ data: [] }) };
});
```

**Snapshot Testing:**
```typescript
// Template rendering validation
const text = renderer!.renderText(notice);
expect(text).toMatchSnapshot();
```

**Time-based Testing:**
```typescript
describe('Time-sensitive tests', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-25T09:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('validates date calculations', () => {
    // Test date-dependent logic with fixed time
  });
});
```

**Form Testing Pattern:**
```typescript
// Test input + selection + validation flow
const fileInput = await screen.findByLabelText(/Drop PDF/i);
const file = new File(['x'], 'test.pdf', { type: 'application/pdf' });
await userEvent.upload(fileInput, file);

// Wait for file processing
const continueBtn = await screen.findByRole('button', { name: /^Continue$/ });
await waitFor(() => expect(continueBtn).toBeEnabled());
```

---

*Testing analysis: 2026-01-22*
