import { useState, useEffect, useRef } from "react";
import { ArrowRight, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import * as UI from "@/styles/ui";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";

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
    <div className="min-h-screen text-slate-900 relative" style={{
      background: 'linear-gradient(112deg, #223266 0%, #6EA3F7 53%, #F4F7FD 100%)'
    }}>
      {/* Subtle decorative elements */}
      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-white/30 blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-[300px] h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

      {/* Header sentinel for SiteHeader compact mode */}
      <div id="header-sentinel" className="h-2" aria-hidden="true" />
      <SiteHeader />

      {/* Hero - minimal, refined */}
      <section className="relative pt-12 md:pt-16 pb-12">
        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-5xl" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              {!portalType ? 'Choose Your Portal' : 'Welcome back'}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] font-normal md:text-lg">
              {!portalType ? 'Select the portal type to continue' : 'Sign in to your CivicNotices account'}
            </p>
          </div>
        </div>
      </section>

      {/* Portal Selection or Login Form */}
      <section className="pb-20 md:pb-28">
        <div className={UI.container}>
          {!portalType ? (
            /* Portal Selection */
            <div className="mx-auto max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Council Portal */}
                <button
                  onClick={() => setPortalType('council')}
                  className="group relative bg-white border-2 border-slate-200/60 rounded-2xl p-8 hover:border-blue-400 hover:shadow-xl transition-all duration-200 text-left"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                      <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Council Portal</h2>
                    <p className="text-slate-600 text-sm">
                      For council officers and licensing departments
                    </p>
                  </div>
                </button>

                {/* Professional Portal */}
                <button
                  onClick={() => setPortalType('professional')}
                  className="group relative bg-white border-2 border-slate-200/60 rounded-2xl p-8 hover:border-purple-400 hover:shadow-xl transition-all duration-200 text-left"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                      <svg className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Professional Portal</h2>
                    <p className="text-slate-600 text-sm">
                      For solicitors, law firms & GVOL operators
                    </p>
                  </div>
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-white/90 mb-2">
                  Don't have an account?
                </p>
                <a
                  href="/register"
                  className="text-sm text-white underline hover:text-white/80 transition-colors"
                >
                  Create one here
                </a>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="mx-auto max-w-md">
              {/* Back Button */}
              <button
                onClick={() => {
                  setPortalType(null);
                  setError(null);
                  setEmail("");
                  setPassword("");
                }}
                className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to portal selection</span>
              </button>

              <div className="rounded-xl bg-white border border-slate-200/60 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                {/* Help Text - Production */}
                <div className="mb-6 text-center">
                  <p className="text-sm text-slate-600">
                    Need access? Contact{" "}
                    <a href="mailto:support@civicnotices.co.uk" className="font-medium text-blue-600 hover:text-blue-700">
                      support@civicnotices.co.uk
                    </a>
                  </p>
                </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 pl-11 pr-4 rounded-lg border border-slate-300 bg-white text-[15px] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-11 pr-11 rounded-lg border border-slate-300 bg-white text-[15px] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400"
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
                  <p className="mt-2 text-xs text-slate-500">
                    Min 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-1">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors"
                  />
                  <label htmlFor="remember" className="ml-2.5 text-sm text-slate-600">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-11 flex items-center justify-center gap-2 rounded-lg font-semibold text-[15px] transition-all duration-200 ${
                    loading
                      ? "bg-blue-500 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm hover:shadow-md"
                  }`}
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

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-5 text-xs text-slate-500">
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

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <a href={portalType === 'council' ? '/register/council' : '/register/firm'} className="font-medium text-slate-700 hover:text-slate-900 transition-colors duration-150">
                    Sign up for free
                  </a>
                </p>
              </div>
            </div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section - lighter, more spaced */}
      <section className="pb-20 md:pb-28">
        <div className={UI.container}>
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-xl font-medium text-slate-700">
              The modern way to publish statutory notices
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white/60 border border-slate-200/50 p-7 text-center backdrop-blur-sm transition-all hover:bg-white hover:border-slate-300/60 hover:shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50/80">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-medium text-slate-900 text-[15px]">Instant publication</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Publish notices in seconds, not weeks</p>
              </div>

              <div className="rounded-lg bg-white/60 border border-slate-200/50 p-7 text-center backdrop-blur-sm transition-all hover:bg-white hover:border-slate-300/60 hover:shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50/80">
                  <Lock className="h-5 w-5 text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="mb-2 font-medium text-slate-900 text-[15px]">Full audit trail</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Cryptographic proof for legal compliance</p>
              </div>

              <div className="rounded-lg bg-white/60 border border-slate-200/50 p-7 text-center backdrop-blur-sm transition-all hover:bg-white hover:border-slate-300/60 hover:shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50/80">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-medium text-slate-900 text-[15px]">Save up to 85%</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Compared to traditional newspaper notices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - lighter, more minimal */}
      <footer className="border-t border-slate-200/60 py-10">
        <div className={`${UI.container} text-center`}>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <a href="/about" className="hover:text-slate-700 transition-colors duration-150">
              About
            </a>
            <a href="/docs" className="hover:text-slate-700 transition-colors duration-150">
              Docs
            </a>
            <a href="/privacy" className="hover:text-slate-700 transition-colors duration-150">
              Privacy
            </a>
            <a href="/terms" className="hover:text-slate-700 transition-colors duration-150">
              Terms
            </a>
            <a href="/contact" className="hover:text-slate-700 transition-colors duration-150">
              Contact
            </a>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} CivicNotices. Modernising statutory notices for the digital age.
          </p>
        </div>
      </footer>
    </div>
  );
}
