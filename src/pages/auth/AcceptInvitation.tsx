import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import * as UI from '@/styles/ui';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  department: {
    id: string;
    name: string;
    slug: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading, isInitialized } = useAuth();

  // States
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Signup form states (for new users)
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);

  // Load invitation details
  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }
    loadInvitation();
  }, [token]);

  // Auto-accept if user is logged in and invitation is loaded
  useEffect(() => {
    if (!authLoading && isInitialized && user && invitation && !accepted && !accepting) {
      // Check if logged-in user's email matches invitation
      if (user.email?.toLowerCase() === invitation.email.toLowerCase()) {
        acceptInvitation();
      }
    }
  }, [user, authLoading, isInitialized, invitation, accepted, accepting]);

  const loadInvitation = async () => {
    setLoading(true);
    try {
      // Fetch invitation by token
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          department:departments(
            id,
            name,
            slug,
            organization:organizations(
              id,
              name,
              slug
            )
          )
        `)
        .eq('token', token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('This invitation link is invalid or has expired.');
        } else {
          setError('Failed to load invitation details.');
        }
        setLoading(false);
        return;
      }

      // Check invitation status
      if (data.status === 'accepted') {
        setError('This invitation has already been accepted.');
        setLoading(false);
        return;
      }

      if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please request a new invitation.');
        setLoading(false);
        return;
      }

      if (data.status === 'cancelled') {
        setError('This invitation has been cancelled.');
        setLoading(false);
        return;
      }

      // Cast the nested data correctly
      const invitationData = data as unknown as InvitationDetails;
      setInvitation(invitationData);
      setSignupEmail(invitationData.email);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user || !token) return;

    setAccepting(true);
    try {
      // Call the accept_invitation function
      const { data, error: acceptError } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_user_id: user.id
      });

      if (acceptError) {
        console.error('Error accepting invitation:', acceptError);
        setError('Failed to accept invitation. Please try again.');
        setAccepting(false);
        return;
      }

      if (!data || data.length === 0 || !data[0].success) {
        setError('The invitation could not be accepted. It may have expired or already been used.');
        setAccepting(false);
        return;
      }

      setAccepted(true);

      // Redirect to department dashboard after short delay
      setTimeout(() => {
        if (invitation?.department) {
          const orgSlug = invitation.department.organization.slug;
          const deptSlug = invitation.department.slug;
          navigate(`/c/${orgSlug}/${deptSlug}/dashboard`, { replace: true });
        } else {
          navigate('/auth/council-login', { replace: true });
        }
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An unexpected error occurred while accepting the invitation.');
      setAccepting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSigningUp(true);
    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            invited_via_token: token
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(signUpError.message);
        }
        setSigningUp(false);
        return;
      }

      // If signup was successful and user is confirmed (no email verification required)
      if (signUpData.user && signUpData.session) {
        // The useEffect will detect the logged-in user and auto-accept
        // Nothing more to do here
      } else {
        // Email verification may be required
        setError('Please check your email to verify your account, then return to this page and sign in.');
      }
    } catch (err) {
      console.error('Error signing up:', err);
      setError('An unexpected error occurred during signup.');
    } finally {
      setSigningUp(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'department_admin':
        return 'Department Administrator';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  // Loading state
  if (loading || (authLoading && !isInitialized)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Invalid</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/auth/council-login"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Go to Council Login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h1>
          <p className="text-gray-600 mb-4">
            You've been added to <strong>{invitation?.department.name}</strong> at{' '}
            <strong>{invitation?.department.organization.name}</strong>.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Accepting state
  if (accepting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Council Portal Invitation</h1>
          <p className="text-gray-600">
            You've been invited to join a council department on CivicNotices.
          </p>
        </div>

        {/* Invitation details */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-emerald-900 mb-3">Invitation Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-emerald-700">Council:</span>
              <span className="font-medium text-emerald-900">
                {invitation?.department.organization.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Department:</span>
              <span className="font-medium text-emerald-900">
                {invitation?.department.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Role:</span>
              <span className="font-medium text-emerald-900">
                {getRoleLabel(invitation?.role || '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Invited as:</span>
              <span className="font-medium text-emerald-900">{invitation?.email}</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* User is logged in but email doesn't match */}
        {user && user.email?.toLowerCase() !== invitation?.email.toLowerCase() && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              You're logged in as <strong>{user.email}</strong>, but this invitation was sent to{' '}
              <strong>{invitation?.email}</strong>. Please sign out and sign in with the correct account.
            </p>
          </div>
        )}

        {/* Not logged in - show options */}
        {!user && !showSignupForm && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSignupForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>
            <Link
              to={`/auth/sign-in?redirect=${encodeURIComponent(`/auth/accept-invitation?token=${token}`)}&email=${encodeURIComponent(invitation?.email || '')}`}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              I already have an account
            </Link>
          </div>
        )}

        {/* Signup form */}
        {!user && showSignupForm && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className={`${UI.inputFull} bg-gray-100`}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the email address the invitation was sent to.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={UI.inputFull}
                placeholder="Create a password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                className={UI.inputFull}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={signingUp}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {signingUp ? 'Creating Account...' : 'Create Account & Accept Invitation'}
            </button>

            <button
              type="button"
              onClick={() => setShowSignupForm(false)}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
            >
              Back to options
            </button>
          </form>
        )}

        {/* Accept button for logged-in user with matching email */}
        {user && user.email?.toLowerCase() === invitation?.email.toLowerCase() && (
          <button
            onClick={acceptInvitation}
            disabled={accepting}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        )}
      </div>
    </div>
  );
}
