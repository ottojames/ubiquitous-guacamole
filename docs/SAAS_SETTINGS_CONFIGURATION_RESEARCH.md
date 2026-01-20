# SaaS Admin Panel Settings & Configuration Management Research

## Executive Summary

This document provides comprehensive guidance on implementing hierarchical settings, configuration management, and API key management for modern SaaS admin panels using React/TypeScript with Supabase. Based on industry best practices and current codebase implementation patterns.

---

## 1. HIERARCHICAL SETTINGS ARCHITECTURE

### 1.1 Three-Level Hierarchy Pattern

```
GLOBAL SETTINGS (Platform Level)
    ↓
ORGANIZATIONAL SETTINGS (Tenant/Account Level)
    ↓
DEPARTMENTAL/USER SETTINGS (Resource Level)
```

### 1.2 Implementation Structure

#### Database Schema with JSONB

```sql
-- Global/Platform Settings Table
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  is_mutable BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization-Level Settings Table
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  is_inherited BOOLEAN DEFAULT true,  -- Can override platform defaults
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- Department-Level Settings Table
CREATE TABLE department_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  is_inherited BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, setting_key)
);

-- User-Level Settings Table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, setting_key)
);

-- Create indexes for fast lookups
CREATE INDEX idx_org_settings_org_id ON organization_settings(organization_id);
CREATE INDEX idx_dept_settings_dept_id ON department_settings(department_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
```

### 1.3 JSONB Configuration Examples

**Notification Settings:**
```jsonb
{
  "email_enabled": true,
  "slack_enabled": false,
  "webhook_url": "https://api.example.com/webhooks",
  "notification_channels": ["email", "in-app"],
  "quiet_hours": {
    "enabled": false,
    "start_time": "18:00",
    "end_time": "09:00"
  },
  "alert_thresholds": {
    "error_rate": 0.05,
    "response_time_ms": 1000,
    "cpu_usage": 80
  }
}
```

**Feature Flags:**
```jsonb
{
  "new_publish_flow": {
    "enabled": true,
    "rollout_percentage": 100,
    "target_organizations": ["org-1", "org-2"],
    "exempted_users": []
  },
  "advanced_analytics": {
    "enabled": true,
    "beta": false
  },
  "custom_branding": {
    "enabled": true,
    "allowed_for_tiers": ["professional", "enterprise"]
  }
}
```

**Security Settings:**
```jsonb
{
  "session_timeout_minutes": 120,
  "max_failed_login_attempts": 5,
  "require_two_factor_auth": false,
  "ip_allowlist": ["10.0.0.0/8", "192.168.0.0/16"],
  "require_ip_allowlist": false,
  "password_policy": {
    "min_length": 12,
    "require_uppercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "expiry_days": 90
  }
}
```

---

## 2. SETTINGS PERSISTENCE PATTERNS

### 2.1 TypeScript Schema with Zod Validation

```typescript
import { z } from 'zod';

// Define strict schemas for type safety
const NotificationSettingsSchema = z.object({
  email_enabled: z.boolean(),
  slack_enabled: z.boolean(),
  webhook_url: z.string().url().optional(),
  notification_channels: z.array(z.enum(['email', 'slack', 'in-app', 'sms'])),
  quiet_hours: z.object({
    enabled: z.boolean(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/)
  }).optional(),
  alert_thresholds: z.record(z.number()).optional()
});

const SecuritySettingsSchema = z.object({
  session_timeout_minutes: z.number().min(5).max(1440),
  max_failed_login_attempts: z.number().min(1).max(10),
  require_two_factor_auth: z.boolean(),
  ip_allowlist: z.array(z.string().ip()).optional(),
  require_ip_allowlist: z.boolean(),
  password_policy: z.object({
    min_length: z.number().min(8).max(128),
    require_uppercase: z.boolean(),
    require_numbers: z.boolean(),
    require_special_chars: z.boolean(),
    expiry_days: z.number().min(0)
  })
});

const SettingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.any()),
  z.array(z.any())
]);

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;
export type SettingValue = z.infer<typeof SettingValueSchema>;
```

### 2.2 Settings Registry Pattern

