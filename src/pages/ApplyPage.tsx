import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import CouncilSelector from '@/components/applicant/CouncilSelector';

export default function ApplyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resubmitId = searchParams.get('resubmit');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Council selection
  const [selectedCouncil, setSelectedCouncil] = useState('');

  // Notice details
  const [noticeType, setNoticeType] = useState('premises_licence_new');
  const [title, setTitle] = useState('');

  // Premises details
  const [premisesName, setPremisesName] = useState('');
  const [premisesAddress, setPremisesAddress] = useState('');
  const [premisesPostcode, setPremisesPostcode] = useState('');

  // Applicant details
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');

  // Licensing details
  const [licensingActivities, setLicensingActivities] = useState('');
  const [representationDeadline, setRepresentationDeadline] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    if (resubmitId) {
      loadSubmissionForResubmit(resubmitId);
    }
  }, [resubmitId]);

  const loadSubmissionForResubmit = async (submissionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      // Pre-populate form with existing data
      setSelectedCouncil(data.receiving_department_id);
      setNoticeType(data.notice_type);
      setTitle(data.title);
      setPremisesName(data.premises_name);
      setPremisesAddress(data.premises_address);
      setPremisesPostcode(data.premises_postcode);
      setApplicantName(data.applicant_name);
      setApplicantEmail(data.applicant_email);
      setApplicantAddress(data.applicant_address);
      setLicensingActivities(data.licensing_activities);
      setRepresentationDeadline(data.representation_deadline || '');
      setExpiryDate(data.expires_at || '');
      setAdditionalInfo(data.additional_info || '');

      setLoading(false);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (resubmitId) {
        // Update existing submission
        const { error } = await supabase
          .from('submissions')
          .update({
            receiving_department_id: selectedCouncil,
            title,
            notice_type: noticeType,
            status: 'new', // Reset to new for re-review
            premises_name: premisesName,
            premises_address: premisesAddress,
            premises_postcode: premisesPostcode,
            applicant_name: applicantName,
            applicant_email: applicantEmail,
            applicant_address: applicantAddress,
            licensing_activities: licensingActivities,
            representation_deadline: representationDeadline || null,
            expires_at: expiryDate || null,
            additional_info: additionalInfo,
            submitted_at: new Date().toISOString()
          })
          .eq('id', resubmitId);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('submissions')
          .insert({
            receiving_department_id: selectedCouncil,
            title,
            notice_type: noticeType,
            status: 'new',
            premises_name: premisesName,
            premises_address: premisesAddress,
            premises_postcode: premisesPostcode,
            applicant_name: applicantName,
            applicant_email: applicantEmail,
            applicant_address: applicantAddress,
            licensing_activities: licensingActivities,
            representation_deadline: representationDeadline || null,
            expires_at: expiryDate || null,
            additional_info: additionalInfo,
            submitted_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Send magic link to applicant's email for tracking
      await supabase.auth.signInWithOtp({
        email: applicantEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/applicant/dashboard`,
        },
      });

      // Navigate to success page
      navigate('/apply/success');
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(`Failed to submit application: ${err.message}`);
      setSubmitting(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {resubmitId ? 'Resubmit Your Application' : 'Submit a Licensing Application'}
          </h1>
          <p className="text-gray-600 mt-2">
            {resubmitId
              ? 'Update your application based on council feedback'
              : 'Complete the form below and we\'ll send you a magic link to track your application status'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          {/* Council Selection */}
          <div className="mb-8">
            <CouncilSelector
              value={selectedCouncil}
              onChange={setSelectedCouncil}
              noticeType={noticeType}
            />
          </div>

          {/* Notice Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notice Type <span className="text-red-500">*</span>
            </label>
            <select
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="premises_licence_new">Premises Licence - New</option>
              <option value="premises_licence_variation">Premises Licence - Variation</option>
              <option value="premises_licence_minor_variation">Premises Licence - Minor Variation</option>
              <option value="club_premises_certificate">Club Premises Certificate</option>
              <option value="provisional_statement">Provisional Statement</option>
              <option value="review_of_premises_licence">Review of Premises Licence</option>
              <option value="transfer_of_premises_licence">Transfer of Premises Licence</option>
              <option value="temporary_event_notice">Temporary Event Notice</option>
            </select>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Application Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., The Blue Bell Pub - New Premises Licence"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Premises Information */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Premises Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Premises Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={premisesName}
                onChange={(e) => setPremisesName(e.target.value)}
                required
                placeholder="e.g., The Blue Bell Pub"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Premises Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={premisesAddress}
                onChange={(e) => setPremisesAddress(e.target.value)}
                required
                rows={3}
                placeholder="e.g., 123 High Street, London"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={premisesPostcode}
                onChange={(e) => setPremisesPostcode(e.target.value.toUpperCase())}
                required
                placeholder="e.g., SW1A 1AA"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Applicant Information */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Applicant Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Applicant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                placeholder="e.g., John Smith or Smith Enterprises Ltd"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send you a magic link to track your application status
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Applicant Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                required
                rows={3}
                placeholder="e.g., 456 Business Park, London"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Licensing Activities */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Licensable Activities</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activities and Hours <span className="text-red-500">*</span>
              </label>
              <textarea
                value={licensingActivities}
                onChange={(e) => setLicensingActivities(e.target.value)}
                required
                rows={6}
                placeholder="e.g., Sale of alcohol for consumption on premises&#10;Monday - Saturday: 11:00 - 23:00&#10;Sunday: 12:00 - 22:30&#10;&#10;Live music on Friday and Saturday evenings"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe all licensable activities and operating hours
              </p>
            </div>
          </div>

          {/* Important Dates */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Important Dates</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Representation Deadline
                </label>
                <input
                  type="date"
                  value={representationDeadline}
                  onChange={(e) => setRepresentationDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  28 days from submission is typical
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Licence Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes for Licensing Officer
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                placeholder="Any additional information that may help the council process your application"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : (resubmitId ? 'Resubmit Application' : 'Submit Application')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {!resubmitId && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              After submitting, you'll receive a magic link via email to track your application status
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
