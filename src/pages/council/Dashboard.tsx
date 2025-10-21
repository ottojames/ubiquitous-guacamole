import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
  pending_submissions: number;
  in_review: number;
  active_publications: number;
  new_representations: number;
  total_submissions: number;
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'representation' | 'publication';
  title: string;
  status?: string;
  submitted_at?: string;
  published_at?: string;
  respondent_name?: string;
}

export default function Dashboard() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pending_submissions: 0,
    in_review: 0,
    active_publications: 0,
    new_representations: 0,
    total_submissions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [department.id]);

  const loadDashboardData = async () => {
    try {
      // Load submission stats
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id, status, submitted_at, title')
        .eq('receiving_department_id', department.id);

      if (submissionsError) throw submissionsError;

      // Load publication stats
      const { data: publications, error: publicationsError } = await supabase
        .from('notices')
        .select('id, status, published_at, title')
        .eq('department_id', department.id)
        .eq('status', 'published');

      if (publicationsError) throw publicationsError;

      // Load representation stats
      const { data: representations, error: repsError } = await supabase
        .from('representations')
        .select('id, status, submitted_at, respondent_name, notice_id')
        .eq('department_id', department.id);

      if (repsError) throw repsError;

      const statsData = {
        pending_submissions: submissions?.filter(s => s.status === 'new').length || 0,
        in_review: submissions?.filter(s => s.status === 'in_review').length || 0,
        active_publications: publications?.length || 0,
        new_representations: representations?.filter(r => r.status === 'new').length || 0,
        total_submissions: submissions?.length || 0
      };

      setStats(statsData);

      // Build recent activity feed
      const activity: RecentActivity[] = [];

      // Add recent submissions
      submissions?.slice(0, 3).forEach(sub => {
        activity.push({
          id: sub.id,
          type: 'submission',
          title: sub.title,
          status: sub.status,
          submitted_at: sub.submitted_at
        });
      });

      // Add recent publications
      publications?.slice(0, 2).forEach(pub => {
        activity.push({
          id: pub.id,
          type: 'publication',
          title: pub.title,
          published_at: pub.published_at
        });
      });

      // Add recent representations
      representations?.slice(0, 2).forEach(rep => {
        activity.push({
          id: rep.id,
          type: 'representation',
          title: `New response from ${rep.respondent_name}`,
          submitted_at: rep.submitted_at,
          respondent_name: rep.respondent_name
        });
      });

      // Sort by date and take top 5
      activity.sort((a, b) => {
        const dateA = new Date(a.submitted_at || a.published_at || '');
        const dateB = new Date(b.submitted_at || b.published_at || '');
        return dateB.getTime() - dateA.getTime();
      });

      setRecentActivity(activity.slice(0, 5));
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
          <h1 className="text-3xl font-bold text-gray-900">Licensing Officer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {department.name} - Overview of submissions, publications, and representations
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to={`${basePath}/submissions`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending Submissions</h3>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending_submissions}</p>
          <p className="text-xs text-gray-500 mt-1">New submissions awaiting review</p>
        </Link>

        <Link
          to={`${basePath}/submissions`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">In Review</h3>
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.in_review}</p>
          <p className="text-xs text-gray-500 mt-1">Currently being reviewed</p>
        </Link>

        <Link
          to={`${basePath}/publications`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Publications</h3>
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.active_publications}</p>
          <p className="text-xs text-gray-500 mt-1">Currently live notices</p>
        </Link>

        <Link
          to={`${basePath}/representations`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">New Responses</h3>
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.new_representations}</p>
          <p className="text-xs text-gray-500 mt-1">Public responses to review</p>
        </Link>

        <Link
          to={`${basePath}/submissions`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Submissions</h3>
            <svg
              className="w-8 h-8 text-gray-600"
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
          <p className="text-3xl font-bold text-gray-900">{stats.total_submissions}</p>
          <p className="text-xs text-gray-500 mt-1">All time submissions</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>

        {recentActivity.length === 0 ? (
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
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const getActivityIcon = () => {
                if (activity.type === 'submission') {
                  return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  );
                } else if (activity.type === 'publication') {
                  return (
                    <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  );
                } else {
                  return (
                    <svg className="w-5 h-5 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  );
                }
              };

              const getActivityBg = () => {
                if (activity.type === 'submission') return 'bg-blue-50';
                if (activity.type === 'publication') return 'bg-green-50';
                return 'bg-purple-50';
              };

              return (
                <div key={activity.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${getActivityBg()} flex items-center justify-center flex-shrink-0`}>
                      {getActivityIcon()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {activity.type === 'submission' && activity.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold mr-2 ${getStatusColor(activity.status)}`}>
                            {formatStatus(activity.status)}
                          </span>
                        )}
                        {activity.submitted_at && formatDate(activity.submitted_at)}
                        {activity.published_at && formatDate(activity.published_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to={`${basePath}/submissions`}
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
              <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Review Submissions
          </h3>
          <p className="text-sm text-gray-600">
            Approve or reject incoming applications
          </p>
        </Link>

        <Link
          to={`${basePath}/publications`}
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
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Publications
          </h3>
          <p className="text-sm text-gray-600">
            View and manage live notices
          </p>
        </Link>

        <Link
          to={`${basePath}/representations`}
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
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Public Responses
          </h3>
          <p className="text-sm text-gray-600">
            Review community representations
          </p>
        </Link>

        <Link
          to={`${basePath}/team`}
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-orange-600"
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
            Team Management
          </h3>
          <p className="text-sm text-gray-600">
            Manage licensing officers
          </p>
        </Link>
      </div>
    </div>
  );
}