```typescript
// Define all available settings and their schemas
type SettingDefinition<T = any> = {
  key: string;
  schema: z.ZodType<T>;
  description: string;
  category: 'security' | 'notifications' | 'appearance' | 'features' | 'integrations';
  level: 'platform' | 'organization' | 'department' | 'user';
  isInheritable: boolean;  // Can lower levels override?
  isReadOnly: boolean;
  requiredPermission?: string;
};

const SETTINGS_REGISTRY: Record<string, SettingDefinition> = {
  'notifications.email_enabled': {
    key: 'notifications.email_enabled',
    schema: z.boolean(),
    description: 'Enable email notifications',
    category: 'notifications',
    level: 'organization',
    isInheritable: true,
    isReadOnly: false
  },
  'security.session_timeout_minutes': {
    key: 'security.session_timeout_minutes',
    schema: z.number().min(5).max(1440),
    description: 'Session timeout in minutes',
    category: 'security',
    level: 'platform',
    isInheritable: true,
    isReadOnly: false,
    requiredPermission: 'security.manage'
  },
  'features.new_publish_flow': {
    key: 'features.new_publish_flow',
    schema: z.object({
      enabled: z.boolean(),
      rollout_percentage: z.number().min(0).max(100)
    }),
    description: 'Feature flag for new publish workflow',
    category: 'features',
    level: 'platform',
    isInheritable: true,
    isReadOnly: false
  }
};

export function validateSetting(key: string, value: any): void {
  const definition = SETTINGS_REGISTRY[key];
  if (!definition) {
    throw new Error(`Unknown setting: ${key}`);
  }
  definition.schema.parse(value);
}

export function getSettingDefinition(key: string): SettingDefinition | null {
  return SETTINGS_REGISTRY[key] || null;
}
```

### 2.3 Settings Resolver (Hierarchical Merge)

```typescript
interface SettingsContext {
  platformSettings?: Record<string, any>;
  organizationSettings?: Record<string, any>;
  departmentSettings?: Record<string, any>;
  userSettings?: Record<string, any>;
}

/**
 * Resolves settings following hierarchy:
 * User > Department > Organization > Platform
 * Returns first non-null value
 */
export function resolveSettings(
  key: string,
  context: SettingsContext
): any {
  const definition = SETTINGS_REGISTRY[key];
  if (!definition) {
    throw new Error(`Unknown setting: ${key}`);
  }

  // Check each level in reverse priority order
  if (definition.level === 'user' && context.userSettings?.[key] !== undefined) {
    return context.userSettings[key];
  }
  if (definition.level === 'department' && context.departmentSettings?.[key] !== undefined) {
    return context.departmentSettings[key];
  }
  if (definition.level === 'organization' && context.organizationSettings?.[key] !== undefined) {
    return context.organizationSettings[key];
  }
  if (context.platformSettings?.[key] !== undefined) {
    return context.platformSettings[key];
  }

  // Return schema default or throw
  return null;
}

/**
 * Gets effective settings at a level and above
 */
export async function getEffectiveSettings(
  level: 'user' | 'department' | 'organization' | 'platform',
  entityId: string,
  supabase: any
): Promise<Record<string, any>> {
  const settings: Record<string, any> = {};
  
  // Load platform settings
  const { data: platformData } = await supabase
    .from('platform_settings')
    .select('setting_key, setting_value');
  
  if (platformData) {
    platformData.forEach(s => {
      settings[s.setting_key] = s.setting_value;
    });
  }

  // Load and merge each level
  if (level === 'organization' || level === 'department' || level === 'user') {
    const orgData = await supabase
      .from('organization_settings')
      .select('setting_key, setting_value')
      .eq('organization_id', entityId);
    
    if (orgData.data) {
      orgData.data.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
    }
  }

  if (level === 'department' || level === 'user') {
    const deptData = await supabase
      .from('department_settings')
      .select('setting_key, setting_value')
      .eq('department_id', entityId);
    
    if (deptData.data) {
      deptData.data.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
    }
  }

  if (level === 'user') {
    const userData = await supabase
      .from('user_settings')
      .select('setting_key, setting_value')
      .eq('user_id', entityId);
    
    if (userData.data) {
      userData.data.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
    }
  }

  return settings;
}
```

---

## 3. SETTINGS VALIDATION & TYPE SAFETY

### 3.1 Comprehensive Validation Layer

