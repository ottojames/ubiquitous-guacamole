import { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface Stats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  published: number;
  rejected: number;
  changes_requested: number;
}

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  receiving_department: {
    name: string;
    organization: {
      name: string;
    };
  };
}

export default function FirmDashboard() {
  const { organization } = useOutletContext<{ organization: Organization }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    changes_requested: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [organization.id]);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load all submissions for this organization
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          reviewed_at,
          receiving_department:receiving_department_id (
            name,
            organization:organization_id (
              name
            )
          )
        `)
        .eq('submitting_organization_id', organization.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const newStats: Stats = {
        total: submissions?.length || 0,
        draft: 0,
        pending: 0,
        approved: 0,
        published: 0,
        rejected: 0,
        changes_requested: 0
      };

      submissions?.forEach((sub) => {
        if (sub.status === 'draft') newStats.draft++;
        else if (sub.status === 'new' || sub.status === 'in_review') newStats.pending++;
        else if (sub.status === 'approved') newStats.approved++;
        else if (sub.status === 'published') newStats.published++;
        else if (sub.status === 'rejected') newStats.rejected++;
        else if (sub.status === 'changes_requested') newStats.changes_requested++;
      });

      setStats(newStats);
      setRecentSubmissions(submissions?.slice(0, 5) || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'new':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Pending Review';
      case 'in_review':
        return 'Under Review';
      case 'changes_requested':
        return 'Changes Requested';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your licensing applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`/f/${organization.slug}/submissions`}
          className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          to={`/f/${organization.slug}/submissions?status=pending`}
          className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          to={`/f/${organization.slug}/submissions?status=approved`}
          className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          to={`/f/${organization.slug}/submissions?status=changes_requested`}
          className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Changes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.changes_requested}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
          <Link
            to={`/f/${organization.slug}/submissions`}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All →
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-4">No submissions yet</p>
            <Link
              to={`/f/${organization.slug}/new-submission`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Submission
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/f/${organization.slug}/submissions/${submission.id}`}
                className="block p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                    {getStatusLabel(submission.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>To: {submission.receiving_department.organization.name} - {submission.receiving_department.name}</span>
                  <span>•</span>
                  <span>Submitted {formatDate(submission.submitted_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={`/f/${organization.slug}/new-submission`}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">New Submission</h3>
              <p className="text-sm text-white/80">Submit a licensing application</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/f/${organization.slug}/submissions`}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-6 text-white hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">View All Submissions</h3>
              <p className="text-sm text-white/80">Track your applications</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/f/${organization.slug}/team`}
          className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 text-white hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Manage Team</h3>
              <p className="text-sm text-white/80">Invite and manage users</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
