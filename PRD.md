# Civic Notices Platform - PRD

## Status: IN PROGRESS

Major refactoring and bug fixes following user walkthrough review.

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Total Tasks**: 35

---

## Phase 0: Prerequisites [S]

**Why**: Ensures all dependencies are in place before starting any task. Prevents wasted time debugging environment issues mid-implementation.

**Depends on**: None

### Tasks

- [x] `[S]` **Create and run environment verification script** - Create `scripts/verify-env.sh` that checks:
  - `RESEND_API_KEY` exists in `.env` (grep check, do NOT hit external API)
  - `VITE_SUPABASE_URL` exists in `.env`
  - `VITE_SUPABASE_ANON_KEY` exists in `.env`
  - `SUPABASE_SERVICE_ROLE_KEY` exists in `.env`
  - `npm run dev` starts without error (timeout after 10s, check for "Server running on port 5174")
  - Script exits 0 if all pass, exits 1 with clear message if any fail

  **File**: `scripts/verify-env.sh` (new)

### Definition of Done

1. `scripts/verify-env.sh` exists and is executable (`chmod +x`)
2. Running `./scripts/verify-env.sh` exits with code 0
3. Script outputs clear PASS/FAIL for each check (env vars + server startup)

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| `[CRITICAL]` | Security vulnerability or data integrity issue - must fix immediately |
| `[HIGH]` | Core functionality broken - users cannot complete key workflows |
| `[MEDIUM]` | Important improvement - impacts user experience significantly |
| `[LOW]` | Nice to have - polish and enhancements |

## Complexity Legend

| Tag | Effort |
|-----|--------|
| `[S]` | Small - < 30 mins, single file change |
| `[M]` | Medium - 1-2 hours, multiple files |
| `[L]` | Large - Half day, new features or significant refactor |
| `[XL]` | Extra Large - Full day+, architectural changes or new systems |

---

## Phase 1: Department Data Isolation [CRITICAL]

**Why**: Planning department users can currently see ALL notices from Licensing, Environmental Health, etc. This is a serious data access violation that could expose confidential consultation details between departments.

**Depends on**: None (must be done first)

### Tasks

- [x] `[CRITICAL]` `[M]` **Remove demo mode bypass in Dashboard** - Delete the `isDemoMode` condition that fetches all notices via public API. This is the root cause of cross-department data leakage.

  **File**: `src/pages/council/Dashboard.tsx:84-89`, `src/pages/council/Dashboard.tsx:94-178`

- [x] `[CRITICAL]` `[M]` **Enforce department_id filter on all council portal queries** - Audit and fix: Dashboard notices, Representations, Analytics. Ensure `.eq('department_id', department.id)` is applied consistently.

  **Files**: `src/pages/council/Dashboard.tsx:180-186`, `src/pages/council/Representations.tsx:116-131`, `src/pages/council/Analytics.tsx`

- [x] `[CRITICAL]` `[L]` **Add database-level RLS policies for department isolation** - Defense in depth: even if frontend filter is bypassed, database should reject cross-department queries.

  ```sql
  -- Add to new migration
  CREATE POLICY "Users see notices in their departments"
  ON notices FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "Users see representations for their department notices"
  ON representations FOR SELECT
  TO authenticated
  USING (
    notice_id IN (
      SELECT id FROM notices WHERE department_id IN (
        SELECT department_id FROM department_memberships
        WHERE user_id = auth.uid()
      )
    )
  );
  ```

  **Rollback**:
  ```sql
  DROP POLICY IF EXISTS "Users see notices in their departments" ON notices;
  DROP POLICY IF EXISTS "Users see representations for their department notices" ON representations;
  ```

### Definition of Done

1. Login as Licensing department user → Dashboard shows 0 Planning notices, 0 Environmental Health notices
2. Switch to Planning department → Dashboard notice count is 0 (or matches only Planning-type notices in DB)
3. Run `SELECT * FROM notices` in Supabase SQL editor as authenticated user → returns only department-scoped rows
4. API call `GET /api/notices?department_id=wrong-uuid` returns 403 or empty array
5. No JavaScript console errors on Dashboard, Representations, or Analytics pages

