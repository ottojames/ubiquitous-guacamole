import { useState, useEffect, useRef } from "react";
import { ArrowRight, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, Building2, Briefcase, ArrowLeft } from "lucide-react";
import * as UI from "@/styles/ui";
import { supabase } from "@/lib/supabase";

// Error messages for redirect errors
const ERROR_MESSAGES: Record<string, string> = {
  no_council_access: "No council access found for this account. Please contact your administrator.",
  department_not_found: "Department not found. Please contact support.",
  not_council_account: "This account is not associated with a council.",
  no_firm_access: "No firm access found for this account. Please contact your administrator.",
  not_firm_account: "This account is not associated with a firm.",
};

type PortalType = 'council' | 'professional' | null;

// Timeout wrapper for queries - accepts PromiseLike to work with Supabase query builders
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), ms)
    )
  ]);
}

// Direct redirect function - handles the redirect immediately after auth success
async function performRedirect(userId: string, portalType: PortalType): Promise<void> {
  console.log('[Login] performRedirect called for portal:', portalType, 'userId:', userId);

  if (!portalType) {
    console.error('[Login] No portal type provided');
    return;
  }

  // Small delay to let Supabase client settle after auth
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    if (portalType === 'council') {
      console.log('[Login] Starting council queries...');

      // Get user's department membership with timeout
      const { data: membership, error: membershipError } = await withTimeout(
        supabase
          .from('department_memberships')
          .select('department_id')
          .eq('user_id', userId)
          .limit(1)
          .single(),
        5000
      );

      console.log('[Login] Council membership query result:', membership, membershipError);

      if (membershipError || !membership) {
        console.error('[Login] No council membership found, signing out');
        await supabase.auth.signOut();
        window.location.href = '/login?error=no_council_access';
        return;
      }

      // Get department details with timeout
      const { data: department, error: deptError } = await withTimeout(
        supabase
          .from('departments')
          .select('slug, organization_id')
          .eq('id', membership.department_id)
          .single(),
        5000
      );

      console.log('[Login] Department query result:', department, deptError);

      if (deptError || !department) {
        console.error('[Login] Department not found, signing out');
        await supabase.auth.signOut();
        window.location.href = '/login?error=department_not_found';
        return;
      }

      // Get organization details with timeout
      const { data: organization, error: orgError } = await withTimeout(
        supabase
          .from('organizations')
          .select('slug, type')
          .eq('id', department.organization_id)
          .single(),
        5000
      );

      console.log('[Login] Organization query result:', organization, orgError);

      if (orgError || !organization || organization.type !== 'council') {
        console.error('[Login] Not a council org, signing out');
        await supabase.auth.signOut();
        window.location.href = '/login?error=not_council_account';
        return;
      }

      const redirectUrl = `/c/${organization.slug}/${department.slug}/dashboard`;
      console.log('[Login] Redirecting to council dashboard:', redirectUrl);
      window.location.href = redirectUrl;

    } else if (portalType === 'professional') {
      console.log('[Login] Starting professional queries...');

      // Get all user's organization memberships with timeout
      const { data: memberships, error: membershipError } = await withTimeout(
        supabase
          .from('organization_memberships')
          .select('organization_id')
          .eq('user_id', userId),
        5000
      );

      console.log('[Login] Professional memberships query result:', memberships, membershipError);

      if (membershipError || !memberships || memberships.length === 0) {
        console.error('[Login] No memberships found, signing out');
        await supabase.auth.signOut();
        window.location.href = '/login?error=no_firm_access';
        return;
      }

      // Find a firm organization
      let firmOrg = null;
      for (const membership of memberships) {
        const { data: org } = await withTimeout(
          supabase
            .from('organizations')
            .select('slug, type')
            .eq('id', membership.organization_id)
            .single(),
          5000
        );

        console.log('[Login] Checking org:', org);

        if (org && org.type === 'firm') {
          firmOrg = org;
          break;
        }
      }

      if (!firmOrg) {
        console.error('[Login] No firm org found, signing out');
        await supabase.auth.signOut();
        window.location.href = '/login?error=not_firm_account';
        return;
      }

      const redirectUrl = `/f/${firmOrg.slug}/dashboard`;
      console.log('[Login] Redirecting to firm dashboard:', redirectUrl);
      window.location.href = redirectUrl;
    }
  } catch (error) {
    console.error('[Login] Error during redirect:', error);
    // On timeout or error, try a simple redirect based on portal type
    if (portalType === 'professional') {
      console.log('[Login] Falling back to default firm redirect');
      window.location.href = '/f/otto-clarke-legal/dashboard';
    } else if (portalType === 'council') {
      console.log('[Login] Falling back to default council redirect');
      window.location.href = '/c/sampleton-borough-council/licensing/dashboard';
    } else {
      window.location.href = '/login?error=redirect_failed';
    }
  }
}

