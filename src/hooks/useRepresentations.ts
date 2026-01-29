import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Representation {
  id: string;
  notice_id: string;
  representor_name: string;
  representor_email: string;
  representor_address: any;
  type: 'objection' | 'support' | 'comment';
  representation_text: string;
  grounds: any;
  submitted_at: string;
  reference_number: string;
}

export interface RepresentationStats {
  total: number;
  objections: number;
  support: number;
  comments: number;
}

export function useRepresentations(noticeId: string | undefined) {
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [stats, setStats] = useState<RepresentationStats>({
    total: 0,
    objections: 0,
    support: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noticeId) {
      setLoading(false);
      return;
    }

    const fetchRepresentations = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('representations')
          .select('*')
          .eq('notice_id', noticeId)
          .order('submitted_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching representations:', fetchError);
          setError(fetchError.message);
          return;
        }

        const reps = data || [];
        setRepresentations(reps);

        // Calculate stats
        const objections = reps.filter((r) => r.type === 'objection').length;
        const support = reps.filter((r) => r.type === 'support').length;
        const comments = reps.filter((r) => r.type === 'comment').length;

        setStats({
          total: reps.length,
          objections,
          support,
          comments,
        });
      } catch (err: any) {
        console.error('Error fetching representations:', err);
        setError(err.message || 'Failed to load representations');
      } finally {
        setLoading(false);
      }
    };

    fetchRepresentations();
  }, [noticeId]);

  return { representations, stats, loading, error };
}
