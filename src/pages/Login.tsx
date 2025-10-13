import { useState } from "react";
import { ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import * as UI from "@/styles/ui";

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

    // Simulate API call
    setTimeout(() => {
      if (email && password) {
        console.log("Login attempt:", { email, password });
        // Handle login logic here
      } else {
        setError("Please enter both email and password");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={`${UI.pageWrap} min-h-screen`}>
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

      {/* Hero */}
      <section className="relative overflow-hidden pb-32 pt-16 md:pb-40 md:pt-24 lg:pb-48">
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        {/* Vertical gradient fade */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '400px',
            background: 'linear-gradient(to bottom, rgba(247, 248, 252, 0) 0%, rgba(247, 248, 252, 0.5) 40%, rgba(247, 248, 252, 0.9) 70%, #F7F8FC 100%)'
          }}
          aria-hidden="true"
        />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-6xl">
              Welcome back
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-xl">
              Sign in to your CivicNotices account to manage your statutory notices
            </p>
          </div>
        </div>
      </section>

      {/* Login Form */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="mx-auto max-w-md">
            <div className={`${UI.card} p-8 md:p-10`}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className={UI.label}>
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${UI.input} w-full pl-10`}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className={UI.label}>
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${UI.input} w-full pl-10`}
                      required
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-slate-700">
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
                  className={`${UI.btnPrimary} w-full justify-center ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <a href="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
                    Sign up for free
                  </a>
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>GDPR compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="pb-16 md:pb-24">
        <div className={UI.container}>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">
              Trusted by 40+ UK councils and thousands of users
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className={`${UI.card} p-6 text-center`}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">Instant publication</h3>
                <p className="text-sm text-slate-600">Publish notices in seconds, not weeks</p>
              </div>

              <div className={`${UI.card} p-6 text-center`}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Lock className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">Full audit trail</h3>
                <p className="text-sm text-slate-600">Cryptographic proof for legal compliance</p>
              </div>

              <div className={`${UI.card} p-6 text-center`}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">Save up to 85%</h3>
                <p className="text-sm text-slate-600">Compared to traditional newspaper notices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className={`${UI.container} text-center`}>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <a href="/about" className="hover:text-slate-900">
              About
            </a>
            <a href="/docs" className="hover:text-slate-900">
              Docs
            </a>
            <a href="/privacy" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="/terms" className="hover:text-slate-900">
              Terms
            </a>
            <a href="/contact" className="hover:text-slate-900">
              Contact
            </a>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CivicNotices. Modernising statutory notices for the digital age.
          </p>
        </div>
      </footer>
    </div>
  );
}