---

## Phase 2: Fix Representation Comments [HIGH]

**Why**: Council staff cannot respond to or annotate public representations. This blocks a core workflow - staff need to coordinate internally on how to respond to objections.

**Depends on**: Phase 1 (needs department isolation to work correctly)

### Tasks

- [x] `[HIGH]` `[M]` **Debug and fix comment insertion failure** - Open DevTools, attempt to add comment, capture error. Likely causes: missing RLS INSERT policy, incorrect field mapping, or auth context not passed.

  **File**: `src/components/council/InternalComments.tsx:58-88`

- [x] `[HIGH]` `[M]` **Add/fix RLS policies for internal_comments table** - Ensure department members can INSERT and SELECT comments.

  ```sql
  CREATE POLICY "Department members can insert comments"
  ON internal_comments FOR INSERT TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "Department members can view comments"
  ON internal_comments FOR SELECT TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid()
    )
  );
  ```

  **Rollback**:
  ```sql
  DROP POLICY IF EXISTS "Department members can insert comments" ON internal_comments;
  DROP POLICY IF EXISTS "Department members can view comments" ON internal_comments;
  ```

- [x] `[MEDIUM]` `[S]` **Add success toast and improved error handling** - Show confirmation when comment added, show helpful error message on failure.

  **File**: `src/components/council/InternalComments.tsx`

### Definition of Done

1. Click "Add comment" button → comment text appears in comment list within 2 seconds
2. Page refresh → comment persists (visible in list)
3. Network tab shows 201 response from Supabase insert
4. Invalid submission (empty comment) → inline error message appears (not alert/console)
5. Success submission → toast notification with "Comment added" message

---

## Phase 3: Fix Team Invitations [HIGH]

**Why**: Council admins cannot invite colleagues to join their department. This blocks onboarding entirely - the first council to sign up cannot add their team.

**Depends on**: Phase 1 (needs department context)

### Tasks

- [x] `[HIGH]` `[L]` **Create invitations database table and API** - Build the full invitation flow: table, RLS policies, API endpoints for create/accept.

  ```sql
  CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    token UUID DEFAULT gen_random_uuid(),
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'org_admin', 'department_admin')
    )
  );
  ```

  **Files**: `supabase/migrations/[timestamp]_invitations.sql` (new), `server/routes/invitations.ts` (new)

  **Rollback**: `DROP TABLE IF EXISTS invitations;`

- [x] `[HIGH]` `[M]` **Wire up invitation email via Resend** - Create email template with accept link, department info, expiry warning.

  **File**: `server/services/email.ts`

- [x] `[HIGH]` `[M]` **Create invitation acceptance page** - Handle token validation, account creation/linking, department_membership creation.

  **File**: `src/pages/AcceptInvitation.tsx` (new)

- [x] `[MEDIUM]` `[S]` **Update Team page to call API and show pending invitations** - Replace direct Supabase insert with API call, display pending invites with cancel option.

  **File**: `src/pages/council/Team.tsx:83-123`

### Definition of Done

1. Resend API key verified working (Phase 0 prerequisite passed)
2. Enter email + click "Send invitation" → success toast appears, no error in console
3. Check Resend dashboard → email queued/sent within 60 seconds
4. Email contains: inviter name, department name, accept link, expiry date
5. Click accept link → redirects to login/signup, then to department dashboard
6. After acceptance → new user appears in Team page member list with correct role
7. Attempt to accept expired invitation (7+ days old) → error message, not added to team

---

## Phase 4: Template Editor Cursor Bug [HIGH]

**Why**: Council staff cannot edit notice templates properly. The cursor jumps to the top when trying to edit in the middle of a document, making template customization nearly impossible.

