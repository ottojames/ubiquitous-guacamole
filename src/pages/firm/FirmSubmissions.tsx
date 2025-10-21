import { useEffect, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  receiving_department: {
    name: string;
    organization: {
      name: string;
    };
  };
}

export default function FirmSubmissions() {
  const { organization } = useOutletContext<{ organization: Organization }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [organization.id]);

  useEffect(() => {
    // Check for status param in URL
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, searchQuery]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          reviewed_at,
          receiving_department:receiving_department_id (
            name,
            organization:organization_id (
              name
            )
          )
        `)
        .eq('submitting_organization_id', organization.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data as Submission[]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Filter by status
    if (statusFilter === 'draft') {
      filtered = filtered.filter((s) => s.status === 'draft');
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((s) => s.status === 'new' || s.status === 'in_review');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter((s) => s.status === 'approved');
    } else if (statusFilter === 'published') {
      filtered = filtered.filter((s) => s.status === 'published');
    } else if (statusFilter === 'changes_requested') {
      filtered = filtered.filter((s) => s.status === 'changes_requested');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((s) => s.status === 'rejected');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.notice_type.toLowerCase().includes(query) ||
          s.receiving_department.organization.name.toLowerCase().includes(query)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'new':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Pending Review';
      case 'in_review':
        return 'Under Review';
      case 'changes_requested':
        return 'Changes Requested';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not submitted';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-1">All your licensing applications</p>
        </div>
        <Link
          to={`/f/${organization.slug}/new-submission`}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Submission
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Submissions</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, type, or council..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' ? 'No submissions found matching your filters' : 'No submissions yet'}
          </p>
          <Link
            to={`/f/${organization.slug}/new-submission`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Submission
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((submission) => (
            <Link
              key={submission.id}
              to={`/f/${organization.slug}/submissions/${submission.id}`}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{submission.title}</h3>
                  <p className="text-sm text-gray-600">
                    {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                  {getStatusLabel(submission.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{submission.receiving_department.organization.name}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(submission.submitted_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
