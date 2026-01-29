import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
  };
}

interface ContextType {
  department: Department;
  userRole: string;
}

interface PendingNotice {
  id: string;
  title: string;
  notice_type: string;
  submitted_at: string;
  applicant_name: string | null;
  premises_address: string | null;
  representation_deadline: string | null;
  review_notes: string | null;
}

interface ApprovalModalState {
  isOpen: boolean;
  noticeId: string | null;
  action: 'approve' | 'reject' | null;
}

export default function PendingSubmissions() {
  const { department } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [pendingNotices, setPendingNotices] = useState<PendingNotice[]>([]);
  const [modalState, setModalState] = useState<ApprovalModalState>({
    isOpen: false,
    noticeId: null,
    action: null,
  });
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadPendingNotices();
  }, [department.id]);

  const loadPendingNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/council/pending-submissions?departmentId=${department.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pending submissions');
      }

      const data = await response.json();
      setPendingNotices(data.notices || []);
    } catch (err) {
      console.error('Failed to load pending notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDeadline = (deadline: string | null): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyIndicator = (deadline: string | null) => {
    const daysRemaining = getDaysUntilDeadline(deadline);
    if (daysRemaining === null) return null;

    if (daysRemaining < 3) {
      return {
        color: 'bg-red-500',
        label: 'Critical',
        tooltip: `${daysRemaining} days remaining - URGENT`,
      };
    } else if (daysRemaining < 7) {
      return {
        color: 'bg-amber-500',
        label: 'Soon',
        tooltip: `${daysRemaining} days remaining`,
      };
    }
    return null;
  };

  const openModal = (noticeId: string, action: 'approve' | 'reject') => {
    setModalState({
      isOpen: true,
      noticeId,
      action,
    });
    setReviewNotes('');
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      noticeId: null,
      action: null,
    });
    setReviewNotes('');
  };

  const handleApprove = async () => {
    if (!modalState.noticeId) return;

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/council/notices/${modalState.noticeId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve notice');
      }

      // Success - remove from pending list
      setPendingNotices(prev => prev.filter(n => n.id !== modalState.noticeId));
      closeModal();

      // Show success message
      alert('Notice approved and published successfully!');
    } catch (err) {
      console.error('Failed to approve notice:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve notice. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!modalState.noticeId) return;

    if (!reviewNotes.trim()) {
      alert('Review notes are required when rejecting a submission');
      return;
    }

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/council/notices/${modalState.noticeId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject notice');
      }

      // Success - remove from pending list
      setPendingNotices(prev => prev.filter(n => n.id !== modalState.noticeId));
      closeModal();

      // Show success message
      alert('Notice rejected. Applicant will be notified.');
    } catch (err) {
      console.error('Failed to reject notice:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject notice. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNoticeType = (type: string) => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Submissions</h1>
          <p className="text-gray-600 mt-1">
            Review and approve notices awaiting publication
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">Pending:</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">{pendingNotices.length}</span>
          </div>
        </div>
      </div>

      {/* Pending Notices List */}
      {pendingNotices.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg
            className="w-16 h-16 text-green-400 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg font-semibold mb-2">All caught up!</p>
          <p className="text-gray-500">There are no pending submissions requiring review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingNotices.map((notice) => {
            const urgency = getUrgencyIndicator(notice.representation_deadline);

            return (
              <div
                key={notice.id}
                className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {notice.title || 'Untitled Notice'}
                      </h3>
                      {urgency && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-3 h-3 ${urgency.color} rounded-full animate-pulse`}
                            title={urgency.tooltip}
                          ></span>
                          <span className="text-xs font-semibold text-gray-600">
                            {urgency.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Notice Type</p>
                        <p className="text-sm text-gray-900">{formatNoticeType(notice.notice_type)}</p>
                      </div>

                      {notice.applicant_name && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Applicant</p>
                          <p className="text-sm text-gray-900">{notice.applicant_name}</p>
                        </div>
                      )}

                      {notice.premises_address && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Premises</p>
                          <p className="text-sm text-gray-900">{notice.premises_address}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Submitted</p>
                        <p className="text-sm text-gray-900">{formatDate(notice.submitted_at)}</p>
                      </div>

                      {notice.representation_deadline && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Representation Deadline</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(notice.representation_deadline)}
                            {urgency && (
                              <span className="ml-2 text-xs font-semibold text-amber-600">
                                ({getDaysUntilDeadline(notice.representation_deadline)} days)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {urgency && urgency.color === 'bg-red-500' && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-red-800 font-semibold">
                          ⚠️ Critical: This notice must be published urgently to meet statutory deadlines
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 ml-6">
                    <button
                      onClick={() => openModal(notice.id, 'approve')}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => openModal(notice.id, 'reject')}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalState.action === 'approve' ? 'Approve Notice' : 'Reject Notice'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={actionInProgress}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {modalState.action === 'approve' ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800">
                      <strong>Approving this notice will:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-green-700 mt-2 space-y-1">
                      <li>Change status to 'published'</li>
                      <li>Set publication timestamp</li>
                      <li>Make the notice publicly visible</li>
                      <li>Start the representation period</li>
                      <li>Log this action in the audit trail</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800">
                      <strong>Rejecting this notice will:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                      <li>Change status to 'rejected'</li>
                      <li>Notify the applicant/submitter</li>
                      <li>Require amendments before resubmission</li>
                      <li>Log this action with your notes</li>
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes {modalState.action === 'reject' && <span className="text-red-600">*</span>}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      modalState.action === 'approve'
                        ? 'Optional: Add any notes about this approval...'
                        : 'Required: Explain why this notice is being rejected and what needs to be corrected...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {modalState.action === 'reject' && !reviewNotes.trim() && (
                    <p className="mt-2 text-sm text-red-600">
                      Review notes are mandatory when rejecting a submission
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={modalState.action === 'approve' ? handleApprove : handleReject}
                  disabled={actionInProgress || (modalState.action === 'reject' && !reviewNotes.trim())}
                  className={`px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                    modalState.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionInProgress
                    ? modalState.action === 'approve'
                      ? 'Approving...'
                      : 'Rejecting...'
                    : modalState.action === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
