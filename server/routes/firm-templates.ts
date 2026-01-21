import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All firm template routes require authentication
router.use(requireAuth);

/**
 * GET /api/firm/templates
 * Returns all templates for the user's firm
 * Query params: notice_type (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const noticeType = req.query.notice_type as string | undefined;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    let query = supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('firm_id', firmId)
      .eq('is_active', true)
      .order('name');

    if (noticeType) {
      query = query.eq('notice_type', noticeType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[firm-templates] Error fetching templates:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    return res.json({ templates: data || [] });
  } catch (error: any) {
    console.error('[firm-templates] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/firm/templates/:id
 * Returns a single template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const { id } = req.params;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[firm-templates/:id] Error fetching template:', error);
      return res.status(500).json({ error: 'Failed to fetch template' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ template: data });
  } catch (error: any) {
    console.error('[firm-templates/:id] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/firm/templates
 * Creates a new template for the firm
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const firmId = req.user?.organizationId;
    const userId = req.user?.id;
    const { name, description, notice_type, department_id, template_data, is_shared } = req.body;

    if (!firmId) {
      return res.status(400).json({ error: 'No firm context' });
    }

    if (!name || !notice_type) {
      return res.status(400).json({ error: 'Name and notice_type are required' });
    }

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .insert({
        firm_id: firmId,
        department_id: department_id || null,
        name,
        description: description || null,
        notice_type,
        template_data: template_data || {},
        is_shared: is_shared !== false, // Default to true
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('[firm-templates] Error creating template:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }

    return res.status(201).json({ template: data });
  } catch (error: any) {
    console.error('[firm-templates] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/firm/templates/:id
 * Updates a template. Template owner or firm admin can update.
 */
router.patch('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const user = req.user;
    const firmId = user?.organizationId;
    const { id } = req.params;

    if (!firmId || !user) {
      return res.status(400).json({ error: 'No firm context' });
    }

    // Fetch template and verify ownership
    const { data: template, error: fetchError } = await supabase
      .from('firm_notice_templates')
      .select('*')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[firm-templates/:id] Error fetching template:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch template' });
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user is owner or admin
    const isOwner = template.created_by === user.id;
    let isAdmin = false;

    if (!isOwner) {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', firmId)
        .single();

      isAdmin = membership && ['owner', 'admin'].includes(membership.role);
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only template owner or firm admins can update templates' });
    }

    const { name, description, notice_type, department_id, template_data, is_shared, is_active } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (notice_type !== undefined) updates.notice_type = notice_type;
    if (department_id !== undefined) updates.department_id = department_id;
    if (template_data !== undefined) updates.template_data = template_data;
    if (is_shared !== undefined) updates.is_shared = is_shared;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('firm_notice_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[firm-templates/:id] Error updating template:', error);
      return res.status(500).json({ error: 'Failed to update template' });
    }

    return res.json({ template: data });
  } catch (error: any) {
    console.error('[firm-templates/:id] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/firm/templates/:id
 * Soft-deletes a template by setting is_active to false.
 * Template owner or firm admin can delete.
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const user = req.user;
    const firmId = user?.organizationId;
    const { id } = req.params;

    if (!firmId || !user) {
      return res.status(400).json({ error: 'No firm context' });
    }

    // Fetch template and verify ownership
    const { data: template, error: fetchError } = await supabase
      .from('firm_notice_templates')
      .select('id, created_by')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[firm-templates/:id] Error fetching template:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch template' });
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user is owner or admin
    const isOwner = template.created_by === user.id;
    let isAdmin = false;

    if (!isOwner) {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', firmId)
        .single();

      isAdmin = membership && ['owner', 'admin'].includes(membership.role);
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only template owner or firm admins can delete templates' });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('firm_notice_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[firm-templates/:id] Error deleting template:', error);
      return res.status(500).json({ error: 'Failed to delete template' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('[firm-templates/:id] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
