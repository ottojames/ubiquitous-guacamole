import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Key,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';

type TabType = 'councils' | 'firms' | 'users';

interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  last_active_at?: string;
  subscription?: string;
  email?: string;
  contact_name?: string;
  users_count?: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  status?: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Organization | User | null;
  type: TabType;
}

function AccountDetailModal({ isOpen, onClose, item, type }: DetailModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>

          <h3 className="text-xl font-semibold text-white mb-4">
            {type === 'users' ? 'User' : 'Organization'} Details
          </h3>

          <div className="space-y-4">
            {type === 'users' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white">{(item as User).email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Role</label>
                    <p className="text-white">{(item as User).role}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Organization</label>
                    <p className="text-white">{(item as User).organization_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <p className="text-white">{(item as User).status || 'Active'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Created</label>
                    <p className="text-white">
                      {new Date((item as User).created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Sign In</label>
                    <p className="text-white">
                      {(item as User).last_sign_in_at
                        ? new Date((item as User).last_sign_in_at!).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white">{(item as Organization).name}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Type</label>
                    <p className="text-white capitalize">{(item as Organization).type}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        (item as Organization).status === 'active'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {(item as Organization).status}
                    </span>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Subscription</label>
                    <p className="text-white">{(item as Organization).subscription || 'Free'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Created</label>
                    <p className="text-white">
                      {new Date((item as Organization).created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Active</label>
                    <p className="text-white">
                      {(item as Organization).last_active_at
                        ? new Date((item as Organization).last_active_at!).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Contact Email</label>
                    <p className="text-white">{(item as Organization).email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Users</label>
                    <p className="text-white">{(item as Organization).users_count || 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountManagement() {
  const { user: adminUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('councils');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<(Organization | User)[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    item: Organization | User | null;
  }>({ isOpen: false, item: null });

  // Sort configuration
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [location.search]);

  // Fetch data based on active tab
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (activeTab) {
        case 'councils': {
          let query = supabase
            .from('organizations')
            .select(`
              *,
              organization_memberships (
                count
              )
            `)
            .eq('type', 'council');

          if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
          }

          const { data: councils, error } = await query.order('created_at', { ascending: false });

          if (!error && councils) {
            // Map the data to include users_count
            data = councils.map(council => ({
              ...council,
              users_count: council.organization_memberships?.[0]?.count || 0
            }));
          }
          break;
        }
        case 'firms': {
          let query = supabase
            .from('organizations')
            .select(`
              *,
              organization_memberships (
                count
              )
            `)
            .eq('type', 'firm');

          if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
          }

          const { data: firms, error } = await query.order('created_at', { ascending: false });

          if (!error && firms) {
            data = firms.map(firm => ({
              ...firm,
              users_count: firm.organization_memberships?.[0]?.count || 0
            }));
          }
          break;
        }
        case 'users': {
          // Get users from organization_memberships with user details
          const { data: memberships, error } = await supabase
            .from('organization_memberships')
            .select(`
              *,
              organization:organizations (
                name,
                type
              )
            `)
            .order('created_at', { ascending: false });

          if (!error && memberships) {
            // Get unique user IDs
            const userIds = [...new Set(memberships.map(m => m.user_id))];

            // Fetch user details from auth.users (if we have access)
            // For now, we'll use the membership data
            data = memberships.map(membership => ({
              id: membership.user_id,
              email: membership.user_email || 'Unknown',
              role: membership.role,
              organization_id: membership.organization_id,
              organization_name: membership.organization?.name,
              created_at: membership.created_at,
              last_sign_in_at: membership.updated_at,
              status: 'active'
            }));
          }
          break;
        }
      }

      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter((account) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    if ('email' in account && account.email) {
      return account.email.toLowerCase().includes(searchLower);
    } else if ('name' in account) {
      return account.name.toLowerCase().includes(searchLower) ||
             (account.email?.toLowerCase().includes(searchLower) ?? false);
    }
    return false;
  });

  // Sort accounts
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Handle actions
  const handleAction = async (action: string, itemId: string) => {
    try {
      switch (action) {
        case 'suspend':
          // Update organization status to suspended
          const { error: suspendError } = await supabase
            .from('organizations')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', itemId);

          if (suspendError) throw suspendError;
          break;

        case 'activate':
          // Update organization status to active
          const { error: activateError } = await supabase
            .from('organizations')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', itemId);

          if (activateError) throw activateError;
          break;

        case 'delete':
          if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            // Soft delete by updating status to deleted
            const { error: deleteError } = await supabase
              .from('organizations')
              .update({ status: 'deleted', deleted_at: new Date().toISOString() })
              .eq('id', itemId);

            if (deleteError) throw deleteError;
          }
          break;

        case 'reset_password':
          // For user password reset, we would need to implement this via Supabase Auth
          // This would typically send a password reset email
          alert('Password reset functionality coming soon');
          break;

        case 'view':
          // Find the item in the current accounts
          const item = accounts.find(acc => acc.id === itemId);
          if (item) {
            setDetailModal({ isOpen: true, item });
          }
          break;
      }

      fetchAccounts(); // Refresh data
      setShowActionMenu(null);
    } catch (error) {
      console.error('Action failed:', error);
      alert('Failed to perform action. Please try again.');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return;

    try {
      if (action === 'suspend') {
        // Bulk suspend organizations
        const { error } = await supabase
          .from('organizations')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedItems));

        if (error) throw error;
        alert(`${selectedItems.size} accounts suspended successfully`);

      } else if (action === 'activate') {
        // Bulk activate organizations
        const { error } = await supabase
          .from('organizations')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedItems));

        if (error) throw error;
        alert(`${selectedItems.size} accounts activated successfully`);

      } else if (action === 'export') {
        // Export selected items to CSV
        const selectedAccounts = sortedAccounts.filter(acc => selectedItems.has(acc.id));

        // Create CSV content
        const headers = activeTab === 'users'
          ? ['ID', 'Email', 'Role', 'Organization', 'Created', 'Last Sign In']
          : ['ID', 'Name', 'Type', 'Status', 'Created', 'Users Count'];

        const rows = selectedAccounts.map(acc => {
          if (activeTab === 'users') {
            const user = acc as User;
            return [
              user.id,
              user.email,
              user.role,
              user.organization_name || 'N/A',
              new Date(user.created_at).toLocaleDateString(),
              user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
            ];
          } else {
            const org = acc as Organization;
            return [
              org.id,
              org.name,
              org.type,
              org.status,
              new Date(org.created_at).toLocaleDateString(),
              org.users_count || 0
            ];
          }
        });

        // Generate CSV string
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      setSelectedItems(new Set());
      fetchAccounts();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Account Management</h1>
        <p className="text-gray-400">Manage councils, firms, and user accounts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('councils')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'councils'
              ? 'bg-red-900 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Councils
        </button>
        <button
          onClick={() => setActiveTab('firms')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'firms'
              ? 'bg-red-900 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Firms
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'users'
              ? 'bg-red-900 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Users
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Filters */}
          {activeTab !== 'users' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          )}

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                Suspend ({selectedItems.size})
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === sortedAccounts.length && sortedAccounts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(sortedAccounts.map(a => a.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded border-gray-600"
                  />
                </th>
                <th
                  className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    {activeTab === 'users' ? 'Email' : 'Organization Name'}
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-gray-300 font-medium">Type</th>
                <th
                  className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="p-4 text-left text-gray-300 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Created Date
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-gray-300 font-medium">Last Active</th>
                <th className="p-4 text-left text-gray-300 font-medium">Subscription</th>
                <th className="p-4 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No {activeTab} found
                  </td>
                </tr>
              ) : (
                sortedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-700 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(account.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.target.checked) {
                            newSelected.add(account.id);
                          } else {
                            newSelected.delete(account.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="p-4 text-white font-medium">
                      {'email' in account ? account.email : account.name}
                    </td>
                    <td className="p-4 text-gray-300 capitalize">
                      {'role' in account ? account.role : account.type}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          (account as any).status === 'active'
                            ? 'bg-green-900 text-green-200'
                            : (account as any).status === 'suspended'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-red-900 text-red-200'
                        }`}
                      >
                        {(account as any).status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-300">
                      {'last_active_at' in account && account.last_active_at
                        ? new Date(account.last_active_at).toLocaleDateString()
                        : 'last_sign_in_at' in account && account.last_sign_in_at
                        ? new Date(account.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {'subscription' in account ? account.subscription || 'Free' : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === account.id ? null : account.id)}
                          className="p-2 text-gray-400 hover:text-white transition"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showActionMenu === account.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl z-10">
                            <button
                              onClick={() => {
                                setDetailModal({ isOpen: true, item: account });
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            {(account as any).status === 'active' ? (
                              <button
                                onClick={() => handleAction('suspend', account.id)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition flex items-center gap-2"
                              >
                                <Ban className="h-4 w-4" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction('activate', account.id)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Activate
                              </button>
                            )}
                            <button
                              className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition flex items-center gap-2"
                            >
                              <Key className="h-4 w-4" />
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleAction('delete', account.id)}
                              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-600 transition flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AccountDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, item: null })}
        item={detailModal.item}
        type={activeTab}
      />
    </div>
  );
}