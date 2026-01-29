import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth';
import { getServiceSupabaseClient } from '../../lib/supabase';

const router = Router();

/**
 * GET /api/admin/settings
 * Get current admin settings for the authenticated admin user
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const userId = req.adminUser!.userId;

    const { data, error } = await supabase
      .from('platform_admin_settings')
      .select('session_timeout_minutes, two_factor_enabled, require_ip_allowlist, ip_allowlist')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return res.json({
          session_timeout_minutes: 120,
          two_factor_enabled: false,
          require_ip_allowlist: false,
          ip_allowlist: []
        });
      }
      console.error('Error fetching admin settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/settings
 * Update admin settings for the authenticated admin user
 */
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const userId = req.adminUser!.userId;
    const {
      session_timeout_minutes,
      two_factor_enabled,
      require_ip_allowlist,
      ip_allowlist
    } = req.body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Validate and add session_timeout_minutes
    if (session_timeout_minutes !== undefined) {
      const timeout = Number(session_timeout_minutes);
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        return res.status(400).json({
          error: 'session_timeout_minutes must be between 5 and 1440 (24 hours)'
        });
      }
      updates.session_timeout_minutes = timeout;
    }

    // Validate and add two_factor_enabled
    if (two_factor_enabled !== undefined) {
      if (typeof two_factor_enabled !== 'boolean') {
        return res.status(400).json({
          error: 'two_factor_enabled must be a boolean'
        });
      }
      updates.two_factor_enabled = two_factor_enabled;
    }

    // Validate and add require_ip_allowlist
    if (require_ip_allowlist !== undefined) {
      if (typeof require_ip_allowlist !== 'boolean') {
        return res.status(400).json({
          error: 'require_ip_allowlist must be a boolean'
        });
      }
      updates.require_ip_allowlist = require_ip_allowlist;
    }

    // Validate and add ip_allowlist
    if (ip_allowlist !== undefined) {
      if (!Array.isArray(ip_allowlist)) {
        return res.status(400).json({
          error: 'ip_allowlist must be an array of IP addresses'
        });
      }
      updates.ip_allowlist = ip_allowlist;
    }

    // Check if there's anything to update besides updated_at
    if (Object.keys(updates).length === 1) {
      return res.status(400).json({
        error: 'At least one setting must be provided to update'
      });
    }

    // Try to update existing row, or insert if not exists
    const { data: existing } = await supabase
      .from('platform_admin_settings')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('platform_admin_settings')
        .update(updates)
        .eq('user_id', userId)
        .select('session_timeout_minutes, two_factor_enabled, require_ip_allowlist, ip_allowlist')
        .single();
    } else {
      // Insert new row with defaults
      result = await supabase
        .from('platform_admin_settings')
        .insert({
          user_id: userId,
          admin_role: req.adminUser!.role,
          ...updates
        })
        .select('session_timeout_minutes, two_factor_enabled, require_ip_allowlist, ip_allowlist')
        .single();
    }

    if (result.error) {
      console.error('Error updating admin settings:', result.error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    res.json({
      message: 'Settings updated successfully',
      settings: result.data
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
