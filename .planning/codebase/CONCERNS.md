# Codebase Concerns

**Analysis Date:** 2026-01-22

## Tech Debt

**Dual Publish Flow Architecture:**
- Issue: Two parallel publish implementations coexist - legacy `src/components/publish/UploadNoticeFlow.tsx` and new wizard `src/next/publish/flow/NewPublishFlow.tsx`. Both are active and maintained.
- Files: `src/pages/PublishPage.tsx`, `src/components/publish/UploadNoticeFlow.tsx` (1720 lines), `src/next/publish/flow/NewPublishFlow.tsx` (1992 lines)
- Impact: Code duplication, maintenance burden, user confusion, features added to one flow may not propagate to the other
- Fix approach: Complete migration to wizard flow by archiving legacy flow; establish single source of truth for publish logic

**PDF Generation Deferred:**
- Issue: All template renderers throw "server-only" errors with TODO comments for PDF generation (`renderPdf()` functions unimplemented)
- Files: `src/next/publish/templates/licensing.ts`, `src/next/publish/templates/planning.ts`, `src/next/publish/templates/gambling.ts`, `src/next/publish/templates/tro.ts`, `src/next/publish/templates/gvol.ts`, `src/next/publish/templates/probate.ts`
- Impact: PDF rendering cannot be triggered from frontend; must be moved to backend API endpoint before feature is usable
- Fix approach: Implement server-side PDF generation in Express routes (likely `server/routes/publish.ts`), expose as API endpoint

**Code Markers Embedded in Source:**
- Issue: Numerous `CN:*` markers (e.g., `CN:LICENSING-FINAL-START`, `CN:STEP2-COMPLIANCE-END`) scattered throughout `UploadNoticeFlow.tsx`
- Files: `src/components/publish/UploadNoticeFlow.tsx` (288+ markers)
- Impact: Markers serve no purpose in production; create code clutter and suggest incomplete refactoring; unclear if markers are for code generation tooling or manual tracking
- Fix approach: Remove all embedded markers or document their purpose clearly; if they're for tooling, move to separate metadata

**Large Component Files:**
- Issue: Three components exceed 1200 lines, creating complexity and testing burden
- Files: `src/next/publish/flow/NewPublishFlow.tsx` (1992 lines), `src/components/publish/UploadNoticeFlow.tsx` (1720 lines), `src/components/search/NoticesMapView.tsx` (1244 lines)
- Impact: Difficult to test, refactor, or understand; high risk of bugs in multi-step logic; useEffect dependencies difficult to track
- Fix approach: Extract wizard step logic into separate hook; decompose map view into smaller filterable components; aim for max ~600 lines per component

**Type Coercion Anti-patterns:**
- Issue: 108 instances of `as any` or `as unknown` casts bypass type system; 16 instances of `// @ts-ignore` comments
- Files: `src/lib/address.ts`, `src/components/AddressLookup.tsx`, `src/lib/addressLookup.ts`, `src/next/publish/flow/TemplateBuilderForm.tsx`, `src/next/publish/flow/components/UploadOcrPane.tsx`, and others
- Impact: Potential runtime errors masked by type system; harder to identify bugs during development; maintenance burden increases over time
- Fix approach: Replace `as any` with proper generic types; fix `@ts-ignore` cases with actual type definitions; consider stricter ESLint rules

**Large Data Configuration:**
- Issue: `src/next/publish/config/placeholders.ts` (1434 lines) and `src/next/publish/config/formBlueprints.ts` (1158 lines) are massive configuration objects
- Files: `src/next/publish/config/placeholders.ts`, `src/next/publish/config/formBlueprints.ts`
- Impact: Difficult to validate, edit, or test; risk of typos in field mappings; slow IDE performance when editing
- Fix approach: Migrate to JSON files with schema validation; use Zod for runtime validation; split by notice type into separate config files

---

## Known Bugs

