import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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

interface AnalyticsData {
  totalNotices: number;
  publishedNotices: number;
  draftNotices: number;
  totalRepresentations: number;
  avgResponseTime: number;
  noticesByType: { type: string; count: number }[];
  noticesByMonth: { month: string; count: number }[];
  representationsByStatus: { status: string; count: number }[];
  topVenues: { venue: string; count: number }[];
  recentActivity: {
    date: string;
    action: string;
    user: string;
    details: string;
  }[];
}

export default function Analytics() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  useEffect(() => {
    loadAnalytics();
  }, [department.id, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // TODO: In production, these would be actual database queries
      // For now, using mock data for demonstration

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock analytics data
      const mockData: AnalyticsData = {
        totalNotices: 245,
        publishedNotices: 189,
        draftNotices: 56,
        totalRepresentations: 1342,
        avgResponseTime: 4.2, // days
        noticesByType: [
          { type: 'Premises Licence', count: 98 },
          { type: 'Variation', count: 67 },
          { type: 'Planning Application', count: 45 },
          { type: 'Traffic Order', count: 23 },
          { type: 'Review', count: 12 },
        ],
        noticesByMonth: [
          { month: 'Jan', count: 18 },
          { month: 'Feb', count: 22 },
          { month: 'Mar', count: 25 },
          { month: 'Apr', count: 31 },
          { month: 'May', count: 28 },
          { month: 'Jun', count: 35 },
          { month: 'Jul', count: 29 },
          { month: 'Aug', count: 24 },
          { month: 'Sep', count: 33 },
        ],
        representationsByStatus: [
          { status: 'Pending Review', count: 423 },
          { status: 'Under Consideration', count: 312 },
          { status: 'Accepted', count: 456 },
          { status: 'Rejected', count: 151 },
        ],
        topVenues: [
          { venue: 'The Rose & Crown', count: 8 },
          { venue: 'City Center Plaza', count: 6 },
          { venue: 'Green Park Hotel', count: 5 },
          { venue: 'Main Street Bar', count: 4 },
          { venue: 'The Royal Oak', count: 4 },
        ],
        recentActivity: [
          { date: '2 hours ago', action: 'Published', user: 'Sarah M.', details: 'Premises licence application' },
          { date: '5 hours ago', action: 'Created', user: 'James K.', details: 'Traffic order draft' },
          { date: '1 day ago', action: 'Updated', user: 'Emma R.', details: 'Planning application details' },
          { date: '2 days ago', action: 'Published', user: 'David L.', details: 'Variation application' },
          { date: '3 days ago', action: 'Created', user: 'Lisa P.', details: 'New premises licence' },
        ],
      };

      setAnalytics(mockData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    if (exportFormat === 'csv') {
      // Generate CSV
      const csvContent = [
        'Metric,Value',
        `Total Notices,${analytics.totalNotices}`,
        `Published Notices,${analytics.publishedNotices}`,
        `Draft Notices,${analytics.draftNotices}`,
        `Total Representations,${analytics.totalRepresentations}`,
        `Average Response Time (days),${analytics.avgResponseTime}`,
        '',
        'Notice Type,Count',
        ...analytics.noticesByType.map(item => `${item.type},${item.count}`),
        '',
        'Month,Notices Published',
        ...analytics.noticesByMonth.map(item => `${item.month},${item.count}`),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${department.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF export would use a library like jsPDF
      alert('PDF export coming soon! Use CSV export for now.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    );
  }

  const maxNoticeCount = Math.max(...analytics.noticesByMonth.map(m => m.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Usage insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              onClick={handleExport}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Notices</p>
            <svg className="w-8 h-8 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalNotices}</p>
          <p className="text-xs text-green-600 mt-2">↑ 12% from last period</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Published</p>
            <svg className="w-8 h-8 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.publishedNotices}</p>
          <p className="text-xs text-gray-600 mt-2">{Math.round((analytics.publishedNotices / analytics.totalNotices) * 100)}% of total</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Drafts</p>
            <svg className="w-8 h-8 text-yellow-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.draftNotices}</p>
          <p className="text-xs text-gray-600 mt-2">{Math.round((analytics.draftNotices / analytics.totalNotices) * 100)}% of total</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Representations</p>
            <svg className="w-8 h-8 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalRepresentations}</p>
          <p className="text-xs text-green-600 mt-2">↑ 8% engagement</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Response</p>
            <svg className="w-8 h-8 text-orange-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.avgResponseTime} <span className="text-base font-normal text-gray-600">days</span></p>
          <p className="text-xs text-green-600 mt-2">↓ 0.5 days faster</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices by Month Chart */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notices Published by Month</h2>
          <div className="space-y-3">
            {analytics.noticesByMonth.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.month}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(item.count / maxNoticeCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notices by Type */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notices by Type</h2>
          <div className="space-y-4">
            {analytics.noticesByType.map((item, index) => {
              const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600'];
              const percentage = Math.round((item.count / analytics.totalNotices) * 100);

              return (
                <div key={item.type} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.type}</span>
                      <span className="text-sm text-gray-600">{percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">{item.count} notices</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Representations by Status */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Representations by Status</h2>
          <div className="space-y-3">
            {analytics.representationsByStatus.map((item) => {
              const percentage = Math.round((item.count / analytics.totalRepresentations) * 100);
              const colorMap: Record<string, string> = {
                'Pending Review': 'bg-yellow-500',
                'Under Consideration': 'bg-blue-500',
                'Accepted': 'bg-green-500',
                'Rejected': 'bg-red-500',
              };

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colorMap[item.status]} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Venues */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Venues by Notices</h2>
          <div className="space-y-3">
            {analytics.topVenues.map((item, index) => (
              <div key={item.venue} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.venue}</span>
                </div>
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-900">
                  {item.count} notices
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{activity.user}</span>
                  <span className="text-sm text-gray-600">{activity.date}</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-blue-600">{activity.action}</span> {activity.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
