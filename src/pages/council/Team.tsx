import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
  };
}

interface ContextType {
  department: Department;
  userRole: string;
}

interface TeamMember {
  user_id: string;
  role: string;
  joined_at: string;
  last_accessed_at: string | null;
  user_email?: string;
}

export default function Team() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [department.id]);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('department_memberships')
        .select(`
          user_id,
          role,
          joined_at,
          last_accessed_at
        `)
        .eq('department_id', department.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users (requires service role in production)
      // For now, we'll show user IDs
      setMembers(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load team members:', err);
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!inviteEmail) {
        throw new Error('Email is required');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          department_id: department.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: session.user.id
        });

      if (inviteError) throw inviteError;

      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviting(false);

      // Refresh team list after a delay
      setTimeout(loadTeamMembers, 1000);
    } catch (err) {
      console.error('Failed to send invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('department_memberships')
        .update({ role: newRole })
        .eq('department_id', department.id)
        .eq('user_id', userId);

      if (error) throw error;

      setSuccess('Role updated successfully');
      loadTeamMembers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('department_memberships')
        .delete()
        .eq('department_id', department.id)
        .eq('user_id', userId);

      if (error) throw error;

      setSuccess('Team member removed');
      loadTeamMembers();
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'department_admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const canManageTeam = ['owner', 'org_admin', 'department_admin'].includes(userRole);

  const roles = [
    { value: 'department_admin', label: 'Department Admin', description: 'Full access to department management' },
    { value: 'editor', label: 'Editor', description: 'Can create and edit notices' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage access to {department.name}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Invite Form */}
      {canManageTeam && (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Member</h2>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                  required
                  disabled={inviting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={inviting}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          {/* Role Descriptions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Role Permissions</h3>
            <div className="space-y-2">
              {roles.map(role => (
                <div key={role.value} className="flex items-start gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(role.value)}`}>
                    {role.label}
                  </span>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Current Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">No team members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        User {member.user_id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-600">
                        Joined {formatDate(member.joined_at)} • Last active {formatDate(member.last_accessed_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canManageTeam ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                      {formatRoleName(member.role)}
                    </span>
                  )}

                  {canManageTeam && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
