import { Router } from 'express';
import { requireAuth, loadUserPermissions, requirePermission } from '../middleware/auth';
import { getServiceSupabaseClient } from '../lib/supabase';

const router = Router();

/**
 * GET /api/departments/:deptId/templates
 * List all templates for a department
 * Requires: templates.read permission
 */
router.get(
  '/departments/:deptId/templates',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.read'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;
      const { notice_type } = req.query;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      // Build query
      let query = supabase
        .from('templates')
        .select('*')
        .eq('department_id', deptId)
        .order('use_count', { ascending: false })
        .order('updated_at', { ascending: false });

      // Filter by notice type if provided
      if (notice_type && typeof notice_type === 'string') {
        query = query.eq('notice_type', notice_type);
      }

      const { data: templates, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({ error: 'Failed to fetch templates' });
      }

      res.json({
        templates: templates || [],
        total: templates?.length || 0
      });
    } catch (error) {
      console.error('Error in GET /departments/:deptId/templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/departments/:deptId/templates/:templateId
 * Get a specific template
 * Requires: templates.read permission
 */
router.get(
  '/departments/:deptId/templates/:templateId',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.read'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, templateId } = req.params;

      if (!deptId || !templateId) {
        return res.status(400).json({ error: 'Department ID and Template ID are required' });
      }

      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .eq('department_id', deptId)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(500).json({ error: 'Failed to fetch template' });
      }

      res.json({ template });
    } catch (error) {
      console.error('Error in GET /departments/:deptId/templates/:templateId:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/departments/:deptId/templates
 * Create a new template
 * Requires: templates.create permission
 */
router.post(
  '/departments/:deptId/templates',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.create'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;
      const {
        name,
        description,
        notice_type,
        default_values
      } = req.body;
      const userId = req.user!.id;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      // Validate required fields
      if (!name || !notice_type || !default_values) {
        return res.status(400).json({
          error: 'Name, notice_type, and default_values are required'
        });
      }

      // Validate name length
      if (name.length < 3 || name.length > 200) {
        return res.status(400).json({
          error: 'Template name must be between 3 and 200 characters'
        });
      }

      // Validate default_values is an object
      if (typeof default_values !== 'object' || Array.isArray(default_values)) {
        return res.status(400).json({
          error: 'default_values must be a JSON object'
        });
      }

      // Create the template
      const { data: template, error } = await supabase
        .from('templates')
        .insert({
          department_id: deptId,
          name: name.trim(),
          description: description?.trim() || null,
          notice_type,
          default_values,
          created_by: userId,
          use_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);

        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'A template with this name already exists in this department'
          });
        }

        return res.status(500).json({ error: 'Failed to create template' });
      }

      res.status(201).json({
        message: 'Template created successfully',
        template
      });
    } catch (error) {
      console.error('Error in POST /departments/:deptId/templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /api/departments/:deptId/templates/:templateId
 * Update a template
 * Requires: templates.update permission
 */
router.patch(
  '/departments/:deptId/templates/:templateId',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.update'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, templateId } = req.params;
      const {
        name,
        description,
        notice_type,
        default_values
      } = req.body;

      if (!deptId || !templateId) {
        return res.status(400).json({ error: 'Department ID and Template ID are required' });
      }

      // Build update object with only provided fields
      const updates: Record<string, any> = {};

      if (name !== undefined) {
        if (name.length < 3 || name.length > 200) {
          return res.status(400).json({
            error: 'Template name must be between 3 and 200 characters'
          });
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        updates.description = description?.trim() || null;
      }

      if (notice_type !== undefined) {
        updates.notice_type = notice_type;
      }

      if (default_values !== undefined) {
        if (typeof default_values !== 'object' || Array.isArray(default_values)) {
          return res.status(400).json({
            error: 'default_values must be a JSON object'
          });
        }
        updates.default_values = default_values;
      }

      // Validate at least one field is being updated
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'At least one field must be provided to update'
        });
      }

      // Update the template
      const { data: template, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', templateId)
        .eq('department_id', deptId)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(500).json({ error: 'Failed to update template' });
      }

      res.json({
        message: 'Template updated successfully',
        template
      });
    } catch (error) {
      console.error('Error in PATCH /departments/:deptId/templates/:templateId:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/departments/:deptId/templates/:templateId
 * Delete a template
 * Requires: templates.delete permission
 */
router.delete(
  '/departments/:deptId/templates/:templateId',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.delete'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, templateId } = req.params;

      if (!deptId || !templateId) {
        return res.status(400).json({ error: 'Department ID and Template ID are required' });
      }

      // Delete the template
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('department_id', deptId);

      if (error) {
        console.error('Error deleting template:', error);
        return res.status(500).json({ error: 'Failed to delete template' });
      }

      res.json({
        message: 'Template deleted successfully',
        template_id: templateId
      });
    } catch (error) {
      console.error('Error in DELETE /departments/:deptId/templates/:templateId:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/departments/:deptId/templates/:templateId/use
 * Increment template usage count (when applying template)
 * Requires: templates.read permission
 */
router.post(
  '/departments/:deptId/templates/:templateId/use',
  requireAuth,
  loadUserPermissions,
  requirePermission('templates.read'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, templateId } = req.params;

      if (!deptId || !templateId) {
        return res.status(400).json({ error: 'Department ID and Template ID are required' });
      }

      // Increment use count and update last_used_at
      const { data: template, error } = await supabase
        .rpc('increment_template_usage', {
          template_id: templateId,
          dept_id: deptId
        });

      if (error) {
        console.error('Error incrementing template usage:', error);

        // If RPC function doesn't exist, do it manually
        const { data: manualUpdate, error: manualError } = await supabase
          .from('templates')
          .update({
            use_count: supabase.raw('use_count + 1'),
            last_used_at: new Date().toISOString()
          })
          .eq('id', templateId)
          .eq('department_id', deptId)
          .select()
          .single();

        if (manualError) {
          console.error('Error with manual update:', manualError);
          if (manualError.code === 'PGRST116') {
            return res.status(404).json({ error: 'Template not found' });
          }
          return res.status(500).json({ error: 'Failed to update template usage' });
        }

        return res.json({
          message: 'Template usage updated',
          template: manualUpdate
        });
      }

      res.json({
        message: 'Template usage updated',
        template
      });
    } catch (error) {
      console.error('Error in POST /departments/:deptId/templates/:templateId/use:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
