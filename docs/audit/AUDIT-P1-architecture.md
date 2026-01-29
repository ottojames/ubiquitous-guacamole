# Phase 1: Architecture Assessment Report

**Project:** Civic Notices Portal  
**Date:** 2025-01-29  
**Auditor:** Claude (Automated)  
**Tech Stack:** React 19, Vite 7, Express, Supabase, Stripe, TypeScript 5.8

---

## Executive Summary

| Metric | Value | Health |
|--------|-------|--------|
| Total TS/TSX Files | 633 | - |
| Total Lines of Code | ~138,000 | - |
| Outdated Dependencies | 64 | ⚠️ Needs attention |
| Security Vulnerabilities | 28 (1 critical) | 🔴 Critical |
| Circular Dependencies | 0 | ✅ Good |
| TypeScript Errors | 0 | ✅ Good |
| Lint Warnings | 19 | ⚠️ Minor |
| Unused Dependencies | 24 | ⚠️ Cleanup needed |

---

## 1. Dependency Analysis

### 1.1 Dependency Health Scorecard

| Category | Count | Status |
|----------|-------|--------|
| Total Dependencies | 105+ | - |
| Outdated (patch) | ~20 | ⚠️ |
| Outdated (minor) | ~30 | ⚠️ |
| Outdated (major) | ~14 | 🔴 |
| Unused | 13 deps + 11 devDeps | ⚠️ |
| Missing | 6 | 🔴 |

### 1.2 Major Version Updates Available

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| @types/express | 4.17.23 | 5.0.6 | Breaking changes |
| @types/node | 24.2.1 | 25.1.0 | Major |
| @vitejs/plugin-react | 4.7.0 | 5.1.2 | Breaking changes |
| @vitest/coverage-v8 | 1.6.1 | 4.0.18 | Breaking changes |
| dotenv | 16.6.1 | 17.2.3 | Breaking changes |
| eslint-config-prettier | 9.1.2 | 10.1.8 | Major |
| express | 4.21.2 | 5.2.1 | **Major upgrade** |
| globals | 16.3.0 | 17.2.0 | Major |
| helmet | 7.2.0 | 8.1.0 | Major |
| jsdom | 24.1.3 | 27.4.0 | Major |
| maplibre-gl | 4.7.1 | 5.17.0 | Major |
| multer | 1.4.5-lts.2 | 2.0.2 | Major |
| nodemailer | 6.10.1 | 7.0.13 | Major |
| pdf-parse | 1.1.1 | 2.4.5 | Major |
| pdfjs-dist | 4.10.38 | 5.4.530 | Major |
| pdfkit | 0.14.0 | 0.17.2 | Minor but significant |
| react-map-gl | 7.1.9 | 8.1.0 | Major |
| sharp | 0.33.5 | 0.34.5 | Minor |
| supertest | 6.3.4 | 7.2.2 | Major |
| tailwindcss | 3.4.17 | 4.1.18 | **Major - Tailwind v4** |
| tesseract.js | 6.0.1 | 7.0.0 | Major |
| uuid | 9.0.1 | 13.0.0 | Major |
| vitest | 1.6.1 | 4.0.18 | Major |

### 1.3 Unused Dependencies

**Runtime (safe to remove):**
- @dnd-kit/sortable
- @radix-ui/react-popover
- busboy
- cron (+ @types/cron)
- helmet
- lodash.debounce
- lottie-react
- otplib
- pdfjs-dist
- react-icons
- supercluster
- uuid

**DevDependencies (safe to remove):**
- @types/busboy
- @vitest/coverage-v8
- autoprefixer
- buffer
- nodemon
- postcss
- process
- tailwindcss (if moved to deps)
- ts-node
- ts-node-dev
- typescript-eslint

### 1.4 Missing Dependencies

| Package | Referenced In | Action |
|---------|---------------|--------|
| cypress | cypress.config.ts | Install or remove config |
| next | src/app/api/notices/route.ts | Dead code - remove |
| playwright | scripts/convert-logo-to-png.js | Install globally |
| canvas | scripts/generate-branded-qr.js | Optional dependency |
| node-fetch | scripts/test-registration-fix.cjs | Use native fetch |

---

## 2. Security Vulnerabilities

