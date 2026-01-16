# Test Commands & Scripts
Quick reference for testing Civic Notices features

---

## 🚀 Environment Setup

### Start Development Environment
```bash
# Start both frontend and API
npm run dev

# Or separately:
npm run dev:web    # Frontend on :5173
npm run dev:server # API on :5174

# Check if running:
lsof -ti tcp:5173  # Should show PID
lsof -ti tcp:5174  # Should show PID
```

### Kill Stuck Processes
```bash
# If ports are stuck:
kill -9 $(lsof -ti tcp:5173)
kill -9 $(lsof -ti tcp:5174)
```

### Environment Variables for Testing
```bash
# Enable demo mode
VITE_DEMO_MODE=true npm run dev

# Run with specific environment
NODE_ENV=development npm run dev
NODE_ENV=production npm run build && npm run preview
```

---

## 🔐 Authentication Testing

### Test Demo Accounts
```bash
# Quick API test for authentication
curl -X POST http://localhost:5174/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"licensing@sampletonborough.gov.uk","password":"testpass123"}'

# Test all three accounts:
./test-auth.sh  # Create this script with all three
```

### Create test-auth.sh:
```bash
#!/bin/bash
echo "Testing Authentication Accounts..."

# Sampletonborough
echo -n "Sampletonborough: "
curl -s -X POST http://localhost:5174/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"licensing@sampletonborough.gov.uk","password":"testpass123"}' \
  | grep -q "token" && echo "✅ PASS" || echo "❌ FAIL"

# Westminster
echo -n "Westminster: "
curl -s -X POST http://localhost:5174/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"licensing@westminster.gov.uk","password":"testpass123"}' \
  | grep -q "token" && echo "✅ PASS" || echo "❌ FAIL"

# Wilson Partners
echo -n "Wilson Partners: "
curl -s -X POST http://localhost:5174/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"solicitor@wilsonpartners.com","password":"testpass123"}' \
  | grep -q "token" && echo "✅ PASS" || echo "❌ FAIL"
```

---

## 🗺️ Search & Map Testing

### Test Address Search
```bash
# Test address lookup API
curl "http://localhost:5174/api/addresses?q=SW1A%201AA"

# Test notice search
curl "http://localhost:5174/api/notices/search?postcode=S325UY&radius=5"

# Test specific notice
curl "http://localhost:5174/api/notices/550e8400-e29b-41d4-a716-446655440001"
```

### Test Map Bounds
```bash
# Test bbox search
curl "http://localhost:5174/api/notices/bbox?north=51.5&south=51.4&east=-0.1&west=-0.2"
```

---

## 📝 Notice Creation Testing

### Test Notice Submission
```bash
# Create test notice via API
curl -X POST http://localhost:5174/api/notices/submit \
  -H "Content-Type: application/json" \
  -d '{
    "type": "premises-licence",
    "applicant": "Test Pub",
    "address": "123 Test St, London, SW1A 1AA",
    "council_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

---

## 📊 Database Queries

### Check Test Data
```bash
# Using Supabase CLI
supabase db query "SELECT * FROM organizations WHERE type = 'council'"
supabase db query "SELECT * FROM auth.users WHERE email LIKE '%@%.gov.uk'"

# Check if notices exist
supabase db query "SELECT COUNT(*) FROM notices"
supabase db query "SELECT id, title, type FROM notices LIMIT 5"
```

---

## 🧪 Automated Test Suite

### Run Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- NoticeCard.test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Run E2E Tests
```bash
# Playwright tests
npx playwright test

# Cypress tests (legacy)
npm run cypress:open  # Interactive
npm run cypress:run   # Headless
```

---

## 🔍 Quick Validation Scripts

### Create validate-all.sh:
```bash
#!/bin/bash
echo "=== Civic Notices Validation Suite ==="
echo ""

# Check servers
echo "1. Checking servers..."
curl -s http://localhost:5173 > /dev/null && echo "   ✅ Frontend running" || echo "   ❌ Frontend not running"
curl -s http://localhost:5174/api/health > /dev/null && echo "   ✅ API running" || echo "   ❌ API not running"