**Depends on**: None

### Tasks

- [x] `[HIGH]` `[M]` **Diagnose and fix cursor position loss** - The textarea/editor is likely using a controlled component pattern that resets selection on every keystroke. Fix by using refs and preserving selectionStart/selectionEnd.

  **File**: `src/pages/council/TemplateTextEditor.tsx`

  **Root cause**: contentEditable div was using `dangerouslySetInnerHTML={{ __html: value }}` which resets innerHTML on every parent re-render, causing cursor position loss.

  **Solution**: Track whether changes came from user input vs external props. Only reset innerHTML for external changes (like loading a template), not for user input. Used refs (`isUserInputRef`, `lastValueRef`) to track the source of changes.

- [x] `[MEDIUM]` `[S]` **Add template variable insertion without cursor disruption** - When inserting `{{APPLICANT_NAME}}` etc, maintain cursor position after variable.

  **File**: `src/pages/council/TemplateTextEditor.tsx:114-163`

  **Solution**: Replaced deprecated `execCommand('insertText')` with Range API for direct DOM manipulation. When inserting placeholders:
  - Creates a text node with the placeholder content
  - Uses `range.insertNode()` to insert at cursor position
  - Uses `range.setStartAfter(textNode)` and `range.setEndAfter(textNode)` to position cursor immediately after the inserted text
  - Works for both insertion at cursor and appending to end

### Definition of Done

1. Click in middle of template text → type 5 characters → cursor remains at insertion point (not jumped to line 1)
2. Select text in middle of template → type to replace → replacement happens at selection
3. Click "Insert variable" → variable inserted at cursor → cursor positioned immediately after variable
4. Template can be edited for 30+ seconds with multiple edits without cursor jumping

---

## Phase 5: Navigation Menu Consistency [HIGH]

**Why**: Users experience jarring transitions between pages. "Find notices" scrolls instead of navigating. Email Alerts page has completely different branding. This makes the product feel unfinished and unprofessional.

**Depends on**: None

### Tasks

- [x] `[HIGH]` `[M]` **Unify header component across all pages** - Ensure SiteHeader is used on Home, Pricing, EmailAlerts, Login. Remove custom headers that cause visual glitches.

  **Files**: `src/pages/EmailAlerts.tsx:211-228`, `src/pages/Pricing.tsx:98-130`, `src/components/SiteHeader.tsx`

  **Solution**: Replaced custom inline headers in EmailAlerts.tsx, Pricing.tsx, and Login.tsx with the shared SiteHeader component. Each page now imports and uses `<SiteHeader />` with the header-sentinel div for compact mode. Home.tsx already has its own header implementation that matches SiteHeader styling - leaving it as-is to avoid regression.

- [x] `[MEDIUM]` `[S]` **Fix "Find notices" link** - Change from `#notices` (anchor scroll) to `/notices` (route navigation).

  **Files**: `src/pages/Home.tsx:29-34`, `src/components/SiteHeader.tsx:42-56`

  **Solution**: Changed `href` from `#notices` / `/#notices` to `/notices` in both SiteHeader.tsx (desktop and mobile nav arrays) and Home.tsx (NAV_LINKS constant).

- [x] `[MEDIUM]` `[S]` **Add "Email alerts" to navigation consistently** - Add to SiteHeader nav links array.

  **File**: `src/components/SiteHeader.tsx:42-56`

  **Solution**: Added `{ href: '/email-alerts', label: 'Email alerts' }` to both desktop nav (line 44) and mobile nav (line 107) arrays in SiteHeader.tsx. Placed after "Find notices" for logical grouping of user-focused navigation items.

- [x] `[LOW]` `[S]` **Decide on "For councils" nav item** - Currently shows in navigation but unclear where it leads. Options: (1) Remove entirely, (2) Link to `/pricing` council section anchor, (3) Link to dedicated `/councils` landing page. Document decision in CLAUDE.md.

  **File**: `src/components/SiteHeader.tsx`

  **Decision**: Keep the current `/#for-councils` anchor link behavior. The Home page has a comprehensive "For councils" section with enterprise features, council logos, and detailed content. Creating a dedicated `/councils` page would be `[L]` complexity for marginal benefit. Decision documented in CLAUDE.md under "Navigation Decisions".

