# Test Credentials for Civic Notices

## 🔐 Available Test Accounts

You can log in with any of these accounts:

### Admin Account (Platform Operator)
- **Email:** `ottoclarke@icloud.com`
- **Password:** `CivicAdmin2024!`
- **Type:** Platform Admin (Super Admin)
- **Portal:** Admin Portal at /admin/login

### Legacy Admin Account
- **Email:** `admin@civicnotices.co.uk`
- **Password:** `ChangeMeImmediately123!`
- **Type:** Platform Admin
- **Portal:** Either (has full access)

### Council Accounts

#### Westminster Council
- **Email:** `licensing@westminster.gov.uk`
- **Password:** `testpass123`
- **Type:** Council Officer
- **Portal:** Council Portal
- **Department:** Licensing

#### Sampletonborough Council
- **Email:** `licensing@sampletonborough.gov.uk`
- **Password:** `testpass123`
- **Type:** Council Officer
- **Portal:** Council Portal
- **Department:** Licensing

### Law Firm Account

#### Wilson Partners
- **Email:** `solicitor@wilsonpartners.com`
- **Password:** `testpass123`
- **Type:** Law Firm
- **Portal:** Professional Portal

---

## 🚀 How to Test

1. **Go to:** http://localhost:5173/login

2. **Choose Portal:**
   - **Council Portal** - for council accounts (Westminster, Sampletonborough)
   - **Professional Portal** - for law firm accounts (Wilson Partners)

3. **Enter Credentials:**
   - Use any of the emails/passwords above
   - Click "Sign In"

4. **Check Authentication:**
   - After login, go to: http://localhost:5173/auth-debug
   - You should see your organization context

---

## 🔍 What to Check at /auth-debug

### For Council Users (e.g., Westminster)
```
Organization ID: [UUID]
Organization Name: Westminster Council
Organization Type: council
Department: Licensing Department
Platform Admin: false
```

### For Law Firm Users (e.g., Wilson Partners)
```
Organization ID: [UUID]
Organization Name: Wilson Partners
Organization Type: firm
Department: null
Platform Admin: false
```

### For Admin User
```
Organization ID: [may be null or set]
Organization Name: [varies]
Platform Admin: true
Admin Role: super_admin
```

---

## ⚠️ Troubleshooting

### "Invalid login credentials"
- Make sure you're using the correct portal (Council vs Professional)
- Check the password is exactly as shown (case sensitive)

### Organization shows as NULL
1. Sign out completely
2. Sign back in (to get new JWT token)
3. Check /auth-debug again

### Can't see /auth-debug page
- Make sure you're logged in first
- Check console for errors
- Verify the route exists in App.tsx

---

## 📝 Creating Your Own Test Account

If you want to create a new account:

1. Go to http://localhost:5173/onboarding/council (for council)
   OR http://localhost:5173/onboarding/firm (for law firm)
2. Fill in the registration form
3. Use the new credentials to log in

---

## 🎯 Quick Test

**For Admin Dashboard** (http://localhost:5173/admin/login):
```
Email: ottoclarke@icloud.com
Password: CivicAdmin2024!
```

**For Council/Professional Portal** (http://localhost:5173/login):
```
Email: admin@civicnotices.co.uk
Password: ChangeMeImmediately123!
```

These accounts have full admin access to test everything!