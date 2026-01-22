# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**Payment Processing:**
- Stripe - Handles notice publication payments
  - SDK/Client: `stripe` (20.2.0), `@stripe/stripe-js` (8.6.3)
  - Auth: `STRIPE_SECRET_KEY` (backend), `VITE_STRIPE_PUBLISHABLE_KEY` (frontend)
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Usage: Checkout session creation, payment verification, webhook event handling
  - Implementation: `server/services/stripe.ts`, `server/routes/stripe.ts`

**Email Delivery:**
- Resend - Primary transactional email service
  - SDK/Client: `resend` (6.2.2)
  - Auth: `RESEND_API_KEY`
  - Usage: Notice confirmations, representation notifications, deadline reminders, alert emails
  - Implementation: `server/services/email.ts`
  - Email types: NoticeConfirmationData, RepresentationConfirmationData, DeadlineReminderData, SubscriptionVerificationData, AlertEmailData

**Geocoding & Postal Data:**
- Postcodes.io - Free UK postcode geocoding
  - No SDK required (direct HTTP requests)
  - Endpoint: `POSTCODES_IO_URL` (default: https://api.postcodes.io)
  - Usage: Convert UK postcodes to lat/lon for notice geospatial display
  - Implementation: `server/lib/geocode.ts`
  - Returns: Latitude, longitude, administrative regions

**Address Lookup:**
- GetAddress.io - UK address lookup service (configurable)
  - Provider selection: `ADDRESS_PROVIDER` env var
  - Options: "getaddress" (live), "mock" (development)
  - API proxied through Vite at `/api/getaddress` to `https://api.getaddress.io`
  - Implementation: `server/routes/address.ts`

**AI/ML Services:**
- OpenAI - Text summarization for notices (optional)
  - SDK/Client: `openai` (6.3.0)
  - Auth: `OPENAI_API_KEY` (not in .env.example, optional)
  - Usage: Generate AI summaries of notice text
  - Model: GPT (model version in code)
  - Implementation: `server/routes/ai-summary.ts`
  - Fallback: Hugging Face Inference API with BART model if OpenAI unavailable

- Hugging Face - Alternative NLP for text summarization
  - Model: `facebook/bart-large-cnn` (summarization-specific)
  - Auth: `HUGGINGFACE_API_KEY`
  - Usage: Text summarization when OpenAI unavailable
  - Endpoint: https://api-inference.huggingface.co/models/{model}

**Maps & Geospatial:**
- MapTiler - Vector map tiles (optional, with fallback)
  - Auth: `VITE_MAPTILER_KEY` (optional API key)
  - Style URL: `VITE_MAP_STYLE_URL`
  - Fallback: demotiles.maplibre.org (open-source, slower)
  - Implementation: `src/components/search/NoticesMapView.tsx` (lines 72-77)
  - Map library: MapLibre GL (open-source, no external dependency for rendering)

**Error Tracking & Monitoring:**
- Sentry - Production error tracking
  - SDK: `@sentry/react` (frontend), `@sentry/node` (backend)
  - Frontend DSN: `VITE_SENTRY_DSN`
  - Backend DSN: `SENTRY_DSN`
  - Environment: `VITE_SENTRY_ENVIRONMENT`, `SENTRY_ENVIRONMENT`
  - Tracing: Frontend 10% sample rate production (100% dev), Backend 100% error rate
  - Implementation: `src/lib/sentry.ts`, `server/lib/sentry.ts`

## Data Storage

**Databases:**
- Supabase (PostgreSQL) - Primary database
  - Connection env vars: `VITE_SUPABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` (2.46.0)
  - Primary tables: `notices`, `councils`, `webhooks`, `subscriptions`, `representations`, `teams`, `firm_*`
  - Authentication: Disabled in client (`persistSession: false` for service-only, enabled for user sessions)
  - Implementation: `src/lib/supabase.ts` (frontend), `server/lib/supabase.ts` (backend service-role)

**File Storage:**
- Supabase Storage (S3-compatible)
  - Bucket name: `SUPABASE_BUCKET` (default: "notices", configured as "blue-notices" in upload handler)
  - Usage: Store PDF and image documents from notice uploads
  - Path structure: `{uploaderId}/{timestamp}_{filename}`
  - Max file size: 25MB per upload
  - Implementation: `server/routes/upload.ts`

**Caching:**
- In-memory cache (application-level)
  - Supabase client caching via TanStack React Query
  - Session storage for wizard draft persistence: `src/wizard/draftStore.ts`
  - No Redis or external cache layer

## Authentication & Identity

**Auth Provider:**
- Custom - Supabase Auth disabled, application handles user sessions
- 2FA/MFA: OTP/TOTP using `otplib` (13.1.1) and `speakeasy` (2.0.0)
- Password hashing: Bcrypt (6.0.0)
- Admin authentication: IP allowlist enforcement middleware
- Implementation: `server/middleware/adminAuth.ts`

**Session Management:**
- Frontend: localStorage via Supabase client (if enabled)
- Backend: Custom JWT/token handling with Supabase service role

## Monitoring & Observability

**Error Tracking:**
- Sentry (optional, conditionally initialized)
  - Disabled in development (logs only)
  - 100% error capture in production
  - No personal identifiable information (sendDefaultPii: false)

**Logs:**
- Server: Morgan HTTP logging middleware (dev format)
- Frontend: Console logging, React DevTools
- No external log aggregation (logs stay local in development)

## CI/CD & Deployment

**Hosting:**
- Vite preview mode or custom Node.js hosting
- Express server running on configurable port (5174, 5175, or PORT env var)

**CI Pipeline:**
- None configured (no GitHub Actions or similar detected)
- Manual testing via npm scripts

**Build Output:**
- Frontend: `dist/` directory (Vite build)
- Backend: Runs directly from TypeScript via tsx (production may compile)

## Environment Configuration

**Required env vars (production):**
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Backend database access
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `RESEND_API_KEY` - Email delivery

**Optional env vars:**
- `OPENAI_API_KEY` - AI summarization
- `HUGGINGFACE_API_KEY` - Fallback AI service
- `VITE_MAPTILER_KEY` - Premium map tiles
- `VITE_SENTRY_DSN` - Error tracking
- `SENTRY_DSN` - Backend error tracking
- `ADDRESS_PROVIDER` - Mock or real address lookup
- `POSTCODES_IO_URL` - Override geocoding endpoint
- `NEW_PUBLISH_FLOW` - Feature flag
- `PAGE_LIMIT` - OCR page limit (default: 4)
- `TEST_MODE` - Skip OCR processing

**Secrets storage:**
- `.env` file (Git-ignored)
- Environment variables set at deployment time
- No external vault service configured

## Webhooks & Callbacks

**Outgoing Webhooks:**
- Custom webhook system for event subscriptions
  - Events: `notice.published`, `notice.expired`, `notice.updated`, `representation.submitted`, `workflow.stage_changed`, `payment.completed`
  - Table: `webhooks` (organization-scoped)
  - HMAC signing: SHA-256 with org secret
  - Implementation: `server/services/webhooks.ts`
  - Retry logic: Timeout-based with exponential backoff

**Incoming Webhooks:**
- Stripe webhooks - Payment events
  - Endpoint: `POST /api/stripe/webhook`
  - Signature verification: `STRIPE_WEBHOOK_SECRET`
  - Events handled: Checkout session completion, payment status changes
  - Implementation: `server/routes/stripe.ts`

## Document Processing

**Text Extraction Pipeline:**
1. Upload handler: `server/routes/upload.ts` (Multer, memory storage)
2. Format detection: MIME type + file extension
3. Extraction engines (in order):
   - PDF: `pdf-parse` library
   - PDF (fallback): Tesseract.js OCR
   - DOCX: Mammoth
   - Image (PNG/JPEG/TIFF): Tesseract.js OCR
   - RTF: Custom regex-based parser
   - TXT: Direct read
   - Legacy DOC: Not supported (415 error)
4. Text cleanup: `cleanupNoticeText.ts` (capitalization, postcode formatting)
5. Storage: Supabase bucket with SHA-256 hash deduplication

Implementation: `server/utils/extractText.ts`, `server/lib/pdf.ts`

## Rate Limiting

**Upload endpoint:**
- 20 requests per minute per IP
- Implemented in-memory rate limiter in `server/routes/upload.ts`

## Scheduled Jobs

**Email Jobs (Node-Cron):**
- Hourly alert delivery: `0 * * * *` (top of each hour)
- Daily deadline reminders: `0 9 * * *` (9 AM daily)
- Alert delivery cron: `5 * * * *` (5 minutes past each hour)
- Implementation: `server/jobs/emailJobs.ts`, `server/jobs/alertDeliveryJob.ts`
- Started on server boot (production) via `startAllEmailJobs()`

## Data Import/Export

**CLI Scripts:**
- `npm run ingest:councils` - Import councils from data/councils.docx
- `npm run backfill:locations` - Geocode existing notices via postcodes.io
- `npm run test:scraper` - Test web scraping functionality

---

*Integration audit: 2026-01-22*
