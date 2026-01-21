import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, optionalAuth, loadUserPermissions, requirePermission } from '../middleware/auth';
import { sendRepresentationNotificationToCouncil } from '../services/email';
import { generateIdoxCsv, getIdoxFilename, type RepresentationForExport } from '../services/idoxExport';

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
router.get('/notices/:noticeId/representations', requireAuth, loadUserPermissions, requirePermission('representations.read'), async (req: Request, res: Response) => {
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
router.get('/notices/:noticeId/representations/counts', requireAuth, loadUserPermissions, requirePermission('representations.read'), async (req: Request, res: Response) => {
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
router.post('/representations/counts/bulk', requireAuth, loadUserPermissions, requirePermission('representations.read'), async (req: Request, res: Response) => {
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
router.post('/representations/:representationId/mark-read', requireAuth, loadUserPermissions, requirePermission('representations.update'), async (req: Request, res: Response) => {
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
router.get('/representations/:representationId', requireAuth, loadUserPermissions, requirePermission('representations.read'), async (req: Request, res: Response) => {
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
 * Protected: Optional authentication (works in demo mode)
 */
router.post('/representations/:representationId/comment', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;
    const { userId, userName, comment } = req.body;

    // Use provided userId/userName from body, or fall back to auth context
    const effectiveUserId = userId || req.user?.id || 'demo-user';
    const effectiveUserName = userName || req.user?.email || 'Demo Officer';

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
      user_id: effectiveUserId,
      user_name: effectiveUserName,
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
 * POST /api/representations
 * Submit a new representation (public endpoint - no auth required)
 * Body: {
 *   noticeId: string,
 *   submitterName: string,
 *   submitterEmail: string,
 *   submitterPhone?: string,
 *   submitterAddress?: string,
 *   type: 'support' | 'objection' | 'comment',
 *   content: string
 * }
 */
router.post('/representations', async (req: Request, res: Response) => {
  try {
    const {
      noticeId,
      submitterName,
      submitterEmail,
      submitterPhone,
      submitterAddress,
      type,
      content
    } = req.body;

    // Validation
    if (!noticeId || typeof noticeId !== 'string') {
      return res.status(400).json({ error: 'noticeId is required' });
    }

    if (!submitterName || typeof submitterName !== 'string' || submitterName.trim().length === 0) {
      return res.status(400).json({ error: 'submitterName is required' });
    }

    if (!submitterEmail || typeof submitterEmail !== 'string' || !submitterEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid submitterEmail is required' });
    }

    if (!type || !['support', 'objection', 'comment'].includes(type)) {
      return res.status(400).json({ error: 'type must be support, objection, or comment' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required' });
    }

    const supabase = getSupabase();

    // Verify notice exists
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, representation_deadline')
      .eq('id', noticeId)
      .single();

    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Check if deadline has passed (if set)
    if (notice.representation_deadline) {
      const deadline = new Date(notice.representation_deadline);
      if (deadline < new Date()) {
        return res.status(400).json({ error: 'Representation deadline has passed' });
      }
    }

    // Map licensingObjectives to grounds field
    const grounds = req.body.licensingObjectives || null;

    // Insert representation
    const { data: representation, error: insertError } = await supabase
      .from('representations')
      .insert({
        notice_id: noticeId,
        representor_name: submitterName.trim(),
        representor_email: submitterEmail.trim().toLowerCase(),
        representor_phone: submitterPhone?.trim() || null,
        representor_address: submitterAddress ? { raw: submitterAddress.trim() } : null,
        type,
        representation_text: content.trim(),
        grounds,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting representation:', insertError);
      return res.status(500).json({ error: 'Failed to submit representation' });
    }

    // Send notification email to council staff (async, don't block response)
    (async () => {
      try {
        // Fetch notice with organization details for council notification
        const { data: noticeWithOrg, error: noticeOrgError } = await supabase
          .from('notices')
          .select(`
            id,
            notice_type,
            title,
            premises,
            organization_id,
            organizations!inner (
              id,
              name,
              slug,
              contact_email
            )
          `)
          .eq('id', noticeId)
          .single();

        if (noticeOrgError || !noticeWithOrg) {
          console.warn('[Representation] Could not fetch notice organization for email notification:', noticeOrgError);
          return;
        }

        const org = noticeWithOrg.organizations as any;
        if (!org?.contact_email) {
          console.log('[Representation] No contact email configured for organization, skipping notification');
          return;
        }

        const premises = noticeWithOrg.premises as any;
        const premisesName = premises?.name || noticeWithOrg.title;
        const premisesAddress = premises?.address || null;

        // Truncate content for preview (first 200 chars)
        const contentPreview = content.trim().length > 200
          ? content.trim().substring(0, 200) + '...'
          : content.trim();

        // Map type to stance for email
        const stanceMap: Record<string, 'support' | 'objection' | 'comment'> = {
          'support': 'support',
          'objection': 'objection',
          'comment': 'comment'
        };

        const baseUrl = process.env.PUBLIC_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

        await sendRepresentationNotificationToCouncil(org.contact_email, {
          representationId: representation.id,
          noticeId: noticeId,
          noticeType: noticeWithOrg.notice_type || 'Notice',
          premisesName,
          premisesAddress,
          stance: stanceMap[type] || 'comment',
          submitterName: submitterName.trim(),
          contentPreview,
          noticeUrl: `${baseUrl}/notices/${noticeId}`,
          dashboardUrl: `${baseUrl}/c/${org.slug}/licensing/notices/${noticeId}/representations`,
          councilName: org.name,
        });

        console.log(`[Representation] Sent notification to council ${org.name} for representation ${representation.id}`);
      } catch (emailError) {
        console.error('[Representation] Error sending council notification email:', emailError);
        // Don't fail the request if email fails
      }
    })();

    return res.status(201).json({
      success: true,
      representation,
      message: 'Your representation has been submitted successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/representations:', error);
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
router.get('/representations/export', requireAuth, loadUserPermissions, requirePermission('representations.export'), async (req: Request, res: Response) => {
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
      'Representor Name',
      'Representor Email',
      'Type',
      'Representation Text',
      'Submitted At',
      'Status',
    ];

    const csvRows = representations.map((rep) => [
      rep.id,
      rep.representor_name || '',
      rep.representor_email || '',
      rep.type || '',
      (rep.representation_text || '').replace(/"/g, '""'), // Escape double quotes
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

/**
 * GET /api/representations/export/idox
 * Export representations in IDOX-compatible CSV format
 * Query params:
 *   - departmentId (required): filter by department
 *   - ids (optional): comma-separated list of specific representation IDs
 *   - status (optional): filter by status ('reviewed', 'unreviewed', 'all')
 * Protected: Requires authentication
 */
router.get('/representations/export/idox', requireAuth, loadUserPermissions, requirePermission('representations.export'), async (req: Request, res: Response) => {
  try {
    const { departmentId, ids, status } = req.query;

    if (!departmentId || typeof departmentId !== 'string') {
      return res.status(400).json({ error: 'departmentId query parameter is required' });
    }

    const supabase = getSupabase();

    // Build query - get representations for notices in this department
    let query = supabase
      .from('representations')
      .select(`
        id,
        notice_id,
        representor_name,
        representor_email,
        type,
        representation_text,
        submitted_at,
        reviewed_at,
        reviewed_by,
        assigned_to,
        notices!inner (
          id,
          notice_type,
          application_type,
          applicant,
          trading_name,
          premises,
          department_id
        )
      `)
      .eq('notices.department_id', departmentId)
      .order('submitted_at', { ascending: false });

    // Filter by specific IDs if provided
    if (ids && typeof ids === 'string') {
      const idList = ids.split(',').map(id => id.trim()).filter(id => id);
      if (idList.length > 0) {
        query = query.in('id', idList);
      }
    }

    // Filter by status if provided
    if (status === 'reviewed') {
      query = query.not('reviewed_at', 'is', null);
    } else if (status === 'unreviewed') {
      query = query.is('reviewed_at', null);
    }

    const { data: representations, error } = await query;

    if (error) {
      console.error('Error fetching representations for IDOX export:', error);
      return res.status(500).json({ error: 'Failed to fetch representations' });
    }

    if (!representations || representations.length === 0) {
      return res.status(404).json({ error: 'No representations found' });
    }

    // Fetch reviewer and assignee names if needed
    const reviewerIds = [...new Set(representations.filter(r => r.reviewed_by).map(r => r.reviewed_by))];
    const assigneeIds = [...new Set(representations.filter(r => r.assigned_to).map(r => r.assigned_to))];
    const allUserIds = [...new Set([...reviewerIds, ...assigneeIds])];

    let userNames: Record<string, string> = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allUserIds);

      if (users) {
        users.forEach(user => {
          userNames[user.id] = user.full_name || user.email || user.id;
        });
      }
    }

    // Transform to IDOX export format
    const exportData: RepresentationForExport[] = representations.map(rep => {
      const notice = rep.notices as any;
      return {
        id: rep.id,
        notice_id: rep.notice_id,
        representor_name: rep.representor_name,
        representor_email: rep.representor_email,
        type: rep.type as 'support' | 'objection' | 'comment',
        representation_text: rep.representation_text,
        submitted_at: rep.submitted_at,
        reviewed_at: rep.reviewed_at,
        reviewed_by_name: rep.reviewed_by ? userNames[rep.reviewed_by] || null : null,
        assigned_to_name: rep.assigned_to ? userNames[rep.assigned_to] || null : null,
        notice: notice ? {
          notice_type: notice.notice_type,
          application_type: notice.application_type,
          applicant: notice.applicant,
          trading_name: notice.trading_name,
          premises: notice.premises,
        } : null,
      };
    });

    // Generate IDOX CSV
    const csvContent = generateIdoxCsv(exportData);
    const filename = getIdoxFilename();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error in GET /api/representations/export/idox:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
