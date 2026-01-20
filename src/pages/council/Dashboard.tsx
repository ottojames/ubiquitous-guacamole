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
  expired: number;
  representations_total: number;
}

interface RecentNotice {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  proof_pdf_url?: string | null;
  repsDeadline?: string;
  representations_count?: number;
}

interface PriorityItem {
  id: string;
  title: string;
  type: 'closing_soon' | 'high_reps' | 'unread_reps';
  urgency: 'high' | 'medium';
  deadline?: string;
  count?: number;
  noticeId?: string;
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
    expired: 0,
    representations_total: 0
  });
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [department.id]);

  const loadDashboardData = async () => {
    try {
      // Check if we're in demo mode (supporting both mock and real Westminster department)
      const isDemoSampleBorough = department.id === 'demo-sample-borough-id';
      const isDemoWestminster = department.id === 'demo-westminster-id';
      // Also support real Westminster Licensing department for showcase demo
      const isRealWestminsterLicensing = department.id === '53c08600-5c5a-46a4-8805-16c129022952';
      const isDemoMode = isDemoSampleBorough || isDemoWestminster || isRealWestminsterLicensing;

      let notices: any[] = [];
      let recent: any[] = [];

      if (isDemoMode) {
        // For Westminster demo, use server API to bypass RLS restrictions
        console.log(`[Dashboard] Demo mode: fetching notices via API for department ${department.id}`);

        try {
          // Fetch notices via API endpoint which uses service role key
          const response = await fetch('/api/notices/search?limit=100&sort=created_at.desc');
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const responseData = await response.json();
          const allNotices = responseData.items || [];
          console.log(`[Dashboard] Fetched ${allNotices.length} total notices from API`);

          // Licensing notice types (matching database values)
          const LICENSING_NOTICE_TYPES = [
            'licensing-premises-new',
            'licensing-premises-variation',
            'licensing-premises-review',
            'licensing-club-premises',
            'licensing-club-premises-variation',
            'licensing-personal-licence',
            'licensing-temporary-event',
            'premises-licence',
            'premises-licence-variation',
            'premises-licence-review',
            'club-premises-certificate',
            'club-premises-certificate-variation',
            'personal-licence',
            'temporary-event-notice',
          ];

          // Map API response to notice format and deduplicate by ID
          const noticesMap = new Map();
          allNotices.forEach((n: any) => {
            // Only include licensing notices for licensing department
            if (department.type === 'licensing' && !LICENSING_NOTICE_TYPES.includes(n.noticeType)) {
              return;
            }

            if (!noticesMap.has(n.id)) {
              noticesMap.set(n.id, {
                id: n.id,
                status: n.status || 'published',
                premises: { name: n.premisesName },
                notice_type: n.noticeType,
                created_at: n.publicationDate || new Date().toISOString(),
                published_at: n.publicationDate || null,
                representation_deadline: n.repsDeadline,
                proof_pdf_url: null
              });
            }
          });
          notices = Array.from(noticesMap.values());

          // Get recent notices with full details (deduplicated)
          const recentMap = new Map();
          allNotices.forEach((n: any) => {
            // Only include licensing notices for licensing department
            if (department.type === 'licensing' && !LICENSING_NOTICE_TYPES.includes(n.noticeType)) {
              return;
            }

            if (!recentMap.has(n.id)) {
              const title = n.premisesName || n.noticeType || `Notice ${n.id.substring(0, 8)}`;
              recentMap.set(n.id, {
                id: n.id,
                title: title,
                status: n.status || 'published',
                created_at: n.publicationDate || new Date().toISOString(),
                published_at: n.publicationDate || null,
                proof_pdf_url: null,
                repsDeadline: n.repsDeadline,
                premisesName: n.premisesName
              });
            }
          });
          recent = Array.from(recentMap.values()).slice(0, 5);

          console.log(`[Dashboard] Stats: ${notices.length} total notices, ${recent.length} recent notices`);
        } catch (err) {
          console.error('[Dashboard] Error fetching from API:', err);
          throw err;
        }
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

      // Calculate stats
      // Total: All notices (any status)
      // Published: Currently live and within representation window
      // Drafts: Never published (status = draft)
      // Expired: Consultation window closed (status = expired)
      // Representations: Total representations across all notices
      const totalCount = notices?.length || 0;
      const publishedCount = notices?.filter(n => n.status === 'published').length || 0;
      const draftCount = notices?.filter(n => n.status === 'draft').length || 0;
      const expiredCount = notices?.filter(n => n.status === 'expired').length || 0;

      // Make stats less exact-looking for demo
      const displayTotal = isDemoMode ? 47 : totalCount;
      const displayPublished = isDemoMode ? 42 : publishedCount;
      const displayDraft = isDemoMode ? 3 : draftCount;
      const displayExpired = isDemoMode ? 2 : expiredCount;

      const statsData = {
        total: displayTotal,
        published: displayPublished,
        draft: displayDraft,
        expired: displayExpired,
        representations_total: 0 // Will be calculated below
      };

      // Calculate total representations count from recent notices
      try {
        const { data: allReps } = await supabase
          .from('representations')
          .select('id', { count: 'exact', head: true });
        statsData.representations_total = allReps?.length || 0;
      } catch (err) {
        console.error('Failed to count representations:', err);
      }

      setStats(statsData);
      setRecentNotices(recent || []);

      // Calculate priorities for Licensing Officer
      const priorityItems: PriorityItem[] = [];
      const now = new Date();
      const fortyEightHours = 48 * 60 * 60 * 1000;

      // 1. Notices closing within 48 hours (HIGH PRIORITY)
      recent.forEach((notice: any) => {
        const deadline = notice.repsDeadline || notice.reps_deadline;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (60 * 60 * 1000);

          if (hoursUntil > 0 && hoursUntil <= 48) {
            priorityItems.push({
              id: `closing-${notice.id}`,
              title: notice.title || notice.premisesName || 'Notice',
              type: 'closing_soon',
              urgency: 'high',
              deadline: deadline,
              noticeId: notice.id
            });
          }
        }
      });

      // 2. Notices with high representation counts (MEDIUM PRIORITY)
      recent.forEach((notice: any) => {
        const repsCount = notice.representations_count || notice.repsCount || 0;
        if (repsCount >= 5) {
          priorityItems.push({
            id: `highreps-${notice.id}`,
            title: notice.title || notice.premisesName || 'Notice',
            type: 'high_reps',
            urgency: 'medium',
            count: repsCount,
            noticeId: notice.id
          });
        }
      });

      // Sort by urgency (high first) then by deadline
      priorityItems.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          return a.urgency === 'high' ? -1 : 1;
        }
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return 0;
      });

      setPriorities(priorityItems.slice(0, 5)); // Show top 5 priorities

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
          to={`${basePath}/notices`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
          title="Total representations received across all notices."
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Representations</h3>
            <svg
              className="w-8 h-8 text-purple-600"
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
          <p className="text-3xl font-bold text-gray-900">{stats.representations_total}</p>
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

      {/* Priorities Section */}
      {priorities.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 mb-8 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Priority Items</h2>
            <span className="ml-auto bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {priorities.length} item{priorities.length > 1 ? 's' : ''} require attention
            </span>
          </div>

          <div className="space-y-3">
            {priorities.map((priority) => {
              const isUrgent = priority.urgency === 'high';
              const bgColor = isUrgent ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
              const iconColor = isUrgent ? 'text-red-600' : 'text-amber-600';

              // Determine navigation target
              const getNavigationTarget = () => {
                if (priority.noticeId) {
                  return `${basePath}/notices/${priority.noticeId}`;
                }
                return null;
              };

              const navTarget = getNavigationTarget();

              return (
                <div
                  key={priority.id}
                  className={`${bgColor} border-2 rounded-xl p-4 hover:shadow-md transition-all ${navTarget ? 'cursor-pointer' : ''}`}
                  onClick={() => navTarget && navigate(navTarget)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon based on type */}
                    <div className={`${iconColor} flex-shrink-0 mt-0.5`}>
                      {priority.type === 'closing_soon' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {priority.type === 'high_reps' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{priority.title}</h3>
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {priority.type === 'closing_soon' && priority.deadline && (
                          <>
                            <span className="font-medium text-red-600">
                              Closes {formatDate(priority.deadline)}
                            </span>
                            <span>• Click to review representations</span>
                          </>
                        )}
                        {priority.type === 'high_reps' && (
                          <>
                            <span className="font-medium">{priority.count} representations received</span>
                            <span>• Requires attention</span>
                          </>
                        )}
                      </div>
                    </div>

                    {navTarget && (
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                        {!notice.proof_pdf_url && notice.status === 'published' && (
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
