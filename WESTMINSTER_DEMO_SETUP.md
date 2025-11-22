# Westminster Council Demo Setup

## Overview
This setup allows you to demo as **Westminster City Council** using a safe demo email that won't actually send to the real Westminster Council.

## Demo Login Credentials

**Email:** `westminster-demo@civicnotices.co.uk`
**Password:** `WestminsterDemo123!`
**Portal Type:** Council Portal

---

## Setup Instructions

### Step 1: Run the SQL Setup Script

1. Open **Supabase Dashboard**: https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `/tmp/setup_westminster_demo_FINAL.sql`
4. Click **Run**

This script will:
- ✅ Ensure Westminster City Council exists in database
- ✅ Create Westminster Licensing Department
- ✅ Create the demo user account
- ✅ Grant the demo user "Department Admin" access to Westminster Licensing

### Step 2: Verify the Setup

After running the SQL script, you should see verification output showing:
- Westminster Organization details
- Westminster Licensing Department details
- Demo User Permission confirmation

### Step 3: Test the Login

1. Navigate to: `http://localhost:5173/auth/sign-in`
2. Select **"Council Portal"**
3. Enter:
   - Email: `westminster-demo@civicnotices.co.uk`
   - Password: `WestminsterDemo123!`
4. Click **Sign In**
5. You should be redirected to the **Workspace Selector** showing:
   - **Westminster City Council - Licensing** (with Department Admin role)
6. Click on **"Westminster City Council - Licensing"**
7. You'll be taken to: `/c/westminster/licensing/dashboard`

---

## What Changed

### Login.tsx Updated
- **Removed:** Hardcoded bypass logins (`demo@council.gov.uk`)
- **Added:** Comment indicating to use `westminster-demo@civicnotices.co.uk`
- **Benefit:** Uses real Supabase authentication with proper database permissions

### Database Setup
- **Westminster Council:** Safely configured with demo email addresses
- **Demo User:** Created with proper authentication credentials
- **Permissions:** Department Admin role for Westminster Licensing

---

## For Tomorrow's Demo

### Login Flow:
1. Go to login page
2. Select **Council Portal**
3. Enter Westminster demo credentials
4. Click department card to access Westminster dashboard

### Demo Features:
- **Council Name:** Westminster City Council (looks professional!)
- **Email Safety:** All emails go to `westminster-demo.civicnotices.co.uk` (not real Westminster)
- **Full Access:** Department Admin permissions = can create templates, manage notices, etc.
- **Professional:** Looks like real Westminster without actually contacting them

### URLs for Demo:
- Login: `http://localhost:5173/auth/sign-in`
- Workspace Selector: `http://localhost:5173/auth/switch-context`
- Westminster Dashboard: `http://localhost:5173/c/westminster/licensing/dashboard`
- Westminster Templates: `http://localhost:5173/c/westminster/licensing/templates`
- Westminster Notices: `http://localhost:5173/c/westminster/licensing/notices`

---

## Troubleshooting

### Issue: "You don't have access to any departments"
**Solution:** Make sure you ran the SQL script in Step 1. The script creates the department membership.

### Issue: Login redirects to workspace selector instead of dashboard
**Solution:** This is correct! Click on "Westminster City Council - Licensing" card to access the dashboard.

### Issue: Can't see Westminster in the workspace selector
**Solution:** Check that the SQL script ran successfully. Verify the user exists:
```sql
SELECT * FROM auth.users WHERE email = 'westminster-demo@civicnotices.co.uk';
SELECT * FROM department_memberships dm
INNER JOIN auth.users u ON dm.user_id = u.id
WHERE u.email = 'westminster-demo@civicnotices.co.uk';
```

---

## File Locations

- SQL Setup Script: `/tmp/setup_westminster_demo_FINAL.sql`
- Updated Login: `src/pages/Login.tsx`
- This Guide: `WESTMINSTER_DEMO_SETUP.md`

---

## Ready for Demo! ✅

You can now demo Westminster City Council safely without any risk of contacting the real Westminster Council.
