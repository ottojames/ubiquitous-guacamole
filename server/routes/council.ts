import express from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * GET /api/council/pending-submissions
 * Get all notices with approval_status = 'pending' for a specific department
 */
router.get('/pending-submissions', async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId query parameter required' });
    }

    const { data, error } = await supabase
      .from('notices')
      .select(`
        id,
        notice_type,
        applicant_name,
        premises,
        application_date,
        submitted_at,
        approval_status,
        review_notes,
        extras
      `)
      .eq('department_id', departmentId)
      .eq('approval_status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch pending submissions' });
    }

    res.json({ pendingNotices: data || [] });
  } catch (err) {
    console.error('Error in /pending-submissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/council/departments/:councilId/stats
 * Get statistics for all departments in a council
 */
router.get('/departments/:councilId/stats', async (req, res) => {
  try {
    const { councilId } = req.params;

    // Get all departments for this council
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('council_id', councilId);

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }

    // Get stats for each department
    const stats = await Promise.all(
      (departments || []).map(async (dept) => {
        // Count published notices
        const { count: publishedCount } = await supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)
          .eq('status', 'published');

        // Count pending submissions
        const { count: pendingCount } = await supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)
          .eq('approval_status', 'pending');

        // Count unread representations for this department's notices
        const { data: noticeIds } = await supabase
          .from('notices')
          .select('id')
          .eq('department_id', dept.id)
          .eq('status', 'published');

        const ids = (noticeIds || []).map((n) => n.id);
        let unreadCount = 0;

        if (ids.length > 0) {
          const { data: reps } = await supabase
            .from('representations')
            .select('id, read_by')
            .in('notice_id', ids);

          // Count representations where read_by is empty or null
          unreadCount = (reps || []).filter(
            (rep) => !rep.read_by || rep.read_by.length === 0
          ).length;
        }

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          publishedNotices: publishedCount || 0,
          pendingSubmissions: pendingCount || 0,
          unreadRepresentations: unreadCount,
        };
      })
    );

    res.json({ departments: stats });
  } catch (err) {
    console.error('Error in /departments/:councilId/stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/council/notices/:id/approve
 * Approve a pending notice for publication
 */
router.post('/notices/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, reviewNotes } = req.body;

    if (!reviewedBy) {
      return res.status(400).json({ error: 'reviewedBy (user ID) is required' });
    }

    // Update the notice to approved status
    const { data, error } = await supabase
      .from('notices')
      .update({
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: reviewNotes || null,
        status: 'published', // Change status to published
        published_at: new Date().toISOString(), // Set published timestamp
      })
      .eq('id', id)
      .eq('approval_status', 'pending') // Only approve if currently pending
      .select()
      .single();

    if (error) {
      console.error('Error approving notice:', error);
      return res.status(500).json({ error: 'Failed to approve notice' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Notice not found or not in pending status' });
    }

    // Log the approval action
    await getServiceSupabaseClient().rpc('log_audit_action', {
      p_action_type: 'notice_approved',
      p_resource_type: 'notice',
      p_resource_id: id,
      p_metadata: {
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
      },
    });

    res.json({ notice: data, message: 'Notice approved and published successfully' });
  } catch (err) {
    console.error('Error in /notices/:id/approve:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/council/notices/:id/reject
 * Reject a pending notice
 */
router.post('/notices/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, reviewNotes } = req.body;

    if (!reviewedBy) {
      return res.status(400).json({ error: 'reviewedBy (user ID) is required' });
    }

    if (!reviewNotes) {
      return res.status(400).json({ error: 'reviewNotes is required for rejection' });
    }

    // Update the notice to rejected status
    const { data, error } = await supabase
      .from('notices')
      .update({
        approval_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
        status: 'draft', // Keep as draft, not published
      })
      .eq('id', id)
      .eq('approval_status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error rejecting notice:', error);
      return res.status(500).json({ error: 'Failed to reject notice' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Notice not found or not in pending status' });
    }

    // Log the rejection action
    await getServiceSupabaseClient().rpc('log_audit_action', {
      p_action_type: 'notice_rejected',
      p_resource_type: 'notice',
      p_resource_id: id,
      p_metadata: {
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
      },
    });

    res.json({ notice: data, message: 'Notice rejected successfully' });
  } catch (err) {
    console.error('Error in /notices/:id/reject:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/council/representations/:id/mark-read
 * Mark a representation as read by a specific user
 */
router.post('/representations/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Call the database function to mark as read
    const { error } = await getServiceSupabaseClient().rpc('mark_representation_read', {
      p_representation_id: id,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error marking representation as read:', error);
      return res.status(500).json({ error: 'Failed to mark representation as read' });
    }

    res.json({ message: 'Representation marked as read successfully' });
  } catch (err) {
    console.error('Error in /representations/:id/mark-read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/council/representations/unread-count
 * Get count of unread representations for a department
 */
router.get('/representations/unread-count', async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId query parameter required' });
    }

    // Get all notice IDs for this department
    const { data: noticeIds } = await supabase
      .from('notices')
      .select('id')
      .eq('department_id', departmentId)
      .eq('status', 'published');

    const ids = (noticeIds || []).map((n) => n.id);

    if (ids.length === 0) {
      return res.json({ unreadCount: 0 });
    }

    // Get all representations for these notices
    const { data: reps } = await supabase
      .from('representations')
      .select('id, read_by')
      .in('notice_id', ids);

    // Count representations where read_by is empty or null
    const unreadCount = (reps || []).filter(
      (rep) => !rep.read_by || rep.read_by.length === 0
    ).length;

    res.json({ unreadCount });
  } catch (err) {
    console.error('Error in /representations/unread-count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
