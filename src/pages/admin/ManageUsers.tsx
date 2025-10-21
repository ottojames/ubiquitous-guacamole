import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  _memberships?: {
    organization_name: string;
    organization_type: string;
    role: string;
  }[];
}

export default function ManageUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      // Get all users from auth.users via service role
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Auth error:', authError);
        // Fallback: Try to get users from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, created_at');

        if (profilesError) throw profilesError;

        const usersWithMemberships = await Promise.all(
          (profilesData || []).map(async (user) => {
            const memberships = await loadUserMemberships(user.id);
            return {
              id: user.id,
              email: user.email || 'No email',
              created_at: user.created_at,
              last_sign_in_at: null,
              _memberships: memberships
            };
          })
        );

        setUsers(usersWithMemberships);
        setLoading(false);
        return;
      }

      // Process auth users
      const usersWithMemberships = await Promise.all(
        (authUsers.users || []).map(async (user) => {
          const memberships = await loadUserMemberships(user.id);
          return {
            id: user.id,
            email: user.email || 'No email',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || null,
            _memberships: memberships
          };
        })
      );

      setUsers(usersWithMemberships);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load users:', err);
      setLoading(false);
    }
  };

  const loadUserMemberships = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          role,
          organization:organization_id (
            name,
            type
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map((membership: any) => ({
        organization_name: membership.organization.name,
        organization_type: membership.organization.type,
        role: membership.role
      }));
    } catch (err) {
      console.error('Failed to load user memberships:', err);
      return [];
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleViewDetails = async (user: User) => {
    // Reload memberships for freshest data
    const memberships = await loadUserMemberships(user.id);
    setSelectedUser({ ...user, _memberships: memberships });
    setShowDetailsModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) throw error;

      alert('User deleted successfully');
      loadUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage all users across the platform</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or user ID..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-600 mb-2">No users found</p>
          <p className="text-sm text-gray-500">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{user.email}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">User ID:</span> {user.id}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Created:</span> {formatDate(user.created_at)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Last Sign In:</span> {formatDate(user.last_sign_in_at)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(user)}
                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-colors font-semibold text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {user._memberships && user._memberships.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Organization Memberships</p>
                  <div className="flex flex-wrap gap-2">
                    {user._memberships.map((membership, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-gray-50 rounded-xl text-sm"
                      >
                        <span className="font-semibold">{membership.organization_name}</span>
                        <span className="text-gray-600"> • {membership.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!user._memberships || user._memberships.length === 0) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 italic">No organization memberships</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Basic Information</h3>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-mono text-sm text-gray-900">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Sign In</p>
                    <p className="text-gray-900">{formatDate(selectedUser.last_sign_in_at)}</p>
                  </div>
                </div>
              </div>

              {/* Memberships */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Organization Memberships</h3>
                {selectedUser._memberships && selectedUser._memberships.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser._memberships.map((membership, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-4">
                        <p className="font-semibold text-gray-900 mb-1">{membership.organization_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              membership.organization_type === 'council'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {membership.organization_type === 'council' ? 'Council' : 'Law Firm'}
                          </span>
                          <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold">
                            {membership.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center">
                    <p className="text-gray-500 italic">No organization memberships</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
