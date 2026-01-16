# CivicNotices - Active PRD (Human Verified Only)
**Status:** Testing Phase 1
**Last Updated:** 2026-01-16
**Owner:** Otto Clarke

---

## Important Notice

This PRD contains ONLY features that have been:
- ✅ Manually tested by a human
- ✅ Verified working in development environment
- ✅ Ready for production deployment

For Ralph's complete attempt list, see: `docs/phase1-ralph-attempt/PRD-ralph-attempt.md`
For items needing fixes, see: `docs/needs-work/NEEDS-WORK.md`

---

## 1. Current Testing Phase

### Phase 1: Priority 0 Verification
- **Total Items:** 49 (12 Critical Fixes + 37 User Stories)
- **Verified:** 0
- **In Progress:** 0
- **Failed:** 0
- **Not Tested:** 49

### Testing Resources:
- [Test Tracking Dashboard](docs/testing/TEST-TRACKING.md)
- [Test Results Log](docs/testing/TEST-RESULTS.md)
- [Test Commands](docs/testing/TEST-COMMANDS.md)

---

## 2. Verified & Complete Features

### 2.1 Critical Infrastructure
<!-- Add items here only after manual testing -->

### 2.2 Authentication & Access
<!-- Add items here only after manual testing -->

### 2.3 Public Portal Features
<!-- Add items here only after manual testing -->

### 2.4 Council Portal Features
<!-- Add items here only after manual testing -->

### 2.5 Firm Portal Features
<!-- Add items here only after manual testing -->

### 2.6 Publish Workflow
<!-- Add items here only after manual testing -->

---

## 3. In Testing (Currently Being Verified)

<!-- Move items here while actively testing them -->

---

## 4. Failed Testing (Needs Fixes)

### Known Issues from Initial Testing:

#### 4.1 ⚠️ FIX-001: Demo Authentication (PARTIAL)
- **Works:** licensing@sampletonborough.gov.uk / testpass123
- **Broken:** Westminster and Wilson Partners accounts
- **Impact:** Cannot test council/firm features fully
- **Tracked in:** [NEEDS-WORK.md](docs/needs-work/NEEDS-WORK.md#fix-001)

---

## 5. Not Yet Tested

See [TEST-TRACKING.md](docs/testing/TEST-TRACKING.md) for complete list of 49 items awaiting verification.

---

## 6. Next Actions

### For Otto (Testing):
1. [ ] Start with Critical Fixes (Section 3 in TEST-TRACKING.md)
2. [ ] Test authentication first (enables other testing)
3. [ ] Document all failures in TEST-RESULTS.md
4. [ ] Update this PRD only with verified items

### For Ralph/AI (Development):
1. [ ] Fix Westminster authentication (P0)
2. [ ] Fix Wilson Partners authentication (P0)
3. [ ] Fix organization context errors (P1)
4. [ ] Await further test results

---

## 7. Success Metrics

### Phase 1 Complete When:
- [ ] All 12 Critical Fixes verified working
- [ ] All 37 User Stories verified working
- [ ] No P0 or P1 issues in NEEDS-WORK.md
- [ ] Can complete full user journey for:
  - [ ] Public user: Search → View → Submit representation
  - [ ] Council user: Login → View notices → Manage representations
  - [ ] Firm user: Login → Publish notice → Track status

---

## 8. Version History

| Date | Version | Changes | Verified Items |
|------|---------|---------|----------------|
| 2026-01-16 | v0.0.1 | Initial verification phase started | 0/49 |

---

## Notes

**Remember the Golden Rule:**
> "It's not done until it's tested and verified by a human."

**Current Status:** Beginning manual verification of Ralph's Phase 1 implementation.

---