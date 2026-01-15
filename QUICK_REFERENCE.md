# 🎯 Quick Testing Reference Card

## Navigation Mapping: Guide → Log

The sections in **TESTING_GUIDE.md** match exactly with **TESTING_LOG.md**:

| Section | What to Test | User Stories | Quick Access URL |
|---------|-------------|--------------|------------------|
| **1.1** | Start servers | Setup | N/A |
| **1.2** | Verify running | Setup | http://localhost:5174/api/health |
| **2.1** | One-click address search | US-0108 | /notices |
| **2.2** | Radius filters | US-0109 | /notices |
| **2.3** | Notice details | US-0001 | /notices → click notice |
| **3.1** | Council login | US-0025 | /login → Council Portal |
| **3.2** | Licensing dashboard | US-0125 | /c/[org]/[dept]/dashboard |
| **3.3** | Department switch | US-0012 | Sidebar → Switch Department |
| **3.4** | Notice retrieval | US-0002 | /c/[org]/[dept]/notices |
| **3.5** | Representations | US-0003, 0126-0129 | /c/[org]/[dept]/representations |
| **3.6** | Analytics | US-0004 | /c/[org]/[dept]/analytics |
| **3.7** | Templates | US-0014-0015 | /c/[org]/[dept]/templates |
| **4.1** | Firm login | US-0026 | /login → Professional Portal |
| **4.2** | Firm dashboard | US-0148, 0150-0151 | /f/[firm]/dashboard |
| **4.3** | Payment button | US-0005 | Dashboard → Make Payment |
| **4.4** | Clients | US-0006, 0149 | /f/[firm]/clients |
| **4.5** | Firm notices | US-0007, 0151 | /f/[firm]/notices |
| **4.6** | Billing | US-0008 | /f/[firm]/billing |
| **4.7** | Team | US-0009 | /f/[firm]/team |
| **4.8** | Settings/filters | US-0010, 0146 | /f/[firm]/settings |
| **5.1** | Publish wizard | US-0011, 0028-0029 | /publish/step-1 |
| **6.1** | Demo OFF | US-0027 | Restart without VITE_DEMO_MODE |
| **6.2** | Demo ON | US-0027 | Restart with VITE_DEMO_MODE=true |
| **7.1** | Blue notice PDF | US-0117-0120 | /notices/[id]/confirmation |
| **8.1** | Firm registration | US-0145 | /register/firm |

## 🚀 Quick Test Commands

```bash
# Test with demo mode (recommended)
./start-testing.sh

# Test without demo mode
npm run dev

# Check API health
curl http://localhost:5174/api/health

# Test notice search API
curl "http://localhost:5174/api/notices/search?postcode=SW1A1AA"
```

## 📝 How to Use

1. Open **TESTING_GUIDE.md** for detailed instructions
2. Open **TESTING_LOG.md** to record results
3. Follow the section numbers (e.g., 2.1, 3.5) - they match exactly
4. Check off items in the log as you complete them
5. Add your comments, issues, and observations

## ✅ Status Legend

- **✅ PASS** - Feature works as expected
- **❌ FAIL** - Feature doesn't work
- **⚠️ PARTIAL** - Works with issues
- **🔄 BLOCKED** - Can't test due to dependency
- **⏭️ SKIPPED** - Intentionally not tested

## 🎯 Priority Testing Order

If short on time, test these critical paths:

1. **2.1** - One-click address search
2. **3.2** - Council licensing dashboard
3. **4.2** - Firm dashboard widgets
4. **5.1** - Publish wizard flow
5. **3.5** - Representations management

These cover the core functionality and most complex features.
