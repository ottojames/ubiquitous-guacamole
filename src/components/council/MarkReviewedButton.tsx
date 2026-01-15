import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MarkReviewedButtonProps {
  representationId: string;
  isReviewed: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  currentUserId: string;
  currentUserName: string;
  onStatusChange: (reviewed: boolean, reviewedBy: string, reviewedAt: string) => void;
}

export default function MarkReviewedButton({
  representationId,
  isReviewed,
  reviewedBy,
  reviewedAt,
  currentUserId,
  currentUserName,
  onStatusChange
}: MarkReviewedButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkReviewed = async () => {
    try {
      setLoading(true);

      const now = new Date().toISOString();

      // Update representation with reviewed status
      const { error } = await supabase
        .from('representations')
        .update({
          reviewed: true,
          reviewed_by: currentUserId,
          reviewed_by_name: currentUserName,
          reviewed_at: now,
          updated_at: now
        })
        .eq('id', representationId);

      if (error) throw error;

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          entity_type: 'representation',
          entity_id: representationId,
          action: 'marked_reviewed',
          user_id: currentUserId,
          user_name: currentUserName,
          metadata: {
            reviewed_at: now
          }
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      onStatusChange(true, currentUserName, now);
    } catch (error) {
      console.error('Failed to mark as reviewed:', error);
      alert('Failed to mark representation as reviewed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnreviewed = async () => {
    try {
      setLoading(true);

      const now = new Date().toISOString();

      // Update representation to unreviewed
      const { error } = await supabase
        .from('representations')
        .update({
          reviewed: false,
          reviewed_by: null,
          reviewed_by_name: null,
          reviewed_at: null,
          updated_at: now
        })
        .eq('id', representationId);

      if (error) throw error;

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert({
          entity_type: 'representation',
          entity_id: representationId,
          action: 'marked_unreviewed',
          user_id: currentUserId,
          user_name: currentUserName,
          metadata: {
            unmarked_at: now
          }
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      onStatusChange(false, '', '');
    } catch (error) {
      console.error('Failed to mark as unreviewed:', error);
      alert('Failed to update review status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isReviewed) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Reviewed</span>
            <span className="text-xs text-green-600">
              by {reviewedBy} on {reviewedAt ? format(new Date(reviewedAt), 'dd MMM yyyy, HH:mm') : 'Unknown date'}
            </span>
          </div>
        </div>
        <button
          onClick={handleMarkUnreviewed}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Mark as unreviewed'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleMarkReviewed}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <>
          <Clock className="h-4 w-4 animate-spin" />
          Marking...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          Mark as Reviewed
        </>
      )}
    </button>
  );
}