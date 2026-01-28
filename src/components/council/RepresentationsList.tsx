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
  const [showReportModal, setShowReportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { counts, refetch: refetchCounts } = useRepresentationCounts(noticeId, userId);

  useEffect(() => {
    loadRepresentations();
  }, [noticeId, userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadRepresentations();
      refetchCounts();
    } finally {
      setIsRefreshing(false);
    }
  };

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
      const response = await fetch(`/api/notices/${noticeId}/representations/${repId}/mark-read`, {
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

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all representations as read
      await Promise.all(
        representations
          .filter((rep) => !rep.is_read)
          .map((rep) => handleMarkAsRead(rep.id))
      );

      // Update all to read
      setRepresentations((prev) => prev.map((rep) => ({ ...rep, is_read: true })));
      refetchCounts();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      alert('Failed to mark all as read');
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
      // The API returns { success, comment, representation, internal_notes }
      const updatedRep = {
        ...selectedRep,
        internal_notes: result.representation?.internal_notes || result.internal_notes || [],
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh representations"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={representations.filter((r) => !r.is_read).length === 0}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark All as Read
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            disabled={representations.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Prepare Report
          </button>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Officer's Report Summary</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-semibold mb-1">Total Objections</p>
                  <p className="text-3xl font-bold text-red-700">
                    {representations.filter((r) => r.stance === 'objection').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm text-green-600 font-semibold mb-1">Total Support</p>
                  <p className="text-3xl font-bold text-green-700">
                    {representations.filter((r) => r.stance === 'support').length}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-1">Total Comments</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {representations.filter((r) => r.stance === 'comment').length}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  This application has received <strong>{representations.length} representations</strong> during
                  the statutory consultation period. The breakdown is:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">•</span>
                    <span>
                      <strong>{representations.filter((r) => r.stance === 'objection').length} objections</strong>{' '}
                      primarily citing prevention of public nuisance and prevention of crime and disorder as licensing objectives.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">•</span>
                    <span>
                      <strong>{representations.filter((r) => r.stance === 'support').length} support submissions</strong>{' '}
                      emphasizing economic benefits and responsible management.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Key Objections */}
              {representations.filter((r) => r.stance === 'objection').length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Objections Raised</h3>
                  <div className="space-y-3">
                    {representations.filter((r) => r.stance === 'objection').map((rep) => (
                      <div key={rep.id} className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{rep.respondent_name || 'Anonymous'}</p>
                          <span className="text-xs text-gray-500">{formatDate(rep.submitted_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{rep.representation_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Statements */}
              {representations.filter((r) => r.stance === 'support').length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Support Statements</h3>
                  <div className="space-y-3">
                    {representations.filter((r) => r.stance === 'support').map((rep) => (
                      <div key={rep.id} className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{rep.respondent_name || 'Anonymous'}</p>
                          <span className="text-xs text-gray-500">{formatDate(rep.submitted_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{rep.representation_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Officer Recommendation Template */}
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Officer Recommendation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This section should be completed by the licensing officer after reviewing all representations
                  and considering the four licensing objectives.
                </p>
                <div className="bg-white p-4 rounded-lg border border-amber-300">
                  <p className="text-sm text-gray-500 italic">
                    "Having considered the {representations.length} representations received, the licensing objectives,
                    and the council's Statement of Licensing Policy, the officer recommends that the Licensing
                    Sub-Committee should [GRANT/REFUSE/GRANT WITH CONDITIONS] this application because..."
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to CSV
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
