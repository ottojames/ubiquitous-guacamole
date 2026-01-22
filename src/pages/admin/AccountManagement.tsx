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
import AlertModal from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import * as UI from '@/styles/ui';

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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <X className="h-6 w-6" />
          </button>

          <h3 className="text-xl font-semibold text-slate-900 mb-4">
            {type === 'users' ? 'User' : 'Organization'} Details
          </h3>

          <div className="space-y-4">
            {type === 'users' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 text-sm">Email</label>
                    <p className="text-slate-900">{(item as User).email}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Role</label>
                    <p className="text-slate-900">{(item as User).role}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Organization</label>
                    <p className="text-slate-900">{(item as User).organization_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Status</label>
                    <p className="text-slate-900">{(item as User).status || 'Active'}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Created</label>
                    <p className="text-slate-900">
                      {new Date((item as User).created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Last Sign In</label>
                    <p className="text-slate-900">
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
                    <label className="text-slate-500 text-sm">Name</label>
                    <p className="text-slate-900">{(item as Organization).name}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Type</label>
                    <p className="text-slate-900 capitalize">{(item as Organization).type}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        (item as Organization).status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {(item as Organization).status}
                    </span>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Subscription</label>
                    <p className="text-slate-900">{(item as Organization).subscription || 'Free'}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Created</label>
                    <p className="text-slate-900">
                      {new Date((item as Organization).created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Last Active</label>
                    <p className="text-slate-900">
                      {(item as Organization).last_active_at
                        ? new Date((item as Organization).last_active_at!).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Contact Email</label>
                    <p className="text-slate-900">{(item as Organization).email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm">Users</label>
                    <p className="text-slate-900">{(item as Organization).users_count || 0}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

  // Alert modal state for replacing browser alert() calls
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ isOpen: false, variant: 'info', title: '', message: '' });

  // Confirm modal state for delete confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    accountId: string | null;
  }>({ isOpen: false, accountId: null });

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
        case 'suspend': {
          // Update organization status to suspended
          const { error: suspendError } = await supabase
            .from('organizations')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', itemId);

          if (suspendError) throw suspendError;
          break;
        }

        case 'activate': {
          // Update organization status to active
          const { error: activateError } = await supabase
            .from('organizations')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', itemId);

          if (activateError) throw activateError;
          break;
        }

        case 'delete':
          setConfirmModal({ isOpen: true, accountId: itemId });
          setShowActionMenu(null);
          return; // Don't refresh until confirmation

        case 'reset_password': {
          // Find the user to get their email
          const userToReset = accounts.find(acc => acc.id === itemId) as User | undefined;
          if (!userToReset?.email) {
            setAlertModal({
              isOpen: true,
              variant: 'error',
              title: 'Error',
              message: 'Could not find user email for password reset.'
            });
            break;
          }

          // Send password reset email via Supabase Auth
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            userToReset.email,
            {
              redirectTo: `${window.location.origin}/auth/reset-password`
            }
          );

          if (resetError) {
            console.error('Password reset error:', resetError);
            setAlertModal({
              isOpen: true,
              variant: 'error',
              title: 'Password Reset Failed',
              message: resetError.message || 'Failed to send password reset email. Please try again.'
            });
          } else {
            setAlertModal({
              isOpen: true,
              variant: 'success',
              title: 'Password Reset Email Sent',
              message: `A password reset link has been sent to ${userToReset.email}. The link will expire in 1 hour.`
            });
          }
          break;
        }

        case 'view': {
          // Find the item in the current accounts
          const item = accounts.find(acc => acc.id === itemId);
          if (item) {
            setDetailModal({ isOpen: true, item });
          }
          break;
        }
      }

      fetchAccounts(); // Refresh data
      setShowActionMenu(null);
    } catch (error) {
      console.error('Action failed:', error);
      setAlertModal({
        isOpen: true,
        variant: 'error',
        title: 'Action Failed',
        message: 'Failed to perform action. Please try again.'
      });
    }
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!confirmModal.accountId) return;

    try {
      // Soft delete by updating status to deleted
      const { error: deleteError } = await supabase
        .from('organizations')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', confirmModal.accountId);

      if (deleteError) throw deleteError;

      setConfirmModal({ isOpen: false, accountId: null });
      fetchAccounts(); // Refresh data
    } catch (error) {
      console.error('Delete failed:', error);
      setConfirmModal({ isOpen: false, accountId: null });
      setAlertModal({
        isOpen: true,
        variant: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete account. Please try again.'
      });
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
        setAlertModal({
          isOpen: true,
          variant: 'success',
          title: 'Accounts Suspended',
          message: `${selectedItems.size} account${selectedItems.size === 1 ? '' : 's'} suspended successfully.`
        });

      } else if (action === 'activate') {
        // Bulk activate organizations
        const { error } = await supabase
          .from('organizations')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .in('id', Array.from(selectedItems));

        if (error) throw error;
        setAlertModal({
          isOpen: true,
          variant: 'success',
          title: 'Accounts Activated',
          message: `${selectedItems.size} account${selectedItems.size === 1 ? '' : 's'} activated successfully.`
        });

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Management</h1>
        <p className="text-slate-500">Manage councils, firms, and user accounts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('councils')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            activeTab === 'councils'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Councils
        </button>
        <button
          onClick={() => setActiveTab('firms')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            activeTab === 'firms'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Firms
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Users
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="account-search" className="sr-only">Search {activeTab}</label>
            <div className="relative">
              <Search className={UI.inputIconLeft} />
              <input
                id="account-search"
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${UI.inputWithIconLeft}`}
              />
            </div>
          </div>

          {/* Filters */}
          {activeTab !== 'users' && (
            <div className="relative">
              <label htmlFor="account-status-filter" className="sr-only">Filter by status</label>
              <select
                id="account-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={UI.selectBase}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
              <ChevronDown className={UI.selectChevron} />
            </div>
          )}

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('suspend')}
                className={`${UI.btnDanger} flex items-center gap-2`}
              >
                <Ban className="h-4 w-4" />
                Suspend ({selectedItems.size})
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">
                  <label className="sr-only" htmlFor="select-all-accounts">Select all accounts</label>
                  <input
                    id="select-all-accounts"
                    type="checkbox"
                    checked={selectedItems.size === sortedAccounts.length && sortedAccounts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(sortedAccounts.map(a => a.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th
                  className="p-4 text-left text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    {activeTab === 'users' ? 'Email' : 'Organization Name'}
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-slate-600 font-medium">Type</th>
                <th
                  className="p-4 text-left text-slate-600 font-medium cursor-pointer hover:text-slate-900"
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
                  className="p-4 text-left text-slate-600 font-medium cursor-pointer hover:text-slate-900"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Created Date
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left text-slate-600 font-medium">Last Active</th>
                <th className="p-4 text-left text-slate-600 font-medium">Subscription</th>
                <th className="p-4 text-left text-slate-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No {activeTab} found
                  </td>
                </tr>
              ) : (
                sortedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${'email' in account ? account.email : account.name}`}
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
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4 text-slate-900 font-medium">
                      {'email' in account ? account.email : account.name}
                    </td>
                    <td className="p-4 text-slate-600 capitalize">
                      {'role' in account ? account.role : account.type}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          (account as any).status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : (account as any).status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(account as any).status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-600">
                      {'last_active_at' in account && account.last_active_at
                        ? new Date(account.last_active_at).toLocaleDateString()
                        : 'last_sign_in_at' in account && account.last_sign_in_at
                        ? new Date(account.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {'subscription' in account ? account.subscription || 'Free' : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === account.id ? null : account.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showActionMenu === account.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                            <button
                              onClick={() => {
                                setDetailModal({ isOpen: true, item: account });
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            {(account as any).status === 'active' ? (
                              <button
                                onClick={() => handleAction('suspend', account.id)}
                                className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                              >
                                <Ban className="h-4 w-4" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction('activate', account.id)}
                                className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Activate
                              </button>
                            )}
                            <button
                              className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                              <Key className="h-4 w-4" />
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleAction('delete', account.id)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-slate-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
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

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        variant={alertModal.variant}
        title={alertModal.title}
        message={alertModal.message}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, accountId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}