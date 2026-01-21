import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import * as UI from '@/styles/ui';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

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
    <div className={UI.pageWrap}>
      {/* Header sentinel for SiteHeader compact mode */}
      <div id="header-sentinel" className="h-2" aria-hidden="true" />
      <SiteHeader />

      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden pb-12 pt-20 md:pb-16 md:pt-28">
        {/* Background gradient orbs */}
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-2xl text-center">
            {/* Icon */}
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-600/25">
              <Bell className="h-8 w-8 text-white" />
            </div>

            <h1 className={UI.pageTitleLight}>
              Email Alerts
            </h1>
            <p className={`mt-4 ${UI.pageSubtitleLight}`}>
              Get notified when new public notices are published in your area. Stay informed about licensing, planning, and other important local decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={`${UI.container} relative z-10 -mt-4 pb-16`}>
        {/* Success message banner */}
        {success && (
          <div className="mx-auto mb-8 max-w-2xl">
            <div className={UI.alertSuccess}>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscribe Step */}
        {step === 'subscribe' && (
          <div className="mx-auto max-w-2xl">
            {/* Form Card */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
              <h2 className={`${UI.sectionTitle} mb-6`}>Subscribe to Alerts</h2>

              {error && (
                <div className={`${UI.alertError} mb-6`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className={`${UI.label} mb-2 block`}>
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={UI.inputIconLeft} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${UI.inputFull} pl-10`}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Postcode Input */}
                <div>
                  <label htmlFor="postcode" className={`${UI.label} mb-2 block`}>
                    Your Postcode <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className={UI.inputIconLeft} />
                    <input
                      id="postcode"
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      className={`${UI.inputFull} pl-10`}
                      placeholder="SW1A 1AA"
                      required
                    />
                  </div>
                  <p className={`${UI.textTertiary} mt-1.5 text-sm`}>
                    We'll notify you about notices near this location
                  </p>
                </div>

                {/* Radius Slider */}
                <div>
                  <label htmlFor="radius" className={`${UI.label} mb-2 block`}>
                    Search Radius: <span className="font-bold text-blue-600">{radiusKm} km</span>
                  </label>
                  <input
                    id="radius"
                    type="range"
                    min="1"
                    max="20"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                    <span>1 km</span>
                    <span>20 km</span>
                  </div>
                </div>

                {/* Notice Types */}
                <div>
                  <label className={`${UI.label} mb-2 block`}>
                    Notice Types
                  </label>
                  <div className="space-y-2">
                    {noticeTypes.map(type => (
                      <label
                        key={type.value}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNoticeTypes.includes(type.value)}
                          onChange={() => handleToggleNoticeType(type.value)}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className={UI.textPrimary}>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className={UI.alertInfo}>
                  <p className="text-sm">
                    <strong>Note:</strong> You'll receive a verification email before alerts are activated. You can unsubscribe at any time.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className={`${UI.btnPrimary} w-full py-4`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Setting up alerts...
                    </span>
                  ) : (
                    'Subscribe to Email Alerts'
                  )}
                </button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
              <h2 className={`${UI.sectionTitle} mb-6`}>How Email Alerts Work</h2>
              <div className="space-y-4">
                {[
                  'Receive email notifications when new notices are published within your chosen radius',
                  'Filter by specific notice types to only get alerts that matter to you',
                  'Update your preferences or unsubscribe at any time',
                  'Your email address is never shared and is only used for sending alerts',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <p className={UI.textSecondary}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manage Step */}
        {step === 'manage' && subscription && (
          <div className="mx-auto max-w-2xl">
            {/* Status Card */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
              <div className="mb-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className={UI.sectionTitle}>Email Alerts Active</h2>
                <p className={`mt-2 ${UI.textSecondary}`}>
                  You're subscribed to alerts for <strong>{subscription.email}</strong>
                </p>
              </div>

              {error && (
                <div className={`${UI.alertError} mb-6`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Current Settings */}
              <div className="mb-6 rounded-lg bg-slate-50 p-4">
                <h3 className={`${UI.label} mb-3`}>Current Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={UI.textTertiary}>Status:</span>
                    <span className={`font-semibold ${
                      subscription.status === 'active' ? 'text-emerald-600' :
                      subscription.status === 'pending' ? 'text-amber-600' :
                      UI.textTertiary
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={UI.textTertiary}>Email:</span>
                    <span className="font-semibold">{subscription.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={UI.textTertiary}>Subscribed:</span>
                    <span className="font-semibold">
                      {new Date(subscription.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Postcode Input */}
                <div>
                  <label htmlFor="manage-postcode" className={`${UI.label} mb-2 block`}>
                    Your Postcode
                  </label>
                  <div className="relative">
                    <MapPin className={UI.inputIconLeft} />
                    <input
                      id="manage-postcode"
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      className={`${UI.inputFull} pl-10`}
                    />
                  </div>
                </div>

                {/* Radius Slider */}
                <div>
                  <label htmlFor="manage-radius" className={`${UI.label} mb-2 block`}>
                    Search Radius: <span className="font-bold text-blue-600">{radiusKm} km</span>
                  </label>
                  <input
                    id="manage-radius"
                    type="range"
                    min="1"
                    max="20"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                    <span>1 km</span>
                    <span>20 km</span>
                  </div>
                </div>

                {/* Notice Types */}
                <div>
                  <label className={`${UI.label} mb-2 block`}>
                    Notice Types
                  </label>
                  <div className="space-y-2">
                    {noticeTypes.map(type => (
                      <label
                        key={type.value}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNoticeTypes.includes(type.value)}
                          onChange={() => handleToggleNoticeType(type.value)}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className={UI.textPrimary}>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateSettings}
                    disabled={loading}
                    className={`${UI.btnPrimary} flex-1 py-3`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update Settings'
                    )}
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className={UI.btnDanger + ' px-6 py-3'}
                  >
                    Unsubscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
