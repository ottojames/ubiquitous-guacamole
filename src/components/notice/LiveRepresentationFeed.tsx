import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, MessageSquare, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Representation {
  id: string;
  notice_id: string;
  stance: 'support' | 'oppose' | 'comment';
  respondent_name?: string;
  representation_text: string;
  created_at: string;
}

interface LiveRepresentationFeedProps {
  noticeId: string;
  showFullText?: boolean;
}

export default function LiveRepresentationFeed({
  noticeId,
  showFullText = false
}: LiveRepresentationFeedProps) {
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stanceCounts, setStanceCounts] = useState({
    support: 0,
    oppose: 0,
    comment: 0
  });

  useEffect(() => {
    loadRepresentations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`representations-${noticeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'representations',
          filter: `notice_id=eq.${noticeId}`
        },
        (payload) => {
          console.log('New representation received:', payload);
          const newRep = payload.new as Representation;
          setRepresentations(prev => [newRep, ...prev]);
          setTotalCount(prev => prev + 1);
          setStanceCounts(prev => ({
            ...prev,
            [newRep.stance]: prev[newRep.stance] + 1
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [noticeId]);

  const loadRepresentations = async () => {
    try {
      setLoading(true);

      // Fetch representations (public data only)
      const { data, error, count } = await supabase
        .from('representations')
        .select('id, notice_id, stance, respondent_name, representation_text, created_at', { count: 'exact' })
        .eq('notice_id', noticeId)
        .eq('is_public', true)  // Only show public representations
        .order('created_at', { ascending: false })
        .limit(showFullText ? 50 : 10);

      if (error) throw error;

      setRepresentations(data || []);
      setTotalCount(count || 0);

      // Calculate stance counts
      const counts = { support: 0, oppose: 0, comment: 0 };
      (data || []).forEach(rep => {
        const stance = rep.stance as keyof typeof counts;
        if (stance in counts) counts[stance]++;
      });
      setStanceCounts(counts);
    } catch (error) {
      console.error('Failed to load representations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStanceIcon = (stance: string) => {
    switch (stance) {
      case 'support':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'oppose':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'support':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'oppose':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with counts */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Public Representations
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {totalCount} total
          </span>
        </div>

        {/* Stance breakdown */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            <span className="font-medium text-gray-700">{stanceCounts.support}</span>
            <span className="text-gray-500">support</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span className="font-medium text-gray-700">{stanceCounts.oppose}</span>
            <span className="text-gray-500">oppose</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-700">{stanceCounts.comment}</span>
            <span className="text-gray-500">comment</span>
          </div>
        </div>
      </div>

      {/* Representations list */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {representations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No public representations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              They will appear here as they are submitted
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {rep.respondent_name || 'Anonymous'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStanceColor(rep.stance)}`}>
                      {rep.stance}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(rep.created_at), 'dd MMM, HH:mm')}
                    </span>
                  </div>
                  <p className={`text-sm text-gray-700 ${!showFullText ? 'line-clamp-2' : ''}`}>
                    {rep.representation_text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {representations.length > 0 && representations.length < totalCount && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Showing {representations.length} of {totalCount} representations
          </p>
        </div>
      )}
    </div>
  );
}