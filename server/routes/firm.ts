import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth';
import { sendTeamInvitation } from '../services/email';

const router = Router();

// Helper to get Supabase admin client
function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/firm/:firmId/team
 * Get all team members for a firm
 */
router.get('/:firmId/team', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId } = req.params;

    if (!user || !firmId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();

    // Verify user has access to this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all team members
    const { data: members, error } = await supabase
      .from('organization_memberships')
      .select(`
        id,
        role,
        created_at,
        user:users!inner (
          id,
          email,
          created_at
        )
      `)
      .eq('organization_id', firmId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[firm-team] Error fetching team:', error);
      return res.status(500).json({ error: 'Failed to fetch team members' });
    }

    return res.json({
      members: members || [],
      count: members?.length || 0
    });
  } catch (error: any) {
    console.error('[firm-team] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/firm/:firmId/team/invite
 * Invite a new team member to the firm
 */
router.post('/:firmId/team/invite', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId } = req.params;
    const { email, role } = req.body;

    if (!user || !firmId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, role' });
    }

    // Validate role
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "member" or "admin"' });
    }

    const supabase = getAdminClient();

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can invite team members' });
    }

    // Get firm details for email
    const { data: firmData } = await supabase
      .from('organizations')
      .select('name, slug')
      .eq('id', firmId)
      .single();

    if (!firmData) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // User exists - check if already a member
      const { data: existingMembership } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', firmId)
        .single();

      if (existingMembership) {
        return res.status(400).json({ error: 'User is already a member of this firm' });
      }

      // Add existing user to firm
      const { error: memberError } = await supabase
        .from('organization_memberships')
        .insert({
          user_id: existingUser.id,
          organization_id: firmId,
          role
        });

      if (memberError) {
        console.error('[firm-invite] Error adding existing user:', memberError);
        return res.status(500).json({ error: 'Failed to add team member' });
      }

      // Send email notification to existing user
      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
      await sendTeamInvitation(email, {
        firmName: firmData.name,
        inviterName: user.email,
        inviterEmail: user.email,
        role,
        loginUrl: `${appUrl}/auth/sign-in`
      });

      return res.json({
        success: true,
        message: 'Team member added successfully',
        userId: existingUser.id
      });
    }

    // User doesn't exist - create invitation
    // TODO: Implement invitation system
    // For now, return error asking them to sign up first
    return res.status(400).json({
      error: 'User not found. Please ask them to create an account first, then invite them.'
    });

  } catch (error: any) {
    console.error('[firm-invite] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/firm/:firmId/team/:membershipId
 * Remove a team member from the firm
 */
router.delete('/:firmId/team/:membershipId', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId, membershipId } = req.params;

    if (!user || !firmId || !membershipId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove team members' });
    }

    // Get the membership to remove
    const { data: targetMembership } = await supabase
      .from('organization_memberships')
      .select('user_id, role')
      .eq('id', membershipId)
      .eq('organization_id', firmId)
      .single();

    if (!targetMembership) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Prevent removing yourself if you're the last admin
    if (targetMembership.user_id === user.id) {
      const { count: adminCount } = await supabase
        .from('organization_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', firmId)
        .eq('role', 'admin');

      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    // Remove the membership
    const { error: deleteError } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('id', membershipId);

    if (deleteError) {
      console.error('[firm-remove-member] Error removing member:', deleteError);
      return res.status(500).json({ error: 'Failed to remove team member' });
    }

    return res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error: any) {
    console.error('[firm-remove-member] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/firm/:firmId/team/:membershipId/role
 * Update a team member's role
 */
router.patch('/:firmId/team/:membershipId/role', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId, membershipId } = req.params;
    const { role } = req.body;

    if (!user || !firmId || !membershipId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!role || !['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "member" or "admin"' });
    }

    const supabase = getAdminClient();

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    // Get the target membership
    const { data: targetMembership } = await supabase
      .from('organization_memberships')
      .select('user_id, role')
      .eq('id', membershipId)
      .eq('organization_id', firmId)
      .single();

    if (!targetMembership) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Prevent demoting yourself if you're the last admin
    if (targetMembership.user_id === user.id && targetMembership.role === 'admin' && role === 'member') {
      const { count: adminCount } = await supabase
        .from('organization_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', firmId)
        .eq('role', 'admin');

      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin' });
      }
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('organization_memberships')
      .update({ role })
      .eq('id', membershipId);

    if (updateError) {
      console.error('[firm-update-role] Error updating role:', updateError);
      return res.status(500).json({ error: 'Failed to update role' });
    }

    return res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error: any) {
    console.error('[firm-update-role] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/firm/:firmId/settings
 * Get firm settings and profile
 */
router.get('/:firmId/settings', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId } = req.params;

    if (!user || !firmId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();

    // Verify user has access to this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get firm details
    const { data: firm, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', firmId)
      .single();

    if (error || !firm) {
      console.error('[firm-settings] Error fetching firm:', error);
      return res.status(404).json({ error: 'Firm not found' });
    }

    return res.json({
      firm: {
        id: firm.id,
        name: firm.name,
        slug: firm.slug,
        type: firm.type,
        contact_email: firm.contact_email,
        contact_phone: firm.contact_phone,
        address: firm.address,
        city: firm.city,
        postcode: firm.postcode,
        website: firm.website,
        logo_url: firm.logo_url,
        created_at: firm.created_at
      },
      userRole: membership.role
    });
  } catch (error: any) {
    console.error('[firm-settings] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/firm/:firmId/settings
 * Update firm settings and profile
 */
router.patch('/:firmId/settings', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { firmId } = req.params;
    const updates = req.body;

    if (!user || !firmId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();

    // Verify user is admin of this firm
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', firmId)
      .single();

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update firm settings' });
    }

    // Whitelist allowed fields
    const allowedFields = [
      'name',
      'contact_email',
      'contact_phone',
      'address',
      'city',
      'postcode',
      'website',
      'logo_url'
    ];

    const filteredUpdates: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update the firm
    const { data: updatedFirm, error: updateError } = await supabase
      .from('organizations')
      .update(filteredUpdates)
      .eq('id', firmId)
      .select()
      .single();

    if (updateError) {
      console.error('[firm-update-settings] Error updating firm:', updateError);
      return res.status(500).json({ error: 'Failed to update firm settings' });
    }

    return res.json({
      success: true,
      message: 'Firm settings updated successfully',
      firm: {
        id: updatedFirm.id,
        name: updatedFirm.name,
        slug: updatedFirm.slug,
        type: updatedFirm.type,
        contact_email: updatedFirm.contact_email,
        contact_phone: updatedFirm.contact_phone,
        address: updatedFirm.address,
        city: updatedFirm.city,
        postcode: updatedFirm.postcode,
        website: updatedFirm.website,
        logo_url: updatedFirm.logo_url,
        created_at: updatedFirm.created_at
      }
    });
  } catch (error: any) {
    console.error('[firm-update-settings] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