# Check auth
echo ""
echo "2. Checking authentication..."
./test-auth.sh

# Check search
echo ""
echo "3. Checking search..."
curl -s "http://localhost:5174/api/notices/search?postcode=SW1A1AA" | grep -q "notices" && echo "   ✅ Search API working" || echo "   ❌ Search API failed"

# Check database
echo ""
echo "4. Checking database..."
curl -s http://localhost:5174/api/health | grep -q "ok" && echo "   ✅ Database connected" || echo "   ❌ Database error"

echo ""
echo "=== Validation Complete ==="
```

---

## 🐛 Debug Commands

### View Console Logs
```bash
# Frontend logs (in browser console)
localStorage.debug = '*'  # Enable all debug logs
localStorage.debug = ''    # Disable debug logs

# API logs
DEBUG=* npm run dev:server  # Verbose logging
```

### Clear State
```bash
# Clear browser state
localStorage.clear()
sessionStorage.clear()

# Clear test database (careful!)
supabase db reset
```

### Network Debugging
```bash
# Monitor API calls
curl -v http://localhost:5174/api/notices  # Verbose output

# Check CORS
curl -I http://localhost:5174/api/notices \
  -H "Origin: http://localhost:5173"
```

---

## 📸 Evidence Collection

### Screenshots (macOS)
```bash
# Full screen
Cmd + Shift + 3

# Selection
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space
```

### Record Testing Session
```bash
# Using built-in macOS
Cmd + Shift + 5  # Choose record option

# Using ffmpeg
ffmpeg -f avfoundation -i "1:0" test-session.mp4
```

### Save Console Output
```javascript
// In browser console
copy(JSON.stringify(console.logs))  // Copy all logs

// Save network traffic
// Chrome: DevTools > Network > Export HAR
```

---

## 🚦 Test Status Tracking

### Update Test Status
```bash
# Mark test as complete
sed -i '' 's/⬜ \*\*3.1 FIX-001\*/✅ \*\*3.1 FIX-001\*/' docs/testing/TEST-TRACKING.md

# Mark test as failed
sed -i '' 's/⬜ \*\*3.1 FIX-001\*/❌ \*\*3.1 FIX-001\*/' docs/testing/TEST-TRACKING.md
```

### Generate Report
```bash
# Count test status
echo "Test Status Report:"
echo "Passed: $(grep -c "✅" docs/testing/TEST-TRACKING.md)"
echo "Failed: $(grep -c "❌" docs/testing/TEST-TRACKING.md)"
echo "Partial: $(grep -c "⚠️" docs/testing/TEST-TRACKING.md)"
echo "Not Tested: $(grep -c "⬜" docs/testing/TEST-TRACKING.md)"
```

---

## 🤖 Using AI for Testing

### Ask Claude to help test:
```markdown
I'm testing FIX-001 Demo Authentication. Here's what happens:
[Paste error message]
[Paste console output]
[Paste network tab]

What's wrong and how do I fix it?
```

### Ask Claude to verify:
```markdown
I tested feature X and it seems to work. Here's my evidence:
[Screenshots]
[Test steps]
[Results]

Does this meet the acceptance criteria for this feature?
```

### Ask Claude to create test data:
```markdown
I need test data for premises licence applications.
Create 5 realistic test cases with different scenarios.
```

---

## 📁 File Locations Reference

```
Frontend entry: http://localhost:5173
API health: http://localhost:5174/api/health

Key test routes:
- /auth/signin - Login page
- /register - Registration
- /notices - Public search
- /publish/step-1 - Publish wizard
- /c/[org]/[dept]/dashboard - Council portal
- /f/[slug]/dashboard - Firm portal

Test data:
- Test notice ID: 550e8400-e29b-41d4-a716-446655440001
- Test postcode: S325UY
- Test council: Sampletonborough
```

---

## Next Steps

1. Run `./validate-all.sh` to check basic setup
2. Start with Critical Fixes in TEST-TRACKING.md
3. Document results in TEST-RESULTS.md
4. Move verified items to VERIFIED-COMPLETE.md
5. Track broken items in NEEDS-WORK.md

Remember: Test like a user, not like a developer!