### Definition of Done

1. Navigate Home → Pricing → EmailAlerts → Login → Home: header appears identical on all pages (same logo, same links, same styling)
2. Click "Find notices" from Home page → URL changes to `/notices`, page navigates (not scrolls)
3. All pages include "Email alerts" link in navigation
4. No FOUC (flash of unstyled content) or layout shift during navigation
5. Mobile hamburger menu works identically on all pages

---

## Phase 6: Email Alerts Page Redesign [MEDIUM]

**Why**: The Email Alerts page looks like a different website entirely - different logo, no navigation, basic unstyled form. This damages user trust and reduces signups.

**Depends on**: Phase 5 (needs consistent header first)

### Tasks

- [x] `[MEDIUM]` `[L]` **Complete page redesign matching site design system** - Add hero section with gradient, redesign form using UI.card and consistent inputs, add footer.

  **File**: `src/pages/EmailAlerts.tsx` (substantial rewrite)

  **Solution implemented**:
  - Added hero section with gradient orbs, Bell icon with gradient background, and pageTitleLight/pageSubtitleLight typography
  - Used UI.pageWrap for consistent gradient band background
  - Form cards now use `rounded-lg bg-white shadow-sm ring-1 ring-slate-200` as specified
  - All inputs use UI design system tokens (UI.inputFull, UI.inputIconLeft, UI.label, etc.)
  - Added Mail and MapPin icons to email/postcode inputs
  - Used UI.alertSuccess/alertError/alertInfo for consistent messaging
  - Added Footer component at page bottom
  - Manage subscription view also uses card styling and consistent design

- [x] `[MEDIUM]` `[M]` **Wire up and test email subscription flow end-to-end** - Ensure Resend API key configured, verification emails sent, subscriptions created in database.

  **Files**: `server/routes/subscriptions.ts`, `server/services/email.ts`

  **Solution implemented**:
  - Created Supabase migration `20260122000005_email_subscriptions.sql` with:
    - `email_subscriptions` table with proper columns (id, email, postcode, lat, lng, radius_km, notice_types, is_verified, verification_token, unsubscribe_token, status)
    - `email_alerts_sent` table to track sent alerts and prevent duplicates
    - RLS policies for service role access
    - Indexes for efficient queries
  - Fixed radius validation in `server/routes/subscriptions.ts` to accept 0.5-50km range (was restricted to [0.5, 1, 2, 5])
  - Updated subscription creation to be more resilient in development mode:
    - In production: deletes subscription if email fails
    - In development: keeps subscription and returns verification token for testing

### Definition of Done

1. Resend API key verified working (Phase 0 prerequisite passed)
2. Page uses `SiteHeader` component (verified in React DevTools)
3. Form wrapped in container with `shadow-sm ring-1 ring-slate-200 rounded-lg` classes
4. Hero section has gradient background matching Home page (`bg-gradient-to-br from-blue-600`)
5. `axe-core` accessibility audit returns 0 critical/serious violations
6. Submit form with valid email/postcode → row created in `email_subscriptions` table with status='pending'
7. Verification email delivered within 120 seconds (check Resend dashboard)
8. Click verification link → subscription status changes to 'active'

---

## Phase 7: Homepage Community-First Messaging [MEDIUM]

**Why**: Homepage currently leads with "£50 per notice" - a sales pitch. But residents (the primary audience) don't buy notices, they search them. Sales messaging alienates the community and undermines trust.

**Depends on**: None

### Tasks

