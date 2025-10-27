import { useState } from "react";
import { ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import * as UI from "@/styles/ui";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/#notices", label: "Find notices" },
  { href: "/#for-councils", label: "For councils" },
  { href: "/pricing", label: "Pricing" },
] as const;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Demo council logins (no password validation required)
    if (email === "licensing@sample.gov.uk" && password === "sample123") {
      console.log("Sample Council login successful!");
      window.location.href = "/c/sample-borough/licensing";
      return;
    } else if (email === "demo@council.gov.uk" && password === "demo123") {
      console.log("Westminster Council login successful!");
      window.location.href = "/c/westminster/licensing";
      return;
    }

    // Real Supabase authentication for test users
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        console.log("User authenticated:", data.user.email);

        // Get user's department membership to redirect to correct dashboard
        const { data: membership, error: membershipError } = await supabase
          .from('department_memberships')
          .select(`
            department:departments (
              id,
              slug
            )
          `)
          .eq('user_id', data.user.id)
          .limit(1)
          .single();

        if (membershipError || !membership) {
          console.error("No department membership found:", membershipError);
          // Fallback to sample-borough for demo
          window.location.href = "/c/sample-borough/licensing";
          return;
        }

        // Redirect to user's department dashboard
        const deptSlug = (membership as any).department.slug;
        window.location.href = `/c/sample-borough/${deptSlug}/dashboard`;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials. Try: licensing@sample.gov.uk / sample123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 relative" style={{
      background: 'linear-gradient(112deg, #223266 0%, #6EA3F7 53%, #F4F7FD 100%)'
    }}>
      {/* Subtle decorative elements */}
      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-white/30 blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-[300px] h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg" style={{ height: 'var(--headerH)' }}>
        <div className={`${UI.container} h-full`}>
          <div className="flex h-full items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.5px' }}>
                CivicNotices
              </a>
              <nav className="hidden items-center gap-6 md:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            {/* Right: ghost + primary */}
            <div className="flex items-center gap-3">
              <a href="/login" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>
                Sign in
              </a>
              <a href="/publish" className={`${UI.btnPrimary} h-11 py-0 text-sm`}>
                Get started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - minimal, refined */}
      <section className="relative pt-12 md:pt-16 pb-12">
        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-5xl" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Welcome back
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] font-normal md:text-lg">
              Sign in to your CivicNotices account to manage your statutory notices
            </p>
          </div>
        </div>
      </section>

      {/* Login Form */}
      <section className="pb-20 md:pb-28">
        <div className={UI.container}>
          <div className="mx-auto max-w-md">
            <div className="rounded-xl bg-white border border-slate-200/60 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              {/* Demo Credentials Banner */}
              <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Test Accounts</p>
                    <div className="space-y-2 mb-3">
                      <div className="bg-white/60 rounded-lg p-2 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Sample Borough Council (Demo)</p>
                        <p className="text-xs text-blue-700">
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">licensing@sample.gov.uk</code> / <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">sample123</code>
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Westminster Council (Demo)</p>
                        <p className="text-xs text-blue-700">
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">demo@council.gov.uk</code> / <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">demo123</code>
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-200 space-y-1.5">
                      <p className="text-xs font-semibold text-blue-900">RBAC Test Users:</p>
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-blue-700">
                        <p><code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">viewer@test.civicnotices.co.uk</code> - Read-only (4 permissions)</p>
                        <p><code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">officer@test.civicnotices.co.uk</code> - Officer (12 permissions)</p>
                        <p><code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">admin@test.civicnotices.co.uk</code> - Admin (21 permissions)</p>
                        <p className="text-blue-600 mt-1">Password: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">TestPassword123!</code></p>
                      </div>
                    </div>
                  </div>
                </div>
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
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-11 pr-4 rounded-lg border border-slate-300 bg-white text-[15px] placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-1">
                  <input
                    id="remember"
                    type="checkbox"
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
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm hover:shadow-md"
                  }`}
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight className="h-[18px] w-[18px]" />}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 h-11 rounded-lg border border-slate-300 bg-white px-4 text-[15px] font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Trust Indicators - moved inside card */}
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
                  <a href="/signup" className="font-medium text-slate-700 hover:text-slate-900 transition-colors duration-150">
                    Sign up for free
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - lighter, more spaced */}
      <section className="pb-20 md:pb-28">
        <div className={UI.container}>
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-xl font-medium text-slate-700">
              Trusted by 40+ UK councils and thousands of users
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
