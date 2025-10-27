import { Router } from 'express';
import { requireAuth, loadUserPermissions, requirePermission } from '../middleware/auth';
import { getServiceSupabaseClient } from '../lib/supabase';

const router = Router();

/**
 * GET /api/departments/:deptId/settings
 * Get department settings
 * Requires: settings.read permission
 */
router.get(
  '/departments/:deptId/settings',
  requireAuth,
  loadUserPermissions,
  requirePermission('settings.read'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      // Get department details
      const { data: department, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          slug,
          type,
          contact_email,
          contact_phone,
          address,
          organization_id,
          created_at,
          updated_at
        `)
        .eq('id', deptId)
        .single();

      if (error) {
        console.error('Error fetching department settings:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Department not found' });
        }
        return res.status(500).json({ error: 'Failed to fetch department settings' });
      }

      res.json({
        settings: department
      });
    } catch (error) {
      console.error('Error in GET /departments/:deptId/settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /api/departments/:deptId/settings
 * Update department settings
 * Requires: settings.update permission
 */
router.patch(
  '/departments/:deptId/settings',
  requireAuth,
  loadUserPermissions,
  requirePermission('settings.update'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;
      const {
        name,
        contact_email,
        contact_phone,
        address
      } = req.body;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      // Build update object with only provided fields
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updates.name = name;
      if (contact_email !== undefined) updates.contact_email = contact_email;
      if (contact_phone !== undefined) updates.contact_phone = contact_phone;
      if (address !== undefined) updates.address = address;

      // Validate at least one field is being updated
      if (Object.keys(updates).length === 1) { // Only updated_at
        return res.status(400).json({
          error: 'At least one field must be provided to update'
        });
      }

      // Validate email format if provided
      if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Update the department
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', deptId)
        .select()
        .single();

      if (error) {
        console.error('Error updating department settings:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Department not found' });
        }
        return res.status(500).json({ error: 'Failed to update department settings' });
      }

      res.json({
        message: 'Settings updated successfully',
        settings: data
      });
    } catch (error) {
      console.error('Error in PATCH /departments/:deptId/settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
