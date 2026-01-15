import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InternalComments from '@/components/council/InternalComments';
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Download,
  Filter,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface Representation {
  id: string;
  notice_id: string;
  created_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  representation_text: string;
  stance: 'support' | 'object' | 'comment' | null;
  attachments?: string[];
  is_anonymous: boolean;
  ip_address?: string;
  notice?: {
    id: string;
    application_type: string;
    trading_name?: string;
    premises_name?: string;
    premises_address?: any;
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
  const [filter, setFilter] = useState<'all' | 'unread' | 'support' | 'object' | 'comment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRep, setSelectedRep] = useState<Representation | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

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
            trading_name,
            premises_name,
            premises_address,
            department_id
          )
        `)
        .eq('notices.department_id', department.id)
        .order('created_at', { ascending: false });

      // Apply stance filter if not 'all'
      if (filter !== 'all' && filter !== 'unread') {
        query = query.eq('stance', filter);
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

  const getStanceIcon = (stance: string | null) => {
    switch (stance) {
      case 'support':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'object':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStanceLabel = (stance: string | null) => {
    switch (stance) {
      case 'support':
        return 'Support';
      case 'object':
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
        new Date(rep.created_at).toLocaleDateString(),
        rep.notice_id,
        rep.notice?.application_type || '',
        rep.notice?.premises_name || rep.notice?.trading_name || '',
        getStanceLabel(rep.stance),
        rep.respondent_name || 'Anonymous',
        rep.respondent_email || '',
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

  const filteredRepresentations = representations.filter(rep => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      rep.representation_text.toLowerCase().includes(searchLower) ||
      rep.respondent_name?.toLowerCase().includes(searchLower) ||
      rep.respondent_email?.toLowerCase().includes(searchLower) ||
      rep.notice?.premises_name?.toLowerCase().includes(searchLower) ||
      rep.notice?.trading_name?.toLowerCase().includes(searchLower)
    );
  });

  const counts = {
    total: representations.length,
    support: representations.filter(r => r.stance === 'support').length,
    object: representations.filter(r => r.stance === 'object').length,
    comment: representations.filter(r => r.stance === 'comment').length,
  };

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
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
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
                  <dd className="text-lg font-medium text-gray-900">{counts.object}</dd>
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
                  <option value="object">Objections Only</option>
                  <option value="comment">Comments Only</option>
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
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRep(rep)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStanceIcon(rep.stance)}
                      <p className="text-sm font-medium text-gray-900">
                        {rep.respondent_name || 'Anonymous'}
                      </p>
                      {rep.respondent_email && (
                        <p className="text-sm text-gray-500">({rep.respondent_email})</p>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {rep.representation_text}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {rep.notice?.application_type}
                      </span>
                      {rep.notice?.premises_name && (
                        <span>{rep.notice.premises_name}</span>
                      )}
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
                    {selectedRep.respondent_name || 'Anonymous'}
                    {selectedRep.respondent_email && ` (${selectedRep.respondent_email})`}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Stance</h4>
                  <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                    {getStanceIcon(selectedRep.stance)}
                    {getStanceLabel(selectedRep.stance)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Notice</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedRep.notice?.application_type} - {selectedRep.notice?.premises_name || selectedRep.notice?.trading_name}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Representation Text</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedRep.representation_text}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Submitted</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(selectedRep.created_at).toLocaleString()}
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

              <div className="mt-6 flex justify-end">
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
    </div>
  );
}