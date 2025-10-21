import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  description: string | null;
  premises: any;
  applicant: any;
  consultation: any;
  licensing: any;
  representation_deadline: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  submitter_name: string;
  submitter_email: string;
  notes: string | null;
  organization: {
    name: string;
  };
  assigned_officer?: {
    email: string;
  };
}

export default function SubmissionReviewer() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug, submissionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          description,
          premises,
          applicant,
          consultation,
          licensing,
          representation_deadline,
          submitted_at,
          reviewed_at,
          submitter_name,
          submitter_email,
          notes,
          organization:submitting_organization_id (
            name
          ),
          assigned_officer:assigned_to (
            email
          )
        `)
        .eq('id', submissionId)
        .eq('receiving_department_id', department.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Submission not found');

      setSubmission(data as any);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submission');
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update submission status to approved
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          assigned_to: session.user.id
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      setSaving(false);
      setShowApproveModal(false);
      navigate(`/c/${orgSlug}/${deptSlug}/submissions`);
    } catch (err) {
      console.error('Failed to approve submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve');
      setSaving(false);
    }
  };

  const handleRequestChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'changes_requested',
          notes: feedbackText,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // TODO: Send email notification to submitter with feedback

      setSaving(false);
      setShowFeedbackModal(false);
      navigate(`/c/${orgSlug}/${deptSlug}/submissions`);
    } catch (err) {
      console.error('Failed to request changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to request changes');
      setSaving(false);
    }
  };

  const handleReject = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          notes: rejectionReason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // TODO: Send email notification to submitter with rejection reason

      setSaving(false);
      setShowRejectModal(false);
      navigate(`/c/${orgSlug}/${deptSlug}/submissions`);
    } catch (err) {
      console.error('Failed to reject submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject');
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNoticeType = (type: string) => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const canReview = ['owner', 'org_admin', 'department_admin', 'editor'].includes(userRole);

  if (!canReview) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to review submissions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">Submission not found</p>
      </div>
    );
  }

  const isNewSubmission = submission.status === 'new';
  const isInReview = submission.status === 'in_review';
  const canTakeAction = isNewSubmission || isInReview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Submission</h1>
          <p className="text-gray-600 mt-1">
            Review and approve notice submission from {submission.submitter_name}
          </p>
        </div>
        <button
          onClick={() => navigate(`/c/${orgSlug}/${deptSlug}/submissions`)}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← Back to Submissions
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submission Metadata */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Submitted by</h3>
            <p className="font-semibold text-gray-900">{submission.submitter_name}</p>
            <p className="text-sm text-gray-600">{submission.submitter_email}</p>
            <p className="text-sm text-gray-600">{submission.organization?.name || 'Unknown Org'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Submitted</h3>
            <p className="font-semibold text-gray-900">{formatDate(submission.submitted_at)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Notice Type</h3>
            <p className="font-semibold text-gray-900">{formatNoticeType(submission.notice_type)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              submission.status === 'new' ? 'bg-blue-100 text-blue-800' :
              submission.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
              submission.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {submission.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {submission.assigned_officer && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Assigned to: <span className="font-semibold text-gray-900">{submission.assigned_officer.email}</span>
            </p>
          </div>
        )}
      </div>

      {/* Submission Details */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notice Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                <p className="text-gray-900 font-medium">{submission.title}</p>
              </div>

              {submission.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <p className="text-gray-900">{submission.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Premises Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Premises</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              {submission.premises?.name && (
                <p className="font-semibold text-gray-900 mb-2">{submission.premises.name}</p>
              )}
              <p className="text-gray-700">
                {submission.premises?.address?.line1 && <>{submission.premises.address.line1}<br /></>}
                {submission.premises?.address?.line2 && <>{submission.premises.address.line2}<br /></>}
                {submission.premises?.address?.city && <>{submission.premises.address.city}<br /></>}
                {submission.premises?.address?.postcode}
              </p>
            </div>
          </div>

          {/* Applicant Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applicant</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              {submission.applicant?.name && (
                <p className="font-semibold text-gray-900 mb-2">{submission.applicant.name}</p>
              )}
              <p className="text-gray-700">
                {submission.applicant?.address?.line1 && <>{submission.applicant.address.line1}<br /></>}
                {submission.applicant?.address?.city && <>{submission.applicant.address.city}<br /></>}
                {submission.applicant?.address?.postcode}
              </p>
            </div>
          </div>

          {/* Licensing Activities */}
          {submission.licensing?.activities && submission.licensing.activities.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Licensable Activities</h2>
              <div className="flex flex-wrap gap-2">
                {submission.licensing.activities.map((activity: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          {submission.representation_deadline && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Dates</h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">Representation Deadline</p>
                <p className="font-semibold text-gray-900">
                  {new Date(submission.representation_deadline).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Previous Notes/Feedback */}
          {submission.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Feedback</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-gray-900">{submission.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canTakeAction && (
        <div className="flex items-center justify-between bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <button
            onClick={() => navigate(`/c/${orgSlug}/${deptSlug}/submissions`)}
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            Back to List
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Reject
            </button>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors"
            >
              Request Changes
            </button>

            <button
              onClick={() => setShowApproveModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Approve Submission</h3>
            <p className="text-gray-600 mb-6">
              This will approve the submission and make it ready for publication. The submitter will be notified.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Request Changes</h3>
            <p className="text-gray-600 mb-4">
              Provide feedback to the submitter about what needs to be changed.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-6"
              rows={5}
              placeholder="Explain what changes are needed..."
              required
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50"
                disabled={saving || !feedbackText.trim()}
              >
                {saving ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reject Submission</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this submission.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
              rows={5}
              placeholder="Explain why this submission is being rejected..."
              required
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={saving || !rejectionReason.trim()}
              >
                {saving ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
