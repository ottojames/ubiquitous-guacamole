import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug?: string;
}

interface Department {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
}

export default function NewSubmission() {
  const { organization } = useOutletContext<{ organization: Organization }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [councils, setCouncils] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [noticeType, setNoticeType] = useState('');
  const [title, setTitle] = useState('');

  // Form fields
  const [premisesName, setPremisesName] = useState('');
  const [premisesAddress, setPremisesAddress] = useState('');
  const [premisesPostcode, setPremisesPostcode] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [licensingActivities, setLicensingActivities] = useState('');
  const [representationDeadline, setRepresentationDeadline] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    loadCouncils();
  }, []);

  const loadCouncils = async () => {
    try {
      // Load all council departments
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          organization_id,
          organization:organizations!inner (
            id,
            name,
            type
          )
        `)
        .eq('organization.type', 'council')
        .eq('type', 'licensing');

      if (error) throw error;

      const departments = data?.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        organization_id: dept.organization.id,
        organization_name: dept.organization.name
      })) || [];

      setCouncils(departments);
    } catch (err) {
      console.error('Failed to load councils:', err);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('submissions')
        .insert({
          submitting_organization_id: organization.id,
          receiving_department_id: selectedDepartment,
          submitter_name: session.user.email?.split('@')[0] || 'User',
          submitter_email: session.user.email,
          title,
          notice_type: noticeType,
          status: 'draft',
          premises_name: premisesName,
          premises_address: premisesAddress,
          premises_postcode: premisesPostcode,
          applicant_name: applicantName,
          applicant_address: applicantAddress,
          licensing_activities: licensingActivities,
          representation_deadline: representationDeadline || null,
          expires_at: expiryDate || null,
          additional_info: additionalInfo
        });

      if (error) throw error;

      navigate(`/f/${organization.slug}/submissions`);
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedDepartment || !noticeType || !title || !premisesName || !applicantName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('submissions')
        .insert({
          submitting_organization_id: organization.id,
          receiving_department_id: selectedDepartment,
          submitter_name: session.user.email?.split('@')[0] || 'User',
          submitter_email: session.user.email,
          title,
          notice_type: noticeType,
          status: 'new',
          submitted_at: new Date().toISOString(),
          premises_name: premisesName,
          premises_address: premisesAddress,
          premises_postcode: premisesPostcode,
          applicant_name: applicantName,
          applicant_address: applicantAddress,
          licensing_activities: licensingActivities,
          representation_deadline: representationDeadline || null,
          expires_at: expiryDate || null,
          additional_info: additionalInfo
        });

      if (error) throw error;

      navigate(`/f/${organization.slug}/submissions`);
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const noticeTypes = [
    { value: 'premises_licence', label: 'Premises Licence (New Application)' },
    { value: 'variation', label: 'Variation of Premises Licence' },
    { value: 'minor_variation', label: 'Minor Variation' },
    { value: 'review', label: 'Review of Premises Licence' },
    { value: 'provisional_statement', label: 'Provisional Statement' },
    { value: 'club_premises', label: 'Club Premises Certificate' },
    { value: 'club_variation', label: 'Variation of Club Premises Certificate' },
    { value: 'transfer', label: 'Transfer of Premises Licence' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Submission</h1>
        <p className="text-gray-600 mt-1">Submit a licensing application to a council</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 space-y-6">
        {/* Target Council */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Target Council / Department <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a council...</option>
            {councils.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.organization_name} - {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notice Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notice Type <span className="text-red-500">*</span>
          </label>
          <select
            value={noticeType}
            onChange={(e) => setNoticeType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select notice type...</option>
            {noticeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Application Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Premises Licence for The Red Lion"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Premises Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Premises Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Premises Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={premisesName}
                onChange={(e) => setPremisesName(e.target.value)}
                placeholder="e.g., The Red Lion"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Premises Address
              </label>
              <textarea
                value={premisesAddress}
                onChange={(e) => setPremisesAddress(e.target.value)}
                placeholder="Full address including street, town"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Postcode
              </label>
              <input
                type="text"
                value={premisesPostcode}
                onChange={(e) => setPremisesPostcode(e.target.value)}
                placeholder="e.g., SW1A 1AA"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Applicant Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Applicant Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Applicant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Full name or company name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Applicant Address
              </label>
              <textarea
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                placeholder="Applicant's registered address"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Licensing Activities */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Licensing Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Licensable Activities
              </label>
              <textarea
                value={licensingActivities}
                onChange={(e) => setLicensingActivities(e.target.value)}
                placeholder="e.g., Sale of alcohol, Live music, Late night refreshment"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">List all licensable activities being applied for</p>
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Important Dates</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Representation Deadline
              </label>
              <input
                type="date"
                value={representationDeadline}
                onChange={(e) => setRepresentationDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Any additional details or notes for the licensing officer"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
