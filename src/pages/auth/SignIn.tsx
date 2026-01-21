import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { isDemoModeEnabled, DEMO_ACCOUNTS } from '@/lib/demoMode';
import { getAuthErrorMessage, getAuthErrorAction } from '@/lib/authErrors';
import * as UI from '@/styles/ui';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorHint(null);

    // Check if this is a demo account (regardless of demo mode)
    const isKnownDemoAccount =
      DEMO_ACCOUNTS.council.some(acc => acc.email === email) ||
      DEMO_ACCOUNTS.firm.some(acc => acc.email === email) ||
      email === DEMO_ACCOUNTS.public.email ||
      // Also include additional known demo accounts
      email === 'licensing@westminster.gov.uk' ||
      email === 'licensing@sampletonborough.gov.uk' ||
      email === 'solicitor@wilsonpartners.com';

    // Skip validation for demo accounts using testpass123
    const isDemoPassword = password === 'testpass123';

    // Only validate password complexity for non-demo accounts or non-demo passwords
    if (!isKnownDemoAccount || !isDemoPassword) {
      if (!validatePassword(password)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        setLoading(false);
        return;
      }
    }

    // Use email/password authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Handle remember me - set session persistence
      if (rememberMe && data.session) {
        // Store session with 30-day expiry
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        document.cookie = `sb-auth-token=${data.session.access_token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      }

      // Redirect based on user type
      if (data.user) {
        // Check if user is part of a council or firm
        const { data: membership } = await supabase
          .from('department_memberships')
          .select('department:departments(slug, organization:organizations(slug, type))')
          .eq('user_id', data.user.id)
          .limit(1)
          .single();

        if (membership) {
          const dept = (membership as any).department;
          if (dept.organization.type === 'council') {
            navigate(`/c/${dept.organization.slug}/${dept.slug}/dashboard`);
          } else {
            navigate(`/f/${dept.organization.slug}/dashboard`);
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setErrorHint(getAuthErrorAction(err));
    } finally {
      setLoading(false);
    }
  };

  // Password validation function
  const validatePassword = (pwd: string): boolean => {
    // Minimum 8 characters
    if (pwd.length < 8) return false;
    // At least one uppercase letter
    if (!/[A-Z]/.test(pwd)) return false;
    // At least one lowercase letter
    if (!/[a-z]/.test(pwd)) return false;
    // At least one number
    if (!/[0-9]/.test(pwd)) return false;
    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Civic Notices Portal
          </h1>
          <p className="text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Sign In
          </h2>

          {/* Support Contact */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Need access? Contact{" "}
              <a href="mailto:support@civicnotices.co.uk" className="font-medium text-blue-600 hover:text-blue-700">
                support@civicnotices.co.uk
              </a>
            </p>
          </div>

          {/* Demo Accounts - Only shown when demo mode is enabled */}
          {isDemoModeEnabled() && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-900 mb-3">
                Demo Mode - Development Only
              </p>
              <div className="space-y-2">
                <p className="text-xs text-amber-700 font-medium">Council Accounts:</p>
                {DEMO_ACCOUNTS.council.map(account => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword('testpass123');
                    }}
                    className="block text-sm text-amber-800 hover:underline"
                  >
                    {account.name} - {account.email}
                  </button>
                ))}
                <p className="text-xs text-amber-700 font-medium mt-3">Firm Accounts:</p>
                {DEMO_ACCOUNTS.firm.map(account => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword('testpass123');
                    }}
                    className="block text-sm text-amber-800 hover:underline"
                  >
                    {account.name} - {account.email}
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-3">
                Click an account to auto-fill, then click "Sign In"
              </p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Min 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember me for 30 days
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">{error}</p>
                {errorHint && (
                  <p className="text-xs text-red-600 mt-2">{errorHint}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${UI.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/onboarding/create-organization')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Create Organization
              </button>
            </p>
          </div>
        </div>

        {/* Public Access Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
}
