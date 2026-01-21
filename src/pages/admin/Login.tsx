import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { getAuthErrorAction } from '@/lib/authErrors';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading, canAccessAdmin, signInAsAdmin, session, isPlatformAdmin, adminRole, role } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log all state on every render
  console.log('[AdminLogin] Render state:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasSession: !!session,
    isPlatformAdmin,
    adminRole,
    role,
    appMetadata: session?.user?.app_metadata,
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    console.log('[AdminLogin] useEffect triggered:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
    });

    if (!loading && user && canAccessAdmin()) {
      console.log('[AdminLogin] User is already admin, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    } else if (!loading && user && !canAccessAdmin()) {
      console.log('[AdminLogin] User exists but NOT admin - staying on login page');
    } else if (!loading && !user) {
      console.log('[AdminLogin] No user logged in - showing login form');
    }
  }, [user, loading, canAccessAdmin, navigate]);

  // Handle login submission using UnifiedAuthContext
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setErrorHint(null);

    if (!email || !password) {
      setLocalError('Please enter email and password');
      return;
    }

    setIsSubmitting(true);

    const result = await signInAsAdmin(email, password);

    if (result.success) {
      // Navigate immediately - don't wait for context to update
      navigate('/admin/dashboard', { replace: true });
    } else {
      // signInAsAdmin already returns user-friendly error messages
      setLocalError(result.error || 'Login failed');
      setErrorHint(getAuthErrorAction(result.error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with your administrator credentials
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Error Alert */}
            {localError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{localError}</span>
                </div>
                {errorHint && (
                  <p className="text-xs text-red-500/80 mt-2 ml-7">{errorHint}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="ottoclarke@icloud.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              This is a secure area. All login attempts are monitored and logged for security purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Civic Notices. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