**Storage Initialization Race Condition:**
- Symptoms: Draft persistence may fail silently if sessionStorage becomes unavailable after component mount
- Files: `src/wizard/draftStore.ts`, `src/next/publish/flow/NewPublishFlow.tsx`
- Trigger: Any browser permission change that restricts storage access during wizard flow
- Workaround: User must restart wizard; session data is lost but not critical (drafts auto-recover from server)
- Root cause: Storage errors caught but not reported to user; draft reference kept in memory even if storage fails

**Missing Error Boundary Recovery:**
- Symptoms: Publish wizard may become stuck if error boundary catches exception in step component
- Files: `src/App.tsx` (uses `SectionErrorBoundary`), `src/next/publish/flow/NewPublishFlow.tsx`
- Trigger: Unhandled error in step render (e.g., schema validation throws, template render fails)
- Workaround: Full page reload required; all step progress lost
- Root cause: Error boundaries don't provide "retry" mechanism; state corruption not recoverable

**Console Logging Leaks:**
- Symptoms: 495 console.* calls throughout codebase; sensitive auth data logged to DevTools
- Files: `src/contexts/UnifiedAuthContext.tsx` logs portal type and organization memberships; throughout codebase
- Trigger: Any browser with DevTools open or logging service enabled
- Workaround: Disable console in production (not currently done)
- Root cause: No centralized logging strategy; debug logging not gated by environment

---

## Security Considerations

**HTML Rendering Vulnerability:**
- Risk: `dangerouslySetInnerHTML` used for notice preview rendering without explicit HTML sanitization
- Files: `src/next/publish/flow/NoticePreview.tsx`, `src/features/publish/PreviewPane.tsx`, `src/components/publish/PreviewPane.tsx`, `src/pages/SampleNotice.tsx`
- Current mitigation: Template engine (`renderNoticeTemplate`) escapes output; OCR text is user-controlled but used in preview only
- Recommendations:
  1. Add HTML sanitizer (e.g., DOMPurify) before `dangerouslySetInnerHTML` calls
  2. Audit template engine output encoding for all notice types
  3. Consider using `textContent` for preview if markup not required

**Session Storage Cross-Tab Leak:**
- Risk: Portal type stored in `sessionStorage` accessible from any tab; auth context reads without validation
- Files: `src/contexts/UnifiedAuthContext.tsx`, `src/lib/supabase.ts`
- Current mitigation: SessionStorage is tab-isolated; Supabase auth is disabled (`persistSession: false`)
- Recommendations:
  1. Move auth state to memory-only (current approach good but verify no localStorage fallback)
  2. Add Content-Security-Policy header to prevent inline script injection
  3. Verify that no sensitive tokens stored in localStorage

**Environment Variable Validation:**
- Risk: `.env` file checked into repo; RESEND_API_KEY and Supabase keys visible in `.env` (not `.env.example`)
- Files: `.env` (contains real credentials), `server/services/email.ts`, `src/lib/supabase.ts`
- Current mitigation: `.env` in `.gitignore` (should be); `process.env.RESEND_API_KEY` throws if missing
- Recommendations:
  1. Audit git history for any committed `.env` files; invalidate exposed keys
  2. Use environment variable parsing library (e.g., Zod) to validate at startup
  3. Implement startup check that validates all required keys present

**CORS and API Security:**
- Risk: Backend routes use `optionalAuth` middleware allowing unauthenticated access to some endpoints
- Files: `server/routes/notices.ts` (line 6), `server/middleware/auth.ts`
- Current mitigation: Public search endpoints (notices list) don't require auth; rate limiting not visible
- Recommendations:
  1. Audit all routes using `optionalAuth` - verify they shouldn't be `requireAuth`
  2. Implement rate limiting on public endpoints to prevent abuse
  3. Add request validation using Zod schemas

---

## Performance Bottlenecks

**Map Rendering Complexity:**
- Problem: `src/components/search/NoticesMapView.tsx` (1244 lines) manages Supercluster, MapLibre, and BBox filtering in single component
- Files: `src/components/search/NoticesMapView.tsx`
- Cause: All state updates trigger re-renders; no memoization of cluster calculations; Suspense boundaries missing
- Improvement path:
  1. Extract cluster logic into custom hook (`useMapClusters`)
  2. Memoize `MapLibre` instance with `useMemo`
  3. Lazy-load popup components
  4. Benchmark with React DevTools Profiler to identify render bottlenecks

