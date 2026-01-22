# Technical Patterns Research

**Project:** Ralph's Civic Notices
**Researched:** 2026-01-22
**Focus:** Patterns for existing stack (React 19, Express, Supabase, Stripe, MapLibre GL)
**Overall Confidence:** HIGH - patterns derived from actual codebase analysis

---

## 1. Multi-Tenant SaaS Patterns with Supabase

### Current Implementation (HIGH confidence - verified from codebase)

The codebase implements a **dual-level tenancy model**:

**Organization Level:**
- `organizations` table as the top-level tenant
- Organization memberships with `owner` and `org_admin` roles
- Org admins can view all department data within their organization

**Department Level:**
- `departments` table scoped to organizations
- Department memberships with `department_admin`, `editor`, `viewer` roles
- Data isolation enforced at department level

```
Organization (Council/Firm)
    |
    +-- Department 1 (Licensing)
    |       |-- notices (scoped to dept)
    |       |-- representations (scoped to dept)
    |       +-- templates (scoped to dept)
    |
    +-- Department 2 (Planning)
            |-- notices
            |-- representations
            +-- templates
```

### Row-Level Security (RLS) Pattern

**Defense in Depth approach** - multiple layers of isolation:

```sql
-- Layer 1: Department membership check
CREATE POLICY "Users see notices in their departments"
ON public.notices
FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id
    FROM public.department_memberships
    WHERE user_id = auth.uid()
  )
  -- Layer 2: Org admin override
  OR organization_id IN (
    SELECT organization_id
    FROM public.organization_memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'org_admin')
  )
);
```

### RBAC Implementation

**Three-table pattern:**
1. `roles` - role definitions with hierarchy levels
2. `permissions` - granular permissions (e.g., `notices.create`, `representations.export`)
3. `role_permissions` - many-to-many mapping

**Permission checking function:**
```sql
CREATE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_department_id UUID,
  p_permission_name TEXT
) RETURNS BOOLEAN
```

### Auth Middleware Pattern (Express)

The codebase uses a layered auth middleware approach:

```typescript
// Layer 1: requireAuth - validates Supabase JWT
// Layer 2: loadUserPermissions - populates req.user.permissions
// Layer 3: requirePermission('notices.create') - checks specific permission

router.post('/notices/draft',
  requireAuth,
  loadUserPermissions,
  requirePermission('notices.create'),
  async (req, res) => { ... }
);
```

**User context extraction from JWT claims:**
```typescript
const appMetadata = user.app_metadata || {};
req.user = {
  id: user.id,
  email: user.email,
  organizationId: appMetadata.organization_id,
  departmentIds: appMetadata.department_ids,
  isPlatformAdmin: appMetadata.is_platform_admin === true,
};
```

### Recommendations

1. **Continue dual-level model** - appropriate for councils with multiple departments
2. **Add `current_department_id` to session** - avoids passing departmentId on every request
3. **Consider JWT custom claims for permissions** - reduces database lookups
4. **Implement audit logging** - already has `audit_logs` table, ensure all mutations logged

---

## 2. Geospatial Search Patterns with PostGIS and MapLibre

### Current Implementation (HIGH confidence - verified from codebase)

**Database functions for spatial queries:**

```sql
-- Bounding box search
CREATE FUNCTION get_bbox_notices(min_lat, min_lng, max_lat, max_lng)
RETURNS TABLE(...)

-- Radius search
CREATE FUNCTION get_nearby_notices(lng, lat, radius_meters)
RETURNS TABLE(...)
```

**Geocoding flow:**
1. Extract UK postcode from address using regex
2. Lookup coordinates via postcodes.io (free, no API key)
3. Cache results in `postcode_cache` table
4. Store lat/lng on notices for spatial queries

```typescript
// server/lib/geocode.ts
export async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  // Check cache first
  const cached = await lookupCachedPostcode(compact);
  if (cached) return cached;

  // Fetch from postcodes.io
  const response = await fetch(`${POSTCODES_IO_URL}/postcodes/${normalised}`);
  // Cache and return
}
```

### MapLibre GL Patterns (Frontend)

**Clustering with GeoJSON source:**
```typescript
<Source
  id={SOURCE_ID}
  type="geojson"
  data={featureCollection}
  cluster
  clusterRadius={60}
  clusterMaxZoom={16}
>
  <Layer {...clusterLayer} />
  <Layer {...clusterCountLayer} />
  <Layer {...noticePointsLayer} />
</Source>
```

**Feature state for hover/active styling:**
```typescript
map.setFeatureState(
  { source: SOURCE_ID, id: noticeId },
  { active: true, hover: false }
);
```

**Bounds change debouncing (critical for performance):**
```typescript
// Debounce moveEnd to prevent excessive API calls during zoom
moveEndTimeoutRef.current = window.setTimeout(() => {
  if (isAnimatingRef.current) return; // Block during programmatic zoom
  onBoundsChange(bbox, zoom);
}, 1000);
```

### Recommendations

