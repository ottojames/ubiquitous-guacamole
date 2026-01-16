# Demo Authentication Setup Guide

## Current Status: PARTIAL ⚠️

The demo authentication infrastructure is partially set up but requires manual SQL execution in Supabase Dashboard to complete.

## What's Already Done ✅

1. **Organizations Created:**
   - Westminster Council (ID: `0e536037-48c3-4196-8fb6-c31803621050`)
   - Wilson & Partners LLP (ID: `550e8400-e29b-41d4-b001-446655440001`)

2. **Departments Created:**
   - Westminster Licensing Department (ID: `2145bf45-da2d-421d-8d8e-8ad46bc6bbef`)
   - Westminster Planning Department

3. **Council Settings Configured:**
   - All councils have authority_address, authority_email, and online_register_url set

4. **SQL Migration File Ready:**
   - Complete migration script at: `supabase/migrations/20260115_setup_demo_auth.sql`

## What Needs To Be Done ❌

### Step 1: Run SQL Migration in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the ENTIRE contents of `supabase/migrations/20260115_setup_demo_auth.sql`
6. Click "Run" button
7. Wait for completion

### Step 2: Verify Demo Accounts Work

After running the SQL migration, test the accounts:

```bash
npx tsx scripts/test-demo-logins.ts
```

## Demo Accounts (After SQL Migration)

### Council Portal
- **Email:** licensing@westminster.gov.uk
- **Password:** testpass123
- **Portal:** Council Portal → Westminster → Licensing Department

### Professional Portal
- **Email:** solicitor@wilsonpartners.com
- **Password:** testpass123
- **Portal:** Professional Portal → Wilson & Partners

## Alternative: Create Accounts via Supabase Dashboard

If the SQL migration doesn't work, you can manually create the accounts:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite User"
3. Enter email and set password
4. After creation, link them to organizations:

For Westminster Council user:
```sql
-- Get the user ID from the Auth dashboard, then run:
INSERT INTO department_memberships (department_id, user_id, role)
VALUES ('2145bf45-da2d-421d-8d8e-8ad46bc6bbef', '<USER_ID>', 'dept_admin');
```

For Wilson Partners user:
```sql
-- Get the user ID from the Auth dashboard, then run:
INSERT INTO organization_memberships (organization_id, user_id, role)
VALUES ('550e8400-e29b-41d4-b001-446655440001', '<USER_ID>', 'org_admin');
```

## Troubleshooting

### Error: "Invalid login credentials"
- The user doesn't exist in auth.users table
- Solution: Run the SQL migration or create manually

### Error: "Database error querying schema"
- The auth schema has issues
- Solution: Check Supabase logs for specific error

### Error: "Organization not found"
- The organization IDs don't match
- Solution: Verify organization exists with correct ID

## Testing After Setup

1. **Test Login Script:**
   ```bash
   npx tsx scripts/test-demo-logins.ts
   ```

2. **Browser Testing:**
   - Start dev server: `npm run dev`
   - Navigate to http://localhost:5173/login
   - Select "Council Portal" or "Professional Portal"
   - Use the demo credentials above

## Important Notes

- The auth.users table CANNOT be modified via the Supabase client library
- User creation must be done via SQL Editor or Dashboard
- Passwords must be hashed using Supabase's crypt() function
- Email confirmation must be set to avoid verification requirements

## Files for Reference

- SQL Migration: `supabase/migrations/20260115_setup_demo_auth.sql`
- Test Script: `scripts/test-demo-logins.ts`
- Setup Scripts: `scripts/setup-demo-auth-workaround.ts`
- Organization Setup: `scripts/ensure-wilson-partners-org.ts`