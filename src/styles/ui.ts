// New shared UI tokens (Stripe-like cleanliness)
// Use CSS hero band class for reliability across browsers
export const canvas   = "bg-[var(--canvas)]";
export const pageWrap = `hero-band min-h-screen text-[#222d35] ${canvas}`;
export const pageWrapLg = `hero-band-lg min-h-screen text-[#222d35] bg-[var(--canvas)]`;

export const container = "max-w-[1200px] mx-auto px-6 md:px-8";
export const sectionY = "py-14 md:py-20 lg:py-24";
export const stickyUnderHeader = "sticky top-[var(--headerH)]";

// Hero typography for dark-on-light gradient: white with light shadow for contrast
export const heroH1 =
  "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.28)] tracking-tight font-semibold text-[42px] leading-[50px] md:text-[56px] md:leading-[64px] lg:leading-[1.08] md:tracking-[-0.01em] lg:tracking-[-0.015em] max-w-[900px]";
export const heroSub =
  "text-white/85 drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)] text-[16px] md:text-[18px] lg:text-[20px] leading-[28px] max-w-[60ch]";

export const card = "bg-white border border-[rgba(25,38,80,0.06)] rounded-2xl shadow-[0_8px_24px_rgba(25,38,80,0.06)]";
export const cardHover =
  "transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform will-change-[box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(25,38,80,.10)] hover:ring-1 hover:ring-slate-200/60";
export const cardHeader = "text-sm font-semibold text-blue-900";
export const tinySubheader = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

// Wizard surfaces
export const wizardCard =
  "relative overflow-hidden rounded-[28px] border border-[rgba(37,99,235,0.18)] bg-white/95 shadow-[0_32px_96px_rgba(15,23,42,0.14)] backdrop-blur";
export const wizardSection =
  "rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_14px_40px_rgba(15,23,42,0.08)]";
export const wizardPill =
  "inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-900";

export const h1 = "text-[36px] leading-[44px] font-semibold tracking-tight text-[#192650]";
export const h2 = "text-[28px] leading-[36px] font-semibold tracking-tight text-[#192650]";
export const h3 = "text-[20px] leading-[28px] font-medium text-[#192650]";

export const body = "text-[16px] leading-[26px]";
export const small = "text-[14px] leading-[22px]";

export const btnPrimary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-200 hover:bg-[#1E4FD8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const btnSecondary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-[#192650] font-medium border border-[rgba(25,38,80,0.10)] hover:border-[rgba(25,38,80,0.20)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";

// Stepper (Publish)
export const stepperTrack = "h-1 rounded-full bg-blue-600/20";
export const stepperFill = "h-1 rounded-full bg-[#2563EB]";
export const stepDot = "w-8 h-8 rounded-full grid place-items-center border border-slate-200 bg-white";
export const stepDotActive =
  "w-9 h-9 ring-2 ring-blue-600 ring-offset-2 ring-offset-white text-blue-700 border-transparent";
export const stepDotBase = stepDot;

// Keep legacy exports for compatibility in existing components
export const gradientBg = "min-h-screen bg-[linear-gradient(112deg,_#192650_0%,_#3866af_50%,_#ffffff_100%)]";
export const railCard = card + " p-4";
export const section = card + " p-5 md:p-6 space-y-4";
export const label = "text-sm font-medium text-slate-800";
export const input = "h-11 rounded-lg border border-[rgba(25,38,80,0.12)] bg-white px-3 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const pillBtn = btnPrimary;
export const ghostPill = btnSecondary;
export const prose = "prose max-w-none text-[14px] leading-6 prose-headings:mt-0";

// Back-compat shims for previous wrappers
export const siteCanvas = canvas + " text-[#222d35] min-h-screen";
export const heroGradientLight = 'hero-band';

// ============================================================================
// SEMANTIC COLORS - Use these for consistent color usage across the app
// ============================================================================
// Success: emerald-600 (#059669)
// Error: rose-600 (#E11D48)
// Warning: amber-600 (#D97706)
// Info: blue-600 (#2563EB)
// ============================================================================

// Success states (emerald)
export const successBg = "bg-emerald-50";
export const successBgDark = "bg-emerald-600";
export const successText = "text-emerald-600";
export const successTextDark = "text-emerald-700";
export const successBorder = "border-emerald-200";
export const successBorderDark = "border-emerald-600";

// Error states (rose)
export const errorBg = "bg-rose-50";
export const errorBgDark = "bg-rose-600";
export const errorText = "text-rose-600";
export const errorTextDark = "text-rose-700";
export const errorBorder = "border-rose-200";
export const errorBorderDark = "border-rose-600";

// Warning states (amber)
export const warningBg = "bg-amber-50";
export const warningBgDark = "bg-amber-600";
export const warningText = "text-amber-600";
export const warningTextDark = "text-amber-700";
export const warningBorder = "border-amber-200";
export const warningBorderDark = "border-amber-600";

// Info states (blue - same as primary)
export const infoBg = "bg-blue-50";
export const infoBgDark = "bg-blue-600";
export const infoText = "text-blue-600";
export const infoTextDark = "text-blue-700";
export const infoBorder = "border-blue-200";
export const infoBorderDark = "border-blue-600";

// Alert/Banner components
export const alertSuccess = "rounded-lg p-4 bg-emerald-50 border border-emerald-200 text-emerald-700";
export const alertError = "rounded-lg p-4 bg-rose-50 border border-rose-200 text-rose-700";
export const alertWarning = "rounded-lg p-4 bg-amber-50 border border-amber-200 text-amber-700";
export const alertInfo = "rounded-lg p-4 bg-blue-50 border border-blue-200 text-blue-700";

// Badge components
export const badgeSuccess = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800";
export const badgeError = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800";
export const badgeWarning = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800";
export const badgeInfo = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800";
export const badgeNeutral = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800";

// Button variants for semantic colors
export const btnDanger =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-rose-600 text-white font-semibold shadow-[0_6px_16px_rgba(225,29,72,0.35)] transition-all duration-200 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 focus:ring-offset-white";
export const btnSuccess =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-white";
export const btnWarning =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold shadow-[0_6px_16px_rgba(217,119,6,0.35)] transition-all duration-200 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-white";