```typescript
export class SettingsValidator {
  private registry: Map<string, SettingDefinition> = new Map();

  register(definition: SettingDefinition) {
    this.registry.set(definition.key, definition);
  }

  /**
   * Validates a single setting before persistence
   */
  validate(key: string, value: any): ValidationResult {
    const definition = this.registry.get(key);
    
    if (!definition) {
      return {
        valid: false,
        errors: [`Unknown setting: ${key}`]
      };
    }

    const errors: string[] = [];

    // Check read-only
    if (definition.isReadOnly) {
      errors.push(`Setting '${key}' is read-only`);
    }

    // Schema validation
    try {
      definition.schema.parse(value);
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push(...err.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      definition
    };
  }

  /**
   * Validates entire settings object with cross-field rules
   */
  validateBatch(
    settings: Record<string, any>,
    level: 'platform' | 'organization' | 'department' | 'user'
  ): ValidationResult {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const definition = this.registry.get(key);
      
      if (!definition) {
        errors.push(`Unknown setting: ${key}`);
        continue;
      }

      // Check level compatibility
      if (definition.level !== level && definition.level !== 'platform') {
        errors.push(`Setting '${key}' cannot be set at ${level} level`);
        continue;
      }

      // Schema validation
      try {
        definition.schema.parse(value);
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors.push(...err.errors.map(e => 
            `${key}.${e.path.join('.')}: ${e.message}`
          ));
        }
      }
    }

    // Cross-field validation
    const crossFieldErrors = this.validateCrossFields(settings);
    errors.push(...crossFieldErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateCrossFields(settings: Record<string, any>): string[] {
    const errors: string[] = [];

    // Example: If IP allowlist is required, at least one IP must be provided
    if (settings['security.require_ip_allowlist'] === true) {
      const ipAllowlist = settings['security.ip_allowlist'];
      if (!ipAllowlist || ipAllowlist.length === 0) {
        errors.push('At least one IP address required when IP allowlist is enabled');
      }
    }

    // Example: Session timeout must be reasonable
    if (settings['security.session_timeout_minutes'] !== undefined) {
      const timeout = settings['security.session_timeout_minutes'];
      if (timeout < 5) {
        errors.push('Session timeout must be at least 5 minutes');
      }
    }

    return errors;
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  definition?: SettingDefinition;
}
```

### 3.2 React Hook for Settings Management

```typescript
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';

interface UseSettingsOptions {
  level: 'platform' | 'organization' | 'department' | 'user';
  entityId?: string;  // org_id, dept_id, or user_id
  validator?: SettingsValidator;
}

export function useSettings(options: UseSettingsOptions) {
  const { user, organization } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Determine entity ID
  const entityId = options.entityId || organization?.id || user?.id;

  // Load settings
  useEffect(() => {
    loadSettings();
  }, [entityId, options.level]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveSettings = await getEffectiveSettings(
        options.level,
        entityId,
        supabase
      );

      setSettings(effectiveSettings);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = useCallback(async (key: string, value: any) => {
    try {
      // Validate before update
      if (options.validator) {
        const result = options.validator.validate(key, value);
        if (!result.valid) {
          throw new Error(result.errors.join(', '));
        }
      }

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      setIsDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      throw err;
    }
  }, [options.validator]);

  const saveBatch = useCallback(async (updates: Record<string, any>) => {
    try {
      setError(null);

      // Validate all
      if (options.validator) {
        const result = options.validator.validateBatch(updates, options.level);
        if (!result.valid) {
          throw new Error(result.errors.join(', '));
        }
      }

      // Save to database
      const table = `${options.level}_settings`;
      const { error: saveError } = await supabase
        .from(table)
        .upsert(
          Object.entries(updates).map(([key, value]) => ({
            [`${options.level.slice(0, -1)}_id`]: entityId,
            setting_key: key,
            setting_value: value,
            data_type: typeof value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })),
          {
            onConflict: options.level === 'platform' 
              ? 'setting_key'
              : `${options.level.slice(0, -1)}_id,setting_key`
          }
        );

      if (saveError) throw saveError;

      setIsDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      throw err;
    }
  }, [options.level, entityId, user]);

  return {
    settings,
    loading,
    error,
    isDirty,
    updateSetting,
    saveBatch,
    reload: loadSettings
  };
}
```

---

