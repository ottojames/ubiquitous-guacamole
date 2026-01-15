import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type OrgType = 'council' | 'firm';
type Step = 'type' | 'info' | 'departments' | 'practice-areas' | 'subscription' | 'review';

interface Department {
  name: string;
  slug: string;
  type: string;
  email: string;
  description?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price_gbp: number;
  annual_price_gbp: number;
  notices_per_month: number;
  additional_notice_price_gbp: number;
  features: string[];
  max_users: number | null;
  priority_support: boolean;
}

interface OrgData {
  type: OrgType | null;
  name: string;
  domain: string;
  contactEmail: string;
  // registrationNumber removed as per FIX-004
  departments: Department[];
  practiceAreas: string[];
  selectedTier?: SubscriptionTier;
  billingCycle: 'monthly' | 'annual';
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
    // registrationNumber removed as per FIX-004
    departments: [],
    practiceAreas: [],
    billingCycle: 'monthly'
  });

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

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

  const handleInfoNext = async () => {
    if (!orgData.name || !orgData.domain || !orgData.contactEmail) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);

    if (orgData.type === 'council') {
      setStep('departments');
    } else {
      // For firms, go to practice areas selection first
      setStep('practice-areas');
    }
  };

  const fetchSubscriptionTiers = async () => {
    setLoadingTiers(true);
    try {
      const response = await fetch('/api/firm-subscriptions/tiers');
      if (!response.ok) throw new Error('Failed to fetch subscription tiers');
      const data = await response.json();
      setTiers(data.tiers || []);
    } catch (err) {
      console.error('Error fetching tiers:', err);
      setError('Failed to load subscription plans. Please try again.');
    } finally {
      setLoadingTiers(false);
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
          // registration_number removed as per FIX-004
          practice_areas: orgData.type === 'firm' ? orgData.practiceAreas : null,
          status: 'pending_approval'
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create departments (for councils)
      if (orgData.type === 'council' && orgData.departments.length > 0) {
        const deptInserts = orgData.departments.map(dept => ({
          organization_id: org.id,
          name: dept.name,
          slug: dept.slug,
          type: dept.type,
          email: dept.email,
          description: dept.description || null
        }));

        const { error: deptError } = await supabase
          .from('departments')
          .insert(deptInserts);

        if (deptError) throw deptError;
      }

      // For firms, create subscription
      if (orgData.type === 'firm' && orgData.selectedTier) {
        const { error: subError } = await supabase.rpc('create_firm_subscription', {
          p_organization_id: org.id,
          p_tier_id: orgData.selectedTier.id,
          p_billing_cycle: orgData.billingCycle,
          p_trial_days: 14 // 14-day free trial
        });

        if (subError) {
          console.error('Failed to create subscription:', subError);
          // Don't throw - organization was created, just log the error
        }
      }

      // Organization membership will be auto-created by trigger
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

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
            {step === 'practice-areas' && 'Select your practice areas'}
            {step === 'subscription' && 'Choose your subscription plan'}
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
          {orgData.type === 'firm' && (
            <>
              <div className={`w-3 h-3 rounded-full ${step === 'practice-areas' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'subscription' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </>
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

              {/* Removed Registration Number field as per FIX-004 */}
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

        {/* Step 4: Practice Areas (firms only) */}
        {step === 'practice-areas' && (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Your Practice Areas
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose the areas of law your firm specializes in. This will customize which notice types appear in your dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'licensing', label: 'Licensing', description: 'Premises licences, variations, reviews' },
                  { id: 'planning', label: 'Planning', description: 'Planning applications, appeals, developments' },
                  { id: 'environmental', label: 'Environmental Health', description: 'Environmental permits, pollution control' },
                  { id: 'highways', label: 'Highways', description: 'Traffic orders, road closures' },
                  { id: 'building', label: 'Building Control', description: 'Building regulations, dangerous structures' }
                ].map((area) => (
                  <label
                    key={area.id}
                    className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      orgData.practiceAreas.includes(area.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={area.id}
                      checked={orgData.practiceAreas.includes(area.id)}
                      onChange={(e) => {
                        const newPracticeAreas = e.target.checked
                          ? [...orgData.practiceAreas, area.id]
                          : orgData.practiceAreas.filter(id => id !== area.id);
                        setOrgData({ ...orgData, practiceAreas: newPracticeAreas });
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center h-5">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        orgData.practiceAreas.includes(area.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}>
                        {orgData.practiceAreas.includes(area.id) && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 9">
                            <path fill="currentColor" d="M4.5 7.5L1.5 4.5L0 6L4.5 10.5L12 3L10.5 1.5L4.5 7.5Z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{area.label}</div>
                      <div className="text-xs text-gray-500">{area.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {orgData.practiceAreas.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    Please select at least one practice area to continue.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep('info')}
                className="text-gray-600 hover:text-gray-900 font-semibold"
              >
                ← Back
              </button>
              <button
                onClick={async () => {
                  if (orgData.practiceAreas.length === 0) {
                    setError('Please select at least one practice area');
                    return;
                  }
                  setError(null);
                  // Load subscription tiers and continue
                  await fetchSubscriptionTiers();
                  setStep('subscription');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={orgData.practiceAreas.length === 0}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Subscription Selection (firms only) */}
        {step === 'subscription' && (
          <div className="space-y-6">
            {loadingTiers ? (
              <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading subscription plans...</p>
              </div>
            ) : (
              <>
                {/* Billing Cycle Toggle */}
                <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <span className={`text-sm font-medium ${orgData.billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setOrgData({ ...orgData, billingCycle: orgData.billingCycle === 'monthly' ? 'annual' : 'monthly' })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        orgData.billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          orgData.billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${orgData.billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Annual
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Save 17%
                      </span>
                    </span>
                  </div>
                </div>

                {/* Subscription Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tiers.map((tier) => {
                    const isSelected = orgData.selectedTier?.id === tier.id;
                    const price = orgData.billingCycle === 'monthly' ? tier.monthly_price_gbp : tier.annual_price_gbp;
                    const pricePerMonth = orgData.billingCycle === 'annual' ? tier.annual_price_gbp / 12 : tier.monthly_price_gbp;

                    return (
                      <button
                        key={tier.id}
                        onClick={() => setOrgData({ ...orgData, selectedTier: tier })}
                        className={`bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left relative ${
                          isSelected ? 'ring-2 ring-blue-600' : ''
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {tier.slug === 'professional' && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                            Most Popular
                          </div>
                        )}

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {tier.name}
                        </h3>

                        <div className="mb-4">
                          <span className="text-4xl font-bold text-gray-900">
                            £{pricePerMonth.toFixed(0)}
                          </span>
                          <span className="text-gray-600 text-sm">/month</span>
                          {orgData.billingCycle === 'annual' && (
                            <p className="text-sm text-gray-500 mt-1">
                              £{price.toFixed(0)} billed annually
                            </p>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-6">
                          {tier.description}
                        </p>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-blue-600">{tier.notices_per_month}</span>
                            <span className="text-gray-600 text-sm ml-2">notices per month</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Additional notices: £{tier.additional_notice_price_gbp.toFixed(2)} each
                          </p>
                        </div>

                        <ul className="space-y-3">
                          {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm">
                              <svg
                                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {tier.priority_support && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="inline-flex items-center text-sm text-blue-600 font-semibold">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Priority Support
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 14-Day Trial Notice */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">14-Day Free Trial</p>
                      <p className="text-sm text-green-800">
                        Start with a free 14-day trial on any plan. No credit card required during trial period.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('info')}
                    className="text-gray-600 hover:text-gray-900 font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!orgData.selectedTier) {
                        setError('Please select a subscription plan');
                        return;
                      }
                      setError(null);
                      setStep('review');
                    }}
                    disabled={!orgData.selectedTier}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Review →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: Review */}
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

              {/* Removed Registration Number display as per FIX-004 */}

              {orgData.type === 'firm' && orgData.selectedTier && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Subscription Plan</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{orgData.selectedTier.name}</p>
                        <p className="text-sm text-gray-600">{orgData.selectedTier.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          £{(orgData.billingCycle === 'monthly'
                            ? orgData.selectedTier.monthly_price_gbp
                            : orgData.selectedTier.annual_price_gbp / 12).toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-600">/month</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mt-3 pt-3 border-t border-blue-200">
                      <div>
                        <span className="font-semibold">{orgData.selectedTier.notices_per_month}</span> notices/month
                      </div>
                      <div>
                        <span className="font-semibold">£{orgData.selectedTier.additional_notice_price_gbp.toFixed(2)}</span> per extra notice
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold capitalize">{orgData.billingCycle}</span> billing
                        {orgData.billingCycle === 'annual' && (
                          <span className="ml-2 text-green-600 font-semibold">(£{(orgData.selectedTier.monthly_price_gbp * 12 - orgData.selectedTier.annual_price_gbp).toFixed(0)} saved)</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ 14-day free trial included
                      </p>
                    </div>
                  </div>
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
                onClick={() => setStep(orgData.type === 'council' ? 'departments' : 'subscription')}
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