1. **Add PostGIS `geography` column** - enables accurate distance calculations
2. **Consider tile-based loading** - for large notice counts, use vector tiles
3. **Implement server-side clustering** - Supercluster on server for >10k notices
4. **Add spatial indexes** - `CREATE INDEX idx_notices_location ON notices USING GIST(location);`

---

## 3. Document OCR and Text Extraction

### Current Implementation (HIGH confidence - verified from codebase)

**Multi-format support in `extractTextFromBuffer`:**

| Format | Library | Notes |
|--------|---------|-------|
| PDF | pdf-parse + Tesseract fallback | Falls back to OCR if PDF has no text layer |
| DOCX | mammoth | Native .docx parsing |
| RTF | Custom parser | Minimal RTF -> text conversion |
| TXT | Direct read | UTF-8 encoding |
| Images | Tesseract.js | PNG/JPG/TIFF OCR |
| Legacy DOC | textract | Requires system dependencies |

**OCR fallback pattern:**
```typescript
// Try native PDF text extraction first
const result = await parsePdf(buffer);
let text = result.text.trim();

if (!text) {
  // Fall back to OCR for scanned PDFs
  const worker = await createWorker("eng");
  const { data } = await worker.recognize(buffer);
  text = data.text;
}
```

**Post-processing with cleanup:**
```typescript
// Apply AI-powered text cleanup (cleanupNoticeText)
// Fixes: ALL CAPS, malformed postcodes, common OCR errors
ocr_text = cleanupNoticeText(text);
```

**Duplicate detection via SHA-256:**
```typescript
const sha256 = createHash("sha256").update(file.buffer).digest("hex");
if (seenHashes.has(sha256)) {
  return { ...cached, info: "Already processed" };
}
```

### Legal Details Extraction Pattern

The wizard uses structured extraction from OCR text:

```typescript
// src/next/publish/flow/lib/legalDetails.ts
export function extractLegalDetailsFromOcr(ocrText: string): {
  extracted: Partial<LegalDetails>;
  highlights: OCRHighlight[];
  confidence: Record<string, number>;
}
```

**Regex-based field detection:**
- Applicant name patterns
- Premises address patterns
- UK postcode patterns
- Date patterns (deadline, publication)

### Recommendations

1. **Add confidence scoring** - show users when OCR quality is low
2. **Consider cloud OCR for production** - Google Vision or AWS Textract for better accuracy
3. **Implement preview/correction UI** - let users fix OCR errors before submission
4. **Add language detection** - support Welsh for Welsh councils

---

## 4. Email Notification Systems with Resend

### Current Implementation (HIGH confidence - verified from codebase)

**Lazy initialization pattern:**
```typescript
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}
```

**Email types implemented:**

| Email Type | Trigger | Template |
|------------|---------|----------|
| Notice confirmation | After publish | HTML + plain text |
| Representation confirmation | After submission | Includes reference number |
| Team invitation | Admin action | Role-specific content |
| Council department invitation | Admin action | Magic link for acceptance |

**Template structure:**
- Inline CSS for email client compatibility
- Both HTML and plain text versions
- Role-specific content variations

```typescript
export async function sendNoticeConfirmation(
  to: string,
  data: NoticeConfirmationData
): Promise<{ success: boolean; error?: string }>
```

### Graceful Degradation Pattern

```typescript
if (!process.env.RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not configured, skipping email');
  return { success: false, error: 'Email service not configured' };
}
```

### Recommendations

1. **Add email queue** - use Supabase Edge Functions or Bull queue for reliability
2. **Implement retry logic** - exponential backoff for transient failures
3. **Add email tracking** - track opens/clicks for engagement metrics
4. **Template externalization** - move templates to database for admin editing
5. **Add unsubscribe handling** - GDPR compliance for marketing emails

---

## 5. Stripe Integration for Mixed Pricing Models

### Current Implementation (HIGH confidence - verified from codebase)

**Lazy initialization (same pattern as Resend):**
```typescript
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not set');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeClient;
}
```

**Current pricing model:** Per-notice payment (GBP 50)

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'gbp',
      product_data: {
        name: `Public Notice - ${noticeType}`,
        description: 'Publication of statutory notice',
      },
      unit_amount: 5000, // GBP 50 in pence
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: returnUrl + '?payment=success',
  cancel_url: returnUrl + '?payment=cancelled',
  metadata: { noticeId, noticeType },
});
```

**Webhook handling pattern:**
```typescript
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const { noticeId } = session.metadata;
    // Update notice status to 'published'
    // Send confirmation email
    // Fire internal webhook
  }
});
```

### Mixed Pricing Model Recommendations

For subscription + per-transaction:

1. **Create Stripe Products:**
   - `prod_council_subscription` - monthly subscription for councils
   - `prod_notice_publication` - per-notice fee (bundled credits or pay-as-you-go)

2. **Subscription tiers pattern:**
```typescript
const TIERS = {
  starter: { price_id: 'price_starter', notices_included: 10 },
  professional: { price_id: 'price_pro', notices_included: 50 },
  enterprise: { price_id: 'price_enterprise', notices_included: 'unlimited' },
};
```

3. **Credit/usage tracking:**
```sql
CREATE TABLE organization_usage (
  organization_id UUID REFERENCES organizations(id),
  period_start DATE,
  period_end DATE,
  notices_published INTEGER DEFAULT 0,
  notices_included INTEGER,
  overage_count INTEGER DEFAULT 0
);
```

4. **Metered billing for overages:**
```typescript
await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
  quantity: overageCount,
  timestamp: 'now',
  action: 'increment',
});
```

---

## 6. React 19 Patterns for Multi-Step Wizards

### Current Implementation (HIGH confidence - verified from codebase)

**Wizard step management:**
```typescript
// src/wizard/wizardSteps.ts
export const wizardSteps = [
  { id: 1, path: '/publish/step-1', label: 'Notice Type' },
  { id: 2, path: '/publish/step-2', label: 'Upload' },
  { id: 3, path: '/publish/step-3', label: 'Details' },
  { id: 4, path: '/publish/step-4', label: 'Review & Pay' },
];
```

**Draft persistence with sessionStorage:**
```typescript
// src/wizard/draftStore.ts
const STORAGE_KEY = "publish:draftId";