### 2.1 Summary

| Severity | Count | Action |
|----------|-------|--------|
| Critical | 1 | 🔴 Fix immediately |
| High | 8 | 🔴 Fix within 1 week |
| Moderate | 12 | ⚠️ Fix within 1 month |
| Low | 7 | Plan remediation |

### 2.2 Critical Vulnerabilities

#### xmldom (Critical)
- **Issue:** Misinterpretation of malicious XML, multiple root nodes
- **Impact:** textract dependency chain
- **Fix:** `npm audit fix --force` (breaks textract to 0.4.1)
- **Recommendation:** Evaluate alternative to textract

### 2.3 High Severity Vulnerabilities

| Package | Issue | Fix Available |
|---------|-------|---------------|
| react-router | CSRF, XSS, ScrollRestoration XSS | Yes - `npm audit fix` |
| glob | Command injection via -c/--cmd | Yes - `npm audit fix` |
| qs/body-parser/express | DoS via memory exhaustion | Yes - `npm audit fix` |

### 2.4 Moderate Vulnerabilities

| Package | Issue |
|---------|-------|
| @sentry/node | Sensitive headers leaked with sendDefaultPii |
| esbuild | Dev server request vulnerability |
| js-yaml | Prototype pollution in merge |
| jszip | Prototype pollution, path traversal |
| lodash | Prototype pollution in _.unset/_.omit |
| mammoth | Directory traversal |
| nodemailer | Email interpretation conflict, DoS |

### 2.5 Recommended Immediate Actions

```bash
# Safe fixes (non-breaking)
npm audit fix

# After testing
npm audit fix --force  # Will break textract
```

---

## 3. Static Analysis Results

### 3.1 TypeScript Compilation

✅ **0 errors** - Clean TypeScript compilation with `tsc --noEmit`

### 3.2 ESLint Analysis

| Type | Count |
|------|-------|
| Errors | 0 |
| Warnings | 19 |

**All warnings are `react-refresh/only-export-components`:**

Affected files:
- AddressAutocomplete.tsx (1)
- AddressLookup.tsx (3)
- notice/ActivitiesHours.tsx (3)
- notice/AddressBlock.tsx (2)
- publish/ActivitiesHoursGrid.tsx (1)
- publish/ComplianceChecklist.tsx (1)
- publish/sections/NoticeTypeStep.tsx (2)
- contexts/CouncilContext.tsx (1)
- contexts/UnifiedAuthContext.tsx (1)
- features/template/TemplateBuilderProvider.tsx (4)

**Recommendation:** Extract constants/functions to separate files for better HMR.

### 3.3 Circular Dependencies

✅ **No circular dependencies found** in 387 files

---

## 4. Architecture Mapping

### 4.1 Project Structure (Text Diagram)

```
Ralph's Civic Notices/
├── src/                          # Frontend (React 19 + Vite 7)
│   ├── app/                      # Next.js-style routes (legacy?)
│   │   └── api/                  # Dead code - references Next.js
│   ├── components/               # 112 React components
│   │   ├── ui/                   # Reusable UI primitives
│   │   ├── notice/               # Notice-specific components
│   │   ├── publish/              # Publishing flow components
│   │   ├── council/              # Council portal components
│   │   ├── firm/                 # Firm dashboard widgets
│   │   ├── admin/                # Admin components
│   │   ├── auth/                 # Auth components
│   │   ├── home/                 # Homepage components
│   │   ├── search/               # Search/map components
│   │   ├── alerts/               # Email alert components
│   │   ├── checkout/             # Stripe checkout
│   │   ├── layout/               # Layout components
│   │   └── skeletons/            # Loading skeletons
│   ├── pages/                    # Page components
│   │   ├── admin/                # Admin pages
│   │   ├── auth/                 # Auth pages
│   │   ├── council/              # Council portal pages
│   │   ├── firm/                 # Firm pages
│   │   ├── legal/                # Legal pages
│   │   ├── onboarding/           # Onboarding flow
│   │   ├── publish/              # Publish flow pages
│   │   └── debug/                # Debug pages
│   ├── hooks/                    # 14 custom hooks
│   ├── contexts/                 # React contexts
│   ├── lib/                      # Utility libraries (45 files)
│   ├── features/                 # Feature modules
│   │   ├── template/             # Template builder
│   │   └── publish/              # Publish feature
│   ├── next/                     # New publish flow
│   │   └── publish/              # Refactored publishing
│   ├── types/                    # TypeScript types
│   ├── schemas/                  # Zod schemas
│   ├── config/                   # App configuration
│   ├── utils/                    # Utility functions
│   ├── styles/                   # Global styles
│   └── wizard/                   # Wizard components
│
├── server/                       # Backend (Express)
│   ├── routes/                   # 36 route files
│   │   ├── admin/                # Admin routes
│   │   └── *.ts                  # API endpoints
│   ├── services/                 # 10 business services
│   ├── lib/                      # Server utilities
│   ├── middleware/               # Express middleware
│   ├── jobs/                     # Background jobs
│   ├── utils/                    # Server utilities
│   └── __tests__/                # Server tests
│
├── supabase/                     # Database
│   └── migrations/               # 87 SQL migrations
│
├── e2e/                          # 84 Playwright test files
├── scripts/                      # Build/utility scripts
└── docs/                         # Documentation
```

