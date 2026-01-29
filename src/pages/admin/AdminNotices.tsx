import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { NoticeTableSkeleton } from '@/components/skeletons';
import { AlertModal } from '@/components/ui/AlertModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import * as UI from '@/styles/ui';

interface Notice {
  id: string;
  title: string;
  applicant_name: string;
  premises_address: string;
  notice_type: string;
  status: string;
  created_at: string;
  published_at?: string;
  expires_at?: string;
  organization_id: string;
  organization?: {
    name: string;
    type: string;
  };
}

export default function AdminNotices() {
  const { user: adminUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', variant: 'info' });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    noticeId: string | null;
  }>({ isOpen: false, noticeId: null });

  // Fetch notices from database
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notices')
        .select(`
          *,
          organization:organizations (
            name,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('notice_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notices:', error);
      } else {
        setNotices(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Filter notices based on search
  const filteredNotices = notices.filter((notice) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      notice.title?.toLowerCase().includes(searchLower) ||
      notice.applicant_name?.toLowerCase().includes(searchLower) ||
      notice.premises_address?.toLowerCase().includes(searchLower) ||
      notice.organization?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle notice actions
  const handleNoticeAction = async (action: string, noticeId: string) => {
    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('notices')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', noticeId);
          break;

        case 'reject':
          await supabase
            .from('notices')
            .update({
              status: 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', noticeId);
          break;

        case 'delete':
          setConfirmModal({ isOpen: true, noticeId });
          return; // Don't refresh notices list until confirmation
      }

      fetchNotices(); // Refresh the list
    } catch (error) {
      console.error('Action failed:', error);
      setAlertModal({
        isOpen: true,
        title: 'Action Failed',
        message: 'Failed to perform action. Please try again.',
        variant: 'error',
      });
    }
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!confirmModal.noticeId) return;

    try {
      await supabase
        .from('notices')
        .delete()
        .eq('id', confirmModal.noticeId);

      setConfirmModal({ isOpen: false, noticeId: null });
      fetchNotices(); // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error);
      setConfirmModal({ isOpen: false, noticeId: null });
      setAlertModal({
        isOpen: true,
        title: 'Delete Failed',
        message: 'Failed to delete notice. Please try again.',
        variant: 'error',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <AlertTriangle className="w-3 h-3" />
            Pending
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Published
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-slate-600">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded w-80 mt-2 animate-pulse" />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 bg-gray-100 rounded-lg w-64 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-lg w-36 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-lg w-36 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-lg w-32 ml-auto animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <NoticeTableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Notice Management</h1>
        <div className="text-sm text-slate-600">
          {filteredNotices.length} notices
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="notice-search" className="sr-only">Search notices</label>
            <div className="relative">
              <Search className={UI.inputIconLeft} />
              <input
                id="notice-search"
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${UI.inputWithIconLeft}`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <label htmlFor="notice-status-filter" className="sr-only">Filter by status</label>
            <select
              id="notice-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={UI.selectBase}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className={UI.selectChevron} />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <label htmlFor="notice-type-filter" className="sr-only">Filter by type</label>
            <select
              id="notice-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={UI.selectBase}
            >
              <option value="all">All Types</option>
              <option value="premises-licence">Premises Licence</option>
              <option value="variation">Variation</option>
              <option value="review">Review</option>
              <option value="minor-variation">Minor Variation</option>
              <option value="club-premises-certificate">Club Premises</option>
            </select>
            <ChevronDown className={UI.selectChevron} />
          </div>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Notice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-600">
                    No notices found
                  </td>
                </tr>
              ) : (
                filteredNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {notice.title || 'Untitled Notice'}
                        </div>
                        <div className="text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {notice.premises_address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {notice.applicant_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="capitalize">
                        {notice.notice_type?.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(notice.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {notice.organization?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notice.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedNotice(notice);
                            setShowDetailModal(true);
                          }}
                          className="text-slate-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {notice.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleNoticeAction('approve', notice.id)}
                              className="text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleNoticeAction('reject', notice.id)}
                              className="text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
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
      {showDetailModal && selectedNotice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <XCircle className="h-6 w-6" />
              </button>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Notice Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">Title</label>
                    <p className="text-gray-900">{selectedNotice.title || 'Untitled'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedNotice.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Applicant</label>
                    <p className="text-gray-900">{selectedNotice.applicant_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Notice Type</label>
                    <p className="text-gray-900 capitalize">
                      {selectedNotice.notice_type?.replace(/-/g, ' ')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-slate-600">Premises Address</label>
                    <p className="text-gray-900">{selectedNotice.premises_address}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Organization</label>
                    <p className="text-gray-900">{selectedNotice.organization?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Created Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedNotice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedNotice.published_at && (
                    <div>
                      <label className="text-sm text-slate-600">Published Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedNotice.published_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedNotice.expires_at && (
                    <div>
                      <label className="text-sm text-slate-600">Expiry Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedNotice.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {selectedNotice.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleNoticeAction('approve', selectedNotice.id);
                        setShowDetailModal(false);
                      }}
                      className={UI.btnSuccess}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleNoticeAction('reject', selectedNotice.id);
                        setShowDetailModal(false);
                      }}
                      className={UI.btnDanger}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, noticeId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}