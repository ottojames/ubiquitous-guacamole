# ✅ Context-Aware Publish Flow Implementation

## 🎯 What Was Built

The existing **NewPublishFlow** wizard has been transformed from a council-only publishing tool into a **context-aware application system** that serves both:

1. **Councils** → Publish notices directly (existing behavior preserved)
2. **Applicants** (individuals, solicitors, businesses) → Submit applications to councils

This replaces the basic `ApplyPage.tsx` that was initially created, leveraging all the sophisticated features already built into the wizard:
- ✅ Address lookup integration
- ✅ OCR text extraction
- ✅ Collapsible licensable activities
- ✅ Notice type-specific forms (GVOL, premises licence, etc.)
- ✅ Maps integration
- ✅ All existing validation and UI

---

## 🔄 How It Works

### **User Detection on Load**

When the wizard loads, it automatically detects user context:

```typescript
useEffect(() => {
  detectUserContext();
}, []);
```

**Detection Logic:**
1. Check if user is authenticated via Supabase session
2. If authenticated → Check if user has council membership
   - **Has council membership** → `userType = 'council'`
   - **No council membership** → `userType = 'applicant'` (solicitor/firm)
3. If unauthenticated → `userType = 'applicant'` (individual)

### **Adaptive UI Based on User Type**

#### **For Councils (userType === 'council'):**
- **Hero Title:** "Publish with calm, compliant confidence"
- **Button Text:** "Publish notice"
- **Behavior:** Publishes notice directly to `notices` table
- **No council selector** (uses their own department automatically)

#### **For Applicants (userType === 'applicant'):**
- **Hero Title:** "Submit your application"
- **Department Selector:** Shows dropdown to select target council
- **Button Text:** "Submit application"
- **Behavior:** Creates submission record in `submissions` table
- **Magic Link:** Sends passwordless auth link if unauthenticated

---

## 📦 Components Modified

### 1. **NewPublishFlow.tsx** (Main Wizard)

**New State Variables:**
```typescript
const [userType, setUserType] = useState<'council' | 'applicant' | 'loading'>('loading');
const [userEmail, setUserEmail] = useState<string | null>(null);
const [targetDepartmentId, setTargetDepartmentId] = useState<string | null>(null);
```

**User Detection Function:**
```typescript
const detectUserContext = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    setUserType('applicant');
    return;
  }

  // Check council membership
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`organization:organizations!inner (type)`)
    .eq('user_id', session.user.id);

  const councilMembership = memberships?.find(m => m.organization?.type === 'council');

  setUserType(councilMembership ? 'council' : 'applicant');
};
```

**Modified Submission Logic:**
```typescript
const handleSubmit = async () => {
  if (userType === 'council') {
    // Existing flow → publish directly
    const result = await submitNotice(payload);
    navigate("/success?noticeId=" + result.id);
  } else {
    // New flow → create submission
    const { data, error } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    // Send magic link if unauthenticated
    if (!userEmail && submissionData.applicant_email) {
      await supabase.auth.signInWithOtp({
        email: submissionData.applicant_email,
        options: { emailRedirectTo: `${window.location.origin}/applicant/dashboard` },
      });
    }

    navigate("/apply/success");
  }
};
```

**New DepartmentSelector Component:**
```typescript
function DepartmentSelector({ value, onChange }) {
  // Loads all licensing departments from councils
  const { data } = await supabase
    .from('departments')
    .select(`id, name, organization:organizations!inner (name, type)`)
    .eq('organization.type', 'council')
    .eq('type', 'licensing');

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- Choose a council --</option>
      {departments.map(dept => (
        <option key={dept.id} value={dept.id}>
          {dept.orgName} - {dept.name}
        </option>
      ))}
    </select>
  );
}
```

---

### 2. **PaymentStep.tsx** (Final Step)

**New Props:**
```typescript
export type PaymentStepProps = {
  // ... existing props
  submitButtonText?: string;
  submitDescription?: string;
};
```

**Adaptive Button Text:**
```typescript
<button onClick={onSubmit}>
  {submitButtonText || "Submit notice"}
</button>
<p>{submitDescription || "Your notice will be published..."}</p>
```

**Usage in NewPublishFlow:**
```typescript
<PaymentStep
  submitButtonText={userType === 'council' ? 'Publish notice' : 'Submit application'}
  submitDescription={
    userType === 'council'
      ? 'Your notice will be published after successful payment.'
      : 'Your application will be submitted to the council for review.'
  }
/>
```

---

### 3. **Home.tsx** (Homepage)

**Changed all application links from `/apply` to `/publish`:**

```typescript
// Before
<a href="/apply">Submit application</a>

// After
<a href="/publish">Submit application</a>
```

**4 locations updated:**
- Desktop header button
- Mobile header button
- Mobile menu button
- Hero CTA button

**Kept:**
- "Track application" links still point to `/applicant/sign-in`

---

## 🗂️ Data Flow Examples

### **Council Publishing Notice**

1. Council user visits `/publish`
2. Wizard detects `userType = 'council'`
3. User completes 4-step wizard (Type → Upload → Confirm → Pay)
4. Clicks "Publish notice" button
5. Notice inserted into `notices` table (status='published')
6. Redirects to `/success?noticeId={id}`

### **Individual Applicant Submitting**

1. Unauthenticated user visits `/publish` from homepage
2. Wizard detects `userType = 'applicant'`
3. User selects council from department selector
4. User completes 4-step wizard
5. Clicks "Submit application" button
6. Submission inserted into `submissions` table (status='new')
7. Magic link sent to applicant's email
8. Redirects to `/apply/success`

