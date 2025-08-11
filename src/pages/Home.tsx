import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  FileText, MapPin, CheckCircle2, ClipboardCopy, CopyCheck,
  FileBadge, MessageCircle, Printer, ArrowRight, Menu, X
} from "lucide-react";

// -------- analytics stub (replace with your pipe) --------
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log("[analytics]", event, payload);
}

// -------- fonts (kept) --------
const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  html { font-family: 'Inter', Arial, sans-serif !important; }
`;

// -------- copy / helpers --------
const TAG_INFO: Record<string, string> = {
  "Traffic Order": "A legal notice for road closures, diversions, or changes to traffic rules.",
  "Premises Licence": "A business is applying for permission to serve alcohol or operate late.",
  "Planning": "Change to land use, new buildings, or business type (e.g. shop → restaurant).",
  "Event": "Temporary event notice for entertainment or alcohol.",
  "Restaurant": "Proposal to operate as a food & drink business.",
  "Outdoor seating": "Request for outside tables or expanded trading area.",
  "Late hours": "Permission to operate beyond standard opening times.",
  "Alcohol": "Sale or supply of alcohol being requested.",
  "Noise risk": "Work or venue may impact noise levels locally.",
  "Roadworks": "Scheduled maintenance or construction affecting local roads."
};

const demoNotices = [
  {
    id: 1,
    type: "Premises Licence",
    address: "34 High St, London W2 1AA",
    summary: "New bar applying to stay open until 1am on Fridays.",
    description:
      "Applicant requests late trading for Friday/Saturday. Consultation includes local residents’ feedback on noise and disturbance. See full application for plans and contact details.",
    council: "Westminster City Council",
    councilVerified: true,
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "Open",
    distance: 1.2,
    submitter: "A. Smith",
    submitted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    proofId: "PL-134ABC",
    pdf: "/notices/134abc.pdf",
    pdfSizeKb: 312,
    tags: ["Late hours", "Alcohol", "Noise risk"],
  },
  {
    id: 2,
    type: "Traffic Order",
    address: "Stamford Rd, Reading RG1 8AN",
    summary: "Temporary closure for resurfacing, 15 Aug – 18 Aug.",
    description:
      "Essential resurfacing work by council contractors. Diversion routes will be signposted. Noise is expected during daytime hours only.",
    council: "Reading Borough Council",
    councilVerified: true,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "Open",
    distance: 2.7,
    submitter: "R. Evans",
    submitted: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    proofId: "TR-287YZA",
    pdf: "/notices/287yza.pdf",
    pdfSizeKb: 928,
    tags: ["Roadworks", "Noise risk"],
  },
  {
    id: 3,
    type: "Planning",
    address: "5 The Parade, Leeds LS2 3AB",
    summary: "Change of use from retail to restaurant with outdoor seating.",
    description:
      "Proposed change to Class E restaurant, external seating area. All plans available online. Open for comment from local residents.",
    council: "Leeds City Council",
    councilVerified: false,
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "Closed",
    distance: 5.0,
    submitter: "S. Lee",
    submitted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    proofId: "PL-398KLM",
    pdf: "/notices/398klm.pdf",
    pdfSizeKb: 611,
    tags: ["Restaurant", "Outdoor seating", "Noise risk"],
  },
];

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

const activityStats = [
  { icon: <FileText className="w-4 h-4" aria-hidden="true" />, label: "notices", value: "1,842+" },
  { icon: <MessageCircle className="w-4 h-4" aria-hidden="true" />, label: "comments", value: "12,455+" },
  { icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />, label: "councils", value: "92+" },
];

// -------- utils --------
function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return d > 0 ? d : 0;
}
function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// lightweight local autocomplete
const exampleAreas = ["SW1A 1AA","Westminster","Leeds LS2","Manchester M2","Camden","Ealing","Islington","Birmingham B1","Bristol BS1","Reading RG1","Oxford OX1"];

export default function Home() {
  // header
  const [compactNav, setCompactNav] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>(typeof window !== "undefined" ? window.location.hash || "" : "");

  useEffect(() => {
    const onScroll = () => setCompactNav(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const fn = () => setActiveHash(window.location.hash || "");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  // hero search
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(2);
  const [searching, setSearching] = useState(false);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxRef = useRef<HTMLUListElement>(null);

  // content
  const [notices, setNotices] = useState(demoNotices);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState("");
  const [activeTooltip, setActiveTooltip] = useState("");

  // testimonials
  const [testiIdx, setTestiIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTestiIdx((i) => (i + 1) % testimonials.length), 7000);
    return () => clearInterval(t);
  }, []);

  // local storage (kept)
  const [rememberArea, setRememberArea] = useState(false);
  useEffect(() => {
    const pc = window.localStorage.getItem("pn_postcode");
    const rd = window.localStorage.getItem("pn_radius");
    if (pc && rd) { setPostcode(pc); setRadius(Number(rd)); setRememberArea(true); }
  }, []);
  useEffect(() => {
    if (rememberArea) { window.localStorage.setItem("pn_postcode", postcode); window.localStorage.setItem("pn_radius", String(radius)); }
  }, [postcode, radius, rememberArea]);

  // autocomplete debounce
  useEffect(() => {
    if (!postcode.trim()) { setSuggestions([]); setActiveIndex(-1); return; }
    setSuggestLoading(true);
    const t = setTimeout(() => {
      const q = postcode.toLowerCase();
      const matches = exampleAreas.filter(a => a.toLowerCase().includes(q)).slice(0, 6);
      setSuggestions(matches);
      setSuggestLoading(false);
      setActiveIndex(matches.length ? 0 : -1);
    }, 180);
    return () => clearTimeout(t);
  }, [postcode]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearching(true);
    setGeoError("");
    track("search_submit", { source: "hero", query: postcode, geo_used: false, audience: "public" });
    setTimeout(() => {
      const filtered = demoNotices.filter(n => n.distance <= radius);
      setNotices(filtered);
      setSearching(false);
    }, 600);
  }

  function handleGeo() {
    setGeoError("");
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        track("search_submit", { source: "hero", query: "geo", geo_used: true, audience: "public" });
        track("geo_allow", { lat: pos.coords.latitude, lon: pos.coords.longitude, audience: "public" });
      },
      () => {
        setGeoLoading(false);
        setGeoError("Couldn’t access location. Enter postcode or ward.");
      }
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const pick = suggestions[activeIndex];
      setPostcode(pick); setSuggestions([]); setActiveIndex(-1);
      track("autocomplete_select", { entity_type: "area", entity_id: pick, audience: "public" });
    }
  }

  function copyProofId(pid: string) {
    navigator.clipboard.writeText(pid);
    setCopySuccess(pid);
    setTimeout(() => setCopySuccess(""), 1200);
  }

  const resultsCount = notices.length;

  function TagWithTooltip({ tag, children }: { tag: string; children: ReactNode }) {
    return (
      <span className="relative group cursor-default">
        <span
          className="inline-flex items-center h-7 px-2.5 rounded-full text-xs bg-slate-100 text-slate-700"
          onMouseEnter={() => setActiveTooltip(tag)}
          onMouseLeave={() => setActiveTooltip("")}
        >
          {children}
        </span>
        {activeTooltip === tag && TAG_INFO[tag] && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-blue-200 rounded-2xl shadow-[0_8px_24px_rgba(2,6,23,.06)] p-3 text-xs text-blue-900 max-w-[220px]">
            <span className="font-semibold">{tag}:</span> {TAG_INFO[tag]}
          </div>
        )}
      </span>
    );
  }

  return (
    <div className="bg-[#f7f7f7] text-[#222d35] min-h-screen flex flex-col relative font-sans">
      <style>{fontImport}</style>

      {/* -------- HEADER: sticky, compact-on-scroll, one primary CTA -------- */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 transition-[height] ${compactNav ? "h-14" : "h-[72px]"}`}>
          <div className="h-full flex items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-6">
              <a href="#top" className="flex items-center text-slate-900 font-extrabold tracking-tight" style={{ letterSpacing: "-0.5px" }}>
                <span className={`transition-all ${compactNav ? "text-lg" : "text-xl"}`}>CivicNotices</span>
              </a>
              <nav className="hidden md:flex items-center gap-6">
                {[
                  { href: "#notices", label: "Find notices" },
                  { href: "#how-council", label: "For councils" },
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
              <a
                href="#signin"
                className="h-9 px-3 rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Sign in
              </a>
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Publish a notice
              </a>
            </div>

            {/* Mobile: Publish stays visible + hamburger for sheet */}
            <div className="md:hidden flex items-center gap-2">
              <a
                href="/publish"
                onClick={() => track("publish_started", { audience: "public" })}
                className="h-10 px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  { href: "#how-council", label: "For councils" },
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
                <a
                  href="#signin"
                  className="h-9 px-3 rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Sign in
                </a>
                <a
                  href="/publish"
                  onClick={() => { setMobileOpen(false); track("publish_started", { audience: "public" }); }}
                  className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Publish a notice
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -------- HERO WRAPPER (gradient kept) -------- */}
      <div
        className="relative w-full"
        style={{
          background: "linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 0 100%)",
        }}
      >
        {/* HERO — tool-first, solid panel under input */}
        <section className="w-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "none" }}>
          {/* overlays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1, background: "radial-gradient(ellipse at 65% 40%, rgba(255,255,255,0.24) 0%, transparent 80%)", mixBlendMode: "lighten" }}
          />
          <div
            className="absolute inset-0"
            style={{ zIndex: 1, pointerEvents: "none", background: "linear-gradient(120deg, rgba(53,136,255,0.70) 0%, rgba(120, 126, 255, 0.60) 50%, rgba(204,148,255,0.6) 100%)", mixBlendMode: "lighten" }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 w-full">
            {/* H1 (56) — two lines max, tighter tracking */}
            <h1 className="font-extrabold text-white drop-shadow leading-[1.12] tracking-tight mb-6" style={{ fontSize: "56px", letterSpacing: "-0.02em" }}>
              Search, publish, and verify statutory notices — instantly, with an audit trail
            </h1>

            {/* Solid panel for the tool */}
            <div className="relative rounded-2xl bg-white/95 ring-1 ring-slate-200 shadow-[0_8px_24px_rgba(2,6,23,.06)] p-3 md:p-4">
              <form onSubmit={handleSearch} role="search" aria-label="Search notices by postcode or ward" className="flex items-center gap-2" noValidate>
                <label htmlFor="postcode" className="sr-only">Search by postcode or ward</label>

                <div className="relative flex-1">
                  <input
                    id="postcode"
                    name="postcode"
                    type="search"
                    inputMode="search"
                    autoComplete="off"
                    placeholder="Search by postcode or ward"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="w-full h-14 rounded-xl px-4 bg-white text-gray-900 placeholder:text-slate-400 shadow-sm ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    aria-describedby="search-examples"
                    aria-autocomplete="list"
                    aria-expanded={suggestions.length > 0}
                    aria-controls="area-suggestions"
                  />
                  {/* suggestions */}
                  {suggestions.length > 0 && (
                    <ul
                      id="area-suggestions"
                      ref={listboxRef}
                      role="listbox"
                      className="absolute z-20 mt-2 w-full rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_8px_24px_rgba(2,6,23,.06)] overflow-hidden"
                    >
                      {suggestions.map((s, idx) => (
                        <li
                          key={s}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setPostcode(s); setSuggestions([]); setActiveIndex(-1);
                            track("autocomplete_select", { entity_type: "area", entity_id: s, audience: "public" });
                          }}
                          className={`px-4 py-2 cursor-pointer text-sm ${idx === activeIndex ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50"}`}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {suggestLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner /></div>}
                </div>

                <button
                  type="button"
                  onClick={handleGeo}
                  disabled={geoLoading}
                  className="h-14 px-4 rounded-xl bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {geoLoading ? "Locating…" : "Use my location"}
                </button>

                <button
                  type="submit"
                  disabled={searching}
                  className="h-14 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Search now"
                >
                  {searching ? <Spinner /> : "Search now"}
                </button>
              </form>

              <p id="search-examples" className="mt-2 text-xs text-slate-600 px-1">Examples: SW1A 1AA, Westminster, Leeds LS2</p>
              {geoError && <p className="mt-1 text-xs text-rose-600 px-1">{geoError}</p>}
            </div>

            {/* chips under input */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {activityStats.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full text-xs bg-white/90 text-slate-800 ring-1 ring-slate-200">
                  {s.icon}
                  <span className="tabular-nums font-semibold">{s.value}</span>
                  <span className="opacity-80">{s.label}</span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-white/90 text-sm font-medium">
              <span>No sign-up needed</span>
              <span className="opacity-50">•</span>
              <span>Trusted by 40+ councils</span>
            </div>
          </div>
        </section>
      </div>

      {/* -------- TESTIMONIALS & LOGOS -------- */}
      <section className="w-full bg-white py-10 flex flex-col items-center border-b border-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1">
            <span className="text-blue-700 italic font-medium text-xl md:text-2xl">{testimonials[testiIdx].text}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-blue-800 font-semibold">{testimonials[testiIdx].name}</span>
              <span className="text-gray-400 text-xs">| {testimonials[testiIdx].council}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 [&_img]:h-7 [&_img]:w-auto grayscale hover:grayscale-0 transition">
            {councilLogos.map((l) => (
              <img key={l.alt} src={l.src} alt={l.alt} width={l.width} height={l.height} loading="lazy" className="opacity-70 hover:opacity-100" />
            ))}
          </div>
        </div>
      </section>

      {/* -------- RESULTS / NOTICE CARDS -------- */}
      <section id="notices" className="w-full bg-[#f9fafa] py-12 px-4 sm:px-6">
        <h2 className="text-[32px] font-extrabold text-blue-900 text-center mb-6 leading-tight">
          Instantly <span className="text-blue-600">search, publish, and verify</span> legal notices
        </h2>

        {/* live region for count */}
        <p className="sr-only" aria-live="polite">{resultsCount} results</p>

        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {notices.map((n) => {
            const dl = daysLeft(n.deadline);
            const chips = n.tags.slice(0, 2);
            const overflow = Math.max(0, n.tags.length - chips.length);
            return (
              <article key={n.id} className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(2,6,23,.06)] ring-1 ring-blue-50 flex flex-col min-h-[280px]" aria-label={`Notice: ${n.type}, ${n.address}`}>
                {/* metadata */}
                <div className="flex items-center gap-3 text-[13px] text-slate-700 mb-2">
                  <span className="font-semibold">{n.type}</span>
                  <span>•</span>
                  <span>{n.status === "Open" && dl > 0 ? `${dl} day${dl !== 1 ? "s" : ""} left` : "Closed"}</span>
                  <span>•</span>
                  <span className="capitalize">{n.status.toLowerCase()}</span>
                </div>

                <h3 className="text-blue-900 font-extrabold text-[20px] mb-1">{n.address}</h3>
                <p className="text-gray-700 mb-3 text-[16px]">{n.summary}</p>

                {/* chips (max 2 + overflow) */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {chips.map((tag) => (
                    <TagWithTooltip key={tag} tag={tag}>
                      <span className="inline-flex items-center h-7 px-2.5 rounded-full text-xs bg-slate-100 text-slate-700">{tag}</span>
                    </TagWithTooltip>
                  ))}
                  {overflow > 0 && <span className="inline-flex items-center h-7 px-2.5 rounded-full text-xs bg-slate-100 text-slate-700">+{overflow} tags</span>}
                </div>

                {/* actions */}
                <div className="mt-auto pt-2 flex items-center justify-between border-t border-blue-50">
                  <button
                    className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
                    onClick={() => { const open = expandedCard === n.id ? null : n.id; setExpandedCard(open); track("notice_open", { id: n.id, source: "card", audience: "public" }); }}
                    aria-expanded={expandedCard === n.id}
                  >
                    Open notice
                  </button>

                  <a
                    href={n.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("pdf_open", { id: n.id, size_kb: n.pdfSizeKb, audience: "public" })}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
                    aria-label={`Open PDF (${n.pdfSizeKb} KB) in new tab`}
                  >
                    <FileBadge className="w-4 h-4" aria-hidden="true" /> {n.pdfSizeKb} KB
                  </a>
                </div>

                {expandedCard === n.id && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm shadow-inner">
                    <div className="mb-2 text-blue-900 font-medium">{n.description}</div>
                    <div className="mb-2 text-blue-700 text-xs">
                      <span className="font-semibold">Applicant:</span> {n.submitter} &nbsp;|&nbsp;
                      <span className="font-semibold">Submitted:</span> {n.submitted}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <button
                        onClick={() => copyProofId(n.proofId)}
                        className="bg-white border border-blue-200 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        aria-label="Copy proof ID"
                      >
                        {copySuccess === n.proofId ? <CopyCheck /> : <ClipboardCopy />} Proof ID
                      </button>
                      <button
                        className="text-xs text-blue-600 underline hover:text-blue-700 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
                        onClick={() => window.print()}
                      >
                        <Printer className="mr-1 w-4 h-4" aria-hidden="true" /> Print/download
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* -------- PUBLISH (three steps) -------- */}
      <section id="publish" className="relative py-20 bg-gray-50 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-200 rounded-full blur-2xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-200 rounded-full blur-2xl opacity-40 pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="text-center">
            <h2 className="text-[32px] font-extrabold text-blue-900">Publish your notice in three steps</h2>
            <p className="mt-2 text-[16px] text-blue-700">Instant, compliant, audit-ready</p>
          </header>

          {/* connector line through icon centres */}
          <div className="relative mt-8 hidden md:block">
            <div className="mx-auto max-w-6xl h-px bg-slate-200/60" />
          </div>

          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: 1, title: "Fill out the form", desc: "About 60 seconds", Icon: FileText },
              { n: 2, title: "Choose the area", desc: "Postcode, ward, or UK-wide", Icon: MapPin },
              { n: 3, title: "Download the certificate", desc: "Instant audit-ready proof", Icon: CheckCircle2 },
            ].map(({ n, title, desc, Icon }, i) => (
              <li key={i} className="relative pt-10">
                <span aria-hidden="true" className="absolute top-[6px] left-0 right-0 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <div className="relative min-h-[172px] rounded-2xl bg-white p-6 ring-1 ring-blue-100 shadow-[0_8px_24px_rgba(2,6,23,.06)]">
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

          <div className="mt-10 flex justify-center">
            <a
              href="/publish"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              onClick={() => track("publish_started", { audience: "public" })}
            >
              Publish a notice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* -------- COUNCILS SECTION -------- */}
      <section id="how-council" className="bg-[#f7fafc] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[32px] font-extrabold tracking-tight text-blue-900">How it works for councils</h2>

          {/* trust logos */}
          <div className="mt-6 flex items-center gap-6">
            <span className="text-sm font-semibold text-blue-900 whitespace-nowrap">Trusted by <span className="font-extrabold">40+ UK councils</span></span>
            <div className="hidden md:flex items-center gap-8">
              {councilLogos.map((l) => (
                <img key={l.alt} src={l.src} alt={l.alt} width={l.width} height={l.height} loading="lazy" className="h-8 w-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition" />
              ))}
            </div>
            <div className="md:hidden relative flex-1 overflow-hidden">
              <div className="flex items-center gap-10 animate-[marquee_18s_linear_infinite] will-change-transform">
                {councilLogos.concat(councilLogos).map((l, i) => (
                  <img key={i} src={l.src} alt="" aria-hidden="true" className="h-7 w-auto opacity-70 grayscale" />
                ))}
              </div>
            </div>
          </div>

          {/* connector */}
          <div className="relative mt-6">
            <div className="absolute left-0 right-0 top-6 hidden md:block">
              <div className="h-px bg-slate-200/60" />
            </div>

            <ol className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  n: 1,
                  title: "Submit notices digitally",
                  blurb: "Upload, bulk import, or API. All statutory types supported.",
                  Icon: () => (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v14l-5-3-5 3V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                  ),
                },
                {
                  n: 2,
                  title: "Public display & instant proofs",
                  blurb: "Timestamped, searchable, full audit trail. Residents can comment.",
                  Icon: () => (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                  ),
                },
                {
                  n: 3,
                  title: "Export for legal compliance",
                  blurb: "CSV/JSON/PDF logs, FOI-ready packs, court-ready proofs.",
                  Icon: () => (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path d="M12 2v14m0 0-4-4m4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" /><rect x="4" y="16" width="16" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                  ),
                },
              ].map(({ n, title, blurb, Icon }, i) => (
                <li key={i} className="relative pt-10">
                  <span aria-hidden="true" className="absolute top-0 left-0 right-0 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Icon />
                  </span>

                  <div className="relative min-h-[200px] rounded-2xl bg-white p-6 ring-1 ring-blue-100 shadow-[0_8px_24px_rgba(2,6,23,.06)]">
                    <span className="sr-only">{`Step ${n} of 3`}</span>
                    <span className="absolute -top-2 left-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold ring-1 ring-blue-100">
                      {n}
                    </span>

                    <h3 className="text-[20px] font-semibold text-blue-900">{title}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-slate-700">{blurb}</p>

                    {n === 1 && (
                      <a href="/api-info" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Learn about integrations
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* single disclosure */}
          <details className="mt-6 group">
            <summary className="list-none inline-flex h-11 items-center gap-2 px-1 text-blue-800 font-semibold hover:text-blue-900 cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
              Advanced features
              <svg className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            </summary>
            <div className="mt-3 rounded-2xl bg-white p-5 ring-1 ring-blue-100">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                {["API & webhooks","Single sign-on (SSO)","Role-based access","Retention & redaction","Rate limits & quotas","Immutable hash logs"].map((t) => (
                  <li key={t} className="inline-flex items-start gap-2 text-slate-700">
                    <svg className="mt-[3px] h-4 w-4 text-blue-600" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </section>

      {/* -------- FOOTER -------- */}
      <footer className="max-w-6xl mx-auto py-7 px-4 sm:px-6 flex flex-wrap gap-6 text-sm text-gray-500 justify-center border-t border-blue-100 mt-10 mb-6">
        <a href="/about" className="hover:underline hover:text-blue-700 transition">About Civic Notices</a>
        <a href="/docs" className="hover:underline hover:text-blue-700 transition">Docs / Help</a>
        <a href="/privacy" className="hover:underline hover:text-blue-700 transition">Privacy</a>
        <a href="/terms" className="hover:underline hover:text-blue-700 transition">Terms</a>
        <a href="/contact" className="hover:underline hover:text-blue-700 transition">Contact</a>
        <a href="/case-studies" className="hover:underline hover:text-blue-700 transition">Case studies (40+ councils)</a>
      </footer>

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
