# SaaS Settings & Configuration - Quick Reference Guide

## Key Findings Summary

### Current Codebase Implementation

The Ralph's Civic Notices project already has foundational patterns in place:

**Existing Implementation:**
- Council settings table with auto-population fields (`council_settings`)
- Department settings stored in `departments.settings` JSONB column
- Organization-level settings support
- RBAC permission system for settings access
- Settings validation at form level

**Location of Implementation:**
- Backend API: `/server/routes/settings.ts`
- Council Settings UI: `/src/pages/council/Settings.tsx`
- Firm Settings UI: `/src/pages/firm/Settings.tsx`
- Admin Settings UI: `/src/pages/admin/Settings.tsx`
- Database Migrations: `/supabase/migrations/20260115_add_council_settings.sql`

---

## Architecture Quick Start

### 1. Hierarchical Settings Model

```
Platform Level (Global)
    └─ Organization Level (Tenant)
        └─ Department Level
            └─ User Level (Preferences)
```

**Key Principle:** Lower levels can override higher levels
- User settings override all
- Department settings override org/platform
- Organization settings override platform
- Platform settings are system defaults

### 2. Database Schema Essentials

```sql
-- Core pattern: JSONB for flexibility + structured columns for common data
CREATE TABLE {level}_settings (
  id UUID PRIMARY KEY,
  {entity}_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT,  -- 'string', 'number', 'boolean', 'object'
  is_inherited BOOLEAN DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMP,
  UNIQUE({entity}_id, setting_key)
);
```

### 3. Type Safety with Zod

```typescript
// Define once, validate everywhere
const SecuritySettingsSchema = z.object({
  session_timeout_minutes: z.number().min(5).max(1440),
  require_two_factor_auth: z.boolean(),
  password_policy: z.object({
    min_length: z.number(),
    require_uppercase: z.boolean()
  })
});

// Automatic type inference
type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;
```

### 4. React Hook Pattern

```typescript
// Load, validate, save with one hook
const {
  settings,
  loading,
  error,
  isDirty,
  updateSetting,
  saveBatch
} = useSettings({
  level: 'organization',
  entityId: organization.id,
  validator: settingsValidator
});
```

---

## Implementation Checklist

### Phase 1: Database (IMMEDIATE)
- [ ] Create `platform_settings` table
- [ ] Create `organization_settings` table  
- [ ] Create `department_settings` table
- [ ] Create `user_settings` table
- [ ] Add proper indexes and RLS policies
- [ ] Create `api_keys` table for key management
- [ ] Add audit logging table

### Phase 2: Validation (HIGH PRIORITY)
- [ ] Define all setting schemas with Zod
- [ ] Create settings registry
- [ ] Implement validator class
- [ ] Add cross-field validation
- [ ] Create TypeScript types

### Phase 3: Backend API (HIGH PRIORITY)
- [ ] Create settings endpoints (GET, PATCH)
- [ ] Implement hierarchical resolution logic
- [ ] Add permission checking
- [ ] Create batch update endpoints
- [ ] Add audit logging to all changes

### Phase 4: Frontend Components (MEDIUM)
- [ ] Build generic settings form component
- [ ] Create category-based settings UI
- [ ] Implement dirty state tracking
- [ ] Add save confirmation
- [ ] Create loading states

### Phase 5: Caching (MEDIUM)
- [ ] Implement memory cache
- [ ] Add cache invalidation
- [ ] Create monitoring hooks
- [ ] Add real-time updates via subscriptions

### Phase 6: Feature Flags (OPTIONAL)
- [ ] Design feature flag system
- [ ] Create flag evaluation engine
- [ ] Build flag management UI
- [ ] Implement gradual rollout

### Phase 7: API Key Management (HIGH SECURITY)
- [ ] Implement secure key generation
- [ ] Add key validation middleware
- [ ] Create key rotation logic
- [ ] Build management UI
- [ ] Add usage tracking

### Phase 8: Security & Audit (ONGOING)
- [ ] Implement audit logging
- [ ] Add encryption for sensitive settings
- [ ] Create permission system
- [ ] Add rate limiting
- [ ] Build audit UI

---

## Code Templates

### Template 1: Basic Settings Hook

```typescript
export function useSettings(level: 'organization' | 'department') {
  const { organization } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, [organization?.id]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from(`${level}_settings`)
      .select('*')
      .eq(`${level.slice(0, -1)}_id`, organization?.id);
    
    setSettings(Object.fromEntries(
      data?.map(s => [s.setting_key, s.setting_value]) ?? []
    ));
    setLoading(false);
  };

  const saveSetting = async (key: string, value: any) => {
    await supabase
      .from(`${level}_settings`)
      .upsert({
        [`${level.slice(0, -1)}_id`]: organization?.id,
        setting_key: key,
        setting_value: value,
        updated_at: new Date()
      }, {
        onConflict: `${level.slice(0, -1)}_id,setting_key`
      });
  };

  return { settings, loading, error, saveSetting };
}
```

