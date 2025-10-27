import { Router } from 'express';
import { requireAuth, loadUserPermissions, requirePermission } from '../middleware/auth';
import { getServiceSupabaseClient } from '../lib/supabase';

const router = Router();

/**
 * GET /api/departments/:deptId/team
 * List all team members for a department
 * Requires: team.read permission
 */
router.get(
  '/departments/:deptId/team',
  requireAuth,
  loadUserPermissions,
  requirePermission('team.read'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      // Get all department memberships with role information
      const { data: memberships, error: membershipsError } = await supabase
        .from('department_memberships')
        .select(`
          id,
          user_id,
          role,
          role_id,
          last_accessed_at,
          created_at,
          roles (
            name,
            display_name,
            level
          )
        `)
        .eq('department_id', deptId)
        .order('created_at', { ascending: false });

      if (membershipsError) {
        console.error('Error fetching team members:', membershipsError);
        return res.status(500).json({ error: 'Failed to fetch team members' });
      }

      // Get user emails from auth.users (requires admin client)
      const userIds = memberships?.map(m => m.user_id) || [];
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('Error fetching user emails:', usersError);
        // Continue without emails rather than failing completely
      }

      // Map emails to user IDs
      const userEmailMap = new Map();
      if (users?.users) {
        users.users.forEach(user => {
          userEmailMap.set(user.id, user.email);
        });
      }

      // Combine membership data with emails
      const teamMembers = memberships?.map(m => ({
        id: m.id,
        user_id: m.user_id,
        email: userEmailMap.get(m.user_id) || null,
        role: m.role,
        role_id: m.role_id,
        role_name: m.roles?.name || m.role,
        role_display_name: m.roles?.display_name || m.role,
        role_level: m.roles?.level || 999,
        last_accessed_at: m.last_accessed_at,
        joined_at: m.created_at
      })) || [];

      res.json({
        team_members: teamMembers,
        total: teamMembers.length
      });
    } catch (error) {
      console.error('Error in GET /departments/:deptId/team:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/departments/:deptId/team/invite
 * Invite a new team member to the department
 * Requires: team.invite permission
 */
router.post(
  '/departments/:deptId/team/invite',
  requireAuth,
  loadUserPermissions,
  requirePermission('team.invite'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId } = req.params;
      const { email, role } = req.body;
      const userId = req.user!.id;

      if (!deptId) {
        return res.status(400).json({ error: 'Department ID is required' });
      }

      if (!email || !role) {
        return res.status(400).json({ error: 'Email and role are required' });
      }

      // Validate role (legacy values for now)
      const validRoles = ['department_admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: department_admin, editor, viewer'
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users.find(u => u.email === email);

      if (user) {
        // User exists - check if already a member
        const { data: existingMembership } = await supabase
          .from('department_memberships')
          .select('id')
          .eq('department_id', deptId)
          .eq('user_id', user.id)
          .single();

        if (existingMembership) {
          return res.status(409).json({
            error: 'User is already a member of this department'
          });
        }

        // Get role_id for the role
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role === 'department_admin' ? 'dept_admin' : role === 'editor' ? 'officer' : 'viewer')
          .single();

        if (roleError || !roleData) {
          console.error('Error fetching role:', roleError);
          return res.status(500).json({ error: 'Failed to fetch role information' });
        }

        // Add existing user to department
        const { error: insertError } = await supabase
          .from('department_memberships')
          .insert({
            department_id: deptId,
            user_id: user.id,
            role: role,
            role_id: roleData.id,
            invited_by: userId
          });

        if (insertError) {
          console.error('Error adding user to department:', insertError);
          return res.status(500).json({ error: 'Failed to add user to department' });
        }

        return res.status(201).json({
          message: 'User added to department successfully',
          user_id: user.id,
          email: email
        });
      }

      // User doesn't exist - create invitation
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          department_id: deptId,
          email: email,
          role: role,
          invited_by: userId
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);

        // Check if it's a duplicate invitation
        if (inviteError.code === '23505') {
          return res.status(409).json({
            error: 'An invitation has already been sent to this email address'
          });
        }

        return res.status(500).json({ error: 'Failed to create invitation' });
      }

      res.status(201).json({
        message: 'Invitation sent successfully',
        email: email,
        note: 'User will be added to the department once they accept the invitation'
      });
    } catch (error) {
      console.error('Error in POST /departments/:deptId/team/invite:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /api/departments/:deptId/team/:userId/role
 * Update a team member's role
 * Requires: team.update permission
 */
router.patch(
  '/departments/:deptId/team/:userId/role',
  requireAuth,
  loadUserPermissions,
  requirePermission('team.update'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, userId: targetUserId } = req.params;
      const { role } = req.body;

      if (!deptId || !targetUserId) {
        return res.status(400).json({ error: 'Department ID and User ID are required' });
      }

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      // Validate role
      const validRoles = ['department_admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: department_admin, editor, viewer'
        });
      }

      // Get role_id for the new role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role === 'department_admin' ? 'dept_admin' : role === 'editor' ? 'officer' : 'viewer')
        .single();

      if (roleError || !roleData) {
        console.error('Error fetching role:', roleError);
        return res.status(500).json({ error: 'Failed to fetch role information' });
      }

      // Check if user is trying to change their own role
      if (targetUserId === req.user!.id) {
        return res.status(403).json({
          error: 'You cannot change your own role'
        });
      }

      // Update the role
      const { error: updateError } = await supabase
        .from('department_memberships')
        .update({
          role: role,
          role_id: roleData.id
        })
        .eq('department_id', deptId)
        .eq('user_id', targetUserId);

      if (updateError) {
        console.error('Error updating role:', updateError);
        return res.status(500).json({ error: 'Failed to update role' });
      }

      res.json({
        message: 'Role updated successfully',
        user_id: targetUserId,
        new_role: role
      });
    } catch (error) {
      console.error('Error in PATCH /departments/:deptId/team/:userId/role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/departments/:deptId/team/:userId
 * Remove a team member from the department
 * Requires: team.remove permission
 */
router.delete(
  '/departments/:deptId/team/:userId',
  requireAuth,
  loadUserPermissions,
  requirePermission('team.remove'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { deptId, userId: targetUserId } = req.params;

      if (!deptId || !targetUserId) {
        return res.status(400).json({ error: 'Department ID and User ID are required' });
      }

      // Check if user is trying to remove themselves
      if (targetUserId === req.user!.id) {
        return res.status(403).json({
          error: 'You cannot remove yourself from the department. Please contact another admin.'
        });
      }

      // Check if this is the last admin
      const { data: admins, error: adminCheckError } = await supabase
        .from('department_memberships')
        .select('user_id, role')
        .eq('department_id', deptId)
        .eq('role', 'department_admin');

      if (adminCheckError) {
        console.error('Error checking admins:', adminCheckError);
        return res.status(500).json({ error: 'Failed to verify admin status' });
      }

      const { data: targetMember } = await supabase
        .from('department_memberships')
        .select('role')
        .eq('department_id', deptId)
        .eq('user_id', targetUserId)
        .single();

      if (targetMember?.role === 'department_admin' && admins && admins.length <= 1) {
        return res.status(403).json({
          error: 'Cannot remove the last department admin. Assign another admin first.'
        });
      }

      // Remove the member
      const { error: deleteError } = await supabase
        .from('department_memberships')
        .delete()
        .eq('department_id', deptId)
        .eq('user_id', targetUserId);

      if (deleteError) {
        console.error('Error removing team member:', deleteError);
        return res.status(500).json({ error: 'Failed to remove team member' });
      }

      res.json({
        message: 'Team member removed successfully',
        user_id: targetUserId
      });
    } catch (error) {
      console.error('Error in DELETE /departments/:deptId/team/:userId:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
