import { useState } from "react";
import { CheckCircle2, ArrowRight, Building2, FileText, Users, MapPin, TrendingUp, Shield } from "lucide-react";
import * as UI from '@/styles/ui';
import Footer from '@/components/Footer';

type Audience = 'councils' | 'applicants' | 'public';

// Analytics tracking
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log("[analytics]", event, payload);
}

export default function ConferenceLanding() {
  // Get audience from URL parameter, default to councils
  const urlParams = new URLSearchParams(window.location.search);
  const initialAudience = (urlParams.get('audience') || 'councils') as Audience;
  const [activeAudience, setActiveAudience] = useState<Audience>(initialAudience);

  // Track page view
  useState(() => {
    track('conference_landing_view', { audience: initialAudience });
  });

  const switchAudience = (audience: Audience) => {
    setActiveAudience(audience);
    track('conference_audience_switch', { to: audience });
    // Update URL without reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('audience', audience);
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white flex flex-col">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-xl"
      >
        Skip to main content
      </a>

      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center text-slate-900 font-extrabold text-xl tracking-tight">
              CivicNotices
            </a>
            <a
              href="/publish"
              className={`${UI.btnPrimary} h-10 py-0 text-sm`}
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {/* Audience selector */}
        <section className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-900 mb-4">
                Institute of Licensing Conference 2025
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                The End of Newspaper Notices
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Choose your role to see how CivicNotices transforms statutory notice publication
              </p>
            </div>

            {/* Audience tabs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button
                onClick={() => switchAudience('councils')}
                className={`flex-1 rounded-xl px-6 py-4 text-left transition-all ${
                  activeAudience === 'councils'
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">For Councils</div>
                    <div className={`text-sm ${activeAudience === 'councils' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Save £150,000/year
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => switchAudience('applicants')}
                className={`flex-1 rounded-xl px-6 py-4 text-left transition-all ${
                  activeAudience === 'applicants'
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">For Applicants</div>
                    <div className={`text-sm ${activeAudience === 'applicants' ? 'text-blue-100' : 'text-slate-500'}`}>
                      £49.99 vs £600
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => switchAudience('public')}
                className={`flex-1 rounded-xl px-6 py-4 text-left transition-all ${
                  activeAudience === 'public'
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">For Residents</div>
                    <div className={`text-sm ${activeAudience === 'public' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Free & transparent
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Councils content */}
        {activeAudience === 'councils' && (
          <CouncilsContent />
        )}

        {/* Applicants content */}
        {activeAudience === 'applicants' && (
          <ApplicantsContent />
        )}

        {/* Public content */}
        {activeAudience === 'public' && (
          <PublicContent />
        )}

        {/* Common CTA section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-center shadow-2xl">
              <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

              <div className="relative">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Ready to see it in action?
                </h2>
                <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                  {activeAudience === 'councils' && "Join 40+ UK councils already using CivicNotices"}
                  {activeAudience === 'applicants' && "Publish your first notice in minutes, not weeks"}
                  {activeAudience === 'public' && "Search notices in your area right now"}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={activeAudience === 'councils' ? '/contact' : '/publish'}
                    onClick={() => track('conference_cta_click', { audience: activeAudience })}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
                  >
                    {activeAudience === 'councils' ? 'Request demo' : 'Get started free'}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    View pricing
                  </a>
                </div>

                <p className="mt-6 text-sm text-blue-200">
                  No credit card required · 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Councils content component
function CouncilsContent() {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Video placeholder */}
        <div className="mb-12">
          <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="text-white text-center p-8">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-sm text-slate-400">
                Video: 2-minute platform demo for councils
              </p>
              <p className="text-xs text-slate-500 mt-2">
                YouTube embed will be added here
              </p>
            </div>
          </div>
        </div>

        {/* Key benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Massive Cost Savings</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Westminster Council: £132,000/year on newspaper ads → £0 with CivicNotices
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  100% cost elimination
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Analytics You've Never Had</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Most councils don't know how many notices they process. We give you complete visibility.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  Real-time dashboards
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Complete Audit Trail</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Every notice timestamped, every representation tracked. Court-ready evidence at your fingertips.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  Legally compliant
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Representation Management</h3>
                <p className="text-slate-600 text-sm mb-3">
                  All objections and support in one place. Filter, review, and generate hearing reports instantly.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  Centralized workflow
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key features list */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-6">What you get</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Multi-department access (Licensing, Planning, Highways)',
              'Automated template building',
              'Blue notice photo tracking',
              'Representation inbox and filters',
              'Analytics dashboards',
              'Proof-of-posting certificates',
              'API integration',
              'Dedicated support',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900 mb-2">
            "Our council had no idea we were spending £150k+ annually on newspaper ads"
          </p>
          <p className="text-sm text-slate-600">
            Head of Licensing, North Yorkshire Council
          </p>
        </div>
      </div>
    </section>
  );
}

// Applicants content component
function ApplicantsContent() {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Video placeholder */}
        <div className="mb-12">
          <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="text-white text-center p-8">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-sm text-slate-400">
                Video: How to publish a notice in under 5 minutes
              </p>
              <p className="text-xs text-slate-500 mt-2">
                YouTube embed will be added here
              </p>
            </div>
          </div>
        </div>

        {/* Cost comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              OLD WAY
            </div>
            <h3 className="text-xl font-bold text-rose-900 mb-4">Newspaper Notices</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-rose-700">
                <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-xs">✗</div>
                <span className="text-sm">£400-600 per notice</span>
              </div>
              <div className="flex items-center gap-2 text-rose-700">
                <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-xs">✗</div>
                <span className="text-sm">5-10 days to publish</span>
              </div>
              <div className="flex items-center gap-2 text-rose-700">
                <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-xs">✗</div>
                <span className="text-sm">Manual template formatting</span>
              </div>
              <div className="flex items-center gap-2 text-rose-700">
                <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-xs">✗</div>
                <span className="text-sm">No validation or error checking</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-rose-900">£600</div>
            <div className="text-sm text-rose-600">per notice + weeks of waiting</div>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 relative shadow-lg">
            <div className="absolute -top-3 -right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              NEW WAY
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-4">CivicNotices</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm">£49.99 per notice</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm">Published instantly</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm">Upload PDF → Auto-extract data</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm">Automatic compliance checking</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-900">£49.99</div>
            <div className="text-sm text-green-600">
              <span className="font-semibold">92% savings</span> · Live in minutes
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">How it works</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div className="font-semibold text-slate-900 mb-2">1. Upload</div>
              <p className="text-sm text-slate-600">
                Upload your application PDF or fill in a structured form
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="font-semibold text-slate-900 mb-2">2. Validate</div>
              <p className="text-sm text-slate-600">
                AI extracts details and validates against legal requirements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
              <div className="font-semibold text-slate-900 mb-2">3. Publish</div>
              <p className="text-sm text-slate-600">
                Pay £49.99 and go live instantly with full audit trail
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-6">What you get</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'OCR extraction from PDFs',
              'Automatic consultation period calculation',
              'Real-time validation',
              'Instant publication',
              'Email confirmation',
              'Proof-of-publication certificate',
              'Representation notifications',
              'Full audit trail',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Public content component
function PublicContent() {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Video placeholder */}
        <div className="mb-12">
          <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="text-white text-center p-8">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-sm text-slate-400">
                Video: Find and respond to notices in your area
              </p>
              <p className="text-xs text-slate-500 mt-2">
                YouTube embed will be added here
              </p>
            </div>
          </div>
        </div>

        {/* Key benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Know What's Happening Near You</h3>
                <p className="text-slate-600 text-sm">
                  Search by postcode, see all applications within your chosen radius on an interactive map.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Submit Objections Easily</h3>
                <p className="text-slate-600 text-sm">
                  Submit representations directly through the platform. Select licensing objectives, add your comments.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Always Free for Residents</h3>
                <p className="text-slate-600 text-sm">
                  No sign-up required to search. Free to submit objections or support. Transparent and accessible.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Share with Your Community</h3>
                <p className="text-slate-600 text-sm">
                  Share notices to Facebook groups, WhatsApp, or email. Keep your community informed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6">What you can do</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Search by postcode or address',
              'View notices on interactive map',
              'Filter by notice type',
              'Set radius around your location',
              'Read full application details',
              'Submit objections or support',
              'Track consultation deadlines',
              'Share to social media',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA to search */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Start searching now</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Over 1,800 active notices across the UK. See what's happening in your area.
          </p>
          <a
            href="/notices"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
          >
            Browse all notices
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
