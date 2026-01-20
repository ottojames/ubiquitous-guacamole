import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage, getAuthErrorAction } from '@/lib/authErrors';

interface DepartmentMembership {
  department_id: string;
  role: string;
  department: {
    id: string;
    name: string;
    slug: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
    };
  };
}

export default function CouncilLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, session, isInitialized } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department selection states
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [departments, setDepartments] = useState<DepartmentMembership[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Check if user is already logged in and has council memberships
  useEffect(() => {
    if (!authLoading && isInitialized && user) {
      checkCouncilMemberships();
    }
  }, [user, authLoading, isInitialized]);

  const checkCouncilMemberships = async () => {
    if (!user) return;

    setLoadingDepartments(true);
    try {
      const { data: memberships, error } = await supabase
        .from('department_memberships')
        .select(`
          department_id,
          role,
          department:departments(
            id,
            name,
            slug,
            organization:organizations(
              id,
              name,
              slug,
              type
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Filter to only council memberships
      // Note: Supabase returns nested objects for single foreign key relationships
      const councilMemberships = ((memberships || []) as unknown as DepartmentMembership[]).filter(
        (m) => m.department?.organization?.type === 'council'
      );

      if (councilMemberships.length === 0) {
        setLocalError('Your account is not associated with any council. Please contact your administrator.');
        await supabase.auth.signOut();
        return;
      }

      if (councilMemberships.length === 1) {
        // Single department - redirect directly
        const dept = councilMemberships[0].department;
        navigate(`/c/${dept.organization.slug}/${dept.slug}/dashboard`, { replace: true });
      } else {
        // Multiple departments - show picker
        setDepartments(councilMemberships);
        setShowDepartmentPicker(true);
      }
    } catch (err) {
      console.error('Error checking council memberships:', err);
      setLocalError('Failed to load your council memberships. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setErrorHint(null);

    if (!email || !password) {
      setLocalError('Please enter email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      // After signIn, the useEffect will check memberships and redirect
    } catch (err) {
      // Note: signIn already returns user-friendly messages via getAuthErrorMessage
      setLocalError(err instanceof Error ? err.message : getAuthErrorMessage(err));
      setErrorHint(getAuthErrorAction(err));
      setIsSubmitting(false);
    }
  };

  const handleDepartmentSelect = (dept: DepartmentMembership['department']) => {
    navigate(`/c/${dept.organization.slug}/${dept.slug}/dashboard`, { replace: true });
  };

  // Show loading while auth is initializing
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show department picker if user is logged in with multiple departments
  if (showDepartmentPicker && departments.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Select Department</h2>
            <p className="mt-2 text-sm text-gray-600">
              You have access to multiple departments. Choose where to go.
            </p>
          </div>

          {/* Department List */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
            {departments.map((membership) => (
              <button
                key={membership.department_id}
                onClick={() => handleDepartmentSelect(membership.department)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900 group-hover:text-emerald-700">
                    {membership.department.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {membership.department.organization.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Role: {membership.role}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600" />
              </button>
            ))}
          </div>

          {/* Sign out link */}
          <div className="text-center">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setShowDepartmentPicker(false);
                setDepartments([]);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking departments after login
  if (loadingDepartments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Council Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your council's public notices
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Error Alert */}
            {localError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{localError}</span>
                </div>
                {errorHint && (
                  <p className="text-xs text-red-600 mt-2 ml-7">{errorHint}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@council.gov.uk"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
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
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <a
                href="mailto:support@civicnotices.co.uk"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            &larr; Back to Public Portal
          </Link>
          <Link
            to="/auth/sign-in"
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Not a council? Sign in here
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Civic Notices. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
