# 🎯 Applicant Flow Improvements - Implementation Plan

Based on comprehensive user feedback, this document outlines all required changes to perfect the applicant submission workflow.

---

## ✅ Completed

1. **Notice-type permissions system** (`src/next/publish/config/noticePermissions.ts`)
   - Licensing: Requires council approval, applicants can submit
   - Planning: Council-only (no public submissions)
   - Probate: Law firms publish directly, no applicants

2. **User detection updated** (NewPublishFlow.tsx)
   - Now detects: `council`, `law_firm`, `applicant`
   - Law firms can publish probate notices directly
   - Applicants submit licensing applications

---

## 🔧 In Progress

### 1. Homepage Messaging
**Issue:** "Submit application" button not clear enough about who it's for

**Solution:**
- Change main CTA to "Apply for a Licence"
- Add subtitle: "For licensing applications (premises, events, etc.)"
- Add secondary link: "Probate & Legal Notices" (for solicitors)
- Add "Council Login" link in header

### 2. Council Selector Issues

**Problems:**
- Selector appears on every step
- Should only show at beginning, then lock

**Solution:**
```typescript
// Show selector only on Step 1 and only for applicants
{userType === 'applicant' && currentStep === 1 && !councilSelectorLocked && (
  <DepartmentSelector
    value={targetDepartmentId || ''}
    onChange={(id) => {
      setTargetDepartmentId(id);
      setCouncilSelectorLocked(true); // Lock after first selection
    }}
  />
)}

// On subsequent steps, show selected council as read-only badge
{userType === 'applicant' && councilSelectorLocked && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
    <span className="text-sm text-blue-900">
      Submitting to: <strong>{councilName}</strong>
    </span>
  </div>
)}
```

### 3. Copy Changes

**Step 1 - Notice Type Selection:**
- Council: "What kind of notice are you publishing?"
- Applicant: "What kind of licence are you applying for?"
- Law Firm: "What type of notice are you publishing?"

**Step 2 - Upload/Details:**
- Council: "Upload your notice"
- Applicant: "Complete your application details"
- Law Firm: "Prepare your notice"

**Step 3 - Confirm:**
- Council: "Confirm your notice"
- Applicant: "Review your application"
- Law Firm: "Confirm your notice"

**Step 4 - Payment/Submit:**
- Council: "Review & pay"
- Applicant: **SKIP THIS STEP** → go straight to submission
- Law Firm: "Review & pay"

### 4. OCR Upload for Applicants

**Issue:** OCR upload is irrelevant for applicants (they fill structured forms)

**Solution:**
```typescript
// In UploadMethodStep, hide "notice" upload option for applicants
const availableMethods = useMemo(() => {
  if (userType === 'applicant') {
    return ['template']; // Only show structured form
  }
  return ['notice', 'template']; // Show both for councils/law firms
}, [userType]);
```

**Keep the code but hide it** - might be useful later for solicitors submitting on behalf of clients

### 5. Skip Payment Step for Applicants

**Issue:** Applicants shouldn't pay - councils pay after approval

**Workflow:**
1. Applicant fills form (Steps 1-3)
2. Clicks "Send to Council" (no payment)
3. Submission created in database
4. Magic link sent to applicant
5. Council reviews → approves → **Council pays** → publishes

**Implementation:**
```typescript
// After Step 3 (Confirm), check user type
const handleContinueFromConfirm = async () => {
  if (userType === 'applicant') {
    // Skip payment - go straight to submission
    await handleSubmitApplication();
  } else {
    // Council/Law Firm → proceed to payment step
    goToStep(4);
  }
};
```

### 6. Metadata Rail Updates

**Current (not relevant for applications):**
- Notice type ✅ Keep
- Mode ❓ Remove?
- Application date → "Submission date: Today"
- Representations deadline → Remove (council sets this after approval)

**New metadata for applications:**
```typescript
if (userType === 'applicant') {
  return (
    <dl>
      <dt>Licence Type</dt>
      <dd>{definition.label}</dd>

      <dt>Submitting To</dt>
      <dd>{councilName}</dd>

      <dt>Submission Date</dt>
      <dd>{new Date().toLocaleDateString()}</dd>

      <dt>Status</dt>
      <dd>Draft</dd>
    </dl>
  );
}
```

### 7. Planning Applications

**Issue:** Should individuals be able to "apply" for planning notices?

**Answer:** NO
- Planning applications go through council planning portals
- Statutory notices are published AFTER planning decisions
- Only councils publish planning notices

**Implementation:**
```typescript
// In noticePermissions.ts
'planning_application': {
  requiresCouncilApproval: false,
  allowedPublishers: ['council'],
  allowsPublicSubmissions: false, // ❌ No public submissions
}
```

Planning notice types should be hidden from applicants in Step 1.

---

## 📊 Updated User Flows

### Flow 1: Individual Applicant (Licensing)
1. Visit homepage → Click "Apply for a Licence"
2. **Step 1:** Select council + select licence type (premises, variation, etc.)
3. **Step 2:** Fill structured form (no OCR upload shown)
4. **Step 3:** Review application
5. **Click "Send to Council"** (no payment step!)
6. Submission created → Magic link sent → Redirect to /apply/success

