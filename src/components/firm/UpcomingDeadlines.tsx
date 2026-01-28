import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { differenceInDays, format } from 'date-fns';

interface DeadlineNotice {
  id: string;
  title: string;
  notice_type: string;
  premises_name?: string;
  representation_deadline: string;
  client?: {
    name: string;
  };
}

interface UpcomingDeadlinesProps {
  firmId: string;
  firmSlug: string;
}

export default function UpcomingDeadlines({ firmId, firmSlug }: UpcomingDeadlinesProps) {
  const [notices, setNotices] = useState<DeadlineNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingDeadlines();
  }, [firmId]);

  const loadUpcomingDeadlines = async () => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('notices')
        .select('id, title, notice_type, premises_name, representation_deadline, client:clients(name)')
        .eq('organization_id', firmId)
        .eq('status', 'published')
        .gte('representation_deadline', now.toISOString())
        .lte('representation_deadline', thirtyDaysFromNow.toISOString())
        .order('representation_deadline', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Mock data fallback for demo
      if (!data || data.length === 0) {
        const mockData: DeadlineNotice[] = [
          {
            id: 'mock-1',
            title: 'Premises Licence Application',
            notice_type: 'premises-licence',
            premises_name: 'The Red Lion Pub',
            representation_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            client: { name: 'Red Lion Holdings Ltd' }
          },
          {
            id: 'mock-2',
            title: 'Licence Variation',
            notice_type: 'variation',
            premises_name: 'Crown Hotel',
            representation_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            client: { name: 'Crown Hospitality Group' }
          },
          {
            id: 'mock-3',
            title: 'New Premises Licence',
            notice_type: 'premises-licence',
            premises_name: 'Blue Moon Restaurant',
            representation_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            client: { name: 'Blue Moon Ltd' }
          },
          {
            id: 'mock-4',
            title: 'Transfer Application',
            notice_type: 'transfer',
            premises_name: 'The Old Oak',
            representation_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
            client: { name: 'Oak Tree Pubs' }
          }
        ];
        setNotices(mockData);
      } else {
        // Transform client array from Supabase join to single object
        const transformed = (data || []).map(row => ({
          ...row,
          client: Array.isArray(row.client) ? row.client[0] : row.client
        })) as DeadlineNotice[];
        setNotices(transformed);
      }
    } catch (err) {
      console.error('Failed to load upcoming deadlines:', err);
      // Set mock data on error
      const mockData: DeadlineNotice[] = [
        {
          id: 'mock-1',
          title: 'Premises Licence Application',
          notice_type: 'premises-licence',
          premises_name: 'The Red Lion Pub',
          representation_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          client: { name: 'Red Lion Holdings Ltd' }
        },
        {
          id: 'mock-2',
          title: 'Licence Variation',
          notice_type: 'variation',
          premises_name: 'Crown Hotel',
          representation_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
          client: { name: 'Crown Hospitality Group' }
        }
      ];
      setNotices(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 7) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' };
    if (days < 14) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' };
  };

  const formatNoticeType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Upcoming Deadlines
        </h2>
        <Link
          to={`/f/${firmSlug}/notices`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all →
        </Link>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No upcoming deadlines</p>
          <p className="text-gray-400 text-xs mt-1">All consultation periods are clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const days = differenceInDays(new Date(notice.representation_deadline), new Date());
            const colors = getUrgencyColor(notice.representation_deadline);

            return (
              <Link
                key={notice.id}
                to={`/notices/${notice.id}`}
                className={`block p-3 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      {days < 7 && <AlertCircle className={`w-4 h-4 ${colors.icon} mt-0.5 flex-shrink-0`} />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {notice.premises_name || notice.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {formatNoticeType(notice.notice_type)}
                          </span>
                          {notice.client && (
                            <span className="truncate">{notice.client.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-sm ${colors.text}`}>
                      {days === 0 ? 'Today' :
                       days === 1 ? '1 day' :
                       `${days} days`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(notice.representation_deadline), 'd MMM')}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}