import { useEffect, useState } from 'react';
import { useOutletContext, useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  premises_name: string | null;
  premises_address: string | null;
  premises_postcode: string | null;
  applicant_name: string | null;
  applicant_address: string | null;
  licensing_activities: string | null;
  representation_deadline: string | null;
  expires_at: string | null;
  additional_info: string | null;
  submitter_name: string;
  submitter_email: string;
  receiving_department: {
    name: string;
    organization: {
      name: string;
    };
  };
  assigned_officer?: {
    email: string;
  };
}

export default function SubmissionDetail() {
  const { organization } = useOutletContext<{ organization: Organization }>();
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          reviewed_at,
          notes,
          premises_name,
          premises_address,
          premises_postcode,
          applicant_name,
          applicant_address,
          licensing_activities,
          representation_deadline,
          expires_at,
          additional_info,
          submitter_name,
          submitter_email,
          receiving_department:receiving_department_id (
            name,
            organization:organization_id (
              name
            )
          ),
          assigned_officer:assigned_to (
            email
          )
        `)
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      setSubmission(data as Submission);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'new':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Pending Review';
      case 'in_review':
        return 'Under Review';
      case 'changes_requested':
        return 'Changes Requested';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Submission not found</p>
        <Link
          to={`/f/${organization.slug}/submissions`}
          className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block"
        >
          ← Back to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/f/${organization.slug}/submissions`}
            className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-block"
          >
            ← Back to Submissions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{submission.title}</h1>
          <p className="text-gray-600 mt-1">
            {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        </div>
        <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
          {getStatusLabel(submission.status)}
        </span>
      </div>

      {/* Status Info */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Submission Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Submitted To</p>
            <p className="font-semibold text-gray-900">
              {submission.receiving_department.organization.name}
            </p>
            <p className="text-sm text-gray-600">{submission.receiving_department.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted On</p>
            <p className="font-semibold text-gray-900">{formatDate(submission.submitted_at)}</p>
          </div>
          {submission.reviewed_at && (
            <div>
              <p className="text-sm text-gray-600">Reviewed On</p>
              <p className="font-semibold text-gray-900">{formatDate(submission.reviewed_at)}</p>
            </div>
          )}
          {submission.assigned_officer && (
            <div>
              <p className="text-sm text-gray-600">Assigned Officer</p>
              <p className="font-semibold text-gray-900">{submission.assigned_officer.email}</p>
            </div>
          )}
        </div>

        {/* Feedback / Notes */}
        {submission.notes && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-sm font-semibold text-orange-900 mb-2">
              {submission.status === 'rejected' ? 'Rejection Reason:' : 'Feedback from Licensing Officer:'}
            </p>
            <p className="text-sm text-orange-800 whitespace-pre-wrap">{submission.notes}</p>
          </div>
        )}
      </div>

      {/* Premises Details */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Premises Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Premises Name</p>
            <p className="font-semibold text-gray-900">{submission.premises_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="text-gray-900">{submission.premises_address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Postcode</p>
            <p className="text-gray-900">{submission.premises_postcode || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Applicant Details */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Applicant Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Applicant Name</p>
            <p className="font-semibold text-gray-900">{submission.applicant_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="text-gray-900">{submission.applicant_address || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Licensing Details */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Licensing Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Licensable Activities</p>
            <p className="text-gray-900 whitespace-pre-wrap">{submission.licensing_activities || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Representation Deadline</p>
              <p className="text-gray-900">
                {submission.representation_deadline
                  ? new Date(submission.representation_deadline).toLocaleDateString('en-GB')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiry Date</p>
              <p className="text-gray-900">
                {submission.expires_at
                  ? new Date(submission.expires_at).toLocaleDateString('en-GB')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {submission.additional_info && (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h2>
          <p className="text-gray-900 whitespace-pre-wrap">{submission.additional_info}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {submission.status === 'changes_requested' && (
          <button
            onClick={() => navigate(`/f/${organization.slug}/new-submission?resubmit=${submission.id}`)}
            className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
          >
            Resubmit with Changes
          </button>
        )}
        {submission.status === 'published' && (
          <Link
            to={`/notices/${submission.id}`}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center"
          >
            View Published Notice
          </Link>
        )}
      </div>
    </div>
  );
}
