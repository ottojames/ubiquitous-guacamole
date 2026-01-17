import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, Users, Shield, MapPin, User, CheckCircle } from 'lucide-react';

// Steps for council registration
type Step = 'welcome' | 'info' | 'departments' | 'authority' | 'admin' | 'review';

interface Department {
  name: string;
  slug: string;
  type: string;
  email: string;
  description?: string;
}

interface CouncilData {
  // Step 1: Welcome (no data)
  // Step 2: Council Information
  name: string;
  type: 'borough' | 'city' | 'district' | 'county' | '';
  region: string;
  // Step 3: Department Setup
  departments: Department[];
  // Step 4: Authority Details (MANDATORY)
  authorityAddress: string;
  authorityEmail: string;
  authorityPhone: string;
  onlineRegisterUrl: string;
  // Step 5: Admin Account
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  adminRole: string;
}

const COUNCIL_STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'welcome', label: 'Welcome', icon: Building2 },
  { key: 'info', label: 'Council Information', icon: Building2 },
  { key: 'departments', label: 'Department Setup', icon: Users },
  { key: 'authority', label: 'Authority Details', icon: MapPin },
  { key: 'admin', label: 'Admin Account', icon: User },
  { key: 'review', label: 'Review & Confirm', icon: CheckCircle },
];

const DEPARTMENT_TYPES = [
  { value: 'licensing', label: 'Licensing Department' },
  { value: 'planning', label: 'Planning Department' },
  { value: 'environmental', label: 'Environmental Health' },
  { value: 'highways', label: 'Highways & Transport' },
  { value: 'building', label: 'Building Control' }
];

const REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'West Midlands',
  'East Midlands',
  'Yorkshire and the Humber',
  'North West',
  'North East',
  'Wales',
  'Scotland',
  'Northern Ireland'
];

