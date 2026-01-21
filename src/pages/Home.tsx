import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as UI from '@/styles/ui';
import {
  FileText, MapPin, CheckCircle2,
  ArrowRight, Menu, X,
  Upload, Search, Archive,
  ChevronLeft, ChevronRight
} from "lucide-react";
import FilterBar from "../components/FilterBar";
import type { Filters } from "../lib/filter";
import AddressSearchBar, { type AddressSearchSubmitPayload } from "@/components/search/AddressSearchBar";
import SearchResults from "@/components/home/SearchResults";
import { resolveToPostcodeOrNull } from '@/lib/address';
import { getCouncilForPostcode } from '@/lib/councils';
import useNoticeSearch from '@/hooks/useNoticeSearch';
import { useStats } from '@/hooks/useStats';
import { toast, useToastController } from '@/lib/ui/toast';
import Footer from '@/components/Footer';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// -------- analytics stub (intentional - replace with actual analytics service) --------
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log("[analytics]", event, payload);
}

// Navigation links (shared constant)
const NAV_LINKS = [
  { href: "#notices", label: "Find notices" },
  { href: "#for-councils", label: "For councils" },
  { href: "/pricing", label: "Pricing" },
  { href: "/email-alerts", label: "Email alerts" },
] as const;

// Testimonials (generic - no specific council endorsements implied)
const testimonials = [
  { text: "Instant publication, easy exports, and our legal team love the audit trail.", name: "Legal Officer", org: "Local Authority" },
  { text: "Residents are submitting comments online and we have the proof for every step.", name: "Licensing Manager", org: "Council Licensing Team" },
  { text: "No more last-minute print bookings — everything is digital, accessible, and timestamped.", name: "Planning Officer", org: "Planning Department" },
];

// Council logos hidden until we have verified partnerships
// const councilLogos = [
//   { src: "/logos/leeds.png", alt: "Leeds City Council", width: 120, height: 28 },
//   { src: "/logos/westminster.png", alt: "City of Westminster", width: 160, height: 28 },
//   { src: "/logos/manchester.png", alt: "Manchester City Council", width: 180, height: 28 },
// ];
const councilLogos: { src: string; alt: string; width: number; height: number }[] = [];

// Stats are now fetched dynamically via useStats() hook

