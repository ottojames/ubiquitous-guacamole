import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
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

interface Stats {
  total: number;
  published: number;
  draft: number;
  pending_approval: number;
  expired: number;
}

interface RecentNotice {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  proof_pdf_url?: string | null;
}

export default function Dashboard() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    published: 0,
    draft: 0,
    pending_approval: 0,
    expired: 0
  });
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [department.id]);

  const loadDashboardData = async () => {
    try {
      // Check if we're in demo mode
      const isDemoSampleBorough = department.id === 'demo-sample-borough-id';
      const isDemoWestminster = department.id === 'demo-westminster-id';
      const isDemoMode = isDemoSampleBorough || isDemoWestminster;

      let notices: any[] = [];
      let recent: any[] = [];

      if (isDemoMode) {
        // For demo mode, fetch all notices via API
        // In a real system, notices would have a council_id field to filter by
        // For demo purposes, we show ALL notices as if they're all for this council
        const demoCouncilName = isDemoSampleBorough ? 'Sample Borough' : 'Westminster';

        console.log(`[Dashboard] Demo mode: fetching notices for ${demoCouncilName} Council`);

        // Fetch all notices from API (simulating all notices are for this council)
        const response = await fetch('/api/notices/search?limit=100&sort=created_at.desc');
        if (!response.ok) {
          throw new Error('Failed to fetch notices from API');
        }

        const responseData = await response.json();
        const allNotices = responseData.items || [];
        console.log(`[Dashboard] Fetched ${allNotices.length} total notices from API`);
        console.log(`[Dashboard] Sample notice data:`, allNotices[0]);

        // In production, this would filter by council_id or similar
        // For demo, we're showing all notices as if they're all for this council
        const filteredNotices = allNotices;
        console.log(`[Dashboard] Showing ${filteredNotices.length} notices for ${demoCouncilName} Council`);

        notices = filteredNotices.map((n: any) => ({
          id: n.id,
          status: n.status || 'published',
        }));

        recent = filteredNotices.slice(0, 5).map((n: any) => {
          // Build title from available data
          const title = n.premisesName || n.premisesAddress || n.noticeType || `Notice ${n.id.substring(0, 8)}`;

          return {
            id: n.id,
            title: title,
            status: n.status || 'published',
            created_at: n.publicationDate || new Date().toISOString(),
            published_at: n.publicationDate || null,
            proof_pdf_url: null,
          };
        });

        console.log(`[Dashboard] Stats: ${notices.length} total notices, ${recent.length} recent notices`);
      } else {
        // Normal mode - query by department_id
        const { data: noticesData, error: noticesError } = await supabase
          .from('notices')
          .select('id, status')
          .eq('department_id', department.id);

        if (noticesError) throw noticesError;

        notices = noticesData || [];

        // Load recent notices
        const { data: recentData, error: recentError } = await supabase
          .from('notices')
          .select('id, title, status, created_at, published_at, proof_pdf_url')
          .eq('department_id', department.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        recent = recentData || [];
      }

      // Calculate stats based on requirements:
      // Total: All notices (any status)
      // Published: Currently live and within representation window (status = published & not expired)
      // Drafts: Never published (status = draft)
      // Pending: Awaiting verification or scheduled (status = pending or pending_approval)
      // Expired: Consultation window closed (status = expired)
      const statsData = {
        total: notices?.length || 0,
        published: notices?.filter(n => n.status === 'published').length || 0,
        draft: notices?.filter(n => n.status === 'draft').length || 0,
        pending_approval: notices?.filter(n => n.status === 'pending_approval' || n.status === 'pending').length || 0,
        expired: notices?.filter(n => n.status === 'expired').length || 0
      };

      setStats(statsData);
      setRecentNotices(recent || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get department-specific configuration
  const deptConfig = getDepartmentConfig(department.type);
  // Check if user has permission to create notices using RBAC system
  const canCreateNotice = deptConfig.canPublish && hasPermission(PERMISSIONS.NOTICES_CREATE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to {department.name}
          </p>
        </div>
        {canCreateNotice && (
          <Link
            to={`${basePath}/notices/new`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            {deptConfig.publishButtonLabel}
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${deptConfig.showDraftsCard ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <Link
          to={`${basePath}/notices`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
          title="All notices for this department (any status)."
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Notices</h3>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </Link>

        <Link
          to={`${basePath}/notices?status=published`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
          title={`Currently live and open for ${deptConfig.repLabelPlural}.`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Published</h3>
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
        </Link>

        {deptConfig.showDraftsCard && (
          <Link
            to={`${basePath}/notices?status=draft`}
            className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
            title="Notices saved but not yet published."
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Drafts</h3>
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
          </Link>
        )}

        <Link
          to={`${basePath}/notices?status=pending`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
          title="Scheduled for publication or awaiting proof verification."
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending_approval}</p>
        </Link>

        <Link
          to={`${basePath}/notices?status=expired`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
          title="Consultation window has closed."
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Expired</h3>
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.expired}</p>
        </Link>
      </div>

      {/* Recent Notices */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Notices</h2>
          <Link
            to={`${basePath}/notices`}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            View All →
          </Link>
        </div>

        {recentNotices.length === 0 ? (
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
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-4">
              {deptConfig.emptyStateMessage}
            </p>
            {canCreateNotice && (
              <Link
                to={`${basePath}/notices/new`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {deptConfig.publishButtonLabel}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotices.map((notice) => {
              const noticeTypeLabel = notice.notice_type || notice.noticeType || 'Notice';
              const repsDeadline = notice.reps_deadline || notice.repsDeadline;
              const publishedDate = notice.published_at || notice.publicationDate;
              const repsCount = notice.representations_count || 0;

              return (
                <Link
                  key={notice.id}
                  to={`${basePath}/notices/${notice.id}`}
                  className="block p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notice.title || notice.premises_name || notice.premisesName || 'Untitled Notice'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                          {formatStatus(notice.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{noticeTypeLabel}</span>
                        {publishedDate && (
                          <>
                            <span>•</span>
                            <span>Published {formatDate(publishedDate)}</span>
                          </>
                        )}
                        {repsDeadline && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              Closes {formatDate(repsDeadline)}
                              {isClosingSoon(repsDeadline) && notice.status !== 'expired' && (
                                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" title="Closing within 48 hours"></span>
                              )}
                            </span>
                          </>
                        )}
                        {repsCount > 0 && (
                          <>
                            <span>•</span>
                            <span
                              className="font-semibold text-blue-600"
                              title={`This notice has ${repsCount} ${repsCount === 1 ? deptConfig.repLabel.toLowerCase() : deptConfig.repLabelPlural.toLowerCase()}`}
                            >
                              {deptConfig.repLabelPlural}: {repsCount}
                            </span>
                          </>
                        )}
                        {!notice.proof_pdf_url && (notice.status === 'published' || notice.status === 'pending' || notice.status === 'pending_approval') && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium" title="Proof not yet available">
                              Awaiting proof.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={`${basePath}/templates`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Templates
          </h3>
          <p className="text-sm text-gray-600">
            Configure notice formats, deadlines & fields per notice type.
          </p>
        </Link>

        <Link
          to={`${basePath}/team`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Team Members
          </h3>
          <p className="text-sm text-gray-600">
            Manage officers and permissions within this department.
          </p>
        </Link>

        <Link
          to={`${basePath}/settings`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Settings
          </h3>
          <p className="text-sm text-gray-600">
            Set department defaults, notifications & exports.
          </p>
        </Link>
      </div>
    </div>
  );
}
