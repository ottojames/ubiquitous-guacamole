import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
}

interface SubmissionTrend {
  date: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface NoticeTypeStats {
  type: string;
  count: number;
  avg_review_time: number;
}

export default function Analytics() {
  const { department } = useOutletContext<{ department: Department }>();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [submissionTrend, setSubmissionTrend] = useState<SubmissionTrend[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [noticeTypeStats, setNoticeTypeStats] = useState<NoticeTypeStats[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [approvalRate, setApprovalRate] = useState(0);
  const [avgReviewTime, setAvgReviewTime] = useState(0);

  useEffect(() => {
    loadAnalyticsData();
  }, [department.id, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const rangeDate = new Date();
      if (timeRange === '7d') rangeDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') rangeDate.setDate(now.getDate() - 30);
      else rangeDate.setDate(now.getDate() - 90);

      // Load all submissions in range
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('id, notice_type, status, submitted_at, reviewed_at')
        .eq('receiving_department_id', department.id)
        .gte('submitted_at', rangeDate.toISOString())
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      setTotalSubmissions(submissions?.length || 0);

      // Calculate approval rate
      const reviewed = submissions?.filter((s) => s.status === 'approved' || s.status === 'rejected') || [];
      const approved = submissions?.filter((s) => s.status === 'approved') || [];
      setApprovalRate(reviewed.length > 0 ? Math.round((approved.length / reviewed.length) * 100) : 0);

      // Calculate avg review time
      const reviewedWithTime = submissions?.filter((s) => s.reviewed_at) || [];
      const totalTime = reviewedWithTime.reduce((sum, s) => {
        const days = Math.floor(
          (new Date(s.reviewed_at!).getTime() - new Date(s.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      setAvgReviewTime(reviewedWithTime.length > 0 ? Math.round(totalTime / reviewedWithTime.length) : 0);

      // Build submission trend (daily)
      const trendMap = new Map<string, number>();
      submissions?.forEach((s) => {
        const date = new Date(s.submitted_at).toISOString().split('T')[0];
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setSubmissionTrend(trend);

      // Status breakdown
      const statusMap = new Map<string, number>();
      submissions?.forEach((s) => {
        statusMap.set(s.status, (statusMap.get(s.status) || 0) + 1);
      });

      const breakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / (submissions?.length || 1)) * 100)
      }));
      breakdown.sort((a, b) => b.count - a.count);
      setStatusBreakdown(breakdown);

      // Notice type stats
      const typeMap = new Map<string, { count: number; total_time: number; reviewed: number }>();
      submissions?.forEach((s) => {
        const existing = typeMap.get(s.notice_type) || { count: 0, total_time: 0, reviewed: 0 };
        existing.count++;

        if (s.reviewed_at) {
          const days = Math.floor(
            (new Date(s.reviewed_at).getTime() - new Date(s.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          existing.total_time += days;
          existing.reviewed++;
        }

        typeMap.set(s.notice_type, existing);
      });

      const typeStats = Array.from(typeMap.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        avg_review_time: stats.reviewed > 0 ? Math.round(stats.total_time / stats.reviewed) : 0
      }));
      typeStats.sort((a, b) => b.count - a.count);
      setNoticeTypeStats(typeStats);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'new':
      case 'in_review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'published': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'changes_requested': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Pending Review';
      case 'in_review': return 'Under Review';
      case 'changes_requested': return 'Changes Requested';
      default: return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxTrendCount = Math.max(...submissionTrend.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Submission trends and insights</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Total Submissions</p>
          <p className="text-4xl font-bold">{totalSubmissions}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Approval Rate</p>
          <p className="text-4xl font-bold">{approvalRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Avg Review Time</p>
          <p className="text-4xl font-bold">{avgReviewTime}</p>
          <p className="text-sm opacity-90">days</p>
        </div>
      </div>

      {/* Submission Trend */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Submission Trend</h2>

        {submissionTrend.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No submissions in this time period</div>
        ) : (
          <div className="space-y-2">
            {submissionTrend.map((item) => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600 flex-shrink-0">{formatDate(item.date)}</div>
                <div className="flex-1 relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-lg flex items-center px-3 transition-all"
                    style={{ width: `${(item.count / maxTrendCount) * 100}%`, minWidth: '40px' }}
                  >
                    <span className="text-white text-sm font-semibold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Status Breakdown</h2>

        <div className="space-y-4">
          {statusBreakdown.map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{getStatusLabel(item.status)}</span>
                <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${getStatusColor(item.status)} h-3 rounded-full transition-all`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notice Type Stats */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Notice Type Performance</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notice Type</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg Review Time</th>
              </tr>
            </thead>
            <tbody>
              {noticeTypeStats.map((item) => (
                <tr key={item.type} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {item.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">{item.count}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-600">
                    {item.avg_review_time > 0 ? `${item.avg_review_time} days` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
