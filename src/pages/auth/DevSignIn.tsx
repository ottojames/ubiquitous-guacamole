import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function DevSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDevSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use a realistic email that Supabase will accept
      const testEmail = 'dev@testcouncil.gov.uk';
      const testPassword = 'DevPassword123!';

      // Dev credentials - this bypasses magic link for testing
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        // If user doesn't exist, create them
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                display_name: 'Dev Test User'
              }
            }
          });

          if (signUpError) throw signUpError;

          // Check if email confirmation is required
          if (signUpData.user && !signUpData.session) {
            setError('Email confirmation required. Check the Supabase logs or disable email confirmation in your Supabase project settings (Authentication > Providers > Email > Confirm email = disabled)');
            setLoading(false);
            return;
          }

          // Sign in again after signup if we got a session
          if (signUpData.session) {
            navigate('/auth/callback');
            return;
          }

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          });

          if (signInError) throw signInError;
        } else {
          throw error;
        }
      }

      // Navigate to callback
      navigate('/auth/callback');
    } catch (err) {
      console.error('Dev sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dev Mode Sign In
          </h1>
          <p className="text-gray-600">
            Quick authentication for testing
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Development Mode:</strong> This will automatically sign you in with a test account.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-mono text-sm">dev@testcouncil.gov.uk</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <p className="text-gray-900 font-mono text-sm">DevPassword123!</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleDevSignIn}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In as Test User'}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth/sign-in')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Use Magic Link Instead
            </button>
          </div>
        </div>

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
