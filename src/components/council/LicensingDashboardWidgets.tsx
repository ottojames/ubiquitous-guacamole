import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Clock, AlertCircle, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface LicensingDashboardWidgetsProps {
  departmentId: string;
}

interface LicensingStats {
  totalApplications: number;
  pendingReview: number;
  closingSoon: number;
  representationsReceived: number;
  approvedThisMonth: number;
  reviewDeadlinesThisWeek: number;
}

interface UpcomingDeadline {
  id: string;
  noticeType: string;
  premisesName: string;
  deadline: string;
  daysRemaining: number;
}

interface ApplicationBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export default function LicensingDashboardWidgets({ departmentId }: LicensingDashboardWidgetsProps) {
  const [stats, setStats] = useState<LicensingStats>({
    totalApplications: 0,
    pendingReview: 0,
    closingSoon: 0,
    representationsReceived: 0,
    approvedThisMonth: 0,
    reviewDeadlinesThisWeek: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [applicationBreakdown, setApplicationBreakdown] = useState<ApplicationBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicensingData();
  }, [departmentId]);

  const loadLicensingData = async () => {
    try {
      setLoading(true);

      // Fetch all licensing notices for this department
      const { data: notices, error } = await supabase
        .from('notices')
        .select('*')
        .eq('department_id', departmentId)
        .in('notice_type', [
          'premises-licence',
          'premises-licence-variation',
          'premises-licence-transfer',
          'premises-licence-review',
          'club-premises-certificate',
          'temporary-event-notice'
        ]);

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const oneWeekFromNow = addDays(now, 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let pendingCount = 0;
      let closingSoonCount = 0;
      let repsCount = 0;
      let approvedCount = 0;
      let deadlinesThisWeek = 0;
      const typeBreakdown: Record<string, number> = {};
      const deadlines: UpcomingDeadline[] = [];

      (notices || []).forEach(notice => {
        // Count by type for breakdown
        const type = notice.notice_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

        // Count pending review
        if (notice.status === 'pending_approval' || notice.status === 'draft') {
          pendingCount++;
        }

        // Count approved this month
        if (notice.status === 'published' && new Date(notice.published_at) >= startOfMonth) {
          approvedCount++;
        }

        // Check deadlines
        if (notice.deadline_date) {
          const deadline = new Date(notice.deadline_date);
          const daysLeft = differenceInDays(deadline, now);

          // Closing soon (within 7 days)
          if (daysLeft > 0 && daysLeft <= 7) {
            closingSoonCount++;
            deadlinesThisWeek++;

            // Add to upcoming deadlines list
            if (deadlines.length < 5) {
              deadlines.push({
                id: notice.id,
                noticeType: type,
                premisesName: notice.premises?.name || notice.location_name || 'Unknown premises',
                deadline: notice.deadline_date,
                daysRemaining: daysLeft
              });
            }
          }
        }

        // Count representations (simplified - in real app would query representations table)
        if (notice.extras?.representations_count) {
          repsCount += notice.extras.representations_count;
        }
      });

      // Sort deadlines by days remaining
      deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Calculate breakdown percentages
      const total = notices?.length || 1;
      const breakdown = Object.entries(typeBreakdown).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100)
      }));

      setStats({
        totalApplications: notices?.length || 0,
        pendingReview: pendingCount,
        closingSoon: closingSoonCount,
        representationsReceived: repsCount,
        approvedThisMonth: approvedCount,
        reviewDeadlinesThisWeek: deadlinesThisWeek
      });

      setUpcomingDeadlines(deadlines);
      setApplicationBreakdown(breakdown);
    } catch (error) {
      console.error('Failed to load licensing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Applications */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplications}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingReview}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Closing Soon */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closing Soon</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.closingSoon}</p>
              <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Representations */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Representations</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.representationsReceived}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Approved This Month */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved (Month)</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.approvedThisMonth}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Review Deadlines */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Review Deadlines</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.reviewDeadlinesThisWeek}</p>
              <p className="text-xs text-gray-500 mt-1">This week</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeadlines.map(deadline => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{deadline.premisesName}</p>
                    <p className="text-xs text-gray-500">{deadline.noticeType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(deadline.deadline), 'dd MMM')}
                    </p>
                    <p className={`text-xs font-semibold ${
                      deadline.daysRemaining <= 3 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {deadline.daysRemaining} day{deadline.daysRemaining !== 1 ? 's' : ''} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming deadlines in the next 7 days</p>
          )}
        </div>

        {/* Application Type Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Types</h3>
          {applicationBreakdown.length > 0 ? (
            <div className="space-y-3">
              {applicationBreakdown.map(item => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.percentage}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No applications to display</p>
          )}
        </div>
      </div>
    </div>
  );
}