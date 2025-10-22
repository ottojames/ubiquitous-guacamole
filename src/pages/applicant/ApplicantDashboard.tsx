import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  notes: string | null;
  receiving_department: {
    name: string;
    organization: {
      name: string;
    };
  };
}

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAuthAndLoadSubmissions();
  }, []);

  const checkAuthAndLoadSubmissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/applicant/sign-in');
        return;
      }

      setUserEmail(session.user.email || '');

      // Load submissions for this email
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
          receiving_department:departments!receiving_department_id (
            name,
            organization:organizations (
              name
            )
          )
        `)
        .eq('applicant_email', session.user.email)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((sub: any) => ({
        ...sub,
        receiving_department: {
          name: sub.receiving_department.name,
          organization: {
            name: sub.receiving_department.organization.name
          }
        }
      }));

      setSubmissions(formatted);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/applicant/sign-in');
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-1">{userEmail}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/apply"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              New Application
            </Link>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              Submit your first licensing application to get started
            </p>
            <Link
              to="/apply"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Submit Application
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/applicant/submissions/${submission.id}`}
                className="block bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{submission.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Submitted to:</span> {submission.receiving_department.organization.name} - {submission.receiving_department.name}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(submission.status)}
                  </div>
                </div>

                {submission.status === 'changes_requested' && submission.notes && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      ⚠️ Action Required
                    </p>
                    <p className="text-sm text-orange-700">{submission.notes}</p>
                  </div>
                )}

                {submission.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">
                      ✅ Application Approved
                    </p>
                    <p className="text-sm text-green-700">
                      Your application has been approved and will be published soon.
                    </p>
                  </div>
                )}

                {submission.status === 'rejected' && submission.notes && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-red-900 mb-2">
                      ❌ Application Rejected
                    </p>
                    <p className="text-sm text-red-700">{submission.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-4">
                  <div>
                    <span className="font-semibold">Submitted:</span> {formatDate(submission.submitted_at)}
                  </div>
                  {submission.reviewed_at && (
                    <div>
                      <span className="font-semibold">Reviewed:</span> {formatDate(submission.reviewed_at)}
                    </div>
                  )}
                  <div className="ml-auto">
                    <span className="text-blue-600 font-semibold">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Track Status</p>
              <p className="text-xs text-gray-600">
                Check your email for the magic link to access this page anytime
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Response Times</p>
              <p className="text-xs text-gray-600">
                Councils typically review applications within 5-10 working days
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Changes Requested</p>
              <p className="text-xs text-gray-600">
                Click on your application to view feedback and resubmit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
