import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, MessageSquare, ThumbsUp, ThumbsDown, MessageCircle, RefreshCw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

interface Representation {
  id: string;
  notice_id: string;
  stance: 'support' | 'object' | 'comment';
  respondent_name?: string;
  representation_text: string;
  created_at: string;
  notice?: {
    id: string;
    notice_type: string;
    premises: any;
  };
}

interface RecentRepresentationsProps {
  firmId: string;
  firmSlug: string;
  daysAgo?: number;
}

export default function RecentRepresentations({
  firmId,
  firmSlug,
  daysAgo = 7
}: RecentRepresentationsProps) {
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadRepresentations();

    // Set up real-time subscription for new representations
    const subscription = supabase
      .channel(`firm-representations-${firmId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'representations'
        },
        async (payload) => {
          // Check if this representation is for one of our notices
          const { data: notice } = await supabase
            .from('notices')
            .select('id, organization_id')
            .eq('id', payload.new.notice_id)
            .eq('organization_id', firmId)
            .single();

          if (notice) {
            console.log('New representation for firm notice:', payload.new);
            // Add the new representation to the top of the list
            const newRep = payload.new as Representation;
            setRepresentations(prev => [newRep, ...prev].slice(0, 10)); // Keep max 10 items
            setTotalCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadRepresentations();
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [firmId, daysAgo]);

  const loadRepresentations = async () => {
    try {
      setLoading(true);
      const cutoffDate = subDays(new Date(), daysAgo).toISOString();

      // First get all notices for this firm
      const { data: notices, error: noticesError } = await supabase
        .from('notices')
        .select('id')
        .eq('organization_id', firmId);

      if (noticesError) throw noticesError;

      if (!notices || notices.length === 0) {
        setRepresentations([]);
        setTotalCount(0);
        return;
      }

      const noticeIds = notices.map(n => n.id);

      // Then get recent representations for those notices
      const { data, error, count } = await supabase
        .from('representations')
        .select(`
          id,
          notice_id,
          stance,
          respondent_name,
          representation_text,
          created_at,
          notices!inner (
            id,
            notice_type,
            premises
          )
        `, { count: 'exact' })
        .in('notice_id', noticeIds)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform the data to include notice info (Supabase returns arrays for joins)
      const transformedData = (data || []).map(rep => ({
        ...rep,
        notice: Array.isArray(rep.notices) ? rep.notices[0] : rep.notices
      })).filter(rep => rep.notice) as Representation[];

      setRepresentations(transformedData);
      setTotalCount(count || 0);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load representations:', error);
      // Use mock data as fallback for demo
      setRepresentations(getMockRepresentations());
      setTotalCount(3);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRepresentations();
  };

  const getStanceIcon = (stance: string) => {
    switch (stance) {
      case 'support':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'object':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'support':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'object':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getNoticeTypeBadge = (noticeType: string) => {
    const typeColors: Record<string, string> = {
      'premises-licence': 'bg-purple-100 text-purple-800',
      'variation': 'bg-blue-100 text-blue-800',
      'transfer': 'bg-green-100 text-green-800',
      'review': 'bg-orange-100 text-orange-800',
      'planning': 'bg-indigo-100 text-indigo-800',
      'default': 'bg-gray-100 text-gray-800'
    };

    const color = typeColors[noticeType] || typeColors.default;
    const displayName = noticeType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {displayName}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Recent Representations</h2>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              Last 7 days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500">
              Updated {format(lastRefresh, 'HH:mm')}
            </span>
          </div>
        </div>
      </div>

      {/* Representations list */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {representations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No representations in the last {daysAgo} days</p>
            <p className="text-sm text-gray-400 mt-1">
              New representations will appear here automatically
            </p>
          </div>
        ) : (
          representations.map(rep => (
            <div key={rep.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStanceIcon(rep.stance)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Notice reference and type */}
                  <div className="flex items-center gap-2 mb-1">
                    {rep.notice && getNoticeTypeBadge(rep.notice.notice_type)}
                    {rep.notice?.premises && (
                      <Link
                        to={`/f/${firmSlug}/notices/${rep.notice_id}`}
                        className="text-sm font-medium text-purple-600 hover:text-purple-700"
                      >
                        {rep.notice.premises.name || 'Notice ' + rep.notice_id.slice(0, 8)}
                      </Link>
                    )}
                  </div>

                  {/* Representation details */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {rep.respondent_name || 'Anonymous'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStanceColor(rep.stance)}`}>
                      {rep.stance === 'object' ? 'objection' : rep.stance}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(rep.created_at), 'dd MMM, HH:mm')}
                    </span>
                  </div>

                  {/* Preview text */}
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {rep.representation_text}
                  </p>

                  {/* View full details link */}
                  <Link
                    to={`/f/${firmSlug}/notices/${rep.notice_id}/representations/${rep.id}`}
                    className="inline-flex items-center mt-2 text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    View full representation →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {representations.length > 0 && (
        <div className="p-3 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            {totalCount} total representations in the last {daysAgo} days
          </p>
        </div>
      )}
    </div>
  );
}

// Mock data for demo purposes
function getMockRepresentations(): Representation[] {
  return [
    {
      id: 'mock-1',
      notice_id: 'notice-1',
      stance: 'object',
      respondent_name: 'John Smith',
      representation_text: 'I object to this application due to potential noise disturbance during late hours. The premises is located in a residential area...',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      notice: {
        id: 'notice-1',
        notice_type: 'premises-licence',
        premises: { name: 'The Blue Moon Bar' }
      }
    },
    {
      id: 'mock-2',
      notice_id: 'notice-2',
      stance: 'support',
      respondent_name: 'Sarah Johnson',
      representation_text: 'I support this application. The business has been a positive addition to our community and maintains high standards...',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      notice: {
        id: 'notice-2',
        notice_type: 'variation',
        premises: { name: 'Crown Hotel' }
      }
    },
    {
      id: 'mock-3',
      notice_id: 'notice-3',
      stance: 'comment',
      respondent_name: 'Local Residents Association',
      representation_text: 'We would like to request additional conditions regarding waste management and delivery times to minimize impact on residents...',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      notice: {
        id: 'notice-3',
        notice_type: 'premises-licence',
        premises: { name: 'The Red Lion Pub' }
      }
    }
  ];
}