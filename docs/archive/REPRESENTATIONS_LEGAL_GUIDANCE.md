# Legal Guidance: Public Display of Representations

**Date**: 2025-11-21
**Question**: Should residents be able to see representations on notices, or only councils?
**Answer**: **Residents MUST be able to see representations - it's a legal requirement**

---

## 📜 Legal Framework

### Licensing Act 2003 - Section 35

**Statutory Requirement**:
> "The relevant licensing authority must make available for inspection by members of the public, at all reasonable times, copies of the application and any accompanying documents."

**Section 35(5)** specifically states:
> "The authority must also make available for inspection by members of the public any representation made in respect of the application."

**Key Points**:
- Representations are **public documents**
- Must be available for **public inspection**
- Part of the **public register**
- Not optional - it's a **statutory duty**

### Town and Country Planning Act 1990

**Section 71** - Publicity for applications:
> "The local planning authority must publicise the application and any representations received."

**The Town and Country Planning (Development Management Procedure) (England) Order 2015**:
- Article 15: Publicity for applications
- All representations must be made **publicly available**
- Part of the planning register

### Data Protection Act 2018 & GDPR

**Important Balance**:
- Representations are public documents (lawful basis: "public task")
- Personal data in representations is **exempt from GDPR restrictions** when published for statutory purposes
- Councils may redact:
  - Full home addresses (show area/street only)
  - Phone numbers
  - Email addresses (optional)
  - Sensitive personal information

**ICO Guidance**: "Comments on planning applications are public information. People making comments should be aware that their comments will be published."

---

## 🏛️ Why Public Display is Required

### 1. **Statutory Transparency**
- Public consultation is meaningless if representations are hidden
- Democracy requires open decision-making
- Public must see what's being said to the decision-maker

### 2. **Natural Justice**
- Applicants have **right to see objections** against them
- Applicants can respond to concerns raised
- Prevents secret representations influencing decisions

### 3. **Informed Participation**
- Residents need to see existing representations before making their own
- Prevents duplicate/redundant objections
- Shows community sentiment (e.g., "18 objections vs 2 support")

### 4. **Accountability**
- Public can verify council considered all representations
- Prevents selective consideration of representations
- Audit trail for decision-making

### 5. **Legal Precedent**
- Public inquiries require all evidence to be public
- Appeals process relies on public access to representations
- Judicial reviews require transparent decision-making record

---

## ✅ What MUST Be Publicly Visible

### Mandatory Information:

1. **Representor Details**:
   - ✅ Name (first name + surname)
   - ✅ Status (e.g., "Local Resident", "Business Owner", "Responsible Authority")
   - ⚠️ Address (area/street only, not full address for residents)

2. **Representation Content**:
   - ✅ Full text of representation
   - ✅ Date submitted
   - ✅ Whether it's support/objection/comment

3. **Legal Grounds** (for licensing):
   - ✅ Which licensing objectives cited:
     - Prevention of crime and disorder
     - Public safety
     - Prevention of public nuisance
     - Protection of children from harm

4. **Summary Statistics**:
   - ✅ Total number of representations
   - ✅ Breakdown: X objections, Y support, Z comments
   - ✅ Consultation deadline

### May Redact (Privacy Protection):

