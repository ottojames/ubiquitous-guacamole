import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Shield,
  Server
} from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { CardSkeleton, ActivityFeedSkeleton } from '@/components/skeletons';
import { useAdminStats } from '@/hooks/useAdminStats';

interface RecentAction {
  id: string;
  admin_email: string;
  action: string;
  action_category: string;
  target_identifier: string;
  created_at: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function AdminDashboard() {
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();

  // Use the admin stats hook for real-time data
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();

  // Recent actions still fetched separately
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);

  useEffect(() => {
    fetchRecentActions();
    const interval = setInterval(fetchRecentActions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActions = async () => {
    try {
      const { data: actionsData } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (actionsData) {
        setRecentActions(actionsData);
      }
      setActionsLoading(false);
    } catch (err) {
      console.error('Error fetching recent actions:', err);
      setActionsLoading(false);
    }
  };

  // Combined loading state
  const loading = statsLoading || actionsLoading;
  const error = statsError?.message || null;

  const getHealthIcon = () => {
    switch (stats?.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthText = () => {
    switch (stats?.systemHealth) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Experiencing degraded performance';
      case 'down':
        return 'System outage detected';
      default:
        return 'Checking system status...';
    }
  };

  // Render the growth indicator for firms
  const renderFirmGrowth = () => {
    const percent = stats?.firmGrowthPercent ?? 0;
    if (percent > 0) {
      return (
        <p className="text-sm text-green-600 mt-2">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          +{percent}% this month
        </p>
      );
    } else if (percent < 0) {
      return (
        <p className="text-sm text-red-600 mt-2">
          <TrendingDown className="w-4 h-4 inline mr-1" />
          {percent}% this month
        </p>
      );
    } else {
      return (
        <p className="text-sm text-gray-600 mt-2">
          <Minus className="w-4 h-4 inline mr-1" />
          No change this month
        </p>
      );
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-9 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-5 bg-gray-100 rounded w-32 animate-pulse" />
        </div>

        {/* Statistics cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <CardSkeleton count={5} />
        </div>

        {/* Activity feed and side panels skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity feed skeleton */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-44 animate-pulse" />
            </div>
            <div className="p-6">
              <ActivityFeedSkeleton count={6} />
            </div>
          </div>

          {/* Side panels skeleton */}
          <div className="space-y-6">
            {/* System health skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
              </div>
            </div>

            {/* Quick actions skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-28 mb-4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-sm text-slate-600">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Councils</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCouncils ?? 0}</p>
              <p className="text-sm text-green-600 mt-2">
                {stats?.activeCouncils ?? 0} active
              </p>
            </div>
            <Building2 className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Law Firms</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalFirms ?? 0}</p>
              {renderFirmGrowth()}
            </div>
            <Users className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Notices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalNotices ?? 0}</p>
              <p className="text-sm text-gray-600 mt-2">
                {stats?.noticesThisMonth ?? 0} this month
              </p>
            </div>
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalUsers ?? 0}</p>
              <p className="text-sm text-gray-600 mt-2">
                Registered accounts
              </p>
            </div>
            <Users className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.monthlyRevenue ?? 0)}
              </p>
              <p className="text-sm text-gray-600 mt-2" title={`Subscriptions: ${formatCurrency(stats?.firmSubscriptionRevenue ?? 0)} + Notices: ${formatCurrency(stats?.noticeRevenue ?? 0)}`}>
                Calculated from actual pricing
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Admin Activity
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {recentActions.length === 0 ? (
              <div className="p-6 text-center text-slate-600">
                No recent activity
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentActions.map((action) => (
                  <div key={action.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(action.severity)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{action.admin_email}</span>
                          {' '}
                          {action.action.replace('_', ' ')}
                          {action.target_identifier && (
                            <>
                              {' '}
                              <span className="text-gray-600">
                                {action.target_identifier}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {formatTimeAgo(action.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Server className="w-5 h-5" />
              System Health
            </h2>
            <div className="flex items-center gap-3">
              {getHealthIcon()}
              <span className="text-sm text-gray-700">{getHealthText()}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Response Time</span>
                <span className={`font-medium ${
                  (stats?.apiResponseTime ?? 0) < 200 ? 'text-green-600' :
                  (stats?.apiResponseTime ?? 0) < 500 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {stats?.apiResponseTime ?? '—'}ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database Load</span>
                <span className="text-gray-600 font-medium">
                  {stats?.databaseLoad !== null ? `${stats.databaseLoad}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="text-gray-600 font-medium">
                  {stats?.uptime !== null ? `${stats.uptime}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/accounts')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                View All Accounts
              </button>
              <button
                onClick={() => navigate('/admin/audit-log')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Check Audit Logs
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                System Settings
              </button>
              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Export Reports
              </button>
            </div>
          </div>

          {/* Alerts/Warnings */}
          {(stats?.pendingVerifications ?? 0) > 0 && (
            <button
              onClick={() => navigate('/admin/accounts?status=pending_verification')}
              className="w-full text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Attention Required
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {stats?.pendingVerifications} accounts pending verification
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}