function formatPostcodeForDisplay(compact?: string | null) {
  if (!compact) return null;
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

export default function Home() {
  // header
  const [compactNav, setCompactNav] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>(typeof window !== "undefined" ? window.location.hash || "" : "");

  // Focus trap for mobile menu (WCAG 2.4.3 compliance)
  const mobileTrapRef = useFocusTrap(mobileOpen, () => setMobileOpen(false));

  // Respect user's motion preferences for accessibility
  const prefersReducedMotion = useReducedMotion();
  const animationDuration = prefersReducedMotion ? 0 : 500;

  // Stats from API
  const { data: stats } = useStats();
  const STATS = {
    notices: stats?.notices?.toLocaleString() ?? '—',
    comments: stats?.representations?.toLocaleString() ?? '—',
    councils: stats?.councils?.toLocaleString() ?? '—',
  };

  // Hysteresis-free compact header using IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = document.getElementById("header-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setCompactNav(!e.isIntersecting);
      },
      { rootMargin: "0px 0px 0px 0px", threshold: 1 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const fn = () => setActiveHash(window.location.hash || "");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  // homepage browse/search state
  const navigate = useNavigate();
  const [addressValue, setAddressValue] = useState('');
  const [addressInlineError, setAddressInlineError] = useState<string | null>(null);

  const toastMessage = useToastController();

  const [filters, setFilters] = useState<Filters>({ type: "", status: "", start: "", end: "", authority: "" });
  const [showExplainer, setShowExplainer] = useState(false);

  const { notices: latestNotices, loading: latestLoading, error: latestError, refetch: refetchLatest } = useNoticeSearch({
    limit: 5,
    sort: 'created_at.desc',
  });

  // Testimonial carousel with slide animation
  const [testiIdx, setTestiIdx] = useState(0);
  const [testiPaused, setTestiPaused] = useState(false);
  const [testiAnimating, setTestiAnimating] = useState(false);
  const [testiDirection, setTestiDirection] = useState<'left' | 'right'>('right');
  const [prevIdx, setPrevIdx] = useState(0);

  useEffect(() => {
    if (testiPaused || testiAnimating) return;
    const t = setInterval(() => {
      goToNextTestimonial();
    }, 7000);
    return () => clearInterval(t);
  }, [testiPaused, testiAnimating, testiIdx]);

  const goToPrevTestimonial = () => {
    if (testiAnimating) return;
    setTestiAnimating(true);
    setTestiDirection('left');
    setPrevIdx(testiIdx);
    setTimeout(() => {
      setTestiIdx((i) => (i - 1 + testimonials.length) % testimonials.length);
    }, 0);
    setTimeout(() => setTestiAnimating(false), animationDuration);
  };

  const goToNextTestimonial = () => {
    if (testiAnimating) return;
    setTestiAnimating(true);
    setTestiDirection('right');
    setPrevIdx(testiIdx);
    setTimeout(() => {
      setTestiIdx((i) => (i + 1) % testimonials.length);
    }, 0);
    setTimeout(() => setTestiAnimating(false), animationDuration);
  };

  const handleAddressSubmit = useCallback(async ({ query, suggestion }: AddressSearchSubmitPayload) => {
    const rawInput = (query || addressValue).trim();
    if (!rawInput) return;
    setAddressInlineError(null);

    try {
      const resolvedPostcode = await resolveToPostcodeOrNull(suggestion ?? rawInput);
      let councilId = '';
      let councilName = '';
      if (resolvedPostcode) {
        try {
          const council = await getCouncilForPostcode(resolvedPostcode);
          councilId = council?.id ?? '';
          councilName = council?.name ?? '';
        } catch (lookupError) {
          console.warn('[council lookup error]', lookupError);
        }
      }

      const params = new URLSearchParams();
      params.set('query', rawInput);
      if (resolvedPostcode) params.set('postcode', resolvedPostcode);
      // Don't auto-filter by council since notices may not have council_id set
      // if (councilId) params.set('council', councilId);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.start) params.set('start', filters.start);
      if (filters.end) params.set('end', filters.end);
      params.set('view', 'map'); // Default to map view to show clusters

      navigate(`/notices?${params.toString()}`);

      const displayPostcode = formatPostcodeForDisplay(resolvedPostcode);
      const label = suggestion?.label ?? (councilName || rawInput);
      toast(
        displayPostcode
          ? `Showing notices for ${label} (${displayPostcode})`
          : `Showing notices for ${label}`
      );
      setAddressValue(suggestion?.label ?? rawInput);
    } catch (err) {
      console.error('[home] search submit failed', err);
      setAddressInlineError('Couldn’t load notices. Try again.');
    }
  }, [addressValue, filters, navigate, toast]);

  const handleFreeText = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    void handleAddressSubmit({ query: trimmed });
  }, [handleAddressSubmit]);

  return (
    <div className={`${UI.pageWrap} relative flex flex-col font-sans`}>
      {/* Skip link for keyboard accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* -------- HEADER: sticky, compact-on-scroll, one primary CTA -------- */}
      <header
        className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg ${compactNav ? "bg-white/80" : "bg-white/80"}`}
        style={{ height: "var(--headerH)" }}
      >
        <div className={`${UI.container} h-full`}>
          <div className="h-full flex items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-6">
              <a href="#top" className="flex items-center text-slate-900 font-extrabold tracking-tight" style={{ letterSpacing: "-0.5px" }}>
                <span className={`transition-all ${compactNav ? "text-lg" : "text-xl"}`}>CivicNotices</span>
              </a>
              <nav className="hidden md:flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    data-active={activeHash === link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900 data-[active=true]:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right: ghost + primary */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>Sign in</a>
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className={`${UI.btnPrimary} h-11 py-0 text-sm`}
              >
                Get started
              </a>
            </div>

            {/* Mobile: Publish stays visible + hamburger for sheet */}
            <div className="md:hidden flex items-center gap-2">
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className={`${UI.btnPrimary} h-10 py-0 text-sm`}
                aria-label="Publish a notice"
              >
                <FileText className="w-4 h-4 mr-1" aria-hidden="true" /> Publish
              </a>
              <button
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sheet */}
        {mobileOpen && (
          <div ref={mobileTrapRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">CivicNotices</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-base text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 py-1"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex items-center gap-3">
                <a href="/login" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>Sign in</a>
                <a
                  href="/publish"
                  onClick={() => { setMobileOpen(false); track("publish_started", { audience: "public" }); }}
                  className={`${UI.btnPrimary} h-11 py-0 text-sm`}
                >
                  Publish a notice
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
      {/* Sentinel right after header */}
      <div id="header-sentinel" className="h-2" aria-hidden="true" />

      {/* Main content landmark for skip link */}
      <main id="main-content">
        {/* -------- HERO SECTION -------- */}
        <section className="relative overflow-hidden pb-32 pt-20 md:pb-40 md:pt-32 lg:pb-48">
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        {/* Vertical gradient fade - Approach A: "Fade to Canvas" */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '400px',
            background: 'linear-gradient(to bottom, rgba(247, 248, 252, 0) 0%, rgba(247, 248, 252, 0.5) 40%, rgba(247, 248, 252, 0.9) 70%, #F7F8FC 100%)'
          }}
          aria-hidden="true"
        />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-6xl lg:text-7xl">
              Publish legal notices digitally. £50 per notice.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-xl lg:text-2xl">
              Replace expensive newspaper ads with instant digital notices. Full audit trail included.
            </p>

            <button
              type="button"
              onClick={() => setShowExplainer(true)}
              className="mt-4 text-sm text-blue-700 hover:text-blue-800 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
            >
              What is a statutory notice?
            </button>

            {/* Search Card - Stripe-inspired glassmorphism */}
            <div className="mx-auto mt-12 max-w-4xl">
              {/* Gradient border wrapper */}
              <div className="group relative rounded-[32px] bg-gradient-to-br from-blue-500/20 via-white/30 to-blue-600/20 p-[1.5px] shadow-[0_20px_70px_-10px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_20px_80px_-5px_rgba(37,99,235,0.45)]">
                {/* Animated glow effect */}
                <div className="absolute -inset-[2px] rounded-[32px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />

                {/* Inner card with glassmorphism */}
                <div className="relative overflow-hidden rounded-[31px] bg-white/90 backdrop-blur-xl">
                  {/* Subtle inner gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-slate-50/30" aria-hidden="true" />

                  {/* Content */}
                  <div className="relative z-10 p-6 md:p-8">
                    <AddressSearchBar
                      value={addressValue}
                      onValueChange={(next) => {
                        setAddressValue(next);
                        setAddressInlineError(null);
                      }}
                      onSubmit={handleAddressSubmit}
                      onFreeText={handleFreeText}
                      testIdPrefix="home"
                    />

                    {addressInlineError && (
                      <div role="alert" className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 text-sm text-rose-700 shadow-sm">
                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{addressInlineError}</span>
                      </div>
                    )}

                    {/* Filters with subtle separator */}
                    <div className="mt-6 border-t border-slate-200/60 pt-6">
                      <FilterBar filters={filters} setFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))} />
                    </div>

                    {/* Stats with modern badges */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/80 px-4 py-2 text-xs font-semibold text-blue-900 shadow-sm ring-1 ring-blue-200/60">
                        <span className="tabular-nums text-sm">{STATS.notices}</span>
                        <span className="text-blue-600/70">notices</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-slate-50 to-slate-100/80 px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/60">
                        <span className="tabular-nums text-sm">{STATS.comments}</span>
                        <span className="text-slate-600/70">comments</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/80 px-4 py-2 text-xs font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-200/60">
                        <span className="tabular-nums text-sm">{STATS.councils}</span>
                        <span className="text-emerald-600/70">councils</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-16 md:mt-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className={`${UI.btnPrimary} inline-flex items-center gap-3 px-10 py-5 text-lg shadow-[0_8px_24px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.55)]`}
              >
                Publish a Notice - £50
                <ArrowRight className="h-6 w-6" />
              </a>
              <a
                href="#notices"
                className={`${UI.btnSecondary} px-6 py-3 text-sm`}
              >
                Browse notices
              </a>
            </div>

            <p className="mt-8 text-sm text-slate-500">
              No sign-up needed · Full audit trail · Save up to 85% vs newspapers
            </p>
          </div>
        </div>
      </section>

      {/* -------- TESTIMONIALS & SOCIAL PROOF -------- */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-slate-50 to-white p-8 md:p-12 shadow-xl ring-1 ring-blue-100">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />

            <div
              className="relative text-center"
              onMouseEnter={() => setTestiPaused(true)}
              onMouseLeave={() => setTestiPaused(false)}
            >
              {/* Previous button - positioned absolutely on the left with higher z-index */}
              <button
                onClick={goToPrevTestimonial}
                disabled={testiAnimating}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5 text-slate-700" />
              </button>

              {/* Next button - positioned absolutely on the right with higher z-index */}
              <button
                onClick={goToNextTestimonial}
                disabled={testiAnimating}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5 text-slate-700" />
              </button>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-900">
                <CheckCircle2 className="h-4 w-4" />
                What our users say
              </div>

              {/* Testimonial content with slide animation */}
              <div className="overflow-hidden relative min-h-[200px]">
                {testiAnimating && !prefersReducedMotion && (
                  /* Previous testimonial sliding out */
                  <div
                    className={`absolute inset-0 ${
                      testiDirection === 'right'
                        ? 'animate-slideOutLeft'
                        : 'animate-slideOutRight'
                    }`}
                  >
                    <blockquote className="mx-auto mb-6 max-w-3xl text-2xl font-medium leading-relaxed text-slate-900 md:text-3xl">
                      "{testimonials[prevIdx].text}"
                    </blockquote>

                    <div className="mb-4 text-base text-slate-700">
                      <span className="font-semibold">{testimonials[prevIdx].name}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span>{testimonials[prevIdx].org}</span>
                    </div>
                  </div>
                )}

                {/* Current testimonial */}
                <div
                  className={testiAnimating && !prefersReducedMotion ? (
                    testiDirection === 'right'
                      ? 'animate-slideInFromRight'
                      : 'animate-slideInFromLeft'
                  ) : ''}
                >
                  <blockquote className="mx-auto mb-6 max-w-3xl text-2xl font-medium leading-relaxed text-slate-900 md:text-3xl">
                    "{testimonials[testiIdx].text}"
                  </blockquote>

                  <div className="mb-4 text-base text-slate-700">
                    <span className="font-semibold">{testimonials[testiIdx].name}</span>
                    <span className="mx-2 text-slate-400">·</span>
                    <span>{testimonials[testiIdx].org}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Testimonial navigation">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    role="tab"
                    aria-selected={testiIdx === idx}
                    aria-label={`View testimonial ${idx + 1}`}
                    onClick={() => {
                      if (testiAnimating || testiIdx === idx) return;
                      setTestiAnimating(true);
                      setTestiDirection(idx > testiIdx ? 'right' : 'left');
                      setTimeout(() => {
                        setTestiIdx(idx);
                        setTimeout(() => setTestiAnimating(false), prefersReducedMotion ? 0 : 50);
                      }, animationDuration);
                    }}
                    className="p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-full"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        testiIdx === idx ? "w-8 bg-blue-600" : "w-2 bg-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-8 grayscale opacity-60">
                {councilLogos.map((l) => (
                  <img
                    key={l.alt}
                    src={l.src}
                    alt={l.alt}
                    width={l.width}
                    height={l.height}
                    loading="lazy"
                    className="h-7 w-auto object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* -------- LATEST NOTICES -------- */}
      <section id="notices" className="scroll-mt-[var(--headerH)] py-24 md:py-32">
        <div className={UI.container}>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-900">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Live feed
            </div>
            <h2 className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent md:text-5xl">
              Latest public notices across the UK
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-slate-600">
              Real-time statutory notices from councils nationwide. Every notice is timestamped, verified, and fully searchable.
            </p>
          </div>

          {latestError && (
            <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 shadow-lg">
              <p className="text-base text-rose-700">Couldn't load the latest notices. {latestError}</p>
              <button
                type="button"
                onClick={refetchLatest}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-6 py-3 text-sm font-medium text-rose-700 shadow-sm transition hover:border-rose-400 hover:shadow-md"
              >
                Retry
              </button>
            </div>
          )}

          {!latestError && (
            <div className="relative">
              <div className="absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-200/10 blur-3xl" />
              <div className="absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-300/10 blur-3xl" />

              <div className="relative">
                <SearchResults
                  results={latestNotices}
                  query="latest notices"
                  loading={latestLoading}
                  loadingMessage="Loading the most recent notices…"
                  emptyMessage="No notices published yet. Check back soon."
                />
              </div>
            </div>
          )}

          <div className="mt-16 text-center">
            <a
              href="/notices"
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Browse all notices
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <p className="mt-4 text-sm text-slate-500">
              Explore over {STATS.notices} statutory notices with advanced filters
            </p>
          </div>
        </div>
      </section>

      {/* -------- PUBLISH (three steps) -------- */}
      <section id="publish" className="relative scroll-mt-[var(--headerH)] overflow-hidden py-24 md:py-32">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100/30 via-blue-200/20 to-transparent blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-900">
              <CheckCircle2 className="h-4 w-4" />
              Legally compliant
            </div>
            <h2 className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent md:text-5xl">
              Publish in minutes, not weeks
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-slate-600">
              Traditional newspaper notices take 5-10 days. With CivicNotices, you're live instantly with a complete audit trail.
            </p>
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: 1,
                  title: "Fill the form",
                  desc: "Smart interface guides you through every required field. Real-time validation ensures compliance before you publish.",
                  Icon: FileText,
                  gradient: "from-blue-50 to-blue-100"
                },
                {
                  n: 2,
                  title: "Choose coverage",
                  desc: "Target by postcode, ward, or go UK-wide. Interactive map shows exactly who will see your notice.",
                  Icon: MapPin,
                  gradient: "from-slate-50 to-blue-50"
                },
                {
                  n: 3,
                  title: "Get instant proof",
                  desc: "Download timestamped certificates with cryptographic verification. Court-ready evidence at your fingertips.",
                  Icon: CheckCircle2,
                  gradient: "from-blue-50 to-slate-50"
                },
              ].map(({ n, title, desc, Icon, gradient }) => (
                <div
                  key={n}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl`}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl transition-all group-hover:scale-150" />

                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Icon className="h-8 w-8 text-blue-700" aria-hidden="true" />
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
                        <span className="text-xl font-bold text-slate-900">{n}</span>
                      </div>
                    </div>

                    <h3 className="mb-3 text-2xl font-bold text-slate-900">{title}</h3>
                    <p className="text-base leading-relaxed text-slate-700">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <a
              href="/publish"
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-10 py-5 text-lg font-semibold text-white shadow-2xl transition-all hover:shadow-blue-500/50 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              onClick={() => track("publish_started", { audience: "public" })}
            >
              Start publishing now
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <p className="mt-6 text-base text-slate-600">
              <span className="font-semibold">£49.99 per notice</span> · No subscription · Instant activation
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Automatic validation
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Cryptographic proof
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Full audit trail
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* -------- COUNCILS SECTION -------- */}
      <section id="for-councils" className="relative scroll-mt-[var(--headerH)] overflow-hidden py-24 md:py-32">
        <div className="absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-blue-100/30 via-blue-200/20 to-transparent blur-3xl" />

        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-900">
              <Archive className="h-4 w-4" />
              Enterprise ready
            </div>
            <h2 className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-4xl font-extrabold leading-[1.4] tracking-tight text-transparent md:text-5xl pb-1">
              Built for councils, designed for scale
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-slate-600">
              From parish councils to metropolitan authorities — we support all UK council types for statutory publishing.
            </p>
          </div>

          <div className="mb-16 flex flex-wrap items-center justify-center gap-10 opacity-40 grayscale">
            {councilLogos.map((l) => (
              <img
                key={l.alt}
                src={l.src}
                alt={l.alt}
                width={l.width}
                height={l.height}
                loading="lazy"
                className="h-8 w-auto object-contain transition duration-300 hover:opacity-80 hover:grayscale-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ))}
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
              {[
                {
                  title: "Digital submission",
                  blurb: "Upload PDFs, bulk import from Excel, or connect your case management system via API. Smart validation catches errors before publication.",
                  Icon: Upload,
                  link: { href: "/api-info", label: "View API docs" },
                },
                {
                  title: "Instant publication",
                  blurb: "Go live in seconds with cryptographic timestamping. Full-text search, resident comments, and real-time engagement analytics.",
                  Icon: Search,
                },
                {
                  title: "Compliance exports",
                  blurb: "One-click FOI packs with audit trails. Generate court-ready evidence bundles with tamper-proof certificates and blockchain verification.",
                  Icon: Archive,
                },
              ].map(({ Icon, title, blurb, link }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200/60 transition-all hover:-translate-y-2 hover:shadow-2xl hover:ring-slate-300"
                >
                  <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-100/20 blur-3xl transition-all group-hover:scale-150" />

                  <div className="relative">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md">
                      <Icon className="h-8 w-8 text-blue-700" aria-hidden="true" />
                    </div>

                    <h3 className="mb-4 text-2xl font-bold text-slate-900">{title}</h3>
                    <p className="mb-6 text-base leading-relaxed text-slate-600">{blurb}</p>

                    {link && (
                      <a
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:gap-3"
                        href={link.href}
                      >
                        {link.label}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 p-10 shadow-xl ring-1 ring-slate-200 md:p-12">
              <div className="absolute -left-8 -top-8 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl" />

              <div className="relative">
                <h3 className="mb-8 text-center text-2xl font-bold text-slate-900 md:text-3xl">
                  Enterprise features included
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: "🔌", feature: "RESTful API & webhooks" },
                    { icon: "🔐", feature: "Single sign-on (SSO)" },
                    { icon: "👥", feature: "Role-based permissions" },
                    { icon: "📋", feature: "Custom retention policies" },
                    { icon: "📊", feature: "Usage analytics & quotas" },
                    { icon: "🔒", feature: "Immutable audit logs" },
                  ].map(({ icon, feature }) => (
                    <div key={feature} className="flex items-start gap-4 rounded-2xl bg-white/60 p-4 backdrop-blur-sm">
                      <span className="text-2xl" aria-hidden="true">{icon}</span>
                      <span className="text-base font-medium text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <a
                    href="/pricing"
                    className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:shadow-blue-500/50 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    View council pricing
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                  <p className="mt-4 text-sm text-slate-600">
                    From <span className="font-semibold">£299/month</span> · Unlimited notices · 14-day free trial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------- FINAL CTA -------- */}
      <section className="py-16 md:py-24">
        <div className={UI.container}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-center shadow-2xl md:p-16">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Ready to modernise your statutory notices?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
                Publish legally compliant notices in seconds — no newspapers, no waiting
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="/publish"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
                >
                  Publish your first notice
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
                No credit card required · Save up to 85% vs traditional methods
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* -------- FOOTER -------- */}
      <Footer />

      {showExplainer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExplainer(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowExplainer(false);
          }}
        >
          <div className="max-w-lg rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">What is a statutory notice?</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowExplainer(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 text-base leading-relaxed text-slate-700">
              Statutory notices are legal announcements that inform residents about licensing, planning, and traffic changes in their area. They give the public a chance to review and respond before decisions are made.
            </p>
            <button
              type="button"
              onClick={() => setShowExplainer(false)}
              className={`${UI.btnPrimary} w-full px-6 py-3 text-base`}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-2 text-xs text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Enhanced animations and utilities */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideOutLeft {
          animation: slideOutLeft 500ms ease-in-out forwards;
        }

        .animate-slideOutRight {
          animation: slideOutRight 500ms ease-in-out forwards;
        }

        .animate-slideInFromRight {
          animation: slideInFromRight 500ms ease-in-out forwards;
        }

        .animate-slideInFromLeft {
          animation: slideInFromLeft 500ms ease-in-out forwards;
        }

        .lucide {
          stroke-width: 2;
        }

        button, [role="button"], a {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        a:focus-visible, button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Card hover effects */
        [class*="hover:-translate-y"] {
          will-change: transform;
        }

        /* Loading shimmer for cards */
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media print {
          header, footer { display: none !important; }
          body, html, .bg-white { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
