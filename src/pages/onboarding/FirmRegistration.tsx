import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Briefcase, CheckSquare, MapPin, User, CreditCard, CheckCircle } from 'lucide-react';

// Steps for firm registration
type Step = 'welcome' | 'info' | 'practice-areas' | 'office' | 'admin' | 'subscription' | 'review';

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

interface FirmData {
  // Step 1: Welcome (no data)
  // Step 2: Firm Information
  name: string;
  // sraNumber removed as per FIX-004
  // Step 3: Practice Areas
  practiceAreas: string[];
  // Step 4: Office Details
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  // Step 5: Admin Account
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  adminName: string;
  adminRole: string;
  // Step 6: Subscription Plan
  selectedTier?: SubscriptionTier;
  billingCycle: 'monthly' | 'annual';
}

const FIRM_STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'welcome', label: 'Welcome', icon: Briefcase },
  { key: 'info', label: 'Firm Information', icon: Briefcase },
  { key: 'practice-areas', label: 'Practice Areas', icon: CheckSquare },
  { key: 'office', label: 'Office Details', icon: MapPin },
  { key: 'admin', label: 'Admin Account', icon: User },
  { key: 'subscription', label: 'Subscription Plan', icon: CreditCard },
  { key: 'review', label: 'Review & Confirm', icon: CheckCircle },
];

const PRACTICE_AREAS = [
  {
    id: 'licensing',
    label: 'Licensing',
    description: 'Premises licences, variations, reviews, transfers'
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Planning applications, appeals, developments'
  },
  {
    id: 'environmental',
    label: 'Environmental',
    description: 'Environmental permits, pollution control, health & safety'
  },
  {
    id: 'highways',
    label: 'Highways',
    description: 'Traffic orders, road closures, parking regulations'
  }
];

