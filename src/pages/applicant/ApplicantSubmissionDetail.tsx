import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SubmissionDetail {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  notes: string | null;
  premises_name: string;
  premises_address: string;
  premises_postcode: string;
  applicant_name: string;
  applicant_address: string;
  applicant_email: string;
  licensing_activities: string;
  representation_deadline: string;
  expiry_date: string | null;
  additional_info: string | null;
  receiving_department: {
    name: string;
    organization: {
      name: string;
    };
  };
  reviewed_by?: {
    email: string;
  };
}

export default function ApplicantSubmissionDetail() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndLoadSubmission();
  }, [submissionId]);

  const checkAuthAndLoadSubmission = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/applicant/sign-in');
        return;
      }

      // Load submission details
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          receiving_department:departments!receiving_department_id (
            name,
            organization:organizations (
              name
            )
          ),
          reviewed_by:profiles!reviewed_by_id (
            email
          )
        `)
        .eq('id', submissionId)
        .eq('applicant_email', session.user.email)
        .single();

      if (error) {
        console.error('Failed to load submission:', error);
        setError('Submission not found or you do not have access to it.');
        setLoading(false);
        return;
      }

      setSubmission({
        ...data,
        receiving_department: {
          name: data.receiving_department.name,
          organization: {
            name: data.receiving_department.organization.name
          }
        },
        reviewed_by: data.reviewed_by || undefined
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setError('Failed to load submission details.');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      changes_requested: 'bg-orange-100 text-orange-800',
      published: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      new: 'Pending Review',
      in_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Changes Requested',
      published: 'Published'
    };

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Submission Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/applicant/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/applicant/dashboard"
              className="text-blue-600 hover:text-blue-700 font-semibold mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{submission.title}</h1>
            <p className="text-gray-600 mt-1">
              {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>
          <div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Submitted To</p>
              <p className="text-sm text-gray-600">
                {submission.receiving_department.organization.name} - {submission.receiving_department.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Submitted Date</p>
              <p className="text-sm text-gray-600">{formatDate(submission.submitted_at)}</p>
            </div>
            {submission.reviewed_at && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Reviewed Date</p>
                <p className="text-sm text-gray-600">{formatDate(submission.reviewed_at)}</p>
              </div>
            )}
            {submission.reviewed_by && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Reviewed By</p>
                <p className="text-sm text-gray-600">{submission.reviewed_by.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback/Notes Alert */}
        {submission.status === 'changes_requested' && submission.notes && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">⚠️ Action Required - Changes Requested</h3>
                <p className="text-sm text-orange-700 mb-4 whitespace-pre-wrap">{submission.notes}</p>
                <Link
                  to={`/apply?resubmit=${submission.id}`}
                  className="inline-block px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
                >
                  Resubmit Application
                </Link>
              </div>
            </div>
          </div>
        )}

        {submission.status === 'approved' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">✅ Application Approved</h3>
                <p className="text-sm text-green-700">
                  Your application has been approved by {submission.receiving_department.organization.name}. It will be published soon for public representations.
                </p>
                {submission.notes && (
                  <p className="text-sm text-green-700 mt-2 whitespace-pre-wrap">{submission.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {submission.status === 'rejected' && submission.notes && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">❌ Application Rejected</h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{submission.notes}</p>
              </div>
            </div>
          </div>
        )}

        {submission.status === 'published' && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-purple-900 mb-2">📢 Published</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Your application has been published for public viewing and representations.
                </p>
                <Link
                  to={`/public/notices`}
                  className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  View Public Notice
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Application Details */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Application Details</h2>

          {/* Premises Information */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Premises Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Premises Name</p>
                <p className="text-sm text-gray-600">{submission.premises_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Postcode</p>
                <p className="text-sm text-gray-600">{submission.premises_postcode}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
                <p className="text-sm text-gray-600">{submission.premises_address}</p>
              </div>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Applicant Name</p>
                <p className="text-sm text-gray-600">{submission.applicant_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                <p className="text-sm text-gray-600">{submission.applicant_email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
                <p className="text-sm text-gray-600">{submission.applicant_address}</p>
              </div>
            </div>
          </div>

          {/* Licensing Activities */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Licensable Activities</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{submission.licensing_activities}</p>
          </div>

          {/* Important Dates */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Representation Deadline</p>
                <p className="text-sm text-gray-600">{formatDate(submission.representation_deadline)}</p>
              </div>
              {submission.expiry_date && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Expiry Date</p>
                  <p className="text-sm text-gray-600">{formatDate(submission.expiry_date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {submission.additional_info && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{submission.additional_info}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            to="/applicant/dashboard"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
          {submission.status === 'changes_requested' && (
            <Link
              to={`/apply?resubmit=${submission.id}`}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Resubmit Application
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
