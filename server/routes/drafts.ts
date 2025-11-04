/**
 * API Routes for Notice Draft Management
 * Provides CRUD operations for draft notices with autosave support
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation schema for draft operations
const DraftSchema = z.object({
  notice_category: z.enum(['licensing', 'gambling', 'gvol', 'planning', 'probate']),
  notice_definition_id: z.string().optional(),
  template_key: z.string().optional(),
  form_data: z.record(z.unknown()),
  draft_name: z.string().optional(),
  notes: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
});

/**
 * GET /api/drafts
 * List all drafts for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const { category, organization_id, department_id, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('drafts')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters
    if (category) {
      query = query.eq('notice_category', category as string);
    }
    if (organization_id) {
      query = query.eq('organization_id', organization_id as string);
    }
    if (department_id) {
      query = query.eq('department_id', department_id as string);
    }

    const { data: drafts, error, count } = await query;

    if (error) {
      console.error('[Drafts API] List error:', error);
      return res.status(500).json({ error: 'Failed to fetch drafts' });
    }

    return res.json({
      drafts: drafts || [],
      total: count || drafts?.length || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/drafts/:id
 * Get a specific draft by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { data: draft, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Drafts API] Get error:', error);
      return res.status(404).json({ error: 'Draft not found' });
    }

    return res.json({ draft });
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/drafts
 * Create a new draft
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validation = DraftSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid draft data',
        details: validation.error.errors,
      });
    }

    const draftData = validation.data;

    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        created_by: user.id,
        notice_category: draftData.notice_category,
        notice_definition_id: draftData.notice_definition_id,
        template_key: draftData.template_key,
        form_data: draftData.form_data,
        draft_name: draftData.draft_name,
        notes: draftData.notes,
        organization_id: draftData.organization_id,
        department_id: draftData.department_id,
        version: 1,
        last_saved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Drafts API] Create error:', error);
      return res.status(500).json({ error: 'Failed to create draft' });
    }

    return res.status(201).json({ draft });
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/drafts/:id
 * Update an existing draft (autosave)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { version: clientVersion, ...updateData } = req.body;

    // Get current draft to check version
    const { data: currentDraft, error: fetchError } = await supabase
      .from('drafts')
      .select('version, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !currentDraft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Check ownership
    if (currentDraft.created_by !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this draft' });
    }

    // Version conflict detection
    if (clientVersion && currentDraft.version !== clientVersion) {
      return res.status(409).json({
        error: 'Version conflict - draft was modified by another session',
        current_version: currentDraft.version,
      });
    }

    // Validate update data
    const validation = DraftSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid draft data',
        details: validation.error.errors,
      });
    }

    const validatedData = validation.data;

    // Update draft with incremented version
    const { data: draft, error } = await supabase
      .from('drafts')
      .update({
        ...validatedData,
        version: currentDraft.version + 1,
        last_saved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Drafts API] Update error:', error);
      return res.status(500).json({ error: 'Failed to update draft' });
    }

    return res.json({ draft });
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/drafts/:id
 * Delete a draft
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Drafts API] Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete draft' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/drafts/:id/publish
 * Mark a draft as published (links to published notice)
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { notice_id } = req.body;

    if (!notice_id) {
      return res.status(400).json({ error: 'notice_id is required' });
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .update({
        published_notice_id: notice_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Drafts API] Publish error:', error);
      return res.status(500).json({ error: 'Failed to mark draft as published' });
    }

    return res.json({ draft });
  } catch (error) {
    console.error('[Drafts API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
