import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getDepartmentConfig } from '@/config/departmentConfig';
import { isClosingSoon } from '@/lib/dateUtils';

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
}

type FilterStatus = 'all' | 'draft' | 'pending_approval' | 'published' | 'expired';

export default function Notices() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if we're in demo mode
  const isDemoMode = orgSlug === 'sample-borough' || orgSlug === 'westminster';
  const isDemoSampleBorough = orgSlug === 'sample-borough';

  // Read status from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['draft', 'pending', 'published', 'expired'].includes(statusParam)) {
      setFilterStatus(statusParam === 'pending' ? 'pending_approval' : statusParam as FilterStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    loadNotices();
  }, [department.id]);

  useEffect(() => {
    filterNotices();
  }, [notices, filterStatus, searchQuery]);

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
        const transformedNotices = allNotices.map((n: any) => ({
          id: n.id,
          title: n.premisesName || n.title || 'Untitled Notice',
          notice_type: n.noticeType || 'Unknown',
          status: n.status || 'published',
          created_at: n.publicationDate || n.created_at,
          published_at: n.publicationDate || n.published_at,
          expires_at: null,
          representation_deadline: n.repsDeadline || null,
          proof_pdf_url: n.proof_pdf_url || null
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

        setNotices(data || []);
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

    setFilteredNotices(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
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

  // Get department-specific configuration
  const deptConfig = getDepartmentConfig(department.type);
  const canCreateNotice = deptConfig.canPublish && ['owner', 'org_admin', 'department_admin', 'editor'].includes(userRole);

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const statusCounts = {
    all: notices.length,
    draft: notices.filter(n => n.status === 'draft').length,
    pending_approval: notices.filter(n => n.status === 'pending_approval').length,
    published: notices.filter(n => n.status === 'published').length,
    expired: notices.filter(n => n.status === 'expired').length
  };

  // Filter out draft status for non-publishing departments
  const availableStatuses: FilterStatus[] = deptConfig.showDraftsCard
    ? ['all', 'draft', 'pending_approval', 'published', 'expired']
    : ['all', 'pending_approval', 'published', 'expired'];

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
        {canCreateNotice && (
          <Link
            to={`${basePath}/notices/new`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            + Create Notice
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col md:flex-row gap-4">
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
            <Link
              key={notice.id}
              to={`${basePath}/notices/${notice.id}`}
              className="block bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.01] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notice.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                      {formatStatus(notice.status)}
                    </span>
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

                    {!notice.proof_pdf_url && (notice.status === 'published' || notice.status === 'pending' || notice.status === 'pending_approval') && (
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
