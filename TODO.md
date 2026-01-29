# TODO

## Future Improvements

### Login Flow Refactor

**Current flow:**
1. User selects portal type (Council or Professional)
2. User enters credentials
3. System validates and redirects

**Recommended flow (follows standard SaaS patterns):**
1. Single login form (email + password only)
2. System authenticates user
3. System queries user's organization memberships
4. If user belongs to one org → redirect directly to that dashboard
5. If user belongs to multiple orgs → show workspace/org selector after auth

**Benefits:**
- Follows patterns used by Stripe, Slack, Linear, Notion, Vercel
- System determines routing based on actual memberships, not user self-selection
- Handles edge case where user belongs to both a council and a firm
- Reduces friction before authentication
- Users don't need to remember which portal type they should use

**Implementation notes:**
- The `performRedirect()` function in `Login.tsx` already queries memberships
- Could consolidate council and firm membership queries into a single post-auth check
- Workspace selector UI needed for multi-org users

**Reference commits:**
- `db616d08` - Login with gradient hero styling
- `6ac709d5` - Login with minimal utility-focused styling