export default function FirmRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  const [firmData, setFirmData] = useState<FirmData>({
    name: '',
    // sraNumber removed as per FIX-004
    practiceAreas: [],
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminName: '',
    adminRole: 'Managing Partner',
    billingCycle: 'monthly'
  });

  const currentStepIndex = FIRM_STEPS.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / FIRM_STEPS.length) * 100;

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  };

  const fetchSubscriptionTiers = async () => {
    setLoadingTiers(true);
    try {
      // Mock subscription tiers for demo
      setTiers([
        {
          id: 'starter',
          name: 'Starter',
          slug: 'starter',
          description: 'Perfect for small firms getting started',
          monthly_price_gbp: 99,
          annual_price_gbp: 990,
          notices_per_month: 10,
          additional_notice_price_gbp: 15,
          features: [
            'Up to 10 notices per month',
            '2 team members',
            'Email support',
            'Basic analytics'
          ],
          max_users: 2,
          priority_support: false
        },
        {
          id: 'professional',
          name: 'Professional',
          slug: 'professional',
          description: 'For growing firms with regular notice requirements',
          monthly_price_gbp: 249,
          annual_price_gbp: 2490,
          notices_per_month: 50,
          additional_notice_price_gbp: 10,
          features: [
            'Up to 50 notices per month',
            '10 team members',
            'Priority email support',
            'Advanced analytics',
            'Client management',
            'Custom templates'
          ],
          max_users: 10,
          priority_support: true
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          slug: 'enterprise',
          description: 'For large firms with high-volume notice needs',
          monthly_price_gbp: 599,
          annual_price_gbp: 5990,
          notices_per_month: 200,
          additional_notice_price_gbp: 7,
          features: [
            'Up to 200 notices per month',
            'Unlimited team members',
            'Dedicated account manager',
            'Phone & priority support',
            'Advanced analytics & reporting',
            'API access',
            'Custom integrations'
          ],
          max_users: null,
          priority_support: true
        }
      ]);
    } catch (err) {
      console.error('Error fetching tiers:', err);
      setError('Failed to load subscription plans.');
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleNext = async () => {
    setError(null);

    switch (currentStep) {
      case 'welcome':
        setCurrentStep('info');
        break;

      case 'info':
        if (!firmData.name) {
          setError('Please fill in all required fields');
          return;
        }
        setCurrentStep('practice-areas');
        break;

      case 'practice-areas':
        if (firmData.practiceAreas.length === 0) {
          setError('Please select at least one practice area');
          return;
        }
        setCurrentStep('office');
        break;

      case 'office':
        if (!firmData.address || !firmData.city || !firmData.postcode || !firmData.phone || !firmData.email) {
          setError('Please fill in all required office details');
          return;
        }
        setCurrentStep('admin');
        break;

      case 'admin':
        if (!firmData.adminEmail || !firmData.adminPassword || !firmData.adminPasswordConfirm || !firmData.adminName) {
          setError('Please fill in all admin account details');
          return;
        }
        if (!validatePassword(firmData.adminPassword)) {
          setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
          return;
        }
        if (firmData.adminPassword !== firmData.adminPasswordConfirm) {
          setError('Passwords do not match');
          return;
        }
        // Load subscription tiers before moving to subscription step
        await fetchSubscriptionTiers();
        setCurrentStep('subscription');
        break;

      case 'subscription':
        if (!firmData.selectedTier) {
          setError('Please select a subscription plan');
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
      setCurrentStep(FIRM_STEPS[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use server API to bypass RLS policies
      const response = await fetch('/api/registration/firm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Firm Information
          firmName: firmData.name,
          practiceAreas: firmData.practiceAreas,
          // Office Details
          officeAddress: `${firmData.address}, ${firmData.city}, ${firmData.postcode}`,
          officeEmail: firmData.email,
          officePhone: firmData.phone,
          // Admin Account
          adminEmail: firmData.adminEmail,
          adminPassword: firmData.adminPassword,
          adminName: firmData.adminName,
          adminRole: firmData.adminRole,
          // Subscription
          subscriptionPlan: firmData.selectedTier?.slug || 'starter'
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
        email: firmData.adminEmail,
        password: firmData.adminPassword
      });

      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // Still redirect even if sign-in fails - they can log in manually
      }

      // Success! Redirect to firm dashboard
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {FIRM_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = step.key === currentStep;

              return (
                <div
                  key={step.key}
                  className={`flex items-center ${index < FIRM_STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className={`flex flex-col items-center ${index < FIRM_STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-purple-600 text-white'
                          : isActive
                          ? 'bg-purple-200 text-purple-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < FIRM_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-6 ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
              <Briefcase className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Law Firm Registration
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Are you registering a law firm?
              </p>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                This registration process is for legal practices that submit statutory notices
                on behalf of their clients.
              </p>
              <button
                onClick={handleNext}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Yes, Continue with Firm Registration
              </button>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/register/council')}
                  className="text-gray-600 hover:text-gray-900 underline"
                >
                  I'm registering a council instead
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Firm Information */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Firm Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  value={firmData.name}
                  onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Wilson & Partners LLP"
                />
              </div>

              {/* Removed SRA Number field as per FIX-004 */}
            </div>
          )}

          {/* Step 3: Practice Areas */}
          {currentStep === 'practice-areas' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Practice Areas Selection
              </h2>
              <p className="text-gray-600 mb-4">
                Which areas of law does your firm practice? Select all that apply.
              </p>

              <div className="space-y-3">
                {PRACTICE_AREAS.map((area) => (
                  <label
                    key={area.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      firmData.practiceAreas.includes(area.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={area.id}
                      checked={firmData.practiceAreas.includes(area.id)}
                      onChange={(e) => {
                        const newPracticeAreas = e.target.checked
                          ? [...firmData.practiceAreas, area.id]
                          : firmData.practiceAreas.filter(id => id !== area.id);
                        setFirmData({ ...firmData, practiceAreas: newPracticeAreas });
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center h-5">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        firmData.practiceAreas.includes(area.id)
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-gray-300'
                      }`}>
                        {firmData.practiceAreas.includes(area.id) && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 9">
                            <path fill="currentColor" d="M4.5 7.5L1.5 4.5L0 6L4.5 10.5L12 3L10.5 1.5L4.5 7.5Z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-900">{area.label}</div>
                      <div className="text-sm text-gray-500">{area.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {firmData.practiceAreas.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Please select at least one practice area to continue.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Office Details */}
          {currentStep === 'office' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Office Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Address *
                </label>
                <input
                  type="text"
                  value={firmData.address}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 123 High Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={firmData.city}
                    onChange={(e) => setFirmData({ ...firmData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., London"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={firmData.postcode}
                    onChange={(e) => setFirmData({ ...firmData, postcode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={firmData.phone}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 020 7123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={firmData.email}
                  onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., contact@wilsonpartners.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={firmData.website}
                  onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., https://www.wilsonpartners.co.uk"
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
                  value={firmData.adminName}
                  onChange={(e) => setFirmData({ ...firmData, adminName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Emma Wilson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  value={firmData.adminEmail}
                  onChange={(e) => setFirmData({ ...firmData, adminEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., emma@wilsonpartners.co.uk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={firmData.adminPassword}
                  onChange={(e) => setFirmData({ ...firmData, adminPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter a strong password"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={firmData.adminPasswordConfirm}
                  onChange={(e) => setFirmData({ ...firmData, adminPasswordConfirm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Re-enter your password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role
                </label>
                <select
                  value={firmData.adminRole}
                  onChange={(e) => setFirmData({ ...firmData, adminRole: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Managing Partner">Managing Partner</option>
                  <option value="Senior Partner">Senior Partner</option>
                  <option value="Partner">Partner</option>
                  <option value="Practice Manager">Practice Manager</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6: Subscription Plan */}
          {currentStep === 'subscription' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Subscription Plan Selection
              </h2>

              {loadingTiers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading subscription plans...</p>
                </div>
              ) : (
                <>
                  {/* Billing Cycle Toggle */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-4">
                      <span className={`text-sm font-medium ${firmData.billingCycle === 'monthly' ? 'text-purple-600' : 'text-gray-600'}`}>
                        Monthly
                      </span>
                      <button
                        onClick={() => setFirmData({ ...firmData, billingCycle: firmData.billingCycle === 'monthly' ? 'annual' : 'monthly' })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          firmData.billingCycle === 'annual' ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            firmData.billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm font-medium ${firmData.billingCycle === 'annual' ? 'text-purple-600' : 'text-gray-600'}`}>
                        Annual
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Save 17%
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Subscription Tiers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tiers.map((tier) => {
                      const isSelected = firmData.selectedTier?.id === tier.id;
                      const price = firmData.billingCycle === 'monthly' ? tier.monthly_price_gbp : tier.annual_price_gbp;
                      const pricePerMonth = firmData.billingCycle === 'annual' ? tier.annual_price_gbp / 12 : tier.monthly_price_gbp;

                      return (
                        <button
                          key={tier.id}
                          onClick={() => setFirmData({ ...firmData, selectedTier: tier })}
                          className={`bg-white border-2 rounded-lg p-6 text-left transition-all relative ${
                            isSelected ? 'border-purple-600 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {tier.slug === 'professional' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Most Popular
                            </div>
                          )}

                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {tier.name}
                          </h3>

                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">
                              £{pricePerMonth.toFixed(0)}
                            </span>
                            <span className="text-gray-600 text-sm">/month</span>
                            {firmData.billingCycle === 'annual' && (
                              <p className="text-xs text-gray-500 mt-1">
                                £{price.toFixed(0)} billed annually
                              </p>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-4">
                            {tier.description}
                          </p>

                          <ul className="space-y-2 text-sm">
                            {tier.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg
                                  className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"
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
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 7: Review & Confirm */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Review & Confirm
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Firm Information</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{firmData.name}</dd>
                    </div>
                    {/* SRA Number removed as per FIX-004 */}
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Practice Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {firmData.practiceAreas.map((areaId) => {
                      const area = PRACTICE_AREAS.find(a => a.id === areaId);
                      return (
                        <span key={areaId} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {area?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Office Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Address:</dt>
                      <dd className="font-medium">{firmData.address}, {firmData.city} {firmData.postcode}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="font-medium">{firmData.phone}</dd>
                    </div>
                    {firmData.website && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Website:</dt>
                        <dd className="font-medium">{firmData.website}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Admin Account</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{firmData.adminName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium">{firmData.adminEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Role:</dt>
                      <dd className="font-medium">{firmData.adminRole}</dd>
                    </div>
                  </dl>
                </div>

                {firmData.selectedTier && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Subscription Plan</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Plan:</dt>
                        <dd className="font-medium">{firmData.selectedTier.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Billing:</dt>
                        <dd className="font-medium">
                          £{firmData.billingCycle === 'monthly'
                            ? firmData.selectedTier.monthly_price_gbp
                            : firmData.selectedTier.annual_price_gbp}/{firmData.billingCycle}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
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
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : currentStep === 'review' ? 'Complete Registration' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}