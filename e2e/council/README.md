# Council Workflow E2E Tests

## Overview

This directory contains comprehensive end-to-end tests for the council officer workflow, covering:

1. **Council Officer Login** - Authentication as a licensing officer
2. **Notice Publication** - Complete the publish wizard with a demo document
3. **Notice Verification** - Confirm notice appears in council portal
4. **Public Representations** - Submit objections/support as a citizen
5. **Representation Receipt** - Verify council receives and can view representations

## Test Files

- `notice-upload-and-representations.spec.ts` - Main E2E test suite
- `../fixtures/premises-licence-demo.txt` - Sample premises licence application

## Prerequisites

1. **Development server running:**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 5173) and backend (port 5174)

2. **Supabase configured:**
   - `.env` file must have valid Supabase credentials
   - Database tables must be set up (`notices`, `representations`, etc.)

3. **Playwright installed:**
   ```bash
   npx playwright install
   ```

## Running the Tests

### Run all council workflow tests
```bash
npx playwright test e2e/council/notice-upload-and-representations.spec.ts
```

### Run with UI (headed mode) to see the browser
```bash
npx playwright test e2e/council/notice-upload-and-representations.spec.ts --headed
```

### Run in debug mode (step through each action)
```bash
npx playwright test e2e/council/notice-upload-and-representations.spec.ts --debug
```

### Run specific test
```bash
npx playwright test e2e/council/notice-upload-and-representations.spec.ts -g "should complete full workflow"
```

### Generate HTML report
```bash
npx playwright test e2e/council/notice-upload-and-representations.spec.ts --reporter=html
npx playwright show-report
```

## Test Credentials

The tests use demo credentials defined in `src/pages/Login.tsx`:

**Council Portal:**
- Email: `demo@council.gov.uk`
- Password: `demo123`
- Redirects to: `/c/westminster/licensing`

**Alternative (Sample Borough):**
- Email: `licensing@sample.gov.uk`
- Password: `sample123`
- Redirects to: `/c/sample-borough/licensing`

## Test Data

**Sample Applicant:**
- Company: Demo Licensing Ltd
- Trading Name: The Playwright Arms
- Address: 123 High Street, Westminster, London, SW1A 1AA

**Sample Representation:**
- Name: Test Resident
- Email: resident@example.com
- Type: Objection
- Grounds: Public nuisance concerns re: late-night noise

## What the Test Validates

### 1. Authentication Flow
- ✓ Council portal selection
- ✓ Login with demo credentials
- ✓ Redirect to council-specific dashboard
- ✓ Session persistence

### 2. Notice Publication Flow (Wizard Steps 1-4)
- ✓ Step 1: Notice type selection (Premises Licence - New Application)
- ✓ Step 2: Document upload and OCR processing
- ✓ Step 2: Required fields validation
- ✓ Step 2: Confirmation email entry
- ✓ Step 3: Notice preview and confirmation
- ✓ Step 4: Payment/publication completion

### 3. Backend Integration
- ✓ Notice created in database with unique ID
- ✓ Notice appears in council portal notice list
- ✓ Notice searchable by applicant name
- ✓ All notice metadata correctly saved

### 4. Public Representation Flow
- ✓ Public user can view published notice
- ✓ "Submit representation" button accessible
- ✓ Representation form renders correctly
- ✓ Form validation (name, email, comments required)
- ✓ Representation submitted to API (`POST /api/representations`)

### 5. Council Representation Receipt
- ✓ Representation appears in council portal
- ✓ Representation linked to correct notice
- ✓ Representation details displayed (name, email, content)
- ✓ Unread status indicator shown
- ✓ Representation text fully visible

### 6. API Endpoint Health
- ✓ `/api/health` - Server health check
- ✓ `/api/notices` - Notice listing
- ✓ `/api/notices/:id/representations` - Representation retrieval
- ✓ `/api/representations` - Representation submission

## Common Issues & Troubleshooting

### Test fails at login step
- **Issue:** Login redirect not working
- **Fix:** Ensure demo credentials are still valid in `Login.tsx` (lines 38-42)
- **Check:** Portal routing is correctly configured

### Test fails at file upload
- **Issue:** File not found or OCR processing timeout
- **Fix:** Verify `e2e/fixtures/premises-licence-demo.txt` exists
- **Check:** OCR service is running and responding

### Test fails at representation submission
- **Issue:** API endpoint returns 500 error
- **Fix:** Check Supabase credentials and database schema
- **Check:** `representations` table exists with correct columns

### Notice ID not captured
- **Issue:** Success modal structure changed
- **Fix:** Test tries multiple methods to extract ID (link href, URL, API query)
- **Fallback:** Latest notice retrieved via API

### Council portal not showing representation
- **Issue:** Permissions or authentication problem
- **Fix:** Verify council user has `representations.read` permission
- **Check:** Representations API endpoint requires auth token

## Environment Variables

The test respects these environment variables:

```bash
# Frontend base URL (default: http://localhost:5173)
PLAYWRIGHT_BASE_URL=http://localhost:5173

# API base URL (default: http://localhost:5174)
VITE_API_BASE=http://localhost:5174

# Supabase credentials (must be set in .env)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## CI/CD Integration

To run in CI environments:

```bash
# Install dependencies
npm ci
npx playwright install --with-deps

# Run tests in headless mode
npx playwright test e2e/council/notice-upload-and-representations.spec.ts --reporter=html

# Archive test results
npx playwright show-report
```

## Extending the Tests

### Add more representation types
Modify the representation submission step to test support/comment types:

```typescript
const supportButton = page.locator('button:has-text("Support")');
await supportButton.click();
```

### Test email notifications
If email service is configured, verify notification delivery:

```typescript
// Check that email was sent (requires email testing service like Mailhog)
const emailRequest = await page.waitForRequest(request =>
  request.url().includes('/api/email/send')
);
expect(emailRequest).toBeTruthy();
```

### Test RBAC permissions
Login with different user roles to test permission boundaries:

```typescript
// Viewer (read-only) - should NOT be able to publish
await loginAs('viewer@test.civicnotices.co.uk', 'TestPassword123!');

// Officer (12 permissions) - should be able to publish
await loginAs('officer@test.civicnotices.co.uk', 'TestPassword123!');

// Admin (21 permissions) - full access
await loginAs('admin@test.civicnotices.co.uk', 'TestPassword123!');
```

## Test Maintenance

**When to update these tests:**

1. **Login flow changes** - Update credential entry selectors
2. **Wizard steps change** - Update step URLs and button selectors
3. **Representation form changes** - Update field selectors
4. **Council portal UI refactor** - Update navigation and verification selectors

**Selector strategy:**
- Prefer `data-testid` attributes for stability
- Fallback to semantic `text=` selectors
- Avoid brittle class-based selectors

## Performance Notes

**Typical test duration:**
- Full workflow test: ~30-45 seconds
- API health check: ~2 seconds
- Portal navigation test: ~5 seconds

**Optimization tips:**
- Use `page.waitForLoadState('networkidle')` sparingly (slow)
- Prefer specific element visibility checks
- Run tests in parallel where possible (different test suites)

## Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [Project README](/Users/ottoclarke/projects/ubiquitous-guacamole/README.md)
- [API Documentation](/Users/ottoclarke/projects/ubiquitous-guacamole/docs/api.md)
- [Test Recommendations](/Users/ottoclarke/projects/ubiquitous-guacamole/PLAYWRIGHT_TEST_RECOMMENDATIONS.md)