**Address Lookup Unbounded Recursion:**
- Problem: `src/lib/address.ts` uses recursive traversal (`extractCandidates`) without depth limit
- Files: `src/lib/address.ts` (line ~1100, `extractCandidates` function)
- Cause: Malformed API response could create deep nesting; recursion not bounded
- Improvement path:
  1. Add `maxDepth` parameter (e.g., `maxDepth = 10`)
  2. Validate API response structure before recursion
  3. Add error logging for truncated responses

**Template Rendering O(n) DOM Nodes:**
- Problem: Notice preview renders full notice text as DOM nodes; no virtualization for long notices
- Files: `src/next/publish/flow/NoticePreview.tsx`
- Cause: Complex notices (TRO, Planning) can be 2000+ lines; all rendered to DOM
- Improvement path:
  1. Consider read-only preview (not editable) for large notices
  2. Add collapsible sections by section type
  3. Use `react-window` for virtualized rendering if full text needed

---

## Fragile Areas

**OCR Text Extraction Pipeline:**
- Files: `src/next/publish/flow/lib/legalDetails.ts` (949 lines), `server/routes/upload.ts`
- Why fragile: OCR accuracy varies by document quality; extracted fields passed through 3 transformation layers (OCR → validation → template); regex-based extraction of dates/addresses brittle
- Safe modification:
  1. Add comprehensive test fixtures for different OCR engines (Tesseract, cloud APIs)
  2. Create validation test suite with real council application PDFs
  3. Extract deadline/date parsing into separate testable module
- Test coverage: No unit tests for `extractLegalDetailsFromOcr`; only integration tests via upload flow

**Schema Registry Circular Dependency Risk:**
- Files: `src/next/publish/schema/registry.ts`, `src/next/publish/config/noticeTypes.ts`, `src/next/publish/templates/index.ts`
- Why fragile: All notice types, builders, and renderers must be registered; missing one breaks notice creation
- Safe modification:
  1. Create integration test that validates all notice types have builders AND renderers
  2. Generate registry dynamically from notice type definitions to ensure consistency
  3. Add TypeScript check for exhaustiveness
- Test coverage: Schema tests exist but don't verify complete registry; missing builder returns generic error

**Portal Route Guard Duplication:**
- Files: `src/App.tsx` (portal routing), `server/middleware/auth.ts` (backend permission checks)
- Why fragile: Access control logic split between frontend routing and backend middleware; mismatch allows unauthorized access
- Safe modification:
  1. Extract route guards to separate hook (`useRouteGuard`)
  2. Verify backend permission check matches frontend route guard
  3. Add E2E test for unauthorized access denial
- Test coverage: Unit tests for auth context; no E2E tests verifying route protection

**Draft State Synchronization:**
- Files: `src/wizard/draftStore.ts`, `src/next/publish/flow/NewPublishFlow.tsx`
- Why fragile: Draft state kept in memory (`draftIdRef`), sessionStorage, and server simultaneously; no cache invalidation strategy
- Safe modification:
  1. Single source of truth: either sessionStorage OR server, not both
  2. Implement optimistic update pattern with conflict resolution
  3. Add server-side draft versioning with timestamps
- Test coverage: No tests for draft sync; state mutations hard to trace

---

## Scaling Limits

**Database Query Pagination:**
- Current capacity: Default limit 25 notices, max 100; no server-side caching
- Limit: Large councils (1000+ notices) will have slow pagination; repeated searches hit DB
- Scaling path:
  1. Implement Redis caching for popular searches (postcode, notice type)
  2. Add cursor-based pagination to avoid offset overhead
  3. Index `created_at`, `postcode`, `notice_type` for faster sorting

**Email Sending Bottleneck:**
- Current capacity: Resend.send() used for all email types; Resend rate limit ~100/sec
- Limit: Breaks if alert emails spike (e.g., after deadline); daily summary emails may fail
- Scaling path:
  1. Implement job queue (Bull/BullMQ) for email sending
  2. Move email rendering to background job with retry logic
  3. Add email delivery tracking to prevent duplicates

