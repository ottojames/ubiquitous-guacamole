import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// Initialize Supabase client lazily to avoid module-level initialization issues
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  return supabaseClient;
}

/**
 * GET /api/notices/:noticeId/representations
 * Get all representations for a specific notice
 * Query params: userId (optional) - to check read status for specific user
 * Protected: Optional authentication (works for demo users too)
 */
router.get('/notices/:noticeId/representations', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { noticeId } = req.params;
    const { userId } = req.query;

    const supabase = getSupabase();

    // Fetch representations for the notice
    const { data: representations, error } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', noticeId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching representations:', error);
      return res.status(500).json({ error: 'Failed to fetch representations' });
    }

    // If userId provided, fetch read status for each representation
    if (userId && typeof userId === 'string') {
      const { data: readRecords } = await supabase
        .from('representation_reads')
        .select('representation_id')
        .eq('user_id', userId)
        .in(
          'representation_id',
          representations?.map((r) => r.id) || []
        );

      const readIds = new Set(readRecords?.map((r) => r.representation_id) || []);

      const enriched = representations?.map((rep) => ({
        ...rep,
        is_read: readIds.has(rep.id),
      }));

      return res.json(enriched || []);
    }

    return res.json(representations || []);
  } catch (error) {
    console.error('Error in GET /api/notices/:noticeId/representations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/notices/:noticeId/representations/counts
 * Get representation counts for a notice (total and unread)
 * Query params: userId (required)
 * Protected: Optional authentication (works for demo users too)
 */
router.get('/notices/:noticeId/representations/counts', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { noticeId } = req.params;
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const supabase = getSupabase();

    // Use the database function
    const { data, error } = await supabase.rpc('get_representation_counts', {
      p_notice_id: noticeId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching representation counts:', error);
      return res.status(500).json({ error: 'Failed to fetch representation counts' });
    }

    // Database function returns {total, unread}
    return res.json({
      noticeId,
      total: data?.total || 0,
      unread: data?.unread || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/notices/:noticeId/representations/counts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/representations/counts/bulk
 * Bulk fetch representation counts for multiple notices
 * Body: { noticeIds: string[], userId: string }
 * Protected: Requires authentication
 */
router.post('/representations/counts/bulk', requireAuth, async (req: Request, res: Response) => {
  try {
    const { noticeIds, userId } = req.body;

    if (!Array.isArray(noticeIds) || noticeIds.length === 0) {
      return res.status(400).json({ error: 'noticeIds array is required' });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = getSupabase();

    // Use the bulk database function
    const { data, error } = await supabase.rpc('get_bulk_representation_counts', {
      p_notice_ids: noticeIds,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching bulk representation counts:', error);
      return res.status(500).json({ error: 'Failed to fetch bulk representation counts' });
    }

    // Transform array result into object mapping
    const result: Record<string, { total: number; unread: number }> = {};

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        result[item.notice_id] = {
          total: item.total || 0,
          unread: item.unread || 0,
        };
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in POST /api/representations/counts/bulk:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/representations/:representationId/mark-read
 * Mark a representation as read by a user (idempotent)
 * Body: { userId: string }
 * Protected: Requires authentication
 */
router.post('/representations/:representationId/mark-read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required in request body' });
    }

    const supabase = getSupabase();

    // Use the database function (idempotent - returns true if newly marked, false if already read)
    const { data, error } = await supabase.rpc('mark_representation_read', {
      p_representation_id: representationId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error marking representation as read:', error);
      return res.status(500).json({ error: 'Failed to mark representation as read' });
    }

    return res.json({
      success: true,
      representationId,
      alreadyRead: data === false, // Function returns false if already read
    });
  } catch (error) {
    console.error('Error in POST /api/representations/:representationId/mark-read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/representations/:representationId
 * Get details of a single representation
 * Query params: userId (optional) - to check if user has read it
 */
router.get('/representations/:representationId', async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;
    const { userId } = req.query;

    const supabase = getSupabase();

    // Fetch the representation
    const { data: representation, error } = await supabase
      .from('representations')
      .select('*')
      .eq('id', representationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Representation not found' });
      }
      console.error('Error fetching representation:', error);
      return res.status(500).json({ error: 'Failed to fetch representation' });
    }

    // If userId provided, check if user has read it
    if (userId && typeof userId === 'string') {
      const { data: readRecord } = await supabase
        .from('representation_reads')
        .select('id')
        .eq('representation_id', representationId)
        .eq('user_id', userId)
        .maybeSingle();

      return res.json({
        ...representation,
        is_read: !!readRecord,
      });
    }

    return res.json(representation);
  } catch (error) {
    console.error('Error in GET /api/representations/:representationId:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/representations/:representationId/comment
 * Add an internal comment to a representation (officer-to-officer discussion)
 * Body: { userId: string, userName: string, comment: string }
 * Protected: Requires authentication
 */
router.post('/representations/:representationId/comment', requireAuth, async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;
    const { userId, userName, comment } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!userName || typeof userName !== 'string') {
      return res.status(400).json({ error: 'userName is required' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: 'comment is required and cannot be empty' });
    }

    const supabase = getSupabase();

    // Fetch the representation to get its current internal_notes
    const { data: representation, error: fetchError } = await supabase
      .from('representations')
      .select('internal_notes')
      .eq('id', representationId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Representation not found' });
      }
      console.error('Error fetching representation:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch representation' });
    }

    // Append new comment to internal_notes (JSONB array)
    const existingNotes = Array.isArray(representation.internal_notes)
      ? representation.internal_notes
      : [];

    const newComment = {
      id: crypto.randomUUID(),
      user_id: userId,
      user_name: userName,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [...existingNotes, newComment];

    // Update the representation
    const { data: updated, error: updateError } = await supabase
      .from('representations')
      .update({ internal_notes: updatedNotes })
      .eq('id', representationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating representation with comment:', updateError);
      return res.status(500).json({ error: 'Failed to add comment' });
    }

    return res.json({
      success: true,
      comment: newComment,
      representation: updated,
    });
  } catch (error) {
    console.error('Error in POST /api/representations/:representationId/comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/representations/export
 * Export representations to CSV
 * Query params:
 *   - noticeId (required): filter by notice
 *   - format (optional): 'csv' or 'json' (default: 'csv')
 * Protected: Requires authentication
 */
router.get('/representations/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const { noticeId, format = 'csv' } = req.query;

    if (!noticeId || typeof noticeId !== 'string') {
      return res.status(400).json({ error: 'noticeId query parameter is required' });
    }

    const supabase = getSupabase();

    // Fetch all representations for the notice
    const { data: representations, error } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', noticeId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching representations for export:', error);
      return res.status(500).json({ error: 'Failed to fetch representations' });
    }

    if (!representations || representations.length === 0) {
      return res.status(404).json({ error: 'No representations found for this notice' });
    }

    if (format === 'json') {
      return res.json(representations);
    }

    // Generate CSV
    const headers = [
      'ID',
      'Submitter Name',
      'Submitter Email',
      'Type',
      'Content',
      'Submitted At',
      'Status',
    ];

    const csvRows = representations.map((rep) => [
      rep.id,
      rep.submitter_name || '',
      rep.submitter_email || '',
      rep.type || '',
      (rep.content || '').replace(/"/g, '""'), // Escape double quotes
      rep.submitted_at || '',
      rep.status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="representations-${noticeId}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error in GET /api/representations/export:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
