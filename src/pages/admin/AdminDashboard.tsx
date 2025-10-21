import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface PlatformStats {
  totalOrganizations: number;
  totalCouncils: number;
  totalFirms: number;
  totalUsers: number;
  totalDepartments: number;
  totalSubmissions: number;
  totalPublishedNotices: number;
  totalRepresentations: number;
}

interface RecentActivity {
  type: 'organization' | 'submission' | 'publication' | 'user';
  title: string;
  description: string;
  timestamp: string;
  id: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    totalCouncils: 0,
    totalFirms: 0,
    totalUsers: 0,
    totalDepartments: 0,
    totalSubmissions: 0,
    totalPublishedNotices: 0,
    totalRepresentations: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all stats in parallel
      const [
        orgsResult,
        usersResult,
        deptsResult,
        submissionsResult,
        noticesResult,
        repsResult
      ] = await Promise.all([
        supabase.from('organizations').select('id, type', { count: 'exact', head: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('representations').select('id', { count: 'exact', head: true })
      ]);

      const orgs = orgsResult.data || [];
      const councils = orgs.filter(o => o.type === 'council').length;
      const firms = orgs.filter(o => o.type === 'law_firm').length;

      setStats({
        totalOrganizations: orgsResult.count || 0,
        totalCouncils: councils,
        totalFirms: firms,
        totalUsers: usersResult.count || 0,
        totalDepartments: deptsResult.count || 0,
        totalSubmissions: submissionsResult.count || 0,
        totalPublishedNotices: noticesResult.count || 0,
        totalRepresentations: repsResult.count || 0
      });

      // Load recent activity
      await loadRecentActivity();

      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Recent organizations
      const { data: recentOrgs } = await supabase
        .from('organizations')
        .select('id, name, type, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentOrgs?.forEach(org => {
        activities.push({
          type: 'organization',
          title: `New ${org.type === 'council' ? 'Council' : 'Law Firm'} Created`,
          description: org.name,
          timestamp: org.created_at,
          id: org.id
        });
      });

      // Recent submissions
      const { data: recentSubs } = await supabase
        .from('submissions')
        .select('id, title, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(3);

      recentSubs?.forEach(sub => {
        activities.push({
          type: 'submission',
          title: 'New Submission',
          description: sub.title,
          timestamp: sub.submitted_at,
          id: sub.id
        });
      });

      // Recent publications
      const { data: recentPubs } = await supabase
        .from('notices')
        .select('id, title, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      recentPubs?.forEach(pub => {
        activities.push({
          type: 'publication',
          title: 'Notice Published',
          description: pub.title,
          timestamp: pub.published_at,
          id: pub.id
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivity(activities.slice(0, 8));
    } catch (err) {
      console.error('Failed to load recent activity:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'submission':
        return 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4';
      case 'publication':
        return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
      case 'user':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'organization':
        return 'bg-blue-100 text-blue-600';
      case 'submission':
        return 'bg-yellow-100 text-yellow-600';
      case 'publication':
        return 'bg-green-100 text-green-600';
      case 'user':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-2">System-wide overview and statistics</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          to="/admin/organizations"
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</p>
          <p className="text-sm text-gray-600 mt-1">Total Organizations</p>
          <p className="text-xs text-gray-500 mt-2">{stats.totalCouncils} councils, {stats.totalFirms} firms</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-600 mt-1">Total Users</p>
          <p className="text-xs text-gray-500 mt-2">Across all organizations</p>
        </Link>

        <Link
          to="/admin/submissions"
          className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
          <p className="text-sm text-gray-600 mt-1">Total Submissions</p>
          <p className="text-xs text-gray-500 mt-2">{stats.totalPublishedNotices} published</p>
        </Link>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalRepresentations}</p>
          <p className="text-sm text-gray-600 mt-1">Total Representations</p>
          <p className="text-xs text-gray-500 mt-2">Public feedback received</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Organization Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Councils</span>
              <span className="font-semibold text-gray-900">{stats.totalCouncils}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Law Firms</span>
              <span className="font-semibold text-gray-900">{stats.totalFirms}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Departments</span>
              <span className="font-semibold text-gray-900">{stats.totalDepartments}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Workflow Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Submissions</span>
              <span className="font-semibold text-gray-900">{stats.totalSubmissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Published Notices</span>
              <span className="font-semibold text-gray-900">{stats.totalPublishedNotices}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Representations</span>
              <span className="font-semibold text-gray-900">{stats.totalRepresentations}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to="/admin/organizations"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-colors"
            >
              Create Organization
            </Link>
            <Link
              to="/admin/users"
              className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-xl font-semibold transition-colors"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/analytics"
              className="block px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-xl font-semibold transition-colors"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d={getActivityIcon(activity.type)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