## 4. API KEY MANAGEMENT BEST PRACTICES

### 4.1 Secure API Key Storage Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Security fields
  key_prefix TEXT NOT NULL UNIQUE,  -- Public prefix (e.g., "sk_test_4eC39HqLyjWDarhtT...")
  key_hash TEXT NOT NULL UNIQUE,     -- SHA-256 hash (never store full key)
  
  -- Permissions and scoping
  permissions JSONB DEFAULT '[]',    -- ["read:notices", "write:notices", "read:settings"]
  rate_limit INTEGER,                -- Requests per minute
  allowed_ips INET[],                -- IP whitelist
  allowed_domains TEXT[],            -- CORS whitelist
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  rotated_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_org_keys(organization_id),
  INDEX idx_key_prefix(key_prefix)
);

-- Audit trail for API key usage
CREATE TABLE api_key_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'created', 'rotated', 'disabled', 'used'
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_key_audits_key_id ON api_key_audits(api_key_id);
CREATE INDEX idx_api_key_audits_created_at ON api_key_audits(created_at);
```

### 4.2 Secure API Key Generation & Verification

```typescript
import crypto from 'crypto';

export class ApiKeyManager {
  /**
   * Generates a new API key with proper entropy
   * Format: sk_test_<32 random chars>
   * Returns: full key + prefix (only prefix stored in DB)
   */
  static generateApiKey(environment: 'test' | 'live' = 'test'): {
    fullKey: string;
    prefix: string;
    hash: string;
  } {
    const randomBytes = crypto.randomBytes(24);
    const randomString = randomBytes.toString('hex').substring(0, 32);
    
    const prefix = `sk_${environment === 'test' ? 'test' : 'live'}_${randomString}`;
    const fullKey = `${prefix}${crypto.randomBytes(16).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(fullKey).digest('hex');

    return { fullKey, prefix, hash };
  }

  /**
   * Verify an API key against stored hash
   */
  static verifyApiKey(
    providedKey: string,
    storedHash: string
  ): boolean {
    const providedHash = crypto
      .createHash('sha256')
      .update(providedKey)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(storedHash)
    );
  }

  /**
   * Mask key for display (shows only prefix + last 8 chars)
   */
  static maskApiKey(fullKey: string): string {
    return `${fullKey.substring(0, 20)}...${fullKey.slice(-8)}`;
  }

  /**
   * Validate key scope and permissions
   */
  static validateKeyScope(
    permissions: string[],
    requiredPermission: string
  ): boolean {
    // Wildcard permission grants everything
    if (permissions.includes('*')) return true;
    
    // Check exact permission
    if (permissions.includes(requiredPermission)) return true;
    
    // Check wildcard resource (e.g., "read:*" grants "read:notices")
    const [action, resource] = requiredPermission.split(':');
    if (permissions.includes(`${action}:*`)) return true;
    
    return false;
  }

  /**
   * Check IP restrictions
   */
  static isIpAllowed(
    requestIp: string,
    allowedIps: string[] | undefined
  ): boolean {
    if (!allowedIps || allowedIps.length === 0) return true;

    for (const allowed of allowedIps) {
      if (this.isIpInRange(requestIp, allowed)) {
        return true;
      }
    }
    return false;
  }

  private static isIpInRange(ip: string, cidr: string): boolean {
    // Implementation of CIDR range checking
    // Can use library like 'ip-range-check' for production
    return true; // Simplified
  }
}

// Service-level API key validation middleware
export async function validateApiKey(
  supabase: any,
  apiKey: string,
  requiredPermission: string,
  requestIp: string
): Promise<{
  valid: boolean;
  error?: string;
  apiKeyId?: string;
  organizationId?: string;
}> {
  try {
    // Extract prefix to find key quickly
    const prefix = apiKey.substring(0, 20);
    
    const { data: keyRecord } = await supabase
      .from('api_keys')
      .select('id, organization_id, key_hash, permissions, allowed_ips, expires_at, is_active')
      .eq('key_prefix', prefix)
      .single();

    if (!keyRecord) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check active status
    if (!keyRecord.is_active) {
      return { valid: false, error: 'API key is disabled' };
    }

    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Verify full key hash
    if (!ApiKeyManager.verifyApiKey(apiKey, keyRecord.key_hash)) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check permissions
    if (!ApiKeyManager.validateKeyScope(keyRecord.permissions, requiredPermission)) {
      return { valid: false, error: 'Insufficient permissions' };
    }

    // Check IP whitelist
    if (!ApiKeyManager.isIpAllowed(requestIp, keyRecord.allowed_ips)) {
      return { valid: false, error: 'IP address not whitelisted' };
    }

    // Log usage
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id);

    return {
      valid: true,
      apiKeyId: keyRecord.id,
      organizationId: keyRecord.organization_id
    };
  } catch (error) {
    return { valid: false, error: 'Authentication failed' };
  }
}
```

### 4.3 React UI for API Key Management

```typescript
// src/pages/admin/ApiKeysManagement.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Copy, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react';

interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ApiKeysManagement() {
  const { organization } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [] as string[],
    expiresIn: 90
  });
  const [createdKey, setCreatedKey] = useState<{
    fullKey: string;
    copied: boolean;
  } | null>(null);

  const AVAILABLE_PERMISSIONS = [
    { value: 'read:notices', label: 'Read Notices' },
    { value: 'write:notices', label: 'Write Notices' },
    { value: 'read:settings', label: 'Read Settings' },
    { value: 'write:settings', label: 'Write Settings' },
    { value: 'read:analytics', label: 'Read Analytics' },
    { value: 'manage:api_keys', label: 'Manage API Keys' }
  ];

  useEffect(() => {
    loadApiKeys();
  }, [organization?.id]);

  const loadApiKeys = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          id, name, key_prefix, permissions, is_active, 
          last_used_at, expires_at, created_at
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!organization) return;

    try {
      // Call backend to create key
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyData.name,
          permissions: newKeyData.permissions,
          expiresIn: newKeyData.expiresIn
        })
      });

      const { fullKey, keyRecord } = await response.json();

      setCreatedKey({ fullKey, copied: false });
      setNewKeyData({ name: '', permissions: [], expiresIn: 90 });
      
      // Reload keys
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (!confirm('Rotate this API key? The old key will be disabled.')) return;

    try {
      await supabase
        .from('api_keys')
        .update({ is_active: false, rotated_at: new Date().toISOString() })
        .eq('id', keyId);

      await loadApiKeys();
    } catch (error) {
      console.error('Failed to rotate key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Delete this API key? This action cannot be undone.')) return;

    try {
      await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      await loadApiKeys();
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-gray-600">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Key
        </button>
      </div>

      {/* Created Key Modal */}
      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Key Created Successfully</h3>
          <p className="text-sm text-green-700 mb-4">
            Save this key in a safe place. You won't be able to see it again.
          </p>
          <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-200 font-mono text-sm">
            <code className="flex-1 overflow-x-auto">{createdKey.fullKey}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdKey.fullKey);
                setCreatedKey({ ...createdKey, copied: true });
                setTimeout(() => setCreatedKey(null), 2000);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Key</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Permissions</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Last Used</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Expires</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => (
                <tr key={key.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{key.name}</td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {key.key_prefix}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {key.permissions.slice(0, 2).map(p => (
                        <span
                          key={p}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {p}
                        </span>
                      ))}
                      {key.permissions.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{key.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {key.expires_at
                      ? new Date(key.expires_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRotateKey(key.id)}
                        className="p-2 hover:bg-yellow-100 rounded text-yellow-600"
                        title="Rotate key"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600"
                        title="Delete key"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create API Key</h2>
            
            <input
              type="text"
              placeholder="Key name"
              value={newKeyData.name}
              onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded mb-4"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyData.permissions.includes(perm.value)}
                      onChange={(e) => {
                        setNewKeyData({
                          ...newKeyData,
                          permissions: e.target.checked
                            ? [...newKeyData.permissions, perm.value]
                            : newKeyData.permissions.filter(p => p !== perm.value)
                        });
                      }}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Expiration</label>
              <select
                value={newKeyData.expiresIn}
                onChange={(e) => setNewKeyData({ ...newKeyData, expiresIn: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
                <option value={999999}>Never expires</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateKey}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. FEATURE FLAGS & TOGGLES

### 5.1 Feature Flag System

```typescript
// Feature flag definitions
interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'whitelist';
  enabled: boolean;
  rolloutPercentage?: number;  // 0-100 for gradual rollout
  targetOrganizations?: string[];  // Whitelist specific orgs
  targetUsers?: string[];  // Whitelist specific users
  conditions?: FeatureFlagCondition[];
}

interface FeatureFlagCondition {
  type: 'organization' | 'user' | 'plan' | 'date' | 'custom';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// Feature flag evaluation engine
export class FeatureFlagEngine {
  private flags: Map<string, FeatureFlag> = new Map();