### 4.2 API Routes (36 endpoints)

| Route File | Purpose | Size |
|------------|---------|------|
| notices.ts | Core notice CRUD | 69KB ⚠️ |
| representations.ts | Public representations | 27KB |
| publish.ts | Notice publishing flow | 18KB |
| team.ts | Team management | 17KB |
| analytics.ts | Analytics endpoints | 16KB |
| firm.ts | Firm management | 14KB |
| registration.ts | User registration | 13KB |
| address.ts | Address lookup | 13KB |
| internal-comments.ts | Internal comments | 11KB |
| firm-templates.ts | Firm templates | 10KB |
| drafts.ts | Draft notices | 10KB |
| council.ts | Council endpoints | 9KB |
| workflow.ts | Workflow management | 9KB |
| subscriptions.ts | Subscriptions | 8KB |
| firm-departments.ts | Departments | 8KB |
| upload.ts | File upload | 9KB |
| representationUploads.ts | Rep file uploads | 7KB |
| stripe.ts | Payment handling | 7KB |
| firmSubscriptions.ts | Firm subscriptions | 7KB |
| ai-summary.ts | AI summaries | 7KB |
| versions.ts | Notice versioning | 7KB |
| certificates.ts | Certificates | 6KB |
| blueNotices.ts | Blue notices | 5KB |
| evidencePacks.ts | Evidence packs | 4KB |
| settings.ts | Settings | 4KB |
| representation-analysis.ts | Analysis | 3KB |
| drafting.ts | AI drafting | 3KB |
| apply-migration.ts | Migration utility | 2KB |
| notify.ts | Notifications | 2KB |
| compliance.ts | Compliance | 2KB |
| test-certificate.ts | Test utility | 2KB |
| stats.ts | Statistics | 2KB |
| test-email.ts | Test utility | 1KB |
| councils.ts | Council list | <1KB |

### 4.3 Database Tables (55 tables)

**Core Tables:**
- notices, notice_versions, notice_amendments
- organizations, organization_memberships, organization_subscriptions
- profiles, departments, department_memberships
- representations, representation_reads, representation_rate_limits
- templates, notice_templates, firm_notice_templates

**Auth/Security:**
- admin_users, admin_sessions, admin_actions
- roles, permissions, role_permissions
- audit_logs, notice_access_tokens

**Business:**
- clients, firm_clients, client_relationships
- subscriptions, subscription_tiers, firm_subscriptions
- billing_transactions, monthly_invoices
- invitations, submissions, attachments

**Workflow:**
- workflow_configs, workflow_stages, workflow_stage_history
- notice_workflow_status, notice_events
- drafts, proofs, deadline_reminders

**Other:**
- councils, council_settings
- email_subscriptions, email_alerts_sent
- webhooks, webhook_deliveries
- internal_comments, postcode_cache

### 4.4 Server Services

