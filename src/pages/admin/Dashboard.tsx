import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Server
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalCouncils: number;
  activeCouncils: number;
  totalFirms: number;
  totalNotices: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

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
  const { adminUser } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCouncils: 0,
    activeCouncils: 0,
    totalFirms: 0,
    totalNotices: 0,
    monthlyRevenue: 0,
    systemHealth: 'healthy'
  });
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics
      const [councilsRes, firmsRes, noticesRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, status', { count: 'exact' })
          .eq('type', 'council'),
        supabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('type', 'firm'),
        supabase
          .from('notices')
          .select('id', { count: 'exact' })
      ]);

      const totalCouncils = councilsRes.count || 0;
      const activeCouncils = councilsRes.data?.filter(c => c.status === 'active').length || 0;
      const totalFirms = firmsRes.count || 0;
      const totalNotices = noticesRes.count || 0;

      // Calculate monthly revenue (mock calculation - replace with actual billing data)
      const monthlyRevenue = (activeCouncils * 500) + (totalFirms * 1000);

      // Check system health (mock - replace with actual health checks)
      const systemHealth = 'healthy'; // Would check API health, database status, etc.

      setStats({
        totalCouncils,
        activeCouncils,
        totalFirms,
        totalNotices,
        monthlyRevenue,
        systemHealth
      });

      // Fetch recent admin actions
      const { data: actionsData } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (actionsData) {
        setRecentActions(actionsData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getHealthIcon = () => {
    switch (stats.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getHealthText = () => {
    switch (stats.systemHealth) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Experiencing degraded performance';
      case 'down':
        return 'System outage detected';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
        <span className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Councils</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCouncils}</p>
              <p className="text-sm text-green-600 mt-2">
                {stats.activeCouncils} active
              </p>
            </div>
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Law Firms</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFirms}</p>
              <p className="text-sm text-blue-600 mt-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +12% this month
              </p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Total Notices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalNotices}</p>
              <p className="text-sm text-gray-600 mt-2">
                Across all organizations
              </p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
              <p className="text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Projected
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
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
              <div className="p-6 text-center text-gray-500">
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
                        <p className="text-xs text-gray-500 mt-1">
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
                <span className="text-gray-900 font-medium">45ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database Load</span>
                <span className="text-gray-900 font-medium">12%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="text-gray-900 font-medium">99.98%</span>
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
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                View All Accounts
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                Check Audit Logs
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                System Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                Export Reports
              </button>
            </div>
          </div>

          {/* Alerts/Warnings */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Attention Required
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  3 accounts pending verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}