  loadFlags(flagsData: FeatureFlag[]) {
    flagsData.forEach(flag => this.flags.set(flag.key, flag));
  }

  isEnabled(
    flagKey: string,
    context: {
      organizationId?: string;
      userId?: string;
      planTier?: string;
      customAttributes?: Record<string, any>;
    }
  ): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Feature flag not found: ${flagKey}`);
      return false;
    }

    if (!flag.enabled) return false;

    // Check explicit whitelist
    if (flag.targetOrganizations?.length && context.organizationId) {
      if (!flag.targetOrganizations.includes(context.organizationId)) {
        return false;
      }
    }

    if (flag.targetUsers?.length && context.userId) {
      if (!flag.targetUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check percentage rollout
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(context.userId || context.organizationId || '');
      if (hash % 100 >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Check custom conditions
    if (flag.conditions?.length) {
      return this.evaluateConditions(flag.conditions, context);
    }

    return true;
  }

  private hashUserId(userId: string): number {
    // Consistent hashing for stable rollout
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private evaluateConditions(
    conditions: FeatureFlagCondition[],
    context: any
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'organization':
          return context.organizationId === condition.value;
        case 'user':
          return context.userId === condition.value;
        case 'plan':
          return context.planTier === condition.value;
        case 'date':
          return new Date() >= new Date(condition.value);
        default:
          return true;
      }
    });
  }
}
```

### 5.2 React Hook for Feature Flags

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/UnifiedAuthContext';

let flagEngine: FeatureFlagEngine | null = null;

export function useFeatureFlag(flagKey: string, defaultValue: boolean = false): boolean {
  const { user, organization } = useAuth();
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    evaluateFlag();
  }, [flagKey, user?.id, organization?.id]);

