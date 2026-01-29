# Council E2E Tests - Verification Checklist

Use this checklist to verify everything is set up correctly before running the tests.

## File Verification

Run these commands to verify all files were created:

```bash
# Check test files exist
ls -lh e2e/council/notice-upload-and-representations.spec.ts
ls -lh e2e/council/simplified-workflow.spec.ts
ls -lh e2e/council/test-helpers.ts

# Check documentation exists
ls -lh e2e/council/README.md
ls -lh e2e/council/TEST_SUMMARY.md
ls -lh e2e/council/VERIFICATION_CHECKLIST.md

# Check fixture exists
ls -lh e2e/fixtures/premises-licence-demo.txt

# Check script exists
ls -lh scripts/test-council-workflow.sh

# Check script is executable
test -x scripts/test-council-workflow.sh && echo "✓ Script is executable" || echo "✗ Script not executable"
```

Expected output:
```
✓ All files exist
✓ Script is executable
```

## Environment Setup

### 1. Check Node.js and npm
```bash
node --version  # Should be v18+ or v20+
npm --version   # Should be v9+ or v10+
```

### 2. Check dependencies installed
```bash
npm list @playwright/test
# Should show: @playwright/test@1.55.1 or higher
```

### 3. Check Playwright browsers installed
```bash
npx playwright --version
# Should show: Version 1.55.1 or higher

# If not installed:
npx playwright install
```

### 4. Check environment variables
```bash
# Check .env file exists
test -f .env && echo "✓ .env exists" || echo "✗ .env missing"

# Check required variables (don't print values for security)
grep -q "VITE_SUPABASE_URL" .env && echo "✓ VITE_SUPABASE_URL set" || echo "✗ VITE_SUPABASE_URL missing"
grep -q "VITE_SUPABASE_ANON_KEY" .env && echo "✓ VITE_SUPABASE_ANON_KEY set" || echo "✗ VITE_SUPABASE_ANON_KEY missing"
grep -q "SUPABASE_SERVICE_ROLE_KEY" .env && echo "✓ SUPABASE_SERVICE_ROLE_KEY set" || echo "✗ SUPABASE_SERVICE_ROLE_KEY missing"
```

Expected output:
```
✓ .env exists
✓ VITE_SUPABASE_URL set
✓ VITE_SUPABASE_ANON_KEY set
✓ SUPABASE_SERVICE_ROLE_KEY set
```

## Development Server

### 1. Start development server
```bash
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in X ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose

Server running on port 5174
```

### 2. Verify frontend is accessible
```bash
curl -s http://localhost:5173 | grep -q "CivicNotices" && echo "✓ Frontend running" || echo "✗ Frontend not responding"
```

### 3. Verify backend API is accessible
```bash
curl -s http://localhost:5174/api/health && echo "✓ Backend API running" || echo "✗ Backend API not responding"
```

Expected output:
```
✓ Frontend running
{"status":"ok"}✓ Backend API running
```

## Database Setup

### 1. Check Supabase connection
```bash
# This will be tested by the E2E tests
# But you can manually verify:

# Check if notices table exists (requires psql or Supabase dashboard)
# Visit: https://app.supabase.com/project/_/editor
```

### 2. Required tables
- `notices` - Notice storage
- `representations` - Representation storage
- `organizations` - Council/firm organizations
- `departments` - Council departments
- `users` (optional) - If using auth

### 3. Check demo credentials work
```bash
# This will be tested by the E2E tests
# But you can manually verify by visiting:
open http://localhost:5173/login
# Try: demo@council.gov.uk / demo123
```

## Pre-Test Verification

### Quick smoke test
```bash
# Run a single quick test to verify everything works
npx playwright test e2e/council/simplified-workflow.spec.ts -g "complete workflow" --headed
```

This should:
1. Open a browser window
2. Login as council officer
3. Navigate through publish wizard
4. Submit a representation
5. Verify it appears in council portal

If you see the browser going through these steps and all green checkmarks in the terminal, you're ready!

## Running the Full Test Suite

### Method 1: Using the convenience script (recommended)
```bash
# Make script executable (one-time setup)
chmod +x scripts/test-council-workflow.sh

# Run tests
./scripts/test-council-workflow.sh

# Or with UI
./scripts/test-council-workflow.sh headed
```

### Method 2: Direct Playwright commands
```bash
# Run comprehensive test
npx playwright test e2e/council/notice-upload-and-representations.spec.ts

# Run simplified test
npx playwright test e2e/council/simplified-workflow.spec.ts

# Run all council tests
npx playwright test e2e/council/

# Run with UI
npx playwright test e2e/council/ --headed

# Debug mode
npx playwright test e2e/council/ --debug
```

## Expected Test Output

When running successfully, you should see:

