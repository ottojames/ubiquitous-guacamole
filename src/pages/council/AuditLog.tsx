import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

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

interface AuditLogEntry {
  id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  action_category: string;
  old_values: any;
  new_values: any;
  user_id: string;
  user_email: string;
  created_at: string;
  severity: string;
  metadata: any;
}

type FilterAction = 'all' | 'notice' | 'template' | 'team' | 'department' | 'representation';
type FilterTable = 'all' | 'notice' | 'template' | 'department_membership' | 'organization';

export default function AuditLog() {
  const { department, userRole } = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState<FilterAction>('all');
  const [filterTable, setFilterTable] = useState<FilterTable>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState('30'); // days
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [premisesNames, setPremisesNames] = useState<Record<string, string>>({});
  const logsPerPage = 20;

  // Look up premises names for notice/representation resource_ids
  const loadPremisesNames = useCallback(async (logEntries: AuditLogEntry[]) => {
    const noticeIds = logEntries
      .filter(log => log.resource_type === 'notice' && log.resource_id)
      .map(log => log.resource_id);

    const representationIds = logEntries
      .filter(log => log.resource_type === 'representation' && log.resource_id)
      .map(log => log.resource_id);

    const names: Record<string, string> = {};

    // Fetch notice premises names
    if (noticeIds.length > 0) {
      const { data: notices } = await supabase
        .from('notices')
        .select('id, title')
        .in('id', noticeIds);

      notices?.forEach(notice => {
        names[notice.id] = notice.title || 'Untitled Notice';
      });
    }

    // Fetch representation premises names via notice join
    if (representationIds.length > 0) {
      const { data: representations } = await supabase
        .from('representations')
        .select('id, notices(title)')
        .in('id', representationIds);

      representations?.forEach((rep: any) => {
        const noticeTitle = Array.isArray(rep.notices) ? rep.notices[0]?.title : rep.notices?.title;
        names[rep.id] = noticeTitle || 'Unknown Premises';
      });
    }

    setPremisesNames(prev => ({ ...prev, ...names }));
  }, []);

  // Transform action codes to plain English
  const formatActionText = (action: string): string => {
    const actionMap: Record<string, string> = {
      'representation_note_added': 'Added internal note',
      'representation.note_added': 'Added internal note',
      'notice.created': 'Notice submitted',
      'notice.published': 'Notice published',
      'notice.status_changed': 'Status changed',
      'notice.updated': 'Notice updated',
      'notice.deleted': 'Notice deleted',
      'representation.created': 'Representation submitted',
      'representation.updated': 'Representation updated',
      'representation.status_changed': 'Representation status changed',
      'template.created': 'Template created',
      'template.updated': 'Template updated',
      'team.member_added': 'Team member added',
      'team.member_removed': 'Team member removed',
      'team.role_changed': 'Team member role changed',
      'settings.updated': 'Settings updated',
    };

    // Check for exact match first
    if (actionMap[action]) return actionMap[action];

    // Try with underscores replaced by dots
    const withDots = action.replace(/_/g, '.');
    if (actionMap[withDots]) return actionMap[withDots];

    // Fallback: format the action nicely
    return action
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Extract display name from email
  const formatUserName = (email: string | null, userId: string | null): string => {
    if (!email) {
      return userId ? `User ${userId.slice(0, 8)}` : 'System';
    }
    // Extract name part before @
    const namePart = email.split('@')[0];
    // Convert to title case and replace dots/underscores with spaces
    return namePart
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Format timestamp with relative time for recent, friendly for older
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const daysDiff = differenceInDays(new Date(), date);

    if (daysDiff < 7) {
      // Recent: use relative time
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      // Older: use friendly format
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Format View Details content in human-readable way
  const formatDetailsContent = (log: AuditLogEntry): { key: string; value: string }[] => {
    const details: { key: string; value: string }[] = [];

    // Add premises name if available
    if (premisesNames[log.resource_id]) {
      details.push({ key: 'Premises', value: premisesNames[log.resource_id] });
    }

    // Add action taken
    details.push({ key: 'Action', value: formatActionText(log.action) });

    // Add user
    details.push({ key: 'User', value: formatUserName(log.user_email, log.user_id) });

    // Add timestamp
    details.push({ key: 'Time', value: formatRelativeTime(log.created_at) });

    // Add notes from metadata if available
    if (log.metadata?.comment_preview) {
      details.push({ key: 'Note', value: log.metadata.comment_preview });
    } else if (log.metadata?.note) {
      details.push({ key: 'Note', value: log.metadata.note });
    } else if (log.metadata?.comment) {
      details.push({ key: 'Note', value: log.metadata.comment });
    }

    // Add key changes from new_values
    if (log.new_values) {
      if (log.new_values.status) {
        details.push({ key: 'New Status', value: log.new_values.status });
      }
      if (log.new_values.title) {
        details.push({ key: 'Title', value: log.new_values.title });
      }
    }

    return details;
  };

  // P1-007: Load from unified_audit_logs view which combines both audit tables
  // Fallback to audit_logs if view doesn't exist yet
  const loadAuditLogs = useCallback(async () => {
    try {
      // Try unified view first
      let { data, error } = await supabase
        .from('unified_audit_logs')
        .select('*')
        .or(`department_id.eq.${department.id},organization_id.eq.${department.organization.id}`)
        .order('created_at', { ascending: false })
        .limit(500);

      // Fallback to audit_logs if unified view doesn't exist
      if (error?.code === '42P01') {
        // Query by department_id OR organization_id to catch entries where department_id is NULL
        const result = await supabase
          .from('audit_logs')
          .select('*')
          .or(`department_id.eq.${department.id},organization_id.eq.${department.organization.id}`)
          .order('created_at', { ascending: false })
          .limit(500);
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      const logData = data || [];
      setLogs(logData);
      // Load premises names for notices and representations
      if (logData.length > 0) {
        loadPremisesNames(logData);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLoading(false);
    }
  }, [department.id, department.organization.id, loadPremisesNames]);

  const filterLogs = useCallback(() => {
    let filtered = logs;

    // Filter by action category
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action_category === filterAction);
    }

    // Filter by resource type
    if (filterTable !== 'all') {
      filtered = filtered.filter(log => log.resource_type === filterTable);
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
          if (logDate > endDateTime) return false;
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        (log.resource_type || '').toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        (log.resource_id || '').toLowerCase().includes(query) ||
        (log.user_email || '').toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
    setPage(1); // Reset to first page when filters change
  }, [logs, filterAction, filterTable, searchQuery, startDate, endDate]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const handleExportCSV = () => {
    try {
      setExporting(true);

      // Prepare CSV headers
      const headers = ['Date/Time', 'Action', 'Category', 'Resource Type', 'Resource ID', 'User Email', 'Severity', 'Old Values', 'New Values', 'Metadata'];

      // Prepare CSV rows
      const rows = filteredLogs.map(log => [
        formatDate(log.created_at),
        log.action,
        log.action_category,
        log.resource_type || '',
        log.resource_id || '',
        log.user_email || '',
        log.severity,
        log.old_values ? JSON.stringify(log.old_values) : '',
        log.new_values ? JSON.stringify(log.new_values) : '',
        log.metadata ? JSON.stringify(log.metadata) : ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${department.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      setExporting(false);
      alert('Failed to export audit log');
    }
  };

  const handleQuickDateRange = (days: string) => {
    setDateRange(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const getActionColor = (action: string, severity: string) => {
    // Color by severity first
    if (severity === 'critical') return 'bg-red-100 text-red-800';
    if (severity === 'warning') return 'bg-amber-100 text-amber-800';

    // Then by action type
    if (action.includes('created') || action.includes('added')) return 'bg-green-100 text-green-800';
    if (action.includes('updated') || action.includes('changed')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted') || action.includes('removed')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('created') || action.includes('added')) {
      return (
        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (action.includes('updated') || action.includes('changed')) {
      return (
        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    if (action.includes('deleted') || action.includes('removed')) {
      return (
        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    }
    // Default icon for other actions
    return (
      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatTableName = (resourceType: string) => {
    if (!resourceType) return '';
    return resourceType.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // P0-002: All staff can view audit logs (compliance requirement)
  const canViewAudit = userRole !== null;

  if (!canViewAudit) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to view audit logs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">
            Track all changes made in {department.name}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || filteredLogs.length === 0}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Category Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as FilterAction)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="notice">Notice</option>
            <option value="template">Template</option>
            <option value="team">Team</option>
            <option value="department">Department</option>
            <option value="representation">Representation</option>
          </select>

          {/* Resource Type Filter */}
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value as FilterTable)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Resources</option>
            <option value="notice">Notices</option>
            <option value="template">Templates</option>
            <option value="department_membership">Team Members</option>
            <option value="organization">Organization</option>
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDateRange('7')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                dateRange === '7' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => handleQuickDateRange('30')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                dateRange === '30' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => handleQuickDateRange('90')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                dateRange === '90' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 90 days
            </button>
          </div>

          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{logs.length}</span> audit log entries
          </p>
        </div>
      </div>

      {/* Logs */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600">
            {searchQuery || filterAction !== 'all' || filterTable !== 'all'
              ? 'No audit logs match your filters'
              : 'No audit logs yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors">
                  {/* Main row: [User Name] • [Notice/Premises] • [Action] • [Time] */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
                    {/* User Name */}
                    <span className="font-semibold text-gray-900">
                      {formatUserName(log.user_email, log.user_id)}
                    </span>
                    <span className="text-gray-400">•</span>

                    {/* Notice/Premises Name */}
                    <span className="font-medium text-gray-800">
                      {(log.resource_type === 'notice' || log.resource_type === 'representation') && premisesNames[log.resource_id]
                        ? premisesNames[log.resource_id]
                        : formatTableName(log.resource_type || 'System')}
                    </span>
                    <span className="text-gray-400">•</span>

                    {/* Action */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getActionColor(log.action, log.severity)}`}>
                      {getActionIcon(log.action)}
                      {formatActionText(log.action)}
                    </span>
                    <span className="text-gray-400">•</span>

                    {/* Time: exact + relative */}
                    <span className="text-gray-600 text-xs">
                      {formatDate(log.created_at)}
                      <span className="text-gray-400 ml-1">({formatRelativeTime(log.created_at)})</span>
                    </span>

                    {/* Severity badge if not info */}
                    {log.severity !== 'info' && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        log.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.severity}
                      </span>
                    )}
                  </div>

                  {/* Notes/comments shown below in subtle gray text */}
                  {(log.metadata?.comment_preview || log.metadata?.note || log.metadata?.comment) && (
                    <p className="mt-2 text-sm text-gray-500 italic pl-0">
                      "{log.metadata.comment_preview || log.metadata.note || log.metadata.comment}"
                    </p>
                  )}

                  {/* View Details accordion */}
                  {(log.new_values || log.old_values || log.metadata) && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                        View Details
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                        <div className="space-y-1">
                          {formatDetailsContent(log).map((item, idx) => (
                            <div key={idx} className="flex">
                              <span className="text-xs font-semibold text-gray-700 w-24">{item.key}:</span>
                              <span className="text-xs text-gray-600 flex-1">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
