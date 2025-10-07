import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as UI from '@/styles/ui';
import {
  FileText, MapPin, CheckCircle2,
  ArrowRight, Menu, X,
  Upload, Search, Archive
} from "lucide-react";
import FilterBar from "../components/FilterBar";
import type { Filters } from "../lib/filter";
import AddressSearchBar, { type AddressSearchSubmitPayload } from "@/components/search/AddressSearchBar";
import SearchResults from "@/components/home/SearchResults";
import { resolveToPostcodeOrNull } from '@/lib/address';
import { getCouncilForPostcode } from '@/lib/councils';
import useNoticeSearch from '@/hooks/useNoticeSearch';
import { toast, useToastController } from '@/lib/ui/toast';

// -------- analytics stub (replace with your pipe) --------
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log("[analytics]", event, payload);
}

// -------- fonts (kept) --------
const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  html { font-family: 'Inter', Arial, sans-serif !important; }
`;

const testimonials = [
  { text: "“Instant publication, easy exports, and our legal team love the audit trail.”", name: "David J, Legal Officer", council: "Leeds City Council" },
  { text: "“Residents are submitting comments online and we have the proof for every step.”", name: "Amrita P, Licensing Team", council: "City of Westminster" },
  { text: "“No more last-minute print bookings — everything is digital, accessible, and timestamped.”", name: "Gemma S, Planning Officer", council: "Manchester City Council" },
];

const councilLogos = [
  { src: "/logos/leeds.png", alt: "Leeds City Council", width: 120, height: 28 },
  { src: "/logos/westminster.png", alt: "City of Westminster", width: 160, height: 28 },
  { src: "/logos/manchester.png", alt: "Manchester City Council", width: 180, height: 28 },
];

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

  const [testiIdx, setTestiIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTestiIdx((i) => (i + 1) % testimonials.length), 7000);
    return () => clearInterval(t);
  }, []);

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
      if (councilId) params.set('council', councilId);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.start) params.set('start', filters.start);
      if (filters.end) params.set('end', filters.end);

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
      <style>{fontImport}</style>

      {/* -------- HEADER: sticky, compact-on-scroll, one primary CTA -------- */}
      <header
        className={`sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 ${compactNav ? "bg-white/90 shadow-[0_1px_0_0_rgba(2,6,23,0.06)]" : "bg-white/75 border-b border-transparent"}`}
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
                {[
                  { href: "#notices", label: "Find notices" },
                  { href: "#for-councils", label: "For councils" },
                  { href: "#pricing", label: "Pricing" },
                  { href: "#docs", label: "Docs" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    data-active={activeHash === link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 data-[active=true]:text-slate-900 data-[active=true]:underline underline-offset-8 decoration-2 decoration-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right: ghost + primary */}
            <div className="hidden md:flex items-center gap-3">
              <a href="#signin" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>Sign in</a>
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className={`${UI.btnPrimary} h-11 py-0 text-sm`}
              >
                Publish a notice
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

        {/* Mobile sheet (no counters here) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50">
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
                {[
                  { href: "#notices", label: "Find notices" },
                  { href: "#for-councils", label: "For councils" },
                  { href: "#pricing", label: "Pricing" },
                  { href: "#docs", label: "Docs" },
                ].map((link) => (
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
                <a href="#signin" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>Sign in</a>
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

      {/* -------- HERO WRAPPER -------- */}
      <div className="relative w-full">
        {/* HERO — tool-first, solid panel under input */}
        <section className="w-full flex flex-col items-center justify-center relative overflow-hidden">

          <div className={`relative z-10 ${UI.container} w-full`}>
            <div className="pt-16 md:pt-20 pb-12">
              <h1 className={UI.heroH1}>
                Search, publish, and verify statutory notices — instantly, with an audit trail
              </h1>
              <p className={`${UI.heroSub} mt-4`}>
                Give residents a voice. Keep licensing transparent and accountable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplainer(true)}
              className="mt-2 text-sm text-white/85 hover:text-white underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-transparent rounded"
            >
              What is a statutory notice?
            </button>

            {/* Solid panel for the tool */}
            <div className={`relative overflow-visible ${UI.card} ${UI.cardHover} p-3 md:p-4`}>
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
            </div>
            {addressInlineError && (
              <p role="alert" className="mt-2 text-sm text-rose-100">{addressInlineError}</p>
            )}

            <div className="mt-2.5">
              <FilterBar filters={filters} setFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))} />
            </div>

            {/* supporting stats under input */}
            <p className="mt-5 text-sm text-white/70">
              <span className="tabular-nums">1,842+</span> notices ·
              <span className="tabular-nums"> 12,455+</span> comments ·
              <span className="tabular-nums"> 92+</span> councils
            </p>

            <div className="mt-4 flex items-center gap-4 text-white/90 text-sm font-medium">
              <span>No sign-up needed</span>
              <span className="opacity-50">•</span>
              <span>Trusted by 40+ councils</span>
            </div>

            <div className="mt-6 flex justify-center">
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className={`${UI.btnSecondary} h-9 px-4 py-0 text-xs focus:ring-blue-600 focus:ring-offset-transparent`}
              >
                Publish a notice
              </a>
            </div>
          </div>
          {/* Hero band now fades via CSS background layer */}
        </section>
      </div>

      <div className="mx-auto my-8 md:my-10 h-px w-full max-w-[1200px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      {/* -------- TESTIMONIALS & LOGOS -------- */}
      <section className="w-full flex flex-col items-center">
  <div className={`${UI.container} ${UI.sectionY} flex flex-col md:flex-row gap-8 items-center justify-between`}>
    <div className="flex-1">
      <span className="relative block max-w-[58ch] text-blue-700 italic font-medium text-xl md:text-2xl">
        <span aria-hidden className="absolute -left-5 -top-2 text-blue-200/40 text-3xl leading-none select-none">“</span>
        {testimonials[testiIdx].text}
      </span>
      <div className="flex items-center gap-2 mt-2 text-xs text-blue-800/90">
        — {testimonials[testiIdx].name} <span className="text-gray-400">| {testimonials[testiIdx].council}</span>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6 [&_img]:h-7 [&_img]:w-auto grayscale hover:grayscale-0 transition">
      {councilLogos.map((l) => (
        <img
          key={l.alt}
          src={l.src}
          alt={l.alt}
          width={l.width}
          height={l.height}
          loading="lazy"
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      ))}
    </div>
  </div>
</section>


      {/* -------- LATEST NOTICES -------- */}
      <section id="notices" className="w-full pt-12 md:pt-14 pb-16 md:pb-20 scroll-mt-[84px]">
        <div className={UI.container}>
          <h2 className={`${UI.h2} text-center mb-4 max-w-[60ch] mx-auto`}>
            Latest public notices across the UK
          </h2>
          <p className="text-center text-sm text-slate-600 mb-6">
            The five most recent publications, refreshed automatically.
          </p>

          {latestError && (
            <div className="mx-auto max-w-xl rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p>Couldn’t load the latest notices. {latestError}</p>
              <button
                type="button"
                onClick={refetchLatest}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:border-rose-400"
              >
                Retry
              </button>
            </div>
          )}

          {!latestError && (
            <div className="mx-auto mt-6 md:mt-8 w-full max-w-4xl">
              <SearchResults
                results={latestNotices}
                query="latest notices"
                loading={latestLoading}
                loadingMessage="Loading the most recent notices…"
                emptyMessage="No notices published yet. Check back soon."
              />
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/notices"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white rounded"
            >
              Browse all notices
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* -------- PUBLISH (three steps) -------- */}
      <section id="publish" className={`relative pt-12 md:pt-16 pb-16 md:pb-24 scroll-mt-[84px]`}>
  {/* optional tiny accent if you want one:
  <div className="pointer-events-none absolute -top-16 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-25 bg-blue-200/60" /> */}
  <div className={UI.container}>
          <header className="text-center">
            <h2 className="text-[32px] font-extrabold text-blue-900">Publish in three steps</h2>
            <p className="mt-2 text-[16px] text-blue-700">Thorough and compliant</p>
          </header>

          

          <ol className="mt-5 md:mt-7 grid gap-6 md:grid-cols-3">
            {[
              { n: 1, title: "Fill the form", desc: "Guided and validated", Icon: FileText },
              { n: 2, title: "Choose area", desc: "Postcode, ward or UK-wide", Icon: MapPin },
              { n: 3, title: "Download audit certificate", desc: "Instant proof", Icon: CheckCircle2 },
            ].map(({ n, title, desc, Icon }, i) => (
              <li key={i} className="relative pt-10">
                <span aria-hidden="true" className="absolute top-[5px] left-0 right-0 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100/60">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <div className="relative min-h-[172px] rounded-2xl bg-white p-6 ring-1 ring-blue-100/60 shadow-[0_8px_24px_rgba(2,6,23,.06)]">
                  <span className="sr-only">{`Step ${n} of 3`}</span>
                  <span className="absolute -top-2 left-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold ring-1 ring-blue-100">
                    {n}
                  </span>

                  <h3 className="text-[20px] font-semibold text-blue-900">{title}</h3>
                  <p className="mt-2 text-[16px] text-slate-700">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-sm text-slate-700 text-center">Checks for required fields, timings, and statutory wording.</p>

          <div className="mt-16 md:mt-20 flex justify-center">
            <a
              href="/publish"
              className={`${UI.btnPrimary} h-11 py-0 text-sm inline-flex items-center gap-2`}
              onClick={() => track("publish_started", { audience: "public" })}
            >
              Publish a notice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* -------- COUNCILS SECTION -------- */}
      <section id="for-councils" className={`${UI.sectionY} scroll-mt-[84px]`}>
        <div className={`${UI.container} text-center`}>
          <h2 className={`${UI.h2}`}>How it works for councils</h2>
          <p className={`${UI.small} mt-4 text-blue-800/80`}>Trusted by 40+ UK councils</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80">
            {councilLogos.map((l) => (
              <img
                key={l.alt}
                src={l.src}
                alt={l.alt}
                width={l.width}
                height={l.height}
                loading="lazy"
                className="h-6 md:h-7 w-auto object-contain grayscale hover:grayscale-0 transition"
              />
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 place-items-stretch">
            {[
              {
                title: "Submit notices digitally",
                blurb: "Upload, bulk import, or API. All statutory types supported.",
                Icon: Upload,
                link: { href: "/api-info", label: "Learn about integrations" },
              },
              {
                title: "Public display & instant proofs",
                blurb: "Timestamped, searchable, full audit trail. Residents can comment.",
                Icon: Search,
              },
              {
                title: "Export for legal compliance",
                blurb: "CSV/JSON/PDF logs, FOI-ready packs, court-ready proofs.",
                Icon: Archive,
              },
            ].map(({ Icon, title, blurb, link }) => (
              <div key={title} className={`${UI.card} ${UI.cardHover} p-6 text-left`}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900">{title}</h3>
                <p className="mt-2 text-blue-900/80">{blurb}</p>
                {link && (
                  <a
                    className="mt-4 inline-flex items-center text-blue-700 hover:text-blue-800 font-medium underline underline-offset-2"
                    href={link.href}
                  >
                    {link.label}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <details className="mt-10 mx-auto max-w-3xl text-left">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-800 font-medium">
              Advanced features
            </summary>
            <div className="mt-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-5 text-blue-900/85">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                {[
                  "API & webhooks",
                  "Single sign-on (SSO)",
                  "Role-based access",
                  "Retention & redaction",
                  "Rate limits & quotas",
                  "Immutable hash logs",
                ].map((t) => (
                  <li key={t} className="inline-flex items-start gap-2 text-slate-700">
                    <svg className="mt-[3px] h-4 w-4 text-blue-600" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </section>

      {/* -------- FOOTER -------- */}
      <footer className={`${UI.container} py-7 flex flex-wrap gap-6 text-sm text-gray-500 justify-center border-t border-blue-100 mt-10 mb-6`}>
        <a href="/about" className="hover:underline hover:text-blue-700 transition">About Civic Notices</a>
        <a href="/docs" className="hover:underline hover:text-blue-700 transition">Docs / Help</a>
        <a href="/privacy" className="hover:underline hover:text-blue-700 transition">Privacy</a>
        <a href="/terms" className="hover:underline hover:text-blue-700 transition">Terms</a>
        <a href="/contact" className="hover:underline hover:text-blue-700 transition">Contact</a>
        <a href="/case-studies" className="hover:underline hover:text-blue-700 transition">Case studies (40+ councils)</a>
      </footer>

      {showExplainer && (
        <dialog open className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-md">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">What is a statutory notice?</h2>
            <p className="text-sm text-slate-700 mb-4">
              Statutory notices let residents know about licensing, planning and traffic changes in their area and give them a chance to respond.
            </p>
            <button
              type="button"
              onClick={() => setShowExplainer(false)}
              className={`${UI.btnPrimary} h-10 py-0 text-sm mt-2`}
            >
              Close
            </button>
          </div>
        </dialog>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 rounded-md bg-slate-900 px-4 py-2 text-xs text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* small utilities */}
      <style>{`
        .lucide { stroke-width: 2.1; }
        button,[role="button"],a { transition: box-shadow .14s, background .13s, color .12s; }
        a:focus-visible,button:focus-visible { outline: none; box-shadow: 0 0 0 2px #2563eb55; }
        @media print { header, .fade-in, footer { display: none !important; } body, html, .bg-white { background: #fff !important; } }
      `}</style>
    </div>
  );
}
