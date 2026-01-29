import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Initialize Supabase client lazily with service role key
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
 * GET /api/internal-comments/:representationId
 * Get all internal comments for a representation
 * Protected: Requires authentication
 */
router.get('/:representationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { representationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabase();

    // First, get the representation to find its department
    const { data: representation, error: repError } = await supabase
      .from('representations')
      .select(`
        id,
        notice_id,
        notices!inner (
          id,
          department_id
        )
      `)
      .eq('id', representationId)
      .single();

    if (repError || !representation) {
      return res.status(404).json({ error: 'Representation not found' });
    }

    const departmentId = (representation as any).notices?.department_id;

    // Check if user has access to this department
    const { data: membership, error: membershipError } = await supabase
      .from('department_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('department_id', departmentId)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking department membership:', membershipError);
      return res.status(500).json({ error: 'Failed to verify access' });
    }

    // Also check org-level access
    let hasAccess = !!membership;
    let userRole = (membership as any)?.role || 'viewer';

    if (!hasAccess) {
      // Check if user has org-level admin access
      const { data: dept } = await supabase
        .from('departments')
        .select('organization_id')
        .eq('id', departmentId)
        .single();

      if (dept) {
        const { data: orgMembershipDirect } = await supabase
          .from('organization_memberships')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', (dept as any).organization_id)
          .maybeSingle();

        if ((orgMembershipDirect as any)?.role === 'owner' || (orgMembershipDirect as any)?.role === 'org_admin') {
          hasAccess = true;
          userRole = (orgMembershipDirect as any).role;
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this department' });
    }

    // Fetch comments for this representation
    const { data: comments, error: commentsError } = await supabase
      .from('internal_comments')
      .select('*')
      .eq('representation_id', representationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching internal comments:', commentsError);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    // Apply visibility filtering based on user role
    const visibleComments = (comments || []).filter((comment: any) => {
      // Heads/admins see all
      if (['head', 'admin', 'owner', 'org_admin'].includes(userRole)) {
        return true;
      }
      // Senior officers see all
      if (['senior', 'editor', 'dept_admin', 'officer'].includes(userRole)) {
        return true;
      }
      // Junior officers see only their own
      return comment.author_id === userId;
    });

    return res.json(visibleComments);
  } catch (error) {
    console.error('Error in GET /api/internal-comments/:representationId:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/internal-comments
 * Add an internal comment to a representation
 * Body: { representationId, departmentId, authorName, authorRole, commentText, visibility? }
 * Protected: Requires authentication
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      representationId,
      departmentId,
      authorName,
      authorRole,
      commentText,
      visibility = 'department'
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validation
    if (!representationId) {
      return res.status(400).json({ error: 'representationId is required' });
    }

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' });
    }

    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return res.status(400).json({ error: 'commentText is required and cannot be empty' });
    }

    const supabase = getSupabase();

    // Verify user has access to this department
    const { data: membership, error: membershipError } = await supabase
      .from('department_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('department_id', departmentId)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking department membership:', membershipError);
      return res.status(500).json({ error: 'Failed to verify access' });
    }

    let hasAccess = !!membership;
    let userRole = (membership as any)?.role || authorRole || 'viewer';

    // Also check org-level admin access
    if (!hasAccess) {
      const { data: dept } = await supabase
        .from('departments')
        .select('organization_id')
        .eq('id', departmentId)
        .single();

      if (dept) {
        const { data: orgMembership } = await supabase
          .from('organization_memberships')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', (dept as any).organization_id)
          .maybeSingle();

        if ((orgMembership as any)?.role === 'owner' || (orgMembership as any)?.role === 'org_admin') {
          hasAccess = true;
          userRole = (orgMembership as any).role;
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this department' });
    }

    // Verify representation exists and belongs to department
    const { data: representation, error: repError } = await supabase
      .from('representations')
      .select(`
        id,
        notices!inner (
          department_id
        )
      `)
      .eq('id', representationId)
      .single();

    if (repError || !representation) {
      return res.status(404).json({ error: 'Representation not found' });
    }

    const repDeptId = (representation as any).notices?.department_id;
    if (repDeptId !== departmentId) {
      return res.status(400).json({ error: 'Representation does not belong to specified department' });
    }

    // Get user's email/name if not provided
    const effectiveAuthorName = authorName || req.user?.email || 'Unknown User';
    const effectiveAuthorRole = authorRole || userRole;

    // Insert the comment using service role (bypasses RLS)
    const { data: comment, error: insertError } = await supabase
      .from('internal_comments')
      .insert({
        representation_id: representationId,
        department_id: departmentId,
        author_id: userId,
        author_name: effectiveAuthorName,
        author_role: effectiveAuthorRole,
        comment_text: commentText.trim(),
        visibility
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting internal comment:', insertError);
      return res.status(500).json({ error: 'Failed to add comment', details: insertError.message });
    }

    // Log to audit trail
    try {
      await supabase.rpc('log_audit_action', {
        p_action_type: 'internal_comment_added',
        p_resource_type: 'representation',
        p_resource_id: representationId,
        p_metadata: {
          comment_id: (comment as any).id,
          author_id: userId,
          author_name: effectiveAuthorName,
          department_id: departmentId
        }
      } as any);
    } catch (auditError) {
      console.error('Failed to create audit log for comment:', auditError);
      // Don't fail the request if audit logging fails
    }

    return res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error in POST /api/internal-comments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/internal-comments/:commentId
 * Soft-delete an internal comment (marks deleted_at)
 * Only allowed for comment author or department admins
 * Protected: Requires authentication
 */
router.delete('/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabase();

    // Fetch the comment
    const { data: comment, error: fetchError } = await supabase
      .from('internal_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user can delete this comment
    const isAuthor = (comment as any).author_id === userId;

    // Check if user is admin in the department
    const { data: membership } = await supabase
      .from('department_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('department_id', (comment as any).department_id)
      .maybeSingle();

    const isAdmin = (membership as any)?.role && ['head', 'admin', 'owner', 'org_admin', 'dept_admin'].includes((membership as any).role);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from('internal_comments')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/internal-comments/:commentId:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
