import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InternalComments from '@/components/council/InternalComments';
import AssignRepresentationModal from '@/components/council/AssignRepresentationModal';
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Download,
  Filter,
  Calendar,
  User,
  FileText,
  UserPlus,
  CheckSquare,
  Square,
  CheckCircle
} from 'lucide-react';

interface Representation {
  id: string;
  notice_id: string;
  submitted_at: string;
  representor_name: string | null;
  representor_email: string | null;
  representation_text: string;
  type: 'support' | 'objection' | 'comment' | null;
  supporting_documents?: string[];
  is_anonymous: boolean;
  submitter_ip?: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  assigned_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  notice?: {
    id: string;
    application_type?: string;
    notice_type?: string;
    trading_name?: string;
    applicant?: string;
    premises?: any;
  };
}

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
  userName?: string;
  userId?: string;
}

export default function CouncilRepresentations() {
  const { orgSlug, deptSlug } = useParams();
  const context = useOutletContext<ContextType>();
  const department = context?.department;
  const userRole = context?.userRole || 'viewer';
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'support' | 'objection' | 'comment' | 'reviewed' | 'not_reviewed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRep, setSelectedRep] = useState<Representation | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningRep, setAssigningRep] = useState<Representation | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadRepresentations();
    loadCurrentUser();
  }, [orgSlug, deptSlug, filter]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.email || 'Unknown User');
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadRepresentations = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!department) {
        setError('Department not found');
        setLoading(false);
        return;
      }

      // Get all representations for this department's notices
      let query = supabase
        .from('representations')
        .select(`
          *,
          notices!inner (
            id,
            application_type,
            notice_type,
            trading_name,
            applicant,
            premises,
            department_id
          )
        `)
        .eq('notices.department_id', department.id)
        .order('submitted_at', { ascending: false });

      // Apply stance filter if not 'all'
      if (filter !== 'all' && filter !== 'unread' && filter !== 'reviewed' && filter !== 'not_reviewed') {
        query = query.eq('type', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setRepresentations(data || []);
    } catch (err) {
      console.error('Error loading representations:', err);
      setError('Failed to load representations');
    } finally {
      setLoading(false);
    }
  };

  const getStanceIcon = (type: string | null) => {
    switch (type) {
      case 'support':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'objection':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStanceLabel = (type: string | null) => {
    switch (type) {
      case 'support':
        return 'Support';
      case 'objection':
        return 'Objection';
      case 'comment':
        return 'Comment';
      default:
        return 'Unknown';
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Notice ID', 'Notice Type', 'Premises', 'Stance', 'Name', 'Email', 'Comment'],
      ...representations.map(rep => [
        new Date(rep.submitted_at).toLocaleDateString(),
        rep.notice_id,
        rep.notice?.application_type || rep.notice?.notice_type || '',
        rep.notice?.applicant || rep.notice?.trading_name || '',
        getStanceLabel(rep.type),
        rep.representor_name || 'Anonymous',
        rep.representor_email || '',
        rep.representation_text.replace(/"/g, '""') // Escape quotes
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `representations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportForIdox = () => {
    // Export only filtered representations for Idox with specific fields
    const dataToExport = filteredRepresentations;

    const csvContent = [
      // Idox-specific header fields
      ['Representation ID', 'Notice Reference', 'Submitter Name', 'Submitter Email', 'Stance', 'Representation Text', 'Date Submitted', 'Reviewed Status', 'Reviewed By', 'Reviewed Date', 'Assigned To', 'Application Type', 'Premises Name', 'Premises Address'],
      ...dataToExport.map(rep => [
        rep.id,
        rep.notice_id,
        rep.representor_name || 'Anonymous',
        rep.representor_email || '',
        getStanceLabel(rep.type),
        rep.representation_text.replace(/"/g, '""'), // Escape quotes for CSV
        new Date(rep.submitted_at).toISOString(),
        rep.reviewed_at ? 'Reviewed' : 'Not Reviewed',
        rep.reviewed_by_name || '',
        rep.reviewed_at ? new Date(rep.reviewed_at).toISOString() : '',
        rep.assigned_to_name || '',
        rep.notice?.application_type || rep.notice?.notice_type || '',
        rep.notice?.applicant || rep.notice?.trading_name || '',
        rep.notice?.premises ? JSON.stringify(rep.notice.premises) : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `idox-representations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRepresentations = representations.filter(rep => {
    // Apply filter type
    if (filter === 'support' && rep.type !== 'support') return false;
    if (filter === 'objection' && rep.type !== 'objection') return false;
    if (filter === 'comment' && rep.type !== 'comment') return false;
    if (filter === 'reviewed' && !rep.reviewed_at) return false;
    if (filter === 'not_reviewed' && rep.reviewed_at) return false;

    // Apply search term
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      rep.representation_text.toLowerCase().includes(searchLower) ||
      rep.representor_name?.toLowerCase().includes(searchLower) ||
      rep.representor_email?.toLowerCase().includes(searchLower) ||
      rep.notice?.applicant?.toLowerCase().includes(searchLower) ||
      rep.notice?.trading_name?.toLowerCase().includes(searchLower)
    );
  });

  const counts = {
    total: representations.length,
    support: representations.filter(r => r.type === 'support').length,
    objection: representations.filter(r => r.type === 'objection').length,
    comment: representations.filter(r => r.type === 'comment').length,
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRepresentations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRepresentations.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkMarkReviewed = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);

    try {
      const now = new Date().toISOString();
      const updatedReps = representations.map(rep => {
        if (selectedIds.has(rep.id) && !rep.reviewed_at) {
          return {
            ...rep,
            reviewed_at: now,
            reviewed_by: userId,
            reviewed_by_name: userName || 'Officer'
          };
        }
        return rep;
      });

      setRepresentations(updatedReps);
      setSelectedIds(new Set());
      // In a real implementation, would also update in database
      console.log(`Bulk marked ${selectedIds.size} representations as reviewed`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;

    const selectedReps = representations.filter(r => selectedIds.has(r.id));
    const csvContent = [
      ['Date', 'Notice ID', 'Notice Type', 'Premises', 'Stance', 'Name', 'Email', 'Comment'],
      ...selectedReps.map(rep => [
        new Date(rep.submitted_at).toLocaleDateString(),
        rep.notice_id,
        rep.notice?.application_type || rep.notice?.notice_type || '',
        rep.notice?.applicant || rep.notice?.trading_name || '',
        getStanceLabel(rep.type),
        rep.representor_name || 'Anonymous',
        rep.representor_email || '',
        rep.representation_text.replace(/"/g, '""')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected-representations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const allFilteredSelected = filteredRepresentations.length > 0 &&
    selectedIds.size === filteredRepresentations.length;
  const someSelected = selectedIds.size > 0;
  const unreviewedSelectedCount = [...selectedIds].filter(id =>
    !representations.find(r => r.id === id)?.reviewed_at
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Representations Inbox</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage representations across all notices in your department
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </button>
          <button
            onClick={exportForIdox}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FileText className="h-4 w-4" />
            Export for Idox
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{counts.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Support</dt>
                  <dd className="text-lg font-medium text-gray-900">{counts.support}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ThumbsDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Objections</dt>
                  <dd className="text-lg font-medium text-gray-900">{counts.objection}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Comments</dt>
                  <dd className="text-lg font-medium text-gray-900">{counts.comment}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Representations</option>
                  <option value="unread">Unread</option>
                  <option value="support">Support Only</option>
                  <option value="objection">Objections Only</option>
                  <option value="comment">Comments Only</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="not_reviewed">Not Reviewed</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Search representations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {someSelected && (
          <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkMarkReviewed}
                disabled={bulkActionLoading || unreviewedSelectedCount === 0}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-3 w-3" />
                Mark as Reviewed ({unreviewedSelectedCount})
              </button>
              <button
                onClick={handleBulkExport}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-3 w-3" />
                Export Selected
              </button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-700 hover:text-blue-900"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Select All Header */}
        {!loading && !error && filteredRepresentations.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              aria-label={allFilteredSelected ? 'Deselect all' : 'Select all'}
            >
              {allFilteredSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-xs text-gray-500">
              ({filteredRepresentations.length} {filteredRepresentations.length === 1 ? 'item' : 'items'})
            </span>
          </div>
        )}

        {/* Representations List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading representations...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredRepresentations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No representations found</div>
          ) : (
            filteredRepresentations.map((rep) => (
              <div
                key={rep.id}
                className={`p-4 hover:bg-gray-50 ${selectedIds.has(rep.id) ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(rep.id);
                    }}
                    className="flex-shrink-0 mt-0.5"
                    aria-label={selectedIds.has(rep.id) ? 'Deselect' : 'Select'}
                  >
                    {selectedIds.has(rep.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedRep(rep)}
                      >
                        <div className="flex items-center gap-2">
                          {getStanceIcon(rep.type)}
                          <p className="text-sm font-medium text-gray-900">
                            {rep.representor_name || 'Anonymous'}
                          </p>
                          {rep.representor_email && (
                            <p className="text-sm text-gray-500">({rep.representor_email})</p>
                          )}
                          {rep.assigned_to_name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <User className="h-3 w-3" />
                              {rep.assigned_to_name}
                            </span>
                          )}
                          {rep.reviewed_at && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {rep.representation_text}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(rep.submitted_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {rep.notice?.application_type || rep.notice?.notice_type}
                          </span>
                          {rep.notice?.applicant && (
                            <span>{rep.notice.applicant}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigningRep(rep);
                            setAssignModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <UserPlus className="h-3 w-3" />
                          {rep.assigned_to ? 'Reassign' : 'Assign'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRep(rep);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRep && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium text-gray-900">Representation Details</h3>
                <button
                  onClick={() => setSelectedRep(null)}
                  className="ml-auto bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Submitter</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedRep.representor_name || 'Anonymous'}
                    {selectedRep.representor_email && ` (${selectedRep.representor_email})`}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Stance</h4>
                  <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                    {getStanceIcon(selectedRep.type)}
                    {getStanceLabel(selectedRep.type)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Notice</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedRep.notice?.application_type || selectedRep.notice?.notice_type} - {selectedRep.notice?.applicant || selectedRep.notice?.trading_name}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Representation Text</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedRep.representation_text}
                  </p>
                </div>

                {selectedRep.reviewed_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900">Review Status</h4>
                    <p className="mt-1 text-sm text-green-700">
                      Reviewed by {selectedRep.reviewed_by_name} on {new Date(selectedRep.reviewed_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Submitted</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(selectedRep.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Internal Comments Section */}
              {department && userId && (
                <InternalComments
                  representationId={selectedRep.id}
                  departmentId={department.id}
                  userRole={userRole}
                  userName={userName}
                  userId={userId}
                />
              )}

              <div className="mt-6 flex justify-between">
                {!selectedRep.reviewed_at && (
                  <button
                    onClick={() => {
                      // Mark as reviewed with current user and timestamp
                      const updatedRep = {
                        ...selectedRep,
                        reviewed_at: new Date().toISOString(),
                        reviewed_by: userId,
                        reviewed_by_name: userName || 'Officer'
                      };
                      setRepresentations(prev => prev.map(rep =>
                        rep.id === selectedRep.id ? updatedRep : rep
                      ));
                      setSelectedRep(updatedRep);
                      // Audit trail would be created here in a real implementation
                      console.log(`Marked representation ${selectedRep.id} as reviewed by ${userName}`);
                    }}
                    className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Mark as Reviewed
                  </button>
                )}
                {selectedRep.reviewed_at && <div />}
                <button
                  onClick={() => setSelectedRep(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Representation Modal */}
      {assigningRep && department && (
        <AssignRepresentationModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setAssigningRep(null);
          }}
          representationId={assigningRep.id}
          departmentId={department.id}
          currentAssignee={assigningRep.assigned_to}
          onAssigned={(assigneeId: string, assigneeName: string) => {
            // Update the local state with the assignment
            setRepresentations(prev => prev.map(rep =>
              rep.id === assigningRep.id
                ? {
                    ...rep,
                    assigned_to: assigneeId,
                    assigned_to_name: assigneeName,
                    assigned_at: new Date().toISOString()
                  }
                : rep
            ));
            setAssignModalOpen(false);
            setAssigningRep(null);
          }}
        />
      )}
    </div>
  );
}