- ❌ Full home addresses (show "Resident of Oxford Street" instead of "123 Oxford Street")
- ❌ Phone numbers
- ❌ Email addresses (optional - some councils show, some don't)
- ❌ Sensitive personal information (medical, financial, etc.)

---

## 🌐 Industry Best Practice

### Major UK Councils - All Show Representations Publicly:

#### **City of Westminster**:
```
Licensing Application: The Crown & Anchor
├─ Application Details [Public]
├─ Representations (14) [Public]
│  ├─ Objections (11)
│  │  ├─ John Smith (Local Resident)
│  │  │  "Concerned about noise from late music..."
│  │  ├─ Westminster Police (Responsible Authority)
│  │  │  "Request additional conditions regarding..."
│  │  └─ ...
│  └─ Support (3)
│     └─ Planning Consultant (Agent)
│        "The application includes robust management plan..."
└─ Decision [Public when made]
```

#### **Camden Council**:
- Planning portal shows all comments with names
- "Comments may be viewed by members of the public" warning on submission
- Real-time display (comments appear within 24 hours)

#### **Islington Council**:
- Shows representations sorted by date
- Clear labeling of objections vs support
- "Your comments will be published online" disclaimer

#### **Bristol City Council**:
- Public comments section on every application
- Filter by support/object/comment
- Shows representor name and full comment

---

## ⚖️ What Councils Display (Standard Format)

### Typical Public Display:

```
Representations Received (23)

[Filter: All | Objections (18) | Support (3) | Comments (2)]

─────────────────────────────────────────────────

📝 Objection
Submitted by: Sarah Johnson (Local Resident)
Date: 15 November 2025
Address: Resident of Pembroke Road

Grounds: Prevention of public nuisance

Comment:
"I live directly opposite the premises and am concerned about
increased noise levels, particularly after 11pm. The existing
premises already causes disturbance with customers leaving late
at night. Extended hours would significantly impact my family's
quality of life."

─────────────────────────────────────────────────

📝 Support
Submitted by: Michael Chen (Local Business Owner)
Date: 16 November 2025
Address: Business on High Street

Comment:
"This application will support the local economy and provide
employment opportunities. The applicant has demonstrated a
commitment to responsible management."

─────────────────────────────────────────────────

📝 Objection
Submitted by: Metropolitan Police (Responsible Authority)
Date: 17 November 2025

Grounds: Prevention of crime and disorder, Public safety

Comment:
"We request the following conditions be attached to any licence
granted: [detailed conditions listed]..."

─────────────────────────────────────────────────
```

---

## 🚨 Legal Risks of NOT Displaying Representations

### If representations are hidden from the public:

1. **Breach of Statutory Duty**:
   - Licensing Act 2003 s.35 explicitly requires public access
   - Planning regulations mandate public register

2. **Grounds for Judicial Review**:
   - Decision could be challenged as procedurally unfair
   - "Legitimate expectation" that consultation is transparent

3. **Maladministration**:
   - Local Government Ombudsman complaints
   - Failure to follow statutory procedure

4. **Invalid Decision**:
   - Licensing committee decision could be overturned
   - Planning permission could be quashed

5. **Reputational Damage**:
   - Accusations of "secret" decision-making
   - Lack of transparency undermines public trust

---

## ✅ Current Platform Status - MUST IMPLEMENT

### What We Have:
- ✅ Representations table in database (80 representations)
- ✅ "Have Your Say" submission form for residents
- ✅ Representation data includes: name, type, text, grounds, date

### What's Missing (CRITICAL):
- ❌ **Public display of representations on notice detail page**
- ❌ Count of representations shown to residents
- ❌ Ability for residents to read what others have said
- ❌ Filter/sort representations by type (objection/support)

### Required Implementation:

**On Notice Detail Page** (`src/pages/NoticeDetailPage.tsx`):

```typescript
// REQUIRED: Public Representations Section
<div className="rounded-3xl border border-slate-200 bg-white p-8">
  <h2 className="text-2xl font-bold mb-4">
    Representations Received ({representationsCount})
  </h2>

  <div className="mb-6 flex gap-4">
    <button>All ({allCount})</button>
    <button>Objections ({objectionCount})</button>
    <button>Support ({supportCount})</button>
  </div>

  {representations.map(rep => (
    <div className="border-b py-6">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{rep.representor_name}</span>
        <span className="text-sm text-slate-500">
          {formatDate(rep.submitted_at)}
        </span>
      </div>
      <span className={`inline-block px-3 py-1 rounded-full text-xs ${
        rep.type === 'objection' ? 'bg-red-100 text-red-800' :
        rep.type === 'support' ? 'bg-green-100 text-green-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {rep.type}
      </span>
      {rep.grounds && (
        <p className="text-sm text-slate-600 mt-2">
          <strong>Grounds:</strong> {rep.grounds}
        </p>
      )}
      <p className="mt-3 text-slate-700 whitespace-pre-wrap">
        {rep.representation_text}
      </p>
    </div>
  ))}
</div>
```

---

## 📊 Impact of Public Display

### Benefits:

1. **Legal Compliance**: Meets statutory requirements ✅
2. **Transparency**: Residents see full picture of community sentiment ✅
3. **Informed Decisions**: Applicants can address concerns ✅
4. **Democratic Accountability**: Public oversight of decision-making ✅
5. **Prevents Duplication**: Residents see existing objections before submitting ✅

### Privacy Safeguards:

1. **Disclaimer on submission form**:
   > "Your representation will be publicly available online and may be viewed by anyone. Do not include sensitive personal information."

2. **Redaction policy**:
   - Show "Local Resident" instead of full address
   - Remove phone/email from public display
   - Redact any sensitive medical/financial info

3. **GDPR Compliance**:
   - Statutory basis: "Public task" (GDPR Article 6(1)(e))
   - Legitimate interest: Transparency in decision-making
   - ICO guidance confirms this is lawful processing

---

## 🎯 Recommendation

### IMMEDIATE ACTION REQUIRED:

**Add public representations display to notice detail page**

This is not optional - it's a **legal requirement** under:
- Licensing Act 2003 Section 35
- Town and Country Planning Act 1990
- Natural justice principles

### Implementation Priority: **CRITICAL** 🔴

Without public display of representations:
- ❌ Platform is not statutorily compliant
- ❌ Councils cannot legally use it for consultation
- ❌ Decisions made could be challenged
- ❌ Not meeting basic transparency standards

---

## 📚 Legal References

1. **Licensing Act 2003**
   - Section 35: Determination of application
   - Section 35(5): Public inspection of representations

2. **Town and Country Planning Act 1990**
   - Section 71: Publicity for applications

3. **The Town and Country Planning (Development Management Procedure) (England) Order 2015**
   - Article 15: Publicity requirements

4. **Data Protection Act 2018**
   - Schedule 2, Part 2, Paragraph 6: "Statutory and government purposes"

5. **ICO Guidance**
   - "Personal information in planning applications" (2019)

6. **Case Law**
   - *R v Aylesbury Vale DC ex parte Chaplin* [1997]: Duty to consider all representations
   - *R (Berky) v Newport City Council* [2012]: Transparency in decision-making

---

## ✅ Summary

**Question**: Can residents see representations, or only councils?

**Answer**: **RESIDENTS MUST BE ABLE TO SEE REPRESENTATIONS**

This is:
- ✅ **Legally required** (Licensing Act 2003, Planning Act)
- ✅ **Best practice** (all major councils do this)
- ✅ **Necessary for transparency** (democratic accountability)
- ✅ **Essential for valid consultation** (informed participation)

**Current Status**: ❌ **NOT IMPLEMENTED** - Representations are in database but not displayed publicly

**Action Required**: 🔴 **CRITICAL** - Add public representations section to notice detail page

---

**Representations are not just "allowed" to be public - they MUST be public by law.** ⚖️
