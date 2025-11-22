# Thursday Demo - Quick Reference Card

## 🚀 Pre-Demo Setup (2 minutes)

```bash
cd /Users/ottoclarke/projects/ubiquitous-guacamole
npm run dev
open http://localhost:5173/publish/step-1
```

## 📋 Demo Data (Copy-Paste Ready)

### Step 1: Select Notice Type
- **Action**: Expand "Licensing" → Click "New premises licence"

### Step 2: Fill Form

```
Confirmation Email: solicitor@wilsonpartners.com

Applicant name: Wilson & Partners LLP
Applicant status: Limited liability partnership (LLP)
Applicant address: 123 High Street, Bristol, BS1 2AA

Premises name: The Red Lion
Premises address: 45 Old Market Street, Bristol, BS2 0EJ

Activities:
✓ Sale of alcohol - On the premises
  Mon-Fri: 11:00 - 23:00 (use "Copy to weekdays")
  Sat: 10:00 - 00:00
  Sun: 12:00 - 22:00

DPS name: Jane Smith
DPS authority: Bristol City Council

Application date: (auto-filled - today)
Deadline: (auto-filled - today + 28 days)

Authority: Bristol City Council
Authority email: licensing@bristol.gov.uk
```

## 🎯 Key Talking Points

### On Activities & Hours
- "Notice the intelligent validation - DPS only required when alcohol is selected"
- "The system calculates the 28-day representation window automatically under LA2003"
- "Hours can be configured per activity with quick-copy tools"

### On Right-Rail Checklist
- "Real-time validation shows exactly what's complete"
- "Green checkmarks = field complete, Red X = action needed"

### On Preview
- "Generated notice text is professionally formatted and legally compliant"
- "Ready for immediate publication to newspaper or council website"

## ⚠️ Recovery Actions

### If page freezes:
```javascript
sessionStorage.clear();
location.reload();
```

### If server crashes:
```bash
lsof -ti tcp:5173 | xargs kill -9
npm run dev
```

### If validation stuck:
- Check console for errors (F12)
- Verify all required fields filled
- Check email format is valid

## ✅ Success Metrics

Demo successful if:
1. Complete flow Step 1 → Step 4 without errors
2. Bristol Council asks follow-up questions
3. Nick confident to pitch to other councils

---

**Time Budget**: 5 minutes total
- Step 1: 30 sec
- Step 2: 3 min (focus here)
- Step 3: 1 min
- Step 4: 30 sec

**Rehearse 3x before demo!**