export default function CouncilRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [councilData, setCouncilData] = useState<CouncilData>({
    name: '',
    type: '',
    region: '',
    departments: [],
    authorityAddress: '',
    authorityEmail: '',
    authorityPhone: '',
    onlineRegisterUrl: '',
    adminEmail: '',
    adminPassword: '',
    adminName: '',
    adminRole: 'Head of Service'
  });

  const [currentDept, setCurrentDept] = useState<Department>({
    name: '',
    slug: '',
    type: 'licensing',
    email: '',
    description: ''
  });

  const currentStepIndex = COUNCIL_STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / COUNCIL_STEPS.length) * 100;

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  };

  const handleNext = () => {
    setError(null);

    switch (currentStep) {
      case 'welcome':
        setCurrentStep('info');
        break;

      case 'info':
        if (!councilData.name || !councilData.type || !councilData.region) {
          setError('Please fill in all required fields');
          return;
        }
        setCurrentStep('departments');
        break;

      case 'departments':
        if (councilData.departments.length === 0) {
          setError('Please add at least one department');
          return;
        }
        setCurrentStep('authority');
        break;

      case 'authority':
        if (!councilData.authorityAddress || !councilData.authorityEmail ||
            !councilData.authorityPhone || !councilData.onlineRegisterUrl) {
          setError('All authority details are mandatory');
          return;
        }
        setCurrentStep('admin');
        break;

      case 'admin':
        if (!councilData.adminEmail || !councilData.adminPassword || !councilData.adminName) {
          setError('Please fill in all admin account details');
          return;
        }
        if (!validatePassword(councilData.adminPassword)) {
          setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
          return;
        }
        setCurrentStep('review');
        break;

      case 'review':
        handleSubmit();
        break;
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(COUNCIL_STEPS[prevIndex].key);
    }
  };

  const addDepartment = () => {
    if (!currentDept.name || !currentDept.slug || !currentDept.email) {
      setError('Please fill in all department fields');
      return;
    }

    setCouncilData({
      ...councilData,
      departments: [...councilData.departments, currentDept]
    });

    // Reset form
    setCurrentDept({
      name: '',
      slug: '',
      type: 'licensing',
      email: '',
      description: ''
    });

    setError(null);
  };

  const removeDepartment = (index: number) => {
    setCouncilData({
      ...councilData,
      departments: councilData.departments.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use server API to bypass RLS policies
      const response = await fetch('/api/registration/council', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Council Information
          name: councilData.name,
          type: councilData.type,
          region: councilData.region,
          // Departments
          departments: councilData.departments,
          // Authority Details (MANDATORY)
          authorityAddress: councilData.authorityAddress,
          authorityEmail: councilData.authorityEmail,
          authorityPhone: councilData.authorityPhone,
          onlineRegisterUrl: councilData.onlineRegisterUrl,
          // Admin Account
          adminEmail: councilData.adminEmail,
          adminPassword: councilData.adminPassword,
          adminName: councilData.adminName,
          adminRole: councilData.adminRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', data);

        // Handle specific error types
        if (data.error === 'duplicate') {
          throw new Error(data.message);
        } else if (data.error === 'validation') {
          throw new Error(data.message || 'Please check all required fields are filled correctly');
        } else {
          throw new Error(data.message || 'Registration failed. Please try again.');
        }
      }

      console.log('Registration successful:', data);

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: councilData.adminEmail,
        password: councilData.adminPassword
      });

      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // Still redirect even if sign-in fails - they can log in manually
      }

      // Success! Redirect to council dashboard
      navigate(data.redirectPath);

    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {COUNCIL_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = step.key === currentStep;

              return (
                <div
                  key={step.key}
                  className={`flex items-center ${index < COUNCIL_STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className={`flex flex-col items-center ${index < COUNCIL_STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isActive
                          ? 'bg-blue-200 text-blue-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < COUNCIL_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-6 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <div className="text-center py-8">
              <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Council Registration
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Are you registering a council?
              </p>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                This registration process is for UK local authorities and councils who need to publish statutory notices
                and manage public consultations.
              </p>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Yes, Continue with Council Registration
              </button>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/register/firm')}
                  className="text-gray-600 hover:text-gray-900 underline"
                >
                  I'm registering a law firm instead
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Council Information */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Council Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Council Name *
                </label>
                <input
                  type="text"
                  value={councilData.name}
                  onChange={(e) => setCouncilData({ ...councilData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Westminster City Council"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Council Type *
                </label>
                <select
                  value={councilData.type}
                  onChange={(e) => setCouncilData({ ...councilData, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select council type...</option>
                  <option value="borough">Borough Council</option>
                  <option value="city">City Council</option>
                  <option value="district">District Council</option>
                  <option value="county">County Council</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <select
                  value={councilData.region}
                  onChange={(e) => setCouncilData({ ...councilData, region: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select region...</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Department Setup */}
          {currentStep === 'departments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Department Setup
              </h2>
              <p className="text-gray-600 mb-4">
                Which departments will be using the platform?
              </p>

              {/* Add Department Form */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900">Add Department</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={currentDept.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setCurrentDept({ ...currentDept, name, slug });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., licensing"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Type *
                    </label>
                    <select
                      value={currentDept.type}
                      onChange={(e) => setCurrentDept({ ...currentDept, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {DEPARTMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Email *
                    </label>
                    <input
                      type="email"
                      value={currentDept.email}
                      onChange={(e) => setCurrentDept({ ...currentDept, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., licensing@council.gov.uk"
                    />
                  </div>
                </div>

                <button
                  onClick={addDepartment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Department
                </button>
              </div>

              {/* Added Departments */}
              {councilData.departments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Added Departments</h3>
                  <div className="space-y-2">
                    {councilData.departments.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-gray-500 ml-2">({dept.type})</span>
                          <span className="text-gray-400 ml-2 text-sm">{dept.email}</span>
                        </div>
                        <button
                          onClick={() => removeDepartment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Authority Details */}
          {currentStep === 'authority' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Authority Details
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> All authority details are mandatory and will be used in published notices.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Address *
                </label>
                <textarea
                  value={councilData.authorityAddress}
                  onChange={(e) => setCouncilData({ ...councilData, authorityAddress: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., City Hall, 64 Victoria Street, London, SW1E 6QP"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Email *
                </label>
                <input
                  type="email"
                  value={councilData.authorityEmail}
                  onChange={(e) => setCouncilData({ ...councilData, authorityEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., licensing@westminster.gov.uk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Phone *
                </label>
                <input
                  type="tel"
                  value={councilData.authorityPhone}
                  onChange={(e) => setCouncilData({ ...councilData, authorityPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 020 7641 6500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Online Register URL *
                </label>
                <input
                  type="url"
                  value={councilData.onlineRegisterUrl}
                  onChange={(e) => setCouncilData({ ...councilData, onlineRegisterUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., https://westminster.gov.uk/licensing-register"
                />
              </div>
            </div>
          )}

          {/* Step 5: Admin Account */}
          {currentStep === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Admin Account Creation
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Name *
                </label>
                <input
                  type="text"
                  value={councilData.adminName}
                  onChange={(e) => setCouncilData({ ...councilData, adminName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sarah Thompson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  value={councilData.adminEmail}
                  onChange={(e) => setCouncilData({ ...councilData, adminEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., sarah.thompson@westminster.gov.uk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={councilData.adminPassword}
                  onChange={(e) => setCouncilData({ ...councilData, adminPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a strong password"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role
                </label>
                <select
                  value={councilData.adminRole}
                  onChange={(e) => setCouncilData({ ...councilData, adminRole: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Head of Service">Head of Service</option>
                  <option value="Principal Officer">Principal Officer</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="System Administrator">System Administrator</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6: Review & Confirm */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Review & Confirm
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Council Information</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{councilData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-medium">{councilData.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Region:</dt>
                      <dd className="font-medium">{councilData.region}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Departments</h3>
                  <ul className="space-y-1 text-sm">
                    {councilData.departments.map((dept, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="text-gray-600">{dept.name}</span>
                        <span className="font-medium">{dept.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Authority Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Address:</dt>
                      <dd className="font-medium text-right">{councilData.authorityAddress}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium">{councilData.authorityEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="font-medium">{councilData.authorityPhone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Admin Account</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{councilData.adminName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium">{councilData.adminEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Role:</dt>
                      <dd className="font-medium">{councilData.adminRole}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 'welcome'}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : currentStep === 'review' ? 'Complete Registration' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}