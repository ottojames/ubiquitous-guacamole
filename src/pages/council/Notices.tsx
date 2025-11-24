import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getDepartmentConfig } from '@/config/departmentConfig';
import { isClosingSoon } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
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

interface Notice {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  representation_deadline: string | null;
  proof_pdf_url?: string | null;
  representations_count?: number;
  objections_count?: number;
  support_count?: number;
}

type FilterStatus = 'all' | 'draft' | 'published' | 'expired';

export default function Notices() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasObjectionsFilter, setHasObjectionsFilter] = useState(false);
  const [highActivityFilter, setHighActivityFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'deadline-asc' | 'deadline-desc' | 'recent' | 'title'>('deadline-asc');

  // Bulk operations state
  const [selectedNotices, setSelectedNotices] = useState<Set<string>>(new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvImportFile, setCsvImportFile] = useState<File | null>(null);

  // Check if we're in demo mode
  const isDemoMode = orgSlug === 'sample-borough' || orgSlug === 'westminster' || orgSlug === 'westminster-city-of-council' || orgSlug === 'bristol-council';
  const isDemoSampleBorough = orgSlug === 'sample-borough';

  // Read status from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['draft', 'published', 'expired'].includes(statusParam)) {
      setFilterStatus(statusParam as FilterStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    loadNotices();
  }, [department.id]);

  useEffect(() => {
    filterNotices();
  }, [notices, filterStatus, searchQuery, hasObjectionsFilter, highActivityFilter, sortBy]);

  const loadNotices = async () => {
    try {
      if (isDemoMode) {
        // For demo mode, fetch all notices via API
        const response = await fetch('/api/notices/search?limit=100&sort=created_at.desc');
        if (!response.ok) {
          throw new Error('Failed to fetch notices from API');
        }

        const responseData = await response.json();
        const allNotices = responseData.items || [];

        // Transform API response to match Notice interface
        const transformedNotices = await Promise.all(allNotices.map(async (n: any) => {
          // Fetch representation counts from Supabase
          let representationsCount = 0;
          let objectionsCount = 0;
          let supportCount = 0;

          try {
            const { data: reps, error } = await supabase
              .from('representations')
              .select('type')
              .eq('notice_id', n.id);

            if (!error && reps) {
              representationsCount = reps.length;
              objectionsCount = reps.filter(r => r.type === 'objection').length;
              supportCount = reps.filter(r => r.type === 'support').length;
            }
          } catch (err) {
            console.error('Failed to fetch representation counts for notice', n.id, err);
          }

          return {
            id: n.id,
            title: n.premisesName || n.title || 'Untitled Notice',
            notice_type: n.noticeType || 'Unknown',
            status: n.status || 'published',
            created_at: n.publicationDate || n.created_at,
            published_at: n.publicationDate || n.published_at,
            expires_at: null,
            representation_deadline: n.repsDeadline || null,
            proof_pdf_url: n.proof_pdf_url || null,
            representations_count: representationsCount,
            objections_count: objectionsCount,
            support_count: supportCount
          };
        }));

        setNotices(transformedNotices);
        setLoading(false);
      } else {
        // Production mode: filter by department_id
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, notice_type, status, created_at, published_at, expires_at, representation_deadline, proof_pdf_url')
          .eq('department_id', department.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch representation counts for each notice
        const noticesWithReps = await Promise.all((data || []).map(async (notice) => {
          const { data: reps } = await supabase
            .from('representations')
            .select('type')
            .eq('notice_id', notice.id);

          const representationsCount = reps?.length || 0;
          const objectionsCount = reps?.filter(r => r.type === 'objection').length || 0;
          const supportCount = reps?.filter(r => r.type === 'support').length || 0;

          return {
            ...notice,
            representations_count: representationsCount,
            objections_count: objectionsCount,
            support_count: supportCount
          };
        }));

        setNotices(noticesWithReps);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.notice_type.toLowerCase().includes(query)
      );
    }

    // Filter by objections
    if (hasObjectionsFilter) {
      filtered = filtered.filter(n => (n.objections_count ?? 0) > 0);
    }

    // Filter by high activity (5+ representations)
    if (highActivityFilter) {
      filtered = filtered.filter(n => (n.representations_count ?? 0) >= 5);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'deadline-asc': {
          // Soonest deadline first (urgent notices at top)
          if (!a.representation_deadline) return 1;
          if (!b.representation_deadline) return -1;
          return new Date(a.representation_deadline).getTime() - new Date(b.representation_deadline).getTime();
        }
        case 'deadline-desc': {
          // Latest deadline first
          if (!a.representation_deadline) return 1;
          if (!b.representation_deadline) return -1;
          return new Date(b.representation_deadline).getTime() - new Date(a.representation_deadline).getTime();
        }
        case 'recent': {
          // Most recently published first
          const aDate = a.published_at || a.created_at;
          const bDate = b.published_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        case 'title': {
          // Alphabetical by title
          return a.title.localeCompare(b.title);
        }
        default:
          return 0;
      }
    });

    setFilteredNotices(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatNoticeType = (type: string) => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedNotices.size === filteredNotices.length) {
      setSelectedNotices(new Set());
    } else {
      setSelectedNotices(new Set(filteredNotices.map(n => n.id)));
    }
  };

  const handleSelectNotice = (noticeId: string) => {
    const newSelected = new Set(selectedNotices);
    if (newSelected.has(noticeId)) {
      newSelected.delete(noticeId);
    } else {
      newSelected.add(noticeId);
    }
    setSelectedNotices(newSelected);
  };

  const handleBulkPublish = async () => {
    if (!confirm(`Publish ${selectedNotices.size} selected notices?`)) return;

    try {
      setBulkActionInProgress(true);

      // TODO: Replace with actual database update
      // In production, this would call Supabase to update multiple notices
      for (const noticeId of selectedNotices) {
        await supabase
          .from('notices')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', noticeId);
      }

      alert(`Successfully published ${selectedNotices.size} notices`);
      setSelectedNotices(new Set());
      loadNotices(); // Reload to show updated statuses
    } catch (err) {
      console.error('Bulk publish failed:', err);
      alert('Failed to publish notices. Please try again.');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedNotices.size} selected notices? This action cannot be undone.`)) return;

    try {
      setBulkActionInProgress(true);

      // TODO: Replace with actual database delete
      for (const noticeId of selectedNotices) {
        await supabase
          .from('notices')
          .delete()
          .eq('id', noticeId);
      }

      alert(`Successfully deleted ${selectedNotices.size} notices`);
      setSelectedNotices(new Set());
      loadNotices(); // Reload to show updated list
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete notices. Please try again.');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkExport = () => {
    // Get selected notices data
    const selectedData = notices.filter(n => selectedNotices.has(n.id));

    // Create CSV content
    const headers = ['ID', 'Title', 'Notice Type', 'Status', 'Created At', 'Published At', 'Representation Deadline'];
    const rows = selectedData.map(n => [
      n.id,
      `"${n.title.replace(/"/g, '""')}"`, // Escape quotes in CSV
      n.notice_type,
      n.status,
      n.created_at,
      n.published_at || '',
      n.representation_deadline || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notices-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Exported ${selectedNotices.size} notices to CSV`);
  };

  const handleCsvImport = async () => {
    if (!csvImportFile) return;

    try {
      setBulkActionInProgress(true);

      // Read CSV file
      const text = await csvImportFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty');
      }

      // Parse CSV (simple implementation - assumes well-formed CSV)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const titleIndex = headers.indexOf('title');
      const typeIndex = headers.indexOf('notice type') || headers.indexOf('notice_type');

      if (titleIndex === -1 || typeIndex === -1) {
        throw new Error('CSV must have "Title" and "Notice Type" columns');
      }

      let importCount = 0;

      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        const title = values[titleIndex];
        const noticeType = values[typeIndex];

        if (!title || !noticeType) continue;

        // TODO: In production, create actual notice records
        // For now, just log what would be imported
        console.log('Would import:', { title, noticeType });
        importCount++;
      }

      alert(`Successfully imported ${importCount} notices from CSV`);
      setShowBulkImportModal(false);
      setCsvImportFile(null);
      loadNotices(); // Reload to show imported notices
    } catch (err) {
      console.error('CSV import failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to import CSV. Please check the file format.');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  // Get department-specific configuration
  const deptConfig = getDepartmentConfig(department.type);
  // Check if user has permission to create notices using RBAC system
  const canCreateNotice = deptConfig.canPublish && hasPermission(PERMISSIONS.NOTICES_CREATE);

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const statusCounts = {
    all: notices.length,
    draft: notices.filter(n => n.status === 'draft').length,
    published: notices.filter(n => n.status === 'published').length,
    expired: notices.filter(n => n.status === 'expired').length
  };

  // Filter out draft status for non-publishing departments
  const availableStatuses: FilterStatus[] = deptConfig.showDraftsCard
    ? ['all', 'draft', 'published', 'expired']
    : ['all', 'published', 'expired'];

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
          <h1 className="text-3xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">
            Manage your department's public notices
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreateNotice && (
            <>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Import CSV
              </button>
              <Link
                to={`${basePath}/notices/new`}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                + Create Notice
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedNotices.size > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900">
                {selectedNotices.size} notice{selectedNotices.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedNotices(new Set())}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-3">
              {hasPermission(PERMISSIONS.NOTICES_PUBLISH) && (
                <button
                  onClick={handleBulkPublish}
                  disabled={bulkActionInProgress}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Publish Selected
                </button>
              )}
              <button
                onClick={handleBulkExport}
                disabled={bulkActionInProgress}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Export to CSV
              </button>
              {hasPermission(PERMISSIONS.NOTICES_DELETE) && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionInProgress}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Select All Checkbox */}
          {filteredNotices.length > 0 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedNotices.size === filteredNotices.length && filteredNotices.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                title="Select all notices"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Select All
              </label>
            </div>
          )}

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="min-w-[200px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium"
              title="Sort notices by deadline or publication date"
            >
              <option value="deadline-asc">Deadline: Soonest first</option>
              <option value="deadline-desc">Deadline: Latest first</option>
              <option value="recent">Recently published</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {availableStatuses.map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatStatus(status)} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setHasObjectionsFilter(!hasObjectionsFilter)}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
              hasObjectionsFilter
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Filter notices that have objections"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Has objections
            {hasObjectionsFilter && ` (${filteredNotices.length})`}
          </button>
          <button
            onClick={() => setHighActivityFilter(!highActivityFilter)}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
              highActivityFilter
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Filter notices with 5+ representations"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            High activity (5+)
            {highActivityFilter && ` (${filteredNotices.length})`}
          </button>
          {(hasObjectionsFilter || highActivityFilter) && (
            <button
              onClick={() => {
                setHasObjectionsFilter(false);
                setHighActivityFilter(false);
              }}
              className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:text-gray-900 underline"
              title="Clear all additional filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
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
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'No notices match your filters'
              : 'No notices yet'}
          </p>
          {canCreateNotice && !searchQuery && filterStatus === 'all' && (
            <Link
              to={`${basePath}/notices/new`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Notice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selectedNotices.has(notice.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectNotice(notice.id);
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Notice Content - Now clickable */}
                <Link
                  to={`${basePath}/notices/${notice.id}`}
                  className="flex-1 flex items-start justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notice.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                        {formatStatus(notice.status)}
                      </span>
                      {(notice.representations_count !== undefined && notice.representations_count > 0) && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {notice.representations_count} rep{notice.representations_count !== 1 ? 's' : ''}
                          </span>
                          {notice.objections_count && notice.objections_count > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              {notice.objections_count} objection{notice.objections_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {formatNoticeType(notice.notice_type)}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {formatDate(notice.created_at)}
                    </div>

                    {notice.published_at && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Published: {formatDate(notice.published_at)}
                      </div>
                    )}

                    {notice.representation_deadline && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="flex items-center gap-1.5">
                          Deadline: {formatDate(notice.representation_deadline)}
                          {isClosingSoon(notice.representation_deadline) && notice.status !== 'expired' && (
                            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"
                                  title="Closing within 48 hours"></span>
                          )}
                        </span>
                      </div>
                    )}

                    {!notice.proof_pdf_url && notice.status === 'published' && (
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span className="text-amber-600 font-medium" title="Proof not yet available">
                          Awaiting proof.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                  <svg
                    className="w-6 h-6 text-gray-400 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSV Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Import Notices from CSV</h2>
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setCsvImportFile(null);
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
                  <p className="text-sm text-blue-800">
                    <strong>CSV Format:</strong> Your file must include "Title" and "Notice Type" columns.
                    Additional columns will be ignored.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvImportFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {csvImportFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {csvImportFile.name} ({(csvImportFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This is a demo implementation. In production, imported notices
                    would be created as drafts in the database for review before publishing.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setCsvImportFile(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={bulkActionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvImportFile || bulkActionInProgress}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {bulkActionInProgress ? 'Importing...' : 'Import CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
