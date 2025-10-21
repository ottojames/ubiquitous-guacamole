import { useEffect, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
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

interface Representation {
  id: string;
  notice_id: string;
  respondent_name: string;
  respondent_email: string | null;
  respondent_type: string;
  comment: string;
  submitted_at: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notice: {
    title: string;
    notice_type: string;
  };
  reviewer?: {
    email: string;
  };
}

interface Notice {
  id: string;
  title: string;
}

type FilterStatus = 'all' | 'new' | 'reviewed' | 'actioned';

export default function Representations() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [filteredRepresentations, setFilteredRepresentations] = useState<Representation[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedNotice, setSelectedNotice] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadNotices();
    loadRepresentations();

    // Check if there's a notice filter in URL params
    const noticeParam = searchParams.get('notice');
    if (noticeParam) {
      setSelectedNotice(noticeParam);
    }
  }, [department.id, searchParams]);

  useEffect(() => {
    filterRepresentations();
  }, [representations, filterStatus, selectedNotice, searchQuery]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title')
        .eq('department_id', department.id)
        .in('status', ['published', 'expired'])
        .order('title', { ascending: true });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  const loadRepresentations = async () => {
    try {
      const { data, error } = await supabase
        .from('representations')
        .select(`
          id,
          notice_id,
          respondent_name,
          respondent_email,
          respondent_type,
          comment,
          submitted_at,
          status,
          reviewed_by,
          reviewed_at,
          notice:notices (
            title,
            notice_type
          ),
          reviewer:reviewed_by (
            email
          )
        `)
        .eq('department_id', department.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setRepresentations(data as any || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load representations:', err);
      setLoading(false);
    }
  };

  const filterRepresentations = () => {
    let filtered = representations;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by notice
    if (selectedNotice !== 'all') {
      filtered = filtered.filter(r => r.notice_id === selectedNotice);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.respondent_name.toLowerCase().includes(query) ||
        r.respondent_email?.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query) ||
        r.notice?.title.toLowerCase().includes(query)
      );
    }

    setFilteredRepresentations(filtered);
  };

  const handleMarkAsReviewed = async (representationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('representations')
        .update({
          status: 'reviewed',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', representationId);

      if (error) throw error;

      // Reload representations
      loadRepresentations();
    } catch (err) {
      console.error('Failed to mark as reviewed:', err);
    }
  };

  const handleMarkAsActioned = async (representationId: string) => {
    try {
      const { error } = await supabase
        .from('representations')
        .update({
          status: 'actioned'
        })
        .eq('id', representationId);

      if (error) throw error;

      // Reload representations
      loadRepresentations();
    } catch (err) {
      console.error('Failed to mark as actioned:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'actioned':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRespondentTypeColor = (type: string) => {
    switch (type) {
      case 'resident':
        return 'bg-purple-100 text-purple-800';
      case 'business':
        return 'bg-orange-100 text-orange-800';
      case 'organization':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canReview = ['owner', 'org_admin', 'department_admin', 'editor'].includes(userRole);

  const statusCounts = {
    all: representations.length,
    new: representations.filter(r => r.status === 'new').length,
    reviewed: representations.filter(r => r.status === 'reviewed').length,
    actioned: representations.filter(r => r.status === 'actioned').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Representations</h1>
          <p className="text-gray-600 mt-1">
            Manage public responses to published notices
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total</h3>
            <svg
              className="w-8 h-8 text-gray-600"
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
          <p className="text-3xl font-bold text-gray-900">{statusCounts.all}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">New</h3>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.new}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Reviewed</h3>
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
          <p className="text-3xl font-bold text-gray-900">{statusCounts.reviewed}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Actioned</h3>
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.actioned}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by respondent, email, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Notice Filter */}
            <div className="flex-1">
              <select
                value={selectedNotice}
                onChange={(e) => setSelectedNotice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Notices</option>
                {notices.map(notice => (
                  <option key={notice.id} value={notice.id}>
                    {notice.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'new', 'reviewed', 'actioned'] as FilterStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status} ({statusCounts[status]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Representations List */}
      {filteredRepresentations.length === 0 ? (
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
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all' || selectedNotice !== 'all'
              ? 'No representations match your filters'
              : 'No representations yet'}
          </p>
          {!searchQuery && filterStatus === 'all' && selectedNotice === 'all' && (
            <p className="text-sm text-gray-500">
              Public responses to published notices will appear here
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRepresentations.map((rep) => {
            const isExpanded = expandedId === rep.id;

            return (
              <div
                key={rep.id}
                className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rep.respondent_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rep.status)}`}>
                        {formatStatus(rep.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRespondentTypeColor(rep.respondent_type)}`}>
                        {formatType(rep.respondent_type)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      Re: <span className="font-medium">{rep.notice?.title}</span>
                    </p>

                    {rep.respondent_email && (
                      <p className="text-sm text-gray-600 mb-3">{rep.respondent_email}</p>
                    )}

                    <p className="text-sm text-gray-500">
                      Submitted {formatDate(rep.submitted_at)}
                    </p>

                    {rep.reviewed_at && rep.reviewer && (
                      <p className="text-sm text-gray-500">
                        Reviewed by {rep.reviewer.email} on {formatDate(rep.reviewed_at)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rep.id)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    {isExpanded ? 'Hide' : 'View'} Comment
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{rep.comment}</p>
                    </div>

                    {canReview && (
                      <div className="flex gap-2">
                        {rep.status === 'new' && (
                          <button
                            onClick={() => handleMarkAsReviewed(rep.id)}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-700 transition-colors"
                          >
                            Mark as Reviewed
                          </button>
                        )}
                        {rep.status === 'reviewed' && (
                          <button
                            onClick={() => handleMarkAsActioned(rep.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                          >
                            Mark as Actioned
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
