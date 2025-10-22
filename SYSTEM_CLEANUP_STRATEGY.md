# System Cleanup Strategy - Hybrid Integration

## Context

We built a multi-tenant system (Phases 0-10) but realized we should use the **OLD PublishPage** (which is perfected) instead of creating a separate firm portal. The passwordless applicant portal (Phase 12) replaces the need for firm-specific organization accounts.

---

## ✅ KEEP - These Are Valuable

### 1. **Council Portal** (`/c/:orgSlug/:deptSlug/`)
**Why:** Essential for licensing officers to manage submissions

**Components to Keep:**
- `src/pages/council/CouncilLayout.tsx`
- `src/pages/council/Dashboard.tsx` - Licensing officer control room
- `src/pages/council/Submissions.tsx` - Intake queue
- `src/pages/council/SubmissionReviewer.tsx` - Approve/reject workflow
- `src/pages/council/Publications.tsx` - Manage published notices
- `src/pages/council/Representations.tsx` - Public feedback
- `src/pages/council/Compliance.tsx` - SLA tracking
- `src/pages/council/Analytics.tsx` - Performance metrics
- `src/pages/council/BulkActions.tsx` - Batch processing
- `src/pages/council/Exports.tsx` - CSV downloads
- `src/pages/council/Team.tsx` - User management
- `src/pages/council/Settings.tsx` - Department config
- `src/pages/council/AuditLog.tsx` - Change tracking

**Total:** ~13 components, ~3,500 LOC

### 2. **Public Portal** (`/public/`)
**Why:** Residents browse and respond to notices

**Components to Keep:**
- `src/pages/public/PublicHome.tsx`
- `src/pages/public/PublicNotices.tsx`
- `src/pages/public/PublicNoticeDetail.tsx`

**Total:** ~3 components, ~850 LOC

### 3. **Admin Portal** (`/admin/`)
**Why:** Platform-wide management

**Components to Keep:**
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/ManageOrganizations.tsx`
- `src/pages/admin/ManageUsers.tsx`

**Total:** ~4 components, ~1,000 LOC

### 4. **Applicant Portal** (`/applicant/`)
**Why:** NEW passwordless application tracking

**Components to Keep:**
- `src/pages/applicant/ApplicantSignIn.tsx` ✅ (NEW - Phase 12)
- `src/pages/applicant/ApplicantDashboard.tsx` ✅ (NEW - Phase 12)
- `src/pages/applicant/ApplicantSubmissionDetail.tsx` ✅ (NEW - Phase 12)

**Total:** ~3 components, ~850 LOC

### 5. **Auth & Onboarding**
**Components to Keep:**
- `src/pages/auth/SignIn.tsx`
- `src/pages/auth/DevSignIn.tsx`
- `src/pages/auth/Callback.tsx`
- `src/pages/auth/SwitchContext.tsx`
- `src/pages/onboarding/CreateOrganization.tsx`

**Total:** ~5 components, ~600 LOC

---

## ❌ DELETE - Replaced by Passwordless Applicant Portal

### Firm Portal Components (NO LONGER NEEDED)

**Components to Delete:**
- `src/pages/firm/FirmLayout.tsx` ❌
- `src/pages/firm/FirmDashboard.tsx` ❌
- `src/pages/firm/FirmSubmissions.tsx` ❌
- `src/pages/firm/NewSubmission.tsx` ❌
- `src/pages/firm/SubmissionDetail.tsx` ❌

**Reason:**
- Firm portal required organization membership
- Applicant portal uses passwordless magic links
- No need for firm-specific accounts
- NewSubmission.tsx functionality will be merged into context-aware PublishPage

**Total to Delete:** ~5 components, ~1,500 LOC

**Routes to Remove from App.tsx:**
```typescript
// DELETE THIS ENTIRE SECTION:
{/* Firm Portal Routes */}
<Route path="/f/:orgSlug" element={<FirmLayout />}>
  <Route path="dashboard" element={<FirmDashboard />} />
  <Route path="submissions" element={<FirmSubmissions />} />
  <Route path="submissions/:submissionId" element={<SubmissionDetail />} />
  <Route path="new-submission" element={<NewSubmission />} />
  <Route path="team" element={<Team />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

---

## 🔄 INTEGRATE - Merge Firm Functionality into OLD System

### What Needs Integration

1. **PublishPage → Context-Aware**
   - Keep existing form (it's perfected!)
   - Add logic: detect if user is applicant or council
   - Show "Select Council" dropdown for applicants
   - Submit creates `submission` record (not published notice)

2. **Council Selector Component**
   - Extract from NewSubmission.tsx (lines 80-120)
   - Create reusable component: `src/components/applicant/CouncilSelector.tsx`
   - Shows only councils with licensing departments
   - Filters by notice type

3. **Resubmission Workflow**
   - Use existing PublishPage form
   - Pre-populate with submission data if `?resubmit=id` in URL
   - Update existing submission instead of creating new

---

## 📋 Cleanup Checklist

### Step 1: Backup Before Deletion
```bash
git checkout -b cleanup-firm-portal
git add -A
git commit -m "Backup before removing firm portal"
```

### Step 2: Remove Firm Portal Files
```bash
rm -rf src/pages/firm/
```

### Step 3: Remove Firm Imports from App.tsx
- Delete lines 41-45 (FirmLayout, FirmDashboard, etc.)
- Delete lines 100-107 (Firm portal routes)

### Step 4: Test Routes Still Work
- ✅ `/` - Home
- ✅ `/applicant/sign-in` - Magic link auth
- ✅ `/applicant/dashboard` - Passwordless dashboard
- ✅ `/c/{orgSlug}/{deptSlug}/dashboard` - Council portal
- ✅ `/public/notices` - Public browsing
- ✅ `/admin/dashboard` - Platform admin

### Step 5: Extract Council Selector Component
- Create `src/components/applicant/CouncilSelector.tsx`
- Extract dropdown logic from deleted NewSubmission.tsx
- Make reusable for PublishPage

### Step 6: Make PublishPage Context-Aware
- Detect user context (applicant vs council)
- Show council selector for applicants
- Adjust submit logic based on context

---

## 🎯 After Cleanup

**Total Components: ~28 files**
**Total LOC: ~6,500**
**Portals:**
- Council portal (13 components) ✅
- Public portal (3 components) ✅
- Admin portal (4 components) ✅
- Applicant portal (3 components) ✅
- Auth/Onboarding (5 components) ✅

**Removed:**
- Firm portal (5 components) ❌
- ~1,500 LOC deleted

**Result:**
- Cleaner codebase
- Unified application submission (via PublishPage)
- Passwordless authentication for applicants
- Council portal intact and valuable
- Public browsing intact
- Admin management intact

---

## 🚀 Next Tasks (In Order)

1. ✅ Add "Track Application" to home page (DONE)
2. **Create CouncilSelector component** (extract from NewSubmission)
3. **Make PublishPage context-aware** (detect applicant vs council)
4. **Test end-to-end flow** (applicant → submission → council review)
5. **Delete firm portal** (after confirming PublishPage works)
6. **Clean up App.tsx routes**
7. **Update documentation**

---

**Status: Ready to proceed with Phase 12 integration!**
