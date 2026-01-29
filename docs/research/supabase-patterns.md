# Supabase Patterns & Best Practices Research

**Researched:** January 2026  
**For:** Ralph's Civic Notices Project

---

## Table of Contents
1. [What's New in Supabase (2024-2026)](#whats-new-in-supabase-2024-2026)
2. [Edge Functions Best Practices](#edge-functions-best-practices)
3. [Row Level Security (RLS) Patterns](#row-level-security-rls-patterns)
4. [Realtime Features](#realtime-features)
5. [Auth Best Practices](#auth-best-practices)
6. [Storage Best Practices](#storage-best-practices)
7. [Notable GitHub Repositories](#notable-github-repositories)

---

## What's New in Supabase (2024-2026)

### Major Recent Features

#### PostgREST v14 (January 2026)
- **JWT Cache** - ~20% throughput increase for GET requests (enabled by default)
- **Faster Schema Cache Loading** - Complex databases now load in 2 seconds vs 7 minutes previously
- Improved type generation for embedded functions/computed relationships

#### New Storage Bucket Types
1. **Analytics Buckets** (Public Alpha)
   - Built on Apache Iceberg and AWS S3 Tables
   - Columnar storage for analytical workloads
   - SQL-accessible via Postgres foreign tables
   - Perfect for data lakes, ETL, historical analysis

2. **Vector Buckets** (Public Alpha)
   - Built on Amazon S3 Vectors
   - Cold storage for embeddings with query engine
   - HNSW and Flat indexing
   - Multiple distance metrics (cosine, euclidean, L2)
   - Great for RAG systems, semantic search

#### Supabase ETL (Private Alpha)
- Change-data-capture pipeline
- Continuous replication from Postgres to external destinations
- Starting with Iceberg support

#### OAuth2 Provider - "Sign in With [Your App]"
- Turn your Supabase project into a full identity provider
- Build MCP servers with Supabase Auth
- Create your own "Sign in with X" experience

#### New Auth Security Email Templates
- Password changed notifications
- Email changed notifications
- Phone number changed notifications
- Identity linked/unlinked alerts
- MFA enrolled/unenrolled alerts

#### Other Updates
- **Supabase for Platforms** - White-label offering for provisioning managed backends
- **Stripe Sync Engine Integration** - One-click dashboard integration
- **Python Type Generation** in CLI
- **Local SQL Snippets** - Save/share snippets via Git (CLI v2.72.7+)
- **Explain/Analyze Diagrams** in Dashboard
- **Legacy NodeJS Support** for Edge Functions
- **Sentry Log Drains** support
- **AWS Marketplace** availability

---

## Edge Functions Best Practices

### Overview
- Server-side TypeScript functions distributed globally at the edge
- Built on Deno runtime (open source, portable, TypeScript-first, WASM support)
- Request → Edge Gateway → Auth/Policies → Edge Runtime → Response

### Use Cases
- Authenticated or public HTTP endpoints needing low latency
- Webhook receivers (Stripe, GitHub, etc.)
- On-demand image/Open Graph generation
- Small AI inference tasks / LLM API orchestration
- Transactional emails
- Messaging bots (Slack, Discord, etc.)

### Best Practices

#### 1. Design for Cold Starts
```typescript
// Keep functions lightweight and idempotent
// Heavy long-running jobs → use background workers
Deno.serve(async (req) => {
  // Fast, stateless operations
  const { data } = await req.json()
  return new Response(JSON.stringify({ success: true }))
})
```

#### 2. Use Connection Pooling for Database
```typescript
// Treat Postgres as a remote, pooled service
// Use serverless-friendly drivers
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
```

#### 3. Manage Secrets Properly
```bash
# Store secrets via CLI
supabase secrets set MY_SECRET=value

# Access via environment variables
const apiKey = Deno.env.get('MY_SECRET')
```

#### 4. Local Development
```bash
# Initialize function
supabase functions new my-function

# Serve locally with hot reload
supabase start
supabase functions serve my-function
```

#### 5. Deployment
```bash
# Deploy single function
supabase functions deploy my-function

# Deploy all functions
supabase functions deploy

# Skip JWT verification (for webhooks)
supabase functions deploy my-function --no-verify-jwt
```

#### 6. Background Tasks
For heavy operations, use background workers instead of blocking the response.

---

## Row Level Security (RLS) Patterns

### Core Concepts
RLS adds implicit WHERE clauses to every query. Policies are attached to tables and executed on every access.

```sql
-- Enable RLS
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

-- Without policies, no data accessible via API with anon key
```

### Supabase Roles
- `anon` - Unauthenticated requests
- `authenticated` - Logged-in users

### Policy Patterns

#### SELECT Policy (Read Access)
```sql
-- Public read access
CREATE POLICY "Public profiles viewable by everyone"
ON profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Private read (own data only)
CREATE POLICY "Users see own profile"
ON profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

#### INSERT Policy
```sql
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)  -- existing row check
WITH CHECK ((SELECT auth.uid()) = user_id);  -- new row check
```

#### DELETE Policy
```sql
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### Helper Functions

#### auth.uid()
Returns the ID of the requesting user.

#### auth.jwt()
Access JWT claims for authorization:
```sql
-- Team-based access using app_metadata
CREATE POLICY "User is in team"
ON my_table
TO authenticated
USING (team_id IN (SELECT auth.jwt() -> 'app_metadata' -> 'teams'));
```

#### MFA Enforcement
```sql
CREATE POLICY "Require AAL2 for updates"
ON profiles AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2');
```

### Performance Optimization 🚀

#### 1. Add Indexes on Policy Columns
```sql
CREATE INDEX userid ON test_table USING btree (user_id);
```
**Impact:** 99.94% improvement in benchmarks

#### 2. Wrap Functions with SELECT
```sql
-- ❌ Slow (calls function per row)
USING (auth.uid() = user_id)

-- ✅ Fast (caches result)
USING ((SELECT auth.uid()) = user_id)
```
**Impact:** 94-99% improvement

#### 3. Always Add Client-Side Filters
```typescript
// ❌ Bad - relies only on RLS
const { data } = supabase.from('table').select()

// ✅ Good - helps query planner
const { data } = supabase
  .from('table')
  .select()
  .eq('user_id', userId)
```
**Impact:** 94.74% improvement

#### 4. Use Security Definer Functions
```sql
CREATE FUNCTION private.has_good_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles_table
    WHERE (SELECT auth.uid()) = user_id AND role = 'good_role'
  );
END;
$$;

CREATE POLICY "rls_test_select" ON test_table
TO authenticated
USING ((SELECT private.has_good_role()));
```

#### 5. Minimize Joins - Use IN/ANY
```sql
-- ❌ Slow (joins source to target)
USING (
  (SELECT auth.uid()) IN (
    SELECT user_id FROM team_user
    WHERE team_user.team_id = team_id  -- join!
  )
)

-- ✅ Fast (no join)
USING (
  team_id IN (
    SELECT team_id FROM team_user
    WHERE user_id = (SELECT auth.uid())
  )
)
```
**Impact:** 99.78% improvement

#### 6. Always Specify Roles
```sql
-- ✅ Good
CREATE POLICY "..." ON table TO authenticated USING (...);
```

### Views and RLS
Views bypass RLS by default. In Postgres 15+:
```sql
CREATE VIEW my_view
WITH (security_invoker = true)
AS SELECT ...;
```

---

## Realtime Features

### Three Pillars

1. **Broadcast** - Low-latency messages between clients
   - Real-time messaging
   - Cursor tracking
   - Game events
   - Custom notifications

2. **Presence** - Track/synchronize user state
   - Who's online
   - Active participants
   - Typing indicators

3. **Postgres Changes** - Listen to database changes in real-time
   - INSERT/UPDATE/DELETE events
   - Filter by schema, table, or column values

### Use Cases
- Chat applications with typing indicators
- Collaborative tools (documents, whiteboards)
- Live dashboards
- Multiplayer games
- Social features (notifications, reactions)

### Configurable Settings
- Enable/disable Realtime service
- Max presence events per second
- Max payload size in KB

---

## Auth Best Practices

### Supported Methods
- Password, Magic Link, OTP
- Social Login (20+ providers: Google, Apple, GitHub, Discord, etc.)
- Single Sign-On (SSO)
- Phone Auth (Twilio, Vonage, MessageBird)

### JWT Integration
Auth tokens automatically integrate with RLS for row-level access control.

### Key Patterns

1. **Use app_metadata for Authorization Data**
   - `raw_user_meta_data` - User can update (don't store auth data here)
   - `raw_app_meta_data` - Only server can update (safe for roles, teams)

2. **Implement MFA Where Needed**
   - Check AAL (Assurance Level) in RLS policies
   - Require AAL2 for sensitive operations

3. **Security Email Templates**
   - Enable notifications for password/email changes
   - Alert on MFA enrollment/unenrollment
   - Notify on identity link/unlink

---

## Storage Best Practices

### Bucket Types

1. **Files Buckets** (Traditional)
   - Images, videos, documents
   - Global CDN delivery
   - Image optimization on-the-fly
   - RLS integration

2. **Analytics Buckets** (Alpha)
   - Apache Iceberg format
   - Data lakes, ETL, historical analysis
   - SQL-accessible via foreign tables

3. **Vector Buckets** (Alpha)
   - Embedding storage
   - Similarity search
   - AI/ML applications, RAG

### Features
- S3-compatible API
- TUS resumable uploads
- Global CDN (285+ cities)
- Fine-grained access control with RLS

---

## Notable GitHub Repositories

### Official & Curated Lists
- **[awesome-supabase](https://github.com/lyqht/awesome-supabase)** (429 ⭐) - Official curated list of starters & resources
- **[Edge Function Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)** - Official examples
- **[Storage Examples](https://github.com/supabase/supabase/tree/master/examples/storage)** - Official storage examples

### Starter Templates

| Repository | Description |
|------------|-------------|
| [nextbase-nextjs-supabase-starter](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | Next.js 16+, Supabase, Tailwind CSS 4, TypeScript, Jest, Playwright, React Query |
| [supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template) | Production-ready SaaS with 2FA, user management, React Native/Expo mobile app |
| [SupabaseAuthWithSSR](https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR) | Next.js 15 + AI Stack (RAG, web search, LLM support, pgvector) |
| [Basejump](https://usebasejump.com) | Teams, personal accounts, invitations, i18n, fully tested schema |
| [Supanext](https://supanext.com) | AI app examples, auth, billing, landing page, blog |
| [Supastarter](https://supastarter.dev) | Auth, mail templates, landing page, dashboard, blog |

### Tools & Utilities

| Repository | Description |
|------------|-------------|
| [supabase-cache-helpers](https://github.com/psteinroe/supabase-cache-helpers) | Framework-specific cache utilities |
| [generate-supabase-db-types-github-action](https://github.com/lyqht/generate-supabase-db-types-github-action) | Auto-generate types on CI |
| [supabase-schema](https://supabase-schema.vercel.app) | Generate SQL scripts & database diagrams |
| [pgflow](https://pgflow.dev) | Serverless task queue for Edge Functions & Supabase Queues |
| [supabase-plus](https://github.com/dsplce-co/supabase-plus) | Extra tools beyond standard CLI |

### Migration Tools
- **[firebase-to-supabase](https://github.com/supabase-community/firebase-to-supabase)** - Migration guides for Auth, Firestore, Storage, Functions
- **[Heroku to Supabase](https://migrate.supabase.com)** - Postgres migration tool

### Learning Resources
- [Testing with pgTAP](https://usebasejump.com/blog/testing-on-supabase-with-pgtap) - Test RLS policies
- [RBAC Implementation](https://permit.io/blog/how-to-implement-rbac-in-supabase) - Role-based access control
- [Turborepo Monorepo Setup](https://philipp.steinroetter.com/posts/supabase-turborepo) - Multi-app architecture

---

## Quick Reference for Civic Notices

### Recommended Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  - SSR with @supabase/ssr                               │
│  - Real-time subscriptions for notice updates           │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  Supabase                                               │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ Auth         │ Database     │ Storage              │ │
│  │ - Email/Pass │ - notices    │ - Notice PDFs        │ │
│  │ - Magic Link │ - users      │ - Publication proofs │ │
│  │              │ - RLS on all │                      │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┤
│  │ Edge Functions                                       │
│  │ - Webhook receivers (Stripe, etc.)                  │
│  │ - Email notifications                                │
│  │ - PDF generation                                     │
│  └──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┤
│  │ Realtime                                             │
│  │ - Notice status changes                              │
│  │ - New publication alerts                             │
│  └──────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### Key Takeaways
1. **Always wrap auth functions with SELECT** in RLS policies
2. **Add indexes on columns used in policies**
3. **Add client-side filters** even when RLS is enabled
4. **Use app_metadata** for authorization data
5. **Design Edge Functions for cold starts** - keep lightweight
6. **Use Vector Buckets** if implementing semantic search for notices
7. **Enable security email templates** for user account changes

---

*Last Updated: January 2026*