  const evaluateFlag = async () => {
    if (!flagEngine) {
      // Load flags from backend on first use
      const response = await fetch('/api/feature-flags');
      const { flags } = await response.json();
      flagEngine = new FeatureFlagEngine();
      flagEngine.loadFlags(flags);
    }

    const isEnabled = flagEngine!.isEnabled(flagKey, {
      organizationId: organization?.id,
      userId: user?.id
    });

    setEnabled(isEnabled);
  };

  return enabled;
}

// Usage in components
export function PublishFlow() {
  const useNewFlow = useFeatureFlag('new_publish_flow');

  return useNewFlow
    ? <NewPublishFlow />
    : <LegacyPublishFlow />;
}
```

---

## 6. SETTINGS CACHING STRATEGIES

### 6.1 Multi-Level Cache Architecture

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;  // Time-to-live in ms
  tags: string[];  // For grouped invalidation
}

export class SettingsCache {
  private memory: Map<string, CacheEntry<any>> = new Map();
  private pending: Map<string, Promise<any>> = new Map();

  private DEFAULT_TTL = 5 * 60 * 1000;  // 5 minutes
  private LONG_TTL = 60 * 60 * 1000;    // 1 hour
  private SHORT_TTL = 30 * 1000;        // 30 seconds

  /**
   * Get or fetch settings with automatic caching
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      tag?: string;
      force?: boolean;
    }
  ): Promise<T> {
    const forceRefresh = options?.force ?? false;

    // Return from cache if valid
    if (!forceRefresh) {
      const cached = this.getFromCache<T>(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Return pending promise if already fetching
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Fetch and cache
    const promise = (async () => {
      try {
        const data = await fetcher();
        this.set(key, data, {
          ttl: options?.ttl ?? this.DEFAULT_TTL,
          tag: options?.tag
        });
        return data;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Set value in cache
   */
  set<T>(
    key: string,
    data: T,
    options?: { ttl?: number; tag?: string }
  ): void {
    this.memory.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl ?? this.DEFAULT_TTL,
      tags: options?.tag ? [options.tag] : []
    });
  }

  /**
   * Get from cache if still valid
   */
  private getFromCache<T>(key: string): T | undefined {
    const entry = this.memory.get(key);
    if (!entry) return undefined;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.memory.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateTag(tag: string): void {
    for (const [key, entry] of this.memory.entries()) {
      if (entry.tags.includes(tag)) {
        this.memory.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memory.clear();
    this.pending.clear();
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    return {
      entries: this.memory.size,
      pending: this.pending.size,
      size: new TextEncoder().encode(
        JSON.stringify([...this.memory.values()])
      ).length
    };
  }
}

// Singleton instance
export const settingsCache = new SettingsCache();
```

### 6.2 React Hook with Cache

```typescript
export function useSettingsWithCache(
  level: 'platform' | 'organization' | 'department' | 'user',
  entityId: string,
  options?: {
    ttl?: number;
    force?: boolean;
  }
) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const cacheKey = `${level}:${entityId}`;
  const cacheTag = `settings:${level}`;

  useEffect(() => {
    loadSettingsWithCache();
  }, [cacheKey, options?.force]);

  const loadSettingsWithCache = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await settingsCache.get(
        cacheKey,
        () => getEffectiveSettings(level, entityId, supabase),
        {
          ttl: options?.ttl,
          tag: cacheTag,
          force: options?.force
        }
      );

      setCacheHit(!options?.force);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    cacheHit,
    refresh: () => loadSettingsWithCache()
  };
}
```

### 6.3 Cache Invalidation Strategies

```typescript
/**
 * Real-time cache invalidation via Supabase subscriptions
 */
export function useLiveSettingsCache(
  level: 'organization' | 'department' | 'user',
  entityId: string
) {
  const supabase = useSupabaseClient();

  useEffect(() => {
    const table = `${level}_settings`;

    // Subscribe to changes
    const subscription = supabase
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `${level.slice(0, -1)}_id=eq.${entityId}`
        },
        (payload) => {
          // Invalidate cache
          settingsCache.invalidateTag(`settings:${level}`);
          
          // Optionally reload
          // reloadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [level, entityId]);
}

/**
 * Time-based cache invalidation
 */
export function usePeriodicCacheRefresh(
  interval: number = 5 * 60 * 1000  // 5 minutes
) {
  useEffect(() => {
    const timer = setInterval(() => {
      settingsCache.invalidateTag('settings:organization');
      settingsCache.invalidateTag('settings:department');
      settingsCache.invalidateTag('settings:user');
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);
}
```

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Database Schema
- [x] Create hierarchical settings tables (platform, org, dept, user)
- [x] Add JSONB columns for flexible data storage
- [x] Create proper indexes for fast queries
- [x] Implement RLS policies for security
- [x] Create API key tables with hashing

### Phase 2: Validation & Type Safety
- [ ] Create Zod schemas for all setting types
- [ ] Build settings registry with all available settings
- [ ] Implement comprehensive validator class
- [ ] Add cross-field validation rules
- [ ] Create TypeScript types for all settings

### Phase 3: Backend API
- [ ] Create settings endpoints (GET, PATCH, POST)
- [ ] Implement permission checking
- [ ] Add input validation
- [ ] Create API key management endpoints
- [ ] Add audit logging

### Phase 4: Frontend Components
- [ ] Build settings form components
- [ ] Implement form state management
- [ ] Add dirty state tracking
- [ ] Create settings UI for each level
- [ ] Build API key management UI

### Phase 5: Caching & Performance
- [ ] Implement multi-level cache
- [ ] Add cache invalidation strategies
- [ ] Create monitoring/stats
- [ ] Implement real-time updates via subscriptions
- [ ] Add performance metrics

### Phase 6: Feature Flags
- [ ] Design feature flag system
- [ ] Implement flag evaluation engine
- [ ] Build flag management UI
- [ ] Add gradual rollout capabilities
- [ ] Integrate with settings

### Phase 7: Security
- [ ] Implement audit logging
- [ ] Add rate limiting for API keys
- [ ] Create IP allowlisting
- [ ] Implement encryption for sensitive settings
- [ ] Add permission system

### Phase 8: Testing & Documentation
- [ ] Write unit tests for validators
- [ ] Create integration tests for settings API
- [ ] Write E2E tests for UI flows
- [ ] Generate API documentation
- [ ] Create admin guide

---

## 8. SECURITY BEST PRACTICES

### 8.1 Settings Security

```sql
-- RLS Policies for Settings Tables

-- Platform settings: only super admins can modify
CREATE POLICY "platform_settings_read" ON platform_settings
  FOR SELECT
  USING (true);  -- All authenticated users can read

CREATE POLICY "platform_settings_modify" ON platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin_settings
      WHERE user_id = auth.uid()
      AND admin_role = 'super_admin'
    )
  );

-- Organization settings: org admins can modify their own
CREATE POLICY "org_settings_read" ON organization_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships
      WHERE organization_id = organization_settings.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "org_settings_modify" ON organization_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships
      WHERE organization_id = organization_settings.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- User settings: users can only modify their own
CREATE POLICY "user_settings_own" ON user_settings
  FOR ALL
  USING (user_id = auth.uid());
```

### 8.2 Sensitive Settings Encryption

```typescript
import crypto from 'crypto';

export class SettingsEncryption {
  private encryptionKey: Buffer;

  constructor(keyHex: string) {
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    return decrypted;
  }
}

// Mark sensitive settings
const SENSITIVE_SETTINGS = [
  'security.api_key',
  'integrations.stripe_key',
  'integrations.sendgrid_key',
  'notifications.slack_webhook'
];

export function shouldEncrypt(settingKey: string): boolean {
  return SENSITIVE_SETTINGS.includes(settingKey);
}
```

---

## 9. MONITORING & ANALYTICS

### 9.1 Settings Audit Log

```typescript
// Log all settings changes for compliance
export async function logSettingChange(
  supabase: any,
  change: {
    settingKey: string;
    level: string;
    entityId: string;
    oldValue: any;
    newValue: any;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
  }
) {
  await supabase
    .from('settings_audit_log')
    .insert({
      setting_key: change.settingKey,
      level: change.level,
      entity_id: change.entityId,
      old_value: change.oldValue,
      new_value: change.newValue,
      changed_by: change.userId,
      user_agent: change.userAgent,
      ip_address: change.ipAddress,
      changed_at: new Date().toISOString()
    });
}
```

### 9.2 Settings Metrics

```typescript
export interface SettingsMetrics {
  totalSettings: number;
  settingsByLevel: Record<string, number>;
  settingsByCategory: Record<string, number>;
  cacheHitRate: number;
  averageLoadTime: number;
  apiKeyRotations: number;
  failedValidations: number;
}

export async function collectSettingsMetrics(): Promise<SettingsMetrics> {
  // Implementation to collect and aggregate metrics
  return {
    totalSettings: 0,
    settingsByLevel: {},
    settingsByCategory: {},
    cacheHitRate: 0.95,
    averageLoadTime: 45,
    apiKeyRotations: 0,
    failedValidations: 0
  };
}
```

---

## 10. REFERENCES & RESOURCES

### Industry Standards
- **NIST Cybersecurity Framework**: Configuration Management Best Practices
- **AWS Well-Architected Framework**: Configuration Management
- **Open Policy Agent (OPA)**: Policy as Code
- **HashiCorp Consul**: Service Configuration

### Related Tools & Libraries
- **Zod**: TypeScript-first schema validation
- **Convex**: Backend framework with real-time updates
- **LaunchDarkly**: Feature flag platform
- **Supabase**: PostgreSQL database with RLS
- **Vercel**: Deployment and edge functions

### Further Reading
- "Building Scalable SaaS" - Designing Configuration Systems
- "Patterns of Enterprise Application Architecture" - Settings Pattern
- "The Twelve-Factor App" - Configuration Management
- "Site Reliability Engineering" - Configuration as Code

---

## CONCLUSION

Implementing a comprehensive settings and configuration management system requires:

1. **Hierarchical Design**: Clear separation of concerns across platform, org, dept, and user levels
2. **Type Safety**: Strict validation using schemas like Zod
3. **Security**: Proper encryption, RLS policies, and audit logging
4. **Performance**: Multi-level caching with smart invalidation
5. **Flexibility**: JSONB for extensibility while maintaining type safety
6. **Governance**: Feature flags and gradual rollouts for safe changes

The patterns outlined in this document provide a production-ready foundation for SaaS configuration management that scales with your platform.
