import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Notice {
  id: string;
  title: string;
  notice_type: string;
  published_at: string;
  representation_deadline: string | null;
  expires_at: string | null;
  premises_name: string | null;
  premises_address: string | null;
  premises_postcode: string | null;
  department: {
    name: string;
    organization: {
      name: string;
    };
  };
}

export default function PublicNotices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [councils, setCouncils] = useState<{ id: string; name: string }[]>([]);
  const [selectedCouncil, setSelectedCouncil] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [noticeTypeFilter, setNoticeTypeFilter] = useState('');

  useEffect(() => {
    loadNotices();
    loadCouncils();
  }, []);

  useEffect(() => {
    // Check for council filter in URL
    const councilParam = searchParams.get('council');
    if (councilParam) {
      setSelectedCouncil(councilParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterNotices();
  }, [notices, selectedCouncil, searchQuery, noticeTypeFilter]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          notice_type,
          published_at,
          representation_deadline,
          expires_at,
          premises_name,
          premises_address,
          premises_postcode,
          department:department_id (
            name,
            organization:organization_id (
              name
            )
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = data?.map((notice: any) => ({
        ...notice,
        department: {
          name: notice.department.name,
          organization: {
            name: notice.department.organization.name
          }
        }
      })) || [];

      setNotices(formatted);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load notices:', err);
      setLoading(false);
    }
  };

  const loadCouncils = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'council')
        .order('name');

      if (error) throw error;
      setCouncils(data || []);
    } catch (err) {
      console.error('Failed to load councils:', err);
    }
  };

  const filterNotices = () => {
    let filtered = [...notices];

    // Filter by council
    if (selectedCouncil) {
      filtered = filtered.filter((n) =>
        n.department.organization.name.toLowerCase().includes(selectedCouncil.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.premises_name?.toLowerCase().includes(query) ||
          n.premises_postcode?.toLowerCase().includes(query) ||
          n.department.organization.name.toLowerCase().includes(query)
      );
    }

    // Filter by notice type
    if (noticeTypeFilter) {
      filtered = filtered.filter((n) => n.notice_type === noticeTypeFilter);
    }

    setFilteredNotices(filtered);
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const noticeTypes = Array.from(new Set(notices.map((n) => n.notice_type)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Notices</h1>
          <p className="text-lg text-gray-600">
            View licensing applications and public notices from councils across the UK
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, premises, postcode..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Council Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Council</label>
              <select
                value={selectedCouncil}
                onChange={(e) => setSelectedCouncil(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Councils</option>
                {councils.map((council) => (
                  <option key={council.id} value={council.name}>
                    {council.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notice Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notice Type</label>
              <select
                value={noticeTypeFilter}
                onChange={(e) => setNoticeTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {noticeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredNotices.length} of {notices.length} notices
          </div>
        </div>

        {/* Notices List */}
        {filteredNotices.length === 0 ? (
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
            <p className="text-gray-600 mb-2">No notices found</p>
            <p className="text-sm text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredNotices.map((notice) => {
              const daysRemaining = getDaysRemaining(notice.representation_deadline);
              const isClosingSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
              const isClosed = daysRemaining !== null && daysRemaining <= 0;

              return (
                <Link
                  key={notice.id}
                  to={`/public/notices/${notice.id}`}
                  className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{notice.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {notice.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      {notice.premises_name && (
                        <p className="text-gray-700 mb-1">
                          <span className="font-semibold">Premises:</span> {notice.premises_name}
                        </p>
                      )}
                      {notice.premises_address && (
                        <p className="text-sm text-gray-600">{notice.premises_address}</p>
                      )}
                      {notice.premises_postcode && (
                        <p className="text-sm text-gray-600 font-mono">{notice.premises_postcode}</p>
                      )}
                    </div>

                    {daysRemaining !== null && (
                      <div className="ml-4">
                        <div
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            isClosed
                              ? 'bg-gray-100 text-gray-600'
                              : isClosingSoon
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isClosed
                            ? 'Closed'
                            : daysRemaining === 1
                            ? '1 day left'
                            : `${daysRemaining} days left`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{notice.department.organization.name}</span>
                    </div>
                    <span>•</span>
                    <span>Published {formatDate(notice.published_at)}</span>
                    {notice.representation_deadline && (
                      <>
                        <span>•</span>
                        <span>Deadline {formatDate(notice.representation_deadline)}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
