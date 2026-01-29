import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from '@/lib/ui/toast';

interface InternalComment {
  id: string;
  author_name: string;
  author_role: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

interface InternalCommentsProps {
  representationId: string;
  departmentId: string;
  userRole: string;
  userName: string;
  userId: string;
}

export default function InternalComments({
  representationId,
  departmentId,
  userRole,
  userName,
  userId
}: InternalCommentsProps) {
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [representationId]);

  // Get auth token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const loadComments = async () => {
    try {
      setLoading(true);

      // P2-002: Remove demo mode fallback - require authentication
      const token = await getAuthToken();

      if (!token) {
        // No token means not authenticated - show empty state, don't use demo fallback
        setComments([]);
        setError('Please log in to view internal comments.');
        return;
      }

      // Use API endpoint for authenticated users
      const response = await fetch(`/api/internal-comments/${representationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load comments');
      }

      const data = await response.json();
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load internal comments:', err);
      // Don't show error for empty comments
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate empty comment with inline error message
    if (!newComment.trim()) {
      setValidationError('Please enter a comment before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setValidationError(null);

      const token = await getAuthToken();

      // P2-002: Remove demo mode - require authentication for all operations
      if (!token) {
        setError('Please log in to add comments. Authentication is required.');
        return;
      }

      // Use API endpoint for authenticated users
      const response = await fetch('/api/internal-comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          representationId,
          departmentId,
          authorName: userName,
          authorRole: userRole,
          commentText: newComment.trim(),
          visibility: 'department'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add comment');
      }

      setNewComment('');
      toast('Comment added');

      await loadComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      head: 'bg-purple-100 text-purple-800',
      admin: 'bg-purple-100 text-purple-800',
      owner: 'bg-purple-100 text-purple-800',
      org_admin: 'bg-purple-100 text-purple-800',
      dept_admin: 'bg-blue-100 text-blue-800',
      senior: 'bg-blue-100 text-blue-800',
      editor: 'bg-blue-100 text-blue-800',
      officer: 'bg-blue-100 text-blue-800',
      junior: 'bg-slate-100 text-slate-800',
      viewer: 'bg-slate-100 text-slate-800',
      member: 'bg-slate-100 text-slate-800'
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-slate-600">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Internal Comments
        <span className="ml-2 text-xs text-slate-500">({comments.length})</span>
      </h4>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600">No internal comments yet</p>
          <p className="text-xs text-slate-500 mt-1">Add a comment to discuss this representation with your team</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">{comment.author_name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(comment.author_role)}`}>
                    {comment.author_role}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              // Clear validation error when user starts typing
              if (validationError) setValidationError(null);
            }}
            placeholder="Add an internal comment (visible to team members based on your role)"
            rows={3}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={submitting}
          />
        </div>
        {validationError && (
          <p className="mt-2 text-sm text-red-600">{validationError}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {userRole === 'head' || userRole === 'admin' || userRole === 'owner' || userRole === 'org_admin' ? (
              <>All officers will see your comment</>
            ) : userRole === 'senior' || userRole === 'editor' || userRole === 'officer' || userRole === 'dept_admin' ? (
              <>Department members will see your comment</>
            ) : (
              <>Only you and heads will see your comment</>
            )}
          </p>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Visibility Info */}
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Comment Visibility Rules</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Heads/Admins:</strong> See all comments in the department</li>
                <li><strong>Senior Officers:</strong> See all comments in the department</li>
                <li><strong>Junior Officers:</strong> See only their own comments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