```
Running 4 tests using 1 worker

  ✓ [chromium] › council/notice-upload-and-representations.spec.ts:complete workflow (38s)
  ✓ [chromium] › council/notice-upload-and-representations.spec.ts:API health (2s)
  ✓ [chromium] › council/notice-upload-and-representations.spec.ts:error handling (5s)
  ✓ [chromium] › council/notice-upload-and-representations.spec.ts:portal navigation (5s)

  4 passed (50s)
```

With detailed logs like:
```
[TEST] Step 1: Logging in as council officer...
[TEST] ✓ Successfully logged in to council portal
[TEST] Step 2: Navigating to publish wizard...
[TEST] ✓ Reached publish wizard Step 1
...
[TEST] ✓ ALL TESTS PASSED - Full workflow completed successfully!
```

## Troubleshooting Common Issues

### Issue: "Cannot find module '@playwright/test'"
**Solution:**
```bash
npm install @playwright/test@latest --save-dev
npx playwright install
```

### Issue: "Port 5173 already in use"
**Solution:**
```bash
# Kill existing process
lsof -ti tcp:5173 | xargs kill -9
lsof -ti tcp:5174 | xargs kill -9

# Start fresh
npm run dev
```

### Issue: "Login credentials invalid"
**Solution:**
Check `src/pages/Login.tsx` for current demo credentials:
```bash
grep -A 5 "demo@council.gov.uk" src/pages/Login.tsx
```

### Issue: "OCR processing timeout"
**Solution:**
The demo fixture is a simple .txt file and should process quickly.
If timing out, check:
```bash
# Verify file exists and is readable
cat e2e/fixtures/premises-licence-demo.txt | head -5

# Check upload endpoint is working
curl -X POST http://localhost:5174/api/upload/ocr \
  -F "file=@e2e/fixtures/premises-licence-demo.txt"
```

### Issue: "Notice ID not captured"
**Solution:**
The test tries multiple strategies. Check logs to see which strategy was attempted.
If all fail, manually verify:
```bash
# Check if notice was created in database
curl http://localhost:5174/api/notices?limit=1
```

### Issue: "Representation not visible"
**Solution:**
Check if representation was created:
```bash
# Replace {noticeId} with actual ID
curl http://localhost:5174/api/notices/{noticeId}/representations
```

## Post-Test Verification

After tests run successfully:

### 1. Check test artifacts
```bash
# Playwright creates these directories
ls -la playwright-report/  # HTML report
ls -la test-results/       # Videos, screenshots
```

### 2. View HTML report
```bash
npx playwright show-report
```

This opens a browser with detailed test results, including:
- Test duration
- Pass/fail status
- Screenshots (on failure)
- Video recordings (if enabled)
- Network logs

### 3. Verify database state
Check your Supabase dashboard to see:
- Notices created during test
- Representations submitted
- No test data pollution (if cleanup works)

## Cleanup

### Remove test data (if needed)
```bash
# Tests should create unique data each run
# But if you need to clean up:

# Via Supabase dashboard, delete notices where:
# - applicant_name LIKE '%Demo Licensing%'
# - premises_name LIKE '%Playwright%'
```

### Stop development server
```bash
# Press Ctrl+C in the terminal running `npm run dev`
# Or:
pkill -f "vite"
```

## Success Criteria

You're ready to proceed when:

- [ ] All files exist and are readable
- [ ] Script is executable
- [ ] Node.js v18+ installed
- [ ] Playwright installed and updated
- [ ] Environment variables set (.env)
- [ ] Development server starts successfully
- [ ] Frontend accessible at localhost:5173
- [ ] Backend API accessible at localhost:5174
- [ ] Supabase connection working
- [ ] Demo credentials work in UI
- [ ] Smoke test passes
- [ ] Full test suite passes

## Next Steps After Verification

1. **Run tests regularly** during development
2. **Add to CI/CD** pipeline (see examples in documentation)
3. **Extend tests** for new features
4. **Monitor flakiness** and adjust timeouts if needed
5. **Update documentation** when making changes

## Quick Reference

**Files:**
- Main test: `e2e/council/notice-upload-and-representations.spec.ts`
- Helpers: `e2e/council/test-helpers.ts`
- Docs: `e2e/council/README.md`
- Fixture: `e2e/fixtures/premises-licence-demo.txt`
- Script: `scripts/test-council-workflow.sh`

**Commands:**
```bash
# Run all tests
./scripts/test-council-workflow.sh

# Run with UI
./scripts/test-council-workflow.sh headed

# Debug
./scripts/test-council-workflow.sh debug

# Report
./scripts/test-council-workflow.sh report
```

**Demo Credentials:**
```
Council: demo@council.gov.uk / demo123
Firm: solicitor@wilsonpartners.com / SolicitorTest123!
```

---

**Checklist Version:** 1.0
**Last Updated:** November 6, 2025
**Tested With:** Playwright 1.55.1, Node.js 20.x
