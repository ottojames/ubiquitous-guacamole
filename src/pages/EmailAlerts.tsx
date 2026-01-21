import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as UI from '@/styles/ui';

interface Subscription {
  id: string;
  email: string;
  postcode: string;
  radius_km: number;
  notice_types: string[];
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced';
  created_at: string;
}

// API base URL
const API_BASE = '/api/subscriptions';

export default function EmailAlerts() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'subscribe' | 'manage'>('subscribe');
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedNoticeTypes, setSelectedNoticeTypes] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [managementToken, setManagementToken] = useState<string | null>(null);

  // Handle URL params from email links (verified, unsubscribed)
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('Email verified! Your subscription is now active.');
    }
    if (searchParams.get('unsubscribed') === 'true') {
      setSuccess('You have been unsubscribed from email alerts.');
    }
    // If there's a token in the URL (from email link), fetch subscription details
    const token = searchParams.get('token');
    if (token) {
      setManagementToken(token);
      loadSubscriptionByToken(token);
    }
  }, [searchParams]);

  const loadSubscriptionByToken = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to load subscription');
      }

      const data = await response.json();
      if (data.subscriptions && data.subscriptions.length > 0) {
        const sub = data.subscriptions[0];
        setSubscription(sub);
        setEmail(sub.email);
        setPostcode(sub.postcode);
        setRadiusKm(sub.radius_km);
        setSelectedNoticeTypes(sub.notice_types || ['all']);
        setStep('manage');
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Could not load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const noticeTypes = [
    { value: 'all', label: 'All Notice Types' },
    { value: 'premises-licence', label: 'Premises Licences' },
    { value: 'variation', label: 'Licence Variations' },
    { value: 'review', label: 'Licence Reviews' },
    { value: 'planning-application', label: 'Planning Applications' },
    { value: 'traffic-order', label: 'Traffic Orders' },
  ];

  const handleToggleNoticeType = (type: string) => {
    if (type === 'all') {
      setSelectedNoticeTypes(['all']);
    } else {
      const filtered = selectedNoticeTypes.filter(t => t !== 'all');
      if (filtered.includes(type)) {
        const updated = filtered.filter(t => t !== type);
        setSelectedNoticeTypes(updated.length === 0 ? ['all'] : updated);
      } else {
        setSelectedNoticeTypes([...filtered, type]);
      }
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !postcode) {
        throw new Error('Please provide both email and postcode');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Call the actual API endpoint
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          postcode,
          radius_km: radiusKm,
          notice_types: selectedNoticeTypes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      setSuccess('Verification email sent! Please check your inbox and click the link to activate your alerts.');
      // Clear form for next use
      setEmail('');
      setPostcode('');
      setRadiusKm(5);
      setSelectedNoticeTypes(['all']);
    } catch (err) {
      console.error('Subscription failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  // Note: Verification is done via email link (GET /api/subscriptions/verify/:token)
  // which redirects back to this page with ?verified=true

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from email alerts?')) {
      return;
    }

    if (!managementToken) {
      setError('No management token available. Please use the unsubscribe link in your email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Redirect to the unsubscribe endpoint (it handles the update and redirects back)
      window.location.href = `${API_BASE}/unsubscribe/${managementToken}`;
    } catch (err) {
      console.error('Unsubscribe failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!subscription || !managementToken) {
        setError('No subscription or management token available');
        return;
      }

      // Call the actual API endpoint
      const response = await fetch(`${API_BASE}/update/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radius_km: radiusKm,
          notice_types: selectedNoticeTypes,
          token: managementToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      setSubscription(data.subscription);
      setSuccess('Alert settings updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CivicNotices
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          {/* Subscribe Step */}
          {step === 'subscribe' && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Email Alerts
                </h1>
                <p className="text-gray-600">
                  Get notified when new public notices are published in your area
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={UI.inputFull}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Postcode *
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    className={UI.inputFull}
                    placeholder="SW1A 1AA"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    We'll notify you about notices near this location
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1 km</span>
                    <span>20 km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Types
                  </label>
                  <div className="space-y-2">
                    {noticeTypes.map(type => (
                      <label
                        key={type.value}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNoticeTypes.includes(type.value)}
                          onChange={() => handleToggleNoticeType(type.value)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You'll receive a verification email before alerts are activated.
                    You can unsubscribe at any time.
                  </p>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Setting up alerts...' : 'Subscribe to Email Alerts'}
                </button>
              </div>
            </div>
          )}

          {/* Manage Step */}
          {step === 'manage' && subscription && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Email Alerts Active
                </h1>
                <p className="text-gray-600">
                  You're subscribed to alerts for <strong>{subscription.email}</strong>
                </p>
              </div>

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Current Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${
                        subscription.status === 'active' ? 'text-green-600' :
                        subscription.status === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold">{subscription.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscribed:</span>
                      <span className="font-semibold">
                        {new Date(subscription.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Postcode
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    className={UI.inputFull}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1 km</span>
                    <span>20 km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Types
                  </label>
                  <div className="space-y-2">
                    {noticeTypes.map(type => (
                      <label
                        key={type.value}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNoticeTypes.includes(type.value)}
                          onChange={() => handleToggleNoticeType(type.value)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateSettings}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Settings'}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Email Alerts Work</h2>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p>Receive email notifications when new notices are published within your chosen radius</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p>Filter by specific notice types to only get alerts that matter to you</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p>Update your preferences or unsubscribe at any time</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p>Your email address is never shared and is only used for sending alerts</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