- [x] `[MEDIUM]` `[S]` **Rewrite hero headline and subtitle** - Change from sales-focused to community-focused. Current: "Publish legal notices digitally. £50 per notice." Target: "Stay informed about licensing and planning decisions in your area"

  **File**: `src/pages/Home.tsx:346-351`

  **Solution**: Changed headline from "Publish legal notices digitally. £50 per notice." to "Stay informed about licensing and planning decisions in your area". Changed subtitle from "Replace expensive newspaper ads with instant digital notices. Full audit trail included." to "Search statutory notices near you. Know what's happening in your community."

- [x] `[MEDIUM]` `[S]` **Reposition CTAs** - Primary CTA: "Search notices near you" (→ /notices). Move "Publish a Notice - £50" lower on page.

  **File**: `src/pages/Home.tsx:421-436`

  **Solution**: Swapped the hero CTAs:
  - Primary CTA: Changed from "Publish a Notice - £50" (→ /publish) to "Search notices near you" (→ /notices)
  - Secondary CTA: Changed from "Browse notices" (→ #notices) to "Publish a notice" (→ #publish, scrolls to publish section)
  - Updated supporting text from "No sign-up needed · Full audit trail · Save up to 85% vs newspapers" to "Free to search · No sign-up needed · Updated daily" (community-focused)
  - The publish section (line 690-785) already has full "Start publishing now" CTA with £50 pricing, so publish is now properly deferred to lower on page

- [x] `[LOW]` `[M]` **Add notices carousel** - Replace static grid with carousel showing recent notices, allowing users to browse without leaving homepage.

  **Files**: `src/components/home/NoticeCarousel.tsx` (new), `src/pages/Home.tsx:664-671`

  Requirements:
  - Display 12 most recent notices (fetch from `/api/notices?limit=12&sort=created_at:desc`)
  - Left/right arrow buttons for manual navigation
  - Dot indicators showing current position
  - 5-second autoplay between slides (pause on hover)
  - Keyboard accessible (arrow keys to navigate when focused)
  - Use framer-motion for animations (Embla was not installed; framer-motion was available)

  **Solution implemented**:
  - Created `NoticeCarousel.tsx` with framer-motion AnimatePresence for smooth page transitions
  - Shows 3 notices per page on desktop (CSS grid: lg:grid-cols-3), 2 on tablet, 1 on mobile
  - Left/right arrow buttons positioned outside carousel content area
  - Dot indicators show current page with active state (wider blue dot vs small slate dots)
  - 5-second autoplay with pause on hover/focus
  - Keyboard navigation (arrow keys) when carousel is focused
  - Updated `useNoticeSearch` limit from 5 to 12 for homepage

- [x] `[LOW]` `[S]` **Add footer tagline** - Add "Notice it. Understand it. Shape it." tagline to site footer across all pages.

  **File**: `src/components/Footer.tsx` (note: actual file is Footer.tsx not SiteFooter.tsx)

  **Solution**: Added tagline section between main links and copyright in Footer.tsx. Tagline uses text-base font-medium text-slate-700 styling to stand out slightly from surrounding content while remaining subtle.

### Definition of Done

1. Hero h1 text does NOT contain "£50" or "per notice"
2. Hero h1 text contains "informed" or "community" or "your area" (resident-focused language)
3. First/primary CTA button links to `/notices` (not `/publish`)
4. "Publish" CTA still exists but appears BELOW the latest notices section
5. Page loads in < 3 seconds on throttled 3G connection (Lighthouse)
6. Carousel displays 12 notices with arrow buttons and dot indicators
7. Carousel auto-advances every 5 seconds, pauses on hover
8. Footer contains "Notice it. Understand it. Shape it." text on all pages

---

## Phase 8: Sign-In Page UI Improvement [MEDIUM]

**Why**: The sign-in page looks "careless" with basic unstyled form elements. First-time users (especially council staff evaluating the product) form negative impressions.

**Depends on**: None

### Tasks

- [x] `[MEDIUM]` `[M]` **Redesign login form with professional styling** - Add gradient background, branded card container, icon-prefixed inputs, improved portal type toggle with descriptions, loading states.

  **File**: `src/pages/Login.tsx`

  Key changes:
  - Add gradient background matching other pages
  - Wrap form in styled card (shadow, rounded corners)
  - Add Mail/Lock icons to inputs
  - Improve Council vs Professional toggle with icons and descriptions
  - Add show/hide password toggle
  - Add loading spinner during sign-in

  **Solution implemented**:
  - Page already had gradient background: `linear-gradient(112deg, #223266 0%, #6EA3F7 53%, #F4F7FD 100%)`
  - Form card already had `rounded-xl` and `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
  - Email input already had Mail icon prefix
  - Password input already had Lock icon prefix
  - Portal toggle already had descriptive text (Council: "For council officers and licensing departments", Professional: "For solicitors, law firms & GVOL operators")
  - Added `showPassword` state and Eye/EyeOff toggle button on password input
  - Changed password input `type` from static "password" to dynamic based on `showPassword` state
  - Added `Loader2` icon with `animate-spin` class to submit button when `loading` is true
  - Button now shows spinner + "Signing in..." during request and is disabled

### Definition of Done

1. Page has visible gradient background (inspect: `bg-gradient-to-br` or similar class present)
2. Form card has `shadow` and `rounded-lg` (or equivalent) classes
3. Email input has Mail icon (Lucide `<Mail />` or similar) as prefix
4. Password input has Lock icon and show/hide toggle button
5. Portal toggle (Council/Professional) has descriptive text explaining each option
6. Click "Sign in" with valid credentials → button shows spinner, becomes disabled during request
7. `axe-core` returns 0 critical accessibility violations

---

## Phase 9: Pricing Page UI Fixes [MEDIUM]

**Why**: Gradient error makes text unreadable. Poor spacing looks unpolished. Residents landing here have no clear path to searching notices.

**Depends on**: None

### Tasks

- [x] `[MEDIUM]` `[S]` **Fix hero gradient error** - Text becomes unreadable at bottom edge. Add dark gradient overlay or solid background behind text.

  **File**: `src/pages/Pricing.tsx:98-103`

  **Solution**: Added a dark gradient overlay (`bg-gradient-to-b from-transparent via-transparent to-slate-900/30`) as the first child of the hero section. This overlay is transparent at the top and gradually darkens toward the bottom (30% opacity slate-900), ensuring white text remains readable even where the background gradient transitions to light colors.

- [x] `[MEDIUM]` `[S]` **Improve section spacing** - Add padding above/below "Why CivicNotices is the better way" section.

  **File**: `src/pages/Pricing.tsx:152`

  **Solution**: Increased vertical padding on the "Old Way vs New Way" section from `py-16 md:py-24` (64px/96px) to `py-20 md:py-28` (80px/112px). This provides at least 64px spacing as required by DoD, with comfortable separation from the hero section above.

- [x] `[LOW]` `[S]` **Add resident escape hatch** - Subtle link at top: "Just looking for notices? Search here →"

  **File**: `src/pages/Pricing.tsx`

  **Solution**: Added a subtle link between SiteHeader and hero section with "Just looking for notices? Search here →" text. Uses white/80 opacity text on the dark gradient background with hover state, ArrowRight icon, and links to /notices. Visible without scrolling (above the fold).

- [ ] `[LOW]` `[S]` **Highlight council free portal better** - Make FREE more prominent, clarify "only pay when YOU publish".

  **File**: `src/pages/Pricing.tsx:309-334`

### Definition of Done

1. Hero text passes WCAG AA contrast ratio (use Chrome DevTools color picker to verify 4.5:1 minimum)
2. At least 64px (`py-16` or `my-16`) vertical spacing between hero and "Why CivicNotices" section
3. Page contains link to `/notices` visible without scrolling (above the fold on 1080p)
4. Council pricing card contains text "FREE" in font-size >= 24px

---

## Phase 10: Council Portal Settings & Billing [MEDIUM]

**Why**: Settings page looks "terrible" and "basic" - unstyled form with no visual hierarchy. Billing section shows confusing "Free plan" with "Change plan" button when portal IS free. Professional councils expect polished admin interfaces.

**Depends on**: None

### Tasks

- [ ] `[MEDIUM]` `[M]` **Redesign settings with proper sections and cards** - Group into logical sections (Authority Details, Notification Preferences, Billing), add visual dividers, improve form styling, add help text explaining auto-population.

  **File**: `src/pages/council/Settings.tsx`

- [ ] `[MEDIUM]` `[S]` **Clarify billing messaging** - Change "Free plan" to "Council Portal (FREE)". Add explanation: "Free to receive and manage notices. Only pay £19.99/notice when YOU publish." Remove or clarify "Change plan" button.

  **File**: `src/pages/council/Settings.tsx` (billing section)

- [ ] `[LOW]` `[S]` **Add save confirmation toast and inline validation** - Show success feedback, validate email/phone/URL formats inline.

  **File**: `src/pages/council/Settings.tsx:118-150`

### Definition of Done

1. Settings page has at least 3 distinct sections with visible headings (Authority Details, Notifications, Billing)
2. Each section wrapped in card with `border` or `ring` styling
3. "Authority details" section contains help text explaining auto-population
4. Billing section header contains "FREE" text (not hidden)
5. Billing section explains when costs apply ("Only pay when YOU publish")
6. "Change plan" button either removed OR has tooltip explaining what it does
7. Click "Save" → toast notification appears confirming save
8. Enter invalid email format → inline error message appears near field

---

## Phase 11: Analytics Page Styling [LOW]

**Why**: Page looks "lurid" with overly bright colors. Also shows hardcoded "Westminster City Council" instead of actual org name.

**Depends on**: Phase 1 (needs department isolation for accurate data)

### Tasks

- [ ] `[LOW]` `[S]` **Reduce color saturation and fix org name** - Use muted colors consistent with site design tokens, replace hardcoded org name with actual context value.

  **File**: `src/pages/council/Analytics.tsx`

- [ ] `[LOW]` `[S]` **Add data source indicators** - Label data as "Live", "Projected", or "Sample" so users know if they're seeing real metrics.

  **File**: `src/pages/council/Analytics.tsx`

### Definition of Done

1. No color on page has saturation > 70% (check with color picker tool)
2. Organization name displayed matches logged-in user's organization (not "Westminster City Council")
3. Each metric card/chart has visible label indicating data source (Live/Projected/Sample)
4. Color palette uses only design tokens from `src/styles/ui.ts`

---

## Phase 12: Department-Specific Dashboards [LOW]

**Why**: Currently all department dashboards are identical copies. Licensing has different workflows than Planning - each needs tailored metrics and notice type filters.

**Depends on**: Phase 1 (needs department isolation working)

### Tasks

- [ ] `[LOW]` `[L]` **Research and document which departments legally require public notices** - Verify: Licensing (Licensing Act 2003), Planning (Town and Country Planning Act). Research: Environmental Health, Building Control, Highways.

- [ ] `[LOW]` `[L]` **Customize dashboard metrics per department type** - Licensing: consultation deadlines, representation counts. Planning: application stages, decision deadlines.

  **Files**: `src/pages/council/Dashboard.tsx`, `src/config/departmentConfig.ts`

- [ ] `[LOW]` `[M]` **Filter notice types by department** - Licensing dashboard shows only licensing notice types, Planning shows only planning types.

  **Files**: `src/pages/council/Dashboard.tsx`, `src/next/publish/config/departmentNoticeTypes.ts`

### Definition of Done

1. Licensing dashboard shows metrics relevant to Licensing Act 2003 (consultation periods, representation counts)
2. Planning dashboard shows metrics relevant to Town and Country Planning Act (application stages)
3. Notice type dropdown on Licensing dashboard excludes Planning notice types
4. Notice type dropdown on Planning dashboard excludes Licensing notice types
5. Documentation exists listing which departments require public notices (in CLAUDE.md or similar)

---

## Deferred: Audit Log Integration

**Why deferred**: This is `[XL]` complexity but `[LOW]` priority. The infrastructure work (new table, new service, wiring to 5+ components) is significant and should be scheduled as its own sprint, not buried in a bug-fix PRD.

**Blocked by**: Phase 2, Phase 3 (needs working comments and invitations to have something to log)

**Scope when implemented**:
- Create audit_logs table with proper indexing
- Create logging service with standard interface
- Wire logging to: comment additions, role changes, member removals, template edits, settings changes
- Display audit log in portal with timeline format

**Move to active PRD when**: Phases 1-10 are complete and councils are actively requesting audit trail features.

---

## Quick Reference

### Dependency Graph

```
Phase 0 (Prerequisites) [S] - Start here
    └── All other phases depend on Phase 0

Phase 1 (Data Isolation) [CRITICAL]
    ├── Phase 2 (Comments) [HIGH]
    ├── Phase 3 (Invitations) [HIGH] - Also requires Phase 0 for Resend
    ├── Phase 11 (Analytics Styling) [LOW]
    └── Phase 12 (Department Dashboards) [LOW]

Phase 4 (Template Editor) [HIGH] - Independent (after Phase 0)
Phase 5 (Navigation) [HIGH] - Independent (after Phase 0)
    └── Phase 6 (Email Alerts) [MEDIUM] - Also requires Phase 0 for Resend

Phase 7 (Homepage) [MEDIUM] - Independent (after Phase 0)
Phase 8 (Sign-In) [MEDIUM] - Independent (after Phase 0)
Phase 9 (Pricing) [MEDIUM] - Independent (after Phase 0)
Phase 10 (Settings & Billing) [MEDIUM] - Independent (after Phase 0)

Deferred: Audit Logs - Blocked by Phase 2 AND Phase 3
```

### Testing Protocol

All tasks must be verified in Chrome browser:
1. Navigate to relevant page
2. Wait for full render
3. Execute the test action
4. Verify expected result
5. Check no console errors

### Key Files

| Area | File |
|------|------|
| Homepage | `src/pages/Home.tsx` |
| Pricing | `src/pages/Pricing.tsx` |
| Email Alerts | `src/pages/EmailAlerts.tsx` |
| Login | `src/pages/Login.tsx` |
| Council Dashboard | `src/pages/council/Dashboard.tsx` |
| Council Representations | `src/pages/council/Representations.tsx` |
| Council Settings | `src/pages/council/Settings.tsx` |
| Council Templates | `src/pages/council/Templates.tsx` |
| Council Team | `src/pages/council/Team.tsx` |
| Council Analytics | `src/pages/council/Analytics.tsx` |
| Internal Comments | `src/components/council/InternalComments.tsx` |
| Site Header | `src/components/SiteHeader.tsx` |

### Design Tokens

```
Primary: blue-600 (#2563EB)
Success: emerald-600
Error: rose-600
Warning: amber-600
Background: slate-50
Card: white + shadow-sm + ring-1 ring-slate-200
```

### Commands

```bash
npm run dev          # Start dev server (frontend + backend)
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run lint         # ESLint check
```

### Supabase Commands

```bash
supabase migration new <name>   # Create new migration
supabase db push               # Apply migrations
supabase db reset              # Reset and reapply all migrations
```

### Rollback Procedures

**Database migrations**: Each migration should have corresponding DROP statements documented. To rollback:
1. `supabase db reset` to start fresh (destructive)
2. Or: manually run DROP statements in Supabase SQL editor

**Auth changes**: Test in development first. Have backup admin account that can restore access.

**RLS policy changes**: Test with `SET request.jwt.claims` before applying to production. Keep old policy definition in comments until verified.