### Flow 2: Council Officer (Publishing)
1. Sign in → Visit /publish
2. **Step 1:** Select notice type
3. **Step 2:** Upload existing notice (OCR) OR fill template
4. **Step 3:** Confirm details
5. **Step 4:** Review & pay
6. **Click "Publish Notice"** → Published to database

### Flow 3: Solicitor (Probate)
1. Sign in as law firm → Visit /publish
2. **Step 1:** Select probate notice type
3. **Step 2:** Fill structured template
4. **Step 3:** Confirm details
5. **Step 4:** Review & pay
6. **Click "Publish Notice"** → Published directly (no council approval)

---

## 🎨 Button Text by Context

| Step | Council | Law Firm | Applicant |
|------|---------|----------|-----------|
| Step 1 Continue | "Continue" | "Continue" | "Continue" |
| Step 2 Continue | "Continue" | "Continue" | "Continue" |
| Step 3 Continue | "Continue to Payment" | "Continue to Payment" | **"Review Application"** |
| Final Button | "Publish Notice" | "Publish Notice" | **"Send to Council"** |

---

## 🔐 Security Considerations

1. **Always verify user type before publishing:**
   ```typescript
   if (userType === 'council' && noticeConfig.requiresCouncilApproval) {
     // ✅ Allowed
   } else if (userType === 'law_firm' && noticeConfig.allowedPublishers.includes('law_firm')) {
     // ✅ Allowed
   } else {
     // ❌ Block - should never happen with proper UI
     toast("You don't have permission to publish this notice type");
     return;
   }
   ```

2. **RLS policies should enforce:**
   - Applicants can INSERT into `submissions` table
   - Only councils can INSERT into `notices` table (for regulatory)
   - Law firms can INSERT into `notices` table (for probate only)

---

## 📝 Files to Modify

1. ✅ `src/next/publish/config/noticePermissions.ts` - Created
2. 🔄 `src/next/publish/flow/NewPublishFlow.tsx` - In progress
3. ⏳ `src/next/publish/flow/steps/NoticeTypeStep.tsx` - Filter notice types
4. ⏳ `src/next/publish/flow/steps/UploadMethodStep.tsx` - Hide OCR for applicants
5. ⏳ `src/next/publish/flow/steps/ConfirmStep.tsx` - Update copy
6. ⏳ `src/next/publish/flow/steps/PaymentStep.tsx` - Skip for applicants
7. ⏳ `src/pages/Home.tsx` - Better CTA messaging
8. ⏳ `src/components/ReviewCard.tsx` - Update metadata

---

## 🧪 Testing Checklist

### Test 1: Individual Applicant Flow
- [ ] Click "Apply for a Licence" on homepage
- [ ] See council selector at top
- [ ] Select council → selector locks
- [ ] Select licence type (only licensing shown, not planning/probate)
- [ ] Step 2: Only see "Fill Application" (no OCR upload)
- [ ] Fill form with structured fields
- [ ] Step 3: See "Review your application"
- [ ] Click "Send to Council" (no payment step!)
- [ ] Check `submissions` table for new record
- [ ] Receive magic link email

### Test 2: Council Officer Flow
- [ ] Sign in as council
- [ ] Visit /publish
- [ ] No council selector shown (uses own department)
- [ ] See all notice types (including planning)
- [ ] Step 2: See both OCR upload AND template options
- [ ] Step 3: See "Confirm your notice"
- [ ] Step 4: See "Review & pay"
- [ ] Click "Publish Notice"
- [ ] Check `notices` table for published record

### Test 3: Solicitor Flow
- [ ] Sign in as law firm
- [ ] Visit /publish
- [ ] See probate notice types only
- [ ] Fill structured template
- [ ] Step 4: Pay
- [ ] Click "Publish Notice"
- [ ] Published directly (no council approval)

---

## 💡 Key Insights from User Feedback

1. **"Submit application" needs better targeting** → Use "Apply for a Licence" for clarity
2. **Council selector should lock after first selection** → Better UX, less confusion
3. **OCR upload irrelevant for applicants** → Hide it, keep code for later
4. **Payment timing wrong for applicants** → Skip payment, council pays after approval
5. **Planning notices shouldn't allow public submissions** → Filter by user type
6. **Metadata rail needs rethinking** → Different fields for applications vs notices
7. **Copy matters** → "Publishing" vs "Applying" makes huge difference in clarity

---

## 🚀 Next Steps

1. Continue modifying NewPublishFlow.tsx:
   - Update hero text based on user type
   - Lock council selector after first selection
   - Skip step 4 for applicants

2. Update step components:
   - Filter notice types in NoticeTypeStep
   - Hide OCR in UploadMethodStep
   - Update copy in ConfirmStep

3. Test all three user flows end-to-end

4. Deploy and gather feedback

---

**All feedback addressed systematically for a perfect applicant experience! 🎉**