### Template 2: Settings Validator

```typescript
const settingsValidator = new SettingsValidator();

settingsValidator.register({
  key: 'notifications.email_enabled',
  schema: z.boolean(),
  category: 'notifications',
  level: 'organization',
  isInheritable: true,
  isReadOnly: false,
  description: 'Enable email notifications'
});

// Validate before save
const result = settingsValidator.validate('notifications.email_enabled', true);
if (!result.valid) {
  console.error(result.errors);
}
```

### Template 3: Hierarchical Resolution

```typescript
// Resolve setting with fallback chain
const sessionTimeout = resolveSettings('security.session_timeout_minutes', {
  userSettings: userPrefs?.settings,
  departmentSettings: dept?.settings,
  organizationSettings: org?.settings,
  platformSettings: platform?.settings
}) || 120; // Default fallback
```

### Template 4: API Key Generation

```typescript
// Generate secure key
const { fullKey, prefix, hash } = ApiKeyManager.generateApiKey('test');

// Store only prefix + hash (never the full key)
await supabase.from('api_keys').insert({
  key_prefix: prefix,
  key_hash: hash,
  name: 'Integration Key',
  permissions: ['read:notices', 'write:notices'],
  organization_id: org.id
});

// Return full key to user (show only once!)
console.log(`Save this key: ${fullKey}`);
```

---

## Design Patterns

### Pattern 1: Inheritance with Override
Settings cascade from platform → org → dept → user. Each level can optionally override.

### Pattern 2: Schema Registry
All settings defined in one registry enables:
- Central source of truth
- Automatic documentation
- Type safety
- Permission mapping

### Pattern 3: Lazy Loading Cache
Load settings on first use, cache in memory, invalidate on changes.

### Pattern 4: Dirty State Tracking
Track user edits before save:
- Show unsaved indicator
- Warn on navigation
- Enable/disable save button

### Pattern 5: Audit Trail
Log all changes:
- Who changed it
- When it changed
- What changed (old → new)
- Why (reason field optional)

---

## Common Settings Categories

### Security Settings
```typescript
{
  session_timeout_minutes: 120,
  max_failed_login_attempts: 5,
  require_two_factor_auth: false,
  password_policy: {
    min_length: 12,
    require_uppercase: true,
    require_numbers: true,
    expiry_days: 90
  }
}
```

### Notification Settings
```typescript
{
  email_enabled: true,
  slack_enabled: false,
  notification_channels: ['email', 'in-app'],
  alert_thresholds: {
    error_rate: 0.05,
    response_time_ms: 1000
  }
}
```

### Feature Flags
```typescript
{
  new_publish_flow: {
    enabled: true,
    rollout_percentage: 100,
    target_organizations: ['org-1', 'org-2']
  }
}
```

### Integration Settings
```typescript
{
  stripe_enabled: true,
  stripe_api_key_hash: 'sha256_hash_only',
  sendgrid_enabled: true,
  slack_webhook_enabled: true
}
```

---

## Performance Tips

1. **Cache settings in memory** - Most settings don't change frequently
2. **Use indexed queries** - Index `organization_id`, `department_id`, `user_id`
3. **Batch updates** - Combine multiple setting updates in one request
4. **Real-time subscriptions** - Listen for changes instead of polling
5. **Lazy load** - Only load settings when user navigates to settings page

---

## Security Checklist

- [ ] Never log full API keys, only prefix
- [ ] Hash API keys with SHA-256 before storage
- [ ] Use timing-safe comparison when validating keys
- [ ] Implement rate limiting on settings endpoints
- [ ] Add audit logging to all settings changes
- [ ] Encrypt sensitive settings at rest
- [ ] Validate settings against defined schemas
- [ ] Use RLS policies to restrict data access
- [ ] Require permission checks for admin settings
- [ ] Implement IP allowlisting for API keys

---

## Troubleshooting

**Problem:** Settings not loading
**Solution:** Check RLS policies allow user to read table, verify correct entity_id

**Problem:** Changes not appearing
**Solution:** Clear cache, check permissions, verify updated_at timestamp

**Problem:** Validation errors
**Solution:** Run schema validation in console, check JSONB structure

**Problem:** API key not working
**Solution:** Verify key_hash matches, check is_active flag, verify permissions

---

## Resources

- Full Documentation: `SAAS_SETTINGS_CONFIGURATION_RESEARCH.md`
- Current Implementation: See files listed at top
- Zod Validation Docs: https://zod.dev
- Supabase RLS: https://supabase.io/docs/guides/auth/row-level-security
- Feature Flags Guide: https://launchdarkly.com/blog/feature-flag-basics

---

## Next Steps

1. **Review** the full research document
2. **Choose** which features to implement first
3. **Design** database schema for your use case
4. **Create** Zod schemas for your settings
5. **Build** API endpoints
6. **Develop** React components
7. **Test** thoroughly before production

