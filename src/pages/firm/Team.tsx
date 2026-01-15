import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface FirmContext {
  firm: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
}

interface TeamMember {
  id: string;
  role: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

export default function FirmTeam() {
  const { firm, userRole } = useOutletContext<FirmContext>();
  const { firmSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    loadTeamMembers();
  }, [firm.id]);

  const loadTeamMembers = async () => {
    try {
      // Query team members directly from Supabase
      const { data: teamData, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          created_at,
          user:user_id (
            id,
            email,
            created_at
          )
        `)
        .eq('organization_id', firm.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading team members:', error);
        setLoading(false);
        return;
      }

      setMembers(teamData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading team members:', error);
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      // For now, show alert - full team invite flow requires email service setup
      alert(`Team invite functionality coming soon. Would invite ${inviteEmail} as ${inviteRole}.`);

      // Close modal and reset
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteLoading(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      setInviteError('An unexpected error occurred');
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/firm/${firm.id}/team/${membershipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to remove team member');
        return;
      }

      loadTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('An unexpected error occurred');
    }
  };

  const handleChangeRole = async (membershipId: string, currentRole: string, memberEmail: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';

    if (!confirm(`Change role for ${memberEmail} to ${newRole}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/firm/${firm.id}/team/${membershipId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to update role');
        return;
      }

      loadTeamMembers();
    } catch (error) {
      console.error('Error changing role:', error);
      alert('An unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage who has access to {firm.name}</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Team ({members.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                {userRole === 'admin' && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {member.user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(member.created_at)}
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleChangeRole(member.id, member.role, member.user.email)}
                        className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user.email)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite Team Member</h2>
            <p className="text-gray-600 mb-6">
              Send an invitation to join {firm.name}
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="member">Member - Can publish notices</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">{inviteError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('member');
                    setInviteError('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