export function setDraftId(id: string | null) {
  draftIdRef = id ?? null;
  if (id) {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
```

**URL-based state synchronization:**
```typescript
const buildStepUrl = (target: Step, overrideDraft?: string | null) => {
  // Handles both public and portal contexts
  let base: string;
  if (pathname.startsWith('/f/')) {
    base = `/f/${firmSlug}/publish/step-${target}`;
  } else if (pathname.startsWith('/c/')) {
    base = `/c/${orgSlug}/${deptSlug}/publish/step-${target}`;
  } else {
    base = STEP_PATHS[target];
  }

  const params = new URLSearchParams(search);
  if (effectiveDraft) params.set("draft", effectiveDraft);
  return query ? `${base}?${query}` : base;
};
```

**Error boundary for wizard resilience:**
```typescript
class WizardBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[publish-wizard:error]", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return <RecoveryUI onReset={this.props.onReset} />;
    }
    return this.props.children;
  }
}
```

**Lazy loading for heavy components:**
```typescript
const LazyTemplateBuilderForm = React.lazy(() => import("./TemplateBuilderForm"));
const LazyNoticePreview = React.lazy(() => import("./NoticePreview"));
```

### React 19 Specific Patterns

**Safe transitions for navigation:**
```typescript
// src/wizard/useSafeTransition.ts
// Prevents navigation during pending state updates
```

**Form validation with Zod schemas:**
```typescript
// src/next/publish/schema/registry.ts
export function getNoticeBuilder(noticeTypeId: string) {
  return {
    schema: ZodSchema,
    mapToNoticeBase: (validated) => NoticeBase,
  };
}
```

### Recommendations

1. **Add `use()` hook for data loading** - React 19's native suspense integration
2. **Consider React Server Components** - for static wizard shell
3. **Implement optimistic updates** - show success state before server confirmation
4. **Add progress persistence to database** - not just sessionStorage for cross-device resume
5. **Add step validation rules** - prevent skipping to later steps without completing earlier ones

---

## Architectural Patterns Summary

### Cross-Cutting Patterns Observed

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| Lazy initialization | Stripe, Resend, Supabase clients | Good - prevents startup failures |
| Graceful degradation | Email, payments | Good - features optional |
| Defense in depth | RLS + middleware + frontend | Excellent - multi-layer security |
| URL-based state | Wizard draft persistence | Good - shareable/bookmarkable |
| Caching | Postcode geocoding | Good - reduces API calls |
| Debouncing | Map bounds changes | Critical - prevents infinite loops |

### Anti-Patterns to Avoid

1. **Don't store secrets in frontend** - use environment variables server-side only
2. **Don't trust frontend validation alone** - always validate on server
3. **Don't skip RLS policies** - even with service role, add policies for safety
4. **Don't block webhook responses** - fire-and-forget for internal webhooks
5. **Don't mix sync/async in auth middleware** - causes subtle bugs

### Security Considerations

1. **JWT validation** - always verify with Supabase, don't just decode
2. **RBAC enforcement** - check permissions at route level AND database level
3. **Webhook signature verification** - always verify Stripe signatures
4. **Rate limiting** - implemented for upload routes (20/min per IP)
5. **Input sanitization** - postcode normalization prevents injection

---

## Sources

- Codebase analysis: `server/middleware/auth.ts`
- Codebase analysis: `server/routes/notices.ts`
- Codebase analysis: `server/routes/stripe.ts`
- Codebase analysis: `server/services/email.ts`
- Codebase analysis: `server/lib/geocode.ts`
- Codebase analysis: `server/utils/extractText.ts`
- Codebase analysis: `src/components/search/NoticesMapView.tsx`
- Codebase analysis: `src/next/publish/flow/NewPublishFlow.tsx`
- Codebase analysis: `src/wizard/draftStore.ts`
- Migration files: `supabase/migrations/20251021000001_memberships.sql`
- Migration files: `supabase/migrations/20260121100001_department_isolation_rls.sql`
- Migration files: `supabase/migrations/20251025000003_rbac_permissions.sql`
