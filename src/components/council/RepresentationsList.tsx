import { useEffect, useState } from 'react';
import { useRepresentationCounts } from '@/hooks/useRepresentationCounts';

interface Representation {
  id: string;
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  representation_text: string;
  stance: 'support' | 'objection' | 'comment' | null;
  is_read: boolean;
  internal_notes?: Array<{
    timestamp: string;
    user_id: string;
    user_name: string;
    comment: string;
  }>;
}

interface RepresentationsListProps {
  noticeId: string;
  userId: string;
  repLabel: string;
  repLabelPlural: string;
}

export default function RepresentationsList({
  noticeId,
  userId,
  repLabel,
  repLabelPlural,
}: RepresentationsListProps) {
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<Representation | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'support' | 'objection' | 'comment'>('all');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { counts, refetch: refetchCounts } = useRepresentationCounts(noticeId, userId);

  useEffect(() => {
    loadRepresentations();
  }, [noticeId, userId]);

  const loadRepresentations = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/notices/${noticeId}/representations${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load ${repLabelPlural.toLowerCase()}: ${response.statusText}`);
      }

      const data = await response.json();
      setRepresentations(data.representations || []);
    } catch (err) {
      console.error('Failed to load representations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load representations');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (repId: string) => {
    try {
      const response = await fetch(`/api/representations/${repId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setRepresentations((prev) =>
        prev.map((rep) => (rep.id === repId ? { ...rep, is_read: true } : rep))
      );

      // Update selected rep if it's the one we marked
      if (selectedRep?.id === repId) {
        setSelectedRep({ ...selectedRep, is_read: true });
      }

      // Refetch counts
      refetchCounts();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleSelectRepresentation = async (rep: Representation) => {
    setSelectedRep(rep);

    // Mark as read when opening
    if (!rep.is_read) {
      await handleMarkAsRead(rep.id);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/representations/export?noticeId=${noticeId}&format=csv`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `representations-${noticeId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export CSV');
    }
  };

  const handleAddComment = async () => {
    if (!selectedRep || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/representations/${selectedRep.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName: 'Officer', // TODO: Get from auth context
          comment: commentText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const result = await response.json();

      // Update local state with new comment
      const updatedRep = {
        ...selectedRep,
        internal_notes: result.internal_notes || [],
      };

      setSelectedRep(updatedRep);
      setRepresentations((prev) =>
        prev.map((rep) => (rep.id === selectedRep.id ? updatedRep : rep))
      );

      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredRepresentations = representations.filter((rep) => {
    if (filter === 'unread') return !rep.is_read;
    if (filter === 'support' || filter === 'objection' || filter === 'comment') {
      return rep.stance === filter;
    }
    return true;
  });

  const getStanceColor = (stance: string | null) => {
    switch (stance) {
      case 'support':
        return 'bg-green-100 text-green-800';
      case 'objection':
        return 'bg-red-100 text-red-800';
      case 'comment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStance = (stance: string | null) => {
    return stance ? stance.charAt(0).toUpperCase() + stance.slice(1) : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p className="font-semibold mb-2">Error loading {repLabelPlural.toLowerCase()}</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadRepresentations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {repLabelPlural} {counts && `(${counts.total})`}
          </h2>
          {counts && counts.unread > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {counts.unread} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={representations.length === 0}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({representations.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread ({representations.filter((r) => !r.is_read).length})
        </button>
        <button
          onClick={() => setFilter('support')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'support'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Support ({representations.filter((r) => r.stance === 'support').length})
        </button>
        <button
          onClick={() => setFilter('objection')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'objection'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Objections ({representations.filter((r) => r.stance === 'objection').length})
        </button>
        <button
          onClick={() => setFilter('comment')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === 'comment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Comments ({representations.filter((r) => r.stance === 'comment').length})
        </button>
      </div>

      {filteredRepresentations.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p>
            {filter === 'all'
              ? `No ${repLabelPlural.toLowerCase()} yet. This page updates in real time.`
              : `No ${filter} ${repLabelPlural.toLowerCase()} found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List View */}
          <div className="space-y-3">
            {filteredRepresentations.map((rep) => (
              <button
                key={rep.id}
                onClick={() => handleSelectRepresentation(rep)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedRep?.id === rep.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${!rep.is_read ? 'font-semibold' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!rep.is_read && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStanceColor(rep.stance)}`}>
                      {formatStance(rep.stance)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(rep.submitted_at)}</span>
                </div>
                <p className="text-sm text-gray-900 mb-1">
                  {rep.respondent_name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">{rep.representation_text}</p>
              </button>
            ))}
          </div>

          {/* Detail View */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            {selectedRep ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStanceColor(selectedRep.stance)}`}>
                      {formatStance(selectedRep.stance)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedRep(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedRep.respondent_name || 'Anonymous'}
                  </h3>
                  {selectedRep.respondent_email && (
                    <p className="text-sm text-gray-600">{selectedRep.respondent_email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {formatDate(selectedRep.submitted_at)}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{repLabel} Text:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRep.representation_text}</p>
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes (Officer Only):</h4>

                  {selectedRep.internal_notes && selectedRep.internal_notes.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selectedRep.internal_notes.map((note, idx) => (
                        <div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900">{note.user_name}</span>
                            <span className="text-xs text-gray-500">{formatDate(note.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{note.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No internal notes yet.</p>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add internal note..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-gray-600">Select a {repLabel.toLowerCase()} to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
