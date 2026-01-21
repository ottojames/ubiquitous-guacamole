import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Shield,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  AlertCircle,
  ChevronDown,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email: string;
  admin_role: string;
  action: string;
  action_category: string;
  target_type: string;
  target_id: string | null;
  target_identifier: string | null;
  old_values: any;
  new_values: any;
  reason: string | null;
  ip_address: string;
  user_agent: string | null;
  session_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export default function AuditLog() {
  const { user: adminUser } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  const fetchLogs = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (isLoadingMore.current && append) return;

    try {
      if (append) {
        isLoadingMore.current = true;
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/admin/audit?' + new URLSearchParams({
        page: pageNum.toString(),
        limit: '50',
        dateFrom,
        dateTo,
        adminUser: selectedAdmin,
        category: selectedCategory,
        severity: selectedSeverity,
        targetType: selectedTargetType,
        search: searchTerm
      }), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (append) {
          setLogs(prev => [...prev, ...data.logs]);
        } else {
          setLogs(data.logs);
        }

        setTotalPages(data.totalPages);
        setHasMore(pageNum < data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [dateFrom, dateTo, selectedAdmin, selectedCategory, selectedSeverity, selectedTargetType, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore.current) {
          fetchLogs(page + 1, true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, fetchLogs]);

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit/export?' + new URLSearchParams({
        dateFrom,
        dateTo,
        adminUser: selectedAdmin,
        category: selectedCategory,
        severity: selectedSeverity,
        targetType: selectedTargetType,
        search: searchTerm
      }), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 ">
                Audit Log
              </h1>
              <p className="text-sm text-gray-600 ">
                Track all administrative actions and changes
              </p>
            </div>
          </div>

          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white  rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            />
          </div>

          {/* Admin User */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              Admin User
            </label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            >
              <option value="">All Users</option>
              {/* Admin users would be populated from API */}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            >
              <option value="">All Categories</option>
              <option value="account_management">Account Management</option>
              <option value="notice_moderation">Notice Moderation</option>
              <option value="user_management">User Management</option>
              <option value="system_config">System Config</option>
              <option value="security">Security</option>
              <option value="billing">Billing</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">
              Target Type
            </label>
            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            >
              <option value="">All Types</option>
              <option value="organization">Organization</option>
              <option value="department">Department</option>
              <option value="user">User</option>
              <option value="notice">Notice</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <label htmlFor="audit-search" className="sr-only">Search audit logs</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              id="audit-search"
              type="text"
              placeholder="Search by action, target, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  "
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white  rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50  border-b border-gray-200 ">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 ">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50  transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 ">
                      <div>
                        <div className="font-medium">
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-slate-600">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium text-gray-900 ">
                          {log.admin_email}
                        </div>
                        <div className="text-xs text-slate-600">
                          {log.admin_role}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 ">
                          {log.action}
                        </div>
                        <div className="text-xs text-slate-600">
                          {log.action_category.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.target_identifier ? (
                        <div>
                          <div className="font-medium text-gray-900 ">
                            {log.target_identifier}
                          </div>
                          <div className="text-xs text-slate-600">
                            {log.target_type}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        {getSeverityIcon(log.severity)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900  font-mono">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll target */}
        {hasMore && (
          <div ref={observerTarget} className="p-4 text-center text-slate-600">
            Loading more logs...
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white  rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white  border-b border-gray-200  p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 ">
                  Audit Log Details
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900  mb-3">
                  Basic Information
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Timestamp
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 ">
                      {format(new Date(selectedLog.created_at), 'PPpp')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Admin User
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 ">
                      {selectedLog.admin_email} ({selectedLog.admin_role})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Action
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 ">
                      {selectedLog.action}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 ">
                      {selectedLog.action_category.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Target
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 ">
                      {selectedLog.target_identifier || 'N/A'} ({selectedLog.target_type})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Severity
                    </dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadge(selectedLog.severity)}`}>
                        {getSeverityIcon(selectedLog.severity)}
                        {selectedLog.severity}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Reason */}
              {selectedLog.reason && (
                <div>
                  <h3 className="font-semibold text-gray-900  mb-3">
                    Reason
                  </h3>
                  <p className="text-sm text-gray-700  bg-gray-50  p-3 rounded-lg">
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {/* Changes */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div>
                  <h3 className="font-semibold text-gray-900  mb-3">
                    Changes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.old_values && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700  mb-2">
                          Old Values
                        </h4>
                        <pre className="text-xs bg-gray-50  p-3 rounded-lg overflow-auto">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_values && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700  mb-2">
                          New Values
                        </h4>
                        <pre className="text-xs bg-gray-50  p-3 rounded-lg overflow-auto">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div>
                <h3 className="font-semibold text-gray-900  mb-3">
                  Technical Details
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      IP Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900  font-mono">
                      {selectedLog.ip_address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-600">
                      Session ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900  font-mono text-xs">
                      {selectedLog.session_id || 'N/A'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-slate-600">
                      User Agent
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900  font-mono text-xs">
                      {selectedLog.user_agent || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}