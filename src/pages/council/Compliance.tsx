import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  slug: string;
}

interface SLAMetrics {
  total_submissions: number;
  within_sla: number;
  breached_sla: number;
  at_risk: number;
  average_review_time: number;
}

interface OverdueSubmission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string;
  days_overdue: number;
  submitter_name: string;
  organization_name: string;
}

interface TeamPerformance {
  user_email: string;
  reviewed_count: number;
  average_review_time: number;
  approval_rate: number;
}

export default function Compliance() {
  const { department } = useOutletContext<{ department: Department }>();
  const [loading, setLoading] = useState(true);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics>({
    total_submissions: 0,
    within_sla: 0,
    breached_sla: 0,
    at_risk: 0,
    average_review_time: 0
  });
  const [overdueSubmissions, setOverdueSubmissions] = useState<OverdueSubmission[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadComplianceData();
  }, [department.id, timeRange]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const rangeDate = new Date();
      if (timeRange === '7d') rangeDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') rangeDate.setDate(now.getDate() - 30);
      else rangeDate.setDate(now.getDate() - 90);

      // Load all submissions in date range
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          reviewed_at,
          assigned_to,
          submitter_name,
          organization:submitting_organization_id (
            name
          )
        `)
        .eq('receiving_department_id', department.id)
        .gte('submitted_at', rangeDate.toISOString())
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Calculate SLA metrics
      const metrics: SLAMetrics = {
        total_submissions: submissions?.length || 0,
        within_sla: 0,
        breached_sla: 0,
        at_risk: 0,
        average_review_time: 0
      };

      const overdue: OverdueSubmission[] = [];
      let totalReviewTime = 0;
      let reviewedCount = 0;

      submissions?.forEach((sub) => {
        const submittedDate = new Date(sub.submitted_at);
        const daysAgo = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate SLA status
        let slaLimit = 5; // Default for 'new' status
        if (sub.status === 'in_review') slaLimit = 10;

        if (sub.status === 'new' || sub.status === 'in_review') {
          if (daysAgo > slaLimit) {
            metrics.breached_sla++;
            overdue.push({
              id: sub.id,
              title: sub.title,
              notice_type: sub.notice_type,
              status: sub.status,
              submitted_at: sub.submitted_at,
              days_overdue: daysAgo - slaLimit,
              submitter_name: sub.submitter_name,
              organization_name: sub.organization?.name || 'Unknown'
            });
          } else if (daysAgo >= slaLimit - 2) {
            metrics.at_risk++;
          } else {
            metrics.within_sla++;
          }
        } else {
          // Completed submissions
          if (sub.reviewed_at) {
            const reviewTime = Math.floor(
              (new Date(sub.reviewed_at).getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (reviewTime <= slaLimit) {
              metrics.within_sla++;
            } else {
              metrics.breached_sla++;
            }
            totalReviewTime += reviewTime;
            reviewedCount++;
          }
        }
      });

      metrics.average_review_time = reviewedCount > 0 ? Math.round(totalReviewTime / reviewedCount) : 0;

      // Sort overdue by days overdue (most urgent first)
      overdue.sort((a, b) => b.days_overdue - a.days_overdue);

      // Calculate team performance
      const performanceMap = new Map<string, { reviewed: number; total_time: number; approved: number }>();

      submissions?.forEach((sub) => {
        if (sub.reviewed_at && sub.assigned_to) {
          // Get user email from assigned_to (in real app, would join with users table)
          const userKey = sub.assigned_to;

          const existing = performanceMap.get(userKey) || { reviewed: 0, total_time: 0, approved: 0 };
          existing.reviewed++;

          const reviewTime = Math.floor(
            (new Date(sub.reviewed_at).getTime() - new Date(sub.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          existing.total_time += reviewTime;

          if (sub.status === 'approved' || sub.status === 'published') {
            existing.approved++;
          }

          performanceMap.set(userKey, existing);
        }
      });

      const performance: TeamPerformance[] = Array.from(performanceMap.entries()).map(([userId, stats]) => ({
        user_email: userId, // In production, would resolve to actual email
        reviewed_count: stats.reviewed,
        average_review_time: Math.round(stats.total_time / stats.reviewed),
        approval_rate: Math.round((stats.approved / stats.reviewed) * 100)
      }));

      performance.sort((a, b) => b.reviewed_count - a.reviewed_count);

      setSlaMetrics(metrics);
      setOverdueSubmissions(overdue.slice(0, 10)); // Top 10 most overdue
      setTeamPerformance(performance);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
      setLoading(false);
    }
  };

  const getSLAComplianceRate = () => {
    const total = slaMetrics.within_sla + slaMetrics.breached_sla;
    if (total === 0) return 0;
    return Math.round((slaMetrics.within_sla / total) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const complianceRate = getSLAComplianceRate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">SLA tracking and performance metrics</p>
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

      {/* SLA Compliance Overview */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">SLA Compliance</h2>

        {/* Large Compliance Rate */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-2 ${
            complianceRate >= 90 ? 'text-green-600' :
            complianceRate >= 75 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {complianceRate}%
          </div>
          <p className="text-gray-600">Overall SLA Compliance Rate</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-2xl">
            <p className="text-sm text-green-700 font-semibold mb-1">Within SLA</p>
            <p className="text-3xl font-bold text-green-600">{slaMetrics.within_sla}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-2xl">
            <p className="text-sm text-yellow-700 font-semibold mb-1">At Risk</p>
            <p className="text-3xl font-bold text-yellow-600">{slaMetrics.at_risk}</p>
            <p className="text-xs text-yellow-600 mt-1">2 days to breach</p>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl">
            <p className="text-sm text-red-700 font-semibold mb-1">Breached</p>
            <p className="text-3xl font-bold text-red-600">{slaMetrics.breached_sla}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-700 font-semibold mb-1">Avg Review Time</p>
            <p className="text-3xl font-bold text-blue-600">{slaMetrics.average_review_time}</p>
            <p className="text-xs text-blue-600 mt-1">days</p>
          </div>
        </div>
      </div>

      {/* Overdue Submissions */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Overdue Submissions</h2>
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
            {overdueSubmissions.length} Urgent
          </span>
        </div>

        {overdueSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">All submissions within SLA - great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/c/${department.slug}/submissions/${submission.id}`}
                className="block p-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                    <p className="text-sm text-gray-600">
                      {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                      {submission.days_overdue} days overdue
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>From: {submission.organization_name}</span>
                  <span>•</span>
                  <span>Submitted: {formatDate(submission.submitted_at)}</span>
                  <span>•</span>
                  <span className="text-red-600 font-semibold">ACTION REQUIRED</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Team Performance</h2>

        {teamPerformance.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No reviews completed in this time period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Officer</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Reviewed</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg Time</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((member, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{member.user_email}</td>
                    <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900">
                      {member.reviewed_count}
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-600">
                      {member.average_review_time} days
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        member.approval_rate >= 80 ? 'bg-green-100 text-green-800' :
                        member.approval_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.approval_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