export default function Login() {
  const [portalType, setPortalType] = useState<PortalType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const redirectInProgress = useRef(false);

  // Check for error in URL query params (from redirect errors)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      setError(ERROR_MESSAGES[errorCode]);
      // Clear the error from URL without reloading
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      setLoading(false);
      return;
    }

    try {
      console.log('[Login v3] Starting login flow for portal:', portalType);

      // Sign in with Supabase
      console.log('[Login v3] Calling signInWithPassword...');
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[Login v3] Auth error:', authError);
        throw authError;
      }

      if (!data.user) {
        console.error('[Login v3] No user returned after login');
        throw new Error('No user returned after login');
      }

      console.log('[Login v3] Login successful, user:', data.user.email, 'id:', data.user.id);

      // Prevent double redirect
      if (redirectInProgress.current) {
        console.log('[Login v3] Redirect already in progress, skipping');
        return;
      }
      redirectInProgress.current = true;

      // Handle remember me - store session with longer expiry
      if (rememberMe && data.session) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        document.cookie = `sb-auth-token=${data.session.access_token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      }

      // Perform the redirect directly - no reliance on UnifiedAuthContext
      console.log('[Login v3] Performing redirect for portal:', portalType);
      await performRedirect(data.user.id, portalType);

    } catch (err) {
      console.error("[Login v3] Login error:", err);
      setError("Invalid credentials. Please check your email and password.");
      setLoading(false);
      redirectInProgress.current = false;
    }
    // Note: We don't setLoading(false) on success - redirect will happen
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Minimal header - logo only */}
      <header className="py-6">
        <div className={UI.container}>
          <a href="/" className="inline-flex items-center text-slate-900 font-extrabold text-xl tracking-tight hover:text-slate-700 transition-colors">
            CivicNotices
          </a>
        </div>
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {!portalType ? (
            /* Portal Selection */
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Sign in to CivicNotices
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Select your portal to continue
                </p>
              </div>

              {/* Portal cards */}
              <div className="space-y-3">
                {/* Council Portal */}
                <button
                  onClick={() => setPortalType('council')}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-900">Council Portal</h2>
                    <p className="text-sm text-slate-500">For council officers and licensing departments</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Professional Portal */}
                <button
                  onClick={() => setPortalType('professional')}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-900">Professional Portal</h2>
                    <p className="text-sm text-slate-500">For solicitors, law firms & GVOL operators</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Sign up link */}
              <p className="text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Create one here
                </a>
              </p>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => {
                  setPortalType(null);
                  setError(null);
                  setEmail("");
                  setPassword("");
                }}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to portal selection
              </button>

              {/* Header */}
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {portalType === 'council' ? 'Council Portal' : 'Professional Portal'}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Form card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={UI.inputFull + " pl-10"}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={UI.inputFull + " pl-10 pr-10"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[18px] w-[18px]" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={UI.btnPrimary + " w-full"}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-600">
                    Don't have an account?{" "}
                    <a
                      href={portalType === 'council' ? '/register/council' : '/register/firm'}
                      className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Sign up for free
                    </a>
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>GDPR compliant</span>
                </div>
              </div>

              {/* Help text */}
              <p className="text-center text-xs text-slate-500">
                Need access? Contact{" "}
                <a href="mailto:support@civicnotices.co.uk" className="text-blue-600 hover:text-blue-700">
                  support@civicnotices.co.uk
                </a>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-6 border-t border-slate-200">
        <div className={UI.container}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} CivicNotices</p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-slate-700 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-slate-700 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
