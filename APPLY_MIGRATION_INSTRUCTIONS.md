# 🚨 CRITICAL: Apply RLS Migration to Fix Submissions

## Current Status: ❌ NOT APPLIED

The diagnostic test confirms the RLS policy is **NOT in your database**.

Without this migration, anonymous applicants **CANNOT** submit licensing applications.

---

## ✅ Step-by-Step Instructions (5 minutes)

### Step 1: Open Supabase Dashboard
Click this link (opens in new tab):
👉 **https://supabase.com/dashboard/project/puemqhpqxgrvrukyrfkm/sql/new**

If you're not logged in, log in to your Supabase account first.

---

### Step 2: Open the SQL Editor
You should now see a blank SQL editor with a text area.

The page should say "SQL Editor" at the top.

---

### Step 3: Copy the SQL
The SQL is in your clipboard already from earlier, but if you need it again:

```bash
cat /Users/ottoclarke/projects/ubiquitous-guacamole/apply-rls-fix.sql | pbcopy
```

Or manually open the file `apply-rls-fix.sql` in VS Code and copy all contents.

---

### Step 4: Paste into SQL Editor
1. Click inside the SQL editor text area
2. Press **Cmd+V** to paste
3. You should see about 140 lines of SQL starting with:
   ```sql
   -- ============================================================================
   -- RLS MIGRATION: Enable Anonymous Public Submissions
   ```

---

### Step 5: Run the SQL
Click the **"RUN"** button in the top-right corner of the SQL editor.

OR press **Cmd+Enter** on your keyboard.

---

### Step 6: Verify Success
After running, you should see:
- ✅ A success message saying "Success. No rows returned"
- ✅ A table at the bottom showing the created policies

If you see any **red error messages**, copy them and send them to me.

---

### Step 7: Test It Works
Run this command in your terminal:

```bash
node scripts/diagnose-rls.cjs
```

You should see:
```
✅ INSERT SUCCEEDED!
✨ RLS POLICY IS WORKING!
```

---

## Alternative: Manual Step-by-Step Execution

If the full SQL fails, you can run each section individually:

### 1. Make Columns Nullable
```sql
ALTER TABLE public.submissions
  ALTER COLUMN source_organization_id DROP NOT NULL;

ALTER TABLE public.submissions
  ALTER COLUMN submitted_by DROP NOT NULL;
```

### 2. Update Validation Trigger
```sql
CREATE OR REPLACE FUNCTION validate_submission_organizations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = NEW.source_organization_id AND type = 'firm'
    ) THEN
      RAISE EXCEPTION 'Submissions can only be created by firm organizations';
    END IF;
  END IF;

  SELECT organization_id INTO NEW.target_organization_id
  FROM public.departments
  WHERE id = NEW.target_department_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.target_organization_id AND type = 'council'
  ) THEN
    RAISE EXCEPTION 'Submissions can only target council departments';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Create RLS Policy
```sql
DROP POLICY IF EXISTS submissions_insert_policy ON public.submissions;

CREATE POLICY submissions_insert_policy ON public.submissions
FOR INSERT
WITH CHECK (
  (
    auth.uid() IS NOT NULL
    AND source_organization_id IN (
      SELECT organization_id
      FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  )
  OR
  (
    auth.uid() IS NULL
    AND source_organization_id IS NULL
  )
);
```

---

## 🆘 If You Get Stuck

1. **Screenshot the error** and send it to me
2. **Try running one section at a time** (see Alternative above)
3. **Check your Supabase account permissions** - you need to be the project owner

---

## Why This Matters

Without this migration:
- ❌ Anonymous users get "row-level security policy" error
- ❌ Public applicants cannot submit licensing applications
- ❌ The entire applicant flow is broken

With this migration:
- ✅ Anonymous users can submit applications
- ✅ Council/firm authenticated users can still submit
- ✅ Full applicant workflow works end-to-end

---

## After Applying

1. **Refresh your app** (hard refresh: Cmd+Shift+R)
2. **Go to** http://localhost:5173/publish/step-1
3. **Select a council** and notice type
4. **Fill out the form**
5. **Click "Send to Council"**
6. **Should work!** 🎉
