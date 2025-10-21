import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Notice {
  id: string;
  title: string;
  notice_type: string;
  published_at: string;
  representation_deadline: string | null;
  expires_at: string | null;
  premises_name: string | null;
  premises_address: string | null;
  premises_postcode: string | null;
  applicant_name: string | null;
  applicant_address: string | null;
  licensing_activities: string | null;
  additional_info: string | null;
  department_id: string;
  department: {
    id: string;
    name: string;
    organization: {
      name: string;
    };
  };
}

export default function PublicNoticeDetail() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [respondentType, setRespondentType] = useState<'resident' | 'business' | 'organization'>('resident');
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadNotice();
  }, [noticeId]);

  const loadNotice = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`
          id,
          title,
          notice_type,
          published_at,
          representation_deadline,
          expires_at,
          premises_name,
          premises_address,
          premises_postcode,
          applicant_name,
          applicant_address,
          licensing_activities,
          additional_info,
          department_id,
          department:department_id (
            id,
            name,
            organization:organization_id (
              name
            )
          )
        `)
        .eq('id', noticeId)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      const formatted = {
        ...data,
        department: {
          id: data.department.id,
          name: data.department.name,
          organization: {
            name: data.department.organization.name
          }
        }
      };

      setNotice(formatted as Notice);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load notice:', err);
      setLoading(false);
    }
  };

  const handleSubmitRepresentation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!respondentName || !respondentEmail || !comment) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('representations').insert({
        notice_id: notice!.id,
        department_id: notice!.department_id,
        respondent_name: respondentName,
        respondent_email: respondentEmail,
        respondent_type: respondentType,
        comment: comment,
        status: 'new',
        submitted_at: new Date().toISOString()
      });

      if (error) throw error;

      alert('Your representation has been submitted successfully. The council will review your comments.');

      // Reset form
      setRespondentName('');
      setRespondentEmail('');
      setComment('');
      setShowForm(false);
      setSubmitting(false);
    } catch (err) {
      console.error('Failed to submit representation:', err);
      alert('Failed to submit representation. Please try again.');
      setSubmitting(false);
    }
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
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

  if (!notice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Notice not found</p>
            <Link to="/public/notices" className="text-blue-600 hover:text-blue-700">
              ← Back to Notices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(notice.representation_deadline);
  const canRespond = daysRemaining !== null && daysRemaining > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Back Link */}
        <Link to="/public/notices" className="text-blue-600 hover:text-blue-700 inline-block">
          ← Back to Notices
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{notice.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-semibold">{notice.department.organization.name}</span>
            </div>
            <span>•</span>
            <span>{notice.department.name}</span>
            <span>•</span>
            <span>Published {formatDate(notice.published_at)}</span>
          </div>

          <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-xl inline-block text-sm font-semibold">
            {notice.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </div>
        </div>

        {/* Deadline Alert */}
        {canRespond && (
          <div className={`rounded-3xl p-6 ${daysRemaining! <= 7 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-start gap-3">
              <svg className={`w-6 h-6 flex-shrink-0 ${daysRemaining! <= 7 ? 'text-orange-600' : 'text-green-600'}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`font-semibold ${daysRemaining! <= 7 ? 'text-orange-900' : 'text-green-900'}`}>
                  {daysRemaining === 1 ? '1 day remaining' : `${daysRemaining} days remaining`} to submit representations
                </p>
                <p className={`text-sm ${daysRemaining! <= 7 ? 'text-orange-700' : 'text-green-700'}`}>
                  Deadline: {formatDate(notice.representation_deadline)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!canRespond && notice.representation_deadline && (
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
            <p className="text-gray-700">
              The deadline for submitting representations has passed ({formatDate(notice.representation_deadline)})
            </p>
          </div>
        )}

        {/* Premises Details */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Premises Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Premises Name</p>
              <p className="font-semibold text-gray-900">{notice.premises_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-gray-900">{notice.premises_address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Postcode</p>
              <p className="font-mono text-gray-900">{notice.premises_postcode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Applicant Details */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Applicant Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Applicant Name</p>
              <p className="font-semibold text-gray-900">{notice.applicant_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-gray-900">{notice.applicant_address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Licensing Details */}
        {notice.licensing_activities && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Licensable Activities</h2>
            <p className="text-gray-900 whitespace-pre-wrap">{notice.licensing_activities}</p>
          </div>
        )}

        {/* Additional Information */}
        {notice.additional_info && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
            <p className="text-gray-900 whitespace-pre-wrap">{notice.additional_info}</p>
          </div>
        )}

        {/* Submit Representation Section */}
        {canRespond && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit a Representation</h2>
            <p className="text-gray-600 mb-6">
              If you have comments or objections regarding this application, you can submit a representation to the council.
              Your submission will be reviewed by the licensing officer.
            </p>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Submit Your Representation
              </button>
            ) : (
              <form onSubmit={handleSubmitRepresentation} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Respondent Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={respondentType}
                    onChange={(e) => setRespondentType(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="resident">Resident</option>
                    <option value="business">Business</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={6}
                    placeholder="Please provide your comments or objections regarding this application..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Representation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
