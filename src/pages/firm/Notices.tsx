import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Calendar, Search, Filter, Eye, FileText, MapPin } from 'lucide-react';
import ConsultationCountdown from '@/components/notice/ConsultationCountdown';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'firm' | 'council';
}

interface ContextType {
  organization: Organization;
  userRole: string;
}

interface Notice {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  representation_deadline: string | null;
  premises_name?: string;
  premises_address?: string;
  client_id?: string;
  client?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Client {
  id: string;
  name: string;
  slug: string;
}

type FilterStatus = 'all' | 'draft' | 'published' | 'expired';

export default function FirmNotices() {
  const { firmSlug } = useParams<{ firmSlug: string }>();
  const { organization } = useOutletContext<ContextType>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Read client filter from URL on mount
  useEffect(() => {
    const clientParam = searchParams.get('client');
    if (clientParam) {
      setFilterClient(clientParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadNotices();
    loadClients();
  }, [organization.id]);

  useEffect(() => {
    filterNotices();
  }, [notices, filterStatus, filterClient, searchQuery]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, slug')
        .eq('organization_id', organization.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadNotices = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          notice_type,
          status,
          created_at,
          published_at,
          expires_at,
          representation_deadline,
          premises->name as premises_name,
          premises->address as premises_address,
          client_id,
          clients (
            id,
            name,
            slug
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedNotices = (data || []).map((n: any) => ({
        ...n,
        premises_name: n.premises_name || n.title,
        client: n.clients
      }));

      setNotices(transformedNotices);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load notices:', err);
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }

    // Filter by client
    if (filterClient !== 'all') {
      filtered = filtered.filter(n => n.client?.slug === filterClient);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        (n.title || '').toLowerCase().includes(query) ||
        (n.premises_name || '').toLowerCase().includes(query) ||
        (n.premises_address || '').toLowerCase().includes(query) ||
        (n.client?.name || '').toLowerCase().includes(query)
      );
    }

    setFilteredNotices(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatNoticeType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const statusCounts = {
    all: notices.length,
    draft: notices.filter(n => n.status === 'draft').length,
    published: notices.filter(n => n.status === 'published').length,
    expired: notices.filter(n => n.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notices</h1>
        <p className="text-gray-600">View and manage all published notices for your firm</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="draft">Draft ({statusCounts.draft})</option>
              <option value="published">Published ({statusCounts.published})</option>
              <option value="expired">Expired ({statusCounts.expired})</option>
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client
            </label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.slug}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredNotices.length} of {notices.length} notices
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterClient !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by publishing your first notice'}
            </p>
            <Link
              to={`/f/${firmSlug}/publish/step-1`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Publish Notice
            </Link>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <Link
              key={notice.id}
              to={`/notices/${notice.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notice.premises_name || notice.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(notice.status)}`}>
                      {formatStatus(notice.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {formatNoticeType(notice.notice_type)}
                    </div>

                    {notice.client && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {notice.client.name}
                      </div>
                    )}

                    {notice.premises_address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {notice.premises_address}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Created: {formatDate(notice.created_at)}
                    </div>

                    {notice.published_at && (
                      <div className="flex items-center gap-1.5">
                        Published: {formatDate(notice.published_at)}
                      </div>
                    )}

                    {notice.representation_deadline && (
                      <ConsultationCountdown
                        deadline={notice.representation_deadline}
                        variant="compact"
                      />
                    )}
                  </div>
                </div>

                <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