### **Solicitor Submitting**

1. Authenticated solicitor visits `/publish`
2. Wizard detects `userType = 'applicant'` (no council membership)
3. User selects council from department selector
4. User completes 4-step wizard
5. Clicks "Submit application" button
6. Submission inserted into `submissions` table (status='new')
7. **No magic link** (already authenticated)
8. Redirects to `/apply/success`

---

## ✅ Files Changed

### **Modified:**
1. `src/next/publish/flow/NewPublishFlow.tsx` (~150 lines added)
   - User detection logic
   - Department selector component
   - Context-aware submission handling
   - Adaptive hero text

2. `src/next/publish/flow/steps/PaymentStep.tsx` (~10 lines modified)
   - Added `submitButtonText` and `submitDescription` props
   - Made button text dynamic

3. `src/pages/Home.tsx` (4 lines modified)
   - Changed `/apply` → `/publish` in 4 locations

### **Kept (Not Deleted):**
- `src/pages/applicant/ApplicantSignIn.tsx` ✅
- `src/pages/applicant/ApplicantDashboard.tsx` ✅
- `src/pages/applicant/ApplicantSubmissionDetail.tsx` ✅
- `src/pages/ApplySuccessPage.tsx` ✅

These are still used for the passwordless tracking workflow.

### **Can Be Deleted (Optional Cleanup):**
- `src/pages/ApplyPage.tsx` ❌ (replaced by context-aware NewPublishFlow)
- `src/components/applicant/CouncilSelector.tsx` ❌ (replaced by inline DepartmentSelector)
- `src/pages/firm/*` ❌ (entire firm portal - replaced by applicant workflow)

---

## 🧪 Testing Checklist

### **Test 1: Unauthenticated Applicant Flow**
- [ ] Visit `http://localhost:5173`
- [ ] Click "Submit application" button
- [ ] Should redirect to `/publish`
- [ ] Should see "Submit your application" hero title
- [ ] Should see council selector dropdown
- [ ] Select a council
- [ ] Complete wizard with all existing features (OCR, address lookup, etc.)
- [ ] Click "Submit application" button
- [ ] Check `submissions` table for new record (status='new')
- [ ] Check email for magic link
- [ ] Click magic link → redirects to `/applicant/dashboard`

### **Test 2: Authenticated Solicitor Flow**
- [ ] Sign in as solicitor (no council membership)
- [ ] Visit `/publish`
- [ ] Should see "Submit your application" title
- [ ] Should see council selector
- [ ] Complete wizard
- [ ] Submit application
- [ ] Check `submissions` table
- [ ] Should NOT receive magic link (already authenticated)

### **Test 3: Council User Flow**
- [ ] Sign in as council user
- [ ] Visit `/publish`
- [ ] Should see "Publish with calm, compliant confidence" title
- [ ] Should NOT see council selector
- [ ] Complete wizard
- [ ] Click "Publish notice" button
- [ ] Check `notices` table for new record (status='published')
- [ ] Should redirect to `/success?noticeId={id}`

### **Test 4: Council Review Workflow**
- [ ] Unauthenticated user submits application
- [ ] Sign in as council officer
- [ ] Navigate to `/c/{orgSlug}/{deptSlug}/submissions`
- [ ] See new application in queue
- [ ] Click "Start Review"
- [ ] Approve/Reject/Request Changes
- [ ] Applicant receives feedback

---

## 🎨 Design Consistency

All new UI elements match the existing design system:
- **rounded-3xl** cards
- **backdrop-blur-sm** glass effects
- **gradient backgrounds** (blue-50 to purple-50)
- **shadow-[0_2px_12px_rgba(0,0,0,0.04)]** shadows
- **Status badges** with consistent colors

---

## 💰 Revenue Impact (from PHASE_12_COMPLETE.md)

**Before:** Council-only publishing → £2M-£5M revenue potential

**After:** Two-sided marketplace → **£8M-£21M revenue potential** (4x increase!)

**Pricing Model:**
- Licensing applications: £100/submission
- Planning applications: £150/submission
- Council subscriptions: £500-£2,000/month
- Solicitor accounts: £200-£500/month

---

## 🚀 What's Next?

**Immediate:**
- [ ] Test all 4 user flows end-to-end
- [ ] Delete obsolete ApplyPage and firm portal (optional cleanup)

**Future Enhancements (Phase 13+):**
- Email notifications for status updates
- Payment integration (Stripe)
- Document uploads
- Advanced tracking dashboard

---

## 📝 Key Decisions Made

1. **Reused Existing Wizard Instead of Basic Form**
   - ✅ Preserves all sophisticated features (OCR, address lookup, collapsible sections)
   - ✅ No duplication of effort
   - ✅ Consistent UX for all users

2. **Context Detection vs Separate Routes**
   - ✅ Single `/publish` URL adapts based on user
   - ✅ Simpler mental model
   - ✅ Easier to maintain

3. **Database-Backed Department Selector**
   - ✅ Dynamic list from `departments` table
   - ✅ Supports multi-council environment
   - ✅ No hardcoded council list

4. **Preserved Passwordless Applicant Tracking**
   - ✅ Zero friction for individuals
   - ✅ No password management burden
   - ✅ Magic link for tracking

---

## 🎯 Summary

The existing NewPublishFlow wizard is now **fully context-aware**, serving both councils and applicants with a unified, sophisticated interface. All existing features (address lookup, OCR, collapsible forms, etc.) are preserved, and the system now supports the complete end-to-end application workflow:

**Applicants submit → Councils review → Publish → Public responds → Councils track**

**No basic ApplyPage needed** - the wizard handles everything! 🎉
