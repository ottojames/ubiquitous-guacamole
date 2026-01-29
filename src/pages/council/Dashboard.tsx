import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getDepartmentConfig, DashboardMetricConfig, DashboardMetricType } from '@/config/departmentConfig';
import { isClosingSoon } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { PERMISSIONS } from '@/types/permissions';
import { CardSkeleton, RecentNoticesSkeleton } from '@/components/skeletons';
import LicensingDashboardWidgets from '@/components/council/LicensingDashboardWidgets';

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
  closing_soon: number;
  pending_decision: number;
  awaiting_response: number;
}

interface RecentNotice {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  proof_pdf_url?: string | null;
  repsDeadline?: string;
  reps_deadline?: string;
  representations_count?: number;
  // Alternative property names for different data sources
  notice_type?: string;
  noticeType?: string;
  publicationDate?: string;
  premises_name?: string;
  premisesName?: string;
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
    representations_total: 0,
    closing_soon: 0,
    pending_decision: 0,
    awaiting_response: 0
  });
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [department.id]);

  const loadDashboardData = async () => {
    try {
      console.log('[Dashboard] Loading data for department:', {
        id: department.id,
        name: department.name,
        type: department.type,
        orgId: department.organization?.id
      });

      let notices: any[] = [];
      let recent: any[] = [];

      // Always query by department_id - enforcing department isolation
      const { data: noticesData, error: noticesError } = await supabase
        .from('notices')
        .select('id, status')
        .eq('department_id', department.id);

      console.log('[Dashboard] Notices query result:', {
        count: noticesData?.length || 0,
        error: noticesError?.message || null,
        departmentId: department.id
      });

      if (noticesError) throw noticesError;

      notices = noticesData || [];

      // Load recent notices
      const { data: recentData, error: recentError } = await supabase
        .from('notices')
        .select('id, title, status, created_at, published_at, proof_pdf_url')
        .eq('department_id', department.id)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('[Dashboard] Recent notices result:', {
        count: recentData?.length || 0,
        error: recentError?.message || null
      });

      if (recentError) throw recentError;

      recent = recentData || [];

      // Calculate stats
      // Total: All notices (any status)
      // Published: Currently live and within representation window
      // Drafts: Never published (status = draft)
      // Expired: Consultation window closed (status = expired)
      // Representations: Total representations across all notices
      // Closing soon: Notices with deadline within 48 hours
      // Pending decision: Notices awaiting determination (Planning)
      // Awaiting response: Representations without officer response (Licensing)
      const totalCount = notices?.length || 0;
      const publishedCount = notices?.filter(n => n.status === 'published').length || 0;
      const draftCount = notices?.filter(n => n.status === 'draft').length || 0;
      const expiredCount = notices?.filter(n => n.status === 'expired').length || 0;
      const pendingDecisionCount = notices?.filter(n => n.status === 'pending_decision').length || 0;

      // Fetch notices with reps_deadline for closing_soon calculation
      const now = new Date();
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const { data: closingSoonData } = await supabase
        .from('notices')
        .select('id')
        .eq('department_id', department.id)
        .eq('status', 'published')
        .gte('reps_deadline', now.toISOString())
        .lte('reps_deadline', fortyEightHoursFromNow.toISOString());
      const closingSoonCount = closingSoonData?.length || 0;

      const statsData: Stats = {
        total: totalCount,
        published: publishedCount,
        draft: draftCount,
        expired: expiredCount,
        representations_total: 0, // Will be calculated below
        closing_soon: closingSoonCount,
        pending_decision: pendingDecisionCount,
        awaiting_response: 0 // Will be calculated below
      };

      // Calculate total representations count for this department's notices only
      try {
        const { count: repsCount } = await supabase
          .from('representations')
          .select('*, notices!inner(department_id)', { count: 'exact', head: true })
          .eq('notices.department_id', department.id);
        statsData.representations_total = repsCount || 0;

        // Calculate awaiting response (representations without officer response)
        const { count: awaitingCount } = await supabase
          .from('representations')
          .select('*, notices!inner(department_id)', { count: 'exact', head: true })
          .eq('notices.department_id', department.id)
          .is('officer_response', null);
        statsData.awaiting_response = awaitingCount || 0;
      } catch (err) {
        console.error('Failed to count representations:', err);
      }

      setStats(statsData);
      setRecentNotices(recent || []);

      // Calculate priorities for Licensing Officer
      const priorityItems: PriorityItem[] = [];
      // Reuse 'now' from closing_soon calculation above
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

  // Helper to get icon SVG for metric
  const getMetricIcon = (icon: DashboardMetricConfig['icon'], color: DashboardMetricConfig['color']) => {
    const colorClass = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      gray: 'text-gray-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      amber: 'text-amber-600',
      rose: 'text-rose-600'
    }[color];

    const paths: Record<DashboardMetricConfig['icon'], string> = {
      document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      alert: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      hourglass: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    };

    return (
      <svg
        className={`w-8 h-8 ${colorClass}`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d={paths[icon]} />
      </svg>
    );
  };

  // Helper to get metric value
  const getMetricValue = (type: DashboardMetricType): number => {
    const valueMap: Record<DashboardMetricType, number> = {
      total: stats.total,
      published: stats.published,
      draft: stats.draft,
      expired: stats.expired,
      representations: stats.representations_total,
      closing_soon: stats.closing_soon,
      pending_decision: stats.pending_decision,
      awaiting_response: stats.awaiting_response
    };
    return valueMap[type];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
            <div className="h-5 bg-gray-100 rounded w-56 animate-pulse" />
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-40 animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <CardSkeleton count={5} />
        </div>

        {/* Recent notices skeleton */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          <RecentNoticesSkeleton count={5} />
        </div>

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton count={3} />
        </div>
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

      {/* Stats Grid - For licensing departments, use the richer LicensingDashboardWidgets */}
      {department.type === 'licensing' ? (
        <LicensingDashboardWidgets departmentId={department.id} />
      ) : (
        /* Stats Grid - Dynamic based on department type */
        /* Using static grid classes since Tailwind JIT can't detect dynamic class names */
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
          deptConfig.dashboardMetrics.length === 4 ? 'lg:grid-cols-4' :
          deptConfig.dashboardMetrics.length === 5 ? 'lg:grid-cols-5' :
          'lg:grid-cols-5'
        }`}>
          {deptConfig.dashboardMetrics.map((metric) => (
            <Link
              key={metric.type}
              to={`${basePath}/notices${metric.linkFilter || ''}`}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              title={metric.tooltip}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
                {getMetricIcon(metric.icon, metric.color)}
              </div>
              <p className="text-3xl font-bold text-gray-900">{getMetricValue(metric.type)}</p>
            </Link>
          ))}
        </div>
      )}

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          to={`${basePath}/audit`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Audit Log
          </h3>
          <p className="text-sm text-gray-600">
            View all department activity and compliance records.
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