**Map Cluster Updates Real-time:**
- Current capacity: Supercluster recalculated on every BBox change; no debouncing
- Limit: Map interaction becomes sluggish with 5000+ notices at high zoom levels
- Scaling path:
  1. Debounce map pan/zoom events (300ms)
  2. Implement server-side clustering via PostGIS
  3. Stream cluster updates via WebSocket for real-time data

---

## Dependencies at Risk

**Resend API Email Dependency:**
- Risk: Single email provider; if Resend service down, all alerts/confirmations fail silently
- Impact: Users don't receive deadline alerts or publication confirmations; councils unaware of new notices
- Migration plan:
  1. Implement email provider abstraction (interface, not hardcoded Resend)
  2. Add fallback provider (e.g., SendGrid)
  3. Queue emails with retry logic independent of provider

**Supercluster for Geospatial:**
- Risk: External clustering library; if unmaintained, security issues may go unfixed
- Impact: Map feature vulnerable to DoS; malformed cluster calculations could crash browser
- Migration plan:
  1. Evaluate PostGIS for server-side clustering
  2. Add input validation for cluster zoom level
  3. Set hard limit on cluster update frequency

**MapLibre GL for Map Rendering:**
- Risk: MapLibre is community-maintained fork of Mapbox; feature parity lag
- Impact: Missing features for advanced map interactions; styling options limited
- Migration plan: Current approach acceptable; monitor for security updates monthly

---

## Missing Critical Features

**Audit Logging:**
- Problem: No audit trail for notice creation, modification, or deletion; admins cannot track who published what
- Blocks: Compliance audit requirements; cannot identify malicious actors
- Implementation: Add audit table to Supabase with trigger on notices table; log user_id, action, timestamp, IP

**Error Recovery UI:**
- Problem: Multi-step wizard loses all progress if network error occurs mid-submission
- Blocks: User must restart entirely; draft auto-recovery not reliable
- Implementation: Add "Resume" button after network error; implement optimistic updates in submit flow

**Representation Analytics:**
- Problem: No aggregated view of representations by stance (support/object/comment) for councils
- Blocks: Councils cannot quickly assess sentiment; must download and manually analyze
- Implementation: Add `Representations.tsx` analytics endpoint with stance breakdown by notice

---

## Test Coverage Gaps

**OCR Integration:**
- What's not tested: End-to-end OCR pipeline with real PDFs; edge cases (blank pages, rotated text, multiple documents)
- Files: `src/next/publish/flow/lib/legalDetails.ts`, `server/routes/upload.ts`
- Risk: OCR extraction may produce garbage data (malformed addresses, invalid dates); schema validation only catches type mismatches, not semantic errors
- Priority: High - OCR data drives notice validity

**Authorization Edge Cases:**
- What's not tested: User with permissions in multiple councils; firm user accessing council portal; permission revocation mid-session
- Files: `src/contexts/UnifiedAuthContext.tsx`, `server/middleware/auth.ts`
- Risk: Cross-portal access possible if permission cache not refreshed; stale tokens accepted
- Priority: High - Security risk

**Map Interaction at Scale:**
- What's not tested: Map performance with 10000+ notices; cluster stability under rapid zoom/pan
- Files: `src/components/search/NoticesMapView.tsx`
- Risk: Browser crash; unresponsive UI; cluster calculations produce invalid data
- Priority: Medium - UX degradation

**Template Rendering for All Notice Types:**
- What's not tested: Complete rendering of gambling, planning, TRO, GVOL, probate templates with full field sets
- Files: `src/next/publish/templates/*.ts`
- Risk: Missing template fields; malformed output; template token replacement fails for uncommon notice types
- Priority: High - Core feature

**Email Delivery:**
- What's not tested: Email template rendering; recipient validation; Resend API failures; retry logic
- Files: `server/services/email.ts`
- Risk: Emails never sent; malformed templates; user doesn't know email failed
- Priority: Medium - User notification

---

*Concerns audit: 2026-01-22*
