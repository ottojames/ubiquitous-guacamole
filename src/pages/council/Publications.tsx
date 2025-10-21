import { useEffect, useState } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
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

interface Publication {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  published_at: string;
  expires_at: string | null;
  representation_deadline: string | null;
  representations_count?: number;
}

type FilterStatus = 'all' | 'active' | 'expired' | 'archived';

export default function Publications() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPublications();
  }, [department.id]);

  useEffect(() => {
    filterPublications();
  }, [publications, filterStatus, searchQuery]);

  const loadPublications = async () => {
    try {
      // Only load published or expired notices (not drafts or pending)
      const { data, error } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          notice_type,
          status,
          published_at,
          expires_at,
          representation_deadline
        `)
        .eq('department_id', department.id)
        .in('status', ['published', 'expired', 'archived'])
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Get representation counts for each publication
      const publicationsWithCounts = await Promise.all(
        (data || []).map(async (pub) => {
          const { count } = await supabase
            .from('representations')
            .select('id', { count: 'exact', head: true })
            .eq('notice_id', pub.id);

          return {
            ...pub,
            representations_count: count || 0
          };
        })
      );

      setPublications(publicationsWithCounts);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load publications:', err);
      setLoading(false);
    }
  };

  const filterPublications = () => {
    let filtered = publications;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(p => p.status === 'published');
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(p => p.status === 'expired');
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(p => p.status === 'archived');
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.notice_type.toLowerCase().includes(query)
      );
    }

    setFilteredPublications(filtered);
  };

  const getStatusColor = (publication: Publication) => {
    if (publication.status === 'expired') {
      return 'bg-red-100 text-red-800';
    } else if (publication.status === 'archived') {
      return 'bg-gray-100 text-gray-800';
    } else if (publication.representation_deadline) {
      const deadline = new Date(publication.representation_deadline);
      const now = new Date();
      if (deadline < now) {
        return 'bg-yellow-100 text-yellow-800'; // Deadline passed
      }
    }
    return 'bg-green-100 text-green-800'; // Active
  };

  const getStatusLabel = (publication: Publication) => {
    if (publication.status === 'expired') return 'Expired';
    if (publication.status === 'archived') return 'Archived';

    if (publication.representation_deadline) {
      const deadline = new Date(publication.representation_deadline);
      const now = new Date();
      if (deadline < now) return 'Closed';
    }

    return 'Active';
  };

  const formatNoticeType = (type: string) => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const canManage = ['owner', 'org_admin', 'department_admin'].includes(userRole);

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const statusCounts = {
    all: publications.length,
    active: publications.filter(p => p.status === 'published').length,
    expired: publications.filter(p => p.status === 'expired').length,
    archived: publications.filter(p => p.status === 'archived').length
  };

  const totalRepresentations = publications.reduce((sum, p) => sum + (p.representations_count || 0), 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-600 mt-1">
            Manage published public notices and representations
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Published</h3>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.all}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active</h3>
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
          <p className="text-3xl font-bold text-gray-900">{statusCounts.active}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Representations</h3>
            <svg
              className="w-8 h-8 text-purple-600"
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
          <p className="text-3xl font-bold text-gray-900">{totalRepresentations}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Expired</h3>
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'expired', 'archived'] as FilterStatus[]).map(status => (
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

      {/* Publications List */}
      {filteredPublications.length === 0 ? (
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
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'No publications match your filters'
              : 'No published notices yet'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <p className="text-sm text-gray-500">
              Published notices will appear here
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPublications.map((publication) => {
            const daysRemaining = getDaysRemaining(publication.representation_deadline);
            const hasRepresentations = (publication.representations_count || 0) > 0;

            return (
              <div
                key={publication.id}
                className="block bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {publication.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(publication)}`}>
                        {getStatusLabel(publication)}
                      </span>
                      {hasRepresentations && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {publication.representations_count} {publication.representations_count === 1 ? 'Response' : 'Responses'}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {formatNoticeType(publication.notice_type)}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Published: {formatDate(publication.published_at)}
                      </div>

                      {publication.representation_deadline && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline: {formatDate(publication.representation_deadline)}
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <span className="ml-1 text-yellow-600 font-semibold">
                              ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
                            </span>
                          )}
                          {daysRemaining !== null && daysRemaining <= 0 && (
                            <span className="ml-1 text-red-600 font-semibold">(Closed)</span>
                          )}
                        </div>
                      )}

                      {publication.expires_at && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Expires: {formatDate(publication.expires_at)}
                        </div>
                      )}
                    </div>

                    {canManage && publication.status === 'published' && (
                      <div className="mt-4 flex gap-2">
                        <Link
                          to={`${basePath}/notices/${publication.id}`}
                          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View/Edit
                        </Link>
                        {hasRepresentations && (
                          <Link
                            to={`${basePath}/representations?notice=${publication.id}`}
                            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                          >
                            View Responses ({publication.representations_count})
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
