import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { PERMISSIONS } from '@/types/permissions';

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

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function Team() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Organization domain for email validation
  const [allowedDomain, setAllowedDomain] = useState<string | null>(null);

  const loadTeamMembers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Use the API endpoint which fetches user emails via service role
      const response = await fetch(`/api/departments/${department.id}/team`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Map API response to TeamMember format
        const teamMembers = (data.team_members || []).map((m: {
          user_id: string;
          email: string | null;
          role: string;
          joined_at: string;
          last_accessed_at: string | null;
        }) => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          last_accessed_at: m.last_accessed_at,
          user_email: m.email || undefined
        }));
        setMembers(teamMembers);
      } else {
        console.error('Failed to load team members:', response.statusText);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  }, [department.id]);

  const loadPendingInvitations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/departments/${department.id}/team/invitations`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load pending invitations:', err);
    }
  }, [department.id]);

  // Load organization domain for email validation
  const loadOrganizationDomain = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('domain')
        .eq('id', department.organization.id)
        .single();

      if (error) throw error;
      if (data?.domain) {
        setAllowedDomain(data.domain);
      }
    } catch (err) {
      console.error('Failed to load organization domain:', err);
    }
  }, [department.organization.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTeamMembers(), loadPendingInvitations(), loadOrganizationDomain()]);
      setLoading(false);
    };
    loadData();
  }, [loadTeamMembers, loadPendingInvitations, loadOrganizationDomain]);

  // Validate email domain against organization's allowed domain
  const validateEmailDomain = (email: string): { valid: boolean; message?: string } => {
    if (!allowedDomain) {
      // If no domain is set, allow any email
      return { valid: true };
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    const normalizedAllowedDomain = allowedDomain.toLowerCase();

    if (!emailDomain || emailDomain !== normalizedAllowedDomain) {
      return {
        valid: false,
        message: `Invitations can only be sent to @${allowedDomain} addresses`
      };
    }

    return { valid: true };
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

      // Validate email domain against organization's allowed domain
      const domainValidation = validateEmailDomain(inviteEmail);
      if (!domainValidation.valid) {
        throw new Error(domainValidation.message);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Send invitation via API (which sends the email)
      const response = await fetch(`/api/departments/${department.id}/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(data.emailSent
        ? `Invitation sent to ${inviteEmail}`
        : `${inviteEmail} was added to the team`);
      setInviteEmail('');
      setInviteRole('viewer');

      // Refresh data
      await Promise.all([loadTeamMembers(), loadPendingInvitations()]);
    } catch (err) {
      console.error('Failed to send invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setCancellingId(invitationId);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `/api/departments/${department.id}/team/invitations/${invitationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      setSuccess('Invitation cancelled');
      await loadPendingInvitations();
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setCancellingId(null);
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

  const handleBulkImport = async () => {
    if (!csvFile) return;

    try {
      setImporting(true);
      setError(null);
      setImportResults(null);

      // Read CSV file
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty');
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.findIndex(h => h === 'email' || h === 'email address');
      const roleIndex = headers.findIndex(h => h === 'role');

      if (emailIndex === -1) {
        throw new Error('CSV must have an "Email" column');
      }

      const results = {
        total: lines.length - 1, // Exclude header
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const email = values[emailIndex];
          const role = roleIndex !== -1 ? values[roleIndex] : 'viewer';

          if (!email) {
            results.errors.push(`Row ${i}: Missing email`);
            results.failed++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.errors.push(`Row ${i}: Invalid email format: ${email}`);
            results.failed++;
            continue;
          }

          // Validate email domain
          const domainValidation = validateEmailDomain(email);
          if (!domainValidation.valid) {
            results.errors.push(`Row ${i}: ${domainValidation.message}`);
            results.failed++;
            continue;
          }

          // Validate role
          const validRoles = ['department_admin', 'editor', 'viewer'];
          const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');
          if (!validRoles.includes(normalizedRole)) {
            results.errors.push(`Row ${i}: Invalid role "${role}". Must be one of: Department Admin, Editor, Viewer`);
            results.failed++;
            continue;
          }

          // Send invitation via API (which sends the email)
          const response = await fetch(`/api/departments/${department.id}/team/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              email: email,
              role: normalizedRole
            })
          });

          if (!response.ok) {
            const data = await response.json();
            results.errors.push(`Row ${i}: ${data.error || 'Failed to send invitation'}`);
            results.failed++;
          } else {
            results.successful++;
          }
        } catch (err) {
          results.errors.push(`Row ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      setImportResults(results);

      if (results.successful > 0) {
        setSuccess(`Successfully sent ${results.successful} invitation${results.successful !== 1 ? 's' : ''}`);
        // Refresh both members (in case existing users were added) and invitations
        await Promise.all([loadTeamMembers(), loadPendingInvitations()]);
      }

      if (results.failed > 0 && results.successful === 0) {
        setError(`Failed to import any team members. Check the errors below.`);
      }
    } catch (err) {
      console.error('Bulk import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'Email,Role\nexample@council.gov.uk,Editor\nuser@council.gov.uk,Viewer\nadmin@council.gov.uk,Department Admin';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'team-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Check if user has permission to manage team members using RBAC system
  // User needs team.invite permission to see the invite form
  const canManageTeam = hasPermission(PERMISSIONS.TEAM_INVITE);

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

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Bulk Import CSV
              </button>
            </div>
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
                        {member.user_email || `User ${member.user_id.slice(0, 8)}...`}
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

      {/* Pending Invitations */}
      {canManageTeam && pendingInvitations.length > 0 && (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Pending Invitations ({pendingInvitations.length})
          </h2>

          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-amber-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited {formatDate(invitation.created_at)} • Expires {formatDate(invitation.expires_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(invitation.role)}`}>
                    {formatRoleName(invitation.role)}
                  </span>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={cancellingId === invitation.id}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50"
                  >
                    {cancellingId === invitation.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Import Team Members</h2>
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setCsvFile(null);
                    setImportResults(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>CSV Format:</strong> Your file must include an "Email" column. Optional "Role" column (defaults to Viewer).
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Roles:</strong> Department Admin, Editor, Viewer
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Template
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setCsvFile(e.target.files?.[0] || null);
                      setImportResults(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {csvFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Import Results</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Rows:</span>
                        <span className="font-semibold">{importResults.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Successful:</span>
                        <span className="font-semibold text-green-600">{importResults.successful}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-semibold text-red-600">{importResults.failed}</span>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">Errors:</h4>
                        <div className="max-h-40 overflow-y-auto bg-white rounded-lg p-3 space-y-1">
                          {importResults.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-700">{error}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setCsvFile(null);
                    setImportResults(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={importing}
                >
                  {importResults ? 'Close' : 'Cancel'}
                </button>
                {!importResults && (
                  <button
                    onClick={handleBulkImport}
                    disabled={!csvFile || importing}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {importing ? 'Importing...' : 'Import CSV'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
