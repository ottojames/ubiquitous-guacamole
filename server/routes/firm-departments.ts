import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All firm department routes require authentication
router.use(requireAuth);

/**
 * GET /api/firm/departments
 * Returns all departments for the user's firm
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('firm_departments')
      .select('*')
      .eq('firm_id', firmId)
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('[firm-departments] Error fetching departments:', error);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }

    return res.json({ departments: data || [] });
  } catch (error: any) {
    console.error('[firm-departments] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/firm/departments
 * Creates a new department for the firm. Requires admin role.
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const user = req.user;
    const firmId = user?.organizationId;

    if (!firmId || !user) {
      return res.status(400).json({ error: 'No firm context' });
    }

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only firm admins can create departments' });
    }

    const { name, description, default_notice_types, color, icon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('firm_departments')
      .insert({
        firm_id: firmId,
        name: name.trim(),
        slug,
        description: description || null,
        default_notice_types: default_notice_types || null,
        color: color || '#6366f1',
        icon: icon || 'folder',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[firm-departments] Error creating department:', error);
      if (error.code === '23505') { // unique violation
        return res.status(409).json({ error: 'A department with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create department' });
    }

    return res.status(201).json({ department: data });
  } catch (error: any) {
    console.error('[firm-departments] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/firm/departments/:id
 * Updates a department. Requires admin role.
 */
router.patch('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const user = req.user;
    const firmId = user?.organizationId;
    const departmentId = req.params.id;

    if (!firmId || !user) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only firm admins can update departments' });
    }

    // Verify department belongs to this firm
    const { data: existing } = await supabase
      .from('firm_departments')
      .select('id')
      .eq('id', departmentId)
      .eq('firm_id', firmId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const { name, description, default_notice_types, color, icon, status } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Department name cannot be empty' });
      }
      updates.name = name.trim();
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (default_notice_types !== undefined) updates.default_notice_types = default_notice_types;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (status !== undefined) {
      if (!['active', 'inactive', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('firm_departments')
      .update(updates)
      .eq('id', departmentId)
      .select()
      .single();

    if (error) {
      console.error('[firm-departments] Error updating department:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A department with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to update department' });
    }

    return res.json({ department: data });
  } catch (error: any) {
    console.error('[firm-departments] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/firm/departments/:id
 * Soft-deletes a department by setting status to 'archived'. Requires admin role.
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const user = req.user;
    const firmId = user?.organizationId;
    const departmentId = req.params.id;

    if (!firmId || !user) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Only firm admins can delete departments' });
    }

    // Verify department belongs to this firm
    const { data: existing } = await supabase
      .from('firm_departments')
      .select('id')
      .eq('id', departmentId)
      .eq('firm_id', firmId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Soft delete by setting status to 'archived'
    const { error } = await supabase
      .from('firm_departments')
      .update({ status: 'archived' })
      .eq('id', departmentId);

    if (error) {
      console.error('[firm-departments] Error deleting department:', error);
      return res.status(500).json({ error: 'Failed to delete department' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('[firm-departments] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
