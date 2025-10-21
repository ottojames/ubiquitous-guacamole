import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type OrgType = 'council' | 'firm';
type Step = 'type' | 'info' | 'departments' | 'review';

interface Department {
  name: string;
  slug: string;
  type: string;
  email: string;
  description?: string;
}

interface OrgData {
  type: OrgType | null;
  name: string;
  domain: string;
  contactEmail: string;
  registrationNumber?: string;
  departments: Department[];
}

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgData, setOrgData] = useState<OrgData>({
    type: null,
    name: '',
    domain: '',
    contactEmail: '',
    registrationNumber: '',
    departments: []
  });

  const [currentDept, setCurrentDept] = useState<Department>({
    name: '',
    slug: '',
    type: 'licensing',
    email: '',
    description: ''
  });

  const selectOrgType = (type: OrgType) => {
    setOrgData({ ...orgData, type });
    setStep('info');
  };

  const handleInfoNext = () => {
    if (!orgData.name || !orgData.domain || !orgData.contactEmail) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);

    if (orgData.type === 'council') {
      setStep('departments');
    } else {
      setStep('review');
    }
  };

  const addDepartment = () => {
    if (!currentDept.name || !currentDept.slug || !currentDept.email) {
      setError('Please fill in department name, slug, and email');
      return;
    }
    setError(null);
    setOrgData({
      ...orgData,
      departments: [...orgData.departments, currentDept]
    });
    setCurrentDept({
      name: '',
      slug: '',
      type: 'licensing',
      email: '',
      description: ''
    });
  };

  const removeDepartment = (index: number) => {
    setOrgData({
      ...orgData,
      departments: orgData.departments.filter((_, i) => i !== index)
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (name: string) => {
    setCurrentDept({
      ...currentDept,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be signed in to create an organization');
        setLoading(false);
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          type: orgData.type,
          name: orgData.name,
          domain: orgData.domain,
          contact_email: orgData.contactEmail,
          registration_number: orgData.registrationNumber || null,
          status: 'pending_approval',
          created_by: session.user.id
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Organization membership will be auto-created by trigger
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create departments (for councils)
      if (orgData.type === 'council' && orgData.departments.length > 0) {
        const deptInserts = orgData.departments.map(dept => ({
          organization_id: org.id,
          name: dept.name,
          slug: dept.slug,
          type: dept.type,
          email: dept.email,
          description: dept.description || null,
          created_by: session.user.id
        }));

        const { error: deptError } = await supabase
          .from('departments')
          .insert(deptInserts);

        if (deptError) throw deptError;
      }

      // Navigate based on org type
      if (orgData.type === 'firm') {
        navigate(`/f/${org.id}/dashboard`);
      } else {
        // For councils, navigate to callback to handle routing
        navigate('/auth/callback');
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      setLoading(false);
    }
  };

  const departmentTypes = [
    { value: 'licensing', label: 'Licensing' },
    { value: 'planning', label: 'Planning' },
    { value: 'traffic', label: 'Traffic Management' },
    { value: 'environmental_health', label: 'Environmental Health' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Organization
          </h1>
          <p className="text-gray-600">
            {step === 'type' && 'Choose the type of organization you want to create'}
            {step === 'info' && 'Tell us about your organization'}
            {step === 'departments' && 'Add departments to your council'}
            {step === 'review' && 'Review and confirm your organization details'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          <div className={`w-3 h-3 rounded-full ${step === 'type' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'info' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          {orgData.type === 'council' && (
            <div className={`w-3 h-3 rounded-full ${step === 'departments' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
          <div className={`w-3 h-3 rounded-full ${step === 'review' ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Organization Type */}
        {step === 'type' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => selectOrgType('council')}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Council
              </h3>
              <p className="text-gray-600 mb-4">
                Local authority managing public notices across multiple departments
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Multiple departments
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Public notice publication
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Representation management
                </li>
              </ul>
            </button>

            <button
              onClick={() => selectOrgType('firm')}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Law Firm
              </h3>
              <p className="text-gray-600 mb-4">
                Legal practice submitting notices on behalf of clients
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Client management
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Notice submissions
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Application tracking
                </li>
              </ul>
            </button>
          </div>
        )}

        {/* Step 2: Basic Information */}
        {step === 'info' && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sampleton Borough Council"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain *
                </label>
                <input
                  type="text"
                  value={orgData.domain}
                  onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., sampleton.gov.uk"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email domain for your organization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={orgData.contactEmail}
                  onChange={(e) => setOrgData({ ...orgData, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., contact@sampleton.gov.uk"
                  required
                />
              </div>

              {orgData.type === 'firm' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={orgData.registrationNumber}
                    onChange={(e) => setOrgData({ ...orgData, registrationNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., OC123456"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Companies House or SRA registration number
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep('type')}
                className="text-gray-600 hover:text-gray-900 font-semibold"
              >
                ← Back
              </button>
              <button
                onClick={handleInfoNext}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Departments (councils only) */}
        {step === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Department
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={currentDept.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Licensing Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={currentDept.slug}
                    onChange={(e) => setCurrentDept({ ...currentDept, slug: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., licensing"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Used in URLs: /c/your-council/<strong>{currentDept.slug || 'slug'}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Type *
                  </label>
                  <select
                    value={currentDept.type}
                    onChange={(e) => setCurrentDept({ ...currentDept, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={currentDept.email}
                    onChange={(e) => setCurrentDept({ ...currentDept, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., licensing@sampleton.gov.uk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentDept.description}
                    onChange={(e) => setCurrentDept({ ...currentDept, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the department's responsibilities"
                  />
                </div>

                <button
                  onClick={addDepartment}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  + Add Department
                </button>
              </div>
            </div>

            {/* Added Departments */}
            {orgData.departments.length > 0 && (
              <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Added Departments ({orgData.departments.length})
                </h3>
                <div className="space-y-3">
                  {orgData.departments.map((dept, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                        <p className="text-sm text-gray-600">
                          /{dept.slug} • {departmentTypes.find(t => t.value === dept.type)?.label}
                        </p>
                      </div>
                      <button
                        onClick={() => removeDepartment(index)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('info')}
                className="text-gray-600 hover:text-gray-900 font-semibold"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {orgData.departments.length > 0 ? 'Next →' : 'Skip & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Review Your Organization
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Organization Type</h4>
                <p className="text-lg text-gray-900 capitalize">{orgData.type}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
                <p className="text-lg text-gray-900">{orgData.name}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Domain</h4>
                <p className="text-lg text-gray-900">{orgData.domain}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Email</h4>
                <p className="text-lg text-gray-900">{orgData.contactEmail}</p>
              </div>

              {orgData.registrationNumber && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Registration Number</h4>
                  <p className="text-lg text-gray-900">{orgData.registrationNumber}</p>
                </div>
              )}

              {orgData.type === 'council' && orgData.departments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Departments ({orgData.departments.length})
                  </h4>
                  <div className="space-y-2">
                    {orgData.departments.map((dept, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-xl"
                      >
                        <p className="font-semibold text-gray-900">{dept.name}</p>
                        <p className="text-sm text-gray-600">
                          {departmentTypes.find(t => t.value === dept.type)?.label} • {dept.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  Your organization will be created with pending approval status.
                  You'll be able to access your dashboard immediately and start setting up your workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(orgData.type === 'council' ? 'departments' : 'info')}
                className="text-gray-600 hover:text-gray-900 font-semibold"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Links */}
        {step === 'type' && (
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an organization?{' '}
              <button
                onClick={() => navigate('/auth/sign-in')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign In
              </button>
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 text-sm block mx-auto"
            >
              ← Back to Public Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