| Service | Purpose | Size |
|---------|---------|------|
| email.ts | Email sending (Resend) | 82KB ⚠️ |
| councilMatcher.ts | Council matching logic | 13KB |
| complianceChecker.ts | Compliance validation | 11KB |
| noticeDrafter.ts | AI notice drafting | 12KB |
| representationAnalyzer.ts | AI rep analysis | 9KB |
| deadlineReminders.ts | Deadline notifications | 7KB |
| idoxExport.ts | IDOX integration | 3KB |
| webhooks.ts | Webhook handling | 3KB |
| addressProvider.ts | Address API | 1KB |
| stripe.ts | Stripe integration | <1KB |

---

## 5. Code Quality Metrics

### 5.1 Largest Files (Risk Indicators)

| File | Lines | Risk |
|------|-------|------|
| NewPublishFlow.tsx | 2,182 | 🔴 Split into smaller components |
| server/services/email.ts | 1,912 | 🔴 Extract email templates |
| server/routes/notices.ts | 1,851 | 🔴 Split by functionality |
| UploadNoticeFlow.tsx | 1,720 | 🔴 Refactor to smaller pieces |
| placeholders.ts | 1,434 | ⚠️ Config file - acceptable |
| TemplateBuilderForm.tsx | 1,309 | ⚠️ Complex form - monitor |
| NoticesMapView.tsx | 1,246 | ⚠️ Map component - acceptable |
| lib/address.ts | 1,217 | ⚠️ Consider splitting |
| formBlueprints.ts | 1,214 | ⚠️ Config file - acceptable |
| Home.tsx | 1,181 | ⚠️ Landing page - acceptable |

### 5.2 Test Coverage

| Type | Count |
|------|-------|
| E2E Tests (Playwright) | 84 spec files |
| Unit/Integration Tests (Vitest) | 48 test files |
| Custom Hooks | 14 |

### 5.3 Pattern Analysis

**✅ Good Patterns Found:**
- Consistent use of TypeScript
- Custom hooks for reusable logic (14 hooks)
- Zod schemas for validation
- Context providers for state management
- Component organization by feature
- Comprehensive E2E test coverage

**⚠️ Anti-Patterns Identified:**

1. **God Files:**
   - email.ts (82KB/1912 lines) - Should extract templates
   - notices.ts route (69KB/1851 lines) - Too many endpoints
   - NewPublishFlow.tsx (2182 lines) - Too large

2. **Dead Code:**
   - `src/app/api/` references Next.js but project uses Vite
   - Missing dependencies suggest orphaned scripts

3. **Mixed Paradigms:**
   - `src/next/` folder suggests migration in progress
   - Both old and new publish flows exist

4. **Colocated Constants:**
   - 19 lint warnings about constants in component files
   - Affects HMR performance

5. **No src/services Directory:**
   - Frontend has no services layer
   - Business logic scattered in components/lib

---

## 6. Recommendations Summary

### Immediate (This Week)
1. 🔴 Run `npm audit fix` for security patches
2. 🔴 Update react-router-dom to fix XSS/CSRF
3. 🔴 Evaluate textract alternative (xmldom critical vuln)

### Short-term (This Month)
1. ⚠️ Remove 24 unused dependencies
2. ⚠️ Delete dead code in `src/app/api/`
3. ⚠️ Extract constants from components (19 warnings)
4. ⚠️ Split notices.ts route into sub-routes

### Medium-term (This Quarter)
1. 📋 Refactor email.ts - extract templates
2. 📋 Split NewPublishFlow.tsx into smaller components
3. 📋 Complete `src/next/` migration or remove
4. 📋 Add frontend services layer
5. 📋 Update major dependencies (Express 5, Tailwind 4)

### Long-term
1. 📋 Consider monorepo structure for frontend/backend
2. 📋 Evaluate replacing vitest 1.x with 4.x
3. 📋 Standardize on either old or new publish flow

---

## Appendix: Raw Command Outputs

### npm outdated
64 packages with available updates (see full output above)

### npm audit
28 vulnerabilities: 7 low, 12 moderate, 8 high, 1 critical

### npx depcheck
- 13 unused dependencies
- 11 unused devDependencies  
- 6 missing dependencies

### npx madge --circular
✔ No circular dependency found (387 files processed)

### tsc --noEmit
✅ No errors

### eslint
✖ 19 problems (0 errors, 19 warnings)

---

*Report generated automatically. Review findings before implementing changes.*
